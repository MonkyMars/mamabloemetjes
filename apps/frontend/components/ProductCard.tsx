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

    if (product.stock === 0) return;

    setIsLoading(true);
    try {
      onAddToCart?.(product);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist?.(product);
  };

  const isLowStock = product.stock < 10 && product.stock > 0;
  const isOutOfStock = product.stock === 0;

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
        aria-label={
          isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'
        }
      >
        <FiHeart
          className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`}
        />
      </button>

      {/* Stock Badge */}
      {(isLowStock || isOutOfStock) && (
        <div className='absolute top-4 left-4 z-10'>
          {isOutOfStock ? (
            <span className='bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1'>
              <FiAlertCircle className='w-4 h-4' />
              <span>Out of Stock</span>
            </span>
          ) : (
            <span className='bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1'>
              <FiAlertCircle className='w-4 h-4' />
              <span>Low Stock</span>
            </span>
          )}
        </div>
      )}

      <Link href={`/product/${product.id}`} className='block'>
        {/* Product Image */}
        <div className='relative aspect-square overflow-hidden rounded-t-2xl bg-[#f5f2ee]'>
          {!imageError ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
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
          {/* Category Badge */}
          <div className='mb-3'>
            <span className='badge badge-category capitalize'>
              {product.category}
            </span>
          </div>

          {/* Product Name */}
          <h3 className='font-serif font-semibold text-lg text-[#2d2820] mb-2 group-hover:text-[#d4a574] transition-colors duration-300 line-clamp-2'>
            {product.name}
          </h3>

          {/* Description */}
          <p className='text-[#7d6b55] text-sm mb-4 line-clamp-2 leading-relaxed'>
            {product.description}
          </p>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className='mb-4'>
              <div className='flex items-center space-x-2'>
                <span className='text-xs text-[#9a8470] font-medium'>
                  Colors:
                </span>
                <div className='flex space-x-1'>
                  {product.colors.slice(0, 3).map((color, index) => (
                    <div
                      key={index}
                      className='w-4 h-4 rounded-full border border-[#e8e2d9] bg-gradient-to-br from-[#ddb7ab] to-[#d4a574]'
                      title={color}
                    />
                  ))}
                  {product.colors.length > 3 && (
                    <span className='text-xs text-[#9a8470] ml-1'>
                      +{product.colors.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Size */}
          {product.size && (
            <div className='mb-4'>
              <span className='text-xs text-[#9a8470] font-medium capitalize'>
                Size: {product.size}
              </span>
            </div>
          )}

          {/* Price and Stock */}
          <div className='flex items-center justify-between mb-4'>
            <div className='price'>{formatPrice(product.price)}</div>
            <div className='text-sm text-[#7d6b55]'>
              {isOutOfStock ? (
                <span className='text-red-600 font-medium'>Out of Stock</span>
              ) : (
                <span className='flex items-center space-x-1'>
                  <FiCheck className='w-4 h-4 text-green-600' />
                  <span>{product.stock} in stock</span>
                </span>
              )}
            </div>
          </div>

          {/* Customizable Badge */}
          {product.isCustomizable && (
            <div className='mb-4'>
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#8b9dc3]/10 text-[#8b9dc3]'>
                ✨ Customizable
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Action Buttons */}
      <div className='px-6 pb-6'>
        <div className='flex space-x-3'>
          <Button
            variant='primary'
            size='md'
            fullWidth
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            loading={isLoading}
            leftIcon={!isLoading ? <FiShoppingBag className='w-4 h-4' /> : undefined}
            className='flex-1'
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>

          {product.isCustomizable && (
            <Link href={`/product/${product.id}?customize=true`}>
              <Button
                variant='outline'
                size='md'
                className='whitespace-nowrap'
              >
                Customize
              </Button>
            </Link>
          )}
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
