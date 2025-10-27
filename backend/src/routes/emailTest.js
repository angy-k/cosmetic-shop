const express = require('express');
const router = express.Router();

const {
  testEmail,
  checkEmailConfig
} = require('../controllers/emailTestController');

const { authenticate, adminOnly } = require('../middleware/auth');

// Admin only routes for testing email functionality
router.post('/:type', authenticate, adminOnly, testEmail);
router.get('/config', authenticate, adminOnly, checkEmailConfig);

module.exports = router;
