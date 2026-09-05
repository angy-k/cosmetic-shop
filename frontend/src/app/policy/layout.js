import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('policyPage.metaTitle'),
  description: t('policyPage.p1'),
  path: '/policy',
});

export default function PolicyLayout({ children }) {
  return children;
}
