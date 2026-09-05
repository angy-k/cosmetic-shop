import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('contact.pageTitle'),
  description: t('contact.metaDescription'),
  path: '/contact',
});

export default function ContactLayout({ children }) {
  return children;
}
