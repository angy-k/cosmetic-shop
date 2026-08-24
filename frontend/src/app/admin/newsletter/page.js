"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007';
const HISTORY_PAGE_SIZE = 10;

const TABS = [
  { key: 'compose', label: 'Compose' },
  { key: 'subscribers', label: 'Subscribers' },
  { key: 'history', label: 'Send History' }
];

export default function AdminNewsletterPage() {
  const { apiCall } = useAuth();
  const { success, error: showError } = useToast();

  const [tab, setTab] = useState('compose');

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
      showError('Subject and message are required');
      return;
    }

    if (!window.confirm(`Send this newsletter to ${subscribers.length} subscriber(s)? This cannot be undone.`)) {
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
        throw new Error(result.message || 'Failed to send newsletter');
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
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
        Newsletter
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        {loadingSubscribers
          ? 'Loading subscriber count...'
          : `${subscribers.length} user${subscribers.length === 1 ? '' : 's'} currently subscribed to the newsletter.`}
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: tab === t.key ? 'var(--brand)' : 'transparent',
              color: tab === t.key ? 'var(--brand)' : 'var(--muted)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'compose' && (
        <>
          <form onSubmit={handleSubmit} className="p-6 rounded-lg border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Subject
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g. New Winter Skincare Collection is Here"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Message
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Write the newsletter content here..."
                rows={10}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                required
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Plain text - line breaks are preserved. Recipients get a "Shop Now" button and an unsubscribe link automatically.
              </p>
            </div>

            <button
              type="submit"
              disabled={sending || loadingSubscribers || subscribers.length === 0}
              className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {sending ? 'Sending...' : `Send to ${subscribers.length} Subscriber${subscribers.length === 1 ? '' : 's'}`}
            </button>
            {!loadingSubscribers && subscribers.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No users are currently subscribed, so there's no one to send to.
              </p>
            )}
          </form>

          {lastResult && (
            <div className="mt-6 p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Last Send Result</h2>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                Sent: {lastResult.sent} / {lastResult.total} {lastResult.failed > 0 && (
                  <span style={{ color: 'var(--error)' }}> · Failed: {lastResult.failed}</span>
                )}
              </p>
              {lastResult.failedEmails?.length > 0 && (
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  Failed addresses: {lastResult.failedEmails.join(', ')}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'subscribers' && (
        <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {loadingSubscribers ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
          ) : subscribers.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No subscribers yet.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {subscribers.map((s) => (
                <div key={s._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{s.email}</p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Member since {formatDate(s.createdAt)}
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
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No newsletters sent yet.</p>
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
                            {formatDate(log.createdAt)} · by {log.sentBy?.name || log.sentBy?.email || 'Unknown'}
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
                            <p>Failed addresses: {log.failedEmails.join(', ')}</p>
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
                    Previous
                  </button>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    Page {historyPagination.page} of {historyPagination.pages}
                  </span>
                  <button
                    onClick={() => fetchHistory(historyPagination.page + 1)}
                    disabled={historyPagination.page >= historyPagination.pages}
                    className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-40"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    Next
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
