const express = require('express');
const config = require('./config');
const logger = require('./utils/logger');
const { PostWorkflow } = require('./workflow/postWorkflow');
const { createTelegramBot } = require('./services/telegram');
const linkedin = require('./services/linkedin');
const { startScheduler } = require('./services/scheduler');

async function main() {
  logger.info('🚀 AutoDraft AI starting...');

  // 1. Create the workflow engine
  const workflow = new PostWorkflow();

  // 2. Start Express server for LinkedIn OAuth
  const app = express();
  linkedin.setupOAuthRoutes(app);

  // Health check
  app.get('/', (req, res) => {
    res.json({
      name: 'AutoDraft AI',
      status: 'running',
      linkedin: linkedin.isTokenValid() ? 'connected' : 'not connected',
      workflow: workflow.getState(),
    });
  });

  app.listen(config.server.port, () => {
    logger.info(`Express server running on http://localhost:${config.server.port}`);
    logger.info(`LinkedIn OAuth: http://localhost:${config.server.port}/auth/linkedin`);
  });

  // 3. Initialize Telegram bot
  const bot = createTelegramBot(workflow);

  // 4. Start the daily scheduler
  const scheduler = startScheduler(workflow);

  // 5. Startup status
  const linkedInStatus = linkedin.isTokenValid()
    ? '✅ Connected'
    : `❌ Not connected — visit http://localhost:${config.server.port}/auth/linkedin`;

  logger.info('========================================');
  logger.info('  AutoDraft AI is ready!');
  logger.info(`  LinkedIn: ${linkedInStatus}`);
  logger.info(`  Schedule: ${config.scheduler.cronSchedule} (${config.scheduler.timezone})`);
  logger.info(`  Server:   http://localhost:${config.server.port}`);
  logger.info('========================================');

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down...');
    bot.stopPolling();
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Shutting down...');
    bot.stopPolling();
    scheduler.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
