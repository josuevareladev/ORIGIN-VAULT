const { pool } = require('../config/db');

const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const ordersQuery = `
      SELECT id, total, status, created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows: orders } = await pool.query(ordersQuery, [userId]);

    if (orders.length === 0) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const orderIds = orders.map(order => order.id);

    const itemsQuery = `
      SELECT oi.order_id, oi.quantity, oi.price_at_purchase, c.name, i.condition, i.language
      FROM order_items oi
      JOIN inventory i ON oi.inventory_id = i.id
      JOIN cards c ON i.card_id = c.id
      WHERE oi.order_id = ANY($1::uuid[]);
    `;
    const { rows: items } = await pool.query(itemsQuery, [orderIds]);

    const populatedOrders = orders.map(order => ({
      ...order,
      items: items.filter(item => item.order_id === order.id)
    }));

    res.status(200).json({
      status: 'success',
      data: populatedOrders
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getUserOrders };