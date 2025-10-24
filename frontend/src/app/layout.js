import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ThemeProvider from "../components/ThemeProvider";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Cosmetic Shop",
  description: "A modern cosmetic shop built with Next.js and Express",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/logo.svg" }
    ],
    shortcut: [
      "/favicon.svg"
    ]
  },
  manifest: "/site.webmanifest",
  themeColor: "#ceafa6"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true} data-theme="light">
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
          <div className="min-h-dvh flex flex-col">
            <Header />
            <main className="flex-1">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </div>
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
