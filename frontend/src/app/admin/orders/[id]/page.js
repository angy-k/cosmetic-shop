"use client";
import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from '@/contexts/LanguageContext';
import { formatRSD } from "../../../../lib/currency";
import { ORDER_STATUSES, STATUS_COLORS, PAYMENT_STATUSES } from "../../../../lib/orderStatus";
import { API_URL } from "../../../../lib/apiUrl";

export default function AdminOrderDetailPage({ params }) {
  const { t } = useTranslation();
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
        throw new Error(result.message || t('admin.orderDetail.fetchFailed'));
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

  const formatPrice = (price) => formatRSD(price || 0);

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('sr-Latn-RS', {
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
        throw new Error(result.message || t('admin.orderDetail.statusUpdateFailed'));
      }

      setOrder(result.data.order);
      success(t('admin.orders.statusUpdated', { status: t(`orders.statusLabels.${newStatus}`) || newStatus }));
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
        throw new Error(result.message || t('admin.orderDetail.deliveryInstructionsFailed'));
      }

      success(t('admin.orders.deliveryInstructionsSent'));
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
        throw new Error(result.message || t('admin.orderDetail.paymentRequestFailed'));
      }

      success(t('admin.orderDetail.paymentRequestSent'));
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
      showError(t('admin.orderDetail.carrierRequired'));
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
        throw new Error(result.message || t('admin.orderDetail.trackingAddFailed'));
      }

      setOrder(result.data.order);
      success(t('admin.orderDetail.trackingAdded'));
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
          {t('admin.orderDetail.backToOrders')}
        </Link>
        <div className="mt-4 p-6 rounded-lg border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--error)' }}>
          <p className="text-red-500 font-medium mb-4">{t('admin.orderDetail.errorLoadingOrder')}</p>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>{error || t('admin.orderDetail.orderNotFound')}</p>
          <button
            onClick={fetchOrder}
            className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            {t('admin.dashboard.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || '#6b7280';
  const statusLabel = t(`orders.statusLabels.${order.status}`) || order.status;

  const paymentStatusLabel = order.payment?.status && PAYMENT_STATUSES.includes(order.payment.status)
    ? t(`orders.paymentStatusLabels.${order.payment.status}`)
    : (order.payment?.status || '—');

  const NOTIFICATION_TYPE_KEYS = ['order-confirmation', 'payment-request', 'payment-received', 'payment-failed', 'shipped', 'delivered', 'cancelled'];
  const notificationLabel = (type) => NOTIFICATION_TYPE_KEYS.includes(type) ? t(`notificationTypeLabels.${type}`) : type;

  const canSendDelivery = ['confirmed', 'processing', 'shipped'].includes(order.status);
  const paymentUrlValid = order.payment?.paymentUrl && !(order.payment?.paymentUrlExpiresAt && new Date(order.payment.paymentUrlExpiresAt) < new Date());
  const canSendPaymentRequest = ['pending', 'awaiting_payment'].includes(order.status) && paymentUrlValid;

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/admin/orders" className="text-sm hover:underline" style={{ color: 'var(--brand)' }}>
        {t('admin.orderDetail.backToOrders')}
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3 mt-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {t('orders.orderNumber', { number: order.orderNumber })}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {t('admin.orderDetail.placed', { date: formatDate(order.createdAt) })}
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
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Items */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>{t('orders.items')}</h2>
            <div className="space-y-3">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm pb-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p style={{ color: 'var(--foreground)' }}>{item.productSnapshot?.name || 'Product'}</p>
                    <p style={{ color: 'var(--muted)' }}>
                      SKU: {item.productSnapshot?.sku || '—'} · {t('admin.orderDetail.qty')}: {item.quantity} · {formatPrice(item.price)} {t('admin.orderDetail.each')}
                    </p>
                  </div>
                  <span style={{ color: 'var(--foreground)' }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--muted)' }}>{t('cart.subtotal')}</span>
                <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--muted)' }}>{t('cart.tax')}</span>
                <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.tax?.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--muted)' }}>{t('cart.shipping')}</span>
                <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.shipping?.cost)}</span>
              </div>
              {order.discount?.amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>{t('orderDetail.discount')} {order.discount.code ? `(${order.discount.code})` : ''}</span>
                  <span style={{ color: 'var(--foreground)' }}>-{formatPrice(order.discount.amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--foreground)' }}>{t('cart.total')}</span>
                <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{t('admin.orderDetail.shippingAddress')}</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {order.shippingAddress?.street}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                {order.shippingAddress?.country}
              </p>
            </div>
            <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{t('admin.orderDetail.billingAddress')}</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {order.billingAddress?.street}<br />
                {order.billingAddress?.city}, {order.billingAddress?.state} {order.billingAddress?.zipCode}<br />
                {order.billingAddress?.country}
              </p>
            </div>
          </div>

          {/* Tracking */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>{t('admin.orderDetail.tracking')}</h2>
            {order.tracking?.trackingNumber ? (
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                {order.tracking.carrier} — {order.tracking.trackingNumber}
                {order.tracking.trackingUrl && (
                  <>
                    {' '}
                    <a href={order.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--brand)' }}>
                      {t('admin.orderDetail.track')}
                    </a>
                  </>
                )}
              </p>
            ) : (
              <form onSubmit={handleAddTracking} className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder={t('admin.orderDetail.carrierPlaceholder')}
                  value={trackingForm.carrier}
                  onChange={(e) => setTrackingForm(prev => ({ ...prev, carrier: e.target.value }))}
                  className="flex-1 min-w-[140px] px-3 py-2 border rounded-lg text-sm"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
                <input
                  type="text"
                  placeholder={t('admin.orderDetail.trackingNumberPlaceholder')}
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  className="flex-1 min-w-[140px] px-3 py-2 border rounded-lg text-sm"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
                <input
                  type="text"
                  placeholder={t('admin.orderDetail.trackingUrlPlaceholder')}
                  value={trackingForm.trackingUrl}
                  onChange={(e) => setTrackingForm(prev => ({ ...prev, trackingUrl: e.target.value }))}
                  className="flex-1 min-w-[160px] px-3 py-2 border rounded-lg text-sm"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
                <button
                  type="submit"
                  disabled={savingTracking}
                  className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--brand)', color: 'white' }}
                >
                  {savingTracking ? '...' : t('admin.orderDetail.save')}
                </button>
              </form>
            )}
          </div>

          {/* Notifications history */}
          {order.notifications?.length > 0 && (
            <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>{t('admin.orderDetail.notificationHistory')}</h2>
              <div className="space-y-1">
                {order.notifications.map((n, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--foreground)' }}>{notificationLabel(n.type)}</span>
                    <span style={{ color: n.success ? 'var(--muted)' : 'var(--error)' }}>
                      {n.success ? t('admin.orderDetail.sent') : t('admin.orderDetail.failed')} · {formatDate(n.sentAt)}
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
            <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{t('admin.orderDetail.customer')}</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {order.customer?.name}<br />
              {order.customer?.email}<br />
              {order.customer?.phone || '—'}
            </p>
          </div>

          {/* Payment */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{t('admin.orderDetail.payment')}</h2>
            <p className="text-sm space-y-1" style={{ color: 'var(--muted)' }}>
              {t('admin.orderDetail.method')} <span style={{ color: 'var(--foreground)' }}>{order.payment?.method || '—'}</span><br />
              {t('admin.orderDetail.status')} <span style={{ color: 'var(--foreground)' }}>{paymentStatusLabel}</span><br />
              {order.payment?.paidAt && <>{t('admin.orderDetail.paidAt')} <span style={{ color: 'var(--foreground)' }}>{formatDate(order.payment.paidAt)}</span><br /></>}
              {order.payment?.stripePaymentIntentId && <>Stripe PI: <span style={{ color: 'var(--foreground)' }}>{order.payment.stripePaymentIntentId}</span></>}
            </p>
          </div>

          {/* Status update */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>{t('admin.orderDetail.updateStatus')}</h2>
            <select
              value={order.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={updatingStatus}
              className="w-full px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{t(`orders.statusLabels.${s}`)}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="p-6 rounded-lg border space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{t('admin.orderDetail.actions')}</h2>
            {canSendDelivery && (
              <button
                onClick={handleSendDeliveryInstructions}
                disabled={sendingDelivery}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: 'var(--brand)', color: 'white' }}
              >
                {sendingDelivery ? t('admin.newsletter.sending') : t('admin.orderDetail.sendDeliveryInstructions')}
              </button>
            )}
            {canSendPaymentRequest && (
              <button
                onClick={handleSendPaymentRequest}
                disabled={sendingPaymentRequest}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {sendingPaymentRequest ? t('admin.newsletter.sending') : t('admin.orderDetail.sendPaymentRequest')}
              </button>
            )}
            {!canSendDelivery && !canSendPaymentRequest && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('admin.orderDetail.noActionsAvailable')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
