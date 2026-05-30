const { pool } = require('../config/db');

const getCards = async (req, res, next) => {
  try {
    const query = 'SELECT id, name, rarity FROM cards ORDER BY name ASC';
    const result = await pool.query(query);

    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCards
};