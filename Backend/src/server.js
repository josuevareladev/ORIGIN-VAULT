const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // Verificamos conexión a DB
    const client = await pool.connect();
    console.log('[DB] Conectado exitosamente a PostgreSQL (Origin Vault)');
    client.release(); // Devolvemos la conexión al pool

    app.listen(PORT, () => {
      console.log(`[Server] API corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('[Fatal Error] No se pudo conectar a la base de datos:', error.message);
    process.exit(1); 
  }
};

startServer();