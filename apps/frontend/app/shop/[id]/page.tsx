'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductById } from '../../../data/products';
import { Product } from '../../../types';
import { Button } from '../../../components/Button';
import { useCart, useGuestCart } from '../../../hooks/useCart';
import { useAuth } from '../../../context/AuthContext';
import {
  FiHeart,
  FiShoppingBag,
  FiArrowLeft,
  FiCheck,
  FiTruck,
  FiShield,
  FiRefreshCw,
  FiMinus,
  FiPlus,
  FiLoader,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  translateColor,
  translateSize,
  getColorClass,
  getProductTypeIcon,
  getProductTypeDescription,
} from '../../../lib/translations';
import Image from 'next/image';
import Link from 'next/link';
import { NextPage } from 'next';

const ProductComponent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const authenticatedCart = useCart();
  const guestCart = useGuestCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    try {
      if (isAuthenticated) {
        await authenticatedCart.addItem(product.id, selectedQuantity);
      } else {
        guestCart.addItem(product.id, selectedQuantity);
      }

      setAddToCartSuccess(true);
      setTimeout(() => setAddToCartSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
  };

  const isOutOfStock = product && product.stock <= 0;
  const maxQuantity = product ? Math.min(product.stock, 10) : 1;

  if (isLoading) {
    return (
      <div className='min-h-screen pt-24 pb-16 flex items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <FiLoader className='animate-spin w-5 h-5 text-primary-500' />
          <span>Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='min-h-screen pt-24 pb-16 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='heading-3 mb-4'>Product not found</h1>
          <p className='text-neutral-600 mb-8'>
            The product you&qout;re looking for doesn&qout;t exist or has been
            removed.
          </p>
          <Button onClick={() => router.push('/shop')}>Back to Shop</Button>
        </div>
      </div>
    );
  }

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
          className='flex items-center space-x-2 text-neutral-600 hover:text-primary-500 transition-colors mb-8'
        >
          <FiArrowLeft className='w-4 h-4' />
          <span>Back</span>
        </button>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
          {/* Product Images */}
          <div className='space-y-4'>
            <div className='aspect-square rounded-lg overflow-hidden bg-neutral-100'>
              {primaryImage ? (
                <Image
                  width={500}
                  height={500}
                  src={productImages[selectedImage]}
                  alt={primaryImage.alt_text || product.name}
                  className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center'>
                  <FiShoppingBag className='w-16 h-16 text-neutral-300' />
                </div>
              )}
            </div>

            {/* Image thumbnails */}
            {productImages.length > 1 && (
              <div className='flex space-x-2 overflow-x-auto'>
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-primary-500'
                        : 'border-neutral-200 hover:border-neutral-300'
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
            )}
          </div>

          {/* Product Details */}
          <div className='space-y-6'>
            {/* Header */}
            <div>
              <div className='flex flex-wrap items-center gap-2 mb-4'>
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
                {product.is_active && !isOutOfStock ? (
                  <span className='flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    <FiCheck className='w-3 h-3 mr-1' />
                    In Stock
                  </span>
                ) : (
                  <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                    Out of Stock
                  </span>
                )}
              </div>

              <h1 className='heading-2 text-neutral-900 mb-3'>
                {product.name}
              </h1>
              <div className='text-3xl font-bold text-primary-600 mb-4'>
                {formatPrice(product.price)}
              </div>
              <p className='text-sm text-neutral-600'>SKU: {product.sku}</p>
            </div>

            {/* Description */}
            <div className='prose prose-sm max-w-none text-neutral-700'>
              <p>{product.description}</p>
            </div>

            {/* Product Properties */}
            <div className='space-y-4 p-4 bg-neutral-50 rounded-lg'>
              <h3 className='text-sm font-medium text-neutral-900'>
                Product Details:
              </h3>

              {/* Colors Display */}
              {product.colors && product.colors.length > 0 && (
                <div className='space-y-2'>
                  <h4 className='text-xs font-medium text-neutral-600 uppercase tracking-wide'>
                    Colors:
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {product.colors.map((color, index) => (
                      <div key={index} className='flex items-center space-x-2'>
                        <div
                          className={`w-5 h-5 rounded-full border border-neutral-300 ${getColorClass(color)}`}
                          title={translateColor(color)}
                        />
                        <span className='text-sm text-neutral-700'>
                          {translateColor(color)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Display */}
              {product.size && (
                <div className='space-y-2'>
                  <h4 className='text-xs font-medium text-neutral-600 uppercase tracking-wide'>
                    Size:
                  </h4>
                  <span className='inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-white border border-neutral-300'>
                    {translateSize(product.size)}
                  </span>
                </div>
              )}

              {/* Stock Info */}
              <div className='space-y-2'>
                <h4 className='text-xs font-medium text-neutral-600 uppercase tracking-wide'>
                  Availability:
                </h4>
                <p className='text-sm text-neutral-700'>
                  {isOutOfStock ? (
                    <span className='text-red-600'>Out of stock</span>
                  ) : product.stock <= 5 ? (
                    <span className='text-amber-600'>
                      Only {product.stock} left in stock
                    </span>
                  ) : (
                    <span className='text-green-600'>In stock</span>
                  )}
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-900'>
                  Quantity:
                </label>
                <div className='flex items-center space-x-3'>
                  <button
                    onClick={() =>
                      setSelectedQuantity(Math.max(1, selectedQuantity - 1))
                    }
                    disabled={selectedQuantity <= 1}
                    className='w-10 h-10 rounded-lg border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <FiMinus className='w-4 h-4' />
                  </button>
                  <span className='w-16 text-center font-medium text-lg'>
                    {selectedQuantity}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedQuantity(
                        Math.min(maxQuantity, selectedQuantity + 1),
                      )
                    }
                    disabled={selectedQuantity >= maxQuantity}
                    className='w-10 h-10 rounded-lg border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <FiPlus className='w-4 h-4' />
                  </button>
                </div>
                {selectedQuantity >= maxQuantity && (
                  <p className='text-xs text-amber-600'>
                    Maximum quantity available: {maxQuantity}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className='space-y-3'>
              <div className='flex space-x-4'>
                <Button
                  onClick={handleAddToCart}
                  disabled={
                    !product.is_active || isOutOfStock || isAddingToCart
                  }
                  className='flex-1 flex items-center justify-center space-x-2'
                  variant='primary'
                >
                  {isAddingToCart ? (
                    <FiLoader className='w-4 h-4 animate-spin' />
                  ) : addToCartSuccess ? (
                    <FiCheckCircle className='w-4 h-4' />
                  ) : (
                    <FiShoppingBag className='w-4 h-4' />
                  )}
                  <span>
                    {isAddingToCart
                      ? 'Adding...'
                      : addToCartSuccess
                        ? 'Added!'
                        : isOutOfStock
                          ? 'Out of Stock'
                          : !product.is_active
                            ? 'Not Available'
                            : product.product_type === 'flower'
                              ? 'Add to Bouquet'
                              : 'Add to Cart'}
                  </span>
                </Button>

                <button
                  onClick={handleToggleWishlist}
                  className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors ${
                    isWishlisted
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-neutral-300 hover:bg-neutral-50 text-neutral-600'
                  }`}
                >
                  <FiHeart
                    className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`}
                  />
                </button>
              </div>

              {addToCartSuccess && (
                <div className='flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg'>
                  <div className='flex items-center space-x-2'>
                    <FiCheckCircle className='w-5 h-5 text-green-600' />
                    <span className='text-sm font-medium text-green-800'>
                      Added to cart successfully!
                    </span>
                  </div>
                  <Link href='/cart'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-green-700 hover:text-green-800'
                    >
                      View Cart
                    </Button>
                  </Link>
                </div>
              )}

              <Link href={`/contact?product=${product.id}`}>
                <Button variant='outline' fullWidth>
                  Ask about this product
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className='grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200'>
              <div className='text-center'>
                <FiShield className='w-6 h-6 text-green-500 mx-auto mb-2' />
                <p className='text-xs text-neutral-600'>Secure Payment</p>
              </div>
              <div className='text-center'>
                <FiTruck className='w-6 h-6 text-blue-500 mx-auto mb-2' />
                <p className='text-xs text-neutral-600'>Free Shipping €75+</p>
              </div>
              <div className='text-center'>
                <FiRefreshCw className='w-6 h-6 text-purple-500 mx-auto mb-2' />
                <p className='text-xs text-neutral-600'>14-Day Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products or Additional Info could go here */}
      </div>
    </div>
  );
};

const ProductPage: NextPage = () => {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen pt-24 pb-16 flex items-center justify-center'>
          <div className='flex items-center space-x-2'>
            <FiLoader className='animate-spin w-5 h-5 text-primary-500' />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <ProductComponent />
    </Suspense>
  );
};

export default ProductPage;
