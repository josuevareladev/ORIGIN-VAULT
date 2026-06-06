require('dotenv').config();
const { pool } = require('./src/config/db');

const elevatePrivileges = async () => {
  try {
    const result = await pool.query("UPDATE users SET role = 'admin' RETURNING email, role;");
    
    console.log('=== ELEVACIÓN DE PRIVILEGIOS EXITOSA ===');
    console.log('Cuentas actualizadas:', result.rows);
    process.exit(0);
  } catch (error) {
    console.error('[Fatal Error] No se pudo actualizar:', error.message);
    process.exit(1);
  }
};

elevatePrivileges();