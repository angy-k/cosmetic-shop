const express = require('express');
const router = express.Router();
const { contactValidation, submitContactForm } = require('../controllers/contactController');
const rateLimit = require('express-rate-limit');

// Rate limiting for contact form submissions
const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message: 'Too many contact form submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/contact - Submit contact form
router.post('/', contactRateLimit, contactValidation, submitContactForm);

module.exports = router;
