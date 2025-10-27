"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import ProductForm from "../../../../components/admin/ProductForm";

export default function NewProductPage() {
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
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007'}/api/products`,
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
          success('Product created successfully!');
          router.push('/products');
        } else {
          throw new Error(result.message || 'Failed to create product');
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
        
        throw new Error(errorData.message || 'Failed to create product');
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
          Create New Product
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          Add a new product to your cosmetics catalog
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg border" style={{ background: 'var(--error-bg)', borderColor: 'var(--error)', color: 'var(--error)' }}>
          <p className="font-medium">Error creating product:</p>
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
