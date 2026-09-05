"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from '@/contexts/LanguageContext';
import { formatRSD } from "../../../lib/currency";
import { ORDER_STATUSES, STATUS_COLORS } from "../../../lib/orderStatus";
import { API_URL } from "../../../lib/apiUrl";

export default function AdminOrdersPage() {
  const { t, plural } = useTranslation();
  const { apiCall } = useAuth();
  const { success, error: showError } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(
        `${API_URL}/api/orders`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setOrders(result.data.items || []);
        } else {
          throw new Error(result.message || t('admin.orders.fetchFailed'));
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || t('admin.orders.fetchFailed'));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      setOrders([]); // Reset orders to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(prev => new Set([...prev, orderId]));
    try {
      const response = await apiCall(
        `${API_URL}/api/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update the order in the list
          setOrders(prev => prev.map(order => 
            order._id === orderId 
              ? { ...order, status: newStatus, statusHistory: result.data.order.statusHistory }
              : order
          ));
          success(t('admin.orders.statusUpdated', { status: t(`orders.statusLabels.${newStatus}`) || newStatus }));
        } else {
          throw new Error(result.message || t('admin.orders.statusUpdateFailed'));
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || t('admin.orders.statusUpdateFailed'));
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      showError(err.message);
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleSendDeliveryInstructions = async (orderId) => {
    try {
      const response = await apiCall(
        `${API_URL}/api/orders/${orderId}/delivery-instructions`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          success(t('admin.orders.deliveryInstructionsSent'));
        } else {
          throw new Error(result.message || t('admin.orders.deliveryInstructionsFailed'));
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || t('admin.orders.deliveryInstructionsFailed'));
      }
    } catch (err) {
      console.error('Error sending delivery instructions:', err);
      showError(err.message);
    }
  };

  const formatPrice = (price) => formatRSD(price);

  const filteredOrders = (orders || []).filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {t('admin.orders.title')}
          </h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="p-6 rounded-lg" style={{ background: 'var(--surface)' }}>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {t('admin.orders.title')}
          </h1>
        </div>
        <div className="p-6 rounded-lg border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--error)' }}>
          <p className="text-red-500 font-medium mb-4">{t('admin.orders.errorLoading')}</p>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>{error}</p>
          <button
            onClick={fetchOrders}
            className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            {t('admin.dashboard.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              {t('admin.orders.title')}
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              {t('admin.orders.subtitle')}
            </p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {t('admin.orders.filterByStatus')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              <option value="all">{t('admin.orders.allOrders')}</option>
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{t(`orders.statusLabels.${s}`)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            {t('admin.orders.noOrdersFound')}
          </h3>
          <p style={{ color: 'var(--muted)' }}>
            {statusFilter === 'all' ? t('admin.orders.noOrdersPlaced') : t('admin.orders.noOrdersWithStatus', { status: statusFilter })}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="p-6 rounded-lg border hover:shadow-md transition-shadow"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
                    {t('orders.orderNumber', { number: order.orderNumber })}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {new Date(order.createdAt).toLocaleDateString('sr-Latn-RS', {
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ background: STATUS_COLORS[order.status] || '#6b7280' }}
                  >
                    {t(`orders.statusLabels.${order.status}`) || order.status}
                  </span>
                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="text-sm px-3 py-1 rounded-md hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    {t('admin.orders.viewDetails')}
                  </Link>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>{t('admin.orders.customer')}</h4>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {order.user?.firstName} {order.user?.lastName}<br />
                    {order.user?.email}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>{t('admin.orders.orderTotal')}</h4>
                  <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                    {formatPrice(order.total)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {t('orders.itemsCount', { count: order.items?.length || 0, word: plural('item', order.items?.length || 0) })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                {/* Status Update */}
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                  disabled={updatingStatus.has(order._id)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{ 
                    background: 'var(--background)', 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{t(`orders.statusLabels.${s}`)}</option>
                  ))}
                </select>

                {/* Send Delivery Instructions */}
                {(order.status === 'confirmed' || order.status === 'processing') && (
                  <button
                    onClick={() => handleSendDeliveryInstructions(order._id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                    style={{ background: 'var(--brand)', color: 'white' }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {t('admin.orders.sendDeliveryInfo')}
                  </button>
                )}

                {updatingStatus.has(order._id) && (
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    {t('admin.orders.updating')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
