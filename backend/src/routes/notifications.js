const express = require('express');
const router = express.Router();

const {
  requestProductNotification,
  cancelProductNotification,
  getMyNotifications,
  triggerProductAvailabilityNotifications,
  getProductNotifications
} = require('../controllers/notificationController');

const { authenticate, adminOnly } = require('../middleware/auth');

// User routes (require authentication)
router.post('/product-availability', authenticate, requestProductNotification);
router.delete('/product-availability/:productId', authenticate, cancelProductNotification);
router.get('/my-notifications', authenticate, getMyNotifications);

// Admin routes (require authentication and admin role)
router.post('/trigger-availability/:productId', authenticate, adminOnly, triggerProductAvailabilityNotifications);
router.get('/product/:productId', authenticate, adminOnly, getProductNotifications);

module.exports = router;
