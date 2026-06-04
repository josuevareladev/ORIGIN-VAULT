const express = require('express');
const { processCheckout, finalizeOrder } = require('../controllers/checkout.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', requireAuth, processCheckout);
router.post('/finalize', requireAuth, finalizeOrder);

module.exports = router;