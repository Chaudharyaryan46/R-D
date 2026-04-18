const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'General' },
  note: { type: String },
  date: { type: Date, default: Date.now },
});

expenseSchema.index({ business_id: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
