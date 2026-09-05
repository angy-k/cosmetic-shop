import { buildMetadata } from "../../../lib/metadata";
import { t } from "../../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.orderDetail.title'),
  description: t('pageMeta.orderDetail.description'),
  path: '/orders', // order id isn't public/shareable, so no per-order canonical
  noindex: true, // per-user page, also disallowed in robots.js
});

export default function OrderDetailLayout({ children }) {
  return children;
}
