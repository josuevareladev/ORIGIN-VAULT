const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authentication token is missing or malformed.');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];

    // Synchronously verify the token signature
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Inject the decoded user information into the request object for downstream controllers
    req.user = decodedPayload;
    
    next();
  } catch (error) {
    // Distinguish between expired tokens and completely invalid ones
    const message = error.name === 'TokenExpiredError' 
      ? 'Your session has expired. Please log in again.' 
      : 'Invalid authentication token.';
      
    res.status(401).json({
      error: {
        message,
        code: 'UNAUTHORIZED'
      }
    });
  }
};

module.exports = {
  requireAuth
};