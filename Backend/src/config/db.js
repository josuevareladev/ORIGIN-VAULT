const { Pool } = require('pg');
require('dotenv').config();

// Configuramos el pool con las variables de nuestro archivo .env
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20, // Máximo de conexiones simultáneas en el pool
  idleTimeoutMillis: 30000, // Cierra conexiones inactivas después de 30s
  connectionTimeoutMillis: 2000, // Tiempo máximo para conectar antes de dar error
});

// Listener global para capturar caídas de la base de datos de forma silenciosa
pool.on('error', (err, client) => {
  console.error('[Fatal Error] Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};