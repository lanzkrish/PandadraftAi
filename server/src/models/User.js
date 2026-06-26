const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegram_chat_id: { type: String, unique: true, sparse: true, index: true },
  telegram_username: { type: String, default: null },
  email: { type: String, unique: true, sparse: true, index: true },
  is_email_verified: { type: Boolean, default: false },
  email_verification_token: { type: String, default: null },
  verification_email_sent_at: { type: Date, default: null },
  password_hash: { type: String, default: null },
  linkedin_profile_url: { type: String, default: null },
  reset_password_token: { type: String, default: null },
  reset_password_expires: { type: Date, default: null },
  name: { type: String, default: null },
  profession: { type: String, default: null },
  domain: { type: String, default: null },
  status: { type: String, default: 'active', enum: ['active', 'paused', 'disabled'] },
  linkedin_org_id: { type: String, default: '' },
  content_categories: { type: String, default: '' },
  content_tone: { type: String, default: 'professional' },
  keywords: { type: [String], default: [] },  // User-entered keywords, used to enrich auto-generated topics
  cron_schedule: { type: String, default: '0 9 * * *' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  is_admin: { type: Boolean, default: false },
  is_dev_user: { type: Boolean, default: false },  // Dev/test users routed to dev server
  plan: { type: String, default: 'Free' },
  pending_plan: { type: String, default: null },
  credits: { type: Number, default: 2 },
  max_credits: { type: Number, default: 2 },
  linkedin_id: { type: String, unique: true, sparse: true, index: true },
  avatar_url: { type: String, default: null },
  avatar_last_changed: { type: Date, default: null },
  last_payment_method: { type: String, default: null },
  weekly_trending_topics: { type: [String], default: [] },
  weekly_trending_updated_at: { type: Date, default: null },
}, { timestamps: true });

// Ensure null values are completely removed for sparse index fields
userSchema.pre('save', function () {
  if (this.telegram_chat_id === null || this.telegram_chat_id === '') {
    this.$unset('telegram_chat_id');
  }
  if (this.linkedin_id === null || this.linkedin_id === '') {
    this.$unset('linkedin_id');
  }
  if (this.email === null || this.email === '') {
    this.$unset('email');
  }
});

module.exports = mongoose.model('User', userSchema);
