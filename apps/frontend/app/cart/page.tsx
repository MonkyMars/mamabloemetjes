'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../../components/Button';
import { CartItem, OrderSummary } from '../../types';
import { getProductById } from '../../data/products';
import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShoppingBag,
  FiHeart,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiTruck,
  FiRotateCcw,
} from 'react-icons/fi';

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Mock cart data - in a real app, this would come from context/state management
  useEffect(() => {
    setIsLoading(true);
    // Simulate loading cart from storage/API
    setTimeout(() => {
      const mockCartItems: CartItem[] = [
        {
          product: getProductById('velvet-rose-bouquet-1')!,
          quantity: 2,
          customization: {
            colors: ['deep-red', 'burgundy'],
            occasion: 'anniversary',
            personalMessage: 'Happy Anniversary!',
          },
        },
        {
          product: getProductById('velvet-peony-arrangement-1')!,
          quantity: 1,
        },
        {
          product: getProductById('velvet-wildflower-bouquet-1')!,
          quantity: 1,
          customization: {
            colors: ['lavender', 'cream'],
            occasion: 'wedding',
          },
        },
      ];
      setCartItems(mockCartItems);
      setIsLoading(false);
    }, 500);
  }, []);

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(productId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    );

    setIsUpdating(null);
  };

  const removeItem = async (productId: string) => {
    setIsUpdating(productId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId),
    );
    setIsUpdating(null);
  };

  const moveToWishlist = async (productId: string) => {
    // TODO: Implement wishlist functionality
    console.log('Moving to wishlist:', productId);
    await removeItem(productId);
  };

  const calculateOrderSummary = (): OrderSummary => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    const shippingThreshold = 75;
    const shipping = subtotal >= shippingThreshold ? 0 : 7.5;
    const taxRate = 0.21; // 21% VAT in Netherlands
    const tax = subtotal * taxRate;
    const total = subtotal + shipping + tax;

    return {
      items: cartItems,
      subtotal,
      tax,
      shipping,
      total,
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const orderSummary = calculateOrderSummary();

  if (isLoading) {
    return (
      <div className='min-h-screen pt-24 pb-16'>
        <div className='container'>
          <div className='max-w-4xl mx-auto'>
            <div className='animate-pulse'>
              <div className='h-8 bg-gray-200 rounded w-1/4 mb-8'></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='card p-6 mb-4'>
                  <div className='flex space-x-4'>
                    <div className='w-24 h-24 bg-gray-200 rounded-lg'></div>
                    <div className='flex-1 space-y-2'>
                      <div className='h-6 bg-gray-200 rounded w-3/4'></div>
                      <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                      <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className='min-h-screen pt-24 pb-16 flex items-center justify-center'>
        <div className='container'>
          <div className='max-w-2xl mx-auto text-center'>
            <div className='w-24 h-24 bg-[#f5f2ee] rounded-full flex items-center justify-center mx-auto mb-8'>
              <FiShoppingBag className='w-12 h-12 text-[#9a8470]' />
            </div>
            <h1 className='heading-2 mb-4'>Your Cart is Empty</h1>
            <p className='text-lg text-[#7d6b55] mb-8 leading-relaxed'>
              Looks like you haven&apos;t added any beautiful flowers to your
              cart yet. Explore our collection and find the perfect arrangement
              for your special moment.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/shop'>
                <Button
                  variant='primary'
                  size='lg'
                  rightIcon={<FiArrowRight className='w-5 h-5' />}
                >
                  Start Shopping
                </Button>
              </Link>
              <Link href='/'>
                <Button variant='outline' size='lg'>
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen pt-24 pb-16'>
      <div className='container'>
        <div className='max-w-6xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center space-x-4 mb-4'>
              <Link
                href='/shop'
                className='text-[#7d6b55] hover:text-[#d4a574] transition-colors duration-300'
              >
                <FiArrowLeft className='w-5 h-5' />
              </Link>
              <h1 className='heading-2'>Shopping Cart</h1>
            </div>
            <p className='text-[#7d6b55]'>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in
              your cart
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Cart Items */}
            <div className='lg:col-span-2 space-y-4'>
              {cartItems.map((item) => (
                <div key={item.product.id} className='card p-6'>
                  <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6'>
                    {/* Product Image */}
                    <div className='flex-shrink-0'>
                      <div className='w-32 h-32 relative overflow-hidden rounded-xl bg-[#f5f2ee]'>
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className='object-cover'
                        />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex justify-between items-start mb-2'>
                        <div>
                          <h3 className='font-serif font-semibold text-lg text-[#2d2820] mb-1'>
                            <Link
                              href={`/product/${item.product.id}`}
                              className='hover:text-[#d4a574] transition-colors duration-300'
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className='text-sm text-[#7d6b55] capitalize'>
                            {item.product.category} • {item.product.size}
                          </p>
                        </div>
                        <div className='text-right'>
                          <div className='price-small'>
                            {formatPrice(item.product.price)}
                          </div>
                          {item.quantity > 1 && (
                            <div className='text-sm text-[#7d6b55]'>
                              {formatPrice(item.product.price * item.quantity)}{' '}
                              total
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Customizations */}
                      {item.customization && (
                        <div className='mb-4 p-4 bg-[#f5f2ee] rounded-lg'>
                          <h4 className='text-sm font-medium text-[#2d2820] mb-2'>
                            Customizations:
                          </h4>
                          <div className='space-y-1 text-sm text-[#7d6b55]'>
                            {item.customization.occasion && (
                              <p>
                                Occasion:{' '}
                                <span className='capitalize'>
                                  {item.customization.occasion}
                                </span>
                              </p>
                            )}
                            {item.customization.colors && (
                              <p>
                                Colors:{' '}
                                {item.customization.colors
                                  .map((c) => c.replace('-', ' '))
                                  .join(', ')}
                              </p>
                            )}
                            {item.customization.personalMessage && (
                              <p>
                                Message: &quot;
                                {item.customization.personalMessage}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Quantity and Actions */}
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          {/* Quantity Controls */}
                          <div className='flex items-center border border-[#e8e2d9] rounded-lg'>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                )
                              }
                              disabled={
                                item.quantity <= 1 ||
                                isUpdating === item.product.id
                              }
                              className='p-2 hover:bg-[#f5f2ee] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              <FiMinus className='w-4 h-4' />
                            </button>
                            <span className='px-4 py-2 min-w-[3rem] text-center font-medium'>
                              {isUpdating === item.product.id
                                ? '...'
                                : item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                )
                              }
                              disabled={
                                isUpdating === item.product.id ||
                                item.quantity >= item.product.stock
                              }
                              className='p-2 hover:bg-[#f5f2ee] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              <FiPlus className='w-4 h-4' />
                            </button>
                          </div>

                          {/* Stock Warning */}
                          {item.product.stock < 10 && (
                            <span className='text-xs text-orange-600 font-medium'>
                              Only {item.product.stock} left
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className='flex items-center space-x-2'>
                          <button
                            onClick={() => moveToWishlist(item.product.id)}
                            disabled={isUpdating === item.product.id}
                            className='p-2 text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee] rounded-lg transition-all duration-200 disabled:opacity-50'
                            title='Move to Wishlist'
                          >
                            <FiHeart className='w-5 h-5' />
                          </button>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            disabled={isUpdating === item.product.id}
                            className='p-2 text-[#7d6b55] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50'
                            title='Remove from Cart'
                          >
                            <FiTrash2 className='w-5 h-5' />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Continue Shopping */}
              <div className='pt-4'>
                <Link href='/shop'>
                  <Button
                    variant='outline'
                    leftIcon={<FiArrowLeft className='w-4 h-4' />}
                  >
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className='lg:col-span-1'>
              <div className='sticky top-32 space-y-6'>
                {/* Summary Card */}
                <div className='card p-6'>
                  <h3 className='heading-4 mb-6'>Order Summary</h3>

                  <div className='space-y-4 mb-6'>
                    <div className='flex justify-between text-[#7d6b55]'>
                      <span>Subtotal</span>
                      <span>{formatPrice(orderSummary.subtotal)}</span>
                    </div>

                    <div className='flex justify-between text-[#7d6b55]'>
                      <span>Shipping</span>
                      <span>
                        {orderSummary.shipping === 0 ? (
                          <span className='text-green-600 font-medium'>
                            Free
                          </span>
                        ) : (
                          formatPrice(orderSummary.shipping)
                        )}
                      </span>
                    </div>

                    <div className='flex justify-between text-[#7d6b55]'>
                      <span>VAT (21%)</span>
                      <span>{formatPrice(orderSummary.tax)}</span>
                    </div>

                    <div className='border-t border-[#e8e2d9] pt-4'>
                      <div className='flex justify-between items-center'>
                        <span className='text-lg font-semibold text-[#2d2820]'>
                          Total
                        </span>
                        <span className='text-xl font-serif font-bold text-[#d4a574]'>
                          {formatPrice(orderSummary.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Free Shipping Notice */}
                  {orderSummary.shipping > 0 && (
                    <div className='mb-6 p-4 bg-[#8b9dc3]/10 rounded-lg border border-[#8b9dc3]/20'>
                      <p className='text-sm text-[#8b9dc3]'>
                        <FiTruck className='inline w-4 h-4 mr-1' />
                        Add {formatPrice(75 - orderSummary.subtotal)} more for
                        free shipping
                      </p>
                    </div>
                  )}

                  <Button
                    variant='primary'
                    size='lg'
                    fullWidth
                    rightIcon={<FiArrowRight className='w-5 h-5' />}
                    onClick={() => (window.location.href = '/checkout')}
                  >
                    Proceed to Checkout
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className='card p-6'>
                  <h4 className='font-semibold text-[#2d2820] mb-4'>
                    Your Purchase is Protected
                  </h4>
                  <div className='space-y-3 text-sm'>
                    <div className='flex items-center space-x-3 text-[#7d6b55]'>
                      <FiShield className='w-5 h-5 text-green-600 flex-shrink-0' />
                      <span>Secure payment processing</span>
                    </div>
                    <div className='flex items-center space-x-3 text-[#7d6b55]'>
                      <FiTruck className='w-5 h-5 text-blue-600 flex-shrink-0' />
                      <span>Free delivery on orders over €75</span>
                    </div>
                    <div className='flex items-center space-x-3 text-[#7d6b55]'>
                      <FiRotateCcw className='w-5 h-5 text-orange-600 flex-shrink-0' />
                      <span>14-day return policy</span>
                    </div>
                  </div>
                </div>

                {/* Need Help */}
                <div className='card p-6 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] text-white'>
                  <h4 className='font-semibold mb-2'>Need Help?</h4>
                  <p className='text-white/90 text-sm mb-4'>
                    Have questions about your order or need customization
                    advice?
                  </p>
                  <Link href='/contact'>
                    <Button
                      variant='secondary'
                      size='sm'
                      className='bg-white text-[#d4a574] hover:bg-white/90'
                    >
                      Contact Us
                    </Button>
                  </Link>
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
