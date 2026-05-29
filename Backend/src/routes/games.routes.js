const express = require('express');
const { getGames } = require('../controllers/games.controller');

const router = express.Router();

router.get('/', getGames);

module.exports = router;