"use client";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from '@/contexts/LanguageContext';

export default function AdminLayout({ children }) {
  const { t } = useTranslation();
  const { isAdmin, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [isAdmin, loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--brand)' }}></div>
          <p style={{ color: 'var(--muted)' }}>{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {t('admin.accessDenied')}
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            {t('admin.accessDeniedText')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Admin Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              {t('admin.panelTitle')}
            </h1>
            <nav className="flex items-center flex-wrap gap-x-4 gap-y-2">
              <a href="/admin" className="text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                {t('admin.navDashboard')}
              </a>
              <a href="/admin/products" className="text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                {t('admin.navProducts')}
              </a>
              <a href="/admin/orders" className="text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                {t('admin.navOrders')}
              </a>
              <a href="/admin/users" className="text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                {t('admin.navUsers')}
              </a>
              <a href="/admin/newsletter" className="text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                {t('admin.navNewsletter')}
              </a>
              <a href="/admin/email-test" className="text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                {t('admin.navEmailTest')}
              </a>
              <a href="/admin/slack-test" className="text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                {t('admin.navSlackTest')}
              </a>
              <a href="/" className="text-sm hover:underline" style={{ color: 'var(--muted)' }}>
                {t('admin.backToSite')}
              </a>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Admin Content */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
