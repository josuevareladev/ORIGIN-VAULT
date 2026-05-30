const express = require('express');
const { getInventory, addInventoryItem } = require('../controllers/inventory.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public route: Anyone visiting the site can view the available stock
router.get('/', getInventory);

// Protected route: Only authenticated personnel with a valid JWT can add inventory
router.post('/', requireAuth, addInventoryItem);

module.exports = router;