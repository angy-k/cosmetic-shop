"use client";
import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007';

const STATUS_OPTIONS = [
  'pending',
  'awaiting_payment',
  'paid',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'returned'
];

const STATUS_COLORS = {
  pending: '#f59e0b',
  awaiting_payment: '#f59e0b',
  paid: '#3b82f6',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#10b981',
  delivered: '#059669',
  cancelled: '#ef4444',
  refunded: '#6b7280',
  returned: '#6b7280'
};

const STATUS_LABELS = {
  pending: 'Pending',
  awaiting_payment: 'Awaiting Payment',
  paid: 'Paid',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  returned: 'Returned'
};

export default function AdminOrderDetailPage({ params }) {
  const { id } = use(params);
  const { apiCall } = useAuth();
  const { success, error: showError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingDelivery, setSendingDelivery] = useState(false);
  const [sendingPaymentRequest, setSendingPaymentRequest] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ carrier: '', trackingNumber: '', trackingUrl: '' });
  const [savingTracking, setSavingTracking] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(`${API_URL}/api/orders/${id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch order');
      }

      setOrder(result.data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall, id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const response = await apiCall(`${API_URL}/api/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update order status');
      }

      setOrder(result.data.order);
      success(`Order status updated to ${STATUS_LABELS[newStatus] || newStatus}`);
    } catch (err) {
      showError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendDeliveryInstructions = async () => {
    setSendingDelivery(true);
    try {
      const response = await apiCall(`${API_URL}/api/orders/${id}/delivery-instructions`, {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send delivery instructions');
      }

      success('Delivery instructions sent to customer');
      fetchOrder();
    } catch (err) {
      showError(err.message);
    } finally {
      setSendingDelivery(false);
    }
  };

  const handleSendPaymentRequest = async () => {
    setSendingPaymentRequest(true);
    try {
      const response = await apiCall(`${API_URL}/api/orders/${id}/payment-request`, {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send payment request email');
      }

      success('Payment request email sent');
      fetchOrder();
    } catch (err) {
      showError(err.message);
    } finally {
      setSendingPaymentRequest(false);
    }
  };

  const handleAddTracking = async (e) => {
    e.preventDefault();
    if (!trackingForm.carrier.trim() || !trackingForm.trackingNumber.trim()) {
      showError('Carrier and tracking number are required');
      return;
    }

    setSavingTracking(true);
    try {
      const response = await apiCall(`${API_URL}/api/orders/${id}/tracking`, {
        method: 'POST',
        body: JSON.stringify(trackingForm),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to add tracking information');
      }

      setOrder(result.data.order);
      success('Tracking information added');
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingTracking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/orders" className="text-sm hover:underline" style={{ color: 'var(--brand)' }}>
          ← Back to Orders
        </Link>
        <div className="mt-4 p-6 rounded-lg border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--error)' }}>
          <p className="text-red-500 font-medium mb-4">Error loading order</p>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>{error || 'Order not found'}</p>
          <button
            onClick={fetchOrder}
            className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || '#6b7280';
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const canSendDelivery = ['confirmed', 'processing', 'shipped'].includes(order.status);
  const paymentUrlValid = order.payment?.paymentUrl && !(order.payment?.paymentUrlExpiresAt && new Date(order.payment.paymentUrlExpiresAt) < new Date());
  const canSendPaymentRequest = ['pending', 'awaiting_payment'].includes(order.status) && paymentUrlValid;

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/admin/orders" className="text-sm hover:underline" style={{ color: 'var(--brand)' }}>
        ← Back to Orders
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3 mt-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Order #{order.orderNumber}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-sm font-medium text-white h-fit"
          style={{ background: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Items</h2>
            <div className="space-y-3">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm pb-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p style={{ color: 'var(--foreground)' }}>{item.productSnapshot?.name || 'Product'}</p>
                    <p style={{ color: 'var(--muted)' }}>
                      SKU: {item.productSnapshot?.sku || '—'} · Qty: {item.quantity} · {formatPrice(item.price)} each
                    </p>
                  </div>
                  <span style={{ color: 'var(--foreground)' }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--muted)' }}>Tax</span>
                <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.tax?.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--muted)' }}>Shipping</span>
                <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.shipping?.cost)}</span>
              </div>
              {order.discount?.amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>Discount {order.discount.code ? `(${order.discount.code})` : ''}</span>
                  <span style={{ color: 'var(--foreground)' }}>-{formatPrice(order.discount.amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--foreground)' }}>Total</span>
                <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Shipping Address</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {order.shippingAddress?.street}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                {order.shippingAddress?.country}
              </p>
            </div>
            <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Billing Address</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {order.billingAddress?.street}<br />
                {order.billingAddress?.city}, {order.billingAddress?.state} {order.billingAddress?.zipCode}<br />
                {order.billingAddress?.country}
              </p>
            </div>
          </div>

          {/* Tracking */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Tracking</h2>
            {order.tracking?.trackingNumber ? (
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                {order.tracking.carrier} — {order.tracking.trackingNumber}
                {order.tracking.trackingUrl && (
                  <>
                    {' '}
                    <a href={order.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--brand)' }}>
                      (track)
                    </a>
                  </>
                )}
              </p>
            ) : (
              <form onSubmit={handleAddTracking} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Carrier (e.g. DHL)"
                  value={trackingForm.carrier}
                  onChange={(e) => setTrackingForm(prev => ({ ...prev, carrier: e.target.value }))}
                  className="px-3 py-2 border rounded-lg text-sm"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
                <input
                  type="text"
                  placeholder="Tracking number"
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  className="px-3 py-2 border rounded-lg text-sm"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tracking URL (optional)"
                    value={trackingForm.trackingUrl}
                    onChange={(e) => setTrackingForm(prev => ({ ...prev, trackingUrl: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                  <button
                    type="submit"
                    disabled={savingTracking}
                    className="px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ background: 'var(--brand)', color: 'white' }}
                  >
                    {savingTracking ? '...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Notifications history */}
          {order.notifications?.length > 0 && (
            <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Notification History</h2>
              <div className="space-y-1">
                {order.notifications.map((n, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--foreground)' }}>{n.type}</span>
                    <span style={{ color: n.success ? 'var(--muted)' : 'var(--error)' }}>
                      {n.success ? 'sent' : 'failed'} · {formatDate(n.sentAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Customer</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {order.customer?.name}<br />
              {order.customer?.email}<br />
              {order.customer?.phone || '—'}
            </p>
          </div>

          {/* Payment */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Payment</h2>
            <p className="text-sm space-y-1" style={{ color: 'var(--muted)' }}>
              Method: <span style={{ color: 'var(--foreground)' }}>{order.payment?.method || '—'}</span><br />
              Status: <span style={{ color: 'var(--foreground)' }}>{order.payment?.status || '—'}</span><br />
              {order.payment?.paidAt && <>Paid at: <span style={{ color: 'var(--foreground)' }}>{formatDate(order.payment.paidAt)}</span><br /></>}
              {order.payment?.stripePaymentIntentId && <>Stripe PI: <span style={{ color: 'var(--foreground)' }}>{order.payment.stripePaymentIntentId}</span></>}
            </p>
          </div>

          {/* Status update */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Update Status</h2>
            <select
              value={order.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={updatingStatus}
              className="w-full px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="p-6 rounded-lg border space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Actions</h2>
            {canSendDelivery && (
              <button
                onClick={handleSendDeliveryInstructions}
                disabled={sendingDelivery}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: 'var(--brand)', color: 'white' }}
              >
                {sendingDelivery ? 'Sending...' : 'Send Delivery Instructions'}
              </button>
            )}
            {canSendPaymentRequest && (
              <button
                onClick={handleSendPaymentRequest}
                disabled={sendingPaymentRequest}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {sendingPaymentRequest ? 'Sending...' : 'Send Payment Request Email'}
              </button>
            )}
            {!canSendDelivery && !canSendPaymentRequest && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No actions available for this order status.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
