const mongoose = require('mongoose');
require('dotenv').config();
const { initDatabase, closeDatabase, PostHistory } = require('./src/db');
const { startManualPostScheduler } = require('./src/services/scheduler');

async function test() {
  await initDatabase(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tacodraft');
  const post = await PostHistory.findById('6a34d9c262f6ec6bfde51875');
  if (post) {
    console.log('Found post, resetting to scheduled');
    post.status = 'scheduled';
    post.scheduled_for = new Date();
    await post.save();
  } else {
    console.log('Post not found, finding any failed post');
    const anyFailed = await PostHistory.findOne({ status: 'failed' });
    if (anyFailed) {
      anyFailed.status = 'scheduled';
      anyFailed.scheduled_for = new Date();
      await anyFailed.save();
      console.log('Reset post', anyFailed._id);
    }
  }
  
  // run the job logic manually
  try {
      const now = new Date();
      // Find all posts that are scheduled and due
      const duePosts = await PostHistory.find({
        status: 'scheduled',
        scheduled_for: { $lte: now }
      });
      console.log(`Manual Scheduler: Found ${duePosts.length} posts due for publishing.`);
      const linkedin = require('./src/services/linkedin');
      for (const post of duePosts) {
        try {
          const result = await linkedin.createPost(post.user_id, post.post_content);
          console.log(`Successfully published scheduled post ${post._id}`);
          post.status = 'posted';
          await post.save();
        } catch (error) {
          console.error(`Failed to publish scheduled post ${post._id}:`, error.message);
          console.error('Full Error:', error);
          post.status = 'failed';
          await post.save();
        }
      }
  } catch(e) {
      console.error(e);
  }
  
  await closeDatabase();
}

test().catch(console.error);
