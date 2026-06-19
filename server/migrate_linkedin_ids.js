const mongoose = require('mongoose');
require('dotenv').config();

const config = require('./src/config');
const PostHistory = require('./src/models/PostHistory');

async function fixDatabase() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(config.database.uri);
    
    console.log("Finding posts with 'urn:li:share:'...");
    const posts = await PostHistory.find({ linkedin_post_id: { $regex: '^urn:li:share:' } });
    
    let updatedCount = 0;
    for (const post of posts) {
      post.linkedin_post_id = post.linkedin_post_id.replace('urn:li:share:', 'urn:li:activity:');
      await post.save();
      updatedCount++;
    }
    
    console.log(`Success: Fixed ${updatedCount} posts in the database.`);
  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

fixDatabase();
