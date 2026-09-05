import site from "../config/site";
import { isProductionEnv } from "./env";

const DEFAULT_IMAGE = "/static/images/svevisnja-kozmetika-prirodna-organska.webp";

// Builds a route's `metadata` object (title, OG/Twitter tags, robots, etc.) -
// called from each route's sibling layout.js, since most pages here are
// Client Components and can't export metadata themselves. Also what drives
// share previews (WhatsApp/Slack read the server-rendered <head>).
export function buildMetadata({
  title,
  description,
  path = '',
  image = DEFAULT_IMAGE,
  imageAlt,
  noindex = false,
  extraOpenGraph = {},
} = {}) {
  const fullTitle = title ? `${title} | ${site.brandName}` : site.brandName;
  const url = `${site.url}${path}`;

  // Non-production de-indexes the whole site regardless of `noindex` (see lib/env.js).
  const robots = !isProductionEnv()
    ? { index: false, follow: false }
    : (noindex ? { index: false, follow: true } : { index: true, follow: true });

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots,
    openGraph: {
      type: 'website',
      url,
      title: fullTitle,
      description,
      siteName: site.brandName,
      locale: 'sr_RS',
      images: [{ url: image, alt: imageAlt || fullTitle }],
      ...extraOpenGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

export default buildMetadata;
