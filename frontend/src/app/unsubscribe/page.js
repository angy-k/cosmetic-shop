"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [message, setMessage] = useState('');

  const handleUnsubscribe = async () => {
    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/api/newsletter/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to unsubscribe');
      }

      setStatus('done');
      setMessage(result.message);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center p-8 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Unsubscribe from Newsletter
        </h1>

        {!email ? (
          <p style={{ color: 'var(--muted)' }}>
            No email address was provided. Please use the unsubscribe link from a newsletter email.
          </p>
        ) : status === 'done' ? (
          <p style={{ color: 'var(--foreground)' }}>{message}</p>
        ) : (
          <>
            <p className="mb-6" style={{ color: 'var(--muted)' }}>
              Unsubscribe <strong style={{ color: 'var(--foreground)' }}>{email}</strong> from our newsletter?
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={status === 'loading'}
              className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {status === 'loading' ? 'Unsubscribing...' : 'Unsubscribe'}
            </button>
            {status === 'error' && (
              <p className="mt-4 text-sm" style={{ color: 'var(--error)' }}>{message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeContent />
    </Suspense>
  );
}
