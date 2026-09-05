const express = require('express');
const router = express.Router();

const {
  testSlackNotification,
  checkSlackConfig
} = require('../controllers/slackTestController');

const { authenticate, adminOnly } = require('../middleware/auth');

// Admin only routes for testing Slack notification functionality
router.post('/:type', authenticate, adminOnly, testSlackNotification);
router.get('/config', authenticate, adminOnly, checkSlackConfig);

module.exports = router;
