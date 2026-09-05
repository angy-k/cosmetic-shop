"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from '@/contexts/LanguageContext';
import { API_URL } from "../../lib/apiUrl";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('auth.forgotPasswordDefaultError'));
      }

      setStatus('done');
      setMessage(result.message || t('auth.forgotPasswordDefaultDone'));
    } catch (err) {
      setStatus('error');
      setMessage(err.message || t('auth.forgotPasswordDefaultError'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            {t('auth.forgotPasswordTitle')}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            {t('auth.forgotPasswordSubtitle')}
          </p>
        </div>

        <div className="rounded-lg border p-8 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {status === 'done' ? (
            <div className="text-center space-y-4">
              <p style={{ color: 'var(--foreground)' }}>{message}</p>
              <Link
                href="/login"
                className="inline-block text-sm font-medium hover:underline transition-colors"
                style={{ color: 'var(--brand)' }}
              >
                {t('auth.backToSignIn')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--error)', color: 'white' }}>
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  {t('auth.emailAddress')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--brand)' }}
              >
                {status === 'loading' ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm hover:underline transition-colors"
                  style={{ color: 'var(--brand)' }}
                >
                  {t('auth.backToSignIn')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
