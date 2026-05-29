const { pool } = require('../config/db');

const getGames = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY created_at ASC');
    
    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGames
};