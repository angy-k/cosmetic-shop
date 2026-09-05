import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.login.title'),
  description: t('pageMeta.login.description'),
  path: '/login',
  noindex: true, // account flow page, also disallowed in robots.js
});

export default function LoginLayout({ children }) {
  return children;
}
