# PandaDraft AI (AutodraftAi) 🐼🚀

PandaDraft AI is an intelligent, automated content creation and scheduling platform designed specifically for LinkedIn. It empowers professionals, creators, and SaaS founders to maintain a consistent, high-quality presence on LinkedIn without spending hours writing and formatting posts.

## 🌟 What is it?
PandaDraft AI is your personal AI ghostwriter and social media manager. It takes your raw ideas, goals, and target audiences, and transforms them into highly engaging, viral-ready LinkedIn posts. Whether you want to drive engagement, generate leads, or establish thought leadership, PandaDraft crafts the perfect message in your desired tone.

## ⚙️ How it Works
1. **Connect Your Profile**: Securely link your LinkedIn account (personal or company page) via our dashboard.
2. **Setup Your Preferences**: Define your target audience (e.g., "SaaS Founders") and preferred tone of voice (Professional, Conversational, Witty, etc.).
3. **Generate Content**: Enter a simple topic. The AI instantly generates a hook and a full post optimized for LinkedIn's algorithm.
4. **Publish or Schedule**: 
   - **Post Now**: Send the post directly to your LinkedIn feed with a single click.
   - **Schedule**: Pick a specific date and time, and our background worker will automatically publish it for you.
   - **Autopilot (Telegram)**: Use our integrated Telegram bot to trigger automated daily posts based on your custom cron schedule.

## 💡 How it Helps You
- **Saves Time**: Turn a 30-minute writing task into a 10-second generation process.
- **Beats Writer's Block**: Never stare at a blank page again. Just provide a topic and let the AI do the heavy lifting.
- **Maintains Consistency**: With automated scheduling and background cron jobs, your LinkedIn stays active even when you are asleep.
- **Drives Engagement**: The AI is trained to write scroll-stopping hooks and engaging formatting that naturally performs well on LinkedIn.

## 🛠️ Technology Stack
PandaDraft AI is built using a modern, scalable JavaScript ecosystem:

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) & React
- **Styling**: Tailwind CSS (for a sleek, responsive, and modern UI)
- **Architecture**: Component-based dashboard with dynamic state management.

### Backend
- **Server**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM for schemas like `User` and `PostHistory`)
- **Authentication**: JWT-based auth & LinkedIn OAuth 2.0 Integration
- **Scheduling**: `node-cron` for handling multi-user automated posting and manual delayed scheduling.
- **Integrations**: `node-telegram-bot-api` for the autopilot Telegram bot.
- **AI Engine**: Local LLM integration (configured via `.env` for flexibility and privacy) to generate ideas and posts dynamically.

---
*Built to help you write less and reach more.*
