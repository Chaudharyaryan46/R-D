const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'grocery' },
  gst_enabled: { type: Boolean, default: false },
  gst_number: { type: String },
  address: { type: String },
  phone: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Business', businessSchema);
