'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
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
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          An unexpected error occurred. You can try again or return to the home page.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-md"
            style={{ background: 'var(--brand)', color: 'var(--background)' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-md border"
            style={{ borderColor: 'var(--border)' }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
