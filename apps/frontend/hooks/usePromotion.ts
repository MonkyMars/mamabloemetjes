'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PromotionAPI } from '../lib/promotion';
import type {
  PriceValidationRequest,
  PriceValidationResponse,
  DiscountPromotionWithProducts,
  PriceValidationItem,
} from '../types/promotion';

export const usePromotion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePrices = useCallback(
    async (items: PriceValidationItem[]): Promise<PriceValidationResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const request: PriceValidationRequest = { items };
        const response = await PromotionAPI.validatePrices(request);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Prijsvalidatie mislukt';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getProductPromotion = useCallback(
    async (
      productId: string,
    ): Promise<DiscountPromotionWithProducts | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const promotion = await PromotionAPI.getProductPromotion(productId);
        return promotion;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Kan productpromotie niet ophalen';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    validatePrices,
    getProductPromotion,
    isLoading,
    error,
  };
};

/**
 * Hook to get promotion for a specific product using React Query
 */
export const useProductPromotion = (productId: string | null) => {
  return useQuery({
    queryKey: ['promotion', productId],
    queryFn: () =>
      productId ? PromotionAPI.getProductPromotion(productId) : null,
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to validate cart prices with current promotions
 */
export const usePriceValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateCartPrices = useCallback(
    async (items: PriceValidationItem[]): Promise<PriceValidationResponse> => {
      if (items.length === 0) {
        throw new Error('Geen artikelen om te valideren');
      }

      setIsValidating(true);
      setValidationError(null);

      try {
        const request: PriceValidationRequest = { items };
        const response = await PromotionAPI.validatePrices(request);

        if (!response.is_valid && response.items) {
          const invalidItems = response.items.filter(
            (item) => !item.is_price_valid,
          );
          if (invalidItems.length > 0) {
            setValidationError(
              `Prijsvalidatie mislukt voor ${invalidItems.length} artikel(en). Ververs de pagina en probeer opnieuw.`,
            );
          }
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Prijsvalidatie mislukt';
        setValidationError(errorMessage);
        throw err;
      } finally {
        setIsValidating(false);
      }
    },
    [],
  );

  return {
    validateCartPrices,
    isValidating,
    validationError,
    clearValidationError: () => setValidationError(null),
  };
};
