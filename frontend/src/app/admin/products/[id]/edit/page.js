"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useToast } from "../../../../../contexts/ToastContext";
import ProductForm from "../../../../../components/admin/ProductForm";
import { useTranslation } from "../../../../../contexts/LanguageContext";
import { API_URL } from "../../../../../lib/apiUrl";

export default function EditProductPage({ params }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const { apiCall } = useAuth();
  const { success, error: showError } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Manual review form state
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(`${API_URL}/api/products/${id}?includeInactive=true`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('admin.editProduct.fetchFailed'));
      }

      setProduct(result.data.product);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall, id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleSubmit = async (formData) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await apiCall(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.message && result.message.includes('Duplicate key error')) {
          if (result.message.includes('sku')) {
            setError(t('admin.editProduct.skuExists'));
          } else {
            setError(t('admin.editProduct.productExists'));
          }
          return;
        }

        // Surface the specific field(s) that failed validation, instead of
        // just the generic "Validation failed" message.
        if (Array.isArray(result.errors) && result.errors.length > 0) {
          setError(result.errors.map(e => `${e.field}: ${e.message}`).join('; '));
          return;
        }

        throw new Error(result.message || t('admin.editProduct.updateFailed'));
      }

      success(t('admin.editProduct.successUpdated'));
      router.push('/admin/products');
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/products');
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewAuthor.trim()) {
      showError(t('admin.editProduct.enterNameForReview'));
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await apiCall(`${API_URL}/api/products/${id}/admin-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: reviewAuthor.trim(),
          rating: Number(reviewRating),
          comment: reviewComment.trim(),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('admin.editProduct.addReviewFailed'));
      }

      setProduct(prev => ({ ...prev, reviews: result.data.reviews, rating: result.data.rating }));
      setReviewAuthor('');
      setReviewRating('5');
      setReviewComment('');
      success(t('admin.editProduct.reviewAdded'));
    } catch (err) {
      console.error('Error adding review:', err);
      showError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setDeletingReviewId(reviewId);
    try {
      const response = await apiCall(`${API_URL}/api/products/${id}/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t('admin.editProduct.deleteReviewFailed'));
      }

      setProduct(prev => ({ ...prev, reviews: result.data.reviews, rating: result.data.rating }));
      success(t('admin.editProduct.reviewDeleted'));
    } catch (err) {
      console.error('Error deleting review:', err);
      showError(err.message);
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-6 rounded-lg border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--error)' }}>
          <p className="text-red-500 font-medium mb-4">{t('admin.editProduct.errorLoadingProduct')}</p>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>{error}</p>
          <button
            onClick={fetchProduct}
            className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            {t('admin.dashboard.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          {t('admin.editProduct.title')}
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          {t('admin.editProduct.subtitle', { name: product.name })}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg border" style={{ background: 'var(--error-bg)', borderColor: 'var(--error)', color: 'var(--error)' }}>
          <p className="font-medium">{t('admin.editProduct.errorTitle')}</p>
          <p>{error}</p>
        </div>
      )}

      {/* Product Form */}
      <div className="rounded-lg border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSaving}
        />
      </div>

      {/* Reviews Management */}
      <div className="rounded-lg border p-6 space-y-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            {t('admin.editProduct.reviewsTitle')}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {t('admin.editProduct.reviewsSubtitle', { avg: product.rating?.average ?? 0, count: product.rating?.count ?? 0 })}
          </p>
        </div>

        {/* Existing Reviews */}
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-3">
            {product.reviews.map((review) => (
              <div
                key={review._id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg border"
                style={{ borderColor: 'var(--border)' }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                      {review.authorName || t('admin.editProduct.registeredCustomer')}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--brand)' }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                    {review.isVerified && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--brand-2)', color: 'var(--foreground)' }}>
                        {t('admin.editProduct.verified')}
                      </span>
                    )}
                  </div>
                  {review.comment && (
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{review.comment}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteReview(review._id)}
                  disabled={deletingReviewId === review._id}
                  className="text-xs px-3 py-1 rounded hover:opacity-70 disabled:opacity-50 flex-shrink-0"
                  style={{ background: 'var(--error)', color: 'white' }}
                >
                  {deletingReviewId === review._id ? t('admin.editProduct.deleting') : t('admin.editProduct.delete')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('admin.editProduct.noReviewsYet')}</p>
        )}

        {/* Add Manual Review Form */}
        <form onSubmit={handleAddReview} className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{t('admin.editProduct.addReview')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={reviewAuthor}
              onChange={(e) => setReviewAuthor(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              placeholder={t('admin.editProduct.namePlaceholder')}
            />
            <select
              value={reviewRating}
              onChange={(e) => setReviewRating(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              {[5, 4, 3, 2, 1].map(n => (
                <option key={n} value={n}>{n} {'★'.repeat(n)}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {submittingReview ? t('admin.editProduct.adding') : t('admin.editProduct.addReviewButton')}
            </button>
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows="2"
            maxLength="500"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            placeholder={t('admin.editProduct.commentPlaceholder')}
          />
        </form>
      </div>
    </div>
  );
}
