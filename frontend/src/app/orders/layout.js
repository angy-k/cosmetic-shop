import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.orders.title'),
  description: t('pageMeta.orders.description'),
  path: '/orders',
  noindex: true, // per-user page, also disallowed in robots.js
});

export default function OrdersLayout({ children }) {
  return children;
}
