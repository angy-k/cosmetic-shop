"use client";
import { useState } from 'react';
import site from '../../config/site';
import { useTranslation } from '@/contexts/LanguageContext';
import { API_URL } from '../../lib/apiUrl';

export default function ContactPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

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
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('contact.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('contact.nameMinLength');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('contact.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('contact.emailInvalid');
    }

    if (!formData.message.trim()) {
      newErrors.message = t('contact.messageRequired');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('contact.messageMinLength');
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({
          type: 'success',
          message: data.message
        });
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.message || t('contact.genericError')
        });
        
        // Handle validation errors from backend
        if (data.errors) {
          const backendErrors = {};
          data.errors.forEach(error => {
            backendErrors[error.path] = error.msg;
          });
          setErrors(backendErrors);
        }
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus({
        type: 'error',
        message: t('contact.networkError')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Title/description now set server-side by this route's layout.js */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {t('contact.title')}
          </h1>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            {t('contact.intro')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('contact.name')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 transition-colors"
                style={{
                  borderColor: errors.name ? '#ef4444' : 'var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                  focusRingColor: 'var(--brand)'
                }}
                placeholder={t('contact.namePlaceholder')}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('contact.email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 transition-colors"
                style={{
                  borderColor: errors.email ? '#ef4444' : 'var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                  focusRingColor: 'var(--brand)'
                }}
                placeholder={t('contact.emailPlaceholder')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('contact.message')}
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 transition-colors resize-vertical"
                style={{
                  borderColor: errors.message ? '#ef4444' : 'var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                  focusRingColor: 'var(--brand)'
                }}
                placeholder={t('contact.messagePlaceholder')}
                disabled={isSubmitting}
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-500">{errors.message}</p>
              )}
            </div>

            {/* Submit Status */}
            {submitStatus && (
              <div className={`p-4 rounded-md ${
                submitStatus.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${
                  submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {submitStatus.message}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-md font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: 'var(--brand)', 
                color: 'white'
              }}
            >
              {isSubmitting ? t('contact.sending') : t('contact.sendMessage')}
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {t('contact.getInTouch')}
          </h2>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            {t('contact.otherWaysText')}
          </p>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 mt-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--brand)' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>{t('contact.emailLabel')}</h3>
                <p style={{ color: 'var(--muted)' }}>{site.contact.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 mt-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--brand)' }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>{t('contact.phoneLabel')}</h3>
                <p style={{ color: 'var(--muted)' }}>{site.contact.phone}</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 mt-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--brand)' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>{t('contact.locationLabel')}</h3>
                <p style={{ color: 'var(--muted)' }}>{site.contact.location}</p>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="mt-8 p-4 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <h3 className="font-medium mb-3" style={{ color: 'var(--foreground)' }}>{t('contact.businessHours')}</h3>
            <div className="space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
              <div className="flex justify-between">
                <span>{t('contact.mondayFriday')}</span>
                <span>9:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>{t('contact.saturday')}</span>
                <span>10:00 - 16:00</span>
              </div>
              <div className="flex justify-between">
                <span>{t('contact.sunday')}</span>
                <span>{t('contact.closed')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
