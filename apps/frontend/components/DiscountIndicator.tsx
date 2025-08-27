'use client';

import React from 'react';
import { DiscountPromotionWithProducts } from '@/types/promotion';
import { cn } from '@/lib/utils';
import { buttonVariants } from './Button';

interface DiscountIndicatorProps {
  originalPrice: number;
  discountedPrice: number;
  promotion?: DiscountPromotionWithProducts | null;
  className?: string;
  promotionType?: 'percentage' | 'fixed_amount';
}

export const DiscountIndicator: React.FC<DiscountIndicatorProps> = ({
  originalPrice,
  discountedPrice,
  promotion,
  className = '',
}) => {
  if (!promotion || discountedPrice >= originalPrice) {
    return null;
  }

  const savings = originalPrice - discountedPrice;
  return (
    <div
      className={cn(
        buttonVariants({ variant: 'primary', size: 'xs' }),
        className,
        'px-2 py-1 text-md font-semibold',
      )}
    >
      Bespaar €{savings.toFixed(2)}
    </div>
  );
};
