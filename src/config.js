require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isProduction,
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,

  // Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    // Use webhook in production (Render), polling in development
    useWebhook: isProduction,
  },

  // Google Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },

  // LinkedIn OAuth
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3000'}/auth/linkedin/callback`,
    // Organization/Page ID for posting to a company page (leave empty for personal profile)
    // Find your org ID: go to your LinkedIn page → Admin view → the number in the URL
    orgId: process.env.LINKEDIN_ORG_ID || '',
    // Allow restoring tokens from env var (for ephemeral filesystems like Render)
    savedTokens: process.env.LINKEDIN_TOKENS || null,
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
    `\n⚠️ Missing required environment variables:\n${missing.map((k) => `   • ${k}`).join('\n')}\n\nCopy .env.example to .env and fill in your values.\n`
  );
  // In production (Render), don't exit — let the server start so health checks pass
  // The features requiring these vars will fail gracefully when used
  if (!isProduction) {
    process.exit(1);
  }
}

module.exports = config;
