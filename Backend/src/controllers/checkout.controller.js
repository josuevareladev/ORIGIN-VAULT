const { pool } = require('../config/db');

const processCheckout = async (req, res, next) => {
  // We request a dedicated client from the pool to hold our transaction state
  const client = await pool.connect();

  try {
    const { items } = req.body; 
    const userId = req.user.userId; 

    if (!items || items.length === 0) {
      const error = new Error('Cannot process an empty ledger.');
      error.statusCode = 400;
      throw error;
    }

    // Initialize ACID Transaction
    await client.query('BEGIN'); 

    let calculatedTotal = 0;
    const orderItemsData = [];

    // 1. Validate stock and calculate authoritative total directly from DB
    for (const item of items) {
      // 'FOR UPDATE' locks the specific row to prevent race conditions during concurrent checkouts
      const stockQuery = 'SELECT stock, price FROM inventory WHERE id = $1 FOR UPDATE'; 
      const stockResult = await client.query(stockQuery, [item.inventory_id]);

      if (stockResult.rowCount === 0) {
        throw new Error(`Asset ${item.inventory_id} no longer exists in the vault.`);
      }

      const dbItem = stockResult.rows[0];

      if (dbItem.stock < item.quantity) {
        const error = new Error(`Insufficient stock for one or more requested assets.`);
        error.statusCode = 409;
        throw error;
      }

      calculatedTotal += (dbItem.price * item.quantity);
      orderItemsData.push({
        inventory_id: item.inventory_id,
        quantity: item.quantity,
        price: dbItem.price
      });
    }

    // 2. Generate the Master Order Record
    const orderQuery = `
      INSERT INTO orders (user_id, total, status)
      VALUES ($1, $2, 'completed')
      RETURNING id;
    `;
    const orderResult = await client.query(orderQuery, [userId, calculatedTotal]);
    const orderId = orderResult.rows[0].id;

    // 3. Deduct Stock and Record Line Items
    for (const orderItem of orderItemsData) {
      await client.query(
        'UPDATE inventory SET stock = stock - $1 WHERE id = $2', 
        [orderItem.quantity, orderItem.inventory_id]
      );
      
      await client.query(`
        INSERT INTO order_items (order_id, inventory_id, quantity, price_at_purchase)
        VALUES ($1, $2, $3, $4)
      `, [orderId, orderItem.inventory_id, orderItem.quantity, orderItem.price]);
    }

    // Finalize Transaction
    await client.query('COMMIT'); 

    res.status(200).json({
      status: 'success',
      message: 'Transaction successfully sealed in the Origin Vault.',
      data: {
        order_id: orderId,
        total_paid: calculatedTotal
      }
    });

  } catch (error) {
    // If anything fails (e.g. stock goes negative), revert all changes instantly
    await client.query('ROLLBACK'); 
    next(error);
  } finally {
    // Always return the client to the pool to prevent memory leaks
    client.release(); 
  }
};

module.exports = {
  processCheckout
};