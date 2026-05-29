const { pool } = require('../config/db');

const seedGames = async () => {
  console.log('[Seed] Populating initial TCG Universes...');
  try {
    const query = `
      INSERT INTO games (id, name) VALUES 
      ('mtg', 'Magic: The Gathering'),
      ('ygo', 'Yu-Gi-Oh! TCG'),
      ('pokemon', 'Pokémon TCG')
      ON CONFLICT (id) DO NOTHING;
    `;
    await pool.query(query);
    console.log('[Seed] System Universes successfully injected into PostgreSQL.');
  } catch (error) {
    console.error('[Seed] Error:', error.message);
  } finally {
    await pool.end();
  }
};

seedGames();