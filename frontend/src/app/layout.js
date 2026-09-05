import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ThemeProvider from "../components/ThemeProvider";
import { AuthProvider } from "../contexts/AuthContext";
import LanguageProvider from "../contexts/LanguageContext";
import { ToastProvider } from "../contexts/ToastContext";
import { CartProvider } from "../contexts/CartContext";
import Script from "next/script";
// Plain, non-reactive t() - metadata below is read server-side, before any
// Context exists, so it stays Serbian-only.
import { t } from "../lib/translations";
import site from "../config/site";
import { isProductionEnv } from "../lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(site.url),
  title: process.env.NEXT_PUBLIC_APP_NAME || t('siteMeta.title'),
  description: t('siteMeta.description'),
  keywords: t('siteMeta.keywords').split(', '),
  authors: [{ name: site.brandName }],
  // Only the real production deployment gets indexed - see lib/env.js.
  robots: isProductionEnv()
    ? { index: true, follow: true }
    : { index: false, follow: false },
  alternates: {
    canonical: site.url
  },
  openGraph: {
    type: "website",
    url: site.url,
    title: t('siteMeta.ogTitle'),
    description: t('siteMeta.ogDescription'),
    siteName: site.brandName,
    locale: "sr_RS",
    images: [
      { url: "/static/images/svevisnja-kozmetika-prirodna-organska.webp", alt: t('siteMeta.imageAlt') }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: t('siteMeta.ogTitle'),
    description: t('siteMeta.ogDescription'),
    images: ["/static/images/svevisnja-kozmetika-prirodna-organska.webp"]
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/static/images/favicon-96x96.png", sizes: "96x96", type: "image/png" }
    ],
    apple: [
      { url: "/static/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: [
      "/favicon.ico"
    ]
  },
  manifest: "/site.webmanifest",
  themeColor: "#ceafa6"
};

export default function RootLayout({ children }) {
  return (
    <html lang="sr" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Script id="early-theme" strategy="beforeInteractive">{`
          (function(){
            try{
              var s=localStorage.getItem('theme');
              var t=s|| (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              var r=document.documentElement;
              r.setAttribute('data-theme', t);
              if(t==='dark'){r.classList.add('dark'); r.style.colorScheme='dark';}
              else {r.classList.remove('dark'); r.style.colorScheme='light';}
            }catch(e){}
          })();
        `}</Script>
        <ThemeProvider>
          <AuthProvider>
            {/* Nested inside AuthProvider - it reads useAuth() to sync the
                signed-in user's saved language (see LanguageContext.jsx). */}
            <LanguageProvider>
              <ToastProvider>
                <CartProvider>
                  <div className="min-h-dvh flex flex-col">
                    <Header />
                    <main className="flex-1">
                      {children}
                    </main>
                    <Footer />
                  </div>
                </CartProvider>
              </ToastProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
