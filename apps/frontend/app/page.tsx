'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../components/Button';
import ProductCard from '../components/ProductCard';
import { getFeaturedProducts } from '../data/products';
import { Product } from '../types';
import {
  FiArrowRight,
  FiHeart,
  FiShoppingBag,
  FiCheckCircle,
  FiTruck,
  FiGift,
  FiAward,
} from 'react-icons/fi';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setIsLoading(true);
        const products = await getFeaturedProducts(8);
        setFeaturedProducts(products);
      } catch (error) {
        console.error('Failed to load featured products:', error);
        // Fallback to empty array if API fails
        setFeaturedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  const features = [
    {
      icon: <FiHeart className='w-6 h-6' />,
      title: 'Handgemaakt met liefde',
      description:
        'Elke bloem wordt zorgvuldig met de hand gemaakt van premium velvet materialen',
    },
    {
      icon: <FiCheckCircle className='w-6 h-6' />,
      title: 'Blijvende schoonheid',
      description:
        'Onze velvet bloemen behouden hun schoonheid jarenlang zonder te verwelken',
    },
    {
      icon: <FiGift className='w-6 h-6' />,
      title: 'Eigen ontwerpen',
      description:
        'Personaliseer je arrangementen voor elke speciale gelegenheid',
    },
    {
      icon: <FiTruck className='w-6 h-6' />,
      title: 'Gratis bezorging',
      description:
        'Gratis bezorging bij bestellingen vanaf €75 binnen Amsterdam',
    },
  ];

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
        {/* Background Image */}
        <div className='absolute inset-0 z-0'>
          <Image
            src='https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop&crop=center'
            alt='Beautiful velvet flowers'
            fill
            className='object-cover'
            priority
          />
          <div className='absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent'></div>
        </div>

        {/* Hero Content */}
        <div className='container relative z-10 text-center'>
          <div className='max-w-4xl mx-auto'>
            <h1 className='heading-1 text-white mb-6 animate-fade-in'>
              Handgemaakte Velvet Bloemen
              <span className='block text-[#e8c4a0] mt-2'>
                Die Voor Eeuwig Meegaan
              </span>
            </h1>
            <p className='text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed'>
              Ontdek onze collectie prachtige, op maat gemaakte velvet bloemen
              arrangementen. Perfect voor bruiloften, woondecoratie, en speciale
              gelegenheden.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              <Link href='/shop'>
                <Button
                  variant='primary'
                  size='lg'
                  rightIcon={<FiArrowRight className='w-5 h-5' />}
                  className='min-w-[200px]'
                >
                  Bekijk Collectie
                </Button>
              </Link>
              <Link href='/custom'>
                <Button
                  variant='outline'
                  size='lg'
                  className='min-w-[200px] border-white text-white hover:bg-white hover:text-[#2d2820]'
                >
                  Op Maat Bestellen
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce'>
          <div className='w-6 h-10 border-2 border-white rounded-full flex justify-center'>
            <div className='w-1 h-3 bg-white rounded-full mt-2 animate-pulse'></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='section bg-[#f5f2ee]'>
        <div className='container'>
          <div className='text-center mb-16'>
            <h2 className='heading-2 mb-4'>
              Waarom kiezen voor Mama Bloemetjes?
            </h2>
            <p className='text-lg text-[#7d6b55] max-w-2xl mx-auto'>
              Wij creëren blijvende herinneringen met bloemen die voor altijd
              mooi blijven
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features.map((feature, index) => (
              <div key={index} className='text-center group'>
                <div className='w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#d4a574] mx-auto mb-6 shadow-lg group-hover:shadow-xl transform group-hover:-translate-y-2 transition-all duration-300'>
                  {feature.icon}
                </div>
                <h3 className='heading-4 mb-3 text-[#2d2820]'>
                  {feature.title}
                </h3>
                <p className='text-[#7d6b55] leading-relaxed'>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className='section'>
        <div className='container'>
          <div className='flex items-center justify-between mb-12'>
            <div>
              <h2 className='heading-2 mb-4'>Uitgelichte Collectie</h2>
              <p className='text-lg text-[#7d6b55]'>
                Ontdek onze meest populaire handgemaakte arrangementen
              </p>
            </div>
            <Link href='/shop'>
              <Button
                variant='outline'
                rightIcon={<FiArrowRight className='w-4 h-4' />}
              >
                Bekijk Alles
              </Button>
            </Link>
          </div>

          <div className='product-grid'>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className='bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse'
                >
                  <div className='aspect-square bg-gray-200'></div>
                  <div className='p-6'>
                    <div className='h-4 bg-gray-200 rounded mb-2'></div>
                    <div className='h-3 bg-gray-200 rounded w-2/3 mb-4'></div>
                    <div className='h-6 bg-gray-200 rounded w-1/3'></div>
                  </div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(product) => {
                    console.log('Toegevoegd aan winkelwagen:', product.name);
                    // TODO: Implement cart functionality
                  }}
                  onToggleWishlist={(product) => {
                    console.log('Verlanglijst gewijzigd:', product.name);
                    // TODO: Implement wishlist functionality
                  }}
                />
              ))
            ) : (
              <div className='col-span-full text-center py-12'>
                <p className='text-[#7d6b55] text-lg'>
                  Op dit moment zijn er geen uitgelichte producten beschikbaar.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className='section bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] text-white'>
        <div className='container text-center'>
          <div className='max-w-3xl mx-auto'>
            <h2 className='text-4xl md:text-5xl font-serif font-bold mb-6'>
              Klaar om iets Moois te Creëren?
            </h2>
            <p className='text-xl mb-8 text-white/90 leading-relaxed'>
              Laat ons je helpen het perfecte velvet bloemenarrangement te maken
              voor jouw speciale moment. Of het nu een bruiloft, jubileum, of
              gewoon omdat het kan – wij zijn er om het onvergetelijk te maken.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/contact'>
                <Button
                  variant='secondary'
                  size='lg'
                  className='min-w-[200px] bg-white text-[#d4a574] hover:bg-white/90'
                >
                  Neem Contact Op
                </Button>
              </Link>
              <Link href='/shop'>
                <Button
                  variant='outline'
                  size='lg'
                  className='min-w-[200px] border-white text-white hover:bg-white hover:text-[#d4a574]'
                  rightIcon={<FiShoppingBag className='w-5 h-5' />}
                >
                  Begin met Winkelen
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className='mt-12 pt-8 border-t border-white/20'>
              <div className='flex flex-wrap justify-center items-center gap-8 text-white/80'>
                <div className='flex items-center space-x-2'>
                  <FiAward className='w-5 h-5' />
                  <span className='text-sm'>Handgemaakte Kwaliteit</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <FiTruck className='w-5 h-5' />
                  <span className='text-sm'>Gratis Bezorging €75+</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <FiCheckCircle className='w-5 h-5' />
                  <span className='text-sm'>Tevredenheid Gegarandeerd</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
