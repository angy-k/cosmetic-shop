import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.profile.title'),
  description: t('pageMeta.profile.description'),
  path: '/profile',
  noindex: true, // per-user page, also disallowed in robots.js
});

export default function ProfileLayout({ children }) {
  return children;
}
