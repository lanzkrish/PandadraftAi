const mongoose = require('mongoose');
const config = require('./src/config');
const { User } = require('./src/db');
const argon2 = require('argon2');
const crypto = require('crypto');
require('dotenv').config();

const PEPPER = process.env.PEPPER || 'default_pepper';

async function testRegistration() {
  try {
    await mongoose.connect(config.database.uri);

    const email = 'test_register_' + Date.now() + '@example.com';
    const password = 'password123';
    const name = 'Test User';
    const plan = 'Free';

    console.log("Testing Registration with email:", email);

    const passwordWithPepper = password + PEPPER;
    const passwordHash = await argon2.hash(passwordWithPepper, {
      type: argon2.argon2id,
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const user = await User.create({
      name,
      email,
      password_hash: passwordHash,
      is_email_verified: false,
      email_verification_token: verificationTokenHash,
      linkedin_profile_url: null,
      status: 'active',
      content_categories: 'Startups, SaaS',
      content_tone: 'professional',
      cron_schedule: '0 9 * * *',
      timezone: 'Asia/Kolkata',
      pending_plan: plan && plan !== 'Free' ? plan : null,
      plan: 'Free',
      credits: 2,
      max_credits: 2,
    });

    console.log("Registration success:", user._id);
  } catch (error) {
    console.error("Registration Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

testRegistration();
