import site from "../config/site";
import { isProductionEnv } from "../lib/env";
import { getServerApiUrl } from "../lib/apiUrl";

const API_URL = getServerApiUrl();

// Static, always-indexable routes - account/cart/checkout/order pages are
// left out on purpose (also disallowed in robots.js).
const STATIC_ROUTES = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/products', changeFrequency: 'daily', priority: 0.9 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
];

// Generates /sitemap.xml.
export default async function sitemap() {
  // robots.js already blocks crawling outside production - publish an empty
  // sitemap rather than one full of staging URLs.
  if (!isProductionEnv()) {
    return [];
  }

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let productEntries = [];
  try {
    // Cap at 100 (API's max page size) - fine for this catalog's current size
    const response = await fetch(`${API_URL}/api/products?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (response.ok) {
      const data = await response.json();
      const products = data?.data?.items || [];
      productEntries = products.map((product) => ({
        url: `${site.url}/products/${product._id}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (err) {
    // Missing product entries beats a sitemap that fails to build entirely
    console.error('sitemap: failed to fetch products, publishing static routes only:', err.message);
  }

  return [...staticEntries, ...productEntries];
}
