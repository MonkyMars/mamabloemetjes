import api from './axios';
import axios from 'axios';
import type {
  PriceValidationRequest,
  PriceValidationResponse,
  DiscountPromotionWithProducts,
} from '../types/promotion';
import { ApiResponse } from '@/types/api';

export class PromotionAPI {
  /**
   * Validate prices with current promotions
   * Available for both authenticated and guest users
   */
  static async validatePrices(
    request: PriceValidationRequest,
  ): Promise<PriceValidationResponse> {
    const response = await api.post<ApiResponse<PriceValidationResponse>>(
      '/promotions/validate-price',
      request,
    );
    return response.data.data;
  }

  /**
   * Get active promotion for a specific product
   * Public endpoint
   */
  static async getProductPromotion(
    productId: string,
  ): Promise<DiscountPromotionWithProducts | null> {
    try {
      const response = await api.get<
        ApiResponse<DiscountPromotionWithProducts | null>
      >(`/promotions/product/${productId}`);
      return response.data.data;
    } catch (error) {
      // If no promotion found, return null instead of throwing error
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all active promotions
   * Public endpoint
   */
  static async getAllActivePromotions(): Promise<
    DiscountPromotionWithProducts[]
  > {
    const response =
      await api.get<ApiResponse<DiscountPromotionWithProducts[]>>(
        '/promotions/active',
      );
    return response.data.data;
  }

  /**
   * Get active promotions for specific products
   * Public endpoint
   */
  static async getActivePromotionsForProducts(
    productIds: string[],
  ): Promise<DiscountPromotionWithProducts[]> {
    const response = await api.post<
      ApiResponse<DiscountPromotionWithProducts[]>
    >('/promotions/products', { product_ids: productIds });
    return response.data.data;
  }
}
