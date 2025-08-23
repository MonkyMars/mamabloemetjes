'use client';

import React, { useState, memo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '../types';
import { Button } from './Button';
import { useCart, useGuestCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { usePrefetch } from '../hooks/usePrefetch';
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
      if (!product.is_active || product.stock <= 0) return;

      setIsLoading(true);
      try {
        if (isAuthenticated) {
          await authenticatedCart.addItem(product.id, 1);
        } else {
          guestCart.addItem(product.id, 1);
        }

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (error) {
        console.error('Failed to add to cart:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [
      product.is_active,
      product.stock,
      product.id,
      isAuthenticated,
      authenticatedCart,
      guestCart,
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

  if (viewMode === 'list') {
    return (
      <div className={`card card-hover group relative flex ${className}`}>
        <Link
          href={`/shop/${product.id}`}
          className='flex w-full'
          onMouseEnter={handleLinkHover}
        >
          {/* Product Image */}
          <div className='relative w-30 h-full flex-shrink-0 overflow-hidden rounded-l-2xl bg-[#f5f2ee]'>
            {!imageError && product.images?.length ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt_text || product.name}
                fill
                sizes='112px'
                className='object-cover transition-transform duration-500 group-hover:scale-105'
                onError={handleImageError}
                priority={false}
                quality={85}
                placeholder='blur'
                blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7+H9v4++ADCmhzgMoOe+d1+dTSTBcV/9k='
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f5f2ee] to-[#e8e2d9]'>
                <span className='text-2xl'>🌸</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className='flex-1 p-4 flex flex-col justify-between min-h-[112px]'>
            <div>
              <h3 className='font-family-serif font-semibold text-lg text-[#2d2820] line-clamp-2 group-hover:text-[#d4a574] transition-colors duration-300'>
                {product.name}
              </h3>
              <p className='text-[#7d6b55] text-sm leading-relaxed line-clamp-2 mt-1'>
                {product.description}
              </p>
            </div>

            <div className='mt-3'>
              <div className='text-lg font-medium'>
                {formatPrice(product.price)}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className='flex flex-col justify-center p-4 min-h-[112px]'>
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
              className='min-h-[40px] px-4 mb-2'
            >
              {showSuccess ? 'Added!' : isOutOfStock ? 'N/A' : 'Add to Cart'}
            </Button>
            <div className='flex items-center justify-center gap-1 text-sm'>
              {isOutOfStock ? (
                <span className='text-red-600 font-medium'>
                  Niet beschikbaar
                </span>
              ) : (
                <>
                  <FiCheck className='w-4 h-4 text-green-600' />
                  <span>Beschikbaar</span>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* Stock Badge */}
        {isOutOfStock && (
          <div className='absolute top-3 left-3 z-10'>
            <span className='bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1'>
              <FiAlertCircle className='w-3 h-3' />
              N/A
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`card card-hover group relative ${className}`}>
      {/* Stock Badge */}
      {isOutOfStock && (
        <div className='absolute top-4 left-4 z-10'>
          <span className='bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1'>
            <FiAlertCircle className='w-4 h-4' />
            Niet beschikbaar
          </span>
        </div>
      )}
      <Link
        href={`/shop/${product.id}`}
        className='block'
        onMouseEnter={handleLinkHover}
      >
        {/* Product Image */}
        <div className='relative aspect-square overflow-hidden rounded-t-2xl bg-[#f5f2ee]'>
          {!imageError && product.images?.length ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt_text || product.name}
              fill
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
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
                <div className='w-16 h-16 mx-auto mb-4 bg-[#d6ccc0] rounded-full flex items-center justify-center'>
                  <span className='text-2xl'>🌸</span>
                </div>
                <p className='text-sm font-medium'>{product.name}</p>
              </div>
            </div>
          )}

          {/* Quick View Overlay */}
          <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
            <div className='flex space-x-3'>
              <button className='w-12 h-12 bg-white/90 hover:bg-white text-[#2d2820] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110'>
                <FiEye className='w-5 h-5' />
              </button>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className='p-6 flex flex-col gap-2'>
          <h3 className='font-family-serif font-semibold text-xl text-[#2d2820] line-clamp-2 group-hover:text-[#d4a574] transition-colors duration-300'>
            {product.name}
          </h3>

          <p className='text-[#7d6b55] text-sm leading-relaxed line-clamp-2'>
            {product.description}
          </p>

          {/* Product Type Badge */}
          <div>
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

          {/* Colors */}
          {product.colors?.length && (
            <div className='flex items-center gap-2 text-xs text-[#9a8470]'>
              <span>Kleuren:</span>
              <div className='flex gap-1'>
                {product.colors.slice(0, 4).map((color, index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border border-[#e8e2d9] ${getColorClass(color)}`}
                    title={translateColor(color)}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className='ml-1'>+{product.colors.length - 4}</span>
                )}
              </div>
            </div>
          )}

          {/* Size */}
          {product.size && (
            <div className='text-xs text-[#9a8470]'>
              Maat:{' '}
              <span className='text-[#7d6b55]'>
                {translateSize(product.size)}
              </span>
            </div>
          )}

          {/* Price and Status */}
          <div className='flex items-center justify-between mt-2 text-sm'>
            <div className='font-medium'>{formatPrice(product.price)}</div>
            <div className='flex items-center gap-1'>
              {isOutOfStock ? (
                <span className='text-red-600 font-medium'>
                  Niet beschikbaar
                </span>
              ) : (
                <>
                  <FiCheck className='w-4 h-4 text-green-600' />
                  <span>Beschikbaar</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
      {/* Action Buttons */}
      <div className='px-6 pb-6 mt-2'>
        <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
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
            className='flex-1 min-h-[44px]'
          >
            {showSuccess
              ? 'Toegevoegf aan winkelwagentje!'
              : isOutOfStock
                ? 'Niet beschikbaar'
                : 'Winkelwagentje'}
          </Button>
        </div>

        {/* Ask About Product */}
        <div className='mt-3'>
          <Link href={`/contact?product=${product.id}`}>
            <button className='w-full text-sm text-[#8b9dc3] hover:text-[#7a8bb0] transition-colors duration-300 font-medium'>
              {product.product_type === 'flower'
                ? 'Vraag over deze bloem'
                : 'Vraag over dit boeket'}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ProductCard, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.is_active === nextProps.product.is_active &&
    prevProps.className === nextProps.className &&
    prevProps.viewMode === nextProps.viewMode
  );
});
