const cron = require('node-cron');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Initialize the daily cron scheduler
 */
function startScheduler(workflow) {
  const { cronSchedule, timezone } = config.scheduler;

  const job = cron.schedule(
    cronSchedule,
    async () => {
      logger.info('⏰ Cron job triggered — starting daily post workflow');
      try {
        await workflow.start();
      } catch (error) {
        logger.error('Cron job error:', error);
      }
    },
    {
      timezone,
      scheduled: true,
    }
  );

  logger.info(`Scheduler started: "${cronSchedule}" (timezone: ${timezone})`);
  return job;
}

module.exports = { startScheduler };
