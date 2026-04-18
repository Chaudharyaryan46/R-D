require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const itemRoutes = require('./routes/items');
const customerRoutes = require('./routes/customers');
const transactionRoutes = require('./routes/transactions');
const paymentRoutes = require('./routes/payments');
const expenseRoutes = require('./routes/expenses');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/items', itemRoutes);
app.use('/customers', customerRoutes);
app.use('/transactions', transactionRoutes);
app.use('/payments', paymentRoutes);
app.use('/expenses', expenseRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'WebBill API is running 🚀' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join_business', (businessId) => {
    socket.join(`business_${businessId}`);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// MongoDB Connection with helpful error messages
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/webbill';
const PORT = process.env.PORT || 5000;

console.log('\n🔗 Connecting to MongoDB:', MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    server.listen(PORT, () => {
      console.log(`🚀 WebBill Server running on http://localhost:${PORT}`);
      console.log('\n📌 Next steps:');
      console.log('   1. Seed demo data: node seed.js');
      console.log('   2. Open frontend:  http://localhost:3000\n');
    });
  })
  .catch((err) => {
    console.error('\n❌ MongoDB connection failed!');
    console.error('   Error:', err.message);
    console.error('\n╔═══════════════════════════════════════════════════════╗');
    console.error('║        HOW TO FIX THIS ERROR                          ║');
    console.error('╠═══════════════════════════════════════════════════════╣');
    console.error('║                                                        ║');
    console.error('║  OPTION 1: Use MongoDB Atlas (Free Cloud - Recommended)║');
    console.error('║  ─────────────────────────────────────────────────────║');
    console.error('║  1. Go to: https://cloud.mongodb.com                  ║');
    console.error('║  2. Create free account → New Project → Free Cluster  ║');
    console.error('║  3. Click "Connect" → "Drivers" → Copy connection str ║');
    console.error('║  4. Edit server/.env:                                  ║');
    console.error('║     MONGO_URI=mongodb+srv://user:pass@cluster.net/wb  ║');
    console.error('║  5. Run: node index.js                                 ║');
    console.error('║                                                        ║');
    console.error('║  OPTION 2: Install MongoDB Locally                    ║');
    console.error('║  ─────────────────────────────────────────────────────║');
    console.error('║  1. Download: https://www.mongodb.com/try/download    ║');
    console.error('║  2. Install MongoDB Community Server                  ║');
    console.error('║  3. Start: net start MongoDB                          ║');
    console.error('║  4. Run: node index.js                                ║');
    console.error('║                                                        ║');
    console.error('╚═══════════════════════════════════════════════════════╝\n');
    process.exit(1);
  });
