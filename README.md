# AutoDraft AI 🤖

AI-powered LinkedIn auto-poster with a Telegram bot interface.

**How it works:** Every day, the bot generates topic suggestions via AI → you pick one on Telegram → AI drafts the post → you approve or edit → it posts to LinkedIn. Fully automated, fully in your control.

## Quick Start

### 1. Install Dependencies
```bash
cd /Users/dhananjaysahoo/Startup/AutodraftAi
npm install
```

### 2. Set Up Credentials

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

You'll need:

| Credential | How to Get |
|---|---|
| **Telegram Bot Token** | Message [@BotFather](https://t.me/BotFather) → `/newbot` → copy token |
| **Telegram Chat ID** | Message [@userinfobot](https://t.me/userinfobot) → it replies with your chat ID |
| **Gemini API Key** | [Google AI Studio](https://aistudio.google.com/apikey) → Create API key |
| **LinkedIn Client ID/Secret** | [LinkedIn Developer Portal](https://www.linkedin.com/developers/) → Create App → Auth tab |

> **LinkedIn App Setup:** When creating your LinkedIn app, add `http://localhost:3000/auth/linkedin/callback` as an Authorized Redirect URL. Request the `Sign In with LinkedIn using OpenID Connect` and `Share on LinkedIn` products.

### 3. Start the App
```bash
npm start
```

### 4. Authorize LinkedIn
Open in your browser:
```
http://localhost:3000/auth/linkedin
```

### 5. Use It!
Open Telegram → find your bot → send `/generate` to create your first post.

## Commands

| Command | Description |
|---|---|
| `/start` | Welcome message |
| `/generate` | Manually start a post workflow |
| `/status` | Check current workflow state |
| `/linkedin` | Check LinkedIn connection |
| `/cancel` | Cancel current workflow |
| `/approve` | Approve pending post |
| `/help` | Show help |

## Architecture

```
Cron (9 AM daily) → AI generates topics → Telegram shows topics
→ User picks topic → AI generates ideas → Telegram shows ideas
→ User picks idea → AI drafts post → Telegram shows draft
→ User approves/edits → Posts to LinkedIn
```

## Tech Stack
- **Runtime:** Node.js
- **AI:** Google Gemini 2.0 Flash
- **Bot:** Telegram Bot API
- **Posting:** LinkedIn UGC API
- **Scheduler:** node-cron
