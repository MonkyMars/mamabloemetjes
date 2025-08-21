'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductById } from '../../../data/products';
import { Product } from '../../../types';
import { Button } from '../../../components/Button';
import {
  FiHeart,
  FiShoppingBag,
  FiArrowLeft,
  FiCheck,
  FiTruck,
  FiShield,
  FiRefreshCw,
} from 'react-icons/fi';
import Image from 'next/image';
import { NextPage } from 'next';

const ProductComponent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const productId = params.id as string;
    if (productId) {
      const foundProduct = getProductById(productId);
      setProduct(foundProduct || null);
      setIsLoading(false);
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className='min-h-screen pt-24 pb-16'>
        <div className='container'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-32 mb-8'></div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
              <div className='h-96 bg-gray-200 rounded-lg'></div>
              <div className='space-y-4'>
                <div className='h-8 bg-gray-200 rounded w-3/4'></div>
                <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                <div className='h-6 bg-gray-200 rounded w-1/4'></div>
                <div className='h-20 bg-gray-200 rounded'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='min-h-screen pt-24 pb-16'>
        <div className='container text-center'>
          <h1 className='text-2xl font-bold text-[#2d2820] mb-4'>
            Product Not Found
          </h1>
          <p className='text-[#7d6b55] mb-8'>
            The product you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push('/shop')}>Back to Shop</Button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleAddToCart = () => {
    // TODO: Implement cart functionality
    console.log('Added to cart:', { product, quantity: selectedQuantity });
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
  };

  const getStockStatus = () => {
    if (product.stock === 0) {
      return { text: 'Out of Stock', color: 'text-red-600' };
    } else if (product.stock < 5) {
      return { text: `Only ${product.stock} left!`, color: 'text-orange-600' };
    } else {
      return { text: 'In Stock', color: 'text-green-600' };
    }
  };

  const stockStatus = getStockStatus();

  // Mock additional images - in a real app, these would come from the product data
  const productImages = [
    product.imageUrl,
    product.imageUrl, // Duplicate for demo - would be different angles
    product.imageUrl,
  ];

  return (
    <div className='min-h-screen pt-24 pb-16'>
      <div className='container'>
        {/* Breadcrumb */}
        <button
          onClick={() => router.back()}
          className='flex items-center space-x-2 text-[#7d6b55] hover:text-[#d4a574] transition-colors mb-8'
        >
          <FiArrowLeft className='w-4 h-4' />
          <span>Back</span>
        </button>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
          {/* Product Images */}
          <div className='space-y-4'>
            <div className='aspect-square rounded-lg overflow-hidden bg-[#f5f2ee]'>
              <Image
                width={500}
                height={500}
                src={productImages[selectedImage]}
                alt={product.name}
                className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
              />
            </div>

            {/* Image thumbnails */}
            <div className='flex space-x-2'>
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? 'border-[#d4a574]'
                      : 'border-[#e8e2d9] hover:border-[#d4a574]'
                  }`}
                >
                  <Image
                    width={80}
                    height={80}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className='w-full h-full object-cover'
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className='space-y-6'>
            {/* Category */}
            <div className='text-sm text-[#d4a574] font-medium uppercase tracking-wide'>
              {product.category}
            </div>

            {/* Title */}
            <h1 className='text-3xl font-bold text-[#2d2820] font-serif'>
              {product.name}
            </h1>

            {/* Price */}
            <div className='text-2xl font-bold text-[#d4a574]'>
              {formatPrice(product.price)}
            </div>

            {/* Stock Status */}
            <div className={`text-sm font-medium ${stockStatus.color}`}>
              {stockStatus.text}
            </div>

            {/* Description */}
            <div className='prose prose-gray max-w-none'>
              <p className='text-[#7d6b55] leading-relaxed'>
                {product.description}
              </p>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className='text-sm font-medium text-[#2d2820] mb-2'>
                  Colors
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {product.colors.map((color) => (
                    <span
                      key={color}
                      className='px-3 py-1 text-xs font-medium bg-[#f5f2ee] text-[#7d6b55] rounded-full'
                    >
                      {color.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {product.size && (
              <div>
                <h3 className='text-sm font-medium text-[#2d2820] mb-2'>
                  Size
                </h3>
                <span className='px-3 py-1 text-sm font-medium bg-[#f5f2ee] text-[#7d6b55] rounded-full capitalize'>
                  {product.size}
                </span>
              </div>
            )}

            {/* Occasions */}
            {product.occasion && product.occasion.length > 0 && (
              <div>
                <h3 className='text-sm font-medium text-[#2d2820] mb-2'>
                  Perfect For
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {product.occasion.map((occasion) => (
                    <span
                      key={occasion}
                      className='px-3 py-1 text-xs font-medium bg-[#e8e2d9] text-[#7d6b55] rounded-full'
                    >
                      {occasion.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Customizable */}
            {product.isCustomizable && (
              <div className='flex items-center space-x-2 text-[#d4a574]'>
                <FiCheck className='w-4 h-4' />
                <span className='text-sm font-medium'>Customizable design</span>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <h3 className='text-sm font-medium text-[#2d2820] mb-2'>
                Quantity
              </h3>
              <div className='flex items-center space-x-3'>
                <button
                  onClick={() =>
                    setSelectedQuantity(Math.max(1, selectedQuantity - 1))
                  }
                  className='w-8 h-8 rounded-full border border-[#e8e2d9] hover:border-[#d4a574] flex items-center justify-center transition-colors'
                  disabled={selectedQuantity <= 1}
                >
                  -
                </button>
                <span className='w-12 text-center font-medium'>
                  {selectedQuantity}
                </span>
                <button
                  onClick={() =>
                    setSelectedQuantity(
                      Math.min(product.stock, selectedQuantity + 1),
                    )
                  }
                  className='w-8 h-8 rounded-full border border-[#e8e2d9] hover:border-[#d4a574] flex items-center justify-center transition-colors'
                  disabled={selectedQuantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className='flex space-x-4'>
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className='flex-1 flex items-center justify-center space-x-2'
              >
                <FiShoppingBag className='w-4 h-4' />
                <span>Add to Cart</span>
              </Button>

              <button
                onClick={handleToggleWishlist}
                className={`p-3 rounded-lg border transition-colors ${
                  isWishlisted
                    ? 'border-[#d4a574] text-[#d4a574] bg-[#f5f2ee]'
                    : 'border-[#e8e2d9] text-[#7d6b55] hover:border-[#d4a574] hover:text-[#d4a574]'
                }`}
              >
                <FiHeart
                  className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`}
                />
              </button>
            </div>

            {/* Features */}
            <div className='border-t border-[#e8e2d9] pt-6 space-y-3'>
              <div className='flex items-center space-x-3 text-sm text-[#7d6b55]'>
                <FiTruck className='w-4 h-4' />
                <span>Free delivery on orders over €75</span>
              </div>
              <div className='flex items-center space-x-3 text-sm text-[#7d6b55]'>
                <FiShield className='w-4 h-4' />
                <span>Handcrafted with premium materials</span>
              </div>
              <div className='flex items-center space-x-3 text-sm text-[#7d6b55]'>
                <FiRefreshCw className='w-4 h-4' />
                <span>30-day satisfaction guarantee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className='mt-16'>
          <h2 className='text-2xl font-bold text-[#2d2820] font-serif mb-8'>
            You might also like
          </h2>
          <div className='text-center text-[#7d6b55]'>
            <p>Related products coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductPage: NextPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductComponent />
    </Suspense>
  );
};

export default ProductPage;
