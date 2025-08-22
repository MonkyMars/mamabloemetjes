'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductById } from '../../../data/product';
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
  FiCalendar,
  FiTag,
  FiMinus,
  FiPlus,
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
    const loadProduct = async () => {
      const productId = params.id as string;
      if (productId) {
        try {
          setIsLoading(true);
          const foundProduct = await getProductById(productId);
          setProduct(foundProduct);
        } catch (error) {
          console.error('Failed to load product:', error);
          setProduct(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProduct();
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

  // Get product images
  const productImages = product.images?.length
    ? product.images.map((img) => img.url)
    : ['/images/placeholder-flower.jpg'];

  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0];

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
              {primaryImage ? (
                <Image
                  width={500}
                  height={500}
                  src={productImages[selectedImage]}
                  alt={primaryImage.alt_text || product.name}
                  className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
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
            </div>

            {/* Image thumbnails */}
            {productImages.length > 1 && (
              <div className='flex space-x-2'>
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-[#d4a574]'
                        : 'border-[#e8e2d9] hover:border-[#d4a574]/50'
                    }`}
                  >
                    <Image
                      width={80}
                      height={80}
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      className='w-full h-full object-cover'
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className='space-y-6'>
            {/* Header */}
            <div>
              <div className='flex items-center space-x-2 mb-3'>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#d4a574]/10 text-[#d4a574]'>
                  <FiTag className='w-3 h-3 mr-1' />
                  {product.sku}
                </span>
                {product.is_active ? (
                  <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    <FiCheck className='w-3 h-3 mr-1' />
                    Available
                  </span>
                ) : (
                  <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                    Unavailable
                  </span>
                )}
              </div>

              <h1 className='heading-2 text-[#2d2820] mb-3'>{product.name}</h1>
              <div className='price text-3xl mb-4'>
                {formatPrice(product.price)}
              </div>
            </div>

            {/* Description */}
            <div className='prose prose-sm max-w-none text-[#7d6b55]'>
              <p>{product.description}</p>
            </div>

            {/* Product Info */}
            <div className='space-y-3 p-4 bg-[#f5f2ee] rounded-lg'>
              <div className='flex items-center space-x-2'>
                <FiCalendar className='w-4 h-4 text-[#9a8470]' />
                <span className='text-sm text-[#7d6b55]'>
                  Added: {new Date(product.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <FiRefreshCw className='w-4 h-4 text-[#9a8470]' />
                <span className='text-sm text-[#7d6b55]'>
                  Updated: {new Date(product.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-[#2d2820]'>
                Quantity
              </label>
              <div className='flex items-center space-x-3'>
                <button
                  onClick={() =>
                    setSelectedQuantity(Math.max(1, selectedQuantity - 1))
                  }
                  className='w-10 h-10 rounded-lg border border-[#e8e2d9] flex items-center justify-center hover:bg-[#f5f2ee] transition-colors'
                >
                  <FiMinus className='w-4 h-4' />
                </button>
                <span className='w-16 text-center font-medium text-lg'>
                  {selectedQuantity}
                </span>
                <button
                  onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                  className='w-10 h-10 rounded-lg border border-[#e8e2d9] flex items-center justify-center hover:bg-[#f5f2ee] transition-colors'
                >
                  <FiPlus className='w-4 h-4' />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='space-y-3'>
              <div className='flex space-x-4'>
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.is_active}
                  className='flex-1 flex items-center justify-center space-x-2'
                >
                  <FiShoppingBag className='w-4 h-4' />
                  <span>
                    {product.is_active ? 'Add to Cart' : 'Unavailable'}
                  </span>
                </Button>

                <button
                  onClick={handleToggleWishlist}
                  className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors ${
                    isWishlisted
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-[#e8e2d9] hover:bg-[#f5f2ee] text-[#7d6b55]'
                  }`}
                >
                  <FiHeart
                    className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`}
                  />
                </button>
              </div>

              <Button variant='outline' fullWidth>
                Ask about customization
              </Button>
            </div>

            {/* Trust Badges */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[#e8e2d9]'>
              <div className='flex items-center space-x-2'>
                <FiShield className='w-5 h-5 text-[#8b9dc3]' />
                <span className='text-sm text-[#7d6b55]'>
                  Quality Guaranteed
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <FiTruck className='w-5 h-5 text-[#8b9dc3]' />
                <span className='text-sm text-[#7d6b55]'>
                  Free Delivery €75+
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <FiHeart className='w-5 h-5 text-[#8b9dc3]' />
                <span className='text-sm text-[#7d6b55]'>Handcrafted</span>
              </div>
            </div>
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
