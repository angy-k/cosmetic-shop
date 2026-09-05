"use client";
import { useTranslation } from "../../contexts/LanguageContext";

export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>{t('termsPage.title')}</h1>
      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          {t('termsPage.p1')}
        </p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {t('termsPage.p2')}
        </p>
      </div>
    </section>
  );
}
