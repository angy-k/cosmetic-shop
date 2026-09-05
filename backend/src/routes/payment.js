const express = require('express');
const router = express.Router();

const { createPaymentIntent, confirmPaymentResult } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Create a Stripe PaymentIntent for an existing order (authenticated user only —
// ownership of the order is verified in the controller)
router.post('/create-payment-intent', authenticate, createPaymentIntent);

// Reports a client-side payment confirmation (see confirmPaymentResult in the controller)
router.post('/confirm-result', authenticate, confirmPaymentResult);

// Note: the webhook route (POST /api/payment/webhook) is registered directly on
// the Express app in server.js, before the JSON body parser, because Stripe
// requires the raw request body to verify the webhook signature.

module.exports = router;
