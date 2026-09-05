import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.resetPassword.title'),
  description: t('pageMeta.resetPassword.description'),
  path: '/reset-password',
  noindex: true, // account flow page, also disallowed in robots.js
});

export default function ResetPasswordLayout({ children }) {
  return children;
}
