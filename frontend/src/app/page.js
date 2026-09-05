"use client";
import Image from "next/image";
import Link from "next/link";
import GalleryShowcase from "@/components/GalleryShowcase";
import { useTranslation } from "@/contexts/LanguageContext";
import site from "@/config/site";

// Site-wide structured data - on the homepage, not the root layout, so it's
// injected once per site rather than into every route's <head>.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": site.brandName,
  "url": site.url,
  "logo": `${site.url}/static/images/logo.webp`,
  "email": site.contact.email,
  "telephone": site.contact.phone,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Šabac",
    "addressCountry": "RS"
  },
  "sameAs": [
    site.socials.instagram,
    site.socials.facebook,
    site.socials.tiktok
  ].filter(Boolean)
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": site.brandName,
  "url": site.url
};

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Hero Banner Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/static/images/proizvod-1-dnevna-krema.webp"
            alt={t('home.heroImageAlt')}
            fill
            priority
            className="object-cover"
            style={{ filter: 'brightness(0.4)' }}
          />
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t('home.heroTitle1')}
            <span className="block" style={{ color: 'var(--brand)' }}>
              {t('home.heroTitle2')}
            </span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {t('home.heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/products"
              className="px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'var(--brand)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              {t('home.shopCollection')}
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 rounded-lg font-semibold text-lg border-2 transition-all duration-300 hover:scale-105"
              style={{
                borderColor: 'white',
                color: 'white',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {t('home.learnMore')}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Gallery */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {t('home.featuredTitle')}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
            {t('home.featuredSubtitle')}
          </p>
        </div>

        <GalleryShowcase />

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            style={{
              background: 'var(--brand-2)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)'
            }}
          >
            {t('home.viewAllProducts')}
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4" style={{ background: 'var(--brand-2)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--brand)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                {t('home.feature1Title')}
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                {t('home.feature1Text')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--brand)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                {t('home.feature2Title')}
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                {t('home.feature2Text')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--brand)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                {t('home.feature3Title')}
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                {t('home.feature3Text')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
