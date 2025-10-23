const { User } = require('../models');
const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if token is access token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type. Access token required.'
      });
    }
    
    // Find user by ID from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated.'
      });
    }
    
    // Check token version
    if (typeof decoded.tokenVersion !== 'number' || decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Token is no longer valid.'
      });
    }
    
    // Attach user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token.'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = verifyToken(token);
    
    if (decoded.type === 'access') {
      const user = await User.findById(decoded.id).select('-password');
      
      if (
        user &&
        user.isActive &&
        typeof decoded.tokenVersion === 'number' &&
        decoded.tokenVersion === user.tokenVersion
      ) {
        req.user = user;
        req.token = token;
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // Don't fail on token errors in optional auth
    req.user = null;
    next();
  }
};

/**
 * Authorization middleware - checks if user has required role
 * @param {...string} roles - Required roles
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    
    next();
  };
};

/**
 * Admin only middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminOnly = authorize('admin');

/**
 * User or Admin middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const userOrAdmin = authorize('user', 'admin');

/**
 * Check if user owns resource or is admin
 * @param {string} userIdField - Field name containing user ID (default: 'user')
 * @returns {Function} Express middleware function
 */
const ownerOrAdmin = (userIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user owns the resource
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in request.'
      });
    }
    
    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
};

/**
 * Rate limiting middleware for authentication endpoints
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware function
 */
const rateLimitAuth = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip + (req.body.email || '');
    const now = Date.now();
    
    // Clean old entries
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }
    
    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    
    if (userAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Too many authentication attempts. Try again in ${timeLeft} minutes.`
      });
    }
    
    userAttempts.count++;
    next();
  };
};

/**
 * Middleware to check if email is verified
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email address.'
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  adminOnly,
  userOrAdmin,
  ownerOrAdmin,
  rateLimitAuth,
  requireEmailVerification
};
