const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Item = require('../models/Item');
const Customer = require('../models/Customer');

// Generate invoice number
const generateInvoiceNumber = () => {
  const now = new Date();
  return `WB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-5)}`;
};

// POST /transactions
router.post('/', authMiddleware, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const {
      customer_id,
      customer_name,
      items,
      subtotal,
      discount,
      discount_type,
      tax_total,
      final_amount,
      amount_paid,
      payment_mode,
      split_payments,
      status,
      notes,
      customer_phone, // Extract customer_phone for automated CRM creation
    } = req.body;

    const invoiceNumber = generateInvoiceNumber();

    // Calculate actual amount paid and unpaid
    const actualAmountPaid = typeof amount_paid === 'number' ? amount_paid : final_amount;
    const unpaidAmount = final_amount - actualAmountPaid;
    const transactionStatus = status || (actualAmountPaid >= final_amount ? 'paid' : (actualAmountPaid > 0 ? 'partial' : 'unpaid'));

    let finalCustomerId = customer_id;

    // Automation: Automatically create customer profile if Udhaar and no profile selected
    if (!finalCustomerId && unpaidAmount > 0 && customer_phone) {
      let customer = await Customer.findOne({ business_id: businessId, phone: customer_phone });
      if (!customer) {
        customer = await Customer.create({
          business_id: businessId,
          name: customer_name || 'New Udhaar Customer',
          phone: customer_phone,
          balance: 0,
        });
      }
      finalCustomerId = customer._id;
    }

    // Create transaction (no session — works on standalone MongoDB)
    const transaction = await Transaction.create({
      business_id: businessId,
      customer_id: finalCustomerId || null,
      customer_name,
      items,
      subtotal,
      discount: discount || 0,
      discount_type: discount_type || 'flat',
      tax_total: tax_total || 0,
      final_amount,
      amount_paid: actualAmountPaid,
      payment_mode,
      split_payments: split_payments || [],
      status: transactionStatus,
      invoice_number: invoiceNumber,
      notes: notes || '',
    });

    // Update stock for each item
    for (const item of items) {
      if (item.item_id) {
        await Item.findByIdAndUpdate(item.item_id, { $inc: { stock: -item.quantity } });
      }
    }

    // Update customer balance (udhaar)
    if (finalCustomerId && unpaidAmount > 0) {
      await Customer.findByIdAndUpdate(finalCustomerId, {
        $inc: { balance: -unpaidAmount },
        $set: { last_visit: new Date() },
      });
    }

    // Save payment record(s)
    if (actualAmountPaid > 0) {
      if (payment_mode === 'split' && split_payments?.length) {
        const paymentDocs = split_payments.map((sp) => ({
          transaction_id: transaction._id,
          business_id: businessId,
          customer_id: customer_id || null,
          amount: sp.amount,
          mode: sp.mode,
        }));
        await Payment.insertMany(paymentDocs);
      } else {
        await Payment.create({
          transaction_id: transaction._id,
          business_id: businessId,
          customer_id: customer_id || null,
          amount: actualAmountPaid,
          mode: payment_mode,
        });
      }
    }

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`business_${businessId}`).emit('new_transaction', {
        transaction,
        final_amount,
        payment_mode,
      });
    }

    res.status(201).json(transaction);
  } catch (err) {
    console.error('Transaction error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /transactions/today
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transactions = await Transaction.find({
      business_id: req.user.businessId,
      created_at: { $gte: today, $lt: tomorrow },
    }).sort({ created_at: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { from, to, status, customer_id, page = 1, limit = 20 } = req.query;
    const query = { business_id: req.user.businessId };

    if (from || to) {
      query.created_at = {};
      if (from) query.created_at.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.created_at.$lte = toDate;
      }
    }
    if (status) query.status = status;
    if (customer_id) query.customer_id = customer_id;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /transactions/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      business_id: req.user.businessId,
    });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
