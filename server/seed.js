/**
 * WebBill Demo Seed Script
 * Run: node seed.js
 * Creates a demo business, admin user, sample items, and customers
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('./utils/logger');

const Business = require('./models/Business');
const User = require('./models/User');
const Item = require('./models/Item');
const Customer = require('./models/Customer');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/webbill';

const sampleItems = [
  { name: 'Aashirvaad Atta 5kg', barcode: '8901725185474', category: 'Grains', unit: 'pcs', price: 265, cost_price: 230, stock: 50, min_stock: 5 },
  { name: 'Toor Dal', barcode: '8901725111222', category: 'Pulses', unit: 'kg', price: 120, cost_price: 100, stock: 30, min_stock: 5 },
  { name: 'Amul Full Cream Milk 1L', barcode: '8901058027124', category: 'Dairy', unit: 'litre', price: 68, cost_price: 60, stock: 45, min_stock: 10 },
  { name: 'Lay\'s Classic Chips', barcode: '8901491500085', category: 'Snacks', unit: 'pcs', price: 20, cost_price: 16, stock: 100, min_stock: 20 },
  { name: 'Haldiram Bhujia 200g', barcode: '8906000320146', category: 'Snacks', unit: 'pcs', price: 75, cost_price: 60, stock: 40, min_stock: 10 },
  { name: 'Parle-G Biscuits', barcode: '8902943000044', category: 'Snacks', unit: 'pcs', price: 10, cost_price: 8, stock: 200, min_stock: 50 },
  { name: 'Fortune Sunflower Oil 1L', barcode: '8902519124536', category: 'Oil & Ghee', unit: 'litre', price: 155, cost_price: 140, stock: 25, min_stock: 5 },
  { name: 'Pepsi 600ml', barcode: '8901489019109', category: 'Beverages', unit: 'pcs', price: 40, cost_price: 30, stock: 80, min_stock: 20 },
  { name: 'Surf Excel 500g', barcode: '8901030744724', category: 'Cleaning', unit: 'pcs', price: 110, cost_price: 95, stock: 30, min_stock: 5 },
  { name: 'Maggi 2 Minutes Noodles', barcode: '8901058000047', category: 'Snacks', unit: 'pcs', price: 14, cost_price: 11, stock: 150, min_stock: 30 },
  { name: 'Red Chilli Powder 200g', barcode: '8901725144441', category: 'Spices', unit: 'gm', price: 55, cost_price: 45, stock: 40, min_stock: 10 },
  { name: 'Basmati Rice 1kg', barcode: '8902943100044', category: 'Grains', unit: 'kg', price: 90, cost_price: 78, stock: 15, min_stock: 5 },
  { name: 'Colgate Toothpaste 200g', barcode: '8901802300283', category: 'Personal Care', unit: 'pcs', price: 115, cost_price: 100, stock: 2, min_stock: 5 }, // Low stock
  { name: 'Lipton Tea 100g', barcode: '8901030744725', category: 'Beverages', unit: 'pcs', price: 95, cost_price: 82, stock: 20, min_stock: 5 },
  { name: 'Amul Butter 100g', barcode: '8901058876543', category: 'Dairy', unit: 'pcs', price: 56, cost_price: 50, stock: 20, min_stock: 5 },
];

const sampleCustomers = [
  { name: 'Ramesh Kumar', phone: '9876543210', address: '12, MG Road, Delhi', balance: -350 },
  { name: 'Sunita Sharma', phone: '9988776655', address: 'Shop 4, Civil Lines', balance: 0 },
  { name: 'Mohd. Aslam', phone: '9123456789', address: '45 Nehru Nagar', balance: -1200 },
  { name: 'Priya Verma', phone: '8765432109', address: 'B-12 Shastri Nagar', balance: 0 },
  { name: 'Kulbhushan Singh', phone: '7654321098', address: 'Near Bus Stand', balance: -500 },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');

    // Check if already seeded
    const existingBiz = await Business.findOne({ name: 'Sharma Kirana Store' });
    if (existingBiz) {
      logger.warn('Demo data already exists!');
      logger.info('Login: admin@demo.com / demo1234');
      process.exit(0);
    }

    // Create Business
    const business = await Business.create({
      name: 'Sharma Kirana Store',
      type: 'grocery',
      gst_enabled: true,
      gst_number: '07AAPCS1071N1ZQ',
      address: '12, Lajpat Nagar Market, New Delhi - 110024',
      phone: '011-29834456',
    });
    logger.info({ businessName: business.name }, 'Business created');

    // Create Admin User
    const hashedPassword = await bcrypt.hash('demo1234', 10);
    const user = await User.create({
      business_id: business._id,
      name: 'Ramesh Sharma',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'admin',
    });
    logger.info({ userEmail: user.email }, 'Admin user created');

    // Create Items
    const itemsWithBiz = sampleItems.map(item => ({ ...item, business_id: business._id, tax_rate: item.category === 'Snacks' ? 5 : 0 }));
    const createdItems = await Item.insertMany(itemsWithBiz);
    logger.info({ count: createdItems.length }, 'Items added to inventory');

    // Create Customers
    const customersWithBiz = sampleCustomers.map(c => ({ ...c, business_id: business._id, last_visit: new Date() }));
    const createdCustomers = await Customer.insertMany(customersWithBiz);
    logger.info({ count: createdCustomers.length }, 'Customers added');

    logger.info('Demo data seeded successfully!');
    console.log('================================');
    console.log('  Login URL:    http://localhost:3000/login');
    console.log('  Email:        admin@demo.com');
    console.log('  Password:     demo1234');
    console.log('================================\n');

    process.exit(0);
  } catch (err) {
    logger.error({ err: err.message }, 'Seeding failed');
    process.exit(1);
  }
}

seed();
