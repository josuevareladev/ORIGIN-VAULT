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
const webhookRoutes = require('./routes/webhook.routes');
const adminRoutes = require('./routes/admin.routes'); // <-- Ruta Admin conectada

const app = express();

app.use(helmet());

// Configuración de CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):\d+$/.test(origin) || origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas API estándar
app.use('/api/games', gamesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', ordersRoutes);

// Ruta API protegida de Administrador
app.use('/api/admin', adminRoutes); // <-- Montada en el servidor

// Manejador Global de Errores
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