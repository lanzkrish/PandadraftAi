require('dotenv').config();
const { User, initDatabase, closeDatabase } = require('./src/db');
const argon2 = require('argon2');

const PEPPER = process.env.PEPPER || 'default_pepper';

async function main() {
  await initDatabase(process.env.MONGODB_URI);
  
  const users = await User.find({ email: { $exists: true, $ne: null } }).sort({ createdAt: -1 }).limit(10);
  console.log(`Found ${users.length} users with email`);
  console.log('--- Latest Users with Email ---');
  for (const user of users) {
    console.log(`Email: ${user.email}`);
    console.log(`Verified: ${user.is_email_verified}`);
    console.log(`Has Hash: ${!!user.password_hash}`);
    console.log(`Created At: ${user.createdAt}`);
    console.log('--------------------');
  }

  await closeDatabase();
}

main().catch(console.error);
