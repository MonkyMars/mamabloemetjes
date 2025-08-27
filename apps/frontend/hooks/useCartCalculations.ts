'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCart, useGuestCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { CurrencyCalculator, Decimal } from '@/lib/currency';
import { useIsClient } from '@/hooks/useIsClient';
import { Product } from '@/types';
import {
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
} from '@/lib/constants';
import api from '@/lib/axios';
import { ApiResponse } from '@/types/api';

interface CartItem {
  product_id: string;
  quantity: number;
}

interface CartSummary {
  subtotal: Decimal;
  tax: Decimal;
  shipping: Decimal;
  total: Decimal;
  itemCount: number;
  priceTotal: Decimal;
  hasDiscounts: boolean;
  originalTotal: Decimal;
  totalSavings: Decimal;
}

export const useCartCalculations = () => {
  const { isAuthenticated } = useAuth();
  const authenticatedCart = useCart();
  const guestCart = useGuestCart();
  const isClient = useIsClient();
  const [products, setProducts] = useState<Record<string, Product>>({});

  // Get cart items based on authentication status
  const cartItems: CartItem[] = useMemo(() => {
    if (!isClient) return [];

    if (isAuthenticated && authenticatedCart.cart?.items) {
      return authenticatedCart.cart.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));
    } else if (!isAuthenticated) {
      return guestCart.items;
    }

    return [];
  }, [
    isClient,
    isAuthenticated,
    authenticatedCart.cart?.items,
    guestCart.items,
  ]);

  // Load product details for cart items
  useEffect(() => {
    const loadProductDetails = async () => {
      if (cartItems.length === 0) {
        setProducts({});
        return;
      }

      const productIds = Array.from(
        new Set(cartItems.map((item) => item.product_id)),
      );

      const productPromises = productIds.map(async (productId) => {
        try {
          const response = await api.get<ApiResponse<Product>>(
            `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`,
          );
          if (response.data.success) {
            return { id: productId, data: response.data.data };
          }
        } catch (error) {
          console.error(`Failed to load product ${productId}:`, error);
        }
        return null;
      });

      const productResults = await Promise.all(productPromises);
      const productMap: Record<string, Product> = {};

      productResults.forEach((result) => {
        if (result) {
          productMap[result.id] = result.data;
        }
      });

      setProducts(productMap);
    };

    loadProductDetails();
  }, [cartItems]);

  // Calculate cart summary
  const cartSummary: CartSummary = useMemo(() => {
    if (!isClient || cartItems.length === 0) {
      return {
        subtotal: new Decimal(0),
        tax: new Decimal(0),
        shipping: new Decimal(0),
        total: new Decimal(0),
        itemCount: 0,
        priceTotal: new Decimal(0),
        hasDiscounts: false,
        originalTotal: new Decimal(0),
        totalSavings: new Decimal(0),
      };
    }

    let originalSubtotal = new Decimal(0);
    let discountedSubtotal = new Decimal(0);
    let hasDiscounts = false;
    let itemCount = 0;

    // Calculate totals using product prices directly
    // Product prices are tax-INCLUSIVE, so we need to extract subtotal
    cartItems.forEach((item) => {
      const product = products[item.product_id];
      if (product) {
        // Prices are tax-inclusive, so extract subtotal (tax-exclusive amount)
        const originalPriceTaxInclusive = new Decimal(product.price);
        const discountedPriceTaxInclusive = new Decimal(
          product.discounted_price || product.price,
        );

        // Calculate subtotal (tax-exclusive) from tax-inclusive price
        const originalSubtotalPerItem = CurrencyCalculator.divide(
          originalPriceTaxInclusive,
          new Decimal(1 + TAX_RATE),
        );
        const discountedSubtotalPerItem = CurrencyCalculator.divide(
          discountedPriceTaxInclusive,
          new Decimal(1 + TAX_RATE),
        );

        const originalItemSubtotal = CurrencyCalculator.multiply(
          originalSubtotalPerItem,
          item.quantity,
        );
        const discountedItemSubtotal = CurrencyCalculator.multiply(
          discountedSubtotalPerItem,
          item.quantity,
        );

        originalSubtotal = CurrencyCalculator.add(
          originalSubtotal,
          originalItemSubtotal,
        );
        discountedSubtotal = CurrencyCalculator.add(
          discountedSubtotal,
          discountedItemSubtotal,
        );

        itemCount += item.quantity;

        if (
          product.discounted_price &&
          product.discounted_price < product.price
        ) {
          hasDiscounts = true;
        }
      }
    });

    // Calculate tax on discounted subtotal
    const tax = CurrencyCalculator.multiply(discountedSubtotal, TAX_RATE);

    // Price total = discounted subtotal + tax
    const priceTotal = CurrencyCalculator.add(discountedSubtotal, tax);

    // Calculate shipping (free if over threshold)
    const shippingThreshold = new Decimal(FREE_SHIPPING_THRESHOLD);
    const shipping = CurrencyCalculator.isGreaterThanOrEqual(
      priceTotal,
      shippingThreshold,
    )
      ? new Decimal(0)
      : new Decimal(STANDARD_SHIPPING_COST);

    // Final total = price total + shipping
    const total = CurrencyCalculator.add(priceTotal, shipping);

    // Calculate original total and savings
    const originalTax = CurrencyCalculator.multiply(originalSubtotal, TAX_RATE);
    const originalTotal = CurrencyCalculator.add(originalSubtotal, originalTax);
    const totalSavings = CurrencyCalculator.subtract(originalTotal, priceTotal);

    return {
      subtotal: discountedSubtotal,
      tax,
      shipping,
      total,
      itemCount,
      priceTotal,
      hasDiscounts,
      originalTotal,
      totalSavings,
    };
  }, [isClient, cartItems, products]);

  // Helper function to check if a product has promotion
  const hasPromotion = (productId: string): boolean => {
    const product = products[productId];
    return !!(
      product?.discounted_price && product.discounted_price < product.price
    );
  };

  // Helper function to get discounted price (tax-inclusive)
  const getDiscountedPrice = (productId: string): Decimal | null => {
    const product = products[productId];
    if (product?.discounted_price && product.discounted_price < product.price) {
      return new Decimal(product.discounted_price);
    }
    return null;
  };

  // Helper function to get original price (tax-inclusive)
  const getOriginalPrice = (productId: string): Decimal | null => {
    const product = products[productId];
    return product ? new Decimal(product.price) : null;
  };

  // Helper function to get discounted subtotal (tax-exclusive)
  const getDiscountedSubtotal = (productId: string): Decimal | null => {
    const discountedPrice = getDiscountedPrice(productId);
    if (discountedPrice) {
      return CurrencyCalculator.divide(
        discountedPrice,
        new Decimal(1 + TAX_RATE),
      );
    }
    return null;
  };

  // Helper function to get original subtotal (tax-exclusive)
  const getOriginalSubtotal = (productId: string): Decimal | null => {
    const originalPrice = getOriginalPrice(productId);
    if (originalPrice) {
      return CurrencyCalculator.divide(
        originalPrice,
        new Decimal(1 + TAX_RATE),
      );
    }
    return null;
  };

  return {
    cartSummary,
    products,
    cartItems,
    hasPromotion,
    getDiscountedPrice,
    getOriginalPrice,
    getDiscountedSubtotal,
    getOriginalSubtotal,
    isLoading:
      !isClient || (cartItems.length > 0 && Object.keys(products).length === 0),
  };
};
