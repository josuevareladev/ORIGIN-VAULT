const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Email and password are required fields.');
      error.statusCode = 400;
      throw error;
    }

    if (password.length < 8) {
      const error = new Error('Password must be at least 8 characters long.');
      error.statusCode = 400;
      throw error;
    }

    const userCheckQuery = 'SELECT id FROM users WHERE email = $1';
    const userCheckResult = await pool.query(userCheckQuery, [email]);

    if (userCheckResult.rowCount > 0) {
      const error = new Error('A user with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const insertQuery = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, role, created_at;
    `;
    
    const insertResult = await pool.query(insertQuery, [email, passwordHash]);

    res.status(201).json({
      status: 'success',
      message: 'User successfully registered.',
      data: insertResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Email and password are required fields.');
      error.statusCode = 400;
      throw error;
    }

    // Retrieve user including the password hash for comparison
    const query = 'SELECT id, email, password_hash, role FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rowCount === 0) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401; // 401 Unauthorized prevents username enumeration
      throw error;
    }

    const user = result.rows[0];

    // Cryptographic comparison of the provided password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove the password hash before sending the response
    delete user.password_hash;

    res.status(200).json({
      status: 'success',
      message: 'Authentication successful.',
      data: {
        token,
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser
};