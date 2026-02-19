const express = require('express');
const config = require('./config');
const logger = require('./utils/logger');
const { PostWorkflow } = require('./workflow/postWorkflow');
const { createTelegramBot } = require('./services/telegram');
const linkedin = require('./services/linkedin');
const { startScheduler } = require('./services/scheduler');
const axios = require('axios');

async function main() {
  logger.info('🚀 AutoDraft AI starting...');
  logger.info(`Environment: ${config.env}`);

  // 1. Create the workflow engine
  const workflow = new PostWorkflow();

  // 2. Start Express server for LinkedIn OAuth + webhook
  const app = express();
  app.use(express.json()); // Required for webhook POST body parsing

  linkedin.setupOAuthRoutes(app);

  // Health check (Render pings this to verify the service is alive)
  app.get('/', (req, res) => {
    res.json({
      name: 'AutoDraft AI',
      status: 'running',
      env: config.env,
      linkedin: linkedin.isTokenValid() ? 'connected' : 'not connected',
      workflow: workflow.getState(),
      uptime: Math.floor(process.uptime()) + 's',
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  app.listen(config.server.port, '0.0.0.0', () => {
    logger.info(`Express server running on port ${config.server.port}`);
    logger.info(`LinkedIn OAuth: ${config.appUrl}/auth/linkedin`);
  });

  // 3. Initialize Telegram bot (pass app for webhook route in production)
  const bot = createTelegramBot(workflow, app);

  // 4. Start the daily scheduler
  const scheduler = startScheduler(workflow);

  // 5. Keep-alive self-ping (prevents Render free tier from spinning down)
  let keepAliveInterval = null;
  if (config.isProduction && config.appUrl) {
    keepAliveInterval = setInterval(async () => {
      try {
        await axios.get(`${config.appUrl}/health`);
        logger.debug('Keep-alive ping sent');
      } catch (err) {
        logger.warn('Keep-alive ping failed:', err.message);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
    logger.info('Keep-alive self-ping enabled (every 10 min)');
  }

  // 6. Startup status
  const linkedInStatus = linkedin.isTokenValid()
    ? '✅ Connected'
    : `❌ Not connected — visit ${config.appUrl}/auth/linkedin`;

  logger.info('========================================');
  logger.info('  AutoDraft AI is ready!');
  logger.info(`  Mode:     ${config.isProduction ? '🌐 Production' : '💻 Development'}`);
  logger.info(`  LinkedIn: ${linkedInStatus}`);
  logger.info(`  Schedule: ${config.scheduler.cronSchedule} (${config.scheduler.timezone})`);
  logger.info(`  URL:      ${config.appUrl}`);
  logger.info('========================================');

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down...');
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    if (!config.telegram.useWebhook) bot.stopPolling();
    scheduler.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
