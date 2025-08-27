'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { useFeaturedProducts } from '@/hooks/useProducts';
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
      <section className='relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#faf9f7] via-[#f5f2ee] to-[#e8c4a0]/20 px-4 pt-20 pb-16'>
        {/* Mobile-optimized decorative elements */}
        <div className='absolute top-16 right-4 sm:right-1/4 w-12 sm:w-20 h-12 sm:h-20 bg-gradient-to-br from-[#d4a574]/15 to-[#e8c4a0]/10 rounded-full blur-xl sm:blur-2xl animate-[float_2s_ease-in-out_infinite]'></div>
        <div className='absolute bottom-20 left-4 sm:left-1/3 w-16 sm:w-28 h-16 sm:h-28 bg-gradient-to-br from-[#ddb7ab]/20 to-[#d4a574]/10 rounded-full blur-xl sm:blur-3xl animate-[float_2s_ease-in-out_infinite_0.5s]'></div>
        <div className='absolute top-1/2 right-2 sm:right-8 w-8 sm:w-16 h-8 sm:h-16 bg-gradient-to-br from-[#e8c4a0]/25 to-[#ddb7ab]/15 rounded-full blur-lg sm:blur-2xl animate-[float_2s_ease-in-out_infinite_1s]'></div>

        {/* Mobile-friendly floating cards */}
        <div className='hidden sm:block absolute top-16 md:top-24 right-8 lg:right-12 bg-white/60 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-soft border border-[#d4a574]/20 transform rotate-6 hover:rotate-3 transition-transform duration-700 animate-[slideInFromRight_0.8s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]'>
          <FiHeart className='w-5 md:w-6 h-5 md:h-6 text-[#d4a574] mb-2' />
          <p className='text-xs text-[#7d6b55] font-medium'>Handgemaakt</p>
        </div>
        <div className='hidden sm:block absolute bottom-32 md:bottom-40 left-8 lg:left-12 bg-white/60 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-soft border border-[#ddb7ab]/20 transform -rotate-6 hover:-rotate-3 transition-transform duration-700 animate-[slideInFromLeft_0.9s_cubic-bezier(0.34,1.56,0.64,1)_0.4s_both]'>
          <FiAward className='w-5 md:w-6 h-5 md:h-6 text-[#ddb7ab] mb-2' />
          <p className='text-xs text-[#7d6b55] font-medium'>Premium</p>
        </div>
        <div className='hidden md:block absolute top-1/2 left-6 lg:left-8 bg-white/50 backdrop-blur-sm rounded-2xl p-3 shadow-soft border border-[#e8c4a0]/20 transform rotate-12 hover:rotate-6 transition-transform duration-700 animate-[slideInFromLeft_0.7s_cubic-bezier(0.34,1.56,0.64,1)_0.6s_both]'>
          <FiGift className='w-4 lg:w-5 h-4 lg:h-5 text-[#e8c4a0]' />
        </div>

        {/* Hero Content - Mobile First */}
        <div className='container relative z-20 text-center max-w-6xl'>
          <div className='space-y-6 md:space-y-8'>
            <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-[#2d2820] font-family-serif leading-tight animate-[fadeInUp_0.6s_ease-out_0.1s_both]'>
              <span className='block'>Handgemaakte</span>
              <span className='block text-[#d4a574] mt-1 sm:mt-2 relative animate-[fadeInUp_0.6s_ease-out_0.3s_both]'>
                Vilt Bloemen
                <div className='absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2 w-16 sm:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-[#d4a574] to-[#ddb7ab] rounded-full animate-[slideInScale_0.8s_ease-out_0.5s_both]'></div>
              </span>
              <span className='block text-base sm:text-lg md:text-xl lg:text-2xl font-normal text-[#7d6b55] mt-2 sm:mt-4 animate-[fadeInUp_0.6s_ease-out_0.4s_both]'>
                Die Voor Eeuwig Meegaan
              </span>
            </h1>

            <div className='relative animate-[fadeInUp_0.6s_ease-out_0.6s_both]'>
              <p className='text-base sm:text-lg md:text-xl text-[#7d6b55] max-w-2xl mx-auto leading-relaxed px-4'>
                Ontdek onze collectie prachtige, op maat gemaakte vilt bloemen
                arrangementen. Perfect voor bruiloften, woondecoratie, en
                speciale gelegenheden.
              </p>
            </div>

            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 animate-[fadeInUp_0.6s_ease-out_0.8s_both]'>
              <Link href='/shop' className='w-full sm:w-auto'>
                <Button
                  variant='primary'
                  size='lg'
                  rightIcon={<FiArrowRight className='w-5 h-5' />}
                  className='w-full sm:min-w-[200px] h-12 sm:h-auto text-base sm:text-lg shadow-medium hover:shadow-strong hover:scale-105 transition-all duration-300'
                >
                  Bekijk Collectie
                </Button>
              </Link>
              <Link href='/contact?type=custom' className='w-full sm:w-auto'>
                <Button
                  variant='outline'
                  size='lg'
                  className='w-full sm:min-w-[200px] h-12 sm:h-auto text-base sm:text-lg bg-white/60 backdrop-blur-md border-[#d4a574] text-[#d4a574] hover:bg-[#d4a574] hover:text-white shadow-soft hover:shadow-medium hover:scale-105 transition-all duration-300'
                >
                  Op Maat Bestellen
                </Button>
              </Link>
            </div>

            {/* Enhanced Trust indicators - Mobile optimized */}
            <div className='mt-6 sm:mt-8 animate-[fadeInUp_0.6s_ease-out_0.9s_both]'>
              <div className='flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 text-[#7d6b55]/80 px-4'>
                <div className='flex items-center space-x-2 bg-white/40 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-[#d4a574]/20'>
                  <FiCheckCircle className='w-4 h-4 text-[#d4a574] flex-shrink-0' />
                  <span className='text-xs sm:text-sm font-medium whitespace-nowrap'>
                    Gratis bezorging €75+
                  </span>
                </div>
                <div className='flex items-center space-x-2 bg-white/40 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-[#ddb7ab]/20'>
                  <FiAward className='w-4 h-4 text-[#ddb7ab] flex-shrink-0' />
                  <span className='text-xs sm:text-sm font-medium whitespace-nowrap'>
                    Handgemaakte kwaliteit
                  </span>
                </div>
                <div className='flex items-center space-x-2 bg-white/40 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-[#e8c4a0]/20'>
                  <FiHeart className='w-4 h-4 text-[#e8c4a0] flex-shrink-0' />
                  <span className='text-xs sm:text-sm font-medium whitespace-nowrap'>
                    Voor eeuwig mooi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator - Hidden on mobile */}
        <div className='hidden sm:block absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20'>
          <div className='w-6 h-10 border-2 border-[#d4a574] rounded-full flex justify-center bg-white/60 backdrop-blur-sm shadow-soft'>
            <div className='w-1 h-3 bg-[#d4a574] rounded-full mt-2 animate-pulse'></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-12 sm:py-16 md:py-20 lg:py-24 bg-[#f5f2ee]'>
        <div className='container px-4'>
          <div className='text-center mb-8 sm:mb-12 md:mb-16'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl text-[#2d2820] font-family-serif mb-3 sm:mb-4'>
              Waarom kiezen voor Mama Bloemetjes?
            </h2>
            <p className='text-base sm:text-lg text-[#7d6b55] max-w-2xl mx-auto px-4'>
              Wij creëren blijvende herinneringen met bloemen die voor altijd
              mooi blijven
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8'>
            {features.map((feature, index) => (
              <div key={index} className='text-center group p-4 sm:p-0'>
                <div className='w-14 sm:w-16 h-14 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-[#d4a574] mx-auto mb-4 sm:mb-6 shadow-lg group-hover:shadow-xl transform group-hover:-translate-y-2 transition-all duration-300'>
                  {feature.icon}
                </div>
                <h3 className='text-lg sm:text-xl md:text-2xl font-medium text-[#2d2820] font-family-serif mb-2 sm:mb-3'>
                  {feature.title}
                </h3>
                <p className='text-sm sm:text-base text-[#7d6b55] leading-relaxed px-2 sm:px-0'>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className='py-12 sm:py-16 md:py-20 lg:py-24'>
        <div className='container px-4'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-8 sm:mb-12'>
            <div className='text-center sm:text-left'>
              <h2 className='text-2xl sm:text-3xl md:text-4xl text-[#2d2820] font-family-serif mb-2 sm:mb-4'>
                Uitgelichte Collectie
              </h2>
              <p className='text-base sm:text-lg text-[#7d6b55] px-4 sm:px-0'>
                Ontdek onze meest populaire handgemaakte arrangementen
              </p>
            </div>
            <Link href='/shop' className='self-center sm:self-auto'>
              <Button
                variant='outline'
                rightIcon={<FiArrowRight className='w-4 h-4' />}
                className='text-sm sm:text-base'
              >
                Bekijk Alles
              </Button>
            </Link>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            ) : error ? (
              <div className='col-span-full text-center py-8 sm:py-12 px-4'>
                <p className='text-red-600 text-base sm:text-lg mb-4'>
                  Er is een fout opgetreden bij het laden van de producten.
                </p>
                <Button
                  variant='outline'
                  onClick={() => window.location.reload()}
                  className='text-sm sm:text-base'
                >
                  Probeer opnieuw
                </Button>
              </div>
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className='col-span-full text-center py-8 sm:py-12 px-4'>
                <p className='text-[#7d6b55] text-base sm:text-lg'>
                  Op dit moment zijn er geen uitgelichte producten beschikbaar.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className='py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] text-white'>
        <div className='container text-center px-4'>
          <div className='max-w-4xl mx-auto'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-family-serif font-bold mb-4 sm:mb-6 leading-tight'>
              Klaar om iets Moois te Creëren?
            </h2>
            <p className='text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 leading-relaxed px-4 sm:px-0'>
              Laat ons je helpen het perfecte vilt bloemenarrangement te maken
              voor jouw speciale moment. Of het nu een bruiloft, jubileum, of
              gewoon omdat het kan – wij zijn er om het onvergetelijk te maken.
            </p>
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto'>
              <Link href='/contact' className='w-full sm:w-auto'>
                <Button
                  variant='secondary'
                  size='lg'
                  className='w-full sm:min-w-[200px] h-12 sm:h-auto text-base sm:text-lg bg-white text-[#d4a574] hover:bg-white/90'
                >
                  Neem Contact Op
                </Button>
              </Link>
              <Link href='/shop' className='w-full sm:w-auto'>
                <Button
                  variant='outline'
                  size='lg'
                  className='w-full sm:min-w-[200px] h-12 sm:h-auto text-base sm:text-lg border-white text-white hover:bg-white hover:text-[#d4a574]'
                  rightIcon={<FiShoppingBag className='w-5 h-5' />}
                >
                  Begin met Winkelen
                </Button>
              </Link>
            </div>

            {/* Trust Badges - Mobile optimized */}
            <div className='mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/20'>
              <div className='flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 text-white/80'>
                <div className='flex items-center space-x-2'>
                  <FiAward className='w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0' />
                  <span className='text-xs sm:text-sm whitespace-nowrap'>
                    Handgemaakte Kwaliteit
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <FiTruck className='w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0' />
                  <span className='text-xs sm:text-sm whitespace-nowrap'>
                    Gratis Bezorging €75+
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <FiCheckCircle className='w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0' />
                  <span className='text-xs sm:text-sm whitespace-nowrap'>
                    Tevredenheid Gegarandeerd
                  </span>
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
