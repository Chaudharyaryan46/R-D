const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../models/User');
const Business = require('../models/Business');

// POST /auth/register - Register business + admin user
router.post('/register', async (req, res) => {
  try {
    const { businessName, email, password, name, gst_enabled, gst_number, address, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn({ email }, 'Registration failed: Email already exists');
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Create business
    const business = await Business.create({
      name: businessName,
      gst_enabled: gst_enabled || false,
      gst_number: gst_number || '',
      address: address || '',
      phone: phone || '',
    });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await User.create({
      business_id: business._id,
      name,
      email,
      password: hashed,
      role: 'admin',
    });

    const token = jwt.sign(
      { userId: user._id, businessId: business._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info({ userId: user._id, businessId: business._id }, 'New user registered');

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      business: { id: business._id, name: business.name, gst_enabled: business.gst_enabled },
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Registration error');
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('business_id');
    if (!user) {
      logger.warn({ email }, 'Login failed: User not found');
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn({ email }, 'Login failed: Invalid password');
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const business = user.business_id;

    const token = jwt.sign(
      { userId: user._id, businessId: business._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info({ userId: user._id, email: user.email }, 'User logged in');

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      business: {
        id: business._id,
        name: business.name,
        gst_enabled: business.gst_enabled,
        gst_number: business.gst_number,
        address: business.address,
        phone: business.phone,
      },
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Login error');
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
