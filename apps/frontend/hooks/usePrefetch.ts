'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePrefetchProduct } from './useProducts';

interface UsePrefetchOptions {
  prefetchDelay?: number;
  prefetchOnHover?: boolean;
  prefetchOnVisible?: boolean;
}

export const usePrefetch = (options: UsePrefetchOptions = {}) => {
  const { prefetchDelay = 300, prefetchOnHover = true, prefetchOnVisible = false } = options;
  const router = useRouter();
  const prefetchProduct = usePrefetchProduct();

  const prefetchPage = useCallback(
    (href: string) => {
      // Prefetch the page route
      router.prefetch(href);
    },
    [router]
  );

  const prefetchProductData = useCallback(
    (productId: string) => {
      // Prefetch the product data
      prefetchProduct(productId);
    },
    [prefetchProduct]
  );

  const handleMouseEnter = useCallback(
    (href: string, productId?: string) => {
      if (!prefetchOnHover) return;

      const timeoutId = setTimeout(() => {
        prefetchPage(href);
        if (productId) {
          prefetchProductData(productId);
        }
      }, prefetchDelay);

      return () => clearTimeout(timeoutId);
    },
    [prefetchOnHover, prefetchDelay, prefetchPage, prefetchProductData]
  );

  const handleIntersection = useCallback(
    (href: string, productId?: string) => {
      if (!prefetchOnVisible) return;

      prefetchPage(href);
      if (productId) {
        prefetchProductData(productId);
      }
    },
    [prefetchOnVisible, prefetchPage, prefetchProductData]
  );

  return {
    prefetchPage,
    prefetchProductData,
    handleMouseEnter,
    handleIntersection,
  };
};

export default usePrefetch;
