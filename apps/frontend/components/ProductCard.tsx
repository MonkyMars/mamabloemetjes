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

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isInWishlist?: boolean;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.is_active) return;

    setIsLoading(true);
    try {
      onAddToCart?.(product);
      // Simulate API call
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
          <span className='bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1'>
            <FiAlertCircle className='w-4 h-4' />
            <span>Unavailable</span>
          </span>
        </div>
      )}

      <Link href={`/shop/${product.id}`} className='block'>
        {/* Product Image */}
        <div className='relative aspect-square overflow-hidden rounded-t-2xl bg-[#f5f2ee]'>
          {!imageError && product.images && product.images.length > 0 ? (
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
        <div className='p-6'>
          {/* SKU Badge */}
          <div className='mb-3'>
            <span className='badge badge-category'>{product.sku}</span>
          </div>

          {/* Product Name */}
          <h3 className='font-serif font-semibold text-lg text-[#2d2820] mb-2 group-hover:text-[#d4a574] transition-colors duration-300 line-clamp-2'>
            {product.name}
          </h3>

          {/* Description */}
          <p className='text-[#7d6b55] text-sm mb-4 line-clamp-2 leading-relaxed'>
            {product.description}
          </p>

          {/* Created Date */}
          <div className='mb-4'>
            <span className='text-xs text-[#9a8470] font-medium'>
              Added: {new Date(product.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Price and Status */}
          <div className='flex items-center justify-between mb-4'>
            <div className='price'>{formatPrice(product.price)}</div>
            <div className='text-sm text-[#7d6b55]'>
              {isOutOfStock ? (
                <span className='text-red-600 font-medium'>Unavailable</span>
              ) : (
                <span className='flex items-center space-x-1'>
                  <FiCheck className='w-4 h-4 text-green-600' />
                  <span>Available</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className='px-6'>
        <div className='flex space-x-3'>
          <Button
            variant='primary'
            size='md'
            fullWidth
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            loading={isLoading}
            leftIcon={
              !isLoading ? <FiShoppingBag className='w-4 h-4' /> : undefined
            }
            className='flex-1'
          >
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </Button>

          <Link href={`/shop/${product.id}?customize=true`}>
            <Button variant='outline' size='md' className='whitespace-nowrap'>
              Customize
            </Button>
          </Link>
        </div>

        {/* Ask About Product */}
        <div className='mt-3'>
          <Link href={`/contact?product=${product.id}`}>
            <button className='w-full text-sm text-[#8b9dc3] hover:text-[#7a8bb0] transition-colors duration-300 font-medium'>
              Ask about this bouquet
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
