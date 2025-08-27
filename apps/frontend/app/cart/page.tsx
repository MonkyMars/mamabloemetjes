'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { useCart, useGuestCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { CurrencyCalculator, Decimal } from '@/lib/currency';
import { useCartCalculations } from '@/hooks/useCartCalculations';
import { useIsClient } from '@/hooks/useIsClient';
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
  TAX_RATE,
} from '@/lib/constants';
import { PriceValidationComponent } from '@/components/PriceValidationComponent';
import { PriceValidationItem } from '@/types/promotion';

import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShoppingBag,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiTruck,
  FiRotateCcw,
  FiLoader,
} from 'react-icons/fi';
import CartHeader from '@/components/CartHeader';

const CartPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const authenticatedCart = useCart();
  const guestCart = useGuestCart();
  const { showStockError } = useNotification();
  const [localQuantities, setLocalQuantities] = useState<
    Record<string, number>
  >({});
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());

  const {
    cartSummary: originalCartSummary,
    products,
    cartItems,
    hasPromotion,
    getDiscountedPrice,
    getOriginalPrice,
    isLoading: isCartLoading,
  } = useCartCalculations();
  const isClient = useIsClient();

  const isLoading = isAuthenticated
    ? authenticatedCart.isLoading
    : isCartLoading;
  const error = isAuthenticated ? authenticatedCart.error : null;

  // Sync local quantities with cart changes
  useEffect(() => {
    const initialQuantities = cartItems.reduce(
      (acc, item) => ({ ...acc, [item.product_id]: item.quantity }),
      {},
    );
    setLocalQuantities(initialQuantities);
    // Reset removed items when cart data changes (after successful API calls)
    setRemovedItems(new Set());
  }, [cartItems]);

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      return removeItem(productId);
    }

    // Check if new quantity would exceed stock
    const product = products[productId];
    if (product && newQuantity > product.stock) {
      showStockError();
      return;
    }

    // Update local state immediately for responsive UI (no loader)
    setLocalQuantities((prev) => ({ ...prev, [productId]: newQuantity }));

    try {
      if (isAuthenticated) {
        // Find the cart item ID for this product
        const cartItem = authenticatedCart.cart?.items.find(
          (item) => item.product_id === productId,
        );
        if (cartItem) {
          // Update in background without showing loader
          await authenticatedCart.updateItem(
            cartItem.id,
            newQuantity,
            product?.stock,
          );
        }
      } else {
        guestCart.updateItem(productId, newQuantity, product?.stock);
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      // Revert optimistic update on error
      const cartItem = authenticatedCart.cart?.items.find(
        (item) => item.product_id === productId,
      );
      if (cartItem) {
        setLocalQuantities((prev) => ({
          ...prev,
          [productId]: cartItem.quantity,
        }));
      }
    }
  };

  const removeItem = async (productId: string) => {
    if (isAuthenticated) {
      // Find the cart item for optimistic update
      const cartItem = authenticatedCart.cart?.items.find(
        (item) => item.product_id === productId,
      );
      if (!cartItem) return;

      // Optimistically remove from local state immediately
      setLocalQuantities((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
      setRemovedItems((prev) => new Set([...prev, productId]));

      try {
        // Remove in background without showing loader
        await authenticatedCart.removeItem(cartItem.id);
      } catch (error) {
        console.error('Failed to remove cart item:', error);
        // Revert optimistic update on error
        setLocalQuantities((prev) => ({
          ...prev,
          [productId]: cartItem.quantity,
        }));
        setRemovedItems((prev) => {
          const updated = new Set(prev);
          updated.delete(productId);
          return updated;
        });
      }
    } else {
      guestCart.removeItem(productId);
    }
  };

  const clearEntireCart = async () => {
    try {
      if (isAuthenticated) {
        await authenticatedCart.clearCart();
      } else {
        guestCart.clearCart();
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const priceValidationItems: PriceValidationItem[] = React.useMemo(() => {
    if (!cartItems.length) return [];

    return cartItems
      .map((item) => {
        const product = products[item.product_id];
        if (product) {
          const priceToUse =
            product.discounted_price && product.discounted_price < product.price
              ? product.discounted_price
              : product.price;
          return {
            product_id: item.product_id,
            quantity: item.quantity,
            expected_unit_price_cents: Math.round(priceToUse * 100),
          };
        }
        return null;
      })
      .filter(Boolean) as PriceValidationItem[];
  }, [cartItems, products]);

  // Calculate hasItems based on visible items (after filtering removed items)
  const visibleItems = cartItems.filter(
    (item) => !removedItems.has(item.product_id),
  );
  const hasItems = visibleItems.length > 0;

  // Calculate optimistic cart summary using local quantities and filtered items
  const cartSummary = React.useMemo(() => {
    if (!isAuthenticated || visibleItems.length === 0) {
      return originalCartSummary;
    }

    // Calculate totals using optimistic quantities
    let optimisticSubtotal = new Decimal(0);
    let optimisticTax = new Decimal(0);
    let optimisticTotal = new Decimal(0);
    let itemCount = 0;

    visibleItems.forEach((item) => {
      const product = products[item.product_id];
      if (!product) return;

      const quantity = localQuantities[item.product_id] ?? item.quantity;
      itemCount += quantity;

      const priceToUse =
        product.discounted_price && product.discounted_price < product.price
          ? product.discounted_price
          : product.price;

      // Calculate tax and subtotal (tax = price * 0.21, subtotal = price - tax)
      const taxPerItem = CurrencyCalculator.multiply(
        new Decimal(priceToUse),
        TAX_RATE,
      );
      const subtotalPerItem = CurrencyCalculator.subtract(
        new Decimal(priceToUse),
        taxPerItem,
      );

      const itemSubtotal = CurrencyCalculator.multiply(
        subtotalPerItem,
        quantity,
      );
      const itemTax = CurrencyCalculator.multiply(taxPerItem, quantity);

      optimisticSubtotal = CurrencyCalculator.add(
        optimisticSubtotal,
        itemSubtotal,
      );
      optimisticTax = CurrencyCalculator.add(optimisticTax, itemTax);
    });

    const priceTotal = CurrencyCalculator.add(
      optimisticSubtotal,
      optimisticTax,
    );

    // Calculate shipping
    const shipping = CurrencyCalculator.isGreaterThanOrEqual(
      priceTotal,
      new Decimal(FREE_SHIPPING_THRESHOLD),
    )
      ? new Decimal(0)
      : new Decimal(STANDARD_SHIPPING_COST);

    optimisticTotal = CurrencyCalculator.add(priceTotal, shipping);

    return {
      subtotal: optimisticSubtotal,
      tax: optimisticTax,
      shipping,
      total: optimisticTotal,
      itemCount,
      priceTotal,
      hasDiscounts: originalCartSummary.hasDiscounts,
      originalTotal: originalCartSummary.originalTotal,
      totalSavings: originalCartSummary.totalSavings,
    };
  }, [
    isAuthenticated,
    visibleItems,
    localQuantities,
    products,
    originalCartSummary,
  ]);

  if (!isClient || isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <FiLoader className='animate-spin w-5 h-5 text-primary-500' />
          <span className='text-sm sm:text-base'>Winkelwagen laden...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <div className='text-center px-4'>
          <p className='text-red-600 mb-4 text-sm sm:text-base'>{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className='w-full sm:w-auto'
          >
            Probeer Opnieuw
          </Button>
        </div>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        <div className='container mx-auto px-4 py-4 sm:py-8'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
              <Link href='/shop'>
                <Button
                  variant='ghost'
                  size='sm'
                  leftIcon={<FiArrowLeft />}
                  className='w-fit'
                >
                  Verder Winkelen
                </Button>
              </Link>
              <h1 className='text-2xl sm:text-3xl md:text-4xl text-[#2d2820] font-family-serif'>
                Winkelwagen
              </h1>
            </div>
          </div>

          <div className='text-center py-12 sm:py-16 px-4'>
            <div className='w-20 sm:w-24 h-20 sm:h-24 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6'>
              <FiShoppingBag className='w-8 sm:w-10 h-8 sm:h-10 text-neutral-400' />
            </div>
            <h2 className='text-xl sm:text-2xl md:text-3xl font-medium text-neutral-800 font-family-serif mb-3 sm:mb-4'>
              Je winkelwagen is leeg
            </h2>
            <p className='text-sm sm:text-base text-neutral-600 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed'>
              Het lijkt erop dat je nog geen prachtige bloemen aan je
              winkelwagen hebt toegevoegd. Begin met browsen door onze
              collectie!
            </p>
            <Link href='/shop'>
              <Button
                variant='primary'
                size='lg'
                rightIcon={<FiArrowRight />}
                className='w-full sm:w-auto'
              >
                Bekijk Bloemen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      <div className='container mx-auto px-4 py-4 sm:py-8'>
        <CartHeader
          hasItems={hasItems}
          clearEntireCart={clearEntireCart}
          orderSummary={cartSummary}
        />
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
          <div className='lg:col-span-2'>
            <div className='card p-0 overflow-hidden'>
              <div className='p-4 sm:p-6 border-b border-neutral-200'>
                <h2 className='text-lg sm:text-xl md:text-2xl font-medium text-neutral-800 font-family-serif'>
                  Winkelwagen Artikelen
                </h2>
              </div>

              {priceValidationItems.length > 0 && (
                <PriceValidationComponent
                  items={priceValidationItems}
                  autoValidate={true}
                  onValidationError={(error) => {
                    console.error('Prijsvalidatie fout:', error);
                  }}
                  onValidationComplete={() => {}}
                />
              )}

              <div className='divide-y divide-neutral-200'>
                {visibleItems.map((item) => {
                  const product = products[item.product_id];
                  if (!product) return null;

                  const quantity = localQuantities[item.product_id] ?? 1;

                  return (
                    <div key={item.product_id} className='p-4 sm:p-6'>
                      <div className='flex items-start space-x-3 sm:space-x-4'>
                        <div className='flex-shrink-0 relative'>
                          <div className='w-16 sm:w-20 h-16 sm:h-20 bg-neutral-200 rounded-lg overflow-hidden'>
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0].url}
                                alt={product.images[0].alt_text || product.name}
                                width={80}
                                height={80}
                                className='w-full h-full object-cover'
                              />
                            ) : (
                              <div className='w-full h-full flex items-center justify-center'>
                                <FiShoppingBag className='w-8 h-8 text-neutral-400' />
                              </div>
                            )}
                          </div>
                          {hasPromotion(item.product_id) && (
                            <div className='absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-green-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium'>
                              -
                            </div>
                          )}
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0'>
                            <div className='pr-0 sm:pr-4'>
                              <h3 className='font-medium text-neutral-900 text-sm sm:text-base line-clamp-2 sm:truncate'>
                                {product.name}
                              </h3>

                              {hasPromotion(item.product_id) ? (
                                <div className='mt-2 flex items-baseline space-x-2'>
                                  <span className='text-lg font-semibold text-neutral-900'>
                                    {CurrencyCalculator.format(
                                      getDiscountedPrice(item.product_id)!,
                                    )}
                                  </span>
                                  <span className='text-sm text-neutral-400 line-through'>
                                    {CurrencyCalculator.format(
                                      getOriginalPrice(item.product_id)!,
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <p className='text-lg font-semibold text-neutral-900 mt-2'>
                                  {CurrencyCalculator.format(
                                    getOriginalPrice(item.product_id)!,
                                  )}
                                </p>
                              )}
                            </div>

                            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-3'>
                              <div className='flex items-center border border-neutral-300 rounded-lg'>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.product_id,
                                      quantity - 1,
                                    )
                                  }
                                  disabled={quantity <= 1}
                                  className='p-2 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                  <FiMinus className='w-4 h-4' />
                                </button>
                                <span className='px-4 py-2 min-w-[3rem] text-center'>
                                  {quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.product_id,
                                      quantity + 1,
                                    )
                                  }
                                  disabled={
                                    products[item.product_id] &&
                                    quantity >= products[item.product_id].stock
                                  }
                                  className='p-2 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                  <FiPlus className='w-4 h-4' />
                                </button>
                              </div>

                              <div className='flex items-center space-x-2'>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => removeItem(item.product_id)}
                                  disabled={false}
                                  leftIcon={<FiTrash2 />}
                                  className='text-red-600 hover:text-red-700 text-xs sm:text-sm'
                                >
                                  <span className='hidden sm:inline'>
                                    Verwijder
                                  </span>
                                  <span className='sm:hidden'>×</span>
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className='mt-3 sm:mt-4 text-right'>
                            {hasPromotion(item.product_id) ? (
                              <div className='space-y-1'>
                                <span className='text-lg font-semibold text-neutral-900'>
                                  {CurrencyCalculator.format(
                                    CurrencyCalculator.multiply(
                                      getDiscountedPrice(item.product_id)!,
                                      quantity,
                                    ),
                                  )}
                                </span>
                                <div className='text-sm text-neutral-400 line-through'>
                                  {CurrencyCalculator.format(
                                    CurrencyCalculator.multiply(
                                      getOriginalPrice(item.product_id)!,
                                      quantity,
                                    ),
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className='text-lg font-semibold'>
                                {CurrencyCalculator.format(
                                  CurrencyCalculator.multiply(
                                    getOriginalPrice(item.product_id)!,
                                    quantity,
                                  ),
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className='lg:col-span-1'>
            <div className='card p-4 sm:p-6 sticky top-4 sm:top-8'>
              <h2 className='text-lg sm:text-xl md:text-2xl font-medium text-neutral-800 font-family-serif mb-4 sm:mb-6'>
                Bestelsamenvatting
              </h2>

              <div className='space-y-3 sm:space-y-4 mb-4 sm:mb-6'>
                {cartSummary.hasDiscounts && (
                  <div className='flex justify-between text-xs sm:text-sm text-neutral-500'>
                    <span>Origineel subtotaal</span>
                    <span className='line-through'>
                      {CurrencyCalculator.format(cartSummary.originalTotal)}
                    </span>
                  </div>
                )}
                <div className='flex justify-between text-sm sm:text-base'>
                  <span>Subtotaal (incl. BTW)</span>
                  <span
                    className={`font-medium ${cartSummary.hasDiscounts ? 'text-green-600' : ''}`}
                  >
                    {CurrencyCalculator.format(cartSummary.priceTotal)}
                  </span>
                </div>
                {cartSummary.hasDiscounts && (
                  <div className='flex justify-between text-xs sm:text-sm text-green-600'>
                    <span>Korting</span>
                    <span>
                      -{CurrencyCalculator.format(cartSummary.totalSavings)}
                    </span>
                  </div>
                )}
                <div className='flex justify-between text-xs sm:text-sm text-neutral-600'>
                  <span>Waarvan BTW (21%)</span>
                  <span>{CurrencyCalculator.format(cartSummary.tax)}</span>
                </div>
                <div className='flex justify-between text-sm sm:text-base'>
                  <span>Verzending</span>
                  <span className='font-medium'>
                    {CurrencyCalculator.isEqual(
                      cartSummary.shipping,
                      new Decimal(0),
                    )
                      ? 'Gratis'
                      : CurrencyCalculator.format(cartSummary.shipping)}
                  </span>
                </div>
                <div className='border-t border-neutral-200 pt-3 sm:pt-4'>
                  <div className='flex justify-between font-semibold text-base sm:text-lg'>
                    <span>Totaal</span>
                    <span
                      className={
                        cartSummary.hasDiscounts ? 'text-green-600' : ''
                      }
                    >
                      {CurrencyCalculator.format(cartSummary.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              {/* Free Shipping Notice */}
              {CurrencyCalculator.isGreaterThan(
                cartSummary.shipping,
                new Decimal(0),
              ) &&
                CurrencyCalculator.isGreaterThan(
                  CurrencyCalculator.calculateShippingRemaining(
                    cartSummary.priceTotal,
                    FREE_SHIPPING_THRESHOLD,
                  ),
                  new Decimal(0),
                ) && (
                  <div className='bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6'>
                    <p className='text-xs sm:text-sm text-amber-800'>
                      Voeg nog{' '}
                      {CurrencyCalculator.format(
                        CurrencyCalculator.calculateShippingRemaining(
                          cartSummary.priceTotal,
                          FREE_SHIPPING_THRESHOLD,
                        ),
                      )}{' '}
                      toe voor gratis verzending!
                    </p>
                  </div>
                )}

              {/* Checkout Button */}
              <Link
                href={
                  isAuthenticated ? '/checkout' : '/login?redirect=/checkout'
                }
              >
                <Button
                  variant='primary'
                  size='lg'
                  fullWidth
                  rightIcon={<FiArrowRight />}
                  className='mb-3 sm:mb-4 text-sm sm:text-base'
                  disabled={!hasItems}
                >
                  Ga naar Afrekenen
                </Button>
              </Link>

              {/* Trust Badges - Mobile responsive */}
              <div className='space-y-2 sm:space-y-3 text-xs sm:text-sm text-neutral-600'>
                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <FiShield className='w-4 sm:w-5 h-4 sm:h-5 text-green-500 flex-shrink-0' />
                  <span>Veilig afrekenen met iDEAL</span>
                </div>
                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <FiTruck className='w-4 sm:w-5 h-4 sm:h-5 text-blue-500 flex-shrink-0' />
                  <span>Gratis verzending vanaf €75</span>
                </div>
                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <FiRotateCcw className='w-4 sm:w-5 h-4 sm:h-5 text-purple-500 flex-shrink-0' />
                  <span>14-dagen retourbeleid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
