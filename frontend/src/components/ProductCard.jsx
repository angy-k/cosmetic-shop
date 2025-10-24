import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import DefaultProductImage from "./DefaultProductImage";

export default function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const isLowStock = product.inventory?.quantity <= product.inventory?.lowStockThreshold;
  const isOutOfStock = product.inventory?.quantity === 0;

  return (
    <Link href={`/products/${product._id}`} className="group block">
      <div className="rounded-lg border overflow-hidden hover:shadow-lg transition-shadow duration-300" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          {primaryImage && !imageError ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <DefaultProductImage 
              productName={product.name} 
              category={product.category} 
            />
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                -{discountPercent}%
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Featured
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                Out of Stock
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                Low Stock
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50"
              onClick={(e) => {
                e.preventDefault();
                // Add to wishlist functionality
                console.log('Add to wishlist:', product._id);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Brand */}
          {product.brand && (
            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>{product.brand}</p>
          )}
          
          {/* Name */}
          <h3 className="font-medium mb-2 line-clamp-2 group-hover:transition-colors" style={{ color: 'var(--foreground)' }}>
            {product.name}
          </h3>
          
          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--muted)' }}>
              {product.shortDescription}
            </p>
          )}
          
          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm line-through" style={{ color: 'var(--muted)' }}>
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          {/* Rating */}
          {product.rating?.average > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={i < Math.round(product.rating.average) ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-yellow-400"
                  >
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                ))}
              </div>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                ({product.rating.count})
              </span>
            </div>
          )}
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: 'var(--brand-2)', color: 'var(--foreground)' }}
                >
                  {tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  +{product.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
