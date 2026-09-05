"use client";
import Link from "next/link";
import site from "../config/site";
import { useTranslation } from "../contexts/LanguageContext";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-16 border-t bg-background/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="font-semibold text-base">{site.brandName}</h3>
          <p className="mt-2 text-sm text-foreground/70">{t('footer.tagline')}</p>
          <ul className="mt-4 space-y-1 text-sm text-foreground/80">
            <li>{t('footer.phone')}: {site.contact.phone}</li>
            <li>{t('footer.location')}: {site.contact.location}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-2">{t('footer.navigation')}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:underline" href="/">{t('nav.home')}</Link></li>
            <li><Link className="hover:underline" href="/products">{t('nav.products')}</Link></li>
            <li><Link className="hover:underline" href="/contact">{t('nav.contact')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-2">{t('footer.contact')}</h4>
          <p className="text-sm text-foreground/80">{t('footer.questions')} <Link href="/contact" className="underline">{t('footer.getInTouch')}</Link>.</p>

          <div className="mt-4 flex items-center gap-3">
            {/* Instagram */}
            <a href={site.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="inline-flex items-center justify-center p-2 rounded-md hover:bg-foreground/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
            </a>
            {/* Facebook */}
            <a href={site.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="inline-flex items-center justify-center p-2 rounded-md hover:bg-foreground/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 8h-2a2 2 0 0 0-2 2v2H9v3h2v6h3v-6h2.2l.8-3H14v-1a1 1 0 0 1 1-1h2V8h-2Z" stroke="currentColor" strokeWidth="2"/></svg>
            </a>
            {/* Website */}
            <a href={site.socials.website} target="_blank" rel="noreferrer" aria-label={t('footer.website')} className="inline-flex items-center justify-center p-2 rounded-md hover:bg-foreground/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="currentColor" strokeWidth="2"/></svg>
            </a>
            {/* TikTok */}
            <a href={site.socials.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="inline-flex items-center justify-center p-2 rounded-md hover:bg-foreground/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 3v3a5 5 0 0 0 5 5h1v3a9 9 0 1 1-9-9h3Z" stroke="currentColor" strokeWidth="2"/></svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-foreground/60 flex items-center justify-between">
          <span>{t('footer.copyright', { year: new Date().getFullYear(), brand: site.brandName })}</span>
          <div className="space-x-4">
            <Link href="/policy" className="hover:underline">{t('footer.policy')}</Link>
            <Link href="/terms" className="hover:underline">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
