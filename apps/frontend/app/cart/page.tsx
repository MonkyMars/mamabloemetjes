'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../../components/Button';
import { useCart, useGuestCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
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
import { Product } from '@/types';

const CartPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const authenticatedCart = useCart();
  const guestCart = useGuestCart();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});

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
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/products/${productId}`,
          );
          if (response.ok) {
            const result = await response.json();
            return { id: productId, data: result.data };
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
  }, [cart, guestCart.items, isAuthenticated]);

  const updateQuantity = async (
    itemId: string,
    productId: string,
    newQuantity: number,
  ) => {
    if (newQuantity <= 0) {
      return removeItem(itemId, productId);
    }

    try {
      setIsUpdating(itemId || productId);

      if (isAuthenticated) {
        await authenticatedCart.updateItem(itemId, newQuantity);
      } else {
        guestCart.updateItem(productId, newQuantity);
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const removeItem = async (itemId: string, productId: string) => {
    try {
      setIsUpdating(itemId || productId);

      if (isAuthenticated) {
        await authenticatedCart.removeItem(itemId);
      } else {
        guestCart.removeItem(productId);
      }
    } catch (error) {
      console.error('Failed to remove cart item:', error);
    } finally {
      setIsUpdating(null);
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

  const calculateOrderSummary = () => {
    let subtotal = 0;
    let itemCount = 0;

    if (isAuthenticated && cart?.items) {
      subtotal =
        cart.items.reduce((sum, item) => {
          return sum + item.quantity * item.unit_price_cents;
        }, 0) / 100; // Convert from cents
      itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    } else if (!isAuthenticated) {
      subtotal = guestCart.items.reduce((sum, item) => {
        const product = products[item.product_id];
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);
      itemCount = guestCart.totalQuantity();
    }

    const shippingThreshold = 75;
    const shipping = subtotal >= shippingThreshold ? 0 : 7.5;
    // Product price already includes VAT, so we just add shipping
    const total = subtotal + shipping;

    return {
      subtotal,
      shipping,
      total,
      itemCount,
    };
  };

  const orderSummary = calculateOrderSummary();
  const hasItems = isAuthenticated
    ? (cart?.items?.length || 0) > 0
    : guestCart.items.length > 0;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <FiLoader className='animate-spin w-5 h-5 text-primary-500' />
          <span>Winkelwagen laden...</span>
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
          {/* Header */}
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center space-x-4'>
              <Link href='/shop'>
                <Button variant='ghost' size='sm' leftIcon={<FiArrowLeft />}>
                  Verder Winkelen
                </Button>
              </Link>
              <h1 className='heading-2'>Winkelwagen</h1>
            </div>
          </div>

          {/* Empty Cart State */}
          <div className='text-center py-16'>
            <div className='w-24 h-24 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-6'>
              <FiShoppingBag className='w-10 h-10 text-neutral-400' />
            </div>
            <h2 className='heading-3 mb-4'>Je winkelwagen is leeg</h2>
            <p className='text-neutral-600 mb-8 max-w-md mx-auto'>
              Het lijkt erop dat je nog geen prachtige bloemen aan je
              winkelwagen hebt toegevoegd. Begin met browsen door onze
              collectie!
            </p>
            <Link href='/shop'>
              <Button variant='primary' size='lg' rightIcon={<FiArrowRight />}>
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
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          {/* Back Button */}
          <div className='mb-4'>
            <Link href='/shop'>
              <Button variant='ghost' size='sm' leftIcon={<FiArrowLeft />}>
                Verder Winkelen
              </Button>
            </Link>
          </div>

          {/* Title Row */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <h1 className='heading-2'>Winkelwagen</h1>
              <span className='text-sm text-neutral-500'>
                ({orderSummary.itemCount}{' '}
                {orderSummary.itemCount === 1 ? 'artikel' : 'artikelen'})
              </span>
            </div>
            {hasItems && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearEntireCart}
                className='text-red-600 hover:text-red-700'
              >
                Wis Winkelwagen
              </Button>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Cart Items */}
          <div className='lg:col-span-2'>
            <div className='card p-0 overflow-hidden'>
              <div className='p-6 border-b border-neutral-200'>
                <h2 className='heading-4'>Winkelwagen Artikelen</h2>
              </div>

              <div className='divide-y divide-neutral-200'>
                {isAuthenticated && cart?.items
                  ? // Authenticated user cart items
                    cart.items.map((item) => {
                      const product = {
                        id: item.product_id,
                        name: item.product_name,
                        sku: item.product_sku,
                        price: item.unit_price_cents / 100,
                        images: products[item.product_id]?.images || null,
                      };
                      const itemId = item.id;
                      const quantity = item.quantity;
                      const isItemUpdating = isUpdating === itemId;

                      return (
                        <div key={itemId} className='p-6'>
                          <div className='flex items-start space-x-4'>
                            {/* Product Image */}
                            <div className='flex-shrink-0'>
                              <div className='w-20 h-20 bg-neutral-200 rounded-lg overflow-hidden'>
                                {product?.images &&
                                product.images.length > 0 ? (
                                  <Image
                                    src={product.images[0].url}
                                    alt={
                                      product.images[0].alt_text || product.name
                                    }
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
                            </div>

                            {/* Product Details */}
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-start justify-between'>
                                <div className='pr-4'>
                                  <h3 className='font-medium text-neutral-900 truncate'>
                                    {product.name}
                                  </h3>

                                  <p className='text-lg font-semibold text-neutral-900 mt-2'>
                                    €{product.price.toFixed(2)}
                                  </p>
                                </div>

                                {/* Quantity Controls */}
                                <div className='flex items-center space-x-3'>
                                  <div className='flex items-center border border-neutral-300 rounded-lg'>
                                    <button
                                      onClick={() =>
                                        updateQuantity(
                                          itemId,
                                          item.product_id,
                                          quantity - 1,
                                        )
                                      }
                                      disabled={isItemUpdating || quantity <= 1}
                                      className='p-2 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                      <FiMinus className='w-4 h-4' />
                                    </button>
                                    <span className='px-4 py-2 min-w-[3rem] text-center'>
                                      {isItemUpdating ? (
                                        <FiLoader className='animate-spin w-4 h-4 mx-auto' />
                                      ) : (
                                        quantity
                                      )}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateQuantity(
                                          itemId,
                                          item.product_id,
                                          quantity + 1,
                                        )
                                      }
                                      disabled={isItemUpdating}
                                      className='p-2 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                      <FiPlus className='w-4 h-4' />
                                    </button>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className='flex items-center space-x-2'>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      onClick={() =>
                                        removeItem(itemId, item.product_id)
                                      }
                                      disabled={isItemUpdating}
                                      leftIcon={<FiTrash2 />}
                                      className='text-red-600 hover:text-red-700'
                                    >
                                      Verwijder
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Line Total */}
                              <div className='mt-4 text-right'>
                                <span className='text-lg font-semibold'>
                                  €{(product.price * quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : // Guest user cart items
                    guestCart.items.map((item) => {
                      const product = products[item.product_id];
                      if (!product) return null;

                      const itemId = item.product_id;
                      const quantity = item.quantity;
                      const isItemUpdating = isUpdating === itemId;

                      return (
                        <div key={itemId} className='p-6'>
                          <div className='flex items-start space-x-4'>
                            {/* Product Image */}
                            <div className='flex-shrink-0'>
                              <div className='w-20 h-20 bg-neutral-200 rounded-lg overflow-hidden'>
                                {product.images && product.images.length > 0 ? (
                                  <Image
                                    src={product.images[0].url}
                                    alt={
                                      product.images[0].alt_text || product.name
                                    }
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
                            </div>

                            {/* Product Details */}
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-start justify-between'>
                                <div className='pr-4'>
                                  <h3 className='font-medium text-neutral-900 truncate'>
                                    {product.name}
                                  </h3>

                                  <p className='text-lg font-semibold text-neutral-900 mt-2'>
                                    €{product.price}
                                  </p>
                                </div>

                                {/* Quantity Controls */}
                                <div className='flex items-center space-x-3'>
                                  <div className='flex items-center border border-neutral-300 rounded-lg'>
                                    <button
                                      onClick={() =>
                                        updateQuantity(
                                          itemId,
                                          item.product_id,
                                          quantity - 1,
                                        )
                                      }
                                      disabled={isItemUpdating || quantity <= 1}
                                      className='p-2 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                      <FiMinus className='w-4 h-4' />
                                    </button>
                                    <span className='px-4 py-2 min-w-[3rem] text-center'>
                                      {isItemUpdating ? (
                                        <FiLoader className='animate-spin w-4 h-4 mx-auto' />
                                      ) : (
                                        quantity
                                      )}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateQuantity(
                                          itemId,
                                          item.product_id,
                                          quantity + 1,
                                        )
                                      }
                                      disabled={isItemUpdating}
                                      className='p-2 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                      <FiPlus className='w-4 h-4' />
                                    </button>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className='flex items-center space-x-2'>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      onClick={() =>
                                        removeItem(itemId, item.product_id)
                                      }
                                      disabled={isItemUpdating}
                                      leftIcon={<FiTrash2 />}
                                      className='text-red-600 hover:text-red-700'
                                    >
                                      Verwijder
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Line Total */}
                              <div className='mt-4 text-right'>
                                <span className='text-lg font-semibold'>
                                  €{(product.price * quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='card p-6 sticky top-8'>
              <h2 className='heading-4 mb-6'>Bestelsamenvatting</h2>

              <div className='space-y-4 mb-6'>
                <div className='flex justify-between'>
                  <span>Subtotaal (incl. BTW)</span>
                  <span>€{orderSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Waarvan BTW (21%)</span>
                  <span>
                    €{((orderSummary.subtotal * 21) / 121).toFixed(2)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Verzending</span>
                  <span>
                    {orderSummary.shipping === 0 ? (
                      <span className='text-green-600'>Gratis</span>
                    ) : (
                      `€${orderSummary.shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className='border-t border-neutral-200 pt-4'>
                  <div className='flex justify-between font-semibold text-lg'>
                    <span>Totaal</span>
                    <span>€{orderSummary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              {orderSummary.shipping > 0 && (
                <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6'>
                  <p className='text-sm text-amber-800'>
                    Voeg nog €{(75 - orderSummary.subtotal).toFixed(2)} toe voor
                    gratis verzending!
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
                  className='mb-4'
                  disabled={
                    (isAuthenticated && (!cart || cart.items.length === 0)) ||
                    (!isAuthenticated && guestCart.items.length === 0)
                  }
                >
                  Ga naar Afrekenen
                </Button>
              </Link>

              {/* Trust Badges */}
              <div className='space-y-3 text-sm text-neutral-600'>
                <div className='flex items-center space-x-3'>
                  <FiShield className='w-5 h-5 text-green-500' />
                  <span>Veilig afrekenen met iDEAL</span>
                </div>
                <div className='flex items-center space-x-3'>
                  <FiTruck className='w-5 h-5 text-blue-500' />
                  <span>Gratis verzending vanaf €75</span>
                </div>
                <div className='flex items-center space-x-3'>
                  <FiRotateCcw className='w-5 h-5 text-purple-500' />
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
