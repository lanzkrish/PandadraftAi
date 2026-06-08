const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const crypto = require('crypto');
const { Resend } = require('resend');
const { User } = require('../db');
const { generateToken, requireAuth } = require('../utils/auth');
const logger = require('../utils/logger');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const PEPPER = process.env.PEPPER || 'default_pepper';

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, linkedinProfile } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password with Argon2. The salt is handled automatically. We append the PEPPER to the password before hashing.
    const passwordWithPepper = password + PEPPER;
    const passwordHash = await argon2.hash(passwordWithPepper, {
      type: argon2.argon2id,
    });

    const user = await User.create({
      name,
      email,
      password_hash: passwordHash,
      linkedin_profile_url: linkedinProfile || null,
      status: 'active',
      // Provide defaults for settings handled by the backend
      content_categories: 'Startups, SaaS',
      content_tone: 'professional',
      cron_schedule: '0 9 * * *',
      timezone: 'Asia/Kolkata',
    });

    const token = generateToken(user._id);

    // Set HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send Welcome Email
    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'Autodraft <noreply@autodraft.ai>',
          to: [email],
          subject: 'Welcome to Autodraft!',
          html: `<p>Hi ${name},</p><p>Welcome to Autodraft. Your account has been created successfully.</p>`,
        });
      }
    } catch (emailError) {
      logger.error('Failed to send welcome email: ' + emailError.message);
    }

    res.status(201).json({
      message: 'Registration successful',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    logger.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordWithPepper = password + PEPPER;
    const isMatch = await argon2.verify(user.password_hash, passwordWithPepper);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    logger.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @route POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: 'Logged out successfully' });
});

// @route POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak whether user exists
      return res.json({ message: 'If an account with that email exists, we sent a password reset link.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.reset_password_token = resetTokenHash;
    user.reset_password_expires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`;

    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'Autodraft <noreply@autodraft.ai>',
          to: [email],
          subject: 'Password Reset Request',
          html: `<p>You requested a password reset. Click the link below to reset your password:</p>
                 <a href="${resetUrl}">Reset Password</a>
                 <p>If you didn't request this, you can ignore this email.</p>`,
        });
      } else {
        logger.warn(`Mock Reset URL: ${resetUrl}`);
      }
    } catch (emailError) {
      logger.error('Failed to send reset email: ' + emailError.message);
    }

    res.json({ message: 'If an account with that email exists, we sent a password reset link.' });
  } catch (error) {
    logger.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @route POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      reset_password_token: resetTokenHash,
      reset_password_expires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordWithPepper = newPassword + PEPPER;
    const passwordHash = await argon2.hash(passwordWithPepper, { type: argon2.argon2id });

    user.password_hash = passwordHash;
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    logger.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @route GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash -reset_password_token -reset_password_expires');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
