"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from '@/contexts/LanguageContext';
import { API_URL } from "../../../lib/apiUrl";
const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { t, plural } = useTranslation();
  const { user: currentUser, apiCall } = useAuth();
  const { success, error: showError } = useToast();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(async (page = 1, activeSearch = search, activeRole = roleFilter) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', PAGE_SIZE);
      if (activeSearch.trim()) params.set('search', activeSearch.trim());
      if (activeRole) params.set('role', activeRole);

      const response = await apiCall(`${API_URL}/api/admin/users?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('admin.users.fetchFailed'));
      }

      setUsers(result.data.items);
      setPagination(result.data.pagination);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiCall]);

  useEffect(() => {
    fetchUsers(1, '', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(draftSearch);
    fetchUsers(1, draftSearch, roleFilter);
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    fetchUsers(1, search, value);
  };

  const handleRoleChange = async (targetUser, newRole) => {
    const roleLabel = newRole === 'admin' ? t('admin.users.roleAdmin') : t('admin.users.roleUser');
    if (!window.confirm(t('admin.users.confirmRoleChange', { email: targetUser.email, role: roleLabel }))) return;

    setUpdatingId(targetUser._id);
    try {
      const response = await apiCall(`${API_URL}/api/admin/users/${targetUser._id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('admin.users.roleUpdateFailed'));
      }

      success(result.message);
      fetchUsers(pagination.page, search, roleFilter);
    } catch (err) {
      showError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (targetUser) => {
    const nextActive = !targetUser.isActive;
    const confirmMsg = nextActive
      ? t('admin.users.confirmReactivate', { email: targetUser.email })
      : t('admin.users.confirmDeactivate', { email: targetUser.email });
    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(targetUser._id);
    try {
      const response = await apiCall(`${API_URL}/api/admin/users/${targetUser._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: nextActive }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('admin.users.statusUpdateFailed'));
      }

      success(result.message);
      fetchUsers(pagination.page, search, roleFilter);
    } catch (err) {
      showError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return t('admin.users.never');
    return new Date(date).toLocaleDateString('sr-Latn-RS', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
        {t('admin.users.title')}
      </h1>

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder={t('admin.users.searchPlaceholder')}
          value={draftSearch}
          onChange={(e) => setDraftSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilterChange(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <option value="">{t('admin.users.allRoles')}</option>
          <option value="user">{t('admin.users.roleUser')}</option>
          <option value="admin">{t('admin.users.roleAdmin')}</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ background: 'var(--brand)', color: 'white' }}
        >
          {t('admin.users.search')}
        </button>
      </form>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--error)' }}>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchUsers(pagination.page, search, roleFilter)}
            className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            {t('admin.dashboard.tryAgain')}
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--muted)' }}>{t('admin.users.noUsersFound')}</p>
        </div>
      ) : (
        <>
          <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
            {t('admin.users.usersCount', { count: pagination.total, word: plural('user', pagination.total) })}
          </p>

          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {users.map((u) => {
                const isSelf = u._id === currentUser?.id || u._id === currentUser?._id;
                const isUpdating = updatingId === u._id;
                return (
                  <div key={u._id} className="flex items-center justify-between gap-4 p-4 flex-wrap">
                    <div className="min-w-[180px]">
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {u.name} {isSelf && <span style={{ color: 'var(--muted)' }}>{t('admin.users.you')}</span>}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>{u.email}</p>
                    </div>

                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      <p>{t('admin.users.joined', { date: formatDate(u.createdAt) })}</p>
                      <p>{t('admin.users.lastLogin', { date: formatDate(u.lastLogin) })}</p>
                    </div>

                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ background: !u.isActive ? '#6b7280' : (u.role === 'admin' ? '#8b5cf6' : '#3b82f6') }}
                    >
                      {!u.isActive ? t('admin.users.inactive') : (u.role === 'admin' ? t('admin.users.roleAdmin') : t('admin.users.roleUser'))}
                    </span>

                    <div className="flex items-center gap-2">
                      <select
                        value={u.role}
                        disabled={isSelf || isUpdating}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className="px-2 py-1.5 border rounded-md text-sm disabled:opacity-50"
                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      >
                        <option value="user">{t('admin.users.roleUser')}</option>
                        <option value="admin">{t('admin.users.roleAdmin')}</option>
                      </select>
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={isSelf || isUpdating}
                        className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 hover:opacity-90 transition-opacity"
                        style={{
                          borderColor: 'var(--border)',
                          color: u.isActive ? 'var(--error)' : 'var(--foreground)'
                        }}
                      >
                        {u.isActive ? t('admin.users.deactivate') : t('admin.users.reactivate')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => fetchUsers(pagination.page - 1, search, roleFilter)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 rounded-md border text-sm disabled:opacity-40"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                {t('admin.users.previous')}
              </button>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                {t('admin.users.pageOf', { page: pagination.page, pages: pagination.pages })}
              </span>
              <button
                onClick={() => fetchUsers(pagination.page + 1, search, roleFilter)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 rounded-md border text-sm disabled:opacity-40"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                {t('admin.users.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
