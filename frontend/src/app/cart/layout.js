import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.cart.title'),
  description: t('pageMeta.cart.description'),
  path: '/cart',
  noindex: true, // per-user page, also disallowed in robots.js
});

export default function CartLayout({ children }) {
  return children;
}
