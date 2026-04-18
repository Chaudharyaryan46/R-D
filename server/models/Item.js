const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  barcode: { type: String },
  category: { type: String, default: 'General' },
  unit: { type: String, enum: ['kg', 'litre', 'pcs', 'gm', 'ml', 'dozen'], default: 'pcs' },
  price: { type: Number, required: true },
  cost_price: { type: Number, default: 0 },
  tax_rate: { type: Number, default: 0 }, // percentage
  stock: { type: Number, default: 0 },
  min_stock: { type: Number, default: 5 },
  expiry_date: { type: Date },
  created_at: { type: Date, default: Date.now },
});

itemSchema.index({ business_id: 1, name: 'text', barcode: 1 });

module.exports = mongoose.model('Item', itemSchema);
