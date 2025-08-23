'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../components/Button';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { useFeaturedProducts } from '../hooks/useProducts';
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
  const {
    data: featuredProducts = [],
    isLoading,
    error,
  } = useFeaturedProducts(8);

  const features = [
    {
      icon: <FiHeart className='w-6 h-6' />,
      title: 'Handgemaakt met liefde',
      description:
        'Elke bloem wordt zorgvuldig met de hand gemaakt van premium vilt materialen',
    },
    {
      icon: <FiCheckCircle className='w-6 h-6' />,
      title: 'Blijvende schoonheid',
      description:
        'Onze vilt bloemen behouden hun schoonheid jarenlang zonder te verwelken',
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
      <section className='relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#faf9f7] via-[#f5f2ee] to-[#e8c4a0]/20'>
        {/* Decorative Elements */}
        <div className='absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-[#d4a574]/25 to-[#ddb7ab]/15 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-32 right-16 w-48 h-48 bg-gradient-to-br from-[#ddb7ab]/20 to-[#d4a574]/15 rounded-full blur-3xl'></div>
        <div className='absolute top-1/3 right-20 w-24 h-24 bg-gradient-to-br from-[#e8c4a0]/30 to-[#d4a574]/20 rounded-full blur-2xl'></div>
        <div className='absolute bottom-1/4 left-20 w-36 h-36 bg-gradient-to-br from-[#ddb7ab]/25 to-[#e8c4a0]/15 rounded-full blur-3xl'></div>

        {/* Floating Cards */}
        <div className='absolute top-24 right-12 bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-[#d4a574]/20 transform rotate-6 hover:rotate-3 transition-transform duration-700'>
          <FiHeart className='w-6 h-6 text-[#d4a574] mb-2' />
          <p className='text-xs text-[#7d6b55] font-medium'>Handgemaakt</p>
        </div>
        <div className='absolute bottom-40 left-12 bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-[#ddb7ab]/20 transform -rotate-6 hover:-rotate-3 transition-transform duration-700'>
          <FiAward className='w-6 h-6 text-[#ddb7ab] mb-2' />
          <p className='text-xs text-[#7d6b55] font-medium'>Premium</p>
        </div>
        <div className='absolute top-1/2 left-8 bg-white/50 backdrop-blur-sm rounded-2xl p-3 shadow-soft border border-[#e8c4a0]/20 transform rotate-12 hover:rotate-6 transition-transform duration-700'>
          <FiGift className='w-5 h-5 text-[#e8c4a0]' />
        </div>

        {/* Hero Content */}
        <div className='container relative z-20 text-center'>
          <div className='max-w-4xl mx-auto'>
            <h1 className='heading-1 text-[#2d2820] mb-6 animate-fade-in relative font-family-serif'>
              Handgemaakte Vilt Bloemen
              <span className='block text-[#d4a574] mt-2 relative'>
                Die Voor Eeuwig Meegaan
                <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-[#d4a574] to-[#ddb7ab] rounded-full'></div>
              </span>
            </h1>

            <div className='relative mb-8'>
              <p className='text-xl text-[#7d6b55] max-w-2xl mx-auto leading-relaxed'>
                Ontdek onze collectie prachtige, op maat gemaakte vilt bloemen
                arrangementen. Perfect voor bruiloften, woondecoratie, en
                speciale gelegenheden.
              </p>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-8'>
              <Link href='/shop'>
                <Button
                  variant='primary'
                  size='lg'
                  rightIcon={<FiArrowRight className='w-5 h-5' />}
                  className='min-w-[200px] shadow-medium hover:shadow-strong hover:scale-105 transition-all duration-300'
                >
                  Bekijk Collectie
                </Button>
              </Link>
              <Link href='/contact?type=custom'>
                <Button
                  variant='outline'
                  size='lg'
                  className='min-w-[200px] bg-white/60 backdrop-blur-md border-[#d4a574] text-[#d4a574] hover:bg-[#d4a574] hover:text-white shadow-soft hover:shadow-medium hover:scale-105 transition-all duration-300'
                >
                  Op Maat Bestellen
                </Button>
              </Link>
            </div>

            {/* Enhanced Trust indicators */}
            <div className='mt-8 mb-12'>
              <div className='flex flex-wrap justify-center items-center gap-6 text-[#7d6b55]/80'>
                <div className='flex items-center space-x-2 bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-[#d4a574]/20'>
                  <FiCheckCircle className='w-4 h-4 text-[#d4a574]' />
                  <span className='text-sm font-medium'>
                    Gratis bezorging €75+
                  </span>
                </div>
                <div className='flex items-center space-x-2 bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-[#ddb7ab]/20'>
                  <FiAward className='w-4 h-4 text-[#ddb7ab]' />
                  <span className='text-sm font-medium'>
                    Handgemaakte kwaliteit
                  </span>
                </div>
                <div className='flex items-center space-x-2 bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-[#e8c4a0]/20'>
                  <FiHeart className='w-4 h-4 text-[#e8c4a0]' />
                  <span className='text-sm font-medium'>Voor eeuwig mooi</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20'>
          <div className='w-6 h-10 border-2 border-[#d4a574] rounded-full flex justify-center bg-white/60 backdrop-blur-sm shadow-soft'>
            <div className='w-1 h-3 bg-[#d4a574] rounded-full mt-2 animate-pulse'></div>
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
                <ProductCardSkeleton key={index} />
              ))
            ) : error ? (
              <div className='col-span-full text-center py-12'>
                <p className='text-red-600 text-lg mb-4'>
                  Er is een fout opgetreden bij het laden van de producten.
                </p>
                <Button
                  variant='outline'
                  onClick={() => window.location.reload()}
                >
                  Probeer opnieuw
                </Button>
              </div>
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
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
            <h2 className='text-4xl md:text-5xl font-family-serif font-bold mb-6'>
              Klaar om iets Moois te Creëren?
            </h2>
            <p className='text-xl mb-8 text-white/90 leading-relaxed'>
              Laat ons je helpen het perfecte vilt bloemenarrangement te maken
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
