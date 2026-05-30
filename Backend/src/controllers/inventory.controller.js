const { pool } = require('../config/db');

const getInventory = async (req, res, next) => {
  try {
    // We use a LEFT JOIN to ensure we get inventory data even if card metadata is incomplete.
    // In a production environment, pagination (LIMIT, OFFSET) would be injected here.
    const query = `
      SELECT 
        i.id AS inventory_id,
        c.name AS card_name,
        c.rarity,
        i.condition,
        i.language,
        i.price,
        i.stock,
        i.is_frozen
      FROM inventory i
      LEFT JOIN cards c ON i.card_id = c.id
      ORDER BY i.updated_at DESC;
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({
      status: 'success',
      results: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    // Passes the error to the global error handler in app.js
    next(error);
  }
};

const addInventoryItem = async (req, res, next) => {
  try {
    const { card_id, condition, language, price, cost, stock } = req.body;

    // Basic validation to prevent null constraint violations in the database
    if (!card_id || !condition || !language || !price || !cost || stock === undefined) {
      const error = new Error('Missing required inventory fields.');
      error.statusCode = 400;
      throw error;
    }

    const query = `
      INSERT INTO inventory (card_id, condition, language, price, cost, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, card_id, stock, price;
    `;
    
    const values = [card_id, condition, language, price, cost, stock];
    const result = await pool.query(query, values);

    res.status(201).json({
      status: 'success',
      message: 'Inventory item successfully registered.',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  addInventoryItem
};