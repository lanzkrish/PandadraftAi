const express = require('express');
const router = express.Router();
const { requireAuth } = require('../utils/auth');
const User = require('../models/User');
const PostHistory = require('../models/PostHistory');
const logger = require('../utils/logger');

// GET /api/dashboard/overview
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const posts = await PostHistory.find({ user_id: userId }).lean();
    
    const scheduled = posts.filter(p => p.status === 'drafted' || p.status === 'approved').length;
    const published = posts.filter(p => p.status === 'posted').length;
    const activePillars = user.content_categories ? user.content_categories.split(',').length : 0;
    
    // Sort upcoming (drafted/approved)
    const upcoming = posts
      .filter(p => p.status === 'drafted' || p.status === 'approved')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      name: user.name || user.email.split('@')[0],
      metrics: {
        scheduled,
        published,
        activePillars,
        aiReachScore: 85 // Mocked for now
      },
      upcoming
    });
  } catch (error) {
    logger.error('Dashboard Overview Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/settings
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password_hash -reset_password_token -reset_password_expires').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    logger.error('Dashboard Settings Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/dashboard/settings
router.put('/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, profession, domain, content_categories, content_tone, keywords } = req.body;
    
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (profession !== undefined) update.profession = profession;
    if (domain !== undefined) update.domain = domain;
    if (content_categories !== undefined) update.content_categories = content_categories;
    if (content_tone !== undefined) update.content_tone = content_tone;
    if (keywords !== undefined) update.keywords = keywords;

    await User.updateOne({ _id: userId }, { $set: update });
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('Dashboard Settings Update Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import multer and UTApi for profile image upload
const multer = require('multer');
const { UTApi } = require('uploadthing/server');
const upload = multer({ storage: multer.memoryStorage() });
const utapi = new UTApi({ apiKey: process.env.UPLOADTHING_SECRET });

// POST /api/dashboard/upload-avatar
router.post('/upload-avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if changed within last 15 days
    if (user.avatar_last_changed) {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      if (user.avatar_last_changed > fifteenDaysAgo) {
        const timeDiff = Math.abs(new Date().getTime() - user.avatar_last_changed.getTime());
        const daysLeft = 15 - Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        return res.status(400).json({ 
          error: `You can only change your profile image once every 15 days. Please try again in ${daysLeft > 0 ? daysLeft : 1} days.` 
        });
      }
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert Buffer to Web File API object for UTApi compatibility
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    const file = new File([blob], req.file.originalname, { type: req.file.mimetype });
    
    const uploadResult = await utapi.uploadFiles(file);
    
    if (!uploadResult || uploadResult.error) {
      return res.status(500).json({ error: uploadResult?.error?.message || 'Upload failed' });
    }

    const avatarUrl = uploadResult.data.url;
    user.avatar_url = avatarUrl;
    user.avatar_last_changed = new Date();
    await user.save();

    res.json({ success: true, avatarUrl, avatarLastChanged: user.avatar_last_changed });
  } catch (error) {
    logger.error('Upload Avatar Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
