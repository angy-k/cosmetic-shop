import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.forgotPassword.title'),
  description: t('pageMeta.forgotPassword.description'),
  path: '/forgot-password',
  noindex: true, // account flow page, also disallowed in robots.js
});

export default function ForgotPasswordLayout({ children }) {
  return children;
}
