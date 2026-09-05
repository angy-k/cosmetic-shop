"use client";
import Link from 'next/link';
import { useTranslation } from '../contexts/LanguageContext';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div
        className="w-full max-w-xl rounded-lg border p-6 text-center"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)'
        }}
      >
        <h1 className="text-xl font-semibold">{t('notFoundPage.title')}</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          {t('notFoundPage.text')}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-md"
            style={{ background: 'var(--brand)', color: 'var(--background)' }}
          >
            {t('notFoundPage.goHome')}
          </Link>
          <Link
            href="/products"
            className="px-4 py-2 rounded-md border"
            style={{ borderColor: 'var(--border)' }}
          >
            {t('notFoundPage.browseProducts')}
          </Link>
        </div>
      </div>
    </div>
  );
}
