const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Payment = require('../models/Payment');

// POST /payments
router.post('/', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.create({ ...req.body, business_id: req.user.businessId });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /payments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { business_id: req.user.businessId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    const payments = await Payment.find(query).sort({ date: -1 }).limit(50);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
