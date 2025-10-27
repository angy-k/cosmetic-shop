"use client";
import { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext();

// Cart actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART'
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.product._id === product._id);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.product._id === product._id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        };
      }
      
      return {
        ...state,
        items: [...state.items, { product, quantity }]
      };
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      const { productId } = action.payload;
      return {
        ...state,
        items: state.items.filter(item => item.product._id !== productId)
      };
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.product._id !== productId)
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.product._id === productId
            ? { ...item, quantity }
            : item
        )
      };
    }
    
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: []
      };
    
    case CART_ACTIONS.LOAD_CART:
      return {
        ...state,
        items: action.payload.items || []
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  items: []
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();
  const { success, error } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cosmetic-shop-cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
      } catch (err) {
        console.error('Error loading cart from localStorage:', err);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cosmetic-shop-cart', JSON.stringify(state));
  }, [state]);

  // Cart calculations
  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      const price = item.product.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartSubtotal = () => {
    return getCartTotal();
  };

  const getTaxAmount = (taxRate = 0.08) => {
    return getCartSubtotal() * taxRate;
  };

  const getShippingCost = (subtotal) => {
    // Free shipping over $50
    return subtotal >= 50 ? 0 : 5.99;
  };

  const getOrderTotal = (taxRate = 0.08) => {
    const subtotal = getCartSubtotal();
    const tax = getTaxAmount(taxRate);
    const shipping = getShippingCost(subtotal);
    return subtotal + tax + shipping;
  };

  // Cart actions
  const addToCart = (product, quantity = 1) => {
    // Check if product is in stock
    if (product.inventory && product.inventory.quantity < quantity) {
      error(`Only ${product.inventory.quantity} items available in stock`);
      return false;
    }

    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { product, quantity }
    });

    success(`${product.name} added to cart`);
    return true;
  };

  const removeFromCart = (productId) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: { productId }
    });
    success('Item removed from cart');
  };

  const updateQuantity = (productId, quantity) => {
    const item = state.items.find(item => item.product._id === productId);
    if (!item) return false;

    // Check stock availability
    if (item.product.inventory && item.product.inventory.quantity < quantity) {
      error(`Only ${item.product.inventory.quantity} items available in stock`);
      return false;
    }

    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { productId, quantity }
    });
    return true;
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
    success('Cart cleared');
  };

  const isInCart = (productId) => {
    return state.items.some(item => item.product._id === productId);
  };

  const getCartItem = (productId) => {
    return state.items.find(item => item.product._id === productId);
  };

  // Prepare cart data for order submission
  const getOrderData = (shippingAddress, billingAddress, paymentMethod = 'credit-card') => {
    const subtotal = getCartSubtotal();
    const taxRate = 0.08;
    const taxAmount = getTaxAmount(taxRate);
    const shippingCost = getShippingCost(subtotal);
    const total = subtotal + taxAmount + shippingCost;

    return {
      items: state.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      subtotal,
      tax: {
        amount: taxAmount,
        rate: taxRate
      },
      shipping: {
        cost: shippingCost,
        method: 'standard' // Always use 'standard' as it's a valid enum value
      },
      total,
      shippingAddress,
      billingAddress,
      payment: {
        method: paymentMethod
      }
    };
  };

  const value = {
    // State
    items: state.items,
    
    // Calculations
    getCartTotal,
    getCartItemsCount,
    getCartSubtotal,
    getTaxAmount,
    getShippingCost,
    getOrderTotal,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getCartItem,
    getOrderData
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
