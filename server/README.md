# TacoDraft AI 🤖

AI-powered LinkedIn auto-poster with Telegram bot interface. Supports **multiple users** with per-user schedules, preferences, and LinkedIn accounts.

---

## Quick Start

```bash
npm install
cp .env.example .env   # Fill in credentials
npm start
```

Your admin account is auto-registered on first startup. Open Telegram → `/start`.

---

## Deploy to Render 🚀

1. Push to GitHub
2. **New Web Service** on [render.com](https://render.com) → connect repo
3. Build: `npm install` | Start: `npm start` | Health Check: `/health`
4. Set env vars:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `APP_URL` | `https://your-app.onrender.com` |
| `TELEGRAM_BOT_TOKEN` | Bot token |
| `ADMIN_CHAT_ID` | Your Telegram chat ID |
| `GEMINI_API_KEY` | Gemini key |
| `LINKEDIN_CLIENT_ID` | LinkedIn app client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn app client secret |
| `LINKEDIN_REDIRECT_URI` | `https://your-app.onrender.com/auth/linkedin/callback` |
| `MONGODB_URI` | `mongodb+srv://...` |

---

## Architecture

```
Telegram Bot ─── Router (by chat ID)
                    │
              ┌─────┼──────────┐
           User 1  User 2   User N   (independent workflows)
              │
         ┌────┼────┐
      AI Service   LinkedIn API
       (Gemini)    (per-user OAuth)
              │
         Scheduler (per-user cron)
              │
         MongoDB Atlas
     (users, tokens, history)
```

## Commands

### User Commands

| Command | Description |
|---|---|
| `/start` | Welcome + status |
| `/generate` | Start a post workflow |
| `/status` | Current workflow state |
| `/linkedin` | Connect/check LinkedIn |
| `/myaccount` | Account info & stats |
| `/settings` | View setting commands |
| `/history` | Last 5 posts |
| `/cancel` | Cancel current workflow |
| `/approve` | Approve pending post |
| `/help` | Show all commands |

### Settings Commands

| Command | Description |
|---|---|
| `/set_tone <tone>` | `professional`, `casual`, `thought-leadership`, `storytelling` |
| `/set_categories <cats>` | e.g. `tech,ai,startups` |
| `/set_schedule <cron>` | e.g. `0 10 * * *` (10 AM daily) |
| `/set_timezone <tz>` | e.g. `US/Eastern`, `Asia/Kolkata` |
| `/set_orgid <id>` | LinkedIn org ID (company page) or empty for personal |

### Admin Commands

| Command | Description |
|---|---|
| `/admin_add <chatId> <name>` | Register a new user |
| `/admin_list` | List all users with status & stats |
| `/admin_pause <chatId>` | Pause a user's account |
| `/admin_activate <chatId>` | Reactivate a user |
| `/admin_remove <chatId>` | Disable a user |

## Tech Stack

- **Runtime:** Node.js
- **Database:** MongoDB Atlas (Mongoose)
- **AI:** Google Gemini 2.0 Flash (with fallback models)
- **Bot:** Telegram Bot API (polling + webhook)
- **Posting:** LinkedIn UGC API (personal + org pages)
- **Scheduler:** node-cron (per-user)
- **Hosting:** Render
