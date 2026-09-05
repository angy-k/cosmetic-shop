"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import DefaultProductImage from "../../components/DefaultProductImage";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../../components/PaymentForm';
import { formatRSD, formatEUR, rsdToEur, rsdToEurCents } from '../../lib/currency';
import { useTranslation } from '@/contexts/LanguageContext';
import { API_URL } from "../../lib/apiUrl";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const { t } = useTranslation();
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
      country: 'Srbija'
    },
    // Billing Address
    billingAddress: {
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Srbija'
    },
    // Payment
    paymentMethod: 'credit-card',
    // Options
    sameAsShipping: true
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState(null);

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
    if (user?.name) {
      const [firstName, ...rest] = user.name.trim().split(' ');
      const lastName = rest.join(' ');

      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          firstName: firstName || '',
          lastName: lastName || '',
        },
        billingAddress: {
          ...prev.billingAddress,
          firstName: firstName || '',
          lastName: lastName || '',
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
        country: 'Srbija'
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate shipping address
    const shippingFields = ['firstName', 'lastName', 'street', 'city', 'state', 'zipCode'];
    shippingFields.forEach(field => {
      if (!formData.shippingAddress[field]?.trim()) {
        newErrors[`shippingAddress.${field}`] = t('checkout.requiredField');
      }
    });

    // Validate billing address if different from shipping
    if (!formData.sameAsShipping) {
      const billingFields = ['firstName', 'lastName', 'street', 'city', 'state', 'zipCode'];
      billingFields.forEach(field => {
        if (!formData.billingAddress[field]?.trim()) {
          newErrors[`billingAddress.${field}`] = t('checkout.requiredField');
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Creates the order, then requests a Stripe PaymentIntent - triggered by
  // the "Continue to Payment" button, not automatically on page load.
  const handlePlaceOrder = async () => {
    if (clientSecret) return; // order + intent already created

    if (!validateForm()) {
      showError(t('checkout.fillRequiredFields'));
      return;
    }

    setInitiatingPayment(true);

    try {
      const orderPayload = getOrderData(
        formData.shippingAddress,
        formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress,
        'stripe'
      );

      const orderResponse = await apiCall(`${API_URL}/api/orders`, {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });
      const orderResult = await orderResponse.json();

      if (!orderResponse.ok || !orderResult.success) {
        throw new Error(orderResult.message || t('checkout.failedToCreateOrder'));
      }

      const newOrderId = orderResult.data.order._id;
      setOrderId(newOrderId);

      const intentResponse = await apiCall(`${API_URL}/api/payment/create-payment-intent`, {
        method: 'POST',
        body: JSON.stringify({
          orderId: newOrderId,
          amount: rsdToEurCents(getOrderTotal()), // Stripe charges in EUR, not RSD
          currency: 'eur',
        }),
      });
      const intentResult = await intentResponse.json();

      if (!intentResponse.ok || !intentResult.clientSecret) {
        throw new Error(intentResult.error || intentResult.message || t('checkout.failedToInitPayment'));
      }

      setClientSecret(intentResult.clientSecret);
    } catch (err) {
      showError(err.message || t('checkout.failedToInitPayment'));
    } finally {
      setInitiatingPayment(false);
    }
  };

  // Reports the outcome to the backend alongside the Stripe webhook - mainly
  // for local dev, where the webhook often can't reach us. Best-effort only.
  const reportPaymentResult = async (paymentIntentId) => {
    if (!paymentIntentId) return;
    try {
      await apiCall(`${API_URL}/api/payment/confirm-result`, {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId }),
      });
    } catch (err) {
      console.error('Failed to report payment result to backend:', err);
    }
  };

  const handlePaymentSuccess = async (result) => {
    await reportPaymentResult(result?.id);
    success(t('checkout.paymentSuccessful'));
    clearCart();
    router.push('/order/success');
  };

  const handlePaymentError = async (error, paymentIntentId) => {
    showError(error.message || t('checkout.paymentFailed'));
    await reportPaymentResult(paymentIntentId);
  };

  const renderPaymentSection = () => (
    <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>{t('checkout.paymentMethod')}</h2>
      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            clientSecret={clientSecret}
            onPaymentSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            submitting={submitting}
            setSubmitting={setSubmitting}
          />
        </Elements>
      ) : (
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={initiatingPayment}
          className="w-full py-3 px-4 rounded-md text-white font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--brand)' }}
        >
          {initiatingPayment ? t('checkout.preparingCheckout') : t('checkout.continueToPayment')}
        </button>
      )}
      <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
        {t('checkout.paymentSecureNotice', { amount: formatEUR(rsdToEur(total)) })}
      </p>
    </div>
  );

  const formatPrice = formatRSD;

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
          {t('checkout.title')}
        </h1>

        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  {t('checkout.shippingAddress')}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                      {t('checkout.firstName')}
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
                      {t('checkout.lastName')}
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
                    {t('checkout.streetAddress')}
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
                      {t('checkout.city')}
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
                      {t('checkout.state')}
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
                      {t('checkout.zipCode')}
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
                      {t('checkout.country')}
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
                      <option value="Srbija">Srbija</option>
                      <option value="Bosna i Hercegovina">Bosna i Hercegovina</option>
                      <option value="Crna Gora">Crna Gora</option>
                      <option value="Hrvatska">Hrvatska</option>
                      <option value="Severna Makedonija">Severna Makedonija</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                    {t('checkout.billingAddress')}
                  </h2>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.sameAsShipping}
                      onChange={(e) => handleSameAsShippingChange(e.target.checked)}
                      className="rounded"
                      style={{ accentColor: 'var(--brand)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                      {t('checkout.sameAsShipping')}
                    </span>
                  </label>
                </div>

                {!formData.sameAsShipping && (
                  <div className="space-y-4">
                    {/* Same form fields as shipping address but for billing */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                          {t('checkout.firstName')}
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
                          {t('checkout.lastName')}
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

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                        {t('checkout.streetAddress')}
                      </label>
                      <input
                        type="text"
                        value={formData.billingAddress.street}
                        onChange={(e) => handleInputChange('billingAddress', 'street', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        style={{
                          background: 'var(--background)',
                          borderColor: errors['billingAddress.street'] ? 'var(--error)' : 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                      />
                      {errors['billingAddress.street'] && (
                        <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                          {errors['billingAddress.street']}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                          {t('checkout.city')}
                        </label>
                        <input
                          type="text"
                          value={formData.billingAddress.city}
                          onChange={(e) => handleInputChange('billingAddress', 'city', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                          style={{
                            background: 'var(--background)',
                            borderColor: errors['billingAddress.city'] ? 'var(--error)' : 'var(--border)',
                            color: 'var(--foreground)'
                          }}
                        />
                        {errors['billingAddress.city'] && (
                          <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                            {errors['billingAddress.city']}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                          {t('checkout.state')}
                        </label>
                        <input
                          type="text"
                          value={formData.billingAddress.state}
                          onChange={(e) => handleInputChange('billingAddress', 'state', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                          style={{
                            background: 'var(--background)',
                            borderColor: errors['billingAddress.state'] ? 'var(--error)' : 'var(--border)',
                            color: 'var(--foreground)'
                          }}
                        />
                        {errors['billingAddress.state'] && (
                          <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                            {errors['billingAddress.state']}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                          {t('checkout.zipCode')}
                        </label>
                        <input
                          type="text"
                          value={formData.billingAddress.zipCode}
                          onChange={(e) => handleInputChange('billingAddress', 'zipCode', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                          style={{
                            background: 'var(--background)',
                            borderColor: errors['billingAddress.zipCode'] ? 'var(--error)' : 'var(--border)',
                            color: 'var(--foreground)'
                          }}
                        />
                        {errors['billingAddress.zipCode'] && (
                          <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                            {errors['billingAddress.zipCode']}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                          {t('checkout.country')}
                        </label>
                        <select
                          value={formData.billingAddress.country}
                          onChange={(e) => handleInputChange('billingAddress', 'country', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                          style={{
                            background: 'var(--background)',
                            borderColor: 'var(--border)',
                            color: 'var(--foreground)'
                          }}
                        >
                          <option value="Srbija">Srbija</option>
                          <option value="Bosna i Hercegovina">Bosna i Hercegovina</option>
                          <option value="Crna Gora">Crna Gora</option>
                          <option value="Hrvatska">Hrvatska</option>
                          <option value="Severna Makedonija">Severna Makedonija</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  {t('checkout.paymentMethod')}
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
                    <span style={{ color: 'var(--foreground)' }}>{t('checkout.creditCard')}</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    />
                    <span style={{ color: 'var(--foreground)' }}>{t('checkout.paypal')}</span>
                  </label>
                </div>
                <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
                  {t('checkout.paymentProcessingNotice')}
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  {t('cart.orderSummary')}
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
                            {t('checkout.itemQty', { qty: item.quantity })}
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
                    <span style={{ color: 'var(--muted)' }}>{t('cart.subtotal')}</span>
                    <span style={{ color: 'var(--foreground)' }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--muted)' }}>{t('cart.tax')}</span>
                    <span style={{ color: 'var(--foreground)' }}>{formatPrice(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--muted)' }}>{t('cart.shipping')}</span>
                    <span style={{ color: 'var(--foreground)' }}>
                      {shippingCost === 0 ? t('common.free') : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ color: 'var(--foreground)' }}>{t('cart.total')}</span>
                    <span style={{ color: 'var(--foreground)' }}>{formatPrice(total)}</span>
                  </div>
                </div>

                {renderPaymentSection()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
