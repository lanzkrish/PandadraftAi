const mongoose = require('mongoose');
const config = require('./src/config');
const PostHistory = require('./src/models/PostHistory');

mongoose.connect(config.mongoUri)
  .then(async () => {
    const post = await PostHistory.findById('6a352b42ac4987e36b9f9fdf');
    console.log("POST STATUS IS:", post?.status);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    mongoose.disconnect();
  });
