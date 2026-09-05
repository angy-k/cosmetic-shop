'use client';

import { useState, useEffect } from 'react';
import ClientOnly from '../../components/ClientOnly';
import { useNoSSR, useBrowserExtensionDetection } from '../../hooks/useNoSSR';
import { useTranslation } from '@/contexts/LanguageContext';
import site from '../../config/site';
import { API_URL } from '../../lib/apiUrl';

export default function TestPage() {
  const { t } = useTranslation();
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isClient = useNoSSR();
  const hasExtensions = useBrowserExtensionDetection();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) {
          throw new Error(t('testPage.fetchFailed'));
        }
        const data = await response.json();
        setApiData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('testPage.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{t('testPage.errorTitle')}</div>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">
            {t('testPage.backendHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {t('testPage.title')}
          </h1>

          {/* Browser Extension Warning */}
          {hasExtensions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-yellow-600 text-xl mr-3">⚠️</div>
                <div>
                  <h3 className="text-yellow-800 font-semibold">{t('testPage.extensionsTitle')}</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    {t('testPage.extensionsText')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* API Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">
                {t('testPage.apiStatusTitle')}
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>{t('testPage.status')}</strong> {apiData?.status}</p>
                <p><strong>{t('testPage.uptime')}</strong> {apiData?.uptime ? `${Math.floor(apiData.uptime)}s` : 'N/A'}</p>
                <p><strong>{t('testPage.timestamp')}</strong>
                  <ClientOnly fallback={t('testPage.loading')}>
                    {apiData?.timestamp ? new Date(apiData.timestamp).toLocaleString() : 'N/A'}
                  </ClientOnly>
                </p>
              </div>
            </div>

            {/* Environment Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                {t('testPage.envInfoTitle')}
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>{t('testPage.frontendUrl')}</strong>
                  <ClientOnly fallback="SSR">
                    {typeof window !== 'undefined' ? window.location.origin : 'SSR'}
                  </ClientOnly>
                </p>
                <p><strong>{t('testPage.apiUrl')}</strong> {API_URL}</p>
                <p><strong>{t('testPage.appName')}</strong> {process.env.NEXT_PUBLIC_APP_NAME || site.brandName}</p>
                <p><strong>{t('testPage.clientRendered')}</strong> {isClient ? t('testPage.yes') : t('testPage.no')}</p>
                <p><strong>{t('testPage.extensionsDetected')}</strong> {hasExtensions ? '⚠️ Da' : t('testPage.yes')}</p>
              </div>
            </div>
          </div>

          {/* Raw API Response */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t('testPage.rawResponseTitle')}
            </h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
            <a
              href="/"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('testPage.backToHome')}
            </a>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t('testPage.refreshTest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
