const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Expense = require('../models/Expense');

// POST /expenses
router.post('/', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, business_id: req.user.businessId });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /expenses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { business_id: req.user.businessId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }
    const expenses = await Expense.find(query).sort({ date: -1 });
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({ expenses, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /expenses/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, business_id: req.user.businessId });
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
