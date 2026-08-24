"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007';
const PAGE_SIZE = 10;

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

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading, apiCall } = useAuth();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(
        `${API_URL}/api/orders/mine?page=${page}&limit=${PAGE_SIZE}`
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch orders');
      }

      setOrders(result.data.items || []);
      setPagination(result.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchOrders(1);
  }, [authLoading, user, router, fetchOrders]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpanded = (orderId) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  if (authLoading || (loading && orders.length === 0 && !error)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--foreground)' }}>
            My Orders
          </h1>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--foreground)' }}>
            My Orders
          </h1>
          <div className="p-6 rounded-lg border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--error)' }}>
            <p className="text-red-500 font-medium mb-4">Error loading orders</p>
            <p className="mb-4" style={{ color: 'var(--muted)' }}>{error}</p>
            <button
              onClick={() => fetchOrders(pagination.page || 1)}
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--foreground)' }}>
          My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-12 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              No orders yet
            </h3>
            <p className="mb-6" style={{ color: 'var(--muted)' }}>
              When you place an order, it will show up here.
            </p>
            <Link
              href="/products"
              className="inline-block py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order._id;
                const statusColor = STATUS_COLORS[order.status] || '#6b7280';
                const statusLabel = STATUS_LABELS[order.status] || order.status;

                return (
                  <div
                    key={order._id}
                    className="rounded-lg border overflow-hidden"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                        <div>
                          <h3 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-sm font-medium text-white h-fit"
                          style={{ background: statusColor }}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                            {formatPrice(order.total)}
                          </span>
                          <button
                            onClick={() => toggleExpanded(order._id)}
                            className="text-sm px-3 py-1 rounded-md hover:opacity-80 transition-opacity"
                            style={{ background: 'var(--accent)', color: 'white' }}
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <h4 className="font-medium mb-3 mt-3" style={{ color: 'var(--foreground)' }}>Items</h4>
                        <div className="space-y-2 mb-4">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span style={{ color: 'var(--foreground)' }}>
                                {item.productSnapshot?.name || 'Product'} × {item.quantity}
                              </span>
                              <span style={{ color: 'var(--muted)' }}>
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>Shipping Address</h4>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>
                              {order.shippingAddress?.street}<br />
                              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                              {order.shippingAddress?.country}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>Payment</h4>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>
                              Method: {order.payment?.method || '—'}<br />
                              Status: {order.payment?.status || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
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
                          <div className="flex justify-between font-semibold pt-1">
                            <span style={{ color: 'var(--foreground)' }}>Total</span>
                            <span style={{ color: 'var(--foreground)' }}>{formatPrice(order.total)}</span>
                          </div>
                        </div>

                        {order.tracking?.trackingNumber && (
                          <div className="mt-4 pt-3 border-t text-sm" style={{ borderColor: 'var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>Tracking ({order.tracking.carrier}): </span>
                            {order.tracking.trackingUrl ? (
                              <a
                                href={order.tracking.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                                style={{ color: 'var(--brand)' }}
                              >
                                {order.tracking.trackingNumber}
                              </a>
                            ) : (
                              <span style={{ color: 'var(--foreground)' }}>{order.tracking.trackingNumber}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => fetchOrders(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 rounded-md border text-sm disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  Previous
                </button>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => fetchOrders(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-2 rounded-md border text-sm disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
