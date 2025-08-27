'use client';

import React, { useState, memo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '../types';
import { Button } from './Button';
import { useCart, useGuestCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { usePrefetch } from '../hooks/usePrefetch';
import { useProductPromotion } from '../hooks/usePromotion';
import { useNotification } from '../context/NotificationContext';
import {
  FiShoppingBag,
  FiEye,
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  translateColor,
  translateSize,
  getColorClass,
  getProductTypeIcon,
  getProductTypeDescription,
} from '../lib/translations';
import { DiscountIndicator } from './DiscountIndicator';

interface ProductCardProps {
  product: Product;
  className?: string;
  viewMode?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = '',
  viewMode = 'grid',
}) => {
  const { isAuthenticated } = useAuth();
  const authenticatedCart = useCart();
  const guestCart = useGuestCart();
  const { handleMouseEnter } = usePrefetch({
    prefetchDelay: 200,
    prefetchOnHover: true,
  });
  const { data: promotion } = useProductPromotion(product.id);
  const { showStockError } = useNotification();

  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const formatPrice = useCallback(
    (price: number) =>
      new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
      }).format(price),
    [],
  );

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!product.is_active || product.stock <= 0) {
        showStockError();
        return;
      }

      // Check current cart quantity to prevent exceeding stock
      let currentQuantity = 0;
      if (isAuthenticated && authenticatedCart.cart?.items) {
        const cartItem = authenticatedCart.cart.items.find(
          (item) => item.product_id === product.id,
        );
        currentQuantity = cartItem?.quantity || 0;
      } else {
        const guestItem = guestCart.items.find(
          (item) => item.product_id === product.id,
        );
        currentQuantity = guestItem?.quantity || 0;
      }

      if (currentQuantity >= product.stock) {
        showStockError();
        return;
      }

      setIsLoading(true);
      try {
        if (isAuthenticated) {
          await authenticatedCart.addItem(product.id, 1, product.stock);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        } else {
          // Show spinner for 200ms for guest cart UX
          setTimeout(() => {
            guestCart.addItem(product.id, 1, product.stock);
            setIsLoading(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
          }, 300);
          return; // Don't set loading to false in finally block for guest
        }
      } catch (error) {
        console.error('Failed to add to cart:', error);
      } finally {
        if (isAuthenticated) {
          setIsLoading(false);
        }
      }
    },
    [
      product.is_active,
      product.stock,
      product.id,
      isAuthenticated,
      authenticatedCart,
      guestCart,
      showStockError,
    ],
  );

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleLinkHover = useCallback(() => {
    const cleanup = handleMouseEnter(`/shop/${product.id}`, product.id);
    return cleanup;
  }, [handleMouseEnter, product.id]);

  const isOutOfStock = !product.is_active || product.stock <= 0;
  const hasDiscount = promotion && product.discounted_price < product.price;

  // Render simplified price with discount
  const renderPrice = () => {
    if (!hasDiscount) {
      return (
        <span className='text-lg font-semibold text-[#2d2820]'>
          {formatPrice(product.price)}
        </span>
      );
    }

    return (
      <div className='flex items-center gap-2'>
        <span className='text-lg font-semibold text-[#2d2820]'>
          {formatPrice(product.discounted_price)}
        </span>
        <span className='text-sm text-gray-500 line-through'>
          {formatPrice(product.price)}
        </span>
      </div>
    );
  };

  // Render availability status
  const renderAvailability = () => (
    <div className='flex items-center gap-1.5'>
      {isOutOfStock ? (
        <>
          <FiAlertCircle className='w-4 h-4 text-red-500' />
          <span className='text-sm font-medium text-red-600'>
            Niet beschikbaar
          </span>
        </>
      ) : (
        <>
          <FiCheck className='w-4 h-4 text-green-600' />
          <span className='text-sm text-green-700'>Op voorraad</span>
        </>
      )}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className={`card card-hover group relative ${className}`}>
        {/* Discount Indicator */}
        <DiscountIndicator
          originalPrice={product.price}
          discountedPrice={product.discounted_price}
        />

        <Link
          href={`/shop/${product.id}`}
          className='flex flex-col sm:flex-row w-full'
          onMouseEnter={handleLinkHover}
        >
          {/* Product Image */}
          <div className='relative w-full sm:w-32 md:w-40 h-54 sm:h-32 md:h-50 flex-shrink-0 overflow-hidden rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none bg-[#f5f2ee]'>
            {!imageError && product.images?.length ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt_text || product.name}
                fill
                sizes='(max-width: 640px) 100vw, 160px'
                className='object-cover transition-transform duration-500 group-hover:scale-105'
                onError={handleImageError}
                priority={false}
                quality={85}
                placeholder='blur'
                blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7+H9v4++ADCmhzgMoOe+d1+dTSTBcV/9k='
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f5f2ee] to-[#e8e2d9]'>
                <span className='text-3xl'>🌸</span>
              </div>
            )}

            {/* Out of stock overlay */}
            {isOutOfStock && (
              <div className='absolute inset-0 bg-black/30 flex items-center justify-center'>
                <span className='bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-medium'>
                  Niet beschikbaar
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className='flex-1 p-4 sm:p-5 flex flex-col justify-between min-h-[120px]'>
            <div className='space-y-2'>
              <h3 className='font-family-serif font-semibold text-lg sm:text-xl text-[#2d2820] line-clamp-2 group-hover:text-[#d4a574] transition-colors duration-300'>
                {product.name}
              </h3>

              <p className='text-[#7d6b55] text-sm leading-relaxed line-clamp-2'>
                {product.description}
              </p>

              {/* Product Type */}
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  product.product_type === 'flower'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {getProductTypeIcon(product.product_type)}{' '}
                {getProductTypeDescription(product.product_type)}
              </span>
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4'>
              <div className='space-y-1'>
                {renderPrice()}
                {renderAvailability()}
              </div>

              <Button
                variant='primary'
                size='md'
                onClick={handleAddToCart}
                disabled={isOutOfStock || isLoading}
                loading={isLoading}
                leftIcon={
                  showSuccess ? (
                    <FiCheckCircle className='w-4 h-4' />
                  ) : !isLoading ? (
                    <FiShoppingBag className='w-4 h-4' />
                  ) : undefined
                }
                className='min-h-[44px] px-4 sm:px-6 whitespace-nowrap'
              >
                {showSuccess
                  ? 'Toegevoegd!'
                  : isOutOfStock
                    ? 'Niet beschikbaar'
                    : 'Toevoegen'}
              </Button>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Grid view - optimized for mobile-first
  return (
    <div className={`card card-hover group relative ${className}`}>
      {/* Discount Indicator */}
      <DiscountIndicator
        originalPrice={product.price}
        discountedPrice={product.discounted_price}
        promotion={promotion}
        className='absolute top-4 right-4 z-10'
      />

      <Link
        href={`/shop/${product.id}`}
        className='block'
        onMouseEnter={handleLinkHover}
      >
        {/* Product Image */}
        <div className='relative aspect-[4/3] sm:aspect-square overflow-hidden rounded-t-2xl bg-[#f5f2ee]'>
          {!imageError && product.images?.length ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt_text || product.name}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
              className='object-cover transition-transform duration-500 group-hover:scale-105'
              onError={handleImageError}
              priority={false}
              quality={85}
              placeholder='blur'
              blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7+H9v4++ADCmhzgMoOe+d1+dTSTBcV/9k='
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f5f2ee] to-[#e8e2d9]'>
              <div className='text-center text-[#9a8470]'>
                <div className='w-16 h-16 mx-auto mb-3 bg-[#d6ccc0] rounded-full flex items-center justify-center'>
                  <span className='text-2xl'>🌸</span>
                </div>
                <p className='text-sm font-medium px-4'>{product.name}</p>
              </div>
            </div>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
              <span className='bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium'>
                Niet beschikbaar
              </span>
            </div>
          )}

          {/* Quick View Overlay - Desktop only */}
          <div className='hidden sm:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center'>
            <button className='w-12 h-12 bg-white/90 hover:bg-white text-[#2d2820] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110'>
              <FiEye className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className='p-4 sm:p-5 space-y-3'>
          <div className='space-y-2'>
            <h3 className='font-family-serif font-semibold text-lg sm:text-xl text-[#2d2820] line-clamp-2 group-hover:text-[#d4a574] transition-colors duration-300'>
              {product.name}
            </h3>

            <p className='text-[#7d6b55] text-sm leading-relaxed line-clamp-3'>
              {product.description}
            </p>

            {/* Product Type */}
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                product.product_type === 'flower'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {getProductTypeIcon(product.product_type)}{' '}
              {getProductTypeDescription(product.product_type)}
            </span>
          </div>

          {/* Colors - Simplified */}
          {product.colors?.length && (
            <div className='flex items-center gap-2'>
              <span className='text-xs text-[#9a8470]'>Kleuren:</span>
              <div className='flex gap-1'>
                {product.colors.slice(0, 5).map((color, index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${getColorClass(color)}`}
                    title={translateColor(color)}
                  />
                ))}
                {product.colors.length > 5 && (
                  <span className='text-xs text-[#9a8470] ml-1'>
                    +{product.colors.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Size */}
          {product.size && (
            <div className='text-xs text-[#9a8470]'>
              <span>Maat: </span>
              <span className='text-[#7d6b55] font-medium'>
                {translateSize(product.size)}
              </span>
            </div>
          )}

          {/* Price and Availability */}
          <div className='pt-2 space-y-2'>
            <div className='flex items-center justify-between'>
              {renderPrice()}
            </div>
            <div>{renderAvailability()}</div>
          </div>
        </div>
      </Link>

      {/* Action Button */}
      <div className='px-4 sm:px-5 pb-4 sm:pb-5'>
        <Button
          variant='primary'
          size='lg'
          onClick={handleAddToCart}
          disabled={isOutOfStock || isLoading}
          loading={isLoading}
          leftIcon={
            showSuccess ? (
              <FiCheckCircle className='w-5 h-5' />
            ) : !isLoading ? (
              <FiShoppingBag className='w-5 h-5' />
            ) : undefined
          }
          className='w-full min-h-[48px] font-medium'
        >
          {showSuccess
            ? 'Toegevoegd!'
            : isOutOfStock
              ? 'Niet beschikbaar'
              : 'Toevoegen'}
        </Button>
      </div>
    </div>
  );
};

// Optimized memoization
export default memo(ProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.discounted_price === nextProps.product.discounted_price &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.is_active === nextProps.product.is_active &&
    prevProps.className === nextProps.className &&
    prevProps.viewMode === nextProps.viewMode
  );
});
