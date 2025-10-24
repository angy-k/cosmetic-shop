"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import site from "../config/site";

const APP_NAME = site.brandName;

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" }
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev || "";
    };
  }, [open]);

  return (
    <header className="border-b bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-foreground/10"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-foreground">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
              <img src="/logo.svg" alt="Cosmetic Shop" width={40} height={40} className="inline-block" />
              <span className="hidden sm:inline" style={{ color: 'var(--brand)' }}>{APP_NAME}</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm hover:underline underline-offset-4">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Toggle theme"
              aria-pressed={theme === "dark"}
              onClick={toggleTheme}
              className="hidden md:inline-flex items-center justify-center rounded-md p-2 hover:bg-foreground/10"
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              {theme === "dark" ? (
                // Sun icon
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4V2m0 20v-2M4 12H2m20 0h-2M5 5l-1.5-1.5M20.5 20.5 19 19M19 5l1.5-1.5M4.5 20.5 6 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/></svg>
              ) : (
                // Moon icon
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
              )}
            </button>
            <Link href="/login" className="text-sm hover:underline underline-offset-4">
              Login
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center rounded-md px-3 py-1.5 text-sm"
              style={{ background: 'var(--brand)', color: '#262626' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mr-2">
                <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="20" r="1" fill="currentColor" />
                <circle cx="18" cy="20" r="1" fill="currentColor" />
              </svg>
              Cart
            </Link>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 space-y-2">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <div>
                <button
                  type="button"
                  aria-label="Toggle theme"
                  aria-pressed={theme === "dark"}
                  onClick={() => { toggleTheme(); setOpen(false); }}
                  className="inline-flex items-center justify-center rounded-md p-2 hover:bg-foreground/10"
                  title={theme === "dark" ? "Switch to light" : "Switch to dark"}
                >
                  {theme === "dark" ? (
                    // Sun icon
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4V2m0 20v-2M4 12H2m20 0h-2M5 5l-1.5-1.5M20.5 20.5 19 19M19 5l1.5-1.5M4.5 20.5 6 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/></svg>
                  ) : (
                    // Moon icon
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/login" onClick={() => setOpen(false)} className="text-sm">
                  Login
                </Link>
                <Link href="/cart" onClick={() => setOpen(false)} className="text-sm">
                  Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
