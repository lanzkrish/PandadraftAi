require('dotenv').config();
const { User, initDatabase, closeDatabase } = require('./src/db');
const argon2 = require('argon2');

const PEPPER = process.env.PEPPER || 'default_pepper';

async function main() {
  await initDatabase(process.env.MONGODB_URI);
  
  const email = 'kanha94377@gmail.com';
  const newPassword = 'password123';
  
  const user = await User.findOne({ email });
  if (user) {
    const passwordWithPepper = newPassword + PEPPER;
    const passwordHash = await argon2.hash(passwordWithPepper, {
      type: argon2.argon2id,
    });
    
    user.password_hash = passwordHash;
    await user.save();
    console.log(`Password for ${email} has been reset to: ${newPassword}`);
  } else {
    console.log(`User ${email} not found.`);
  }

  await closeDatabase();
}

main().catch(console.error);
