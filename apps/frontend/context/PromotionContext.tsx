'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { PromotionAPI } from '@/lib/promotion';
import type {
  PriceValidationRequest,
  PriceValidationResponse,
  DiscountPromotionWithProducts,
  PriceValidationItem,
  PromotionContextType,
} from '../types/promotion';

const PromotionContext = createContext<PromotionContextType | undefined>(
  undefined,
);

export const PromotionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePrices = useCallback(
    async (items: PriceValidationItem[]): Promise<PriceValidationResponse> => {
      if (items.length === 0) {
        throw new Error('No items to validate');
      }

      setIsLoading(true);
      setError(null);

      try {
        const request: PriceValidationRequest = { items };
        const response = await PromotionAPI.validatePrices(request);

        if (!response.is_valid && response.items) {
          const invalidItems = response.items.filter(
            (item) => !item.is_price_valid,
          );
          if (invalidItems.length > 0) {
            setError(
              `Price validation failed for ${invalidItems.length} item(s). Please refresh your cart.`,
            );
          }
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Price validation failed';
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
            : 'Failed to get product promotion';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const value: PromotionContextType = {
    validatePrices,
    getProductPromotion,
    isLoading,
    error,
  };

  return (
    <PromotionContext.Provider value={value}>
      {children}
    </PromotionContext.Provider>
  );
};

export const usePromotionContext = (): PromotionContextType => {
  const context = useContext(PromotionContext);
  if (context === undefined) {
    throw new Error(
      'usePromotionContext must be used within a PromotionProvider',
    );
  }
  return context;
};

export default PromotionContext;
