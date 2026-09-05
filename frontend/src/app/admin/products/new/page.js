"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import ProductForm from "../../../../components/admin/ProductForm";
import { useTranslation } from '@/contexts/LanguageContext';
import { API_URL } from "../../../../lib/apiUrl";

export default function NewProductPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { apiCall } = useAuth();
  const { success } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiCall(
        `${API_URL}/api/products`,
        {
          method: 'POST',
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
          success(t('admin.newProduct.successCreated'));
          router.push('/products');
        } else {
          throw new Error(result.message || t('admin.newProduct.createFailed'));
        }
      } else {
        const errorData = await response.json();

        // Handle specific duplicate key errors before throwing
        if (errorData.message && errorData.message.includes('Duplicate key error')) {
          if (errorData.message.includes('sku')) {
            setError(t('admin.newProduct.skuExists'));
          } else {
            setError(t('admin.newProduct.productExists'));
          }
          return; // Don't throw, just set error and return
        }

        // Surface the specific field(s) that failed validation, instead of
        // just the generic "Validation failed" message.
        if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          setError(errorData.errors.map(e => `${e.field}: ${e.message}`).join('; '));
          return;
        }

        throw new Error(errorData.message || t('admin.newProduct.createFailed'));
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/products');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          {t('admin.newProduct.title')}
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          {t('admin.newProduct.subtitle')}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg border" style={{ background: 'var(--error-bg)', borderColor: 'var(--error)', color: 'var(--error)' }}>
          <p className="font-medium">{t('admin.newProduct.errorTitle')}</p>
          <p>{error}</p>
        </div>
      )}

      {/* Product Form */}
      <div className="bg-white rounded-lg border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
