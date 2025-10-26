"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";

export default function AdminProductsPage() {
  const { apiCall } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products?page=${page}&limit=${pagination.limit}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProducts(result.data.items);
          setPagination(result.data.pagination);
        } else {
          throw new Error(result.message || 'Failed to fetch products');
        }
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
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

  const getStatusBadge = (product) => {
    if (!product.isActive) {
      return <span className="px-2 py-1 text-xs rounded" style={{ background: '#ef4444', color: 'white' }}>Inactive</span>;
    }
    if (product.inventory?.quantity === 0) {
      return <span className="px-2 py-1 text-xs rounded" style={{ background: '#f59e0b', color: 'white' }}>Out of Stock</span>;
    }
    if (product.inventory?.quantity <= product.inventory?.lowStockThreshold) {
      return <span className="px-2 py-1 text-xs rounded" style={{ background: '#f59e0b', color: 'white' }}>Low Stock</span>;
    }
    return <span className="px-2 py-1 text-xs rounded" style={{ background: '#10b981', color: 'white' }}>Active</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--brand)' }}></div>
          <p style={{ color: 'var(--muted)' }}>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error loading products: {error}</p>
        <button
          onClick={() => fetchProducts(pagination.page)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Product Management
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            Manage your product catalog
          </p>
        </div>
        
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:opacity-90"
          style={{ background: 'var(--brand)', color: 'white' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add New Product
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
              <tr>
                <th className="text-left p-4 font-medium" style={{ color: 'var(--foreground)' }}>Product</th>
                <th className="text-left p-4 font-medium" style={{ color: 'var(--foreground)' }}>Category</th>
                <th className="text-left p-4 font-medium" style={{ color: 'var(--foreground)' }}>Price</th>
                <th className="text-left p-4 font-medium" style={{ color: 'var(--foreground)' }}>Stock</th>
                <th className="text-left p-4 font-medium" style={{ color: 'var(--foreground)' }}>Status</th>
                <th className="text-left p-4 font-medium" style={{ color: 'var(--foreground)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--background)' }}>
                        {product.images?.[0]?.url ? (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--muted)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                              <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {product.name}
                        </p>
                        {product.brand && (
                          <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            {product.brand}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize" style={{ color: 'var(--foreground)' }}>
                      {product.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-sm line-through" style={{ color: 'var(--muted)' }}>
                          {formatPrice(product.originalPrice)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span style={{ color: 'var(--foreground)' }}>
                      {product.inventory?.quantity || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(product)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/${product._id}`}
                        className="p-2 rounded hover:bg-gray-100"
                        title="View Product"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--muted)' }}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </Link>
                      <Link
                        href={`/admin/products/${product._id}/edit`}
                        className="p-2 rounded hover:bg-gray-100"
                        title="Edit Product"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--brand)' }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--muted)' }}>No products found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchProducts(page)}
                className={`px-3 py-2 rounded ${
                  page === pagination.page
                    ? 'font-medium'
                    : 'hover:bg-gray-100'
                }`}
                style={{
                  background: page === pagination.page ? 'var(--brand)' : 'transparent',
                  color: page === pagination.page ? 'white' : 'var(--foreground)'
                }}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
