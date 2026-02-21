const express = require('express');
const config = require('./config');
const logger = require('./utils/logger');
const db = require('./db');
const { createTelegramBot } = require('./services/telegram');
const linkedin = require('./services/linkedin');
const { startScheduler } = require('./services/scheduler');
const axios = require('axios');

async function main() {
  logger.info('🚀 AutoDraft AI starting...');
  logger.info(`Environment: ${config.env}`);

  // 1. Connect to MongoDB
  await db.initDatabase(config.database.uri);

  // Auto-register admin if not exists
  const adminChatId = config.telegram.adminChatId;
  if (adminChatId) {
    const existing = await db.getUserByChatId(adminChatId);
    if (!existing) {
      await db.createUser({ chatId: adminChatId, name: 'Admin', isAdmin: true });
      logger.info(`Admin auto-registered (Chat ID: ${adminChatId})`);
    }
  }

  // 2. Start Express server
  const app = express();
  app.use(express.json());

  linkedin.setupOAuthRoutes(app);

  app.get('/', async (req, res) => {
    const users = await db.getAllActiveUsers();
    res.json({
      name: 'AutoDraft AI',
      status: 'running',
      env: config.env,
      activeUsers: users.length,
      uptime: Math.floor(process.uptime()) + 's',
    });
  });

  app.get('/health', (req, res) => res.status(200).send('OK'));

  app.listen(config.server.port, '0.0.0.0', () => {
    logger.info(`Express server running on port ${config.server.port}`);
  });

  // 3. Initialize Telegram bot
  const { bot, triggerWorkflowForUser } = createTelegramBot(app);

  // 4. Start scheduler
  const scheduler = startScheduler(triggerWorkflowForUser);

  // 5. Keep-alive (Render)
  let keepAliveInterval = null;
  if (config.isProduction && config.appUrl) {
    keepAliveInterval = setInterval(async () => {
      try { await axios.get(`${config.appUrl}/health`); } catch (e) {
        logger.warn('Keep-alive failed:', e.message);
      }
    }, 10 * 60 * 1000);
    logger.info('Keep-alive enabled (10 min)');
  }

  // 6. Startup info
  const users = await db.getAllActiveUsers();
  logger.info('========================================');
  logger.info('  AutoDraft AI is ready!');
  logger.info(`  Mode:     ${config.isProduction ? '🌐 Production' : '💻 Development'}`);
  logger.info(`  Database: MongoDB Atlas`);
  logger.info(`  Users:    ${users.length} active`);
  logger.info(`  URL:      ${config.appUrl}`);
  logger.info('========================================');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    if (!config.telegram.useWebhook) bot.stopPolling();
    scheduler.stop();
    await db.closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
