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
    const { name, email, password, linkedinProfile, plan } = req.body;

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

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const user = await User.create({
      name,
      email,
      password_hash: passwordHash,
      is_email_verified: false,
      email_verification_token: verificationTokenHash,
      linkedin_profile_url: linkedinProfile || null,
      status: 'active',
      // Provide defaults for settings handled by the backend
      content_categories: 'Startups, SaaS',
      content_tone: 'professional',
      cron_schedule: '0 9 * * *',
      timezone: 'Asia/Kolkata',
      pending_plan: plan && plan !== 'Free' ? plan : null,
      plan: 'Free',
      credits: 2,
      max_credits: 2,
    });

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${email}`;

    // Send Verification Email
    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Pandadraft <noreply@pandadraft.ai>',
          to: [email],
          subject: 'Verify your email address for Pandadraft',
          html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Verify Your Email</title>
</head>

<body style="margin:0;padding:0;background:#f6f3f2;font-family:Inter,Arial,sans-serif;color:#1c1b1b;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f3f2;padding:40px 20px;">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;background:#ffffff;border:1px solid #e5e2e1;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:48px 40px 32px 40px;">

              <img
                src="https://61c27pvrog.ufs.sh/f/csa5xgP43gu20Ydej7opI3OnUf2APZamuKDqjh75V9FgWecX"
                alt="Pandadraft"
                width="64"
                style="display:block;margin-bottom:24px;"
              />

              <div style="
                font-family:'Hanken Grotesk',Arial,sans-serif;
                font-size:32px;
                font-weight:600;
                line-height:1.2;
                letter-spacing:-0.02em;
                color:#1c1b1b;
                margin-bottom:12px;">
                Welcome to Pandadraft
              </div>

              <div style="
                font-size:16px;
                line-height:1.6;
                color:#444748;
                max-width:420px;
                margin:0 auto;">
                Verify your email address to activate your account and start creating AI-powered content workflows.
              </div>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td>
              <div style="height:1px;background:#e5e2e1;"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">

              <p style="
                margin:0 0 16px 0;
                font-size:16px;
                line-height:1.6;
                color:#1c1b1b;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="
                margin:0 0 32px 0;
                font-size:16px;
                line-height:1.6;
                color:#444748;">
                Thanks for joining Pandadraft. To secure your account and access all features, please verify your email address.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}"
                      style="
                        background:#0071E3;
                        color:#ffffff;
                        text-decoration:none;
                        display:inline-block;
                        padding:14px 28px;
                        border-radius:10px;
                        font-size:15px;
                        font-weight:600;
                        line-height:1;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="
                margin:32px 0 0 0;
                font-size:14px;
                line-height:1.6;
                color:#747878;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>

              <p style="
                margin:12px 0 0 0;
                font-size:13px;
                line-height:1.6;
                word-break:break-all;
                color:#0071E3;">
                ${verifyUrl}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              padding:32px 40px;
              background:#fcf9f8;
              border-top:1px solid #e5e2e1;
              text-align:center;">

              <p style="
                margin:0;
                font-size:13px;
                line-height:1.6;
                color:#747878;">
                This verification link will expire for security reasons.
              </p>

              <p style="
                margin:12px 0 0 0;
                font-size:12px;
                color:#a0a0a0;">
                © 2026 Pandadraft. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`,
        });
      } else {
        logger.warn(`Mock Verify URL: ${verifyUrl}`);
      }
    } catch (emailError) {
      logger.error('Failed to send verification email: ' + emailError.message);
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
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

    if (!user.is_email_verified) {
      return res.status(403).json({ error: 'Please verify your email address before logging in' });
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

// @route POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'Email and token are required' });
    }

    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      email_verification_token: verificationTokenHash,
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    user.is_email_verified = true;
    user.email_verification_token = undefined;
    await user.save();

    // Automatically log them in after verifying
    const jwtToken = generateToken(user._id);
    res.cookie('jwt', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Email successfully verified', pendingPlan: user.pending_plan });
  } catch (error) {
    logger.error('Verify Email Error:', error);
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
          from: process.env.RESEND_FROM_EMAIL || 'Pandadraft <noreply@pandadraft.ai>',
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
