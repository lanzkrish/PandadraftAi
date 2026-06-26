const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  order_id: { type: String, required: true, unique: true },
  plan_name: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  payment_method: { type: String, required: true },
  coupon_code: { type: String, default: null },
  status: { type: String, default: 'completed', enum: ['pending', 'completed', 'failed'] }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
