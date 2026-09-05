"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from '@/contexts/LanguageContext';
import { formatRSD } from "../../lib/currency";
import { STATUS_COLORS } from "../../lib/orderStatus";
import { API_URL } from "../../lib/apiUrl";

export default function AdminDashboardPage() {
  const { t, plural } = useTranslation();
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

  const formatPrice = (price) => formatRSD(price || 0);

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('sr-Latn-RS', { year: 'numeric', month: 'short', day: 'numeric' });
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
          <p className="text-red-500 font-medium mb-4">{t('admin.dashboard.errorLoading')}</p>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>{error || t('admin.dashboard.somethingWrong')}</p>
          <button
            onClick={fetchStats}
            className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            {t('admin.dashboard.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: t('admin.dashboard.totalUsers'), value: stats.totalUsers },
    { label: t('admin.dashboard.totalProducts'), value: stats.totalProducts },
    { label: t('admin.dashboard.totalOrders'), value: stats.totalOrders },
    { label: t('admin.dashboard.revenue'), value: formatPrice(stats.totalRevenue) }
  ];

  const totalStatusCount = Object.values(stats.ordersByStatus || {}).reduce((sum, n) => sum + n, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        {t('admin.dashboard.title')}
      </h1>

      {stats.lowStockProducts > 0 && (
        <div className="p-4 rounded-lg border flex items-center justify-between" style={{ background: '#fff3cd', borderColor: '#ffeaa7' }}>
          <p className="text-sm" style={{ color: '#856404' }}>
            ⚠️ {t('admin.dashboard.lowStockWarning', { count: stats.lowStockProducts, word: plural('productIs', stats.lowStockProducts) })}
          </p>
          <Link href="/admin/products" className="text-sm font-medium underline" style={{ color: '#856404' }}>
            {t('admin.dashboard.viewProducts')}
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
          <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>{t('admin.dashboard.ordersByStatus')}</h2>
          {totalStatusCount === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('admin.dashboard.noOrdersYet')}</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--foreground)' }}>{t(`orders.statusLabels.${status}`) || status}</span>
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
            <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>{t('admin.dashboard.recentOrders')}</h2>
            <Link href="/admin/orders" className="text-sm hover:underline" style={{ color: 'var(--brand)' }}>
              {t('admin.dashboard.viewAll')}
            </Link>
          </div>
          {stats.recentOrders?.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('admin.dashboard.noOrdersYet')}</p>
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
                      {t(`orders.statusLabels.${order.status}`) || order.status}
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
          { href: '/admin/products', label: t('admin.dashboard.manageProducts') },
          { href: '/admin/orders', label: t('admin.dashboard.manageOrders') },
          { href: '/admin/newsletter', label: t('admin.navNewsletter') },
          { href: '/admin/email-test', label: t('admin.navEmailTest') }
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
