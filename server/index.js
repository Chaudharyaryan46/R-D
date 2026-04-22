require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const itemRoutes = require('./routes/items');
const customerRoutes = require('./routes/customers');
const transactionRoutes = require('./routes/transactions');
const paymentRoutes = require('./routes/payments');
const expenseRoutes = require('./routes/expenses');

const app = express();
const server = http.createServer(app);

// Initialize Pino HTTP logging middleware
app.use(pinoHttp({ logger }));

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
  logger.info({ socketId: socket.id }, 'Client connected');
  socket.on('join_business', (businessId) => {
    socket.join(`business_${businessId}`);
  });
  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected');
  });
});

// MongoDB Connection with helpful error messages
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/webbill';
const PORT = process.env.PORT || 5000;

logger.info('Connecting to MongoDB...');

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    logger.info('✅ MongoDB connected successfully!');
    server.listen(PORT, () => {
      logger.info(`🚀 WebBill Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error({ err: err.message }, '❌ MongoDB connection failed!');
    process.exit(1);
  });
