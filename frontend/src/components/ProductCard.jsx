import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import DefaultProductImage from "./DefaultProductImage";

export default function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);
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

  const CardContent = ({ children }) => (
    <div className="h-full rounded-lg border overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {children}
    </div>
  );

  const cardContent = (
    <>
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden flex-shrink-0">
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
        
        {/* Admin Edit Icon */}
        {mounted && isAdmin && (
          <Link href={`/admin/products/${product._id}/edit`} className="absolute top-2 right-2 z-10">
            <div 
              className="p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
              style={{ background: 'var(--brand)', color: 'white' }}
              title="Edit Product"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
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

      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Brand */}
        <div className="min-h-[20px] mb-1">
          {product.brand ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{product.brand}</p>
          ) : (
            <div></div>
          )}
        </div>
        
        {/* Name */}
        <h3 className="font-medium mb-2 line-clamp-2 group-hover:transition-colors min-h-[48px] flex items-start" style={{ color: 'var(--foreground)' }}>
          {product.name}
        </h3>
        
        {/* Short Description */}
        <div className="min-h-[40px] mb-3">
          {product.shortDescription ? (
            <p className="text-sm line-clamp-2" style={{ color: 'var(--muted)' }}>
              {product.shortDescription}
            </p>
          ) : (
            <div></div>
          )}
        </div>
        
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
        <div className="min-h-[20px] mb-3">
          {product.rating?.average > 0 ? (
            <div className="flex items-center gap-1">
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
          ) : (
            <div></div>
          )}
        </div>
        
        {/* Tags - Push to bottom */}
        <div className="mt-auto">
          <div className="min-h-[28px]">
            {product.tags && product.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block text-xs px-2 py-1 rounded font-medium truncate"
                    style={{ 
                      background: 'var(--brand-2)', 
                      color: 'var(--foreground)',
                      width: '60px',
                      textAlign: 'center'
                    }}
                    title={tag} // Show full text on hover
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
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return isAdmin ? (
    <div className="group block h-full">
      <CardContent>
        {cardContent}
      </CardContent>
    </div>
  ) : (
    <Link href={`/products/${product._id}`} className="group block h-full">
      <CardContent>
        {cardContent}
      </CardContent>
    </Link>
  );
}
