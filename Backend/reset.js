require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./src/config/db');

const forcePasswordReset = async () => {
  try {
    const email = 'jos@gmail.com';
    const nuevaContrasena = 'Admin123!'; // Esta será tu nueva contraseña absoluta
    
    // 1. Encriptamos la nueva contraseña con 10 rondas de salting
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(nuevaContrasena, saltRounds);

    // 2. Inyectamos el nuevo hash en PostgreSQL
    const query = `
      UPDATE users 
      SET password_hash = $1 
      WHERE email = $2 
      RETURNING email, role;
    `;
    
    const result = await pool.query(query, [passwordHash, email]);

    console.log('=== CONTRASEÑA SOBRESCRITA CON ÉXITO ===');
    console.log(`Usuario: ${result.rows[0].email}`);
    console.log(`Nueva Contraseña: ${nuevaContrasena}`);
    console.log(`Rol Actual: ${result.rows[0].role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('[Error Fatal]', error.message);
    process.exit(1);
  }
};

forcePasswordReset();