/**
 * Validation error class
 */
const validator = require('validator');
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @throws {ValidationError} If email is invalid
 */
const validateEmail = (email) => {
  if (!email) {
    throw new ValidationError('Email is required', 'email');
  }
  
  if (typeof email !== 'string') {
    throw new ValidationError('Email must be a string', 'email');
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!validator.isEmail(trimmedEmail)) {
    throw new ValidationError('Please provide a valid email address', 'email');
  }
  
  if (trimmedEmail.length > 254) {
    throw new ValidationError('Email address is too long', 'email');
  }
  
  return trimmedEmail;
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @throws {ValidationError} If password is invalid
 */
const validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    maxLength = 128,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecialChars = false
  } = options;
  
  if (!password) {
    throw new ValidationError('Password is required', 'password');
  }
  
  if (typeof password !== 'string') {
    throw new ValidationError('Password must be a string', 'password');
  }
  
  if (password.length < minLength) {
    throw new ValidationError(`Password must be at least ${minLength} characters long`, 'password');
  }
  
  if (password.length > maxLength) {
    throw new ValidationError(`Password cannot exceed ${maxLength} characters`, 'password');
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter', 'password');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter', 'password');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    throw new ValidationError('Password must contain at least one number', 'password');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new ValidationError('Password must contain at least one special character', 'password');
  }
  
  return password;
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @param {string} fieldName - Field name for error messages
 * @throws {ValidationError} If name is invalid
 */
const validateName = (name, fieldName = 'name') => {
  if (!name) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  
  if (typeof name !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    throw new ValidationError(`${fieldName} must be at least 2 characters long`, fieldName);
  }
  
  if (trimmedName.length > 50) {
    throw new ValidationError(`${fieldName} cannot exceed 50 characters`, fieldName);
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
    throw new ValidationError(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`, fieldName);
  }
  
  return trimmedName;
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @throws {ValidationError} If phone is invalid
 */
const validatePhone = (phone) => {
  if (!phone) {
    return null; // Phone is optional
  }
  
  if (typeof phone !== 'string') {
    throw new ValidationError('Phone number must be a string', 'phone');
  }
  
  const trimmedPhone = phone.trim();
  
  // Basic phone validation (allows international formats)
  if (!/^\+?[\d\s\-()]+$/.test(trimmedPhone)) {
    throw new ValidationError('Please provide a valid phone number', 'phone');
  }
  
  if (trimmedPhone.length < 10 || trimmedPhone.length > 20) {
    throw new ValidationError('Phone number must be between 10 and 20 characters', 'phone');
  }
  
  return trimmedPhone;
};

/**
 * Validate registration data
 * @param {Object} data - Registration data
 * @returns {Object} Validated and sanitized data
 * @throws {ValidationError} If validation fails
 */
const validateRegistration = (data) => {
  const { name, email, password, phone } = data;
  
  const validated = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password, {
      minLength: 6,
      requireNumbers: true
    })
  };
  
  if (phone) {
    validated.phone = validatePhone(phone);
  }
  
  return validated;
};

/**
 * Validate login data
 * @param {Object} data - Login data
 * @returns {Object} Validated and sanitized data
 * @throws {ValidationError} If validation fails
 */
const validateLogin = (data) => {
  const { email, password } = data;
  
  return {
    email: validateEmail(email),
    password: validatePassword(password)
  };
};

/**
 * Validate password reset request
 * @param {Object} data - Password reset data
 * @returns {Object} Validated data
 * @throws {ValidationError} If validation fails
 */
const validatePasswordResetRequest = (data) => {
  const { email } = data;
  
  return {
    email: validateEmail(email)
  };
};

/**
 * Validate password reset
 * @param {Object} data - Password reset data
 * @returns {Object} Validated data
 * @throws {ValidationError} If validation fails
 */
const validatePasswordReset = (data) => {
  const { token, password } = data;
  
  if (!token) {
    throw new ValidationError('Reset token is required', 'token');
  }
  
  if (typeof token !== 'string') {
    throw new ValidationError('Reset token must be a string', 'token');
  }
  
  return {
    token: token.trim(),
    password: validatePassword(password, {
      minLength: 6,
      requireNumbers: true
    })
  };
};

/**
 * Validate profile update data
 * @param {Object} data - Profile data
 * @returns {Object} Validated data
 * @throws {ValidationError} If validation fails
 */
const validateProfileUpdate = (data) => {
  const validated = {};
  
  if (data.name !== undefined) {
    validated.name = validateName(data.name);
  }
  
  if (data.phone !== undefined) {
    validated.phone = validatePhone(data.phone);
  }
  
  if (data.preferences !== undefined) {
    if (typeof data.preferences !== 'object') {
      throw new ValidationError('Preferences must be an object', 'preferences');
    }
    validated.preferences = data.preferences;
  }
  
  return validated;
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  return validator.escape(input.trim());
};

/**
 * Validation middleware factory
 * @param {Function} validationFn - Validation function
 * @returns {Function} Express middleware
 */
const createValidationMiddleware = (validationFn) => {
  return (req, res, next) => {
    try {
      req.validatedData = validationFn(req.body);
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          field: error.field
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Validation error occurred'
      });
    }
  };
};

module.exports = {
  ValidationError,
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateRegistration,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateProfileUpdate,
  sanitizeString,
  createValidationMiddleware
};
