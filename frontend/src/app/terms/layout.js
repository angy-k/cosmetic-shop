import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('termsPage.metaTitle'),
  description: t('termsPage.p1'),
  path: '/terms',
});

export default function TermsLayout({ children }) {
  return children;
}
