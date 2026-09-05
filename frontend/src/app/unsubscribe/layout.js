import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.unsubscribe.title'),
  description: t('pageMeta.unsubscribe.description'),
  path: '/unsubscribe',
  noindex: true, // one-time action page reached via an email link, also disallowed in robots.js
});

export default function UnsubscribeLayout({ children }) {
  return children;
}
