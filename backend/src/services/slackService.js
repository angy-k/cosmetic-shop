// Lightweight Slack notifications via Incoming Webhooks - orders
// (SLACK_WEBHOOK_URL) and errors/failed payments (SLACK_WEBHOOK_URL_ERRORS),
// split into two channels so routine notices don't bury real problems.
// SLACK_WEBHOOK_URL_ERRORS falls back to the orders webhook if unset; if
// neither is set, every function below becomes a no-op (fine for local dev).
// Get a webhook URL from Slack: Incoming Webhooks -> Add New Webhook to
// Workspace (https://api.slack.com/messaging/webhooks).

const WEBHOOK_URLS = {
  orders: process.env.SLACK_WEBHOOK_URL,
  errors: process.env.SLACK_WEBHOOK_URL_ERRORS || process.env.SLACK_WEBHOOK_URL
};

const warnedMissingWebhook = new Set();

// In-memory de-dupe so a crash loop doesn't spam the channel with the same error.
const recentErrorSignatures = new Map(); // signature -> last-sent timestamp (ms)
const ERROR_DEDUPE_WINDOW_MS = 60 * 1000;

async function postToSlack(channel, payload) {
  const url = WEBHOOK_URLS[channel];
  if (!url) {
    if (!warnedMissingWebhook.has(channel)) {
      const envVar = channel === 'errors' ? 'SLACK_WEBHOOK_URL_ERRORS or SLACK_WEBHOOK_URL' : 'SLACK_WEBHOOK_URL';
      console.log(`${envVar} not set - Slack notifications (${channel}) are disabled`);
      warnedMissingWebhook.add(channel);
    }
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.error(`Slack webhook responded with ${response.status}: ${await response.text()}`);
    }
  } catch (err) {
    // A Slack outage should never take down the app - just log it.
    console.error('Failed to send Slack notification:', err.message);
  }
}

const formatRSD = (amount) =>
  `${new Intl.NumberFormat('sr-Latn-RS', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0)} RSD`;

// order.payment.status values (see Order model) translated for Slack messages.
const PAYMENT_STATUS_LABELS_SR = {
  pending: 'Na čekanju',
  processing: 'U obradi',
  completed: 'Završeno',
  failed: 'Neuspešno',
  refunded: 'Refundirano'
};

/**
 * Notify the team that a new order was placed.
 *
 * This fires as soon as the order is created - before any payment attempt -
 * so the payment status shown here will normally be "Na čekanju". A separate
 * notification (notifyPaymentSucceeded / notifyPaymentFailed) reports the
 * actual outcome once Stripe confirms it.
 */
async function notifyNewOrder(order) {
  const itemsList = (order.items || [])
    .map((it) => `• ${it.productSnapshot?.name || 'Proizvod'} x${it.quantity}`)
    .join('\n') || '—';
  const paymentStatusLabel = PAYMENT_STATUS_LABELS_SR[order.payment?.status] || order.payment?.status || 'Na čekanju';

  await postToSlack('orders', {
    text: `Nova porudžbina ${order.orderNumber} — ${formatRSD(order.total)} (uplata: ${paymentStatusLabel})`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Nova porudžbina* \`${order.orderNumber}\`` }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Kupac:*\n${order.customer?.name || '—'}` },
          { type: 'mrkdwn', text: `*Ukupno:*\n${formatRSD(order.total)}` },
          { type: 'mrkdwn', text: `*Email:*\n${order.customer?.email || '—'}` },
          { type: 'mrkdwn', text: `*Način plaćanja:*\n${order.payment?.method || '—'}` },
          { type: 'mrkdwn', text: `*Status uplate:*\n${paymentStatusLabel}` }
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Stavke:*\n${itemsList}` }
      }
    ]
  });
}

/**
 * Notify the team that a payment succeeded for an existing order.
 */
async function notifyPaymentSucceeded(order) {
  await postToSlack('orders', {
    text: `Uplata primljena za porudžbinu ${order.orderNumber} — ${formatRSD(order.total)}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Uplata primljena*\nPorudžbina: \`${order.orderNumber}\`\nKupac: ${order.customer?.email || '—'}\nIznos: ${formatRSD(order.total)}`
        }
      }
    ]
  });
}

/**
 * Notify the team that a payment failed for an existing order.
 */
async function notifyPaymentFailed(order) {
  await postToSlack('errors', {
    text: `Neuspelo plaćanje za porudžbinu ${order.orderNumber}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Neuspelo plaćanje*\nPorudžbina: \`${order.orderNumber}\`\nKupac: ${order.customer?.email || '—'}\nIznos: ${formatRSD(order.total)}`
        }
      }
    ]
  });
}

/**
 * Report an unexpected error. `context.source` labels where it came from
 * (e.g. "API", "unhandledRejection", "MongoDB connection") and `context.route`
 * optionally adds the request path. Identical errors from the same source are
 * de-duplicated for a minute so a crash loop doesn't flood the channel.
 */
async function notifyError(error, context = {}) {
  const message = error?.message || String(error);
  const signature = `${context.source || 'error'}:${message}`;

  const now = Date.now();
  const lastSent = recentErrorSignatures.get(signature);
  if (lastSent && now - lastSent < ERROR_DEDUPE_WINDOW_MS) {
    return;
  }
  recentErrorSignatures.set(signature, now);
  // Rough safety valve against unbounded growth on a long-running process.
  if (recentErrorSignatures.size > 500) {
    recentErrorSignatures.clear();
  }

  const stackPreview = (error?.stack || '').split('\n').slice(0, 4).join('\n');

  await postToSlack('errors', {
    text: `Greška u ${context.source || 'aplikaciji'}: ${message}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Greška — ${context.source || 'server'}*\n${context.route ? `Ruta: \`${context.route}\`\n` : ''}${message}`
        }
      },
      ...(stackPreview ? [{
        type: 'section',
        text: { type: 'mrkdwn', text: `\`\`\`${stackPreview}\`\`\`` }
      }] : [])
    ]
  });
}

module.exports = { notifyNewOrder, notifyPaymentSucceeded, notifyPaymentFailed, notifyError };
