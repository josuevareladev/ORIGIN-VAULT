const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const gamesRoutes = require('./routes/games.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const authRoutes = require('./routes/auth.routes');
const cardsRoutes = require('./routes/cards.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const ordersRoutes = require('./routes/orders.routes');

const app = express();

app.use(helmet());
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true 
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/games', gamesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', ordersRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[System Error] ${err.message}`);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: statusCode === 500 ? 'Internal Server Error' : err.message,
      code: err.errorCode || 'INTERNAL_ERROR'
    }
  });
});

module.exports = app;