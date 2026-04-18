const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const Item = require('../models/Item');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

// GET /dashboard
router.get('/', authMiddleware, async (req, res) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user.businessId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's transactions
    const todayTransactions = await Transaction.find({
      business_id: businessId,
      created_at: { $gte: today, $lt: tomorrow },
    });

    const totalSales = todayTransactions.reduce((sum, t) => sum + t.final_amount, 0);
    const totalOrders = todayTransactions.length;

    // Payment split (reflecting actual money received)
    const paymentSplit = { cash: 0, upi: 0, card: 0 };
    todayTransactions.forEach((t) => {
      if (t.payment_mode === 'split') {
        t.split_payments.forEach((sp) => {
          paymentSplit[sp.mode] = (paymentSplit[sp.mode] || 0) + sp.amount;
        });
      } else {
        paymentSplit[t.payment_mode] = (paymentSplit[t.payment_mode] || 0) + (t.amount_paid || 0);
      }
    });

    // Today's expenses
    const todayExpenses = await Expense.find({
      business_id: businessId,
      date: { $gte: today, $lt: tomorrow },
    });
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalExpenses;

    // Hourly sales (today)
    const hourlySales = Array(24).fill(0);
    todayTransactions.forEach((t) => {
      const hour = new Date(t.created_at).getHours();
      hourlySales[hour] += t.final_amount;
    });

    // Top selling products (today)
    const productMap = {};
    todayTransactions.forEach((t) => {
      t.items.forEach((item) => {
        if (!productMap[item.name]) {
          productMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productMap[item.name].quantity += item.quantity;
        productMap[item.name].revenue += item.total_price;
      });
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Low stock items
    const lowStockItems = await Item.find({
      business_id: businessId,
      $expr: { $lte: ['$stock', '$min_stock'] },
    }).limit(10);

    // Weekly sales (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyTransactions = await Transaction.find({
      business_id: businessId,
      created_at: { $gte: sevenDaysAgo },
    });

    const weeklyMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      weeklyMap[key] = 0;
    }
    weeklyTransactions.forEach((t) => {
      const key = new Date(t.created_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      if (weeklyMap[key] !== undefined) weeklyMap[key] += t.final_amount;
    });
    const weeklySales = Object.entries(weeklyMap).map(([day, amount]) => ({ day, amount }));

    // Total customers
    const totalCustomers = await Customer.countDocuments({ business_id: businessId });

    // Pending udhaar
    const udhaars = await Customer.find({
      business_id: businessId,
      balance: { $lt: 0 },
    }).select('name phone balance').limit(10);

    res.json({
      totalSales,
      totalOrders,
      netProfit,
      totalExpenses,
      paymentSplit,
      hourlySales: hourlySales.map((amount, hour) => ({ hour: `${hour}:00`, amount })),
      topProducts,
      lowStockItems,
      weeklySales,
      totalCustomers,
      udhaars,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
