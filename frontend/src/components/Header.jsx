"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "../contexts/AuthContext";
import site from "../config/site";

const APP_NAME = site.brandName;

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" }
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Prevent hydration mismatch by only rendering auth content after mount
  useEffect(() => {
    setMounted(true);
  }, []);
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
            <div className="hidden md:flex">
              {!mounted ? (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  Loading...
                </div>
              ) : loading ? (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  Loading...
                </div>
              ) : isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    Hi, {user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <button 
                    onClick={logout}
                    className="text-sm hover:underline underline-offset-4"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/login" className="text-sm hover:underline underline-offset-4">
                  Login
                </Link>
              )}
            </div>
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
        <>
          {/* Backdrop overlay */}
          <div 
            className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          
          {/* Mobile menu */}
          <div className="md:hidden fixed top-16 left-0 right-0 z-50 border-t shadow-lg" 
               style={{ 
                 background: 'var(--surface)', 
                 borderColor: 'var(--border)',
                 backdropFilter: 'blur(12px)',
                 WebkitBackdropFilter: 'blur(12px)'
               }}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              {/* Navigation Links */}
              <nav className="space-y-1 mb-6">
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 px-4 rounded-lg text-base font-medium transition-colors hover:bg-brand/10"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              
              {/* Divider */}
              <div className="border-t mb-6" style={{ borderColor: 'var(--border)' }} />
              
              {/* Theme Toggle & Actions */}
              <div className="space-y-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                    Theme
                  </span>
                  <button
                    type="button"
                    aria-label="Toggle theme"
                    aria-pressed={theme === "dark"}
                    onClick={() => { toggleTheme(); setOpen(false); }}
                    className="inline-flex items-center justify-center rounded-lg p-3 transition-colors"
                    style={{ background: 'var(--brand-2)', color: 'var(--brand)' }}
                    title={theme === "dark" ? "Switch to light" : "Switch to dark"}
                  >
                    {theme === "dark" ? (
                      // Sun icon
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 4V2m0 20v-2M4 12H2m20 0h-2M5 5l-1.5-1.5M20.5 20.5 19 19M19 5l1.5-1.5M4.5 20.5 6 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    ) : (
                      // Moon icon
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Action Buttons */}
                {!mounted ? (
                  <div className="text-center py-4">
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>
                      Loading...
                    </div>
                  </div>
                ) : isAuthenticated ? (
                  <div className="space-y-3">
                    {/* User Info */}
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--brand-2)' }}>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {user?.name || 'User'}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => { logout(); setOpen(false); }}
                        className="flex items-center justify-center py-3 px-4 rounded-lg border text-sm font-medium transition-colors hover:bg-foreground/5"
                        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Logout
                      </button>
                      <Link 
                        href="/cart" 
                        onClick={() => setOpen(false)} 
                        className="flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors"
                        style={{ background: 'var(--brand)', color: 'white' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                          <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="9" cy="20" r="1" fill="currentColor" />
                          <circle cx="18" cy="20" r="1" fill="currentColor" />
                        </svg>
                        Cart
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link 
                      href="/login" 
                      onClick={() => setOpen(false)} 
                      className="flex items-center justify-center py-3 px-4 rounded-lg border text-sm font-medium transition-colors hover:bg-foreground/5"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="10,17 15,12 10,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Login
                    </Link>
                    <Link 
                      href="/cart" 
                      onClick={() => setOpen(false)} 
                      className="flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors"
                      style={{ background: 'var(--brand)', color: 'white' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                        <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="20" r="1" fill="currentColor" />
                        <circle cx="18" cy="20" r="1" fill="currentColor" />
                      </svg>
                      Cart
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
