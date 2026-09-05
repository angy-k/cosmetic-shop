"use client";
import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { useCart } from "../../../contexts/CartContext";
import DefaultProductImage from "../../../components/DefaultProductImage";
import { useTranslation } from '@/contexts/LanguageContext';
import site from "../../../config/site";
import { API_URL } from "../../../lib/apiUrl";

export default function ProductDetailPage({ params }) {
  const { t, plural } = useTranslation();
  const resolvedParams = use(params);
  const { isAdmin, user, apiCall } = useAuth();
  const { success, error: showError } = useToast();
  const { addToCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState({});
  const [notificationRequested, setNotificationRequested] = useState(false);
  const [requestingNotification, setRequestingNotification] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProduct();
  }, [resolvedParams.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${API_URL}/api/products/${resolvedParams.id}`
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
    return new Intl.NumberFormat('sr-Latn-RS', {
      style: 'currency',
      currency: 'RSD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const success = addToCart(product, quantity);
    if (success) {
      // Reset quantity to 1 after successful add
      setQuantity(1);
    }
  };

  const handleImageError = (index) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  const handleRequestNotification = async () => {
    if (!user) {
      showError(t('productDetail.loginToRequestNotification'));
      return;
    }

    setRequestingNotification(true);
    try {
      const response = await apiCall(
        `${API_URL}/api/notifications/product-availability`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: product._id }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotificationRequested(true);
          success(t('productDetail.notificationSetSuccess'));
        } else {
          throw new Error(result.message || 'Failed to request notification');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request notification');
      }
    } catch (err) {
      console.error('Error requesting notification:', err);
      showError(err.message);
    } finally {
      setRequestingNotification(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      showError(t('productDetail.loginToReview'));
      return;
    }
    if (!reviewRating) {
      showError(t('productDetail.selectRating'));
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await apiCall(
        `${API_URL}/api/products/${product._id}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit review');
      }

      success(t('productDetail.reviewThanks'));
      setReviewComment('');
      setReviewRating(0);
      await fetchProduct();
    } catch (err) {
      console.error('Error submitting review:', err);
      showError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const checkExistingNotification = async () => {
    if (!user || !product) return;

    try {
      const response = await apiCall(
        `${API_URL}/api/notifications/my-notifications`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const hasNotification = result.data.notifications.some(
            notification => notification.product._id === product._id
          );
          setNotificationRequested(hasNotification);
        }
      }
    } catch (err) {
      console.error('Error checking existing notifications:', err);
    }
  };

  // Check for existing notification when product loads
  useEffect(() => {
    if (product && user) {
      checkExistingNotification();
    }
  }, [product, user]);

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
            {error === 'Product not found' ? t('productDetail.notFound') : t('productDetail.errorTitle')}
          </h1>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>
            {error}
          </p>
          <Link
            href="/products"
            className="inline-block px-4 py-2 rounded-md hover:opacity-80"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            {t('productDetail.backToProducts')}
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

  // Fallback priceValidUntil (a year out) when there's no explicit saleEndDate
  const priceValidUntilFallback = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  })();

  return (
    <>
      {/* Title/description/OG/Twitter metadata now set server-side by the
          sibling layout.js's generateMetadata() - next/head never reached
          the server-rendered HTML link-preview scrapers read. The JSON-LD
          below still lives here since it's fine to inject client-side. */}

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="hover:underline">{t('nav.home')}</Link>
            <span>/</span>
            <Link href="/products" className="hover:underline">{t('nav.products')}</Link>
            <span>/</span>
            <span className="capitalize" style={{ color: 'var(--muted)' }}>{t(`product.categories.${product.category?.toLowerCase()}`)}</span>
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
                {product.rating.average.toFixed(1)} ({product.rating.count} {t('productDetail.reviewsSuffix')})
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
                    -{discountPercent}% {t('productDetail.offSuffix')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div>
            {isOutOfStock ? (
              <span className="text-red-500 font-medium">{t('product.outOfStock')}</span>
            ) : isLowStock ? (
              <span className="text-orange-500 font-medium">
                {t('productDetail.onlyLeftInStock', { qty: product.inventory.quantity })}
              </span>
            ) : (
              <span className="text-green-500 font-medium">{t('productDetail.inStock')}</span>
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
                {t('product.editProduct')}
              </Link>
            </div>
          ) : isOutOfStock ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ background: 'var(--brand-2)', border: '1px solid var(--border)' }}>
                <p className="text-red-500 font-medium mb-2">{t('productDetail.outOfStockNotice')}</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {t('productDetail.getNotifiedText')}
                </p>
              </div>
              
              {user ? (
                <button
                  onClick={handleRequestNotification}
                  disabled={requestingNotification || notificationRequested}
                  className="w-full py-3 px-6 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ 
                    background: notificationRequested ? 'var(--success)' : 'var(--accent)', 
                    color: 'white' 
                  }}
                >
                  {requestingNotification ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('productDetail.settingUpNotification')}
                    </>
                  ) : notificationRequested ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('productDetail.notificationSet')}
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l6.586 6.586a2 2 0 002.828 0l6.586-6.586A2 2 0 0019.414 5H4.828a2 2 0 00-1.414 2z" />
                      </svg>
                      {t('productDetail.notifyWhenAvailable')}
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
                    {t('productDetail.loginToGetNotified')}
                  </p>
                  <Link
                    href="/login"
                    className="inline-block py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    {t('nav.login')}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {t('productDetail.quantity')}
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
                {t('productDetail.addToCart')}
              </button>
            </div>
          )}

          {/* Product Status Badges */}
          <div className="flex flex-wrap gap-2">
            {product.isFeatured && (
              <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">
                {t('product.featured')}
              </span>
            )}
            {product.isOnSale && (
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--muted)', color: 'white' }}>
                {t('productDetail.onSale')}
              </span>
            )}
            {product.saleStartDate && product.saleEndDate && (
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--brand-2)', color: 'var(--foreground)' }}>
                {t('productDetail.saleEnds', { date: new Date(product.saleEndDate).toLocaleDateString() })}
              </span>
            )}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('productDetail.tags')}
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
            {t('productDetail.description')}
          </h2>
          <div className="prose max-w-none" style={{ color: 'var(--muted)' }}>
            <p className="whitespace-pre-line">{product.description}</p>
          </div>
        </div>

        {/* Specifications */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {t('productDetail.productDetails')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>{t('productDetail.brand')}</span>
              <span style={{ color: 'var(--foreground)' }}>{product.brand}</span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>{t('productDetail.category')}</span>
              <span className="capitalize" style={{ color: 'var(--foreground)' }}>{t(`product.categories.${product.category?.toLowerCase()}`)}</span>
            </div>
            {product.subcategory && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{t('productDetail.subcategory')}</span>
                <span className="capitalize" style={{ color: 'var(--foreground)' }}>{product.subcategory}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>{t('productDetail.sku')}</span>
              <span style={{ color: 'var(--foreground)' }}>{product.sku}</span>
            </div>

            {/* Weight & Dimensions */}
            {product.specifications?.weight?.value && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{t('productDetail.weight')}</span>
                <span style={{ color: 'var(--foreground)' }}>
                  {product.specifications.weight.value} {product.specifications.weight.unit}
                </span>
              </div>
            )}
            {product.specifications?.dimensions?.length && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{t('productDetail.dimensions')}</span>
                <span style={{ color: 'var(--foreground)' }}>
                  {product.specifications.dimensions.length} × {product.specifications.dimensions.width} × {product.specifications.dimensions.height} {product.specifications.dimensions.unit}
                </span>
              </div>
            )}

            {/* Skin Care Specific */}
            {product.specifications?.skinType?.length > 0 && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{t('productDetail.skinType')}</span>
                <span className="capitalize" style={{ color: 'var(--foreground)' }}>
                  {product.specifications.skinType.join(', ')}
                </span>
              </div>
            )}
            {product.specifications?.concerns?.length > 0 && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{t('productDetail.addresses')}</span>
                <span className="capitalize" style={{ color: 'var(--foreground)' }}>
                  {product.specifications.concerns.join(', ')}
                </span>
              </div>
            )}

            {/* Inventory Information */}
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>{t('productDetail.stockQuantity')}</span>
              <span style={{ color: 'var(--foreground)' }}>{product.inventory?.quantity || 0}</span>
            </div>
            {product.inventory?.trackInventory && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{t('productDetail.lowStockAlert')}</span>
                <span style={{ color: 'var(--foreground)' }}>{product.inventory.lowStockThreshold} {t('productDetail.units')}</span>
              </div>
            )}

            {/* Dates */}
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>{t('productDetail.added')}</span>
              <span style={{ color: 'var(--foreground)' }}>
                {new Date(product.createdAt).toLocaleDateString()}
              </span>
            </div>
            {product.updatedAt !== product.createdAt && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{t('productDetail.lastUpdated')}</span>
                <span style={{ color: 'var(--foreground)' }}>
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Sale Information */}
            {product.isOnSale && product.saleStartDate && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{t('productDetail.saleStarted')}</span>
                <span style={{ color: 'var(--foreground)' }}>
                  {new Date(product.saleStartDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {product.isOnSale && product.saleEndDate && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{t('productDetail.saleEndsLabel')}</span>
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
              {t('productDetail.ingredients')}
            </h2>
            <p style={{ color: 'var(--muted)' }}>
              {product.specifications.ingredients.join(', ')}
            </p>
          </div>
        )}

        {/* Reviews Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {t('productDetail.customerReviews')} {product.reviews && product.reviews.length > 0 ? `(${product.reviews.length})` : ''}
          </h2>

          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-6 mb-8">
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
                          {t('productDetail.verifiedPurchase')}
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
                  {t('productDetail.showingReviews', { shown: 5, total: product.reviews.length })}
                </p>
              )}
            </div>
          ) : (
            <p className="mb-8" style={{ color: 'var(--muted)' }}>
              {t('productDetail.noReviewsYet')}
            </p>
          )}

          {/* Leave a review - registered, non-admin users only */}
          {mounted && user && !isAdmin && (
            <div className="rounded-lg border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                {t('productDetail.leaveReview')}
              </h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starValue = i + 1;
                    const filled = starValue <= (reviewHoverRating || reviewRating);
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-label={t('productDetail.rateStars', { n: starValue, word: plural('star', starValue) })}
                        onClick={() => setReviewRating(starValue)}
                        onMouseEnter={() => setReviewHoverRating(starValue)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        className="p-0.5"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill={filled ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-yellow-400"
                        >
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={t('productDetail.reviewPlaceholder')}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="py-2 px-4 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--brand)', color: 'white' }}
                >
                  {submittingReview ? t('productDetail.submitting') : t('productDetail.submitReview')}
                </button>
              </form>
            </div>
          )}
        </div>

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
                "priceCurrency": "RSD",
                "price": product.price,
                "priceValidUntil": product.saleEndDate || priceValidUntilFallback,
                "itemCondition": "https://schema.org/NewCondition",
                "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": site.brandName,
                  "url": typeof window !== 'undefined' ? window.location.origin : ''
                },
                "hasMerchantReturnPolicy": {
                  "@type": "MerchantReturnPolicy",
                  "applicableCountry": "RS",
                  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                  "merchantReturnDays": 30
                },
                "shippingDetails": {
                  "@type": "OfferShippingDetails",
                  "shippingRate": {
                    "@type": "MonetaryAmount",
                    "value": "0",
                    "currency": "RSD"
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
