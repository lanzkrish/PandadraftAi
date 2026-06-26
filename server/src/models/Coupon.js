const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  name: { type: String, required: true },
  offer_name: { type: String },
  description: { type: String },
  valid_from: { type: Date, default: Date.now },
  valid_to: { type: Date },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount_percentage: { type: Number, required: true, min: 0, max: 100 },
  applicable_plans: [{ type: String }], // Array of plan names this coupon applies to (e.g. ['Growth'])
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
