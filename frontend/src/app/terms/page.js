export const metadata = { title: "Terms | Cosmetic Shop" };

export default function TermsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Terms & Conditions</h1>
      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          By using this site, you agree to our terms and conditions outlined herein.
        </p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Please review these terms carefully. Continued use of the website constitutes acceptance.
        </p>
      </div>
    </section>
  );
}
