const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const emailService = require('../services/emailService');

// --- Stripe webhook event handlers ---

const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      console.error('Order not found for payment intent:', paymentIntent.id);
      return;
    }

    await order.processPayment(paymentIntent.id, 'stripe', {
      paymentIntentId: paymentIntent.id,
      customerId: paymentIntent.customer || undefined
    });

    try {
      await emailService.sendPaymentConfirmationEmail(order);
      await order.addNotification('payment-received', true);
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
      await order.addNotification('payment-received', false);
    }

    console.log(`Payment completed for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
};

const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId).populate('user');
    if (order) {
      order.payment.status = 'failed';
      await order.save();
      try {
        await emailService.sendPaymentFailedEmail(order);
        await order.addNotification('payment-failed', true);
      } catch (emailError) {
        console.error('Failed to send payment failed email:', emailError);
        await order.addNotification('payment-failed', false);
      }
      console.log(`Payment failed for order ${order.orderNumber}`);
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
};

// POST /api/payment/webhook (raw body — mounted before express.json() in server.js)
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// POST /api/payment/create-payment-intent (authenticated)
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, orderId } = req.body || {};

    if (!amount || !currency || !orderId) {
      return res.status(400).json({ error: 'amount, currency and orderId are required' });
    }

    // Make sure the order exists and belongs to the requesting user (admins may act on any order)
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { orderId },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed
};
