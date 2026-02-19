const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const logger = require('../utils/logger');
const linkedin = require('../services/linkedin');

/**
 * Initialize and configure the Telegram bot
 */
function createTelegramBot(workflow) {
  const bot = new TelegramBot(config.telegram.botToken, { polling: true });
  const chatId = config.telegram.chatId;

  // Helper: check if message is from the authorized user
  function isAuthorized(msg) {
    return String(msg.chat.id) === String(chatId);
  }

  // Helper: send a text message
  async function sendMessage(text) {
    try {
      await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (error) {
      // Retry without markdown if formatting fails
      try {
        await bot.sendMessage(chatId, text.replace(/[*_`\[\]]/g, ''));
      } catch (retryError) {
        logger.error('Failed to send Telegram message:', retryError);
      }
    }
  }

  // Helper: send inline keyboard
  async function sendInlineKeyboard(text, buttons) {
    try {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    } catch (error) {
      try {
        await bot.sendMessage(chatId, text.replace(/[*_`\[\]]/g, ''), {
          reply_markup: {
            inline_keyboard: buttons,
          },
        });
      } catch (retryError) {
        logger.error('Failed to send inline keyboard:', retryError);
      }
    }
  }

  // Inject message senders into workflow
  workflow.setMessageSenders({ sendMessage, sendInlineKeyboard });

  // --- Command Handlers ---

  bot.onText(/\/start/, (msg) => {
    if (!isAuthorized(msg)) return;

    sendMessage(
      `👋 *Welcome to AutoDraft AI!*\n\n` +
        `I help you create and publish LinkedIn posts using AI.\n\n` +
        `*Commands:*\n` +
        `🚀 /generate — Start creating a post\n` +
        `📊 /status — Check current workflow status\n` +
        `🔗 /linkedin — Check LinkedIn connection\n` +
        `❌ /cancel — Cancel current workflow\n` +
        `ℹ️ /help — Show this message\n\n` +
        `I'll also ping you daily at your scheduled time to create a post!`
    );
  });

  bot.onText(/\/help/, (msg) => {
    if (!isAuthorized(msg)) return;

    sendMessage(
      `📖 *AutoDraft AI Help*\n\n` +
        `*How it works:*\n` +
        `1️⃣ I generate 5 topic suggestions\n` +
        `2️⃣ You pick a topic\n` +
        `3️⃣ I generate 3 post ideas\n` +
        `4️⃣ You pick an idea\n` +
        `5️⃣ I write the full post\n` +
        `6️⃣ You review, edit, or approve\n` +
        `7️⃣ I post it to LinkedIn! 🎉\n\n` +
        `*Commands:*\n` +
        `/generate — Start the workflow\n` +
        `/status — Current workflow state\n` +
        `/linkedin — LinkedIn auth status\n` +
        `/cancel — Cancel current flow\n` +
        `/approve — Approve pending post`
    );
  });

  bot.onText(/\/generate/, (msg) => {
    if (!isAuthorized(msg)) return;
    workflow.start();
  });

  bot.onText(/\/status/, (msg) => {
    if (!isAuthorized(msg)) return;

    const state = workflow.getState();
    const stateMessages = {
      IDLE: '😴 No active workflow. Use /generate to start.',
      TOPICS_SENT: '📋 Waiting for you to select a topic.',
      IDEAS_SENT: '💡 Waiting for you to select an idea.',
      DRAFT_SENT: '📄 Post draft ready. Approve, edit, or regenerate.',
      AWAITING_FEEDBACK: '✏️ Waiting for your edit feedback.',
      POSTED: '✅ Post published!',
    };

    sendMessage(`📊 *Workflow Status:* ${state}\n\n${stateMessages[state] || 'Unknown state'}`);
  });

  bot.onText(/\/linkedin/, (msg) => {
    if (!isAuthorized(msg)) return;

    const isValid = linkedin.isTokenValid();
    if (isValid) {
      sendMessage('✅ LinkedIn is connected and authorized.');
    } else {
      sendMessage(
        `❌ LinkedIn is not connected.\n\nVisit this link to authorize:\nhttp://localhost:${config.server.port}/auth/linkedin`
      );
    }
  });

  bot.onText(/\/cancel/, (msg) => {
    if (!isAuthorized(msg)) return;

    workflow.reset();
    sendMessage('❌ Workflow cancelled. Use /generate to start a new one.');
  });

  bot.onText(/\/approve/, (msg) => {
    if (!isAuthorized(msg)) return;
    workflow.handleApproval();
  });

  // --- Callback Query Handler (inline buttons) ---

  bot.on('callback_query', async (query) => {
    if (String(query.message.chat.id) !== String(chatId)) return;

    const data = query.data;

    // Acknowledge the button press
    await bot.answerCallbackQuery(query.id);

    if (data.startsWith('topic_')) {
      const index = parseInt(data.replace('topic_', ''), 10);
      await workflow.handleTopicSelection(index);
    } else if (data.startsWith('idea_')) {
      const index = parseInt(data.replace('idea_', ''), 10);
      await workflow.handleIdeaSelection(index);
    } else if (data === 'approve') {
      await workflow.handleApproval();
    } else if (data === 'edit') {
      await workflow.handleEditRequest();
    } else if (data === 'regenerate') {
      await workflow.handleRegenerate();
    } else if (data === 'cancel') {
      workflow.reset();
      await sendMessage('❌ Workflow cancelled. Use /generate to start a new one.');
    }
  });

  // --- Free-text Message Handler (for feedback) ---

  bot.on('message', async (msg) => {
    if (!isAuthorized(msg)) return;
    if (msg.text && msg.text.startsWith('/')) return; // Skip commands

    // If awaiting feedback, handle it
    if (msg.text) {
      const handled = await workflow.handleFeedback(msg.text);
      if (!handled) {
        // Not in feedback state — ignore or send help
        // Don't spam the user with "I don't understand" messages
      }
    }
  });

  // Error handling
  bot.on('polling_error', (error) => {
    logger.error('Telegram polling error:', error);
  });

  logger.info('Telegram bot started successfully');
  return bot;
}

module.exports = { createTelegramBot };
