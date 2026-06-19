const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const db = require('./db');
const { createTelegramBot } = require('./services/telegram');
const linkedin = require('./services/linkedin');
const ai = require('./services/ai');
const { startScheduler, startManualPostScheduler } = require('./services/scheduler');
const axios = require('axios');

async function main() {
  const isDevServer = config.devServer.isDevServer;
  logger.info(`🚀 PandaDraft AI starting... ${isDevServer ? '(DEV SERVER MODE)' : ''}`);
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
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isLocal = origin.startsWith('http://localhost:') || 
                      origin.startsWith('http://127.0.0.1:') || 
                      origin.startsWith('chrome-extension://');
                      
      const frontendUrl = process.env.FRONTEND_URL;
      
      if (
        isLocal || 
        origin === 'http://localhost:3000' ||
        (frontendUrl && origin === frontendUrl) ||
        origin.endsWith('.netlify.app') ||
        origin.includes('autodraft')
      ) {
        return callback(null, true);
      }
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json());
  
  // Add cookie-parser for reading JWTs
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  // Mount Auth Router
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);

  // Mount Dashboard Router
  const dashboardRoutes = require('./routes/dashboard');
  app.use('/api/dashboard', dashboardRoutes);

  // Mount Billing Router
  const billingRoutes = require('./routes/billing');
  app.use('/api/billing', billingRoutes);

  linkedin.setupOAuthRoutes(app);

  app.get('/', async (req, res) => {
    const users = await db.getAllActiveUsers();
    res.json({
      name: 'PandaDraft AI',
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

  // Helper to look up user by Telegram Chat ID
  app.get('/api/dev-user', async (req, res) => {
    const chatId = req.query.chatId;
    if (!chatId) return res.status(400).json({ error: 'Missing chatId' });
    const user = await db.getUserByChatId(chatId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ _id: user._id, name: user.name, chatId: user.telegram_chat_id });
  });

  // --- DEV WORKFLOW ENDPOINTS ---

  app.post('/api/dev/generate-topics', async (req, res) => {
    try {
      const { userId, keyword } = req.body;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const user = await db.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const isOrgPost = Boolean(user.linkedin_org_id);
      let topics;
      if (keyword) {
        topics = await ai.generateTopicsFromKeyword(keyword, user.keywords || [], isOrgPost);
      } else {
        topics = await ai.generateTopics(user.keywords || [], isOrgPost);
      }
      res.json({ topics });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/dev/generate-ideas', async (req, res) => {
    try {
      const { userId, topic } = req.body;
      if (!userId || !topic) return res.status(400).json({ error: 'Missing userId or topic' });
      const user = await db.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const tone = user.content_tone || 'professional';
      const isOrgPost = Boolean(user.linkedin_org_id);
      
      const ideas = await ai.generateIdeas(topic, tone, isOrgPost);
      res.json({ ideas });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/dev/generate-post', async (req, res) => {
    try {
      const { userId, topic, idea } = req.body;
      if (!userId || !topic || !idea) return res.status(400).json({ error: 'Missing userId, topic, or idea' });
      const user = await db.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const tone = user.content_tone || 'professional';
      const isOrgPost = Boolean(user.linkedin_org_id);
      const userContext = { name: user.name, profession: user.profession, domain: user.domain };
      
      const postContent = await ai.generatePost(idea, tone, isOrgPost, userContext);
      
      // Save to history as draft
      const post = await db.savePostHistory(userId, {
        topic, idea: idea.hook, postContent, status: 'drafted'
      });
      
      res.json({ postContent, historyId: post ? post._id : null });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/dev/post-to-linkedin', async (req, res) => {
    try {
      const { userId, postContent, historyId } = req.body;
      if (!userId || !postContent) return res.status(400).json({ error: 'Missing userId or postContent' });
      
      const result = await linkedin.createPost(userId, postContent);
      
      if (historyId) {
        await db.updatePostHistory(historyId, { linkedinPostId: result.postId, status: 'posted' });
      }
      res.json({ success: true, result });
    } catch (error) {
      if (req.body.historyId) {
        await db.updatePostHistory(req.body.historyId, { status: 'failed' });
      }
      res.status(500).json({ error: error.message });
    }
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
  let manualScheduler = null;
  if (!isDevServer) {
    scheduler = startScheduler(triggerWorkflowForUser);
    manualScheduler = startManualPostScheduler();
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
  logger.info(`  PandaDraft AI is ready!`);
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
    if (manualScheduler) manualScheduler.stop();
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
