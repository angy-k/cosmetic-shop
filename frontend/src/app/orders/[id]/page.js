"use client";
import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from "../../../components/PaymentForm";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from '@/contexts/LanguageContext';
import { formatRSD, rsdToEurCents } from "../../../lib/currency";
import { STATUS_COLORS, PAYMENT_STATUSES } from "../../../lib/orderStatus";
import { API_URL } from "../../../lib/apiUrl";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Payment statuses where a retry makes sense
const RETRYABLE_PAYMENT_STATUSES = ['pending', 'processing', 'failed'];
const NON_RETRYABLE_ORDER_STATUSES = ['cancelled', 'refunded', 'returned'];

export default function OrderDetailPage({ params }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const { user, loading: authLoading, apiCall } = useAuth();
  const { success, error: showError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [clientSecret, setClientSecret] = useState(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

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
    if (!authLoading && user) {
      fetchOrder();
    }
  }, [authLoading, user, fetchOrder]);

  const handleStartRetry = async () => {
    if (!order) return;
    try {
      setInitiatingPayment(true);
      const response = await apiCall(`${API_URL}/api/payment/create-payment-intent`, {
        method: 'POST',
        body: JSON.stringify({
          orderId: order._id,
          amount: rsdToEurCents(order.total), // Stripe charges in EUR, not RSD
          currency: 'eur',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.clientSecret) {
        throw new Error(result.error || result.message || t('checkout.failedToInitPayment'));
      }
      setClientSecret(result.clientSecret);
    } catch (err) {
      showError(err.message || t('checkout.failedToInitPayment'));
    } finally {
      setInitiatingPayment(false);
    }
  };

  // Reports the retry outcome to the backend (see confirmPaymentResult)
  const reportPaymentResult = async (paymentIntentId) => {
    if (!paymentIntentId) return;
    try {
      await apiCall(`${API_URL}/api/payment/confirm-result`, {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId }),
      });
    } catch (err) {
      console.error('Failed to report payment result to backend:', err);
    }
  };

  const handleRetrySuccess = async (paymentIntent) => {
    await reportPaymentResult(paymentIntent?.id);
    success(t('checkout.paymentSuccessful'));
    setClientSecret(null);
    fetchOrder();
  };

  const handleRetryError = async (err, paymentIntentId) => {
    showError(err.message || t('checkout.paymentFailed'));
    await reportPaymentResult(paymentIntentId);
    fetchOrder();
  };

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

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <p style={{ color: 'var(--foreground)' }}>{t('orderDetail.pleaseLogin')}</p>
          <Link href="/login" className="inline-block mt-4 underline" style={{ color: 'var(--brand)' }}>
            {t('orderDetail.goToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/orders" className="text-sm hover:underline" style={{ color: 'var(--brand)' }}>
            {t('orderDetail.backToOrders')}
          </Link>
          <div className="mt-4 p-6 rounded-lg border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--error)' }}>
            <p className="text-red-500 font-medium mb-4">{t('orderDetail.errorLoadingOrder')}</p>
            <p className="mb-4" style={{ color: 'var(--muted)' }}>{error || t('orderDetail.orderNotFound')}</p>
            <button
              onClick={fetchOrder}
              className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {t('common.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || '#6b7280';
  const statusLabel = order.status in STATUS_COLORS ? t(`orders.statusLabels.${order.status}`) : order.status;

  const paymentStatusLabel = order.payment?.status && PAYMENT_STATUSES.includes(order.payment.status)
    ? t(`orders.paymentStatusLabels.${order.payment.status}`)
    : (order.payment?.status || '—');

  const NOTIFICATION_TYPE_KEYS = ['order-confirmation', 'payment-request', 'payment-received', 'payment-failed', 'shipped', 'delivered', 'cancelled'];
  const notificationLabel = (type) => NOTIFICATION_TYPE_KEYS.includes(type) ? t(`notificationTypeLabels.${type}`) : type;

  // Only the card/Stripe flow has a payment intent to retry
  const canRetryPayment = order.payment?.method !== 'paypal'
    && RETRYABLE_PAYMENT_STATUSES.includes(order.payment?.status)
    && !NON_RETRYABLE_ORDER_STATUSES.includes(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/orders" className="text-sm hover:underline" style={{ color: 'var(--brand)' }}>
          {t('orderDetail.backToOrders')}
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-3 mt-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              {t('orders.orderNumber', { number: order.orderNumber })}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              {t('orderDetail.placed', { date: formatDate(order.createdAt) })}
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
                        {t('checkout.itemQty', { qty: item.quantity })} · {formatPrice(item.price)} {t('orderDetail.each')}
                      </p>
                    </div>
                    <span style={{ color: 'var(--foreground)' }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-4 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>{t('cart.subtotal').replace(':', '')}</span>
                  <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>{t('cart.tax').replace(':', '')}</span>
                  <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.tax?.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>{t('cart.shipping').replace(':', '')}</span>
                  <span style={{ color: 'var(--foreground)' }}>
                    {order.shipping?.cost === 0 ? t('common.free') : formatPrice(order.shipping?.cost)}
                  </span>
                </div>
                {order.discount?.amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--muted)' }}>{t('orderDetail.discount')} {order.discount.code ? `(${order.discount.code})` : ''}</span>
                    <span style={{ color: 'var(--foreground)' }}>-{formatPrice(order.discount.amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--foreground)' }}>{t('cart.total').replace(':', '')}</span>
                  <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{t('checkout.shippingAddress')}</h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {order.shippingAddress?.street}<br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                  {order.shippingAddress?.country}
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{t('checkout.billingAddress')}</h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {order.billingAddress?.street}<br />
                  {order.billingAddress?.city}, {order.billingAddress?.state} {order.billingAddress?.zipCode}<br />
                  {order.billingAddress?.country}
                </p>
              </div>
            </div>

            {/* Tracking */}
            {order.tracking?.trackingNumber && (
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{t('orderDetail.tracking')}</h2>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {order.tracking.carrier} — {order.tracking.trackingNumber}
                  {order.tracking.trackingUrl && (
                    <>
                      {' '}
                      <a href={order.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--brand)' }}>
                        {t('orderDetail.track')}
                      </a>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{t('orders.payment')}</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {t('orders.method')} <span style={{ color: 'var(--foreground)' }}>{order.payment?.method || '—'}</span><br />
                {t('orders.status')} <span style={{ color: 'var(--foreground)' }}>{paymentStatusLabel}</span>
                {order.payment?.paidAt && (
                  <><br />{t('orderDetail.paidAt')} <span style={{ color: 'var(--foreground)' }}>{formatDate(order.payment.paidAt)}</span></>
                )}
              </p>
            </div>

            {canRetryPayment && (
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>{t('orderDetail.retryPayment')}</h2>
                {clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm
                      clientSecret={clientSecret}
                      onPaymentSuccess={handleRetrySuccess}
                      onError={handleRetryError}
                      submitting={submittingPayment}
                      setSubmitting={setSubmittingPayment}
                    />
                  </Elements>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartRetry}
                    disabled={initiatingPayment}
                    className="w-full py-3 px-4 rounded-md text-white font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'var(--brand)' }}
                  >
                    {initiatingPayment ? t('checkout.preparingCheckout') : t('orderDetail.retryPaymentButton')}
                  </button>
                )}
              </div>
            )}

            {order.notifications?.length > 0 && (
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>{t('orderDetail.updates')}</h2>
                <div className="space-y-1">
                  {order.notifications.map((n, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--foreground)' }}>{notificationLabel(n.type)}</span>
                      <span style={{ color: 'var(--muted)' }}>{formatDate(n.sentAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
