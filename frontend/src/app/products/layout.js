import { buildMetadata } from "../../lib/metadata";
import { t } from "../../lib/translations";

export const metadata = buildMetadata({
  title: t('pageMeta.products.title'),
  description: t('pageMeta.products.description'),
  path: '/products',
});

export default function ProductsLayout({ children }) {
  return children;
}
