const { pool } = require('../config/db');

const migrateOrders = async () => {
  console.log('[Migration] Purging old schemas and initializing Order Tables...');
  try {
    const query = `
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;

      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        inventory_id UUID REFERENCES inventory(id),
        quantity INT NOT NULL,
        price_at_purchase DECIMAL(10, 2) NOT NULL
      );
    `;
    await pool.query(query);
    console.log('✅ [Migration] Order tables successfully rebuilt with strict architecture.');
  } catch (error) {
    console.error('❌ [Migration] Error:', error.message);
  } finally {
    await pool.end();
  }
};

migrateOrders();