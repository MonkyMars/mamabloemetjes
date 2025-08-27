'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CartResponse, CartContextType, GuestCartItem } from '../types/cart';
import { CurrencyCalculator, Decimal } from '../lib/currency';
import * as cartApi from '../lib/cart';

export const useCart = (): CartContextType => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  // Load cart data on mount and auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      // For guest users, cart is managed locally
      setCart(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cartData = await cartApi.getCart();
      setCart(cartData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load cart';
      setError(errorMessage);
      console.error('Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const addItem = useCallback(
    async (product_id: string, quantity: number, productStock?: number) => {
      // Check stock limits if provided
      if (productStock !== undefined) {
        // Check current cart quantity
        let currentQuantity = 0;
        if (isAuthenticated && cart?.items) {
          const cartItem = cart.items.find(
            (item) => item.product_id === product_id,
          );
          currentQuantity = cartItem?.quantity || 0;
        }

        // Check if adding this quantity would exceed stock
        if (currentQuantity + quantity > productStock) {
          const errorMessage = 'Onvoldoende voorraad beschikbaar';
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      }

      if (!isAuthenticated) {
        // For guest users, manage cart locally
        cartApi.addToLocalCart(product_id, quantity);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await cartApi.addCartItem({ product_id, quantity });
        await refreshCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add item to cart';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, refreshCart, cart],
  );

  const updateItem = useCallback(
    async (item_id: string, quantity: number, productStock?: number) => {
      if (!isAuthenticated) {
        // For guest users, we don't have item_id, so this would need product_id
        // This method is primarily for authenticated users
        throw new Error('Cannot update items for guest users');
      }

      // Check stock limits if provided
      if (productStock !== undefined && quantity > productStock) {
        const errorMessage = 'Onvoldoende voorraad beschikbaar';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setError(null);

      try {
        await cartApi.updateCartItem(item_id, { quantity });
        await refreshCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update cart item';
        setError(errorMessage);
        throw err;
      }
    },
    [isAuthenticated, refreshCart],
  );

  const removeItem = useCallback(
    async (item_id: string) => {
      if (!isAuthenticated) {
        throw new Error('Cannot remove items for guest users');
      }

      setError(null);

      try {
        await cartApi.removeCartItem(item_id);
        await refreshCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to remove cart item';
        setError(errorMessage);
        throw err;
      }
    },
    [isAuthenticated, refreshCart],
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      cartApi.clearLocalCart();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await cartApi.clearCart();
      await refreshCart();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to clear cart';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshCart]);

  const totalCents = useCallback(() => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => {
      return total + item.quantity * item.unit_price_cents;
    }, 0);
  }, [cart]);

  const totalQuantity = useCallback(() => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const totalTaxCents = useCallback(() => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => {
      return total + item.quantity * item.unit_tax_cents;
    }, 0);
  }, [cart]);

  const totalSubtotalCents = useCallback(() => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => {
      return total + item.quantity * item.unit_subtotal_cents;
    }, 0);
  }, [cart]);

  // New decimal-based calculation methods
  const totalDecimal = useCallback(() => {
    if (!cart) return new Decimal(0);
    return CurrencyCalculator.sum(
      cart.items.map((item) =>
        CurrencyCalculator.multiply(
          CurrencyCalculator.centsToDecimal(item.unit_price_cents),
          item.quantity,
        ),
      ),
    );
  }, [cart]);

  const totalTaxDecimal = useCallback(() => {
    if (!cart) return new Decimal(0);
    return CurrencyCalculator.sum(
      cart.items.map((item) =>
        CurrencyCalculator.multiply(
          CurrencyCalculator.centsToDecimal(item.unit_tax_cents),
          item.quantity,
        ),
      ),
    );
  }, [cart]);

  const totalSubtotalDecimal = useCallback(() => {
    if (!cart) return new Decimal(0);
    return CurrencyCalculator.sum(
      cart.items.map((item) =>
        CurrencyCalculator.multiply(
          CurrencyCalculator.centsToDecimal(item.unit_subtotal_cents),
          item.quantity,
        ),
      ),
    );
  }, [cart]);

  // Helper function to merge guest cart on login (called from auth context)
  const mergeGuestCart = useCallback(async () => {
    if (!isAuthenticated) return;

    const localCart = cartApi.getLocalCart();
    if (localCart.items.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const guestItems: GuestCartItem[] = localCart.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const mergedCart = await cartApi.mergeCart({ items: guestItems });
      setCart(mergedCart);

      // Clear local cart after successful merge
      cartApi.clearLocalCart();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to merge cart';
      setError(errorMessage);
      console.error('Failed to merge guest cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Expose merge function for use in auth context
  useEffect(() => {
    if (isAuthenticated && user) {
      mergeGuestCart();
    }
  }, [isAuthenticated, user, mergeGuestCart]);

  return {
    cart,
    isLoading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refreshCart,
    totalCents,
    totalTaxCents,
    totalSubtotalCents,
    totalQuantity,
    totalDecimal,
    totalTaxDecimal,
    totalSubtotalDecimal,
  };
};

// Helper hook for guest cart management
export const useGuestCart = () => {
  const [localCart, setLocalCart] = useState(cartApi.getLocalCart());

  // Listen for custom cart update events
  useEffect(() => {
    const handleCartUpdate = () => {
      setLocalCart(cartApi.getLocalCart());
    };

    // Listen for storage events (only triggers for other tabs)
    window.addEventListener('storage', handleCartUpdate);
    // Listen for custom cart update events (same tab)
    window.addEventListener('localCartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener('localCartUpdated', handleCartUpdate);
    };
  }, []);

  const addItem = useCallback(
    (product_id: string, quantity: number, productStock?: number) => {
      // Check stock limits if provided
      if (productStock !== undefined) {
        const currentItem = localCart.items.find(
          (item) => item.product_id === product_id,
        );
        const currentQuantity = currentItem?.quantity || 0;

        if (currentQuantity + quantity > productStock) {
          throw new Error('Onvoldoende voorraad beschikbaar');
        }
      }

      cartApi.addToLocalCart(product_id, quantity);
      setLocalCart(cartApi.getLocalCart());
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('localCartUpdated'));
    },
    [localCart.items],
  );

  const updateItem = useCallback(
    (product_id: string, quantity: number, productStock?: number) => {
      // Check stock limits if provided
      if (productStock !== undefined && quantity > productStock) {
        throw new Error('Onvoldoende voorraad beschikbaar');
      }

      cartApi.updateLocalCartItem(product_id, quantity);
      setLocalCart(cartApi.getLocalCart());
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('localCartUpdated'));
    },
    [],
  );

  const removeItem = useCallback((product_id: string) => {
    cartApi.removeFromLocalCart(product_id);
    setLocalCart(cartApi.getLocalCart());
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('localCartUpdated'));
  }, []);

  const clearCart = useCallback(() => {
    cartApi.clearLocalCart();
    setLocalCart({ items: [] });
  }, []);

  const totalQuantity = useCallback(() => {
    return localCart.items.reduce((total, item) => total + item.quantity, 0);
  }, [localCart]);

  return {
    items: localCart.items,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    totalQuantity,
  };
};
