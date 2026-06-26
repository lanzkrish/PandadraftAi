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

// GET /api/dashboard/trending-topics
router.get('/trending-topics', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let topics = user.weekly_trending_topics;

    if (!topics || topics.length === 0 || !user.weekly_trending_updated_at || user.weekly_trending_updated_at < oneWeekAgo) {
      const ai = require('../services/ai');
      const categories = user.content_categories ? user.content_categories.split(',').map(c => c.trim()).filter(Boolean) : [];
      topics = await ai.generateTrendingTopics(categories);
      
      user.weekly_trending_topics = topics;
      user.weekly_trending_updated_at = now;
      await user.save();
    }

    res.json({ topics });
  } catch (error) {
    logger.error('Trending Topics Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/analytics
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await PostHistory.find({ user_id: userId, status: 'posted' }).lean();
    
    let totalEngagement = 0;
    let totalComments = 0;
    const totalPublished = posts.length;

    // Heatmap initialization (4 rows: 8am, 12pm, 4pm, 8pm. 7 cols: Mon-Sun)
    const heatmapData = [
      [0, 0, 0, 0, 0, 0, 0], // 8am
      [0, 0, 0, 0, 0, 0, 0], // 12pm
      [0, 0, 0, 0, 0, 0, 0], // 4pm
      [0, 0, 0, 0, 0, 0, 0]  // 8pm
    ];

    // Chart Data initialization (last 5 days)
    const chartData = [];
    const today = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      chartData.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateStr: d.toISOString().split('T')[0],
        likes: 0,
        comments: 0
      });
    }

    const linkedin = require('../services/linkedin');
    
    // Limit to 10 most recent posts to avoid slow load times / rate limits
    const recentPosts = posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);
    
    const postsWithAnalytics = await Promise.all(recentPosts.map(async (post) => {
      let stats = { likes: 0, comments: 0 };
      if (post.linkedin_post_id) {
        stats = await linkedin.getPostAnalytics(userId, post.linkedin_post_id);
      }
      const engagement = stats.likes + stats.comments;
      totalEngagement += engagement;
      totalComments += stats.comments;

      const date = new Date(post.updatedAt || post.createdAt);
      
      // Update chartData if it matches one of the last 5 days
      const postDateStr = date.toISOString().split('T')[0];
      const chartPoint = chartData.find(d => d.dateStr === postDateStr);
      if (chartPoint) {
        chartPoint.likes += stats.likes;
        chartPoint.comments += stats.comments;
      }

      let day = date.getDay() - 1; // 1=Mon->0, 0=Sun->-1
      if (day === -1) day = 6;

      const hour = date.getHours();
      let row = 0;
      if (hour >= 11 && hour <= 14) row = 1;
      else if (hour >= 15 && hour <= 18) row = 2;
      else if (hour > 18 || hour < 5) row = 3;

      heatmapData[row][day] += 1;

      // Extract title from post_content (first line, or up to 50 chars)
      let title = post.topic || 'General Topic';
      if (post.post_content) {
        const firstLine = post.post_content.split('\n')[0].trim();
        // remove asterisks if markdown header
        title = firstLine.replace(/^#+\s*/, '').replace(/\*/g, '');
        if (title.length > 50) title = title.substring(0, 50) + '...';
      }

      return {
        id: post._id,
        topic: title,
        engagement,
      };
    }));

    const avgEngagement = totalPublished > 0 ? (totalEngagement / totalPublished).toFixed(1) : 0;
    
    const topTopics = postsWithAnalytics
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 4)
      .map(p => ({
        topic: p.topic,
        engagement: p.engagement,
        rate: totalEngagement > 0 ? ((p.engagement / totalEngagement) * 100).toFixed(1) + '%' : '0%'
      }));

    res.json({
      totalEngagement,
      totalComments,
      totalPublished,
      avgEngagement,
      audienceGrowth: 0,
      heatmapData,
      chartData,
      topTopics,
    });
  } catch (error) {
    logger.error('Dashboard Analytics Error:', error);
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
    if (content_tone !== undefined) update.content_tone = content_tone;
    if (keywords !== undefined) update.keywords = keywords;

    if (content_categories !== undefined) {
      const user = await User.findById(userId);
      if (user && user.content_categories !== content_categories) {
        update.content_categories = content_categories;
        // Reset trending cache so it regenerates based on new categories
        update.weekly_trending_updated_at = null; 
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password_hash');
    
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

// DELETE /api/dashboard/posts/:id
router.delete('/posts/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const post = await PostHistory.findOne({ _id: postId, user_id: userId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.status === 'posted') {
      return res.status(400).json({ error: 'Cannot delete a published post' });
    }

    await PostHistory.deleteOne({ _id: postId, user_id: userId });

    res.json({ success: true });
  } catch (error) {
    logger.error('Delete Post Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
