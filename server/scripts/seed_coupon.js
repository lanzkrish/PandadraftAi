require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('../src/models/Coupon');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const exists = await Coupon.findOne({ code: 'TEST99' });
    if (exists) {
      console.log('TEST99 already exists');
      process.exit(0);
    }

    await Coupon.create({
      name: 'Test 99% Discount',
      offer_name: 'TEST99 Offer',
      description: '99% off for Growth plan',
      code: 'TEST99',
      discount_percentage: 99,
      applicable_plans: ['Growth'],
      is_active: true
    });

    console.log('Coupon TEST99 seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding coupon:', err);
    process.exit(1);
  }
}

seed();
