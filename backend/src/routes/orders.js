const express = require('express');
const router = express.Router();

const {
  createOrder,
  listMyOrders,
  listOrdersAdmin,
  getOrderById,
  updateStatus,
  addTracking,
  processPayment,
  sendDeliveryInstructions
} = require('../controllers/orderController');

const { authenticate, adminOnly, authorize } = require('../middleware/auth');

// Create order (authenticated user only)
router.post('/', authenticate, authorize('user'), createOrder);

// Admin: create order for a specific user
router.post('/user/:userId', authenticate, adminOnly, require('../controllers/orderController').createOrderForUser);

// List my orders (authenticated user)
router.get('/mine', authenticate, listMyOrders);

// Admin: list all orders with filters
router.get('/', authenticate, adminOnly, listOrdersAdmin);

// Get order by ID (auth required; controller enforces access)
router.get('/:id', authenticate, getOrderById);

// Admin: update status
router.put('/:id/status', authenticate, adminOnly, updateStatus);

// Admin: add tracking
router.post('/:id/tracking', authenticate, adminOnly, addTracking);

// Admin: process payment
router.post('/:id/payment', authenticate, adminOnly, processPayment);

// Admin: send delivery instructions
router.post('/:id/delivery-instructions', authenticate, adminOnly, sendDeliveryInstructions);

module.exports = router;
