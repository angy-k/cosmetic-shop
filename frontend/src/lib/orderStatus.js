// Single source of truth for order/payment statuses and colors - mirrors
// Order.js's enums. Labels live in lib/translations (orders.statusLabels).

export const ORDER_STATUSES = [
  'pending',
  'awaiting_payment',
  'paid',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'returned',
];

export const STATUS_COLORS = {
  pending: '#f59e0b',
  awaiting_payment: '#f59e0b',
  paid: '#3b82f6',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#10b981',
  delivered: '#059669',
  cancelled: '#ef4444',
  refunded: '#6b7280',
  returned: '#6b7280',
};

export const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded'];
