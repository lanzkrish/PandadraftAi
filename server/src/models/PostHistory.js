const mongoose = require('mongoose');

const postHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topic: { type: String },
  idea: { type: String },
  post_content: { type: String },
  linkedin_post_id: { type: String, default: null },
  status: { type: String, default: 'drafted', enum: ['drafted', 'approved', 'posted', 'failed', 'scheduled'] },
  scheduled_for: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('PostHistory', postHistorySchema);
