const express = require('express');
const { getInventory, addInventoryItem } = require('../controllers/inventory.controller');

const router = express.Router();

router.get('/', getInventory);
router.post('/', addInventoryItem);

module.exports = router;