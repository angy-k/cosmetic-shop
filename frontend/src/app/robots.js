import site from "../config/site";
import { isProductionEnv } from "../lib/env";

// Generates /robots.txt. Account/checkout pages are excluded from crawling.
export default function robots() {
  // Only real production is indexed (see lib/env.js) - anything else blocks
  // crawling outright rather than relying only on per-page noindex tags.
  if (!isProductionEnv()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/cart',
        '/checkout',
        '/profile',
        '/orders',
        '/orders/',
        '/admin',
        '/admin/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/notifications',
        '/unsubscribe',
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
