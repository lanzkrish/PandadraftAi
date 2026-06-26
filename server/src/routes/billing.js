const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const { User, Coupon, Transaction } = require('../db');
const { requireAuth } = require('../utils/auth');
const logger = require('../utils/logger');
const { sendPaymentReceiptEmail } = require('../utils/email');

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

    let amount = planDetails.price * 100; // in paise
    const { couponCode } = req.body;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), is_active: true });
      if (coupon) {
        if (!coupon.applicable_plans || coupon.applicable_plans.includes(plan) || coupon.applicable_plans.length === 0) {
          const discount = (amount * coupon.discount_percentage) / 100;
          amount = Math.round(Math.max(0, amount - discount));
          appliedCoupon = coupon.code;
        }
      }
    }

    const keyId = (process.env.RAZORPAY_KEY_ID || 'rzp_test_mock').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || 'mock_secret').trim();

    if (amount === 0) {
      const randomStr = crypto.randomBytes(3).toString('hex').slice(0, 5).toUpperCase();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const userIdStr = String(req.user.id).slice(0, 4).toUpperCase();
      const generatedOrderId = `${randomStr}-${dateStr}-${userIdStr}-${plan.toUpperCase()}`;
      
      const paymentMethod = appliedCoupon ? `Coupon: ${appliedCoupon}` : 'Free Plan Upgrade';

      const user = await User.findById(req.user.id);
      user.plan = plan;
      user.credits = planDetails.credits;
      user.max_credits = planDetails.credits;
      user.pending_plan = undefined;
      user.last_payment_method = paymentMethod;
      await user.save();

      await Transaction.create({
        user_id: req.user.id,
        order_id: generatedOrderId,
        plan_name: plan,
        amount: 0,
        currency: 'INR',
        payment_method: paymentMethod,
        coupon_code: appliedCoupon,
        status: 'completed'
      });

      if (user.email) {
        sendPaymentReceiptEmail({
          userEmail: user.email,
          userName: user.name || user.telegram_username,
          planName: user.plan,
          amountPaid: 0,
          credits: user.credits,
          orderId: generatedOrderId
        });
      }

      return res.json({
        isFree: true,
        success: true,
        plan: user.plan,
        credits: user.credits
      });
    }

    // Call Razorpay API to create an order
    let orderId = 'order_mock_' + crypto.randomBytes(6).toString('hex');

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_mock')) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const response = await axios.post(
          'https://api.razorpay.com/v1/orders',
          {
            amount,
            currency: 'INR',
            receipt: `rcpt_${String(req.user.id).slice(-6)}_${Date.now()}`
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
        logger.error('Razorpay Order API Failed: ' + JSON.stringify(err.response?.data || err.message));
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

// @route POST /api/billing/validate-coupon
router.post('/validate-coupon', requireAuth, async (req, res) => {
  try {
    const { couponCode, plan } = req.body;
    if (!couponCode || !plan) {
      return res.status(400).json({ error: 'Coupon code and plan are required' });
    }

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), is_active: true });
    if (!coupon) {
      return res.status(400).json({ error: 'Invalid or inactive coupon code' });
    }

    if (coupon.valid_from && new Date() < coupon.valid_from) {
      return res.status(400).json({ error: 'Coupon is not yet active' });
    }
    if (coupon.valid_to && new Date() > coupon.valid_to) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (coupon.applicable_plans && coupon.applicable_plans.length > 0 && !coupon.applicable_plans.includes(plan)) {
      return res.status(400).json({ error: `Coupon is not applicable for ${plan} plan` });
    }

    const planDetails = PLANS[plan];
    if (!planDetails) return res.status(400).json({ error: 'Invalid plan' });

    const originalPrice = planDetails.price;
    const discountAmount = (originalPrice * coupon.discount_percentage) / 100;
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    res.json({
      success: true,
      coupon: coupon.code,
      discount_percentage: coupon.discount_percentage,
      original_price: originalPrice,
      final_price: finalPrice
    });
  } catch (error) {
    logger.error('Validate Coupon Error:', error);
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
    const paymentMethod = 'Razorpay Payment';
    user.last_payment_method = paymentMethod;
    await user.save();

    logger.info(`User ${user._id} upgraded to ${user.plan} with ${user.credits} credits.`);

    let finalAmountPaid = planDetails.price;

    // Dispatch email receipt if user has email
    if (user.email) {
      // Attempt to fetch exact amount from Razorpay
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_mock')) {
        try {
          const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID.trim()}:${process.env.RAZORPAY_KEY_SECRET.trim()}`).toString('base64');
          const response = await axios.get(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
            headers: { Authorization: `Basic ${auth}` }
          });
          if (response.data && response.data.amount) {
            finalAmountPaid = response.data.amount / 100; // Convert paise to INR
          }
        } catch (err) {
          logger.error('Failed to fetch order details for receipt:', err.message);
        }
      }

      // Fire and forget email sending
      sendPaymentReceiptEmail({
        userEmail: user.email,
        userName: user.name || user.telegram_username,
        planName: user.plan,
        amountPaid: finalAmountPaid,
        credits: user.credits,
        orderId: razorpay_order_id
      });
    }

    await Transaction.create({
      user_id: req.user.id,
      order_id: razorpay_order_id,
      plan_name: user.plan,
      amount: finalAmountPaid,
      currency: 'INR',
      payment_method: paymentMethod,
      status: 'completed'
    });

    res.json({ success: true, plan: user.plan, credits: user.credits });
  } catch (error) {
    logger.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @route GET /api/billing/transactions
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    logger.error('Fetch Transactions Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
