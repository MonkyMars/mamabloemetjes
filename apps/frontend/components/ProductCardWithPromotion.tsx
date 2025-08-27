'use client';

import React from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { useProductPromotion } from '../hooks/usePromotion';
import { PriceDisplay } from './PromotionBadge';

interface ProductCardWithPromotionProps {
  product: Product;
  className?: string;
  viewMode?: 'grid' | 'list';
}

const ProductCardWithPromotion: React.FC<ProductCardWithPromotionProps> = ({
  product,
  className = '',
  viewMode = 'grid',
}) => {
  const { data: promotion, isLoading, error } = useProductPromotion(product.id);

  // Calculate discounted price if promotion exists
  const discountedPrice = React.useMemo(() => {
    if (!promotion) return null;

    // Apply discount to subtotal, then add tax back
    const discountAmount = product.subtotal * (promotion.discount_percentage / 100);
    const discountedSubtotal = product.subtotal - discountAmount;
    return discountedSubtotal + product.tax;
  }, [promotion, product.subtotal, product.tax]);

  if (isLoading || error) {
    // Fall back to regular ProductCard if promotion loading fails
    return (
      <ProductCard
        product={product}
        className={className}
        viewMode={viewMode}
      />
    );
  }

  // Create enhanced product with promotion awareness
  const enhancedProduct = {
    ...product,
    // Override the price display logic in the component
  };

  return (
    <div className="relative">
      <ProductCard
        product={enhancedProduct}
        className={className}
        viewMode={viewMode}
      />

      {/* Promotion overlay for grid view */}
      {promotion && viewMode === 'grid' && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            {Math.round(promotion.discount_percentage)}% OFF
          </div>
        </div>
      )}

      {/* Price display enhancement */}
      {promotion && discountedPrice && (
        <div className="absolute bottom-[80px] left-6 right-6 z-10">
          <PriceDisplay
            originalPrice={product.price}
            discountedPrice={discountedPrice}
            promotion={promotion}
            className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm"
          />
        </div>
      )}
    </div>
  );
};

export default ProductCardWithPromotion;
