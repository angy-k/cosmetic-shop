"use client";
import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "../../../contexts/AuthContext";
import DefaultProductImage from "../../../components/DefaultProductImage";

export default function ProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const { isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState({});

  useEffect(() => {
    setMounted(true);
    fetchProduct();
  }, [resolvedParams.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products/${resolvedParams.id}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProduct(data.data.product);
      } else {
        throw new Error(data.message || 'Failed to fetch product');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', { productId: product._id, quantity });
    alert(`Added ${quantity} ${product.name} to cart!`);
  };

  const handleImageError = (index) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {error === 'Product not found' ? 'Product Not Found' : 'Error'}
          </h1>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>
            {error}
          </p>
          <Link 
            href="/products"
            className="inline-block px-4 py-2 rounded-md hover:opacity-80"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isOutOfStock = product.inventory?.quantity === 0;
  const isLowStock = product.inventory?.quantity <= product.inventory?.lowStockThreshold;

  return (
    <>
      {/* SEO Head */}
      <Head>
        {/* Basic Meta Tags */}
        <title>{product.seo?.metaTitle || `${product.name} - ${product.brand} | Cosmetic Shop`}</title>
        <meta 
          name="description" 
          content={product.seo?.metaDescription || product.shortDescription || product.description?.substring(0, 160)} 
        />
        <meta name="keywords" content={`${product.brand}, ${product.category}, ${product.tags?.join(', ')}, cosmetics, beauty`} />
        <meta name="author" content="Cosmetic Shop" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/products/${resolvedParams.id}`} />
        <meta property="og:title" content={`${product.name} - ${product.brand}`} />
        <meta property="og:description" content={product.shortDescription || product.description?.substring(0, 200)} />
        <meta property="og:image" content={product.images?.[0]?.url || '/static/images/logo.webp'} />
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="600" />
        <meta property="og:image:alt" content={product.images?.[0]?.alt || product.name} />
        <meta property="og:site_name" content="Cosmetic Shop" />
        <meta property="og:locale" content="en_US" />
        
        {/* Product-specific Open Graph */}
        <meta property="product:brand" content={product.brand} />
        <meta property="product:availability" content={isOutOfStock ? 'out of stock' : 'in stock'} />
        <meta property="product:condition" content="new" />
        <meta property="product:price:amount" content={product.price} />
        <meta property="product:price:currency" content="USD" />
        <meta property="product:retailer_item_id" content={product.sku} />
        <meta property="product:category" content={product.category} />
        {product.rating?.average && (
          <meta property="product:rating:value" content={product.rating.average.toString()} />
        )}
        {product.rating?.count && (
          <meta property="product:rating:count" content={product.rating.count.toString()} />
        )}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/products/${resolvedParams.id}`} />
        <meta name="twitter:title" content={`${product.name} - ${product.brand}`} />
        <meta name="twitter:description" content={product.shortDescription || product.description?.substring(0, 200)} />
        <meta name="twitter:image" content={product.images?.[0]?.url || '/static/images/logo.webp'} />
        <meta name="twitter:image:alt" content={product.images?.[0]?.alt || product.name} />
        
        {/* WhatsApp / Telegram specific */}
        <meta property="og:image:type" content="image/webp" />
        <meta name="theme-color" content="#ceafa6" />
        
        {/* Additional product info for rich previews */}
        <meta name="product-name" content={product.name} />
        <meta name="product-brand" content={product.brand} />
        <meta name="product-price" content={`$${product.price}`} />
        <meta name="product-currency" content="USD" />
        <meta name="product-availability" content={isOutOfStock ? 'OutOfStock' : 'InStock'} />
        
        {/* Canonical and alternate URLs */}
        <link rel="canonical" href={`${typeof window !== 'undefined' ? window.location.origin : ''}/products/${resolvedParams.id}`} />
        {product.seo?.slug && <link rel="alternate" href={`/products/${product.seo.slug}`} />}
        
        {/* Preload critical resources */}
        {product.images?.[0]?.url && (
          <link rel="preload" as="image" href={product.images[0].url} />
        )}
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span className="capitalize" style={{ color: 'var(--muted)' }}>{product.category}</span>
            <span>/</span>
            <span style={{ color: 'var(--foreground)' }}>{product.name}</span>
          </div>
        </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {product.images && product.images.length > 0 && !imageError[selectedImage] ? (
              <Image
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].alt || product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
                onError={() => handleImageError(selectedImage)}
              />
            ) : (
              <DefaultProductImage 
                productName={product.name} 
                category={product.category} 
              />
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden ${
                    selectedImage === index ? 'border-opacity-100' : 'border-opacity-30'
                  }`}
                  style={{ borderColor: 'var(--brand)' }}
                >
                  {!imageError[index] ? (
                    <Image
                      src={image.url}
                      alt={image.alt || product.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(index)}
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'var(--surface)' }}>
                      <DefaultProductImage 
                        productName={product.name} 
                        category={product.category} 
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Brand */}
          {product.brand && (
            <p className="text-sm font-medium" style={{ color: 'var(--brand)' }}>
              {product.brand}
            </p>
          )}

          {/* Name */}
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            {product.name}
          </h1>

          {/* Rating */}
          {product.rating?.average > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="20"
                    height="20"
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
                {product.rating.average.toFixed(1)} ({product.rating.count} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl line-through" style={{ color: 'var(--muted)' }}>
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="bg-red-500 text-white text-sm px-2 py-1 rounded">
                    -{discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div>
            {isOutOfStock ? (
              <span className="text-red-500 font-medium">Out of Stock</span>
            ) : isLowStock ? (
              <span className="text-orange-500 font-medium">
                Only {product.inventory.quantity} left in stock
              </span>
            ) : (
              <span className="text-green-500 font-medium">In Stock</span>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-lg" style={{ color: 'var(--muted)' }}>
              {product.shortDescription}
            </p>
          )}

          {/* Admin Edit Button or Add to Cart */}
          {mounted && isAdmin ? (
            <div className="space-y-4">
              <Link
                href={`/admin/products/${product._id}/edit`}
                className="w-full py-3 px-6 rounded-md font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                style={{ background: 'var(--brand)', color: 'white' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit Product
              </Link>
            </div>
          ) : !isOutOfStock && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Quantity:
                </label>
                <div className="flex items-center border rounded-md" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:opacity-80"
                    style={{ color: 'var(--foreground)' }}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:opacity-80"
                    style={{ color: 'var(--foreground)' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-3 px-6 rounded-md font-medium hover:opacity-90 transition-opacity"
                style={{ background: 'var(--brand)', color: 'white' }}
              >
                Add to Cart
              </button>
            </div>
          )}

          {/* Product Status Badges */}
          <div className="flex flex-wrap gap-2">
            {product.isFeatured && (
              <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">
                Featured
              </span>
            )}
            {product.isOnSale && (
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--muted)', color: 'white' }}>
                On Sale
              </span>
            )}
            {product.saleStartDate && product.saleEndDate && (
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--brand-2)', color: 'var(--foreground)' }}>
                Sale ends: {new Date(product.saleEndDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Tags:
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ background: 'var(--brand-2)', color: 'var(--foreground)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-12 space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Description
          </h2>
          <div className="prose max-w-none" style={{ color: 'var(--muted)' }}>
            <p className="whitespace-pre-line">{product.description}</p>
          </div>
        </div>

        {/* Specifications */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Product Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Brand:</span>
              <span style={{ color: 'var(--foreground)' }}>{product.brand}</span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Category:</span>
              <span className="capitalize" style={{ color: 'var(--foreground)' }}>{product.category}</span>
            </div>
            {product.subcategory && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Subcategory:</span>
                <span className="capitalize" style={{ color: 'var(--foreground)' }}>{product.subcategory}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>SKU:</span>
              <span style={{ color: 'var(--foreground)' }}>{product.sku}</span>
            </div>

            {/* Weight & Dimensions */}
            {product.specifications?.weight?.value && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Weight:</span>
                <span style={{ color: 'var(--foreground)' }}>
                  {product.specifications.weight.value} {product.specifications.weight.unit}
                </span>
              </div>
            )}
            {product.specifications?.dimensions?.length && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Dimensions:</span>
                <span style={{ color: 'var(--foreground)' }}>
                  {product.specifications.dimensions.length} × {product.specifications.dimensions.width} × {product.specifications.dimensions.height} {product.specifications.dimensions.unit}
                </span>
              </div>
            )}

            {/* Skin Care Specific */}
            {product.specifications?.skinType?.length > 0 && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Skin Type:</span>
                <span className="capitalize" style={{ color: 'var(--foreground)' }}>
                  {product.specifications.skinType.join(', ')}
                </span>
              </div>
            )}
            {product.specifications?.concerns?.length > 0 && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Addresses:</span>
                <span className="capitalize" style={{ color: 'var(--foreground)' }}>
                  {product.specifications.concerns.join(', ')}
                </span>
              </div>
            )}

            {/* Inventory Information */}
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Stock Quantity:</span>
              <span style={{ color: 'var(--foreground)' }}>{product.inventory?.quantity || 0}</span>
            </div>
            {product.inventory?.trackInventory && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Low Stock Alert:</span>
                <span style={{ color: 'var(--foreground)' }}>{product.inventory.lowStockThreshold} units</span>
              </div>
            )}

            {/* Dates */}
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Added:</span>
              <span style={{ color: 'var(--foreground)' }}>
                {new Date(product.createdAt).toLocaleDateString()}
              </span>
            </div>
            {product.updatedAt !== product.createdAt && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Last Updated:</span>
                <span style={{ color: 'var(--foreground)' }}>
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Sale Information */}
            {product.isOnSale && product.saleStartDate && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Sale Started:</span>
                <span style={{ color: 'var(--foreground)' }}>
                  {new Date(product.saleStartDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {product.isOnSale && product.saleEndDate && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Sale Ends:</span>
                <span style={{ color: 'var(--foreground)' }}>
                  {new Date(product.saleEndDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ingredients */}
        {product.specifications?.ingredients?.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Ingredients
            </h2>
            <p style={{ color: 'var(--muted)' }}>
              {product.specifications.ingredients.join(', ')}
            </p>
          </div>
        )}

        {/* Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Customer Reviews ({product.reviews.length})
            </h2>
            <div className="space-y-6">
              {product.reviews.slice(0, 5).map((review, index) => (
                <div key={index} className="border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={i < review.rating ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-yellow-400"
                          >
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                          </svg>
                        ))}
                      </div>
                      {review.isVerified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p style={{ color: 'var(--muted)' }}>{review.comment}</p>
                  )}
                </div>
              ))}
              {product.reviews.length > 5 && (
                <p className="text-center" style={{ color: 'var(--muted)' }}>
                  Showing 5 of {product.reviews.length} reviews
                </p>
              )}
            </div>
          </div>
        )}

        {/* SEO Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": product.name,
              "image": product.images?.map(img => img.url) || [],
              "description": product.description,
              "sku": product.sku,
              "mpn": product.sku,
              "gtin": product.sku,
              "brand": {
                "@type": "Brand",
                "name": product.brand
              },
              "manufacturer": {
                "@type": "Organization",
                "name": product.brand
              },
              "category": product.category,
              "additionalProperty": [
                ...(product.specifications?.weight?.value ? [{
                  "@type": "PropertyValue",
                  "name": "Weight",
                  "value": `${product.specifications.weight.value} ${product.specifications.weight.unit}`
                }] : []),
                ...(product.specifications?.skinType?.length ? [{
                  "@type": "PropertyValue",
                  "name": "Skin Type",
                  "value": product.specifications.skinType.join(", ")
                }] : []),
                ...(product.specifications?.concerns?.length ? [{
                  "@type": "PropertyValue",
                  "name": "Addresses Concerns",
                  "value": product.specifications.concerns.join(", ")
                }] : []),
                {
                  "@type": "PropertyValue",
                  "name": "Category",
                  "value": product.category
                },
                ...(product.subcategory ? [{
                  "@type": "PropertyValue",
                  "name": "Subcategory",
                  "value": product.subcategory
                }] : [])
              ],
              "offers": {
                "@type": "Offer",
                "url": `${typeof window !== 'undefined' ? window.location.origin : ''}/products/${resolvedParams.id}`,
                "priceCurrency": "USD",
                "price": product.price,
                "priceValidUntil": product.saleEndDate || "2025-12-31",
                "itemCondition": "https://schema.org/NewCondition",
                "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": "Cosmetic Shop",
                  "url": typeof window !== 'undefined' ? window.location.origin : ''
                },
                "hasMerchantReturnPolicy": {
                  "@type": "MerchantReturnPolicy",
                  "applicableCountry": "US",
                  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                  "merchantReturnDays": 30
                },
                "shippingDetails": {
                  "@type": "OfferShippingDetails",
                  "shippingRate": {
                    "@type": "MonetaryAmount",
                    "value": "0",
                    "currency": "USD"
                  },
                  "deliveryTime": {
                    "@type": "ShippingDeliveryTime",
                    "handlingTime": {
                      "@type": "QuantitativeValue",
                      "minValue": 1,
                      "maxValue": 2,
                      "unitCode": "DAY"
                    },
                    "transitTime": {
                      "@type": "QuantitativeValue",
                      "minValue": 3,
                      "maxValue": 7,
                      "unitCode": "DAY"
                    }
                  }
                }
              },
              "aggregateRating": product.rating?.count > 0 ? {
                "@type": "AggregateRating",
                "ratingValue": product.rating.average,
                "reviewCount": product.rating.count,
                "bestRating": 5,
                "worstRating": 1
              } : undefined,
              "review": product.reviews?.slice(0, 5).map(review => ({
                "@type": "Review",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": review.rating,
                  "bestRating": 5,
                  "worstRating": 1
                },
                "author": {
                  "@type": "Person",
                  "name": "Verified Customer"
                },
                "reviewBody": review.comment,
                "datePublished": review.createdAt
              })) || [],
              "isRelatedTo": product.tags?.map(tag => ({
                "@type": "Thing",
                "name": tag
              })) || [],
              "audience": {
                "@type": "PeopleAudience",
                "suggestedGender": "unisex"
              }
            })
          }}
        />
      </div>
    </div>
    </>
  );
}
