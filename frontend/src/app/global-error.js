'use client';

import Link from 'next/link';
import Script from 'next/script';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={{
          background: 'var(--background)',
          color: 'var(--foreground)'
        }}
      >
        {/* Ensure theme is applied before any paint on global error */}
        <Script id="early-theme-global" strategy="beforeInteractive">{`
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

        <div className="min-h-dvh flex items-center justify-center">
          <div
            className="w-full max-w-xl rounded-lg border p-6 text-center"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          >
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              A global error occurred. You can try again or return to the home page.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => reset?.()}
                className="px-4 py-2 rounded-md"
                style={{ background: 'var(--brand)', color: 'var(--background)' }}
              >
                Try again
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-md border"
                style={{ borderColor: 'var(--border)' }}
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
