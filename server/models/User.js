const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
