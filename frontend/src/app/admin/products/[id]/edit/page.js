"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useToast } from "../../../../../contexts/ToastContext";
import ProductForm from "../../../../../components/admin/ProductForm";

export default function EditProductPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { apiCall } = useAuth();
  const { success, error: showError } = useToast();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [resolvedParams.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007'}/api/products/${resolvedParams.id}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // The backend returns { data: { product } } so we need to access result.data.product
          setProduct(result.data.product);
        } else {
          throw new Error(result.message || 'Failed to fetch product');
        }
      } else {
        throw new Error('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await apiCall(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007'}/api/products/${resolvedParams.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Show success message and redirect to products page
          success('Product updated successfully!');
          router.push('/products');
        } else {
          throw new Error(result.message || 'Failed to update product');
        }
      } else {
        const errorData = await response.json();
        
        // Handle specific duplicate key errors before throwing
        if (errorData.message && errorData.message.includes('Duplicate key error')) {
          if (errorData.message.includes('sku')) {
            setError('This SKU already exists. Please use a different SKU.');
          } else {
            setError('A product with this information already exists.');
          }
          return; // Don't throw, just set error and return
        }
        
        throw new Error(errorData.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await apiCall(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007'}/api/products/${resolvedParams.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          success('Product deleted successfully!');
          router.push('/products');
        } else {
          throw new Error(result.message || 'Failed to delete product');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerNotifications = async () => {
    if (!confirm('Send availability notifications to all users who requested them for this product?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await apiCall(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007'}/api/notifications/trigger-availability/${resolvedParams.id}`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          success(`Notifications sent to ${result.data.notificationsSent} users!`);
        } else {
          throw new Error(result.message || 'Failed to trigger notifications');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to trigger notifications');
      }
    } catch (err) {
      console.error('Error triggering notifications:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/products');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--brand)' }}></div>
            <p style={{ color: 'var(--muted)' }}>Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Product Not Found
          </h1>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/products')}
            className="px-4 py-2 rounded-lg font-medium hover:opacity-90"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Edit Product
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              Update product information and settings
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleTriggerNotifications}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              style={{ background: 'var(--accent)', color: 'white' }}
              title="Send availability notifications to users who requested them"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l6.586 6.586a2 2 0 002.828 0l6.586-6.586A2 2 0 0019.414 5H4.828a2 2 0 00-1.414 2z" />
              </svg>
              Notify Users
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--error)', color: 'white' }}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Product'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg border" style={{ background: 'var(--error-bg)', borderColor: 'var(--error)', color: 'var(--error)' }}>
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Product Form */}
      <div className="bg-white rounded-lg border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
