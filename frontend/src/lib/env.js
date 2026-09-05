// Gates search engine indexing (robots.js, sitemap.js, metadata.js) so a
// staging/preview deploy doesn't show up in search results. Not Next's own
// NODE_ENV, which is always "production" for any build - set
// NEXT_PUBLIC_NODE_ENV instead; anything but "production"/"prod" is non-prod.
export function isProductionEnv() {
  const value = (process.env.NEXT_PUBLIC_NODE_ENV || '').trim().toLowerCase();
  return value === 'production' || value === 'prod';
}

export default isProductionEnv;
