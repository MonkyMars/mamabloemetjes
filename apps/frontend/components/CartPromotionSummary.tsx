'use client';

import React from 'react';
import { PriceValidationResponse } from '@/types/promotion';
import { PriceUtils } from '@/lib/priceUtils';

interface CartPromotionSummaryProps {
  validationResponse: PriceValidationResponse;
  currency?: string;
  className?: string;
}

export const CartPromotionSummary: React.FC<CartPromotionSummaryProps> = ({
  validationResponse,
  currency = 'EUR',
  className = '',
}) => {
  const hasDiscounts = validationResponse.total_discount_amount_cents > 0;

  if (!hasDiscounts) {
    return null;
  }

  const originalTotal = PriceUtils.formatCents(
    validationResponse.total_original_price_cents,
    currency,
  );
  const discountedTotal = PriceUtils.formatCents(
    validationResponse.total_discounted_price_cents,
    currency,
  );
  const totalSavings = PriceUtils.formatCents(
    validationResponse.total_discount_amount_cents,
    currency,
  );

  const discountedItems = validationResponse.items.filter(
    (item) => item.applied_promotion_id !== null,
  );

  // Don't show promotion summary to keep it minimal
  return null;
};

interface PriceValidationWarningProps {
  validationResponse: PriceValidationResponse;
  onRefresh?: () => void;
  className?: string;
}

export const PriceValidationWarning: React.FC<PriceValidationWarningProps> = ({
  validationResponse,
  onRefresh,
  className = '',
}) => {
  if (validationResponse.is_valid) {
    return null;
  }

  const invalidItems = validationResponse.items.filter(
    (item) => !item.is_price_valid,
  );

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 ${className}`}
    >
      <div className='flex items-center mb-2'>
        <span className='text-red-600 mr-2'>⚠️</span>
        <h3 className='font-semibold text-red-800 text-sm sm:text-base'>
          Prijsvalidatie Mislukt
        </h3>
      </div>

      <p className='text-xs sm:text-sm text-red-700 mb-3'>
        {invalidItems.length} artikel(en) hebben prijsverschillen. Ververs je
        winkelwagen om de nieuwste prijzen te krijgen.
      </p>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className='px-3 sm:px-4 py-2 bg-red-600 text-white text-xs sm:text-sm rounded hover:bg-red-700 transition-colors w-full sm:w-auto'
        >
          Winkelwagen Verversen
        </button>
      )}
    </div>
  );
};
