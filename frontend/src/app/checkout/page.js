"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import DefaultProductImage from "../../components/DefaultProductImage";

export default function CheckoutPage() {
  const router = useRouter();
  const { 
    items, 
    getCartSubtotal, 
    getTaxAmount, 
    getShippingCost, 
    getOrderTotal,
    getOrderData,
    clearCart
  } = useCart();
  const { user, apiCall } = useAuth();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    // Shipping Address
    shippingAddress: {
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    // Billing Address
    billingAddress: {
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    // Payment
    paymentMethod: 'credit-card',
    // Options
    sameAsShipping: true
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect if cart is empty or user not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (items.length === 0) {
      router.push('/cart');
      return;
    }
  }, [user, items, router]);

  // Pre-fill user information if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
        },
        billingAddress: {
          ...prev.billingAddress,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
        }
      }));
    }
  }, [user]);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Clear error when user starts typing
    if (errors[`${section}.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: ''
      }));
    }
  };

  const handleSameAsShippingChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      sameAsShipping: checked,
      billingAddress: checked ? { ...prev.shippingAddress } : {
        firstName: '',
        lastName: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate shipping address
    const shippingFields = ['firstName', 'lastName', 'street', 'city', 'state', 'zipCode'];
    shippingFields.forEach(field => {
      if (!formData.shippingAddress[field]?.trim()) {
        newErrors[`shippingAddress.${field}`] = 'This field is required';
      }
    });

    // Validate billing address if different from shipping
    if (!formData.sameAsShipping) {
      const billingFields = ['firstName', 'lastName', 'street', 'city', 'state', 'zipCode'];
      billingFields.forEach(field => {
        if (!formData.billingAddress[field]?.trim()) {
          newErrors[`billingAddress.${field}`] = 'This field is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const billingAddress = formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress;
      const orderData = getOrderData(formData.shippingAddress, billingAddress, formData.paymentMethod);

      const response = await apiCall(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007'}/api/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Clear cart and redirect to success page
          clearCart();
          success('Order placed successfully! Check your email for confirmation.');
          router.push(`/orders/${result.data.order._id}`);
        } else {
          throw new Error(result.message || 'Failed to place order');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const subtotal = getCartSubtotal();
  const taxAmount = getTaxAmount();
  const shippingCost = getShippingCost(subtotal);
  const total = getOrderTotal();

  if (!user || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--foreground)' }}>
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  Shipping Address
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.firstName}
                      onChange={(e) => handleInputChange('shippingAddress', 'firstName', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ 
                        background: 'var(--background)', 
                        borderColor: errors['shippingAddress.firstName'] ? 'var(--error)' : 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                    />
                    {errors['shippingAddress.firstName'] && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                        {errors['shippingAddress.firstName']}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.lastName}
                      onChange={(e) => handleInputChange('shippingAddress', 'lastName', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ 
                        background: 'var(--background)', 
                        borderColor: errors['shippingAddress.lastName'] ? 'var(--error)' : 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                    />
                    {errors['shippingAddress.lastName'] && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                        {errors['shippingAddress.lastName']}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress.street}
                    onChange={(e) => handleInputChange('shippingAddress', 'street', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ 
                      background: 'var(--background)', 
                      borderColor: errors['shippingAddress.street'] ? 'var(--error)' : 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  />
                  {errors['shippingAddress.street'] && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                      {errors['shippingAddress.street']}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.city}
                      onChange={(e) => handleInputChange('shippingAddress', 'city', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ 
                        background: 'var(--background)', 
                        borderColor: errors['shippingAddress.city'] ? 'var(--error)' : 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                    />
                    {errors['shippingAddress.city'] && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                        {errors['shippingAddress.city']}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.state}
                      onChange={(e) => handleInputChange('shippingAddress', 'state', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ 
                        background: 'var(--background)', 
                        borderColor: errors['shippingAddress.state'] ? 'var(--error)' : 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                    />
                    {errors['shippingAddress.state'] && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                        {errors['shippingAddress.state']}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.zipCode}
                      onChange={(e) => handleInputChange('shippingAddress', 'zipCode', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ 
                        background: 'var(--background)', 
                        borderColor: errors['shippingAddress.zipCode'] ? 'var(--error)' : 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                    />
                    {errors['shippingAddress.zipCode'] && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                        {errors['shippingAddress.zipCode']}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                      Country *
                    </label>
                    <select
                      value={formData.shippingAddress.country}
                      onChange={(e) => handleInputChange('shippingAddress', 'country', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ 
                        background: 'var(--background)', 
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                    Billing Address
                  </h2>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.sameAsShipping}
                      onChange={(e) => handleSameAsShippingChange(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                      Same as shipping
                    </span>
                  </label>
                </div>

                {!formData.sameAsShipping && (
                  <div className="space-y-4">
                    {/* Same form fields as shipping address but for billing */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.billingAddress.firstName}
                          onChange={(e) => handleInputChange('billingAddress', 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                          style={{ 
                            background: 'var(--background)', 
                            borderColor: errors['billingAddress.firstName'] ? 'var(--error)' : 'var(--border)',
                            color: 'var(--foreground)'
                          }}
                        />
                        {errors['billingAddress.firstName'] && (
                          <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                            {errors['billingAddress.firstName']}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={formData.billingAddress.lastName}
                          onChange={(e) => handleInputChange('billingAddress', 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                          style={{ 
                            background: 'var(--background)', 
                            borderColor: errors['billingAddress.lastName'] ? 'var(--error)' : 'var(--border)',
                            color: 'var(--foreground)'
                          }}
                        />
                        {errors['billingAddress.lastName'] && (
                          <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                            {errors['billingAddress.lastName']}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Add other billing address fields similar to shipping */}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit-card"
                      checked={formData.paymentMethod === 'credit-card'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    />
                    <span style={{ color: 'var(--foreground)' }}>Credit Card</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    />
                    <span style={{ color: 'var(--foreground)' }}>PayPal</span>
                  </label>
                </div>
                <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
                  Payment processing will be handled securely after order confirmation.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  Order Summary
                </h2>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {items.map((item) => {
                    const product = item.product;
                    const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                    
                    return (
                      <div key={product._id} className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          {primaryImage ? (
                            <Image
                              src={primaryImage.url}
                              alt={primaryImage.alt || product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <DefaultProductImage 
                              productName={product.name} 
                              category={product.category}
                              className="w-full h-full"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                            {product.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                          {formatPrice(product.price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-2 mb-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--muted)' }}>Subtotal:</span>
                    <span style={{ color: 'var(--foreground)' }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--muted)' }}>Tax:</span>
                    <span style={{ color: 'var(--foreground)' }}>{formatPrice(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--muted)' }}>Shipping:</span>
                    <span style={{ color: 'var(--foreground)' }}>
                      {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ color: 'var(--foreground)' }}>Total:</span>
                    <span style={{ color: 'var(--foreground)' }}>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'var(--brand)', color: 'white' }}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
