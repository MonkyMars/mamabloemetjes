'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cart } from '@/types';
import * as productsApi from '@/data/products';

// Query Keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: unknown) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  featured: (limit?: number) =>
    [...productKeys.all, 'featured', limit] as const,
  search: (query: string) => [...productKeys.all, 'search', query] as const,
};

// Products Hooks
export const useProducts = () => {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: productsApi.getProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useFeaturedProducts = (limit: number = 8) => {
  return useQuery({
    queryKey: productKeys.featured(limit),
    queryFn: () => productsApi.getFeaturedProducts(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes for featured products
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSearchProducts = (query: string) => {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: () => productsApi.searchProducts(query),
    enabled: !!query && query.length > 0,
    staleTime: 1000 * 30, // 30 seconds for search results
    gcTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Cart Query Keys
export const cartKeys = {
  all: ['cart'] as const,
  details: () => [...cartKeys.all, 'detail'] as const,
  detail: () => [...cartKeys.details()] as const,
};

// Cart Hooks
export const useCartQuery = () => {
  return useQuery({
    queryKey: cartKeys.detail(),
    queryFn: productsApi.getCart,
    staleTime: 1000 * 10, // 10 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => productsApi.addToCart(productId, quantity),
    onSuccess: (data: Cart) => {
      // Update the cart cache with the new data
      queryClient.setQueryData(cartKeys.detail(), data);

      // Invalidate and refetch cart to ensure consistency
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (error) => {
      console.error('Failed to add to cart:', error);
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => productsApi.updateCartItem(productId, quantity),
    onSuccess: (data: Cart) => {
      queryClient.setQueryData(cartKeys.detail(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (error) => {
      console.error('Failed to update cart item:', error);
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => productsApi.removeFromCart(productId),
    onSuccess: (data: Cart) => {
      queryClient.setQueryData(cartKeys.detail(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (error) => {
      console.error('Failed to remove from cart:', error);
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.clearCart,
    onSuccess: () => {
      // Clear the cart cache
      queryClient.removeQueries({ queryKey: cartKeys.all });
      // Set empty cart data
      queryClient.setQueryData(cartKeys.detail(), null);
    },
    onError: (error) => {
      console.error('Failed to clear cart:', error);
    },
  });
};

// Utility hooks for optimistic updates
export const useOptimisticCartUpdate = () => {
  const queryClient = useQueryClient();

  const optimisticallyUpdateCart = (
    updater: (oldCart: Cart | undefined) => Cart,
  ) => {
    queryClient.setQueryData(cartKeys.detail(), updater);
  };

  return { optimisticallyUpdateCart };
};

// Prefetch hooks for performance
export const usePrefetchProduct = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(id),
      queryFn: () => productsApi.getProductById(id),
      staleTime: 1000 * 60 * 5,
    });
  };
};

export const usePrefetchProducts = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: productKeys.lists(),
      queryFn: productsApi.getProducts,
      staleTime: 1000 * 60 * 5,
    });
  };
};
