import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.notifications.title'),
  description: t('pageMeta.notifications.description'),
  path: '/notifications',
  noindex: true, // per-user page, also disallowed in robots.js
});

export default function NotificationsLayout({ children }) {
  return children;
}
