const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.join(__dirname, 'src');

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We will find lines defining apiUrl or API_URL and replace them.
    // e.g. const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
    // We just replace process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005" with ""
    
    content = content.replace(/process\.env\.NEXT_PUBLIC_API_URL\s*\|\|\s*['"]http:\/\/localhost:5005['"]/g, '"" /* Proxy rewrite in next.config.ts handles backend routing */');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
});
