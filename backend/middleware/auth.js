const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - checking token');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    console.log('Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('Token verified, user ID:', decoded.userId);
    
    if (!decoded.userId) {
      console.log('No userId in token');
      return res.status(401).json({ error: 'Invalid token format. Please log in again.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth; 