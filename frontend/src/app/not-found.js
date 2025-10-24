import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div
        className="w-full max-w-xl rounded-lg border p-6 text-center"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)'
        }}
      >
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          The page you are looking for doesn’t exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-md"
            style={{ background: 'var(--brand)', color: 'var(--background)' }}
          >
            Go to Home
          </Link>
          <Link
            href="/products"
            className="px-4 py-2 rounded-md border"
            style={{ borderColor: 'var(--border)' }}
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
