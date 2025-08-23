import api from './axios';
import axios from 'axios';
import { ApiResponse } from '../types/api';
import {
  CartResponse,
  AddCartItemRequest,
  UpdateCartItemRequest,
  MergeCartRequest,
  CartItem,
} from '../types/cart';

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Token management helper (imported from auth.ts)
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

// Cart API functions
export const getCart = async (): Promise<CartResponse> => {
  try {
    const response = await api.get<ApiResponse<CartResponse>>('/api/cart');
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to fetch cart');
  }
};

export const addCartItem = async (
  request: AddCartItemRequest,
): Promise<CartItem> => {
  try {
    const response = await api.post<ApiResponse<CartItem>>(
      '/api/cart/items',
      request,
    );
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to add item to cart');
  }
};

export const updateCartItem = async (
  itemId: string,
  request: UpdateCartItemRequest,
): Promise<CartItem> => {
  try {
    const response = await api.patch<ApiResponse<CartItem>>(
      `/api/cart/items/${itemId}`,
      request,
    );
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to update cart item');
  }
};

export const removeCartItem = async (itemId: string): Promise<void> => {
  try {
    await api.delete(`/api/cart/items/${itemId}`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to remove item from cart');
  }
};

export const clearCart = async (): Promise<void> => {
  try {
    await api.delete('/api/cart');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to clear cart');
  }
};

export const mergeCart = async (
  request: MergeCartRequest,
): Promise<CartResponse> => {
  try {
    const response = await api.post<ApiResponse<CartResponse>>(
      '/api/cart/merge',
      request,
    );
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to merge cart');
  }
};

// Local storage cart management for guest users
const CART_STORAGE_KEY = 'cart.v1';

export const getLocalCart = (): {
  items: { product_id: string; quantity: number }[];
} => {
  if (typeof window === 'undefined') {
    return { items: [] };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { items: [] };
    }

    const parsed = JSON.parse(stored);
    if (!parsed.items || !Array.isArray(parsed.items)) {
      return { items: [] };
    }

    return parsed;
  } catch {
    return { items: [] };
  }
};

export const setLocalCart = (cart: {
  items: { product_id: string; quantity: number }[];
}): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        ...cart,
        version: 'v1',
        updated_at: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.warn('Failed to save cart to localStorage:', error);
  }
};

export const clearLocalCart = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_STORAGE_KEY);
};

export const addToLocalCart = (productId: string, quantity: number): void => {
  const cart = getLocalCart();
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product_id === productId,
  );

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    cart.items.push({ product_id: productId, quantity });
  }

  setLocalCart(cart);
};

export const updateLocalCartItem = (
  productId: string,
  quantity: number,
): void => {
  const cart = getLocalCart();
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product_id === productId,
  );

  if (existingItemIndex >= 0) {
    if (quantity <= 0) {
      cart.items.splice(existingItemIndex, 1);
    } else {
      cart.items[existingItemIndex].quantity = quantity;
    }
    setLocalCart(cart);
  }
};

export const removeFromLocalCart = (productId: string): void => {
  const cart = getLocalCart();
  cart.items = cart.items.filter((item) => item.product_id !== productId);
  setLocalCart(cart);
};
