"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import DefaultProductImage from "../../components/DefaultProductImage";

export default function NotificationsPage() {
  const { user, apiCall } = useAuth();
  const { success, error: showError } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007'}/api/notifications/my-notifications`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotifications(result.data.notifications);
        } else {
          throw new Error(result.message || 'Failed to fetch notifications');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNotification = async (productId) => {
    setCancellingId(productId);
    try {
      const response = await apiCall(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007'}/api/notifications/product-availability/${productId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotifications(prev => prev.filter(n => n.product._id !== productId));
          success('Notification cancelled successfully');
        } else {
          throw new Error(result.message || 'Failed to cancel notification');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel notification');
      }
    } catch (err) {
      console.error('Error cancelling notification:', err);
      showError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Product Notifications
          </h1>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            Please log in to view and manage your product availability notifications.
          </p>
          <Link
            href="/login"
            className="inline-block py-3 px-6 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
            My Notifications
          </h1>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
            My Notifications
          </h1>
          <div className="p-6 rounded-lg border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--error)' }}>
            <p className="text-red-500 font-medium mb-4">Error loading notifications</p>
            <p className="mb-4" style={{ color: 'var(--muted)' }}>{error}</p>
            <button
              onClick={fetchNotifications}
              className="py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            My Notifications
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            Manage your product availability notifications
          </p>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM4.828 7l6.586 6.586a2 2 0 002.828 0l6.586-6.586A2 2 0 0019.414 5H4.828a2 2 0 00-1.414 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              No active notifications
            </h3>
            <p className="mb-6" style={{ color: 'var(--muted)' }}>
              You haven't requested any product availability notifications yet.
            </p>
            <Link
              href="/products"
              className="inline-block py-3 px-6 rounded-md font-medium hover:opacity-90 transition-opacity"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const product = notification.product;
              const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
              const isOutOfStock = product.inventory?.quantity === 0;

              return (
                <div
                  key={notification._id}
                  className="flex items-center space-x-4 p-4 rounded-lg border hover:shadow-md transition-shadow"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <Link href={`/products/${product._id}`}>
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.alt || product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        ) : (
                          <DefaultProductImage 
                            productName={product.name} 
                            category={product.category}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${product._id}`}>
                      <h3 className="font-medium hover:underline" style={{ color: 'var(--foreground)' }}>
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {product.brand}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                        {formatPrice(product.price)}
                      </span>
                      <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-500' : 'text-green-500'}`}>
                        {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex-shrink-0 text-right">
                    <div className="mb-2">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--brand-2)', color: 'var(--foreground)' }}>
                        Active
                      </span>
                    </div>
                    <button
                      onClick={() => handleCancelNotification(product._id)}
                      disabled={cancellingId === product._id}
                      className="text-sm px-3 py-1 rounded-md hover:opacity-80 disabled:opacity-50 transition-opacity"
                      style={{ background: 'var(--error)', color: 'white' }}
                    >
                      {cancellingId === product._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-lg" style={{ background: 'var(--brand-2)', border: '1px solid var(--border)' }}>
          <h3 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            How it works
          </h3>
          <ul className="text-sm space-y-1" style={{ color: 'var(--muted)' }}>
            <li>• You'll receive an email when notified products become available</li>
            <li>• Notifications are automatically cancelled after being sent</li>
            <li>• You can cancel notifications anytime before they're triggered</li>
            <li>• Visit product pages to request notifications for out-of-stock items</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
