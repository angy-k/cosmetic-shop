const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const emailService = require('../services/emailService');
const slackService = require('../services/slackService');

// --- Stripe webhook event handlers ---

// Prevents the webhook and confirmPaymentResult from processing the same
// order at once (would otherwise hit a Mongoose ParallelSaveError).
const ordersBeingProcessed = new Set();

const withOrderLock = async (orderId, fn) => {
  const key = String(orderId);
  if (ordersBeingProcessed.has(key)) {
    console.log(`Order ${key} is already being processed - skipping concurrent call.`);
    return;
  }
  ordersBeingProcessed.add(key);
  try {
    await fn();
  } finally {
    ordersBeingProcessed.delete(key);
  }
};

const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  await withOrderLock(orderId, async () => {
    try {
      const order = await Order.findById(orderId).populate('user');
      if (!order) {
        console.error('Order not found for payment intent:', paymentIntent.id);
        return;
      }

      // Also reachable from confirmPaymentResult - don't double-process
      if (order.payment.status === 'completed') {
        console.log(`Payment already processed for order ${order.orderNumber}, skipping duplicate handling.`);
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

      try {
        await slackService.notifyPaymentSucceeded(order);
      } catch (slackError) {
        console.error('Failed to send Slack notification for successful payment:', slackError);
      }

      console.log(`Payment completed for order ${order.orderNumber}`);
    } catch (error) {
      console.error('Error handling payment intent succeeded:', error);
      slackService.notifyError(error, { source: 'Stripe payment_intent.succeeded' });
    }
  });
};

const handlePaymentIntentFailed = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  await withOrderLock(orderId, async () => {
    try {
      const order = await Order.findById(orderId).populate('user');
      if (order) {
        // Same idempotency concern as above
        if (order.payment.status === 'failed') {
          console.log(`Payment failure already processed for order ${order.orderNumber}, skipping duplicate handling.`);
          return;
        }
        order.payment.status = 'failed';
        await order.save();
        try {
          await emailService.sendPaymentFailedEmail(order);
          await order.addNotification('payment-failed', true);
        } catch (emailError) {
          console.error('Failed to send payment failed email:', emailError);
          await order.addNotification('payment-failed', false);
        }
        try {
          await slackService.notifyPaymentFailed(order);
        } catch (slackError) {
          console.error('Failed to send Slack notification for failed payment:', slackError);
        }
        console.log(`Payment failed for order ${order.orderNumber}`);
      }
    } catch (error) {
      console.error('Error handling payment intent failed:', error);
      slackService.notifyError(error, { source: 'Stripe payment_intent.payment_failed' });
    }
  });
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
    slackService.notifyError(error, { source: 'Stripe webhook handler' });
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

// POST /api/payment/confirm-result (authenticated)
// Backup path for the webhook (mainly for local dev, where it often can't
// reach us) - re-fetches status from Stripe, never trusts the client.
const confirmPaymentResult = async (req, res) => {
  try {
    const { paymentIntentId } = req.body || {};

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId is required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const orderId = paymentIntent.metadata?.orderId;
    const order = orderId ? await Order.findById(orderId) : null;

    if (!order) {
      return res.status(404).json({ error: 'Order not found for this payment' });
    }
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (paymentIntent.status === 'succeeded') {
      await handlePaymentIntentSucceeded(paymentIntent);
    } else if (['requires_payment_method', 'canceled'].includes(paymentIntent.status)) {
      await handlePaymentIntentFailed(paymentIntent);
    }

    res.json({ success: true, status: paymentIntent.status });
  } catch (error) {
    console.error('Error confirming payment result:', error);
    slackService.notifyError(error, { source: 'confirmPaymentResult' });
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPaymentResult,
  handleWebhook,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed
};
