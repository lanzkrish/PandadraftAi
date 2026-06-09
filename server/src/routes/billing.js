const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const { User } = require('../db');
const { requireAuth } = require('../utils/auth');
const logger = require('../utils/logger');

const PLANS = {
  Starter: { price: 99, credits: 5 },
  Creator: { price: 249, credits: 30 },
  Growth: { price: 499, credits: 50 },
  Pro: { price: 999, credits: 150 }
};

// @route POST /api/billing/create-order
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    const planDetails = PLANS[plan];

    if (!planDetails) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';

    // Call Razorpay API to create an order
    let orderId = 'order_mock_' + crypto.randomBytes(6).toString('hex');
    let amount = planDetails.price * 100; // in paise

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_mock')) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const response = await axios.post(
          'https://api.razorpay.com/v1/orders',
          {
            amount,
            currency: 'INR',
            receipt: `receipt_${req.user.id}_${Date.now()}`
          },
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          }
        );
        orderId = response.data.id;
        amount = response.data.amount;
      } catch (err) {
        logger.error('Razorpay Order API Failed:', err.response?.data || err.message);
        return res.status(500).json({ error: 'Failed to initiate payment with Razorpay' });
      }
    } else {
      logger.info(`Mocking Razorpay order creation for plan ${plan}. Amount: ${amount}`);
    }

    // Save pending plan to user
    await User.updateOne({ _id: req.user.id }, { $set: { pending_plan: plan } });

    res.json({
      orderId,
      amount,
      currency: 'INR',
      keyId
    });
  } catch (error) {
    logger.error('Create Order Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @route POST /api/billing/verify-payment
router.post('/verify-payment', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';
    let verified = false;

    if (process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_mock')) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      verified = generatedSignature === razorpay_signature;
    } else {
      // Auto-verify if keys are mock
      logger.info('Mock mode: automatically verifying Razorpay payment signature');
      verified = true;
    }

    if (!verified) {
      return res.status(400).json({ error: 'Invalid payment signature. Payment verification failed.' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.pending_plan) {
      return res.status(400).json({ error: 'No pending plan transaction found for this user.' });
    }

    const planDetails = PLANS[user.pending_plan];
    if (!planDetails) {
      return res.status(400).json({ error: 'Invalid pending plan.' });
    }

    // Update active plan & credit allocation
    user.plan = user.pending_plan;
    user.credits = planDetails.credits;
    user.max_credits = planDetails.credits;
    user.pending_plan = undefined;
    await user.save();

    logger.info(`User ${user._id} upgraded to ${user.plan} with ${user.credits} credits.`);

    res.json({ success: true, plan: user.plan, credits: user.credits });
  } catch (error) {
    logger.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
