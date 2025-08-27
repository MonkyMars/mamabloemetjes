'use client';

import React from 'react';
import {
  DiscountPromotionWithProducts,
  formatDiscountText,
} from '@/types/promotion';

interface PromotionBadgeProps {
  promotion: DiscountPromotionWithProducts;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PromotionBadge: React.FC<PromotionBadgeProps> = ({
  promotion,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-semibold bg-red-500 text-white shadow-sm ${sizeClasses[size]} ${className}`}
    >
      <span className='mr-1'>🏷️</span>
      {formatDiscountText(promotion.discount_type, promotion.discount_value)}
    </div>
  );
};

interface PriceDisplayProps {
  originalPrice: number;
  discountedPrice?: number;
  promotion?: DiscountPromotionWithProducts | null;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  originalPrice,
  discountedPrice,
  promotion,
  currency = 'EUR',
  className = '',
  size = 'md',
  showBadge = true,
  layout = 'horizontal',
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const hasDiscount =
    promotion && discountedPrice && discountedPrice < originalPrice;

  const sizeClasses = {
    sm: {
      discountedPrice: 'text-base font-bold',
      originalPrice: 'text-sm',
      savings: 'text-xs',
    },
    md: {
      discountedPrice: 'text-lg font-bold',
      originalPrice: 'text-sm',
      savings: 'text-sm',
    },
    lg: {
      discountedPrice: 'text-xl font-bold',
      originalPrice: 'text-base',
      savings: 'text-base',
    },
  };

  if (!hasDiscount) {
    return (
      <div className={`${className}`}>
        <span className={`${sizeClasses[size].discountedPrice} text-[#2d2820]`}>
          {formatPrice(originalPrice)}
        </span>
      </div>
    );
  }

  const savings = originalPrice - discountedPrice;

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className='flex items-center gap-2'>
          <span
            className={`${sizeClasses[size].discountedPrice} text-green-600`}
          >
            {formatPrice(discountedPrice)}
          </span>
          {showBadge && promotion && (
            <PromotionBadge
              promotion={promotion}
              size={size === 'lg' ? 'md' : 'sm'}
            />
          )}
        </div>
        <div className='flex items-center gap-2'>
          <span
            className={`${sizeClasses[size].originalPrice} text-gray-500 line-through`}
          >
            {formatPrice(originalPrice)}
          </span>
          <span
            className={`${sizeClasses[size].savings} text-green-600 font-medium`}
          >
            Bespaar €{savings.toFixed(2)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className={`${sizeClasses[size].discountedPrice} text-green-600`}>
        {formatPrice(discountedPrice)}
      </span>
      <span
        className={`${sizeClasses[size].originalPrice} text-gray-500 line-through`}
      >
        {formatPrice(originalPrice)}
      </span>
      {showBadge && promotion && (
        <PromotionBadge
          promotion={promotion}
          size={size === 'lg' ? 'md' : 'sm'}
        />
      )}
    </div>
  );
};

interface CompactPriceDisplayProps {
  originalPrice: number;
  discountedPrice?: number;
  promotion?: DiscountPromotionWithProducts | null;
  currency?: string;
  className?: string;
}

export const CompactPriceDisplay: React.FC<CompactPriceDisplayProps> = ({
  originalPrice,
  discountedPrice,
  promotion,
  currency = 'EUR',
  className = '',
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const hasDiscount =
    promotion && discountedPrice && discountedPrice < originalPrice;

  if (!hasDiscount) {
    return (
      <span className={`text-lg font-medium text-[#2d2820] ${className}`}>
        {formatPrice(originalPrice)}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className='text-lg font-bold text-green-600'>
        {formatPrice(discountedPrice)}
      </span>
      <span className='text-sm text-gray-500 line-through'>
        {formatPrice(originalPrice)}
      </span>
    </div>
  );
};
