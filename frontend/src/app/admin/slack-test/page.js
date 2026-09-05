"use client";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from '@/contexts/LanguageContext';
import { API_URL } from "../../../lib/apiUrl";

export default function SlackTestPage() {
  const { t } = useTranslation();
  const { apiCall, isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  const [selectedType, setSelectedType] = useState('new-order');
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const notificationTypes = [
    { value: 'new-order', label: t('admin.slackTest.types.newOrder.label'), description: t('admin.slackTest.types.newOrder.description') },
    { value: 'payment-succeeded', label: t('admin.slackTest.types.paymentSucceeded.label'), description: t('admin.slackTest.types.paymentSucceeded.description') },
    { value: 'payment-failed', label: t('admin.slackTest.types.paymentFailed.label'), description: t('admin.slackTest.types.paymentFailed.description') },
    { value: 'error', label: t('admin.slackTest.types.error.label'), description: t('admin.slackTest.types.error.description') }
  ];

  const handleSendTestNotification = async () => {
    if (!isAdmin) {
      showError(t('admin.slackTest.adminRequired'));
      return;
    }

    setSending(true);
    try {
      const response = await apiCall(
        `${API_URL}/api/slack-test/${selectedType}`,
        { method: 'POST' }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          success(result.message || t('admin.slackTest.testNotificationSent', { type: selectedType }));
        } else {
          throw new Error(result.message || t('admin.slackTest.sendTestFailed'));
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || t('admin.slackTest.sendTestFailed'));
      }
    } catch (err) {
      console.error('Error sending test Slack notification:', err);
      showError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCheckConfig = async () => {
    setLoadingConfig(true);
    try {
      const response = await apiCall(
        `${API_URL}/api/slack-test/config`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConfig(result.data.config);
        } else {
          throw new Error(result.message || t('admin.slackTest.checkConfigFailed'));
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || t('admin.slackTest.checkConfigFailed'));
      }
    } catch (err) {
      console.error('Error checking Slack config:', err);
      showError(err.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          {t('admin.slackTest.title')}
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          {t('admin.slackTest.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notification Test Form */}
        <div className="space-y-6">
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              {t('admin.slackTest.sendTestNotification')}
            </h2>

            {/* Notification Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('admin.slackTest.notificationType')}
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                {notificationTypes.find(nt => nt.value === selectedType)?.description}
              </p>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendTestNotification}
              disabled={sending}
              className="w-full py-3 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('admin.slackTest.sending')}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.188 3a2.813 2.813 0 100 5.625h2.813V3a2.813 2.813 0 00-2.813-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8.188a2.813 2.813 0 105.625 0V5.375H5.812A2.813 2.813 0 003 8.188z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.813 12a2.813 2.813 0 100-5.625H13v2.813a2.813 2.813 0 002.813 2.813z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.813a2.813 2.813 0 10-5.625 0v2.813H18.188A2.813 2.813 0 0021 15.812z" />
                  </svg>
                  {t('admin.slackTest.sendButton')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Check */}
        <div className="space-y-6">
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {t('admin.slackTest.slackConfiguration')}
              </h2>
              <button
                onClick={handleCheckConfig}
                disabled={loadingConfig}
                className="px-3 py-1 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {loadingConfig ? t('admin.slackTest.checking') : t('admin.slackTest.checkConfig')}
              </button>
            </div>

            {config ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{t('admin.slackTest.ordersWebhookConfigured')}</span>
                  <span className={`text-sm font-medium ${config.ordersWebhookConfigured ? 'text-green-500' : 'text-red-500'}`}>
                    {config.ordersWebhookConfigured ? t('admin.slackTest.yes') : t('admin.slackTest.no')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{t('admin.slackTest.errorsWebhookConfigured')}</span>
                  <span className={`text-sm font-medium ${config.errorsWebhookConfigured ? 'text-green-500' : 'text-red-500'}`}>
                    {config.errorsWebhookConfigured ? t('admin.slackTest.yes') : t('admin.slackTest.no')}
                  </span>
                </div>
                {config.errorsFallsBackToOrders && (
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {t('admin.slackTest.errorsFallbackNotice')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {t('admin.slackTest.clickToCheck')}
              </p>
            )}
          </div>

          {/* Notification Types Reference */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              {t('admin.slackTest.availableTypes')}
            </h3>
            <div className="space-y-2">
              {notificationTypes.map(type => (
                <div key={type.value} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ background: 'var(--brand)' }}></div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {type.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {type.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
