const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname);
const files = [
  "README.md",
  "server/src/services/linkedin.js",
  "client/src/app/layout.tsx",
  "client/src/app/page.tsx",
  "client/src/app/checkout/page.tsx",
  "client/src/app/(auth)/signup/page.tsx",
  "client/src/components/brand/Logo.tsx",
  "client/src/components/dashboard/AnalyticsView.tsx",
  "client/src/components/dashboard/SubscribeView.tsx",
  "client/src/components/layout/TopNav.tsx",
  "client/src/app/demo/page.tsx",
  "server/src/services/telegram.js",
  "server/src/routes/auth.js",
  "server/src/utils/email.js",
  "client/dashboard.html",
  "server/src/utils/logger.js",
  "server/test-email.js",
  "server/src/index.js",
  "server/test-publish.js",
  "server/package.json",
  "server/package-lock.json",
  "server/README.md",
  "server/render.yaml"
];

for (const file of files) {
  const filePath = path.join(directoryPath, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/PandaDraft/g, 'TacoDraft');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', file);
  }
}
