const express = require('express');
const router = express.Router();
const { requireAuth } = require('../utils/auth');
const User = require('../models/User');
const PostHistory = require('../models/PostHistory');
const logger = require('../utils/logger');
const ai = require('../services/ai');
const linkedin = require('../services/linkedin');

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

// POST /api/dashboard/generate/post
router.post('/generate/post', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, goal, audiences, tone } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.credits <= 0) {
      return res.status(402).json({ error: 'Insufficient credits. Please upgrade your plan.' });
    }

    // Build comprehensive topic context
    let fullTopic = topic;
    if (goal) fullTopic += ` | Goal: ${goal}`;
    if (audiences && audiences.length > 0) fullTopic += ` | Target Audience: ${audiences.join(', ')}`;

    const contentTone = tone || user.content_tone || 'professional';
    const isOrgPost = Boolean(user.linkedin_org_id);
    const userContext = { name: user.name, profession: user.profession, domain: user.domain };
    const audiencesStr = audiences && audiences.length > 0 ? audiences.join(', ') : '';

    // Generate Full Post directly (1-step)
    const postContent = await ai.generatePost(topic, contentTone, goal, audiencesStr, isOrgPost, userContext);
    
    // Extract a basic hook from the first line for UI display purposes
    const lines = postContent.split('\n').filter(l => l.trim() !== '');
    const hook = lines[0] || 'Generated Post';

    // 3. Deduct credit
    user.credits -= 1;
    await user.save();

    // 4. Save to history as draft
    const post = await PostHistory.create({
      user_id: userId,
      topic: fullTopic,
      idea: hook,
      post_content: postContent,
      status: 'drafted'
    });

    res.json({
      success: true,
      variation: {
        hook: hook,
        description: 'Auto-generated single post',
        postContent: postContent
      },
      historyId: post._id,
      creditsRemaining: user.credits
    });
  } catch (error) {
    logger.error('Generate Post Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PUT /api/dashboard/posts/:id/schedule
router.put('/posts/:id/schedule', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { scheduledFor, content } = req.body;

    if (!scheduledFor) {
      return res.status(400).json({ error: 'scheduledFor date is required' });
    }

    const post = await PostHistory.findOne({ _id: postId, user_id: userId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.status === 'posted') {
      return res.status(400).json({ error: 'Post is already published' });
    }

    post.status = 'scheduled';
    post.scheduled_for = new Date(scheduledFor);
    if (content) {
      post.post_content = content;
    }
    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    logger.error('Schedule Post Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/dashboard/posts/:id/publish
router.post('/posts/:id/publish', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { content } = req.body;

    const post = await PostHistory.findOne({ _id: postId, user_id: userId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.status === 'posted') {
      return res.status(400).json({ error: 'Post is already published' });
    }

    if (content) {
      post.post_content = content;
      await post.save();
    }

    const result = await linkedin.createPost(userId, post.post_content);
    
    post.status = 'posted';
    post.linkedin_post_id = result.postId;
    await post.save();

    res.json({ success: true, post, result });
  } catch (error) {
    logger.error('Publish Post Error:', error);
    await PostHistory.updateOne({ _id: req.params.id }, { status: 'failed' });
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/dashboard/posts
router.get('/posts', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await PostHistory.find({ user_id: userId }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    logger.error('Fetch Posts Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/dashboard/posts (Manual creation)
router.post('/posts', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    const post = await PostHistory.create({
      user_id: userId,
      topic: title || 'Manual Draft',
      idea: title || 'Manual Draft',
      post_content: content,
      status: 'drafted'
    });

    res.json({ success: true, post });
  } catch (error) {
    logger.error('Create Post Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/dashboard/posts/:id
router.get('/posts/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const post = await PostHistory.findOne({ _id: req.params.id, user_id: userId });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    logger.error('Fetch Single Post Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PUT /api/dashboard/posts/:id
router.put('/posts/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;
    
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const post = await PostHistory.findOne({ _id: req.params.id, user_id: userId });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    if (post.status === 'posted') {
      return res.status(400).json({ error: 'Cannot edit a published post' });
    }

    post.post_content = content;
    await post.save();
    
    res.json({ success: true, post });
  } catch (error) {
    logger.error('Update Post Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/dashboard/posts/:id/cancel-schedule
router.post('/posts/:id/cancel-schedule', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const post = await PostHistory.findOne({ _id: req.params.id, user_id: userId });
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.status !== 'scheduled') {
      return res.status(400).json({ error: 'Post is not scheduled' });
    }

    post.status = 'drafted';
    post.scheduled_for = null;
    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    logger.error('Cancel Schedule Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
