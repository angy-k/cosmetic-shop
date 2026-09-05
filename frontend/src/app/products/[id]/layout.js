import { buildMetadata } from "../../../lib/metadata";
import { t } from "../../../lib/translations";
import { getServerApiUrl } from "../../../lib/apiUrl";

const API_URL = getServerApiUrl();

// The product page is a Client Component and can't export `metadata`, so
// this sibling builds per-product share metadata instead.
export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const response = await fetch(`${API_URL}/api/products/${id}`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();
      const product = data?.data?.product;

      if (product) {
        const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
        const description =
          product.seo?.metaDescription ||
          product.shortDescription ||
          product.description?.substring(0, 160) ||
          t('pageMeta.products.description');

        return buildMetadata({
          title: product.seo?.metaTitle || `${product.name}${product.brand ? ' - ' + product.brand : ''}`,
          description,
          path: `/products/${id}`,
          image: primaryImage?.url,
          imageAlt: primaryImage?.alt || product.name,
        });
      }
    }
  } catch (err) {
    console.error(`generateMetadata(products/${id}) failed:`, err.message);
  }

  // Product not found / API unreachable - still give the page its own
  // (generic) metadata rather than silently falling back to the homepage's.
  return buildMetadata({
    title: t('pageMeta.productNotFound.title'),
    description: t('pageMeta.productNotFound.description'),
    path: `/products/${id}`,
  });
}

export default function ProductDetailLayout({ children }) {
  return children;
}
