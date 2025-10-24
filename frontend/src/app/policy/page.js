export const metadata = { title: "Policy | Cosmetic Shop" };

export default function PolicyPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Policy</h1>
      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          We value your privacy and are committed to protecting your personal information.
        </p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          This page outlines how we collect, use, and safeguard data. For any questions, please contact us.
        </p>
      </div>
    </section>
  );
}
