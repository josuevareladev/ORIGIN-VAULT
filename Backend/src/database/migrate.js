const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const runMigration = async () => {
  console.log('Iniciando migración de Origin Vault...');
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, { encoding: 'utf-8' });
    
    await pool.query(sql);
    console.log('✅ Migración completada. Las tablas han sido creadas con éxito.');
  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error.message);
  } finally {
    // Cerramos el pool para que el script de terminal finalice
    await pool.end(); 
  }
};

runMigration();