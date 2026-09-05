"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useTranslation } from '@/contexts/LanguageContext';
import { API_URL } from "../../lib/apiUrl";

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading: authLoading, apiCall, checkAuth } = useAuth();
  const { success, error: showError } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    newsletter: true,
    notifications: true
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        newsletter: user.preferences?.newsletter ?? true,
        notifications: user.preferences?.notifications ?? true
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const response = await apiCall(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone || undefined,
          // Newsletter/order-notification preferences are customer-facing and don't
          // apply to admin accounts (admins don't shop - see Header.jsx nav logic)
          ...(user.role !== 'admin' && {
            preferences: {
              newsletter: profileForm.newsletter,
              notifications: profileForm.notifications
            }
          })
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('profile.profileUpdateFailed'));
      }

      success(t('profile.profileUpdated'));
      await checkAuth();
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError(t('profile.passwordsDontMatch'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showError(t('profile.passwordMinLength'));
      return;
    }

    setChangingPassword(true);

    try {
      const response = await apiCall(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('profile.passwordChangeFailed'));
      }

      success(t('profile.passwordChanged'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--foreground)' }}>
          {t('profile.title')}
        </h1>

        <div className="space-y-6">
          {/* Account info */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              {t('profile.accountDetails')}
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('profile.email')}</p>
                <p style={{ color: 'var(--foreground)' }}>{user.email}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('profile.role')}</p>
                <p style={{ color: 'var(--foreground)' }}>{t(`profile.roles.${user.role}`)}</p>
              </div>
              {user.createdAt && (
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('profile.memberSince')}</p>
                  <p style={{ color: 'var(--foreground)' }}>
                    {new Date(user.createdAt).toLocaleDateString('sr-Latn-RS', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Edit profile */}
          <form onSubmit={handleProfileSubmit} className="p-6 rounded-lg border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              {t('profile.editProfile')}
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('profile.fullName')}
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('profile.phoneNumber')}
              </label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+381 6X XXX XXXX"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>

            {user.role !== 'admin' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profileForm.newsletter}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, newsletter: e.target.checked }))}
                    className="rounded"
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{t('profile.subscribeNewsletter')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profileForm.notifications}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="rounded"
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{t('profile.receiveNotifications')}</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {savingProfile ? t('profile.saving') : t('profile.saveChanges')}
            </button>
          </form>

          {/* Change password */}
          <form onSubmit={handlePasswordSubmit} className="p-6 rounded-lg border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              {t('profile.changePassword')}
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('profile.currentPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('profile.newPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('profile.confirmNewPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {changingPassword ? t('profile.changing') : t('profile.changePasswordButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
