const express = require('express');
const { getUserOrders } = require('../controllers/orders.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/me', requireAuth, getUserOrders);

module.exports = router;