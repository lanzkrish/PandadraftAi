require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('../src/models/Coupon');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const exists = await Coupon.findOne({ code: 'DHANANJAYFREE' });
    if (exists) {
      console.log('DHANANJAYFREE already exists');
      process.exit(0);
    }

    await Coupon.create({
      name: 'Free Pro Plan',
      offer_name: 'Dhananjay Free Offer',
      description: '100% off for Pro plan',
      code: 'DHANANJAYFREE',
      discount_percentage: 100,
      applicable_plans: ['Pro'],
      is_active: true
    });

    console.log('Coupon DHANANJAYFREE seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding coupon:', err);
    process.exit(1);
  }
}

seed();
