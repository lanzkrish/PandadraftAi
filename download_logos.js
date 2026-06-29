const fs = require('fs');
const https = require('https');
const path = require('path');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  await downloadFile(
    'https://storage.googleapis.com/macaulay-api-storage-dir/uploads/f8dc1c74-a696-419b-ab29-b69512686ad7.png',
    path.join(__dirname, 'client/public/logo-icon.png')
  );
  await downloadFile(
    'https://storage.googleapis.com/macaulay-api-storage-dir/uploads/53adcf3b-fba0-4240-a359-548c783dbce0.png',
    path.join(__dirname, 'client/public/logo-text.png')
  );
  console.log('Logos downloaded');
}

run().catch(console.error);
