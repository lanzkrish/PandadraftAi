# AutoDraft AI 🤖

AI-powered LinkedIn auto-poster with a Telegram bot interface.

**How it works:** Every day, the bot generates topic suggestions via AI → you pick one on Telegram → AI drafts the post → you approve or edit → it posts to LinkedIn. Fully automated, fully in your control.

---

## Quick Start (Local Development)

```bash
npm install
cp .env.example .env   # Fill in your credentials
npm start
```

Visit `http://localhost:3000/auth/linkedin` to authorize LinkedIn.
Open Telegram → send `/generate` to create your first post.

---

## Deploy to Render 🚀

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Create a Render Web Service
1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`

### 3. Set Environment Variables on Render
In the Render dashboard → **Environment** tab, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `APP_URL` | `https://your-app-name.onrender.com` |
| `TELEGRAM_BOT_TOKEN` | Your bot token |
| `TELEGRAM_CHAT_ID` | Your chat ID |
| `GEMINI_API_KEY` | Your Gemini key |
| `LINKEDIN_CLIENT_ID` | Your LinkedIn app client ID |
| `LINKEDIN_CLIENT_SECRET` | Your LinkedIn app client secret |
| `LINKEDIN_REDIRECT_URI` | `https://your-app-name.onrender.com/auth/linkedin/callback` |

> ⚠️ **Update LinkedIn Developer Portal too** — add `https://your-app-name.onrender.com/auth/linkedin/callback` as an Authorized Redirect URL.

### 4. Authorize LinkedIn
Visit `https://your-app-name.onrender.com/auth/linkedin` → log in → approve.

Then check the Render **Logs** tab — copy the `LINKEDIN_TOKENS` JSON and paste it as a new env var `LINKEDIN_TOKENS` on Render so tokens persist across deploys.

### 5. Done! 🎉
Open Telegram → `/generate` to test.

---

## Architecture

```
                  ┌─ Polling (dev)
Telegram Bot ─────┤
                  └─ Webhook (production)
                        │
                    Express Server ─── /health (keep-alive)
                        │              /auth/linkedin (OAuth)
                    Workflow Engine
                        │
              ┌─────────┼─────────┐
           AI Service   │    LinkedIn API
          (Gemini)      │    (OAuth + Post)
                     Scheduler
                    (node-cron)
```

## Commands

| Command | Description |
|---|---|
| `/start` | Welcome message |
| `/generate` | Start a post workflow |
| `/status` | Current workflow state |
| `/linkedin` | LinkedIn auth status |
| `/cancel` | Cancel current workflow |
| `/approve` | Approve pending post |
| `/help` | Show help |

## Tech Stack
- **Runtime:** Node.js
- **AI:** Google Gemini 2.0 Flash (with fallback models)
- **Bot:** Telegram Bot API (polling + webhook)
- **Posting:** LinkedIn UGC API
- **Scheduler:** node-cron
- **Hosting:** Render (or any Node.js host)
