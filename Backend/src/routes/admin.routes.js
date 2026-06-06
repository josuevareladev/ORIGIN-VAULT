const express = require('express');
const { getSystemOrders } = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Interceptor estricto: Todo endpoint debajo de esta línea requiere token válido Y rol de administrador
router.use(requireAuth, requireAdmin);

// Ruta: GET /api/admin/orders
router.get('/orders', getSystemOrders);

module.exports = router;