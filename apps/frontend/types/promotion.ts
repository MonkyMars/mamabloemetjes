export interface DiscountPromotion {
  id: string;
  created_at: string;
  updated_at: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  start_date: string;
  end_date: string;
}

export interface DiscountPromotionProduct {
  discount_id: string;
  product_id: string;
}

export interface DiscountPromotionWithProducts {
  id: string;
  created_at: string;
  updated_at: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  start_date: string;
  end_date: string;
  product_ids: string[];
}

export interface PriceValidationItem {
  product_id: string;
  quantity: number;
  expected_unit_price_cents: number;
}

export interface PriceValidationRequest {
  items: PriceValidationItem[];
}

export interface ValidatedPriceItem {
  product_id: string;
  quantity: number;
  original_unit_price_cents: number;
  discounted_unit_price_cents: number;
  discount_amount_cents: number;
  unit_tax_cents: number;
  unit_subtotal_cents: number;
  applied_promotion_id: string | null;
  is_price_valid: boolean;
}

export interface PriceValidationResponse {
  is_valid: boolean;
  items: ValidatedPriceItem[];
  total_original_price_cents: number;
  total_discounted_price_cents: number;
  total_discount_amount_cents: number;
  total_tax_cents: number;
  total_subtotal_cents: number;
}

export interface PromotionContextType {
  validatePrices: (
    items: PriceValidationItem[],
  ) => Promise<PriceValidationResponse>;
  getProductPromotion: (
    productId: string,
  ) => Promise<DiscountPromotionWithProducts | null>;
  isLoading: boolean;
  error: string | null;
}

// Helper function to check if promotion is currently active
export const isPromotionActive = (promotion: DiscountPromotion): boolean => {
  const now = new Date();
  const startDate = new Date(promotion.start_date);
  const endDate = new Date(promotion.end_date);
  return now >= startDate && now <= endDate;
};

// Helper function to calculate discounted price
export const calculateDiscountedPrice = (
  originalPrice: number,
  discountType: 'percentage' | 'fixed_amount',
  discountValue: number,
): number => {
  if (discountType === 'percentage') {
    const discountAmount = originalPrice * (discountValue / 100);
    return originalPrice - discountAmount;
  } else {
    const discounted = originalPrice - discountValue;
    return Math.max(0, discounted); // Don't allow negative prices
  }
};

// Helper function to calculate discount amount
export const calculateDiscountAmount = (
  originalPrice: number,
  discountType: 'percentage' | 'fixed_amount',
  discountValue: number,
): number => {
  if (discountType === 'percentage') {
    return originalPrice * (discountValue / 100);
  } else {
    return Math.min(discountValue, originalPrice); // Don't discount more than the price
  }
};

// Helper function to format discount display text
export const formatDiscountText = (
  discountType: 'percentage' | 'fixed_amount',
  discountValue: number,
): string => {
  if (discountType === 'percentage') {
    return `${Math.round(discountValue)}% korting`;
  } else {
    return `€${discountValue} korting`;
  }
};
