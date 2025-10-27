"use client";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";

export default function EmailTestPage() {
  const { apiCall, user, isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  const [selectedType, setSelectedType] = useState('welcome');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const emailTypes = [
    { value: 'welcome', label: 'Welcome Email', description: 'New user welcome message' },
    { value: 'order-confirmation', label: 'Order Confirmation', description: 'Order confirmation with mock data' },
    { value: 'product-availability', label: 'Product Available', description: 'Product back in stock notification' },
    { value: 'order-status', label: 'Order Status Update', description: 'Order status change (shipped)' },
    { value: 'password-reset', label: 'Password Reset', description: 'Password reset link' }
  ];

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      showError('Please enter an email address');
      return;
    }

    // Debug: Check authentication status
    console.log('User authenticated:', !!apiCall);
    console.log('Access token exists:', !!localStorage.getItem('accessToken'));
    console.log('User object:', user);
    console.log('Is admin:', isAdmin);

    if (!isAdmin) {
      showError('Admin access required');
      return;
    }

    setSending(true);
    try {
      const response = await apiCall(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007'}/api/email-test/${selectedType}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: testEmail }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          success(`Test ${selectedType} email sent successfully to ${testEmail}!`);
        } else {
          throw new Error(result.message || 'Failed to send test email');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send test email');
      }
    } catch (err) {
      console.error('Error sending test email:', err);
      showError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCheckConfig = async () => {
    setLoadingConfig(true);
    try {
      const response = await apiCall(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007'}/api/email-test/config`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConfig(result.data.config);
        } else {
          throw new Error(result.message || 'Failed to check configuration');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check configuration');
      }
    } catch (err) {
      console.error('Error checking config:', err);
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
          Email Testing
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          Test email functionality and check configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Test Form */}
        <div className="space-y-6">
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Send Test Email
            </h2>

            {/* Email Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Email Type
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
                {emailTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                {emailTypes.find(t => t.value === selectedType)?.description}
              </p>
            </div>

            {/* Test Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--background)', 
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendTestEmail}
              disabled={sending || !testEmail.trim()}
              className="w-full py-3 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Test Email
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
                Email Configuration
              </h2>
              <button
                onClick={handleCheckConfig}
                disabled={loadingConfig}
                className="px-3 py-1 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {loadingConfig ? 'Checking...' : 'Check Config'}
              </button>
            </div>

            {config ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>SMTP Configured:</span>
                  <span className={`text-sm font-medium ${config.smtpConfigured ? 'text-green-500' : 'text-red-500'}`}>
                    {config.smtpConfigured ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>SendPulse Configured:</span>
                  <span className={`text-sm font-medium ${config.sendpulseConfigured ? 'text-green-500' : 'text-red-500'}`}>
                    {config.sendpulseConfigured ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Contact Email:</span>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>{config.contactEmail}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>App Name:</span>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>{config.appName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Frontend URL:</span>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>{config.frontendUrl}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Click "Check Config" to view email configuration status
              </p>
            )}
          </div>

          {/* Email Types Reference */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Available Email Types
            </h3>
            <div className="space-y-2">
              {emailTypes.map(type => (
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
