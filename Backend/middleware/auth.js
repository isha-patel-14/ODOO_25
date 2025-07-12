const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }

      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: 'User account is banned'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Only allow guests to view (GET) endpoints
const guestViewOnly = (req, res, next) => {
  if (req.user && req.user.role === 'guest' && req.method !== 'GET') {
    return res.status(403).json({
      success: false,
      message: 'Guest users can only view content.'
    });
  }
  next();
};

module.exports.guestViewOnly = guestViewOnly;

// Optional auth (for guest access)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user && !user.isBanned) {
          req.user = user;
        }
      } catch (error) {
        // Invalid token, but continue as guest
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, authorize, optionalAuth };