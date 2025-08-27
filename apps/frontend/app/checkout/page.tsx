'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useCart, useGuestCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { CurrencyCalculator, Decimal } from '@/lib/currency';
import api from '@//lib/axios';
import { PriceValidationComponent } from '@/components/PriceValidationComponent';
import {
  PriceValidationItem,
  PriceValidationResponse,
} from '@/types/promotion';
import { useIsClient } from '@/hooks/useIsClient';
import {
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
} from '@/lib/constants';
import {
  FiArrowLeft,
  FiShoppingBag,
  FiCreditCard,
  FiShield,
  FiTruck,
  FiLoader,
  FiCheckCircle,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHome,
} from 'react-icons/fi';
import { Product } from '@/types';
import { getFullName } from '@/lib/auth';
import { ApiResponse } from '@/types/api';

interface BillingInfo {
  firstName: string;
  preposition: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface OrderSummary {
  subtotal: Decimal;
  tax: Decimal;
  shipping: Decimal;
  total: Decimal;
  itemCount: number;
  priceTotal: Decimal;
}

interface AddressValidationResponse {
  is_valid: boolean;
  suggestions: AddressSuggestion[];
  validation_score: number;
}

interface AddressSuggestion {
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  province: string;
  confidence: number;
}

const CheckoutPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const authenticatedCart = useCart();
  const guestCart = useGuestCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const isClient = useIsClient();
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    firstName: user?.first_name || '',
    preposition: user?.preposition || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Nederland',
  });
  const [errors, setErrors] = useState<Partial<BillingInfo>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [addressValidation, setAddressValidation] =
    useState<AddressValidationResponse | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  // Helper function to check if prices are close enough (within 1 cent tolerance)
  const isPriceCloseEnough = useCallback(
    (expected: number, actual: number, tolerance: number = 1): boolean => {
      return Math.abs(expected - actual) <= tolerance;
    },
    [],
  );

  // Use authenticated or guest cart based on auth status
  const cart = isAuthenticated ? authenticatedCart.cart : null;
  const isLoading = isAuthenticated ? authenticatedCart.isLoading : false;
  const error = isAuthenticated ? authenticatedCart.error : null;

  // Load product details for cart items
  useEffect(() => {
    const loadProductDetails = async () => {
      const productIds = new Set<string>();

      // Collect product IDs from authenticated cart
      if (cart?.items) {
        cart.items.forEach((item) => productIds.add(item.product_id));
      }

      // Collect product IDs from guest cart
      if (!isAuthenticated) {
        guestCart.items.forEach((item) => productIds.add(item.product_id));
      }

      // Fetch product details for all unique product IDs
      const productPromises = Array.from(productIds).map(async (productId) => {
        try {
          const response = await api.get<ApiResponse<Product>>(
            `/products/${productId}`,
          );
          return { id: productId, data: response.data.data };
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
  }, [cart, guestCart.items, isAuthenticated]);

  // Pre-fill user data for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      setBillingInfo((prev) => ({
        ...prev,
        firstName: user.first_name || '',
        preposition: user.preposition || '',
        lastName: user.last_name || '',
        email: user.email || '',
      }));
    }
  }, [isAuthenticated, user]);

  const calculateOrderSummary = useCallback((): OrderSummary => {
    if (isAuthenticated && cart?.items) {
      // Check if any cart items have outdated prices compared to current product discounts
      const hasOutdatedPrices = cart.items.some((item) => {
        const product = products[item.product_id];
        if (!product) return false;

        const currentDiscountedPrice =
          product.discounted_price && product.discounted_price < product.price
            ? product.discounted_price
            : product.price;

        const cartItemPrice = CurrencyCalculator.centsToDecimal(
          item.unit_price_cents,
        );
        const currentPrice = CurrencyCalculator.numberToDecimal(
          currentDiscountedPrice,
        );

        return !CurrencyCalculator.isEqual(cartItemPrice, currentPrice);
      });

      // If prices are outdated, calculate with current product prices (including discounts)
      if (hasOutdatedPrices && Object.keys(products).length > 0) {
        let subtotal = new Decimal(0);
        let tax = new Decimal(0);
        let priceTotal = new Decimal(0);
        let itemCount = 0;

        cart.items.forEach((item) => {
          const product = products[item.product_id];
          if (product) {
            const priceToUse =
              product.discounted_price &&
              product.discounted_price < product.price
                ? product.discounted_price
                : product.price;

            // Use Decimal arithmetic for precision (matching backend)
            const priceDecimal = new Decimal(priceToUse);
            const quantityDecimal = new Decimal(item.quantity);

            // Calculate tax and subtotal (tax = price * 0.21, subtotal = price - tax)
            const taxPerItem = priceDecimal.times(TAX_RATE);
            const subtotalPerItem = priceDecimal.minus(taxPerItem);

            const itemSubtotal = subtotalPerItem.times(quantityDecimal);
            const itemTax = taxPerItem.times(quantityDecimal);
            const itemPriceTotal = priceDecimal.times(quantityDecimal);

            subtotal = subtotal.plus(itemSubtotal);
            tax = tax.plus(itemTax);
            priceTotal = priceTotal.plus(itemPriceTotal);
            itemCount += item.quantity;
          }
        });

        // Calculate shipping
        const shipping = CurrencyCalculator.isGreaterThanOrEqual(
          priceTotal,
          new Decimal(FREE_SHIPPING_THRESHOLD),
        )
          ? new Decimal(0)
          : new Decimal(STANDARD_SHIPPING_COST);

        const total = CurrencyCalculator.add(priceTotal, shipping);

        return {
          subtotal,
          tax,
          shipping,
          total,
          itemCount,
          priceTotal,
        };
      }

      // Use backend cart prices if they're current
      return CurrencyCalculator.calculateAuthenticatedCartSummary(cart.items);
    } else if (!isAuthenticated) {
      // Calculate guest cart with discounted prices
      let subtotal = new Decimal(0);
      let tax = new Decimal(0);
      let priceTotal = new Decimal(0);
      let itemCount = 0;

      guestCart.items.forEach((item) => {
        const product = products[item.product_id];
        if (product) {
          const priceToUse =
            product.discounted_price && product.discounted_price < product.price
              ? product.discounted_price
              : product.price;

          // Use Decimal arithmetic for precision (matching backend)
          const priceDecimal = new Decimal(priceToUse);
          const quantityDecimal = new Decimal(item.quantity);

          // Calculate tax and subtotal (tax = price * 0.21, subtotal = price - tax)
          const taxPerItem = priceDecimal.times(TAX_RATE);
          const subtotalPerItem = priceDecimal.minus(taxPerItem);

          const itemSubtotal = subtotalPerItem.times(quantityDecimal);
          const itemTax = taxPerItem.times(quantityDecimal);
          const itemPriceTotal = priceDecimal.times(quantityDecimal);

          subtotal = subtotal.plus(itemSubtotal);
          tax = tax.plus(itemTax);
          priceTotal = priceTotal.plus(itemPriceTotal);
          itemCount += item.quantity;
        }
      });

      // Calculate shipping
      const shipping = CurrencyCalculator.isGreaterThanOrEqual(
        priceTotal,
        new Decimal(FREE_SHIPPING_THRESHOLD),
      )
        ? new Decimal(0)
        : new Decimal(STANDARD_SHIPPING_COST);

      const total = CurrencyCalculator.add(priceTotal, shipping);

      return {
        subtotal,
        tax,
        shipping,
        total,
        itemCount,
        priceTotal,
      };
    }

    // Fallback for empty cart
    return {
      subtotal: new Decimal(0),
      tax: new Decimal(0),
      shipping: new Decimal(0),
      total: new Decimal(0),
      itemCount: 0,
      priceTotal: new Decimal(0),
    };
  }, [isAuthenticated, cart, guestCart.items, products]);

  const validateBillingInfo = (): boolean => {
    const newErrors: Partial<BillingInfo> = {};

    if (!billingInfo.firstName.trim()) {
      newErrors.firstName = 'Voornaam is verplicht';
    }
    if (!billingInfo.lastName.trim()) {
      newErrors.lastName = 'Achternaam is verplicht';
    }
    if (!billingInfo.email.trim()) {
      newErrors.email = 'E-mailadres is verplicht';
    } else if (!/\S+@\S+\.\S+/.test(billingInfo.email)) {
      newErrors.email = 'Ongeldig e-mailadres';
    }
    if (!billingInfo.phone.trim()) {
      newErrors.phone = 'Telefoonnummer is verplicht';
    }
    if (!billingInfo.address.trim()) {
      newErrors.address = 'Adres is verplicht';
    }
    if (!billingInfo.city.trim()) {
      newErrors.city = 'Stad is verplicht';
    }
    if (!billingInfo.postalCode.trim()) {
      newErrors.postalCode = 'Postcode is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof BillingInfo, value: string) => {
    setBillingInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateAddress = async () => {
    if (!billingInfo.address || !billingInfo.postalCode || !billingInfo.city) {
      return;
    }

    setIsValidatingAddress(true);
    try {
      const response = await api.post<ApiResponse<AddressValidationResponse>>(
        '/api/checkout/validate-address',
        {
          street:
            billingInfo.address.split(' ').slice(1).join(' ') ||
            billingInfo.address,
          house_number: billingInfo.address.split(' ')[0] || '1',
          postal_code: billingInfo.postalCode,
          city: billingInfo.city,
          province: 'Noord-Holland', // Should be dynamic
        },
      );

      setAddressValidation(response.data.data);
      setShowAddressSuggestions(response.data.data.suggestions.length > 0);
    } catch (error) {
      console.error('Address validation failed:', error);
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const getAddressSuggestions = async () => {
    if (!billingInfo.postalCode) return;

    try {
      const response = await api.post<
        ApiResponse<{
          house_number: string;
          street: string;
          postal_code: string;
          city: string;
          province: string;
        }>
      >('/api/checkout/address-suggestions', {
        postal_code: billingInfo.postalCode,
        house_number: billingInfo.address.split(' ')[0] || undefined,
      });

      const suggestion = response.data.data;
      setBillingInfo((prev) => ({
        ...prev,
        address: `${suggestion.house_number} ${suggestion.street}`,
        city: suggestion.city,
      }));
    } catch (error) {
      console.error('Failed to get address suggestions:', error);
    }
  };

  const applySuggestion = (suggestion: AddressSuggestion) => {
    setBillingInfo((prev) => ({
      ...prev,
      address: `${suggestion.house_number} ${suggestion.street}`,
      postalCode: suggestion.postal_code,
      city: suggestion.city,
    }));
    setShowAddressSuggestions(false);
    setAddressValidation(null);
  };

  const handlePlaceOrder = async () => {
    if (!validateBillingInfo()) {
      return;
    }

    if (!acceptTerms) {
      alert('Je moet akkoord gaan met de algemene voorwaarden');
      return;
    }

    setIsProcessing(true);
  };

  // State for promotion validation with explicit type annotation
  const [promotionValidation, setPromotionValidation] =
    useState<PriceValidationResponse | null>(null);

  // Validation function to check PriceValidationResponse structure
  const isValidPromotionResponse = useCallback(
    (response: unknown): response is PriceValidationResponse => {
      try {
        if (!response || typeof response !== 'object') return false;
        const typedResponse = response as Record<string, unknown>;

        return (
          typeof typedResponse.is_valid === 'boolean' &&
          Array.isArray(typedResponse.items) &&
          typeof typedResponse.total_original_price_cents === 'number' &&
          typeof typedResponse.total_discounted_price_cents === 'number' &&
          typeof typedResponse.total_discount_amount_cents === 'number' &&
          typeof typedResponse.total_tax_cents === 'number' &&
          typeof typedResponse.total_subtotal_cents === 'number' &&
          typedResponse.items.every((item: unknown) => {
            if (!item || typeof item !== 'object') return false;
            const typedItem = item as Record<string, unknown>;
            return (
              typeof typedItem.product_id === 'string' &&
              typeof typedItem.quantity === 'number' &&
              typeof typedItem.original_unit_price_cents === 'number' &&
              typeof typedItem.discounted_unit_price_cents === 'number' &&
              typeof typedItem.discount_amount_cents === 'number' &&
              typeof typedItem.unit_tax_cents === 'number' &&
              typeof typedItem.unit_subtotal_cents === 'number' &&
              (typedItem.applied_promotion_id === null ||
                typeof typedItem.applied_promotion_id === 'string') &&
              typeof typedItem.is_price_valid === 'boolean'
            );
          })
        );
      } catch (error) {
        console.error('Error validating promotion response:', error);
        return false;
      }
    },
    [],
  );

  // Utility functions for safe promotion checking
  const getPromotedItem = useCallback(
    (productId: string) => {
      if (
        !promotionValidation ||
        !isValidPromotionResponse(promotionValidation)
      ) {
        return null;
      }

      const item = promotionValidation.items.find(
        (validatedItem) =>
          validatedItem.product_id === productId &&
          validatedItem.applied_promotion_id !== null,
      );

      return item || null;
    },
    [promotionValidation, isValidPromotionResponse],
  );

  // Helper to detect if product has discount from product data (before API validation)
  const hasProductDiscount = useCallback(
    (productId: string) => {
      const product = products[productId];
      return !!(
        product?.discounted_price && product.discounted_price < product.price
      );
    },
    [products],
  );

  const hasPromotion = useCallback(
    (productId: string) => {
      const promotedItem = getPromotedItem(productId);
      return promotedItem !== null && promotedItem !== undefined;
    },
    [getPromotedItem],
  );

  // Prepare price validation items for promotion checking
  const priceValidationItems: PriceValidationItem[] = React.useMemo(() => {
    if (!isClient) return [];

    if (isAuthenticated && cart?.items) {
      return cart.items
        .map((item) => {
          const product = products[item.product_id];
          if (product) {
            const priceToUse =
              product.discounted_price &&
              product.discounted_price < product.price
                ? product.discounted_price
                : product.price;
            return {
              product_id: item.product_id,
              quantity: item.quantity,
              expected_unit_price_cents: new Decimal(priceToUse)
                .times(100)
                .round()
                .toNumber(),
            };
          }
          return null;
        })
        .filter(Boolean) as PriceValidationItem[];
    } else if (!isAuthenticated && guestCart.items.length > 0) {
      return guestCart.items
        .map((item) => {
          const product = products[item.product_id];
          if (product) {
            const priceToUse =
              product.discounted_price &&
              product.discounted_price < product.price
                ? product.discounted_price
                : product.price;
            return {
              product_id: item.product_id,
              quantity: item.quantity,
              expected_unit_price_cents: new Decimal(priceToUse)
                .times(100)
                .round()
                .toNumber(),
            };
          }
          return null;
        })
        .filter(Boolean) as PriceValidationItem[];
    }
    return [];
  }, [isClient, isAuthenticated, cart?.items, guestCart.items, products]);

  // State to control when validation should occur
  const [shouldValidate, setShouldValidate] = useState(false);

  // Trigger validation only when cart is stable
  useEffect(() => {
    if (
      isClient &&
      priceValidationItems.length > 0 &&
      !isLoading &&
      !isProcessing
    ) {
      const timer = setTimeout(() => {
        setShouldValidate(true);
      }, 1000); // Wait 1 second after cart becomes stable

      return () => clearTimeout(timer);
    } else {
      setShouldValidate(false);
    }
  }, [isClient, priceValidationItems.length, isLoading, isProcessing]);

  // Enhanced order summary calculation that uses promotion-validated prices when available
  const orderSummary = useMemo(() => {
    // If we have promotion validation data, use the validated totals
    if (
      promotionValidation &&
      promotionValidation.is_valid &&
      isValidPromotionResponse(promotionValidation)
    ) {
      const priceTotalFromValidation = CurrencyCalculator.centsToDecimal(
        promotionValidation.total_discounted_price_cents,
      );

      // Use backend's corrected tax and subtotal values
      const subtotalFromValidation = CurrencyCalculator.centsToDecimal(
        promotionValidation.total_subtotal_cents,
      );
      const taxFromValidation = CurrencyCalculator.centsToDecimal(
        promotionValidation.total_tax_cents,
      );

      // Debug order summary calculations
      console.log('Order summary using validated prices:', {
        total_discounted_price_cents:
          promotionValidation.total_discounted_price_cents,
        total_subtotal_cents: promotionValidation.total_subtotal_cents,
        total_tax_cents: promotionValidation.total_tax_cents,
        priceTotal: CurrencyCalculator.format(priceTotalFromValidation),
        subtotal: CurrencyCalculator.format(subtotalFromValidation),
        tax: CurrencyCalculator.format(taxFromValidation),
      });

      // Calculate shipping (free if order is over threshold)
      const shippingCost = CurrencyCalculator.isGreaterThanOrEqual(
        priceTotalFromValidation,
        new Decimal(FREE_SHIPPING_THRESHOLD),
      )
        ? new Decimal(0)
        : new Decimal(STANDARD_SHIPPING_COST);

      const totalWithShipping = CurrencyCalculator.add(
        priceTotalFromValidation,
        shippingCost,
      );

      const finalSummary = {
        subtotal: subtotalFromValidation,
        tax: taxFromValidation,
        shipping: shippingCost,
        total: totalWithShipping,
        itemCount:
          promotionValidation.items?.reduce(
            (sum, item) => sum + item.quantity,
            0,
          ) || 0,
        priceTotal: priceTotalFromValidation,
      };

      console.log('Final order summary:', {
        subtotal: CurrencyCalculator.format(finalSummary.subtotal),
        tax: CurrencyCalculator.format(finalSummary.tax),
        shipping: CurrencyCalculator.format(finalSummary.shipping),
        total: CurrencyCalculator.format(finalSummary.total),
        priceTotal: CurrencyCalculator.format(finalSummary.priceTotal),
      });

      return finalSummary;
    }

    // Fallback to regular calculation
    return calculateOrderSummary();
  }, [promotionValidation, calculateOrderSummary, isValidPromotionResponse]);
  const hasItems = isAuthenticated
    ? (cart?.items?.length || 0) > 0
    : guestCart.items.length > 0;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <FiLoader className='animate-spin w-5 h-5 text-primary-500' />
          <span>Bestelling laden...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={() => window.location.reload()}>
            Probeer Opnieuw
          </Button>
        </div>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        <div className='container mx-auto px-4 py-8'>
          <div className='max-w-2xl mx-auto text-center'>
            <FiShoppingBag className='w-16 h-16 text-neutral-400 mx-auto mb-6' />
            <h1 className='heading-2 mb-4'>Je winkelwagen is leeg</h1>
            <p className='text-neutral-600 mb-8'>
              Voeg eerst producten toe aan je winkelwagen voordat je kunt
              afrekenen.
            </p>
            <Link href='/shop'>
              <Button leftIcon={<FiArrowLeft />}>Verder Winkelen</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center space-x-4'>
            <Link href='/cart'>
              <Button variant='ghost' size='sm' leftIcon={<FiArrowLeft />}>
                Terug naar Winkelwagen
              </Button>
            </Link>
          </div>
          <h1 className='heading-2'>Afrekenen</h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Billing Information */}
          <div className='lg:col-span-2 space-y-8'>
            {/* User Status */}
            <div className='card p-6'>
              <div className='flex items-center space-x-3 mb-4'>
                <FiUser className='w-5 h-5 text-primary-500' />
                <h2 className='text-xl font-semibold text-neutral-800'>
                  {isAuthenticated ? 'Ingelogd als' : 'Gast Bestelling'}
                </h2>
              </div>
              {isAuthenticated ? (
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <p className='text-green-800'>
                    <strong>{getFullName(user)}</strong>
                    <br />
                    {user?.email}
                  </p>
                </div>
              ) : (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <p className='text-blue-800'>
                    Je rekent af als gast.
                    <Link
                      href='/login'
                      className='ml-1 text-primary-500 hover:underline'
                    >
                      Log in
                    </Link>{' '}
                    voor een snellere checkout.
                  </p>
                </div>
              )}
            </div>

            {/* Billing Information Form */}
            <div className='card p-6'>
              <div className='flex items-center space-x-3 mb-6'>
                <FiMapPin className='w-5 h-5 text-primary-500' />
                <h2 className='text-xl font-semibold text-neutral-800'>
                  Factuurgegevens
                </h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='md:col-span-2'>
                  <Input
                    label='Voornaam'
                    value={billingInfo.firstName}
                    onChange={(e) =>
                      handleInputChange('firstName', e.target.value)
                    }
                    error={errors.firstName}
                    leftIcon={<FiUser />}
                    required
                    disabled={isAuthenticated}
                  />
                </div>
                <div>
                  <Input
                    label='Tussenvoegsel'
                    value={billingInfo.preposition}
                    onChange={(e) =>
                      handleInputChange('preposition', e.target.value)
                    }
                    error={errors.preposition}
                    placeholder='van, de, etc.'
                    disabled={isAuthenticated}
                  />
                </div>
              </div>

              <div className='mt-4'>
                <Input
                  label='Achternaam'
                  value={billingInfo.lastName}
                  onChange={(e) =>
                    handleInputChange('lastName', e.target.value)
                  }
                  error={errors.lastName}
                  required
                  disabled={isAuthenticated}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <Input
                  label='E-mailadres'
                  type='email'
                  value={billingInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  leftIcon={<FiMail />}
                  required
                  disabled={isAuthenticated}
                />
                <Input
                  label='Telefoonnummer'
                  type='tel'
                  value={billingInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={errors.phone}
                  leftIcon={<FiPhone />}
                  required
                />
              </div>

              <div className='mt-4'>
                <Input
                  label='Adres'
                  value={billingInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  onBlur={validateAddress}
                  error={errors.address}
                  leftIcon={<FiHome />}
                  required
                />
                {isValidatingAddress && (
                  <div className='mt-2 flex items-center space-x-2 text-sm text-neutral-600'>
                    <FiLoader className='animate-spin w-4 h-4' />
                    <span>Adres valideren...</span>
                  </div>
                )}
                {addressValidation && !addressValidation.is_valid && (
                  <div className='mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-sm text-yellow-800 mb-2'>
                      Dit adres kon niet gevalideerd worden (betrouwbaarheid:{' '}
                      {Math.round(addressValidation.validation_score * 100)}%)
                    </p>
                    {showAddressSuggestions &&
                      addressValidation.suggestions.length > 0 && (
                        <div>
                          <p className='text-sm text-yellow-800 mb-2'>
                            Voorgestelde adressen:
                          </p>
                          <div className='space-y-2'>
                            {addressValidation.suggestions
                              .slice(0, 3)
                              .map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => applySuggestion(suggestion)}
                                  className='w-full text-left p-2 bg-white border border-yellow-300 rounded hover:bg-yellow-50 transition-colors'
                                >
                                  <div className='text-sm'>
                                    <div className='font-medium'>
                                      {suggestion.house_number}{' '}
                                      {suggestion.street}
                                    </div>
                                    <div className='text-neutral-600'>
                                      {suggestion.postal_code} {suggestion.city}
                                    </div>
                                    <div className='text-xs text-green-600'>
                                      Betrouwbaarheid:{' '}
                                      {Math.round(suggestion.confidence * 100)}%
                                    </div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
                {addressValidation && addressValidation.is_valid && (
                  <div className='mt-2 flex items-center space-x-2 text-sm text-green-600'>
                    <FiCheckCircle className='w-4 h-4' />
                    <span>Adres gevalideerd</span>
                  </div>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <Input
                  label='Stad'
                  value={billingInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  error={errors.city}
                  required
                />
                <Input
                  label='Postcode'
                  value={billingInfo.postalCode}
                  onChange={(e) =>
                    handleInputChange('postalCode', e.target.value)
                  }
                  onBlur={getAddressSuggestions}
                  error={errors.postalCode}
                  required
                  helperText='Formaat: 1234AB'
                />
                <Input
                  label='Land'
                  value={billingInfo.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                  disabled
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className='card p-6'>
              <div className='flex items-center space-x-3 mb-6'>
                <FiCreditCard className='w-5 h-5 text-primary-500' />
                <h2 className='text-xl font-semibold text-neutral-800'>
                  Betaalmethode
                </h2>
              </div>

              <div className='border-2 border-primary-200 rounded-xl p-4 bg-primary-50'>
                <div className='flex items-center space-x-3'>
                  <div className='w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center'>
                    <div className='w-2 h-2 bg-white rounded-full'></div>
                  </div>
                  <div className='flex-1'>
                    <div className='font-semibold text-neutral-800'>iDEAL</div>
                    <div className='text-sm text-neutral-600'>
                      Betaal veilig met je eigen bank
                    </div>
                  </div>
                  <div className='text-2xl font-bold text-primary-600'>
                    iDEAL
                  </div>
                </div>
              </div>

              <div className='mt-4 p-4 bg-neutral-100 rounded-lg'>
                <div className='flex items-center space-x-2 text-sm text-neutral-600'>
                  <FiShield className='w-4 h-4' />
                  <span>
                    Je wordt na het plaatsen van je bestelling doorgestuurd naar
                    je bank voor een veilige betaling.
                  </span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className='card p-6'>
              <label className='flex items-start space-x-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className='mt-1 w-4 h-4 text-primary-500 border-2 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2'
                />
                <span className='text-sm text-neutral-700'>
                  Ik ga akkoord met de{' '}
                  <Link
                    href='/terms'
                    className='text-primary-500 hover:underline'
                  >
                    algemene voorwaarden
                  </Link>{' '}
                  en het{' '}
                  <Link
                    href='/privacy'
                    className='text-primary-500 hover:underline'
                  >
                    privacybeleid
                  </Link>
                  .
                </span>
              </label>
            </div>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='card p-6 sticky top-4'>
              <h2 className='text-xl font-semibold text-neutral-800 mb-6'>
                Bestelling Overzicht
              </h2>

              {/* Price Validation and Promotion Display */}
              {isClient &&
                priceValidationItems.length > 0 &&
                shouldValidate && (
                  <div className='mb-6'>
                    <PriceValidationComponent
                      items={priceValidationItems}
                      autoValidate={true}
                      onValidationError={(error) => {
                        console.error('Price validation error:', error);
                      }}
                      onValidationComplete={(response) => {
                        // Type validation to ensure response matches expected structure
                        if (isValidPromotionResponse(response)) {
                          // Add debugging for price validation
                          console.log('Price validation response:', response);
                          console.log(
                            'Frontend validation items:',
                            priceValidationItems,
                          );

                          // Check if price discrepancies are within tolerance
                          if (!response.is_valid) {
                            const hasTolerableDiscrepancies =
                              response.items.every((item) => {
                                if (item.is_price_valid) return true;

                                // Find corresponding frontend item
                                const frontendItem = priceValidationItems.find(
                                  (frontItem) =>
                                    frontItem.product_id === item.product_id,
                                );

                                if (!frontendItem) {
                                  console.log(
                                    'No frontend item found for product:',
                                    item.product_id,
                                  );
                                  return false;
                                }

                                const difference = Math.abs(
                                  frontendItem.expected_unit_price_cents -
                                    item.discounted_unit_price_cents,
                                );

                                console.log(
                                  `Price comparison for ${item.product_id}:`,
                                  {
                                    frontend_expected:
                                      frontendItem.expected_unit_price_cents,
                                    backend_discounted:
                                      item.discounted_unit_price_cents,
                                    difference: difference,
                                    within_tolerance: difference <= 1,
                                  },
                                );

                                // Check if price difference is within tolerance (1 cent)
                                return isPriceCloseEnough(
                                  frontendItem.expected_unit_price_cents,
                                  item.discounted_unit_price_cents,
                                );
                              });

                            if (hasTolerableDiscrepancies) {
                              console.log(
                                'Price discrepancies are within tolerance, accepting backend prices',
                              );
                              // Accept the backend prices as valid when within tolerance
                              const adjustedResponse = {
                                ...response,
                                is_valid: true,
                                items: response.items.map((item) => ({
                                  ...item,
                                  is_price_valid: true,
                                })),
                              };
                              setPromotionValidation(adjustedResponse);
                            } else {
                              console.log(
                                'Price discrepancies exceed tolerance, showing validation error',
                              );
                              setPromotionValidation(response);
                            }
                          } else {
                            setPromotionValidation(response);
                          }
                        } else {
                          setPromotionValidation(null);
                        }
                      }}
                    />
                  </div>
                )}

              {/* Order Items */}
              <div className='space-y-4 mb-6'>
                {isAuthenticated &&
                  cart?.items.map((item) => {
                    const product = products[item.product_id];
                    if (!product) return null;

                    return (
                      <div
                        key={item.id}
                        className='flex items-center space-x-3'
                      >
                        <div className='relative w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden'>
                          {product.images?.[0].url && (
                            <Image
                              src={product.images?.[0].url}
                              alt={product.name}
                              fill
                              className='object-cover'
                            />
                          )}
                          {/* Promotion Badge */}
                          {(hasPromotion(item.product_id) ||
                            hasProductDiscount(item.product_id)) && (
                            <div className='absolute -top-1 -right-1 bg-red-500 text-white px-1 py-0.5 rounded-full text-xs font-bold'>
                              SALE
                            </div>
                          )}
                        </div>
                        <div className='flex-1'>
                          <div className='font-medium text-neutral-800 line-clamp-1'>
                            {product.name}
                          </div>
                          <div className='text-sm text-neutral-600'>
                            {item.quantity}x{' '}
                            {hasPromotion(item.product_id) ? (
                              <>
                                <span className='text-green-600 font-semibold'>
                                  {CurrencyCalculator.format(
                                    CurrencyCalculator.centsToDecimal(
                                      getPromotedItem(item.product_id)
                                        ?.discounted_unit_price_cents || 0,
                                    ),
                                  )}
                                </span>
                                <span className='line-through text-neutral-400 ml-1'>
                                  {CurrencyCalculator.format(
                                    CurrencyCalculator.centsToDecimal(
                                      item.unit_price_cents,
                                    ),
                                  )}
                                </span>
                              </>
                            ) : hasProductDiscount(item.product_id) ? (
                              <>
                                <span className='text-green-600 font-semibold'>
                                  {CurrencyCalculator.format(
                                    CurrencyCalculator.numberToDecimal(
                                      product.discounted_price!,
                                    ),
                                  )}
                                </span>
                                <span className='line-through text-neutral-400 ml-1'>
                                  {CurrencyCalculator.format(
                                    CurrencyCalculator.numberToDecimal(
                                      product.price,
                                    ),
                                  )}
                                </span>
                              </>
                            ) : (
                              CurrencyCalculator.format(
                                CurrencyCalculator.centsToDecimal(
                                  item.unit_price_cents,
                                ),
                              )
                            )}
                          </div>
                        </div>
                        <div className='font-semibold text-neutral-800'>
                          {hasPromotion(item.product_id) ? (
                            <div className='text-right'>
                              <div className='text-green-600'>
                                {CurrencyCalculator.format(
                                  CurrencyCalculator.multiply(
                                    CurrencyCalculator.centsToDecimal(
                                      getPromotedItem(item.product_id)
                                        ?.discounted_unit_price_cents || 0,
                                    ),
                                    item.quantity,
                                  ),
                                )}
                              </div>
                              <div className='text-xs text-neutral-400 line-through'>
                                {CurrencyCalculator.format(
                                  CurrencyCalculator.multiply(
                                    CurrencyCalculator.centsToDecimal(
                                      item.unit_price_cents,
                                    ),
                                    item.quantity,
                                  ),
                                )}
                              </div>
                            </div>
                          ) : hasProductDiscount(item.product_id) ? (
                            <div className='text-right'>
                              <div className='text-green-600'>
                                {CurrencyCalculator.format(
                                  CurrencyCalculator.multiply(
                                    CurrencyCalculator.numberToDecimal(
                                      product.discounted_price!,
                                    ),
                                    item.quantity,
                                  ),
                                )}
                              </div>
                              <div className='text-xs text-neutral-400 line-through'>
                                {CurrencyCalculator.format(
                                  CurrencyCalculator.multiply(
                                    CurrencyCalculator.numberToDecimal(
                                      product.price,
                                    ),
                                    item.quantity,
                                  ),
                                )}
                              </div>
                            </div>
                          ) : (
                            CurrencyCalculator.format(
                              CurrencyCalculator.multiply(
                                CurrencyCalculator.centsToDecimal(
                                  item.unit_price_cents,
                                ),
                                item.quantity,
                              ),
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}

                {!isAuthenticated &&
                  guestCart.items.map((item) => {
                    const product = products[item.product_id];
                    if (!product) return null;

                    return (
                      <div
                        key={item.product_id}
                        className='flex items-center space-x-3'
                      >
                        <div className='relative w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden'>
                          {product.images?.[0].url && (
                            <Image
                              src={product.images?.[0].url}
                              alt={product.name}
                              fill
                              className='object-cover'
                            />
                          )}
                          {/* Promotion Badge for Guest Cart */}
                          {(hasPromotion(item.product_id) ||
                            hasProductDiscount(item.product_id)) && (
                            <div className='absolute -top-1 -right-1 bg-red-500 text-white px-1 py-0.5 rounded-full text-xs font-bold'>
                              SALE
                            </div>
                          )}
                        </div>
                        <div className='flex-1'>
                          <div className='font-medium text-neutral-800 line-clamp-1'>
                            {product.name}
                          </div>
                          <div className='text-sm text-neutral-600'>
                            {item.quantity}x{' '}
                            {hasPromotion(item.product_id) ? (
                              <>
                                <span className='text-green-600 font-semibold'>
                                  {CurrencyCalculator.format(
                                    CurrencyCalculator.centsToDecimal(
                                      getPromotedItem(item.product_id)
                                        ?.discounted_unit_price_cents || 0,
                                    ),
                                  )}
                                </span>
                                <span className='line-through text-neutral-400 ml-1'>
                                  {CurrencyCalculator.format(
                                    CurrencyCalculator.numberToDecimal(
                                      product.price,
                                    ),
                                  )}
                                </span>
                              </>
                            ) : hasProductDiscount(item.product_id) ? (
                              <>
                                <span className='text-green-600 font-semibold'>
                                  {CurrencyCalculator.format(
                                    CurrencyCalculator.numberToDecimal(
                                      product.discounted_price!,
                                    ),
                                  )}
                                </span>
                                <span className='line-through text-neutral-400 ml-1'>
                                  {CurrencyCalculator.format(
                                    CurrencyCalculator.numberToDecimal(
                                      product.price,
                                    ),
                                  )}
                                </span>
                              </>
                            ) : (
                              CurrencyCalculator.format(
                                CurrencyCalculator.numberToDecimal(
                                  product.price,
                                ),
                              )
                            )}
                          </div>
                        </div>
                        <div className='font-semibold text-neutral-800'>
                          {hasPromotion(item.product_id) ? (
                            <div className='text-right'>
                              <div className='text-green-600'>
                                {CurrencyCalculator.format(
                                  CurrencyCalculator.multiply(
                                    CurrencyCalculator.centsToDecimal(
                                      getPromotedItem(item.product_id)
                                        ?.discounted_unit_price_cents || 0,
                                    ),
                                    item.quantity,
                                  ),
                                )}
                              </div>
                              <div className='text-xs text-neutral-400 line-through'>
                                {CurrencyCalculator.format(
                                  CurrencyCalculator.multiply(
                                    CurrencyCalculator.numberToDecimal(
                                      product.price,
                                    ),
                                    item.quantity,
                                  ),
                                )}
                              </div>
                            </div>
                          ) : hasProductDiscount(item.product_id) ? (
                            <div className='text-right'>
                              <div className='text-green-600'>
                                {CurrencyCalculator.format(
                                  CurrencyCalculator.multiply(
                                    CurrencyCalculator.numberToDecimal(
                                      product.discounted_price!,
                                    ),
                                    item.quantity,
                                  ),
                                )}
                              </div>
                              <div className='text-xs text-neutral-400 line-through'>
                                {CurrencyCalculator.format(
                                  CurrencyCalculator.multiply(
                                    CurrencyCalculator.numberToDecimal(
                                      product.price,
                                    ),
                                    item.quantity,
                                  ),
                                )}
                              </div>
                            </div>
                          ) : (
                            CurrencyCalculator.format(
                              CurrencyCalculator.multiply(
                                CurrencyCalculator.numberToDecimal(
                                  product.price,
                                ),
                                item.quantity,
                              ),
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className='border-t border-neutral-200 pt-4 space-y-3'>
                {/* Subtotal */}
                <div className='flex justify-between text-neutral-700'>
                  <span>Subtotaal ({orderSummary.itemCount} items)</span>
                  <span>
                    {CurrencyCalculator.format(orderSummary.priceTotal)}
                  </span>
                </div>

                {/* Tax */}
                <div className='flex justify-between text-neutral-700 text-sm'>
                  <span>Waarvan BTW (21%)</span>
                  <span>{CurrencyCalculator.format(orderSummary.tax)}</span>
                </div>

                {/* Shipping */}
                <div className='flex justify-between text-neutral-700'>
                  <div className='flex items-center space-x-1'>
                    <FiTruck className='w-4 h-4' />
                    <span>Verzending</span>
                  </div>
                  <span>
                    {CurrencyCalculator.isEqual(
                      orderSummary.shipping,
                      new Decimal(0),
                    ) ? (
                      <span className='text-green-600 font-medium'>Gratis</span>
                    ) : (
                      CurrencyCalculator.format(orderSummary.shipping)
                    )}
                  </span>
                </div>

                {CurrencyCalculator.isEqual(
                  orderSummary.shipping,
                  new Decimal(0),
                ) && (
                  <div className='text-xs text-green-600 bg-green-50 p-2 rounded'>
                    Gratis verzending vanaf €75
                  </div>
                )}
              </div>

              <div className='border-t border-neutral-200 pt-3 mt-3'>
                <div className='flex justify-between font-semibold text-lg text-neutral-800'>
                  <span>Totaal</span>
                  <span>{CurrencyCalculator.format(orderSummary.total)}</span>
                </div>
              </div>

              <Button
                fullWidth
                size='lg'
                onClick={handlePlaceOrder}
                loading={isProcessing}
                disabled={!acceptTerms}
                className='mt-6'
                leftIcon={!isProcessing ? <FiCreditCard /> : undefined}
              >
                {isProcessing
                  ? 'Bestelling Plaatsen...'
                  : 'Bestelling Plaatsen'}
              </Button>

              <div className='mt-4 text-center'>
                <div className='flex items-center justify-center space-x-2 text-sm text-neutral-600'>
                  <FiShield className='w-4 h-4' />
                  <span>Veilig betalen met iDEAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
