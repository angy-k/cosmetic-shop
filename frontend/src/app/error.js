'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';

export default function Error({ error, reset }) {
  const { t } = useTranslation();
  useEffect(() => {
    // Log the error on client for debugging; server logs will have stack
    // eslint-disable-next-line no-console
    console.error('Route error boundary:', error);
  }, [error]);

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
        <h1 className="text-xl font-semibold">{t('errorPage.title')}</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          {t('errorPage.text')}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-md"
            style={{ background: 'var(--brand)', color: 'var(--background)' }}
          >
            {t('errorPage.tryAgain')}
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-md border"
            style={{ borderColor: 'var(--border)' }}
          >
            {t('errorPage.goHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
