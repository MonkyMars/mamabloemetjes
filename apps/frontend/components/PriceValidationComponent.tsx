'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePriceValidation } from '@/hooks/usePromotion';
import { PriceValidationWarning } from './CartPromotionSummary';
import {
  PriceValidationItem,
  PriceValidationResponse,
} from '../types/promotion';

interface PriceValidationComponentProps {
  items: Array<{
    product_id: string;
    quantity: number;
    expected_unit_price_cents: number;
  }>;
  onValidationError?: (error: string) => void;
  onValidationComplete?: (response: PriceValidationResponse | null) => void;
  autoValidate?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const PriceValidationComponent: React.FC<
  PriceValidationComponentProps
> = ({
  items,
  onValidationError,
  onValidationComplete,
  autoValidate = true,
  children,
  className = '',
}) => {
  const {
    validateCartPrices,
    isValidating,
    validationError,
    clearValidationError,
  } = usePriceValidation();
  const [validationResponse, setValidationResponse] =
    useState<PriceValidationResponse | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidationItemsRef = useRef<string>('');
  const isRequestInFlightRef = useRef<boolean>(false);

  // Create a stable key from items to detect actual changes
  const createItemsKey = useCallback(
    (
      items: Array<{
        product_id: string;
        quantity: number;
        expected_unit_price_cents: number;
      }>,
    ) => {
      return JSON.stringify(
        items
          .map((item) => ({
            id: item.product_id,
            qty: item.quantity,
            price: item.expected_unit_price_cents,
          }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      );
    },
    [],
  );

  const performValidation = useCallback(
    async (
      itemsToValidate: Array<{
        product_id: string;
        quantity: number;
        expected_unit_price_cents: number;
      }>,
    ) => {
      if (itemsToValidate.length === 0) return;

      // Check if this validation is for the same items as the last one
      const currentItemsKey = createItemsKey(itemsToValidate);
      if (
        currentItemsKey === lastValidationItemsRef.current ||
        isRequestInFlightRef.current
      ) {
        return; // Skip duplicate validation or if request is already in flight
      }

      isRequestInFlightRef.current = true;

      try {
        clearValidationError();
        const validationItems: PriceValidationItem[] = itemsToValidate.map(
          (item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            expected_unit_price_cents: item.expected_unit_price_cents,
          }),
        );

        const response = await validateCartPrices(validationItems);
        setValidationResponse(response);
        lastValidationItemsRef.current = currentItemsKey;

        // Notify parent component of validation completion
        if (onValidationComplete) {
          onValidationComplete(response);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Validation failed';
        if (onValidationError) {
          onValidationError(errorMessage);
        }

        // Notify parent component that validation failed
        if (onValidationComplete) {
          onValidationComplete(null);
        }
      } finally {
        isRequestInFlightRef.current = false;
      }
    },
    [
      validateCartPrices,
      clearValidationError,
      onValidationError,
      onValidationComplete,
      createItemsKey,
    ],
  );

  const debouncedValidation = useCallback(
    (
      itemsToValidate: Array<{
        product_id: string;
        quantity: number;
        expected_unit_price_cents: number;
      }>,
    ) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      setIsDebouncing(true);

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        setIsDebouncing(false);
        performValidation(itemsToValidate);
      }, 1500); // 1.5s debounce delay to reduce API calls
    },
    [performValidation],
  );

  // Auto-validate when items change (with debouncing)
  useEffect(() => {
    if (autoValidate && items.length > 0) {
      debouncedValidation(items);
    } else if (items.length === 0) {
      // Clear validation when no items
      setValidationResponse(null);
      if (onValidationComplete) {
        onValidationComplete(null);
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [autoValidate, items, debouncedValidation, onValidationComplete]);

  const handleRefresh = () => {
    // Reset the last validation key to force a fresh validation
    lastValidationItemsRef.current = '';
    performValidation(items);
  };

  if (items.length === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {/* Only show validation errors - never during normal operation */}
      {validationError && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <span className='text-red-600 mr-2'>⚠️</span>
              <span className='text-red-800 font-semibold text-sm sm:text-base'>
                Prijsfout
              </span>
            </div>
            <button
              onClick={clearValidationError}
              className='text-red-600 hover:text-red-800 p-1'
            >
              ×
            </button>
          </div>
          <p className='text-xs sm:text-sm text-red-700 mt-2'>
            {validationError}
          </p>
          <button
            onClick={handleRefresh}
            className='mt-3 px-3 sm:px-4 py-2 bg-red-600 text-white text-xs sm:text-sm rounded hover:bg-red-700 transition-colors w-full sm:w-auto'
          >
            Opnieuw Proberen
          </button>
        </div>
      )}

      {/* Only show price validation warning if invalid and not during validation/loading */}
      {validationResponse &&
        !validationResponse.is_valid &&
        !isValidating &&
        !isDebouncing && (
          <PriceValidationWarning
            validationResponse={validationResponse}
            onRefresh={handleRefresh}
            className='mb-4'
          />
        )}

      {children}
    </div>
  );
};
