const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to include in token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = null) => {
  const options = {};
  
  if (expiresIn) {
    options.expiresIn = expiresIn;
  } else {
    options.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Generate access token (short-lived)
 * @param {Object} user - User object
 * @returns {string} Access token
 */
const generateAccessToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    type: 'access',
    tokenVersion: user.tokenVersion
  };
  
  return generateToken(payload, '15m'); // 15 minutes
};

/**
 * Generate refresh token (long-lived)
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    type: 'refresh',
    tokenVersion: user.tokenVersion
  };
  
  return generateToken(payload, '7d'); // 7 days
};

/**
 * Generate email verification token
 * @param {Object} user - User object
 * @returns {string} Verification token
 */
const generateVerificationToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    type: 'verification'
  };
  
  return generateToken(payload, '24h'); // 24 hours
};

/**
 * Generate password reset token
 * @param {Object} user - User object
 * @returns {string} Reset token
 */
const generatePasswordResetToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    type: 'password-reset'
  };
  
  return generateToken(payload, '1h'); // 1 hour
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Check if token is expired
 * @param {Object} decodedToken - Decoded JWT payload
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = (decodedToken) => {
  if (!decodedToken.exp) return false;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decodedToken.exp < currentTime;
};

/**
 * Get token expiration date
 * @param {Object} decodedToken - Decoded JWT payload
 * @returns {Date|null} Expiration date or null
 */
const getTokenExpiration = (decodedToken) => {
  if (!decodedToken.exp) return null;
  
  return new Date(decodedToken.exp * 1000);
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  generatePasswordResetToken,
  verifyToken,
  extractTokenFromHeader,
  isTokenExpired,
  getTokenExpiration
};
