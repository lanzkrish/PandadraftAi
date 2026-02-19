require('dotenv').config();

const config = {
  // Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },

  // Google Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },

  // LinkedIn OAuth
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/auth/linkedin/callback',
  },

  // Scheduler
  scheduler: {
    cronSchedule: process.env.CRON_SCHEDULE || '0 9 * * *',
    timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
  },

  // Server
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
  },

  // Content preferences
  content: {
    categories: process.env.CONTENT_CATEGORIES
      ? process.env.CONTENT_CATEGORIES.split(',').map((c) => c.trim())
      : [],
    tone: process.env.CONTENT_TONE || 'professional',
  },
};

// Validate required keys
const required = [
  ['TELEGRAM_BOT_TOKEN', config.telegram.botToken],
  ['TELEGRAM_CHAT_ID', config.telegram.chatId],
  ['GEMINI_API_KEY', config.gemini.apiKey],
  ['LINKEDIN_CLIENT_ID', config.linkedin.clientId],
  ['LINKEDIN_CLIENT_SECRET', config.linkedin.clientSecret],
];

const missing = required.filter(([, val]) => !val).map(([key]) => key);

if (missing.length > 0) {
  console.error(
    `\n❌ Missing required environment variables:\n${missing.map((k) => `   • ${k}`).join('\n')}\n\nCopy .env.example to .env and fill in your values.\n`
  );
  process.exit(1);
}

module.exports = config;
