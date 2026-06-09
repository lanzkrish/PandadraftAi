const mongoose = require('mongoose');

const linkedinTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
  access_token: { type: String, required: true },
  refresh_token: { type: String, default: null },
  expires_in: { type: Number },
  created_at: { type: Number, required: true }, // epoch ms
}, { timestamps: true });

module.exports = mongoose.model('LinkedInToken', linkedinTokenSchema);
