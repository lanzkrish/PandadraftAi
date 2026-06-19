const cron = require('node-cron');
const config = require('../config');
const logger = require('../utils/logger');
const db = require('../db');
const PostHistory = require('../models/PostHistory');
const linkedin = require('./linkedin');

/**
 * Multi-user scheduler — checks every minute which users are due
 */
function startScheduler(triggerWorkflow) {
  const lastTriggered = new Map();

  const job = cron.schedule(config.scheduler.checkInterval, async () => {
    const now = new Date();
    let activeUsers;
    try {
      activeUsers = await db.getAllActiveUsers();
    } catch (err) {
      logger.error('Scheduler: failed to fetch users:', err.message);
      return;
    }

    for (const user of activeUsers) {
      try {
        const parts = user.cron_schedule.split(/\s+/);
        if (parts.length < 5) continue;

        const [cronMin, cronHour] = parts;
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: user.timezone || 'Asia/Kolkata' }));
        const currentHour = userTime.getHours();
        const currentMin = userTime.getMinutes();

        const targetMin = parseInt(cronMin, 10);
        const targetHour = parseInt(cronHour, 10);
        if (isNaN(targetMin) || isNaN(targetHour)) continue;
        if (currentHour !== targetHour || currentMin !== targetMin) continue;

        const todayKey = `${user._id}_${currentHour}_${currentMin}_${userTime.toDateString()}`;
        if (lastTriggered.has(todayKey)) continue;

        const liValid = await db.isLinkedInTokenValid(user._id);
        if (!liValid) {
          logger.info(`Skipping ${user.name} (${user._id}) — LinkedIn not connected`);
          continue;
        }

        lastTriggered.set(todayKey, true);
        logger.info(`⏰ Triggering workflow for ${user.name} (${user._id})`);
        triggerWorkflow(user);

        // Clean old entries
        if (lastTriggered.size > 100) {
          const entries = [...lastTriggered.entries()];
          entries.slice(0, entries.length - 100).forEach(([k]) => lastTriggered.delete(k));
        }
      } catch (error) {
        logger.error(`Scheduler error for user ${user._id}:`, error);
      }
    }
  });

  logger.info('Multi-user scheduler started (checking every minute)');
  return job;
}
function startManualPostScheduler() {
  const job = cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Find all posts that are scheduled and due
      const duePosts = await PostHistory.find({
        status: 'scheduled',
        scheduled_for: { $lte: now }
      });

      if (duePosts.length === 0) return;

      logger.info(`Manual Scheduler: Found ${duePosts.length} posts due for publishing.`);

      for (const post of duePosts) {
        // Atomically lock the post to prevent race conditions (e.g., if scheduler runs multiple times concurrently)
        const updatedPost = await PostHistory.findOneAndUpdate(
          { _id: post._id, status: 'scheduled' },
          { $set: { status: 'processing' } },
          { new: true }
        );

        // If it's no longer scheduled, another process grabbed it first
        if (!updatedPost) continue;

        try {
          const result = await linkedin.createPost(updatedPost.user_id, updatedPost.post_content);
          updatedPost.status = 'posted';
          updatedPost.linkedin_post_id = result.postId;
          await updatedPost.save();
          logger.info(`Successfully published scheduled post ${updatedPost._id}`);
        } catch (error) {
          logger.error(`Failed to publish scheduled post ${updatedPost._id}: ${error.message}`);
          updatedPost.status = 'failed';
          await updatedPost.save();
        }
      }
    } catch (err) {
      logger.error('Manual Scheduler Error:', err);
    }
  });

  logger.info('Manual post scheduler started (checking every minute)');
  return job;
}

module.exports = { startScheduler, startManualPostScheduler };
