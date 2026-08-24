"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

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

export default function AdminDashboardPage() {
  const { apiCall } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(`${API_URL}/api/admin/stats`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch stats');
      }

      setStats(result.data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="p-6 rounded-lg border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--error)' }}>
          <p className="text-red-500 font-medium mb-4">Error loading dashboard</p>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>{error || 'Something went wrong'}</p>
          <button
            onClick={fetchStats}
            className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Total Products', value: stats.totalProducts },
    { label: 'Total Orders', value: stats.totalOrders },
    { label: 'Revenue (Paid Orders)', value: formatPrice(stats.totalRevenue) }
  ];

  const totalStatusCount = Object.values(stats.ordersByStatus || {}).reduce((sum, n) => sum + n, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        Dashboard
      </h1>

      {stats.lowStockProducts > 0 && (
        <div className="p-4 rounded-lg border flex items-center justify-between" style={{ background: '#fff3cd', borderColor: '#ffeaa7' }}>
          <p className="text-sm" style={{ color: '#856404' }}>
            ⚠️ {stats.lowStockProducts} product{stats.lowStockProducts === 1 ? ' is' : 's are'} low on stock.
          </p>
          <Link href="/admin/products" className="text-sm font-medium underline" style={{ color: '#856404' }}>
            View Products
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="p-5 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{card.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders by status */}
        <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Orders by Status</h2>
          {totalStatusCount === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--foreground)' }}>{STATUS_LABELS[status] || status}</span>
                    <span style={{ color: 'var(--muted)' }}>{count}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'var(--background)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max(4, (count / totalStatusCount) * 100)}%`,
                        background: STATUS_COLORS[status] || '#6b7280'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-2 p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm hover:underline" style={{ color: 'var(--brand)' }}>
              View All
            </Link>
          </div>
          {stats.recentOrders?.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No orders yet.</p>
          ) : (
            <div className="space-y-1">
              {stats.recentOrders.map((order) => (
                <Link
                  key={order._id}
                  href={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg text-sm hover:bg-black/5 transition-colors"
                >
                  <div>
                    <p style={{ color: 'var(--foreground)' }}>#{order.orderNumber}</p>
                    <p style={{ color: 'var(--muted)' }}>{order.customer?.name || order.customer?.email || '—'} · {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: 'var(--foreground)' }}>{formatPrice(order.total)}</p>
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs text-white"
                      style={{ background: STATUS_COLORS[order.status] || '#6b7280' }}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/admin/products', label: 'Manage Products' },
          { href: '/admin/orders', label: 'Manage Orders' },
          { href: '/admin/newsletter', label: 'Newsletter' },
          { href: '/admin/email-test', label: 'Email Test' }
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="p-4 rounded-lg border text-center text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
