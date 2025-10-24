import Link from "next/link";
import site from "../config/site";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-background/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="font-semibold text-base">{site.brandName}</h3>
          <p className="mt-2 text-sm text-foreground/70">Quality cosmetics for every routine.</p>
          <ul className="mt-4 space-y-1 text-sm text-foreground/80">
            <li>Phone: {site.contact.phone}</li>
            <li>Location: {site.contact.location}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-2">Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:underline" href="/">Home</Link></li>
            <li><Link className="hover:underline" href="/products">Products</Link></li>
            <li><Link className="hover:underline" href="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-2">Contact</h4>
          <p className="text-sm text-foreground/80">Questions? <Link href="/contact" className="underline">Get in touch</Link>.</p>

          <div className="mt-4 flex items-center gap-3">
            {/* Instagram */}
            <a href={site.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="inline-flex items-center justify-center p-2 rounded-md hover:bg-foreground/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
            </a>
            {/* Facebook */}
            <a href={site.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="inline-flex items-center justify-center p-2 rounded-md hover:bg-foreground/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 8h-2a2 2 0 0 0-2 2v2H9v3h2v6h3v-6h2.2l.8-3H14v-1a1 1 0 0 1 1-1h2V8h-2Z" stroke="currentColor" strokeWidth="2"/></svg>
            </a>
            {/* Website */}
            <a href={site.socials.website} target="_blank" rel="noreferrer" aria-label="Website" className="inline-flex items-center justify-center p-2 rounded-md hover:bg-foreground/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="currentColor" strokeWidth="2"/></svg>
            </a>
            {/* TikTok */}
            <a href={site.socials.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="inline-flex items-center justify-center p-2 rounded-md hover:bg-foreground/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 3v3a5 5 0 0 0 5 5h1v3a9 9 0 1 1-9-9h3Z" stroke="currentColor" strokeWidth="2"/></svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-foreground/60 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Cosmetic Shop</span>
          <div className="space-x-4">
            <Link href="/policy" className="hover:underline">Policy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
