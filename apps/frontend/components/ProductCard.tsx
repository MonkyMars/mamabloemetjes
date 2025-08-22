'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '../types';
import { Button } from './Button';
import {
  FiHeart,
  FiShoppingBag,
  FiEye,
  FiAlertCircle,
  FiCheck,
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
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isInWishlist?: boolean;
  className?: string;
  viewMode?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  className = '',
  viewMode = 'grid',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.is_active) return;

    setIsLoading(true);
    try {
      onAddToCart?.(product);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist?.(product);
  };

  const isOutOfStock = !product.is_active;

  if (viewMode === 'list') {
    return (
      <div className={`card card-hover group relative flex ${className}`}>
        <Link href={`/shop/${product.id}`} className='flex w-full'>
          {/* Product Image */}
          <div className='relative w-30 h-full flex-shrink-0 overflow-hidden rounded-l-2xl bg-[#f5f2ee]'>
            {!imageError && product.images?.length ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt_text || product.name}
                fill
                sizes='112px'
                className='object-cover transition-transform duration-500 group-hover:scale-105'
                onError={() => setImageError(true)}
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
              <h3 className='font-serif font-semibold text-lg text-[#2d2820] line-clamp-2 group-hover:text-[#d4a574] transition-colors duration-300'>
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
              disabled={isOutOfStock}
              loading={isLoading}
              leftIcon={
                !isLoading ? <FiShoppingBag className='w-4 h-4' /> : undefined
              }
              className='min-h-[40px] px-4 mb-2'
            >
              {isOutOfStock ? 'N/A' : 'Toevoegen'}
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
      {/* Wishlist Button */}
      <button
        onClick={handleToggleWishlist}
        className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          isInWishlist
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-white/80 text-[#7d6b55] hover:bg-white hover:text-red-600'
        } backdrop-blur-sm shadow-md hover:shadow-lg transform hover:scale-110`}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <FiHeart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
      </button>

      {/* Stock Badge */}
      {isOutOfStock && (
        <div className='absolute top-4 left-4 z-10'>
          <span className='bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1'>
            <FiAlertCircle className='w-4 h-4' />
            Niet beschikbaar
          </span>
        </div>
      )}

      <Link href={`/shop/${product.id}`} className='block'>
        {/* Product Image */}
        <div className='relative aspect-square overflow-hidden rounded-t-2xl bg-[#f5f2ee]'>
          {!imageError && product.images?.length ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt_text || product.name}
              fill
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
              className='object-cover transition-transform duration-500 group-hover:scale-105'
              onError={() => setImageError(true)}
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
          <h3 className='font-serif font-semibold text-xl text-[#2d2820] line-clamp-2 group-hover:text-[#d4a574] transition-colors duration-300'>
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
            disabled={isOutOfStock}
            loading={isLoading}
            leftIcon={
              !isLoading ? <FiShoppingBag className='w-4 h-4' /> : undefined
            }
            className='flex-1 min-h-[44px]'
          >
            {isOutOfStock ? 'Niet beschikbaar' : 'Winkelwagen'}
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

export default ProductCard;
