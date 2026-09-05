"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "../../contexts/LanguageContext";
import { API_URL } from "../../lib/apiUrl";

function ResetPasswordContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (formData.password.length < 6 || !/\d/.test(formData.password)) {
      newErrors.password = t('auth.passwordComplexity');
    }
    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = t('auth.passwordsDontMatch');
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: formData.password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('auth.resetPasswordDefaultError'));
      }

      setStatus('done');
      setMessage(result.message || t('auth.resetPasswordDefaultDone'));
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || t('auth.resetPasswordDefaultError'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            {t('auth.resetPasswordTitle')}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            {t('auth.resetPasswordSubtitle')}
          </p>
        </div>

        <div className="rounded-lg border p-8 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {!token ? (
            <p className="text-sm text-center" style={{ color: 'var(--error)' }}>
              {t('auth.missingTokenNotice')}
            </p>
          ) : status === 'done' ? (
            <div className="text-center space-y-4">
              <p style={{ color: 'var(--foreground)' }}>{message}</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('auth.redirecting')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--error)', color: 'white' }}>
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  {t('auth.newPassword')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ background: 'var(--background)', borderColor: errors.password ? 'var(--error)' : 'var(--border)', color: 'var(--foreground)' }}
                  placeholder={t('auth.newPasswordPlaceholder')}
                />
                {errors.password && <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ background: 'var(--background)', borderColor: errors.confirmPassword ? 'var(--error)' : 'var(--border)', color: 'var(--foreground)' }}
                  placeholder={t('auth.confirmNewPasswordPlaceholder')}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--brand)' }}
              >
                {status === 'loading' ? t('auth.resetting') : t('auth.resetPasswordButton')}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm hover:underline transition-colors" style={{ color: 'var(--brand)' }}>
              {t('auth.backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
