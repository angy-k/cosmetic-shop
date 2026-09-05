"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from '@/contexts/LanguageContext';
import { API_URL } from "../../../lib/apiUrl";
const HISTORY_PAGE_SIZE = 10;

export default function AdminNewsletterPage() {
  const { t, plural } = useTranslation();
  const { apiCall } = useAuth();
  const { success, error: showError } = useToast();

  const [tab, setTab] = useState('compose');

  const TABS = [
    { key: 'compose', label: t('admin.newsletter.tabCompose') },
    { key: 'subscribers', label: t('admin.newsletter.tabSubscribers') },
    { key: 'history', label: t('admin.newsletter.tabHistory') }
  ];

  // Subscribers
  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);

  // Compose
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoadingSubscribers(true);
      const response = await apiCall(`${API_URL}/api/newsletter/subscribers`);
      const result = await response.json();
      if (response.ok && result.success) {
        setSubscribers(result.data.subscribers);
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoadingSubscribers(false);
    }
  }, [apiCall]);

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      setLoadingHistory(true);
      const response = await apiCall(`${API_URL}/api/newsletter/history?page=${page}&limit=${HISTORY_PAGE_SIZE}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setHistory(result.data.items);
        setHistoryPagination(result.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching newsletter history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchSubscribers();
    fetchHistory(1);
  }, [fetchSubscribers, fetchHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.subject.trim() || !form.message.trim()) {
      showError(t('admin.newsletter.subjectMessageRequired'));
      return;
    }

    if (!window.confirm(t('admin.newsletter.confirmSend', { count: subscribers.length }))) {
      return;
    }

    setSending(true);
    setLastResult(null);

    try {
      const response = await apiCall(`${API_URL}/api/newsletter/send`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('admin.newsletter.sendFailed'));
      }

      setLastResult(result.data);
      success(result.message);
      setForm({ subject: '', message: '' });
      fetchHistory(1);
    } catch (err) {
      showError(err.message);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('sr-Latn-RS', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
        {t('admin.newsletter.title')}
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        {loadingSubscribers
          ? t('admin.newsletter.loadingCount')
          : t('admin.newsletter.subscriberCount', { count: subscribers.length, word: plural('userIs', subscribers.length) })}
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: tab === tb.key ? 'var(--brand)' : 'transparent',
              color: tab === tb.key ? 'var(--brand)' : 'var(--muted)'
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'compose' && (
        <>
          <form onSubmit={handleSubmit} className="p-6 rounded-lg border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('admin.newsletter.subject')}
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder={t('admin.newsletter.subjectPlaceholder')}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('admin.newsletter.message')}
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder={t('admin.newsletter.messagePlaceholder')}
                rows={10}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                required
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                {t('admin.newsletter.messageHint')}
              </p>
            </div>

            <button
              type="submit"
              disabled={sending || loadingSubscribers || subscribers.length === 0}
              className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {sending ? t('admin.newsletter.sending') : t('admin.newsletter.sendTo', { count: subscribers.length, word: plural('subscriberGen', subscribers.length) })}
            </button>
            {!loadingSubscribers && subscribers.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {t('admin.newsletter.noSubscribersNotice')}
              </p>
            )}
          </form>

          {lastResult && (
            <div className="mt-6 p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{t('admin.newsletter.lastSendResult')}</h2>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                {t('admin.newsletter.sent')}: {lastResult.sent} / {lastResult.total} {lastResult.failed > 0 && (
                  <span style={{ color: 'var(--error)' }}> · {t('admin.newsletter.failed')}: {lastResult.failed}</span>
                )}
              </p>
              {lastResult.failedEmails?.length > 0 && (
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  {t('admin.newsletter.failedAddresses', { emails: lastResult.failedEmails.join(', ') })}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'subscribers' && (
        <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {loadingSubscribers ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('admin.newsletter.loadingText')}</p>
          ) : subscribers.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('admin.newsletter.noSubscribersYet')}</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {subscribers.map((s) => (
                <div key={s._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{s.email}</p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {t('admin.newsletter.memberSince', { date: formatDate(s.createdAt) })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {loadingHistory ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('admin.newsletter.loadingText')}</p>
          ) : history.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('admin.newsletter.noNewslettersYet')}</p>
          ) : (
            <>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {history.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  return (
                    <div key={log._id} className="py-3">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{log.subject}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            {formatDate(log.createdAt)} · {t('admin.newsletter.by', { name: log.sentBy?.name || log.sentBy?.email || t('admin.newsletter.unknown') })}
                          </p>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {log.successCount} / {log.recipientCount}
                          {log.failedCount > 0 && <span style={{ color: 'var(--error)' }}> · {log.failedCount} failed</span>}
                        </p>
                      </button>
                      {isExpanded && (
                        <div className="mt-3 pl-1 text-sm" style={{ color: 'var(--muted)' }}>
                          <p className="whitespace-pre-wrap mb-2" style={{ color: 'var(--foreground)' }}>{log.message}</p>
                          {log.failedEmails?.length > 0 && (
                            <p>{t('admin.newsletter.failedAddresses', { emails: log.failedEmails.join(', ') })}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {historyPagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => fetchHistory(historyPagination.page - 1)}
                    disabled={historyPagination.page <= 1}
                    className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-40"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    {t('admin.newsletter.previous')}
                  </button>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    {t('admin.newsletter.pageOf', { page: historyPagination.page, pages: historyPagination.pages })}
                  </span>
                  <button
                    onClick={() => fetchHistory(historyPagination.page + 1)}
                    disabled={historyPagination.page >= historyPagination.pages}
                    className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-40"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    {t('admin.newsletter.next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
