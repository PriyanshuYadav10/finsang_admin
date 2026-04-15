const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user info from JWT payload
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      user_metadata: {
        role: decoded.role,
        name: decoded.name
      }
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const authenticateAdmin = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {
      // Check if user has admin role
      if (!req.user.user_metadata || req.user.user_metadata.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    });
  } catch (error) {
    return res.status(403).json({ error: 'Admin access required' });
  }
};

const authenticateRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      await authenticateToken(req, res, () => {
        // Check if user has the required role
        const userRole = req.user.user_metadata?.role || 'user';
        if (userRole !== requiredRole && userRole !== 'admin') {
          return res.status(403).json({ 
            error: `${requiredRole} access required` 
          });
        }
        next();
      });
    } catch (error) {
      return res.status(403).json({ error: 'Access denied' });
    }
  };
};

module.exports = {
  authenticateToken,
  authenticateAdmin,
  authenticateRole
}; 