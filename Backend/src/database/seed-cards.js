const { pool } = require('../config/db');

const seedCards = async () => {
  console.log('[Seed] Initializing Expansion and Card injection...');
  try {
    // 1. Insert Base Expansions and retrieve their generated UUIDs
    const expQuery = `
      INSERT INTO expansions (game_id, code, name, release_date) VALUES 
      ('mtg', 'LEA', 'Limited Edition Alpha', '1993-08-05'),
      ('ygo', 'LOB', 'Legend of Blue Eyes White Dragon', '2002-03-08'),
      ('pokemon', 'BS', 'Base Set', '1999-01-09')
      RETURNING id, code;
    `;
    const expResult = await pool.query(expQuery);
    
    // Map the returned UUIDs for relational mapping
    const mtgExpId = expResult.rows.find(e => e.code === 'LEA').id;
    const ygoExpId = expResult.rows.find(e => e.code === 'LOB').id;
    const pkmnExpId = expResult.rows.find(e => e.code === 'BS').id;

    // 2. Insert Cards using the precise Expansion UUIDs
    const cardsQuery = `
      INSERT INTO cards (expansion_id, name, rarity, image_url, attributes) VALUES 
      ($1, 'Black Lotus', 'Rare', '/assets/cards/black-lotus.jpg', '{"color": "Colorless", "type": "Artifact"}'),
      ($2, 'Dark Magician', 'Ultra Rare', '/assets/cards/dark-magician.jpg', '{"attribute": "Dark", "type": "Spellcaster"}'),
      ($3, 'Charizard', 'Holo Rare', '/assets/cards/charizard.jpg', '{"type": "Fire", "hp": 120}')
    `;
    await pool.query(cardsQuery, [mtgExpId, ygoExpId, pkmnExpId]);

    console.log('[Seed] Expansions and Core Cards successfully injected into PostgreSQL.');
  } catch (error) {
    console.error('[Fatal Error] Failed to inject seed data:', error.message);
  } finally {
    await pool.end();
  }
};

seedCards();