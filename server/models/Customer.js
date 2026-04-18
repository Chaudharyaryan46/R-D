const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  balance: { type: Number, default: 0 }, // negative = udhaar (customer owes), positive = advance
  last_visit: { type: Date },
  created_at: { type: Date, default: Date.now },
});

customerSchema.index({ business_id: 1, phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);
