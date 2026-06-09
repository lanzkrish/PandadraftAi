const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const logger = require('../utils/logger');
const db = require('../db');
const axios = require('axios');
const { PostWorkflow } = require('../workflow/postWorkflow');

const workflows = new Map();
const onboardingSessions = new Map(); // chatId -> { step, name, profession, domain, keywords }

// ── Dev Server Proxy Helpers ────────────────────────────────

let _devServerAlive = null;   // cached status
let _devCheckTime = 0;        // last check timestamp
const DEV_CHECK_INTERVAL = 30_000; // re-check every 30s

/**
 * Check if the dev server is currently reachable (with caching)
 */
async function isDevServerAlive() {
  const devUrl = config.devServer.url;
  if (!devUrl) return false;

  // Use cached result if checked recently
  if (Date.now() - _devCheckTime < DEV_CHECK_INTERVAL && _devServerAlive !== null) {
    return _devServerAlive;
  }

  try {
    const res = await axios.get(`${devUrl}/api/dev-health`, { timeout: 3000 });
    _devServerAlive = res.status === 200;
  } catch {
    _devServerAlive = false;
  }
  _devCheckTime = Date.now();
  return _devServerAlive;
}

/**
 * Forward a Telegram update to the dev server
 * Returns true if successfully forwarded
 */
async function forwardToDevServer(update) {
  const devUrl = config.devServer.url;
  if (!devUrl) return false;

  try {
    await axios.post(`${devUrl}/api/dev-update`, update, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    logger.info('📤 Update forwarded to dev server');
    return true;
  } catch (error) {
    logger.warn(`📤 Dev server forward failed: ${error.message}`);
    // Invalidate cached status so next check is fresh
    _devServerAlive = false;
    _devCheckTime = 0;
    return false;
  }
}

// ── Workflow Management ─────────────────────────────────────

function getWorkflow(user, bot) {
  const chatId = user.telegram_chat_id;
  if (workflows.has(chatId)) return workflows.get(chatId);

  const sendMessage = async (text) => {
    try {
      await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch {
      try { await bot.sendMessage(chatId, text.replace(/[*_`\[\]]/g, '')); } catch (e) {
        logger.error(`Failed to send to ${chatId}`);
      }
    }
  };

  const sendInlineKeyboard = async (text, buttons) => {
    try {
      await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } });
    } catch {
      try {
        await bot.sendMessage(chatId, text.replace(/[*_`\[\]]/g, ''), { reply_markup: { inline_keyboard: buttons } });
      } catch (e) { logger.error(`Failed to send keyboard to ${chatId}`); }
    }
  };

  const workflow = new PostWorkflow(user, { sendMessage, sendInlineKeyboard });
  workflows.set(chatId, workflow);
  return workflow;
}

function triggerWorkflowForUser(user, bot) {
  const workflow = getWorkflow(user, bot);
  workflow.start();
}

// ── Check if a dev user should be proxied ────────────────────

/**
 * Check if this user is a dev user and attempt to proxy the update.
 * Returns true if the update was forwarded (caller should skip processing).
 * Returns false if the update should be processed locally.
 */
async function tryProxyDevUser(user, update, bot) {
  // Only proxy on production/non-dev servers
  if (config.devServer.isDevServer) return false;
  if (!user || !user.is_dev_user) return false;
  if (!config.devServer.url) return false;

  const chatId = user.telegram_chat_id;

  const alive = await isDevServerAlive();
  if (alive) {
    const forwarded = await forwardToDevServer(update);
    if (forwarded) return true;
  }

  // Dev server is offline — notify user and fall back to production
  try {
    await bot.sendMessage(chatId,
      '⚠️ *Dev server is offline.* Processing on production server.',
      { parse_mode: 'Markdown' }
    );
  } catch {
    // Ignore notification failure
  }
  return false;
}

// ── Create Telegram Bot ─────────────────────────────────────

function createTelegramBot(app, options = {}) {
  const devMode = options.devMode || false;
  let bot;
  const adminChatId = config.telegram.adminChatId;

  if (devMode) {
    // Dev server mode: create bot API instance without polling/webhook
    // We only use it to SEND messages, not receive updates from Telegram directly
    bot = new TelegramBot(config.telegram.botToken, { polling: false });
    logger.info('🧪 Telegram bot created in dev mode (no polling, no webhook)');

    /**
     * Process a forwarded Telegram update on the dev server
     */
    async function processDevUpdate(update) {
      // Handle message updates
      if (update.message) {
        const msg = update.message;
        const chatId = String(msg.chat.id);
        const text = msg.text || '';

        // Check if user is a dev user
        const user = await db.getUserByChatId(chatId);
        if (!user) {
          logger.warn(`Dev server: unknown user ${chatId}`);
          return;
        }
        if (!user.is_dev_user) {
          logger.warn(`Dev server: non-dev user ${chatId} — ignoring`);
          return;
        }

        // Handle commands
        if (text === '/start') {
          await handleStartCommand(msg, bot, adminChatId);
        } else if (text === '/help') {
          await handleHelpCommand(msg, bot, adminChatId);
        } else if (text === '/generate') {
          if (user.status !== 'active') return;
          const workflow = getWorkflow(user, bot);
          workflow.start();
        } else if (text === '/status') {
          await handleStatusCommand(msg, bot);
        } else if (text === '/linkedin') {
          await handleLinkedinCommand(msg, bot);
        } else if (text === '/myaccount') {
          await handleMyaccountCommand(msg, bot);
        } else if (text === '/cancel') {
          if (workflows.has(chatId)) workflows.get(chatId).reset();
          await sendTo(bot, chatId, '❌ Cancelled. Use /generate to start over.');
        } else if (text === '/approve') {
          const wf = workflows.get(chatId);
          if (wf) wf.handleApproval();
        } else if (!text.startsWith('/')) {
          // Free text — workflow input
          if (user.status !== 'active') return;
          if (workflows.has(chatId) && text) {
            await workflows.get(chatId).handleTextInput(text);
          }
        }
      }

      // Handle callback queries
      if (update.callback_query) {
        const query = update.callback_query;
        const chatId = String(query.message.chat.id);
        const user = await db.getUserByChatId(chatId);
        if (!user || user.status !== 'active' || !user.is_dev_user) return;

        await bot.answerCallbackQuery(query.id);
        const workflow = getWorkflow(user, bot);
        const data = query.data;

        if (data.startsWith('mode_')) await workflow.handleModeSelection(data.replace('mode_', ''));
        else if (data.startsWith('topic_')) await workflow.handleTopicSelection(parseInt(data.replace('topic_', ''), 10));
        else if (data.startsWith('idea_')) await workflow.handleIdeaSelection(parseInt(data.replace('idea_', ''), 10));
        else if (data === 'approve') await workflow.handleApproval();
        else if (data === 'edit') await workflow.handleEditRequest();
        else if (data === 'regenerate') await workflow.handleRegenerate();
        else if (data === 'cancel') { workflow.reset(); await sendTo(bot, chatId, '❌ Cancelled.'); }
      }
    }

    return { bot, processDevUpdate };
  }

  // ── Normal (Production) Mode ────────────────────────────────

  if (config.telegram.useWebhook) {
    bot = new TelegramBot(config.telegram.botToken, { webHook: false });
    const webhookUrl = `${config.appUrl}/bot${config.telegram.botToken}`;
    app.post(`/bot${config.telegram.botToken}`, async (req, res) => {
      // Intercept webhook updates for dev user proxying
      const update = req.body;
      const chatId = update?.message?.chat?.id || update?.callback_query?.message?.chat?.id;
      if (chatId) {
        const user = await db.getUserByChatId(String(chatId));
        if (user && user.is_dev_user && config.devServer.url) {
          const proxied = await tryProxyDevUser(user, update, bot);
          if (proxied) {
            res.sendStatus(200);
            return;
          }
        }
      }
      bot.processUpdate(update);
      res.sendStatus(200);
    });
    bot.setWebHook(webhookUrl).then(() => {
      logger.info(`Telegram webhook set: ${config.appUrl}/bot<TOKEN>`);
    }).catch((err) => logger.error('Webhook failed:', err.message));
  } else {
    bot = new TelegramBot(config.telegram.botToken, { polling: true });
  }

  function isAdmin(chatId) { return String(chatId) === String(adminChatId); }

  // ── /start ───────────────────────────────────────────────

  bot.onText(/\/start/, async (msg) => {
    // Check dev user proxy for polling mode
    if (!config.telegram.useWebhook) {
      const user = await db.getUserByChatId(msg.chat.id);
      if (user && user.is_dev_user) {
        const proxied = await tryProxyDevUser(user, { message: msg }, bot);
        if (proxied) return;
      }
    }
    await handleStartCommand(msg, bot, adminChatId);
  });

  // ── /help ────────────────────────────────────────────────

  bot.onText(/\/help/, async (msg) => {
    if (!config.telegram.useWebhook) {
      const user = await db.getUserByChatId(msg.chat.id);
      if (user && user.is_dev_user) {
        const proxied = await tryProxyDevUser(user, { message: msg }, bot);
        if (proxied) return;
      }
    }
    await handleHelpCommand(msg, bot, adminChatId);
  });

  // ── /generate ────────────────────────────────────────────

  bot.onText(/\/generate/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user || user.status !== 'active') return;
    if (user.is_dev_user) {
      const proxied = await tryProxyDevUser(user, { message: msg }, bot);
      if (proxied) return;
    }
    const workflow = getWorkflow(user, bot);
    workflow.start();
  });

  // ── /status ──────────────────────────────────────────────

  bot.onText(/\/status/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    if (user.is_dev_user) {
      const proxied = await tryProxyDevUser(user, { message: msg }, bot);
      if (proxied) return;
    }
    await handleStatusCommand(msg, bot);
  });

  // ── /linkedin ────────────────────────────────────────────

  bot.onText(/\/linkedin/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    if (user.is_dev_user) {
      const proxied = await tryProxyDevUser(user, { message: msg }, bot);
      if (proxied) return;
    }
    await handleLinkedinCommand(msg, bot);
  });

  // ── /myaccount ───────────────────────────────────────────

  bot.onText(/\/myaccount/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    if (user.is_dev_user) {
      const proxied = await tryProxyDevUser(user, { message: msg }, bot);
      if (proxied) return;
    }
    await handleMyaccountCommand(msg, bot);
  });

  // ── /settings ────────────────────────────────────────────

  bot.onText(/\/settings/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    if (user.is_dev_user) {
      const proxied = await tryProxyDevUser(user, { message: msg }, bot);
      if (proxied) return;
    }
    await sendTo(bot, msg.chat.id,
      `⚙️ *Settings:*\n\n` +
      `*Content:*\n/set\\_tone \`<tone>\` — professional, casual, thought-leadership, storytelling\n` +
      `/set\\_schedule \`<cron>\`\n/set\\_timezone \`<tz>\`\n/set\\_orgid \`<id>\` — Post as company page\n/remove\\_orgid — Remove Org ID (post as personal)\n\n` +
      `*Keywords:*\n/keywords — View your keywords\n/add\\_keyword \`<keyword>\` — Add a keyword\n/delete\\_keyword \`<keyword>\` — Remove a keyword\n/reset\\_keywords — Reset to default keywords`
    );
  });

  bot.onText(/\/set_tone (.+)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const tone = match[1].trim();
    const valid = ['professional', 'casual', 'thought-leadership', 'storytelling'];
    if (!valid.includes(tone)) { sendTo(bot, msg.chat.id, `❌ Choose: ${valid.join(', ')}`); return; }
    await db.updateUser(user._id, { content_tone: tone });
    if (workflows.has(String(user.telegram_chat_id))) workflows.get(String(user.telegram_chat_id)).tone = tone;
    sendTo(bot, msg.chat.id, `✅ Tone: *${tone}*`);
  });



  bot.onText(/\/set_schedule (.+)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    await db.updateUser(user._id, { cron_schedule: match[1].trim() });
    sendTo(bot, msg.chat.id, `✅ Schedule: *${match[1].trim()}*`);
  });

  bot.onText(/\/set_timezone (.+)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    await db.updateUser(user._id, { timezone: match[1].trim() });
    sendTo(bot, msg.chat.id, `✅ Timezone: *${match[1].trim()}*`);
  });

  bot.onText(/\/set_orgid(.*)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const orgId = (match[1] || '').trim();
    await db.updateUser(user._id, { linkedin_org_id: orgId });
    sendTo(bot, msg.chat.id, orgId ? `✅ Org ID: *${orgId}* (company page)` : '✅ Org ID cleared (personal profile)');
  });

  bot.onText(/\/remove_orgid/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    await db.updateUser(user._id, { linkedin_org_id: '' });
    sendTo(bot, msg.chat.id, '✅ Org ID removed. Posts will now go to your *personal profile*.');
  });

  // ── /keywords, /add_keyword, /delete_keyword, /reset_keywords ──

  bot.onText(/\/keywords$/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const keywords = await db.getKeywords(user._id);
    if (keywords.length === 0) {
      sendTo(bot, msg.chat.id, '🏷️ *No keywords yet.*\n\nUse /add\\_keyword `<keyword>` to add one.');
    } else {
      sendTo(bot, msg.chat.id, `🏷️ *Your Keywords (${keywords.length}):*\n\n${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}\n\n/add\\_keyword — Add\n/delete\\_keyword — Remove\n/reset\\_keywords — Clear all`);
    }
  });

  bot.onText(/\/add_keyword (.+)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const keyword = match[1].trim();
    if (!keyword) { sendTo(bot, msg.chat.id, '❌ Usage: /add\\_keyword `<keyword>`'); return; }
    await db.addKeyword(user._id, keyword);
    sendTo(bot, msg.chat.id, `✅ Keyword added: *${keyword.toLowerCase()}*`);
  });

  bot.onText(/\/delete_keyword (.+)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const keyword = match[1].trim();
    if (!keyword) { sendTo(bot, msg.chat.id, '❌ Usage: /delete\\_keyword `<keyword>`'); return; }
    await db.deleteKeyword(user._id, keyword);
    sendTo(bot, msg.chat.id, `✅ Keyword removed: *${keyword.toLowerCase()}*`);
  });

  bot.onText(/\/reset_keywords/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const defaults = config.defaults.categories.map(k => k.trim().toLowerCase()).filter(Boolean);
    await db.resetKeywords(user._id, defaults);
    if (defaults.length > 0) {
      sendTo(bot, msg.chat.id, `🔄 Keywords reset to defaults:\\n\\n${defaults.map((k, i) => `${i + 1}. ${k}`).join('\\n')}`);
    } else {
      sendTo(bot, msg.chat.id, '🔄 Keywords reset. No default keywords configured.');
    }
  });

  // ── /history ─────────────────────────────────────────────

  bot.onText(/\/history/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const posts = await db.getPostHistory(user._id, 5);
    if (posts.length === 0) { sendTo(bot, msg.chat.id, '📜 No posts yet. Use /generate!'); return; }

    let text = '📜 *Recent Posts:*\n\n';
    posts.forEach((p, i) => {
      const icon = p.status === 'posted' ? '✅' : p.status === 'failed' ? '❌' : '📝';
      text += `${icon} *${i + 1}.* ${p.topic || 'Untitled'} — ${p.status}\n`;
    });
    sendTo(bot, msg.chat.id, text);
  });

  // ── /cancel, /approve ────────────────────────────────────

  bot.onText(/\/cancel/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    if (user.is_dev_user) {
      const proxied = await tryProxyDevUser(user, { message: msg }, bot);
      if (proxied) return;
    }
    if (workflows.has(String(user.telegram_chat_id))) workflows.get(String(user.telegram_chat_id)).reset();
    sendTo(bot, msg.chat.id, '❌ Cancelled. Use /generate to start over.');
  });

  bot.onText(/\/approve/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    if (user.is_dev_user) {
      const proxied = await tryProxyDevUser(user, { message: msg }, bot);
      if (proxied) return;
    }
    const wf = workflows.get(String(user.telegram_chat_id));
    if (wf) wf.handleApproval();
  });

  // ══════════════════════════════════════════════════════════
  //  ADMIN COMMANDS
  // ══════════════════════════════════════════════════════════

  bot.onText(/\/admin_add (.+)/, async (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const parts = match[1].trim().split(/\s+/);
    const chatId = parts[0];
    const name = parts.slice(1).join(' ') || 'User';

    if (!chatId || isNaN(chatId)) { sendTo(bot, msg.chat.id, '❌ Usage: /admin\\_add `<chatId>` `<name>`'); return; }

    const existing = await db.getUserByChatId(chatId);
    if (existing) { sendTo(bot, msg.chat.id, `⚠️ Already exists: ${existing.name}`); return; }

    const user = await db.createUser({ chatId, name, isAdmin: false });
    sendTo(bot, msg.chat.id, `✅ *${user.name}* added!\nChat ID: \`${user.telegram_chat_id}\`\nDB ID: \`${user._id}\``);
    sendTo(bot, chatId, `🎉 *You've been added to PandaDraft AI!*\n\n/start to begin.\n[Connect LinkedIn](${config.appUrl}/auth/linkedin?user=${user._id})`);
    logger.info(`Admin added user: ${name} (${chatId})`);
  });

  bot.onText(/\/admin_list/, async (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    const users = await db.getAllUsers();
    if (users.length === 0) { sendTo(bot, msg.chat.id, '📋 No users yet.'); return; }

    let text = `📋 *Users (${users.length}):*\n\n`;
    for (const u of users) {
      const li = await db.isLinkedInTokenValid(u._id) ? '🟢' : '🔴';
      const stats = await db.getPostStats(u._id);
      const badge = u.is_admin ? ' 👑' : '';
      const devBadge = u.is_dev_user ? ' 🧪' : '';
      text += `${u.status === 'active' ? '✅' : '⏸️'} *${u.name || 'Unnamed'}*${badge}${devBadge}\n`;
      text += `   \`${u.telegram_chat_id}\` | LI: ${li} | Posts: ${stats.posted || 0}\n\n`;
    }
    sendTo(bot, msg.chat.id, text);
  });

  bot.onText(/\/admin_pause (.+)/, async (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const chatId = match[1].trim();
    const user = await db.getUserByChatId(chatId);
    if (!user) { sendTo(bot, msg.chat.id, `❌ Not found: \`${chatId}\``); return; }
    await db.setUserStatus(chatId, 'paused');
    sendTo(bot, msg.chat.id, `⏸️ *${user.name}* paused.`);
  });

  bot.onText(/\/admin_activate (.+)/, async (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const chatId = match[1].trim();
    const user = await db.getUserByChatId(chatId);
    if (!user) { sendTo(bot, msg.chat.id, `❌ Not found: \`${chatId}\``); return; }
    await db.setUserStatus(chatId, 'active');
    sendTo(bot, msg.chat.id, `✅ *${user.name}* activated.`);
  });

  bot.onText(/\/admin_remove (.+)/, async (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const chatId = match[1].trim();
    const user = await db.getUserByChatId(chatId);
    if (!user) { sendTo(bot, msg.chat.id, `❌ Not found: \`${chatId}\``); return; }
    await db.setUserStatus(chatId, 'disabled');
    workflows.delete(String(chatId));
    sendTo(bot, msg.chat.id, `🗑️ *${user.name}* disabled.`);
  });

  // ── Admin Dev User Management ─────────────────────────────

  bot.onText(/\/admin_dev_add (.+)/, async (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const chatId = match[1].trim();
    const user = await db.getUserByChatId(chatId);
    if (!user) { sendTo(bot, msg.chat.id, `❌ User not found: \`${chatId}\``); return; }
    await db.setDevUser(user._id, true);
    sendTo(bot, msg.chat.id, `🧪 *${user.name}* is now a dev/test user.`);
    logger.info(`Admin set dev user: ${user.name} (${chatId})`);
  });

  bot.onText(/\/admin_dev_remove (.+)/, async (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const chatId = match[1].trim();
    const user = await db.getUserByChatId(chatId);
    if (!user) { sendTo(bot, msg.chat.id, `❌ User not found: \`${chatId}\``); return; }
    await db.setDevUser(user._id, false);
    sendTo(bot, msg.chat.id, `✅ *${user.name}* removed from dev/test mode.`);
    logger.info(`Admin removed dev user: ${user.name} (${chatId})`);
  });

  bot.onText(/\/admin_dev_list/, async (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    const devUsers = await db.getAllDevUsers();
    if (devUsers.length === 0) {
      sendTo(bot, msg.chat.id, '🧪 *No dev/test users.*\n\nUse /admin\\_dev\\_add `<chatId>` to add one.');
      return;
    }
    let text = `🧪 *Dev/Test Users (${devUsers.length}):*\n\n`;
    devUsers.forEach((u, i) => {
      text += `${i + 1}. *${u.name || 'Unnamed'}* — \`${u.telegram_chat_id}\`\n`;
    });

    const alive = await isDevServerAlive();
    text += `\n🖥️ Dev server: ${alive ? '🟢 Online' : '🔴 Offline'}`;
    if (config.devServer.url) {
      text += `\n📡 URL: \`${config.devServer.url}\``;
    }
    sendTo(bot, msg.chat.id, text);
  });

  // ── Callback Queries (inline buttons) ────────────────────

  bot.on('callback_query', async (query) => {
    const chatId = String(query.message.chat.id);
    const user = await db.getUserByChatId(chatId);
    if (!user || user.status !== 'active') return;

    // Proxy dev users (for polling mode — webhook mode handles this in the webhook handler)
    if (!config.telegram.useWebhook && user.is_dev_user) {
      const proxied = await tryProxyDevUser(user, { callback_query: query }, bot);
      if (proxied) {
        await bot.answerCallbackQuery(query.id);
        return;
      }
    }

    await bot.answerCallbackQuery(query.id);
    const workflow = getWorkflow(user, bot);
    const data = query.data;

    if (data.startsWith('mode_')) await workflow.handleModeSelection(data.replace('mode_', ''));
    else if (data.startsWith('topic_')) await workflow.handleTopicSelection(parseInt(data.replace('topic_', ''), 10));
    else if (data.startsWith('idea_')) await workflow.handleIdeaSelection(parseInt(data.replace('idea_', ''), 10));
    else if (data === 'approve') await workflow.handleApproval();
    else if (data === 'edit') await workflow.handleEditRequest();
    else if (data === 'regenerate') await workflow.handleRegenerate();
    else if (data === 'cancel') { workflow.reset(); sendTo(bot, chatId, '❌ Cancelled.'); }
  });

  // ── Free-text (feedback) ─────────────────────────────────

  bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = String(msg.chat.id);

    // ── Onboarding flow for new users ──
    if (onboardingSessions.has(chatId)) {
      // Allow /skip during keywords step and /cancel at any step
      if (msg.text === '/cancel') {
        onboardingSessions.delete(chatId);
        sendTo(bot, chatId, '❌ Onboarding cancelled. Send /start to try again.');
        return;
      }
      if (msg.text.startsWith('/') && msg.text !== '/skip') return;

      const session = onboardingSessions.get(chatId);

      switch (session.step) {
        case 'name':
          session.name = msg.text.trim();
          session.step = 'profession';
          sendTo(bot, chatId, `Nice to meet you, *${session.name}*! 🎉\n\n*What is your current profession?*\n\ne.g. Software Engineer, Marketing Manager, Founder`);
          break;

        case 'profession':
          session.profession = msg.text.trim();
          session.step = 'domain';
          sendTo(bot, chatId, `Great! 💼\n\n*What domain do you want to post about?*\n\ne.g. AI/ML, FinTech, SaaS, Marketing, Healthcare`);
          break;

        case 'domain':
          session.domain = msg.text.trim();
          session.step = 'keywords';
          sendTo(bot, chatId, `Almost done! 🏷️\n\n*Enter keywords you want to focus on* (comma-separated).\n\ne.g. artificial intelligence, startup, remote work\n\nOr send /skip to skip this step.`);
          break;

        case 'keywords': {
          let keywords = [];
          if (msg.text !== '/skip') {
            keywords = msg.text.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
          }

          // Create the user
          const newUser = await db.createUser({
            chatId,
            username: msg.from?.username || null,
            name: session.name,
            isAdmin: false,
          });

          // Update profession, domain, and keywords
          await db.updateUser(newUser._id, {
            profession: session.profession,
            domain: session.domain,
            content_categories: session.domain, // Use domain as default category
          });

          // Add keywords
          for (const kw of keywords.slice(0, 20)) {
            await db.addKeyword(newUser._id, kw);
          }

          onboardingSessions.delete(chatId);

          const kwText = keywords.length > 0 ? keywords.join(', ') : 'None (add later with /add\\_keyword)';
          sendTo(bot, chatId,
            `🎉 *You're all set, ${session.name}!*\n\n` +
            `👤 *Name:* ${session.name}\n💼 *Profession:* ${session.profession}\n🌐 *Domain:* ${session.domain}\n🏷️ *Keywords:* ${kwText}\n\n` +
            `*Next step:* Connect your LinkedIn account 👇\n[🔗 Connect LinkedIn](${config.appUrl}/auth/linkedin?user=${newUser._id})\n\n` +
            `Use /help to see all commands.`
          );
          logger.info(`New user onboarded: ${session.name} (${chatId})`);
          break;
        }
      }
      return;
    }

    // ── Regular free-text (workflow feedback / keyword input) ──
    if (msg.text.startsWith('/')) return;
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user || user.status !== 'active') return;

    // Proxy dev users
    if (user.is_dev_user) {
      const proxied = await tryProxyDevUser(user, { message: msg }, bot);
      if (proxied) return;
    }

    if (workflows.has(chatId) && msg.text) await workflows.get(chatId).handleTextInput(msg.text);
  });

  bot.on('polling_error', (error) => {
    if (!config.telegram.useWebhook) logger.error('Telegram polling error:', error.message);
  });

  logger.info(`Telegram bot started (${config.telegram.useWebhook ? 'webhook' : 'polling'} mode)`);
  return { bot, triggerWorkflowForUser: (user) => triggerWorkflowForUser(user, bot) };
}

// ── Shared Command Handlers ───────────────────────────────────
// Used by both normal mode and dev mode

async function sendTo(bot, chatId, text) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch {
    try { await bot.sendMessage(chatId, text.replace(/[*_`\[\]]/g, '')); } catch (e) {
      logger.error(`Failed to send to ${chatId}`);
    }
  }
}

async function handleStartCommand(msg, bot, adminChatId) {
  const chatId = msg.chat.id;
  const user = await db.getUserByChatId(chatId);

  if (!user) {
    onboardingSessions.set(String(chatId), { step: 'name', name: null, profession: null, domain: null, keywords: [] });
    sendTo(bot, chatId, `👋 *Welcome to PandaDraft AI!*\n\nLet's get you set up. First, *what is your name?*`);
    return;
  }
  if (user.status !== 'active') {
    sendTo(bot, chatId, '⛔ Your account is paused. Contact the admin.');
    return;
  }

  const linkedIn = await db.isLinkedInTokenValid(user._id)
    ? '✅ Connected'
    : `❌ Not connected — [Connect LinkedIn](${config.appUrl}/auth/linkedin?user=${user._id})`;

  const devIndicator = user.is_dev_user ? '\n🧪 *Mode: Dev/Test User*' : '';

  sendTo(bot, chatId,
    `👋 *Welcome, ${user.name || 'there'}!*${devIndicator}\n\n` +
    `LinkedIn: ${linkedIn}\n\n` +
    `🚀 /generate — Create a post\n📊 /status — Status\n🔗 /linkedin — Connect LinkedIn\n` +
    `👤 /myaccount — Account\n⚙️ /settings — Preferences\n🏷️ /keywords — Keywords\n📜 /history — Posts\n❌ /cancel — Cancel\nℹ️ /help — Help`
  );
}

async function handleHelpCommand(msg, bot, adminChatId) {
  const user = await db.getUserByChatId(msg.chat.id);
  if (!user) return;

  let help =
    `📖 *PandaDraft AI Help*\n\n` +
    `*Content:*\n/generate — Start workflow\n/status — Current state\n/approve — Approve post\n/cancel — Cancel\n\n` +
    `*LinkedIn:*\n/linkedin — Connect LinkedIn\n\n` +
    `*Account:*\n/myaccount — Account info\n/settings — Preferences\n/history — Post history\n\n` +
    `*Settings:*\n/set\\_orgid \`<id>\` — Set LinkedIn Org ID (post as company)\n/remove\\_orgid — Remove Org ID (post as personal)\n\n` +
    `*Keywords:*\n/keywords — View keywords\n/add\\_keyword \`<keyword>\` — Add keyword\n/delete\\_keyword \`<keyword>\` — Remove keyword\n/reset\\_keywords — Clear all keywords`;

  const isAdmin = String(msg.chat.id) === String(adminChatId);
  if (isAdmin) {
    help += `\n\n*Admin:*\n/admin\\_add \`<chatId>\` \`<name>\`\n/admin\\_list\n/admin\\_pause \`<chatId>\`\n/admin\\_activate \`<chatId>\`\n/admin\\_remove \`<chatId>\``;
    help += `\n\n*Dev Users:*\n/admin\\_dev\\_add \`<chatId>\` — Flag as dev user\n/admin\\_dev\\_remove \`<chatId>\` — Remove dev flag\n/admin\\_dev\\_list — List dev users + server status`;
  }
  sendTo(bot, msg.chat.id, help);
}

async function handleStatusCommand(msg, bot) {
  const user = await db.getUserByChatId(msg.chat.id);
  if (!user) return;
  const workflow = workflows.get(String(user.telegram_chat_id));
  const state = workflow ? workflow.getState() : 'IDLE';
  const msgs = {
    IDLE: '😴 No active workflow. Use /generate.',
    AWAITING_MODE: '🚀 Choose a mode: auto-generate or enter keyword.',
    AWAITING_KEYWORD: '✍️ Waiting for you to type a keyword.',
    TOPICS_SENT: '📋 Waiting for topic selection.',
    IDEAS_SENT: '💡 Waiting for idea selection.',
    DRAFT_SENT: '📄 Draft ready — approve, edit, or regenerate.',
    AWAITING_FEEDBACK: '✏️ Waiting for your feedback.',
    POSTED: '✅ Last post published!',
  };
  sendTo(bot, msg.chat.id, `📊 *Status:* ${state}\n\n${msgs[state] || ''}`);
}

async function handleLinkedinCommand(msg, bot) {
  const user = await db.getUserByChatId(msg.chat.id);
  if (!user) return;
  const valid = await db.isLinkedInTokenValid(user._id);
  if (valid) {
    sendTo(bot, msg.chat.id, '✅ LinkedIn is connected.');
  } else {
    sendTo(bot, msg.chat.id, `🔗 *Connect LinkedIn:*\n\n[Authorize](${config.appUrl}/auth/linkedin?user=${user._id})`);
  }
}

async function handleMyaccountCommand(msg, bot) {
  const user = await db.getUserByChatId(msg.chat.id);
  if (!user) return;
  const stats = await db.getPostStats(user._id);
  const li = await db.isLinkedInTokenValid(user._id) ? '✅' : '❌';
  const kws = user.keywords && user.keywords.length > 0 ? user.keywords.join(', ') : 'None';
  const devLabel = user.is_dev_user ? '🧪 Dev/Test' : '🌐 Production';
  sendTo(bot, msg.chat.id,
    `👤 *Account*\n\n*Name:* ${user.name || '—'}\n*Profession:* ${user.profession || '—'}\n*Domain:* ${user.domain || '—'}\n*Status:* ${user.status}\n*Mode:* ${devLabel}\n*LinkedIn:* ${li}\n` +
    `*Org ID:* ${user.linkedin_org_id || 'Personal profile'}\n*Tone:* ${user.content_tone}\n` +
    `*Keywords:* ${kws}\n*Schedule:* ${user.cron_schedule} (${user.timezone})\n\n` +
    `📊 ${stats.posted || 0} posted, ${stats.total || 0} total`
  );
}

module.exports = { createTelegramBot };
