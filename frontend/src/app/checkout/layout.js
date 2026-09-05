import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.checkout.title'),
  description: t('pageMeta.checkout.description'),
  path: '/checkout',
  noindex: true, // per-user page, also disallowed in robots.js
});

export default function CheckoutLayout({ children }) {
  return children;
}
