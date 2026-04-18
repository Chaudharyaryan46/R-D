const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  amount: { type: Number, required: true },
  mode: { type: String, enum: ['cash', 'upi', 'card'], default: 'cash' },
  note: { type: String },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);
