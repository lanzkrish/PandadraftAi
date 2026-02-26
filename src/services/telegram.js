const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const logger = require('../utils/logger');
const db = require('../db');
const { PostWorkflow } = require('../workflow/postWorkflow');

const workflows = new Map();
const onboardingSessions = new Map(); // chatId -> { step, name, profession, domain, keywords }

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

function createTelegramBot(app) {
  let bot;
  const adminChatId = config.telegram.adminChatId;

  if (config.telegram.useWebhook) {
    bot = new TelegramBot(config.telegram.botToken, { webHook: false });
    const webhookUrl = `${config.appUrl}/bot${config.telegram.botToken}`;
    app.post(`/bot${config.telegram.botToken}`, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
    bot.setWebHook(webhookUrl).then(() => {
      logger.info(`Telegram webhook set: ${config.appUrl}/bot<TOKEN>`);
    }).catch((err) => logger.error('Webhook failed:', err.message));
  } else {
    bot = new TelegramBot(config.telegram.botToken, { polling: true });
  }

  function isAdmin(chatId) { return String(chatId) === String(adminChatId); }

  async function sendTo(chatId, text) {
    try {
      await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch {
      try { await bot.sendMessage(chatId, text.replace(/[*_`\[\]]/g, '')); } catch (e) {
        logger.error(`Failed to send to ${chatId}`);
      }
    }
  }

  // ── /start ───────────────────────────────────────────────

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await db.getUserByChatId(chatId);

    if (!user) {
      // Start onboarding flow for new users
      onboardingSessions.set(String(chatId), { step: 'name', name: null, profession: null, domain: null, keywords: [] });
      sendTo(chatId, `👋 *Welcome to AutoDraft AI!*\n\nLet's get you set up. First, *what is your name?*`);
      return;
    }
    if (user.status !== 'active') {
      sendTo(chatId, '⛔ Your account is paused. Contact the admin.');
      return;
    }

    const linkedIn = await db.isLinkedInTokenValid(user._id)
      ? '✅ Connected'
      : `❌ Not connected — [Connect LinkedIn](${config.appUrl}/auth/linkedin?user=${user._id})`;

    sendTo(chatId,
      `👋 *Welcome, ${user.name || 'there'}!*\n\n` +
      `LinkedIn: ${linkedIn}\n\n` +
      `🚀 /generate — Create a post\n📊 /status — Status\n🔗 /linkedin — Connect LinkedIn\n` +
      `👤 /myaccount — Account\n⚙️ /settings — Preferences\n🏷️ /keywords — Keywords\n📜 /history — Posts\n❌ /cancel — Cancel\nℹ️ /help — Help`
    );
  });

  // ── /help ────────────────────────────────────────────────

  bot.onText(/\/help/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;

    let help =
      `📖 *AutoDraft AI Help*\n\n` +
      `*Content:*\n/generate — Start workflow\n/status — Current state\n/approve — Approve post\n/cancel — Cancel\n\n` +
      `*LinkedIn:*\n/linkedin — Connect LinkedIn\n\n` +
      `*Account:*\n/myaccount — Account info\n/settings — Preferences\n/history — Post history\n\n` +
      `*Settings:*\n/set\\_orgid \`<id>\` — Set LinkedIn Org ID (post as company)\n/remove\\_orgid — Remove Org ID (post as personal)\n\n` +
      `*Keywords:*\n/keywords — View keywords\n/add\\_keyword \`<keyword>\` — Add keyword\n/delete\\_keyword \`<keyword>\` — Remove keyword\n/reset\\_keywords — Clear all keywords`;

    if (isAdmin(msg.chat.id)) {
      help += `\n\n*Admin:*\n/admin\\_add \`<chatId>\` \`<name>\`\n/admin\\_list\n/admin\\_pause \`<chatId>\`\n/admin\\_activate \`<chatId>\`\n/admin\\_remove \`<chatId>\``;
    }
    sendTo(msg.chat.id, help);
  });

  // ── /generate ────────────────────────────────────────────

  bot.onText(/\/generate/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user || user.status !== 'active') return;
    const workflow = getWorkflow(user, bot);
    workflow.start();
  });

  // ── /status ──────────────────────────────────────────────

  bot.onText(/\/status/, async (msg) => {
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
    sendTo(msg.chat.id, `📊 *Status:* ${state}\n\n${msgs[state] || ''}`);
  });

  // ── /linkedin ────────────────────────────────────────────

  bot.onText(/\/linkedin/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const valid = await db.isLinkedInTokenValid(user._id);
    if (valid) {
      sendTo(msg.chat.id, '✅ LinkedIn is connected.');
    } else {
      sendTo(msg.chat.id, `🔗 *Connect LinkedIn:*\n\n[Authorize](${config.appUrl}/auth/linkedin?user=${user._id})`);
    }
  });

  // ── /myaccount ───────────────────────────────────────────

  bot.onText(/\/myaccount/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const stats = await db.getPostStats(user._id);
    const li = await db.isLinkedInTokenValid(user._id) ? '✅' : '❌';
    const kws = user.keywords && user.keywords.length > 0 ? user.keywords.join(', ') : 'None';
    sendTo(msg.chat.id,
      `👤 *Account*\n\n*Name:* ${user.name || '—'}\n*Profession:* ${user.profession || '—'}\n*Domain:* ${user.domain || '—'}\n*Status:* ${user.status}\n*LinkedIn:* ${li}\n` +
      `*Org ID:* ${user.linkedin_org_id || 'Personal profile'}\n*Tone:* ${user.content_tone}\n` +
      `*Keywords:* ${kws}\n*Schedule:* ${user.cron_schedule} (${user.timezone})\n\n` +
      `📊 ${stats.posted || 0} posted, ${stats.total || 0} total`
    );
  });

  // ── /settings ────────────────────────────────────────────

  bot.onText(/\/settings/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    sendTo(msg.chat.id,
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
    if (!valid.includes(tone)) { sendTo(msg.chat.id, `❌ Choose: ${valid.join(', ')}`); return; }
    await db.updateUser(user._id, { content_tone: tone });
    if (workflows.has(String(user.telegram_chat_id))) workflows.get(String(user.telegram_chat_id)).tone = tone;
    sendTo(msg.chat.id, `✅ Tone: *${tone}*`);
  });



  bot.onText(/\/set_schedule (.+)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    await db.updateUser(user._id, { cron_schedule: match[1].trim() });
    sendTo(msg.chat.id, `✅ Schedule: *${match[1].trim()}*`);
  });

  bot.onText(/\/set_timezone (.+)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    await db.updateUser(user._id, { timezone: match[1].trim() });
    sendTo(msg.chat.id, `✅ Timezone: *${match[1].trim()}*`);
  });

  bot.onText(/\/set_orgid(.*)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const orgId = (match[1] || '').trim();
    await db.updateUser(user._id, { linkedin_org_id: orgId });
    sendTo(msg.chat.id, orgId ? `✅ Org ID: *${orgId}* (company page)` : '✅ Org ID cleared (personal profile)');
  });

  bot.onText(/\/remove_orgid/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    await db.updateUser(user._id, { linkedin_org_id: '' });
    sendTo(msg.chat.id, '✅ Org ID removed. Posts will now go to your *personal profile*.');
  });

  // ── /keywords, /add_keyword, /delete_keyword, /reset_keywords ──

  bot.onText(/\/keywords$/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const keywords = await db.getKeywords(user._id);
    if (keywords.length === 0) {
      sendTo(msg.chat.id, '🏷️ *No keywords yet.*\n\nUse /add\\_keyword `<keyword>` to add one.');
    } else {
      sendTo(msg.chat.id, `🏷️ *Your Keywords (${keywords.length}):*\n\n${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}\n\n/add\\_keyword — Add\n/delete\\_keyword — Remove\n/reset\\_keywords — Clear all`);
    }
  });

  bot.onText(/\/add_keyword (.+)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const keyword = match[1].trim();
    if (!keyword) { sendTo(msg.chat.id, '❌ Usage: /add\\_keyword `<keyword>`'); return; }
    await db.addKeyword(user._id, keyword);
    sendTo(msg.chat.id, `✅ Keyword added: *${keyword.toLowerCase()}*`);
  });

  bot.onText(/\/delete_keyword (.+)/, async (msg, match) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const keyword = match[1].trim();
    if (!keyword) { sendTo(msg.chat.id, '❌ Usage: /delete\\_keyword `<keyword>`'); return; }
    await db.deleteKeyword(user._id, keyword);
    sendTo(msg.chat.id, `✅ Keyword removed: *${keyword.toLowerCase()}*`);
  });

  bot.onText(/\/reset_keywords/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const defaults = config.defaults.categories.map(k => k.trim().toLowerCase()).filter(Boolean);
    await db.resetKeywords(user._id, defaults);
    if (defaults.length > 0) {
      sendTo(msg.chat.id, `🔄 Keywords reset to defaults:\\n\\n${defaults.map((k, i) => `${i + 1}. ${k}`).join('\\n')}`);
    } else {
      sendTo(msg.chat.id, '🔄 Keywords reset. No default keywords configured.');
    }
  });

  // ── /history ─────────────────────────────────────────────

  bot.onText(/\/history/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    const posts = await db.getPostHistory(user._id, 5);
    if (posts.length === 0) { sendTo(msg.chat.id, '📜 No posts yet. Use /generate!'); return; }

    let text = '📜 *Recent Posts:*\n\n';
    posts.forEach((p, i) => {
      const icon = p.status === 'posted' ? '✅' : p.status === 'failed' ? '❌' : '📝';
      text += `${icon} *${i + 1}.* ${p.topic || 'Untitled'} — ${p.status}\n`;
    });
    sendTo(msg.chat.id, text);
  });

  // ── /cancel, /approve ────────────────────────────────────

  bot.onText(/\/cancel/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
    if (workflows.has(String(user.telegram_chat_id))) workflows.get(String(user.telegram_chat_id)).reset();
    sendTo(msg.chat.id, '❌ Cancelled. Use /generate to start over.');
  });

  bot.onText(/\/approve/, async (msg) => {
    const user = await db.getUserByChatId(msg.chat.id);
    if (!user) return;
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

    if (!chatId || isNaN(chatId)) { sendTo(msg.chat.id, '❌ Usage: /admin\\_add `<chatId>` `<name>`'); return; }

    const existing = await db.getUserByChatId(chatId);
    if (existing) { sendTo(msg.chat.id, `⚠️ Already exists: ${existing.name}`); return; }

    const user = await db.createUser({ chatId, name, isAdmin: false });
    sendTo(msg.chat.id, `✅ *${user.name}* added!\nChat ID: \`${user.telegram_chat_id}\`\nDB ID: \`${user._id}\``);
    sendTo(chatId, `🎉 *You've been added to AutoDraft AI!*\n\n/start to begin.\n[Connect LinkedIn](${config.appUrl}/auth/linkedin?user=${user._id})`);
    logger.info(`Admin added user: ${name} (${chatId})`);
  });

  bot.onText(/\/admin_list/, async (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    const users = await db.getAllUsers();
    if (users.length === 0) { sendTo(msg.chat.id, '📋 No users yet.'); return; }

    let text = `📋 *Users (${users.length}):*\n\n`;
    for (const u of users) {
      const li = await db.isLinkedInTokenValid(u._id) ? '🟢' : '🔴';
      const stats = await db.getPostStats(u._id);
      const badge = u.is_admin ? ' 👑' : '';
      text += `${u.status === 'active' ? '✅' : '⏸️'} *${u.name || 'Unnamed'}*${badge}\n`;
      text += `   \`${u.telegram_chat_id}\` | LI: ${li} | Posts: ${stats.posted || 0}\n\n`;
    }
    sendTo(msg.chat.id, text);
  });

  bot.onText(/\/admin_pause (.+)/, async (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const chatId = match[1].trim();
    const user = await db.getUserByChatId(chatId);
    if (!user) { sendTo(msg.chat.id, `❌ Not found: \`${chatId}\``); return; }
    await db.setUserStatus(chatId, 'paused');
    sendTo(msg.chat.id, `⏸️ *${user.name}* paused.`);
  });

  bot.onText(/\/admin_activate (.+)/, async (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const chatId = match[1].trim();
    const user = await db.getUserByChatId(chatId);
    if (!user) { sendTo(msg.chat.id, `❌ Not found: \`${chatId}\``); return; }
    await db.setUserStatus(chatId, 'active');
    sendTo(msg.chat.id, `✅ *${user.name}* activated.`);
  });

  bot.onText(/\/admin_remove (.+)/, async (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const chatId = match[1].trim();
    const user = await db.getUserByChatId(chatId);
    if (!user) { sendTo(msg.chat.id, `❌ Not found: \`${chatId}\``); return; }
    await db.setUserStatus(chatId, 'disabled');
    workflows.delete(String(chatId));
    sendTo(msg.chat.id, `🗑️ *${user.name}* disabled.`);
  });

  // ── Callback Queries (inline buttons) ────────────────────

  bot.on('callback_query', async (query) => {
    const chatId = String(query.message.chat.id);
    const user = await db.getUserByChatId(chatId);
    if (!user || user.status !== 'active') return;

    await bot.answerCallbackQuery(query.id);
    const workflow = getWorkflow(user, bot);
    const data = query.data;

    if (data.startsWith('mode_')) await workflow.handleModeSelection(data.replace('mode_', ''));
    else if (data.startsWith('topic_')) await workflow.handleTopicSelection(parseInt(data.replace('topic_', ''), 10));
    else if (data.startsWith('idea_')) await workflow.handleIdeaSelection(parseInt(data.replace('idea_', ''), 10));
    else if (data === 'approve') await workflow.handleApproval();
    else if (data === 'edit') await workflow.handleEditRequest();
    else if (data === 'regenerate') await workflow.handleRegenerate();
    else if (data === 'cancel') { workflow.reset(); sendTo(chatId, '❌ Cancelled.'); }
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
        sendTo(chatId, '❌ Onboarding cancelled. Send /start to try again.');
        return;
      }
      if (msg.text.startsWith('/') && msg.text !== '/skip') return;

      const session = onboardingSessions.get(chatId);

      switch (session.step) {
        case 'name':
          session.name = msg.text.trim();
          session.step = 'profession';
          sendTo(chatId, `Nice to meet you, *${session.name}*! 🎉\n\n*What is your current profession?*\n\ne.g. Software Engineer, Marketing Manager, Founder`);
          break;

        case 'profession':
          session.profession = msg.text.trim();
          session.step = 'domain';
          sendTo(chatId, `Great! 💼\n\n*What domain do you want to post about?*\n\ne.g. AI/ML, FinTech, SaaS, Marketing, Healthcare`);
          break;

        case 'domain':
          session.domain = msg.text.trim();
          session.step = 'keywords';
          sendTo(chatId, `Almost done! 🏷️\n\n*Enter keywords you want to focus on* (comma-separated).\n\ne.g. artificial intelligence, startup, remote work\n\nOr send /skip to skip this step.`);
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
          sendTo(chatId,
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
    if (workflows.has(chatId) && msg.text) await workflows.get(chatId).handleTextInput(msg.text);
  });

  bot.on('polling_error', (error) => {
    if (!config.telegram.useWebhook) logger.error('Telegram polling error:', error.message);
  });

  logger.info(`Telegram bot started (${config.telegram.useWebhook ? 'webhook' : 'polling'} mode)`);
  return { bot, triggerWorkflowForUser: (user) => triggerWorkflowForUser(user, bot) };
}

module.exports = { createTelegramBot };
