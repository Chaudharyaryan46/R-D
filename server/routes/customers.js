const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

// GET /customers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    const query = {
      business_id: req.user.businessId,
      balance: { $lt: 0 },
    };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const customers = await Customer.find(query).sort({ last_visit: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /customers/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, business_id: req.user.businessId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const transactions = await Transaction.find({ customer_id: req.params.id }).sort({ created_at: -1 }).limit(20);
    res.json({ customer, transactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /customers
router.post('/', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, business_id: req.user.businessId });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /customers/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, business_id: req.user.businessId },
      req.body,
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /customers/:id/collect - Collect udhaar payment
router.post('/:id/collect', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const customer = await Customer.findOne({ _id: req.params.id, business_id: req.user.businessId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    customer.balance += parseFloat(amount);
    if (customer.balance > 0) customer.balance = 0; // Cannot have positive from collection
    await customer.save();

    res.json({ customer, message: `Collected ₹${amount} from ${customer.name}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
