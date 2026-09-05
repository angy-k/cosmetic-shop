const slackService = require('../services/slackService');

// Mock order shaped like the real Order model (see src/models/Order.js) -
// only the fields slackService's formatters actually read.
const mockOrder = (paymentStatus, paymentMethod = 'stripe') => ({
  orderNumber: 'TEST-' + Date.now(),
  total: 4899,
  customer: { name: 'Test Kupac', email: 'test@example.com' },
  payment: { status: paymentStatus, method: paymentMethod },
  items: [
    { productSnapshot: { name: 'Test Ruž za usne' }, quantity: 2 },
    { productSnapshot: { name: 'Test Puder' }, quantity: 1 }
  ]
});

/**
 * Fire a sample Slack notification so an admin can verify webhooks are wired
 * up and formatted correctly, without needing a real order or payment.
 * @route POST /api/slack-test/:type
 * @access Private (Admin only)
 */
const testSlackNotification = async (req, res) => {
  try {
    const { type } = req.params;

    switch (type) {
      case 'new-order':
        await slackService.notifyNewOrder(mockOrder('pending'));
        break;

      case 'payment-succeeded':
        await slackService.notifyPaymentSucceeded(mockOrder('completed'));
        break;

      case 'payment-failed':
        await slackService.notifyPaymentFailed(mockOrder('failed'));
        break;

      case 'error':
        await slackService.notifyError(
          new Error('Test greška poslata iz admin panela'),
          { source: 'Slack test', route: '/api/slack-test/error' }
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid notification type. Available types: new-order, payment-succeeded, payment-failed, error'
        });
    }

    // slackService never throws on a missing/unreachable webhook (it just
    // logs and no-ops, so a Slack outage never takes down the app) - so a
    // resolved promise here doesn't guarantee the message actually landed
    // in the channel. Surface the configured state alongside success so the
    // admin panel can tell "sent" apart from "would have been sent".
    const configured = !!(process.env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL_ERRORS);
    res.json({
      success: true,
      message: configured
        ? `Test "${type}" notifikacija je poslata na Slack.`
        : `Nijedan Slack webhook nije konfigurisan, pa test "${type}" notifikacija nije nikuda stigla - proveri konfiguraciju.`,
      data: { configured }
    });

  } catch (error) {
    console.error('Slack test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test Slack notification',
      error: error.message
    });
  }
};

/**
 * Check which Slack webhooks are configured.
 * @route GET /api/slack-test/config
 * @access Private (Admin only)
 */
const checkSlackConfig = async (req, res) => {
  try {
    const config = {
      ordersWebhookConfigured: !!process.env.SLACK_WEBHOOK_URL,
      errorsWebhookConfigured: !!process.env.SLACK_WEBHOOK_URL_ERRORS,
      errorsFallsBackToOrders: !process.env.SLACK_WEBHOOK_URL_ERRORS && !!process.env.SLACK_WEBHOOK_URL
    };

    let message = 'Slack configuration status';
    if (!config.ordersWebhookConfigured) {
      message += ' - No Slack webhook configured. Notifications are disabled.';
    } else if (config.errorsFallsBackToOrders) {
      message += ' - Only the orders webhook is set; error/payment-failed notifications will post to that same channel.';
    }

    res.json({
      success: true,
      message,
      data: { config }
    });

  } catch (error) {
    console.error('Slack config check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Slack configuration'
    });
  }
};

module.exports = {
  testSlackNotification,
  checkSlackConfig
};
