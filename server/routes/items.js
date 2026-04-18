const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Item = require('../models/Item');
const mongoose = require('mongoose');

// GET /items
router.get('/', authMiddleware, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { search, category, low_stock } = req.query;

    const query = { business_id: businessId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: search },
      ];
    }
    if (category) query.category = category;
    if (low_stock === 'true') {
      query.$expr = { $lte: ['$stock', '$min_stock'] };
    }

    const items = await Item.find(query).sort({ name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /items/barcode/:barcode
router.get('/barcode/:barcode', authMiddleware, async (req, res) => {
  try {
    const item = await Item.findOne({ business_id: req.user.businessId, barcode: req.params.barcode });
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /items
router.post('/', authMiddleware, async (req, res) => {
  try {
    const item = await Item.create({ ...req.body, business_id: req.user.businessId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /items/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, business_id: req.user.businessId },
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /items/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id, business_id: req.user.businessId });
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json({ message: 'Item deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
