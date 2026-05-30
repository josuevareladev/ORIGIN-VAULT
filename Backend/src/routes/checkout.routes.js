const express = require('express');
const { processCheckout } = require('../controllers/checkout.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', requireAuth, processCheckout);

module.exports = router;