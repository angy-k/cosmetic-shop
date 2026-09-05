"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Redirect to home page
        router.push('/');
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: t('auth.networkError') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            {t('auth.welcomeBack')}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            {t('auth.signInSubtitle')}
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg border p-8 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--error)', color: 'white' }}>
                {errors.general}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('auth.emailAddress')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  background: 'var(--background)',
                  borderColor: errors.email ? 'var(--error)' : 'var(--border)',
                  color: 'var(--foreground)',
                  focusRingColor: 'var(--brand)'
                }}
                placeholder={t('auth.emailPlaceholder')}
              />
              {errors.email && (
                <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  background: 'var(--background)',
                  borderColor: errors.password ? 'var(--error)' : 'var(--border)',
                  color: 'var(--foreground)',
                  focusRingColor: 'var(--brand)'
                }}
                placeholder={t('auth.passwordPlaceholderLogin')}
              />
              {errors.password && (
                <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                href="/forgot-password" 
                className="text-sm hover:underline transition-colors"
                style={{ color: 'var(--brand)' }}
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--brand)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('auth.signingIn')}
                </span>
              ) : (
                t('auth.signIn')
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {t('auth.noAccount')}{' '}
              <Link
                href="/register"
                className="font-medium hover:underline transition-colors"
                style={{ color: 'var(--brand)' }}
              >
                {t('auth.createOneHere')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
