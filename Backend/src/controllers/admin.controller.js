const { pool } = require('../config/db');

const getSystemOrders = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        o.id AS order_id, 
        o.user_id, 
        u.email AS user_email, 
        o.total, 
        o.status, 
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC;
    `;
    
    const { rows } = await pool.query(query);

    res.status(200).json({
      status: 'success',
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemOrders
};