import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.register.title'),
  description: t('pageMeta.register.description'),
  path: '/register',
  noindex: true, // account flow page, also disallowed in robots.js
});

export default function RegisterLayout({ children }) {
  return children;
}
