"use client";
import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007';

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

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const { user, loading: authLoading, apiCall } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <p style={{ color: 'var(--foreground)' }}>Please log in to view this order.</p>
          <Link href="/login" className="inline-block mt-4 underline" style={{ color: 'var(--brand)' }}>
            Go to login
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
            ← Back to My Orders
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
      </div>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || '#6b7280';
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/orders" className="text-sm hover:underline" style={{ color: 'var(--brand)' }}>
          ← Back to My Orders
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
                        Qty: {item.quantity} · {formatPrice(item.price)} each
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
                  <span style={{ color: 'var(--foreground)' }}>
                    {order.shipping?.cost === 0 ? 'Free' : formatPrice(order.shipping?.cost)}
                  </span>
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
            {order.tracking?.trackingNumber && (
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Tracking</h2>
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
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Payment</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Method: <span style={{ color: 'var(--foreground)' }}>{order.payment?.method || '—'}</span><br />
                Status: <span style={{ color: 'var(--foreground)' }}>{order.payment?.status || '—'}</span>
                {order.payment?.paidAt && (
                  <><br />Paid at: <span style={{ color: 'var(--foreground)' }}>{formatDate(order.payment.paidAt)}</span></>
                )}
              </p>
            </div>

            {order.notifications?.length > 0 && (
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Updates</h2>
                <div className="space-y-1">
                  {order.notifications.map((n, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--foreground)' }}>{n.type}</span>
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
