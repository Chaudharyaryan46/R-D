const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String },
  unit_price: { type: Number, required: true },
  tax_rate: { type: Number, default: 0 },
  discount_per_item: { type: Number, default: 0 },
  total_price: { type: Number, required: true },
});

const transactionSchema = new mongoose.Schema({
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name: { type: String },
  items: [transactionItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // total discount in ₹
  discount_type: { type: String, enum: ['flat', 'percent'], default: 'flat' },
  tax_total: { type: Number, default: 0 },
  final_amount: { type: Number, required: true },
  amount_paid: { type: Number, default: 0 },
  payment_mode: { type: String, enum: ['cash', 'upi', 'card', 'split'], default: 'cash' },
  split_payments: [
    {
      mode: { type: String, enum: ['cash', 'upi', 'card'] },
      amount: { type: Number },
    },
  ],
  status: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'paid' },
  invoice_number: { type: String },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
});

transactionSchema.index({ business_id: 1, created_at: -1 });
transactionSchema.index({ customer_id: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
