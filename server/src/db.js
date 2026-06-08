const mongoose = require('mongoose');
const logger = require('./utils/logger');

// ── Schemas ──────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  telegram_chat_id: { type: String, unique: true, sparse: true, index: true },
  telegram_username: { type: String, default: null },
  email: { type: String, unique: true, sparse: true, index: true },
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
}, { timestamps: true });

const linkedinTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
  access_token: { type: String, required: true },
  refresh_token: { type: String, default: null },
  expires_in: { type: Number },
  created_at: { type: Number, required: true }, // epoch ms
}, { timestamps: true });

const postHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topic: { type: String },
  idea: { type: String },
  post_content: { type: String },
  linkedin_post_id: { type: String, default: null },
  status: { type: String, default: 'drafted', enum: ['drafted', 'approved', 'posted', 'failed'] },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const LinkedInToken = mongoose.model('LinkedInToken', linkedinTokenSchema);
const PostHistory = mongoose.model('PostHistory', postHistorySchema);

// ── Database Connection ──────────────────────────────────────

async function initDatabase(uri) {
  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

async function closeDatabase() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

// ── User Operations ──────────────────────────────────────────

async function getUserByChatId(chatId) {
  return User.findOne({ telegram_chat_id: String(chatId) }).lean();
}

async function getUserById(id) {
  return User.findById(id).lean();
}

async function createUser({ chatId, username, name, isAdmin = false }) {
  // Import config here to avoid circular dependency at module level
  const config = require('./config');
  const user = await User.create({
    telegram_chat_id: String(chatId),
    telegram_username: username || null,
    name: name || null,
    is_admin: isAdmin,
    content_categories: config.defaults.categories.join(', '),
    content_tone: config.defaults.tone,
    cron_schedule: config.defaults.cronSchedule,
    timezone: config.defaults.timezone,
  });
  return user.toObject();
}

async function updateUser(id, fields) {
  const allowed = [
    'name', 'profession', 'domain', 'status', 'linkedin_org_id', 'content_categories',
    'content_tone', 'cron_schedule', 'timezone', 'telegram_username',
  ];
  const update = {};
  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key)) update[key] = val;
  }
  if (Object.keys(update).length === 0) return;
  await User.updateOne({ _id: id }, { $set: update });
}

async function getAllActiveUsers() {
  return User.find({ status: 'active' }).lean();
}

async function getAllUsers() {
  return User.find().sort({ createdAt: -1 }).lean();
}

async function setUserStatus(chatId, status) {
  await User.updateOne({ telegram_chat_id: String(chatId) }, { $set: { status } });
}

async function addKeyword(userId, keyword) {
  const kw = keyword.trim().toLowerCase();
  // Add only if not already present, cap at 50 keywords
  await User.updateOne(
    { _id: userId, keywords: { $ne: kw } },
    { $push: { keywords: { $each: [kw], $slice: -50 } } }
  );
}

async function deleteKeyword(userId, keyword) {
  const kw = keyword.trim().toLowerCase();
  await User.updateOne({ _id: userId }, { $pull: { keywords: kw } });
}

async function resetKeywords(userId, defaultKeywords = []) {
  await User.updateOne({ _id: userId }, { $set: { keywords: defaultKeywords } });
}

async function getKeywords(userId) {
  const user = await User.findById(userId).select('keywords').lean();
  return user?.keywords || [];
}

async function setDevUser(userId, isDev) {
  await User.updateOne({ _id: userId }, { $set: { is_dev_user: isDev } });
}

async function getAllDevUsers() {
  return User.find({ is_dev_user: true }).lean();
}

// ── LinkedIn Token Operations ────────────────────────────────

async function saveLinkedInTokens(userId, tokens) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    logger.error(`Invalid userId format: ${userId}`);
    return;
  }
  await LinkedInToken.findOneAndUpdate(
    { user_id: userId },
    {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_in: tokens.expires_in,
      created_at: tokens.created_at,
    },
    { upsert: true, new: true }
  );
  logger.info(`LinkedIn tokens saved for user ${userId}`);
}

async function getLinkedInTokens(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  return LinkedInToken.findOne({ user_id: userId }).lean();
}

async function isLinkedInTokenValid(userId) {
  const tokens = await getLinkedInTokens(userId);
  if (!tokens) return false;
  const expiresAt = tokens.created_at + tokens.expires_in * 1000;
  return Date.now() < expiresAt - 5 * 60 * 1000;
}

// ── Post History Operations ──────────────────────────────────

async function savePostHistory(userId, { topic, idea, postContent, linkedinPostId, status }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    logger.error(`Invalid userId format: ${userId}`);
    return null;
  }
  const post = await PostHistory.create({
    user_id: userId,
    topic,
    idea,
    post_content: postContent,
    linkedin_post_id: linkedinPostId || null,
    status: status || 'drafted',
  });
  return post;
}

async function updatePostHistory(id, { linkedinPostId, status }) {
  const update = {};
  if (linkedinPostId !== undefined) update.linkedin_post_id = linkedinPostId;
  if (status !== undefined) update.status = status;
  if (Object.keys(update).length === 0) return;
  await PostHistory.updateOne({ _id: id }, { $set: update });
}

async function getPostHistory(userId, limit = 5) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return [];
  return PostHistory.find({ user_id: userId }).sort({ createdAt: -1 }).limit(limit).lean();
}

async function getPostStats(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return { total: 0, posted: 0, failed: 0 };
  const results = await PostHistory.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        posted: { $sum: { $cond: [{ $eq: ['$status', 'posted'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
      },
    },
  ]);
  return results[0] || { total: 0, posted: 0, failed: 0 };
}

module.exports = {
  initDatabase,
  closeDatabase,
  // Users
  getUserByChatId,
  getUserById,
  createUser,
  updateUser,
  getAllActiveUsers,
  getAllUsers,
  setUserStatus,
  addKeyword,
  deleteKeyword,
  resetKeywords,
  getKeywords,
  setDevUser,
  getAllDevUsers,
  // LinkedIn tokens
  saveLinkedInTokens,
  getLinkedInTokens,
  isLinkedInTokenValid,
  // Post history
  savePostHistory,
  updatePostHistory,
  getPostHistory,
  getPostStats,
  // Models (for direct access if needed)
  User,
  LinkedInToken,
  PostHistory,
};
