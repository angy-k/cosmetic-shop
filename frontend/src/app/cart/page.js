"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import DefaultProductImage from "../../components/DefaultProductImage";

export default function CartPage() {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartSubtotal, 
    getTaxAmount, 
    getShippingCost, 
    getOrderTotal 
  } = useCart();
  const { user } = useAuth();
  const [updatingItems, setUpdatingItems] = useState(new Set());

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    setUpdatingItems(prev => new Set([...prev, productId]));
    const success = updateQuantity(productId, newQuantity);
    
    // Remove from updating set after a brief delay
    setTimeout(() => {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }, 300);
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };

  const subtotal = getCartSubtotal();
  const taxAmount = getTaxAmount();
  const shippingCost = getShippingCost(subtotal);
  const total = getOrderTotal();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Your cart is empty
          </h1>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            href="/products"
            className="inline-block py-3 px-6 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h1>
          <button
            onClick={clearCart}
            className="text-sm px-4 py-2 rounded-md hover:opacity-80 transition-opacity"
            style={{ background: 'var(--error)', color: 'white' }}
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => {
                const product = item.product;
                const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                const isUpdating = updatingItems.has(product._id);
                const itemTotal = product.price * item.quantity;

                return (
                  <div
                    key={product._id}
                    className="flex items-center space-x-4 p-4 rounded-lg border"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <Link href={`/products/${product._id}`}>
                        <div className="w-20 h-20 rounded-lg overflow-hidden">
                          {primaryImage ? (
                            <Image
                              src={primaryImage.url}
                              alt={primaryImage.alt || product.name}
                              width={80}
                              height={80}
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
                      <p className="font-medium mt-1" style={{ color: 'var(--foreground)' }}>
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center border rounded-md" style={{ borderColor: 'var(--border)' }}>
                        <button
                          onClick={() => handleQuantityChange(product._id, item.quantity - 1)}
                          disabled={isUpdating}
                          className="px-3 py-2 hover:opacity-80 disabled:opacity-50"
                          style={{ color: 'var(--foreground)' }}
                        >
                          -
                        </button>
                        <span 
                          className="px-4 py-2 border-x min-w-[3rem] text-center"
                          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        >
                          {isUpdating ? '...' : item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(product._id, item.quantity + 1)}
                          disabled={isUpdating}
                          className="px-3 py-2 hover:opacity-80 disabled:opacity-50"
                          style={{ color: 'var(--foreground)' }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Item Total & Remove */}
                    <div className="text-right">
                      <p className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                        {formatPrice(itemTotal)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(product._id)}
                        className="text-sm px-3 py-1 rounded-md hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--error)', color: 'white' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  Order Summary
                </h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>Subtotal:</span>
                    <span style={{ color: 'var(--foreground)' }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>Tax:</span>
                    <span style={{ color: 'var(--foreground)' }}>{formatPrice(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>Shipping:</span>
                    <span style={{ color: 'var(--foreground)' }}>
                      {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  {subtotal < 50 && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Free shipping on orders over $50
                    </p>
                  )}
                  <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex justify-between font-semibold text-lg">
                      <span style={{ color: 'var(--foreground)' }}>Total:</span>
                      <span style={{ color: 'var(--foreground)' }}>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {user ? (
                  <Link
                    href="/checkout"
                    className="w-full block text-center py-3 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
                    style={{ background: 'var(--brand)', color: 'white' }}
                  >
                    Proceed to Checkout
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
                      Please log in to continue with checkout
                    </p>
                    <Link
                      href="/login"
                      className="w-full block text-center py-3 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
                      style={{ background: 'var(--brand)', color: 'white' }}
                    >
                      Log In to Checkout
                    </Link>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <Link
                    href="/products"
                    className="w-full block text-center py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
