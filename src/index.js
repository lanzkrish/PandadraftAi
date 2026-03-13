const express = require('express');
const config = require('./config');
const logger = require('./utils/logger');
const db = require('./db');
const { createTelegramBot } = require('./services/telegram');
const linkedin = require('./services/linkedin');
const { startScheduler } = require('./services/scheduler');
const axios = require('axios');

async function main() {
  const isDevServer = config.devServer.isDevServer;
  logger.info(`🚀 AutoDraft AI starting... ${isDevServer ? '(DEV SERVER MODE)' : ''}`);
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
      mode: isDevServer ? 'dev-server' : 'production',
      activeUsers: users.length,
      uptime: Math.floor(process.uptime()) + 's',
    });
  });

  app.get('/health', (req, res) => res.status(200).send('OK'));

  // ── Dev Server Endpoints ──────────────────────────────────
  // These are used by the production server to proxy updates to this dev server

  // Health check — production pings this to check if dev server is live
  app.get('/api/dev-health', (req, res) => {
    res.json({ status: 'ok', mode: 'dev-server', uptime: Math.floor(process.uptime()) + 's' });
  });

  let devBot = null; // Will be set if this is a dev server

  if (isDevServer) {
    // Dev server mode: create bot WITHOUT polling/webhook, only process forwarded updates
    const { bot, processDevUpdate } = createTelegramBot(app, { devMode: true });
    devBot = bot;

    // Receive forwarded Telegram updates from the production server
    app.post('/api/dev-update', async (req, res) => {
      try {
        const update = req.body;
        if (!update) {
          return res.status(400).json({ error: 'No update body' });
        }
        logger.info(`📥 Dev server received forwarded update`);
        await processDevUpdate(update);
        res.json({ success: true });
      } catch (error) {
        logger.error('Dev update processing error:', error.message);
        res.status(500).json({ error: error.message });
      }
    });

    logger.info('📡 Dev server endpoints mounted: /api/dev-health, /api/dev-update');
  }

  app.listen(config.server.port, '0.0.0.0', () => {
    logger.info(`Express server running on port ${config.server.port}`);
  });

  // 3. Initialize Telegram bot (normal mode — only on production / non-dev servers)
  let bot, triggerWorkflowForUser;
  if (!isDevServer) {
    const telegramResult = createTelegramBot(app);
    bot = telegramResult.bot;
    triggerWorkflowForUser = telegramResult.triggerWorkflowForUser;
  }

  // 4. Start scheduler (only on production, not dev server)
  let scheduler = null;
  if (!isDevServer) {
    scheduler = startScheduler(triggerWorkflowForUser);
  } else {
    logger.info('⏭️  Scheduler skipped (dev server mode)');
  }

  // 5. Keep-alive (Render) — only on production
  let keepAliveInterval = null;
  if (!isDevServer && config.isProduction && config.appUrl) {
    keepAliveInterval = setInterval(async () => {
      try { await axios.get(`${config.appUrl}/health`); } catch (e) {
        logger.warn('Keep-alive failed:', e.message);
      }
    }, 10 * 60 * 1000);
    logger.info('Keep-alive enabled (10 min)');
  }

  // 6. Startup info
  const users = await db.getAllActiveUsers();
  const devUsers = await db.getAllDevUsers();
  logger.info('========================================');
  logger.info(`  AutoDraft AI is ready!`);
  logger.info(`  Mode:     ${isDevServer ? '🧪 Dev Server' : config.isProduction ? '🌐 Production' : '💻 Development'}`);
  logger.info(`  Database: MongoDB Atlas`);
  logger.info(`  Users:    ${users.length} active, ${devUsers.length} dev`);
  logger.info(`  URL:      ${config.appUrl}`);
  if (config.devServer.url) {
    logger.info(`  Dev URL:  ${config.devServer.url}`);
  }
  logger.info('========================================');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    if (!isDevServer && bot && !config.telegram.useWebhook) bot.stopPolling();
    if (scheduler) scheduler.stop();
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
