"use client";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }) {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [isAdmin, loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--brand)' }}></div>
          <p style={{ color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Access Denied
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Admin Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              Admin Panel
            </h1>
            <nav className="flex items-center gap-4">
              <a href="/admin/products" className="text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                Products
              </a>
              <a href="/admin/orders" className="text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                Orders
              </a>
              <a href="/admin/email-test" className="text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                Email Test
              </a>
              <a href="/" className="text-sm hover:underline" style={{ color: 'var(--muted)' }}>
                Back to Site
              </a>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Admin Content */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
