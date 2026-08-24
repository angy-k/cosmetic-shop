const express = require('express');
const router = express.Router();

const { sendNewsletter, getSubscriberCount, getSubscribers, getHistory, unsubscribe } = require('../controllers/newsletterController');
const { authenticate, adminOnly } = require('../middleware/auth');

// Admin routes
router.post('/send', authenticate, adminOnly, sendNewsletter);
router.get('/subscriber-count', authenticate, adminOnly, getSubscriberCount);
router.get('/subscribers', authenticate, adminOnly, getSubscribers);
router.get('/history', authenticate, adminOnly, getHistory);

// Public route - reached from the "Unsubscribe" link in newsletter emails
router.post('/unsubscribe', unsubscribe);

module.exports = router;
