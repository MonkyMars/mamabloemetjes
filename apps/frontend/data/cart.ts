import api from '@/lib/axios';
import { Cart, CartItem } from '@/types';
import { ApiResponse } from '@/types/api';

// Cart API functions
export const getCart = async (): Promise<Cart> => {
  const response = await api.get<ApiResponse<Cart>>('/cart');
  if (response.status !== 200) {
    throw new Error('Failed to fetch cart');
  }
  return response.data.data;
};

export const addToCart = async (productId: string, quantity: number = 1): Promise<Cart> => {
  const response = await api.post<ApiResponse<Cart>>('/cart/items', {
    product_id: productId,
    quantity,
  });
  if (response.status !== 200 && response.status !== 201) {
    throw new Error('Failed to add item to cart');
  }
  return response.data.data;
};

export const updateCartItem = async (productId: string, quantity: number): Promise<Cart> => {
  const response = await api.put<ApiResponse<Cart>>(`/cart/items/${productId}`, {
    quantity,
  });
  if (response.status !== 200) {
    throw new Error('Failed to update cart item');
  }
  return response.data.data;
};

export const removeFromCart = async (productId: string): Promise<Cart> => {
  const response = await api.delete<ApiResponse<Cart>>(`/cart/items/${productId}`);
  if (response.status !== 200) {
    throw new Error('Failed to remove item from cart');
  }
  return response.data.data;
};

export const clearCart = async (): Promise<void> => {
  const response = await api.delete('/cart');
  if (response.status !== 200 && response.status !== 204) {
    throw new Error('Failed to clear cart');
  }
};

// Helper function to calculate cart totals
export const calculateCartTotals = (items: CartItem[]): { subtotal: number; itemCount: number } => {
  const subtotal = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return { subtotal, itemCount };
};

// Mock cart functions for fallback during development
export const getMockCart = (): Cart => {
  const items: CartItem[] = [];
  const { subtotal, itemCount } = calculateCartTotals(items);

  return {
    items,
    total: subtotal,
    itemCount,
  };
};
