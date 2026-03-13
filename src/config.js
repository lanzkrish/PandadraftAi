const fs = require('fs');
const path = require('path');

// Load .env first, then .env.local overrides (if exists)
require('dotenv').config();
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath, override: true });
}

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isProduction,
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,

  // Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    adminChatId: process.env.ADMIN_CHAT_ID, // Admin's Telegram chat ID
    useWebhook: isProduction,
  },

  // Google Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },

  // LinkedIn OAuth (app-level credentials — shared for all users)
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3000'}/auth/linkedin/callback`,
  },

  // Scheduler
  scheduler: {
    // Master check interval — runs every minute, checks per-user schedules
    checkInterval: '* * * * *',
  },

  // Server
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
  },

  // Dev server routing
  devServer: {
    url: process.env.DEV_SERVER_URL || '',               // Production uses this to proxy dev users
    isDevServer: process.env.IS_DEV_SERVER === 'true',   // True when this IS the dev server
  },

  // Default content preferences (per-user overrides stored in DB)
  defaults: {
    categories: process.env.CONTENT_CATEGORIES
      ? process.env.CONTENT_CATEGORIES.split(',').map((c) => c.trim())
      : [],
    tone: process.env.CONTENT_TONE || 'professional',
    cronSchedule: process.env.CRON_SCHEDULE || '0 9 * * *',
    timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
  },

  // Database
  database: {
    uri: process.env.MONGODB_URI,
  },
};

// Validate required keys
const required = [
  ['TELEGRAM_BOT_TOKEN', config.telegram.botToken],
  ['ADMIN_CHAT_ID', config.telegram.adminChatId],
  ['GEMINI_API_KEY', config.gemini.apiKey],
  ['LINKEDIN_CLIENT_ID', config.linkedin.clientId],
  ['LINKEDIN_CLIENT_SECRET', config.linkedin.clientSecret],
];

const missing = required.filter(([, val]) => !val).map(([key]) => key);

if (missing.length > 0) {
  console.error(
    `\n⚠️ Missing required environment variables:\n${missing.map((k) => `   • ${k}`).join('\n')}\n\nCopy .env.example to .env and fill in your values.\n`
  );
  if (!isProduction) {
    process.exit(1);
  }
}

module.exports = config;
