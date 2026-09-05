// Backend URL for server-side code (generateMetadata, sitemap.js) - the
// container-internal API_INTERNAL_URL, falling back to the browser's
// NEXT_PUBLIC_API_URL for setups without that split.
export function getServerApiUrl() {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5007'
  );
}

// Backend URL for Client Components (NEXT_PUBLIC_API_URL is inlined at build time).
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007';

export default getServerApiUrl;
