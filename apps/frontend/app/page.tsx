'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import OptimizedImage from '@/components/OptimizedImage';
import { useFeaturedProducts } from '@/hooks/useProducts';
import {
  FiArrowRight,
  FiHeart,
  FiShoppingBag,
  FiCheckCircle,
  FiTruck,
  FiAward,
  FiPhone,
  FiMail,
  FiUsers,
  FiCalendar,
  FiStar,
} from 'react-icons/fi';

const HomePage: React.FC = () => {
  const {
    data: featuredProducts = [],
    isLoading,
    error,
  } = useFeaturedProducts(6);

  const customServices = [
    {
      icon: <FiHeart className='w-6 h-6' />,
      title: 'Bruidsbouquets',
      description:
        'Unieke, handgemaakte bruidsbouquets die perfect aansluiten bij jouw droomdag',
      occasions: ['Bruiloften', 'Verlovingen', 'Bruiloft fotoshoots'],
    },
    {
      icon: <FiUsers className='w-6 h-6' />,
      title: 'Memorial Arrangementen',
      description:
        'Respectvolle en blijvende herinneringen voor speciale momenten van afscheid',
      occasions: ['Condoleance', 'Herdenkingen', 'In memoriam'],
    },
    {
      icon: <FiCalendar className='w-6 h-6' />,
      title: 'Evenement Decoratie',
      description:
        'Complete bloemdecoratie voor jullie grote dag, van ceremonie tot receptie',
      occasions: ['Jubilea', 'Feesten', 'Bedrijfsevents'],
    },
  ];

  const features = [
    {
      icon: <FiHeart className='w-6 h-6' />,
      title: 'Persoonlijk Maatwerk',
      description:
        'Elk arrangement wordt speciaal voor jou ontworpen en met de hand gemaakt',
    },
    {
      icon: <FiCheckCircle className='w-6 h-6' />,
      title: 'Blijvende Schoonheid',
      description:
        'Onze vilt bloemen behouden hun perfecte vorm en kleur voor altijd',
    },
    {
      icon: <FiAward className='w-6 h-6' />,
      title: 'Vakmanschap',
      description: 'Jarenlange ervaring in het creëren van unieke bloemstukken',
    },
    {
      icon: <FiTruck className='w-6 h-6' />,
      title: 'Persoonlijke Service',
      description:
        'Van eerste consult tot bezorging, wij begeleiden je door het hele proces',
    },
  ];

  return (
    <div className='min-h-screen'>
      {/* Hero Section - Focus on Custom Bouquets */}
      <section className='relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#faf9f7] via-[#f5f2ee] to-[#e8c4a0]/20 px-4 pt-20 pb-16'>
        {/* Decorative elements */}
        <div className='absolute top-16 right-4 sm:right-1/4 w-12 sm:w-20 h-12 sm:h-20 bg-gradient-to-br from-[#d4a574]/15 to-[#e8c4a0]/10 rounded-full blur-xl sm:blur-2xl animate-[float_2s_ease-in-out_infinite]'></div>
        <div className='absolute bottom-20 left-4 sm:left-1/3 w-16 sm:w-28 h-16 sm:h-28 bg-gradient-to-br from-[#ddb7ab]/20 to-[#d4a574]/10 rounded-full blur-xl sm:blur-3xl animate-[float_2s_ease-in-out_infinite_0.5s]'></div>
        <div className='absolute top-1/2 right-2 sm:right-8 w-8 sm:w-16 h-8 sm:h-16 bg-gradient-to-br from-[#e8c4a0]/25 to-[#ddb7ab]/15 rounded-full blur-lg sm:blur-2xl animate-[float_2s_ease-in-out_infinite_1s]'></div>

        {/* Floating service cards */}
        <div className='hidden lg:block absolute top-16 right-12 bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-[#d4a574]/20 transform rotate-6 hover:rotate-3 transition-transform duration-700 animate-[slideInFromRight_0.8s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]'>
          <FiHeart className='w-6 h-6 text-[#d4a574] mb-2' />
          <p className='text-sm text-[#7d6b55] font-medium'>Bruidsbouquets</p>
          <p className='text-xs text-[#9a8470]'>Op maat gemaakt</p>
        </div>
        <div className='hidden lg:block absolute bottom-40 left-12 bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-[#ddb7ab]/20 transform -rotate-6 hover:-rotate-3 transition-transform duration-700 animate-[slideInFromLeft_0.9s_cubic-bezier(0.34,1.56,0.64,1)_0.4s_both]'>
          <FiUsers className='w-6 h-6 text-[#ddb7ab] mb-2' />
          <p className='text-sm text-[#7d6b55] font-medium'>Memorial</p>
          <p className='text-xs text-[#9a8470]'>Respectvol</p>
        </div>

        {/* Hero Content */}
        <div className='container relative z-20 text-center max-w-6xl'>
          <div className='space-y-6 md:space-y-8'>
            <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-[#2d2820] font-family-serif leading-tight animate-[fadeInUp_0.6s_ease-out_0.1s_both]'>
              <span className='block'>Maatwerk</span>
              <span className='block text-[#d4a574] mt-1 sm:mt-2 relative animate-[fadeInUp_0.6s_ease-out_0.3s_both]'>
                Bruidsbouquets
                <div className='absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2 w-16 sm:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-[#d4a574] to-[#ddb7ab] rounded-full animate-[slideInScale_0.8s_ease-out_0.5s_both]'></div>
              </span>
              <span className='block text-base sm:text-lg md:text-xl lg:text-2xl font-normal text-[#7d6b55] mt-2 sm:mt-4 animate-[fadeInUp_0.6s_ease-out_0.4s_both]'>
                & Memorial Arrangementen
              </span>
            </h1>

            <div className='relative animate-[fadeInUp_0.6s_ease-out_0.6s_both]'>
              <p className='text-base sm:text-lg mb-2 md:text-xl text-[#7d6b55] max-w-3xl mx-auto leading-relaxed px-4'>
                Ik specialiseer mij in het creëren van unieke, handgemaakte vilt
                bloemenarrangementen voor jullie belangrijkste momenten. Van
                droombruiloften tot respectvolle herinneringen
              </p>
            </div>

            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 animate-[fadeInUp_0.6s_ease-out_0.8s_both]'>
              <Link href='/contact?type=custom' className='w-full sm:w-auto'>
                <Button
                  variant='primary'
                  size='lg'
                  rightIcon={<FiHeart className='w-5 h-5' />}
                  className='w-full sm:min-w-[220px] h-12 sm:h-auto text-base sm:text-lg shadow-medium hover:shadow-strong transition-all duration-300'
                >
                  Maatwerk Aanvragen
                </Button>
              </Link>
              <Link href='/shop' className='w-full sm:w-auto'>
                <Button
                  variant='outline'
                  size='lg'
                  rightIcon={<FiShoppingBag className='w-5 h-5' />}
                  className='w-full sm:min-w-[200px] h-12 sm:h-auto text-base sm:text-lg bg-white/60 backdrop-blur-md border-[#d4a574] text-[#d4a574] hover:bg-[#d4a574] hover:text-white shadow-soft hover:shadow-medium transition-all duration-300'
                >
                  Bekijk Collectie
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className='mt-6 sm:mt-8 animate-[fadeInUp_0.6s_ease-out_0.9s_both]'>
              <div className='flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 text-[#7d6b55]/80 px-4'>
                <div className='flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-[#d4a574]/20'>
                  <FiStar className='w-4 h-4 text-[#d4a574] flex-shrink-0' />
                  <span className='text-xs sm:text-sm font-medium whitespace-nowrap'>
                    Persoonlijk maatwerk
                  </span>
                </div>
                <div className='flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-[#ddb7ab]/20'>
                  <FiCheckCircle className='w-4 h-4 text-[#ddb7ab] flex-shrink-0' />
                  <span className='text-xs sm:text-sm font-medium whitespace-nowrap'>
                    Gratis consultatie
                  </span>
                </div>
                <div className='flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-[#e8c4a0]/20'>
                  <FiHeart className='w-4 h-4 text-[#e8c4a0] flex-shrink-0' />
                  <span className='text-xs sm:text-sm font-medium whitespace-nowrap'>
                    Voor eeuwig mooi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className='hidden sm:block absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20'>
          <div className='w-6 h-10 border-2 border-[#d4a574] rounded-full flex justify-center bg-white/60 backdrop-blur-sm shadow-soft'>
            <div className='w-1 h-3 bg-[#d4a574] rounded-full mt-2 animate-pulse'></div>
          </div>
        </div>
      </section>

      {/* Custom Services Section - Primary Focus */}
      <section className='py-12 sm:py-16 md:py-20 lg:py-24 bg-[#f5f2ee]'>
        <div className='container px-4'>
          <div className='text-center mb-8 sm:mb-12 md:mb-16'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl text-[#2d2820] font-family-serif mb-3 sm:mb-4'>
              Onze Specialiteiten
            </h2>
            <p className='text-base sm:text-lg text-[#7d6b55] max-w-3xl mx-auto px-4'>
              Ik creëer betekenisvolle bloemstukken voor de belangrijkste
              momenten in jullie leven. Elk arrangement wordt persoonlijk
              ontworpen en met de hand gemaakt.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12'>
            {customServices.map((service, index) => (
              <div
                key={index}
                className='bg-white rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-medium transition-all duration-300 group border border-[#e8e2d9]'
              >
                <div className='w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] rounded-xl flex items-center justify-center text-white mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300'>
                  {service.icon}
                </div>
                <h3 className='text-lg sm:text-xl md:text-2xl font-medium text-[#2d2820] font-family-serif mb-2 sm:mb-3 text-center'>
                  {service.title}
                </h3>
                <p className='text-sm sm:text-base text-[#7d6b55] leading-relaxed mb-4 text-center'>
                  {service.description}
                </p>
                <div className='flex flex-wrap justify-center gap-2 mb-6'>
                  {service.occasions.map((occasion, idx) => (
                    <span
                      key={idx}
                      className='text-xs px-3 py-1 bg-[#f5f2ee] text-[#7d6b55] rounded-full border border-[#e8e2d9]'
                    >
                      {occasion}
                    </span>
                  ))}
                </div>
                <div className='text-center'>
                  <Link
                    href={
                      '/contact?type=custom&service=' +
                      service.title.toLowerCase()
                    }
                  >
                    <Button variant='outline' size='sm' className='text-sm'>
                      Vraag Offerte Aan
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className='text-center'>
            <div className='bg-white rounded-2xl p-6 sm:p-8 shadow-soft border border-[#e8e2d9] max-w-4xl mx-auto'>
              <h3 className='text-xl sm:text-2xl font-medium text-[#2d2820] font-family-serif mb-4'>
                Hoe werkt het?
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-6'>
                <div className='text-center'>
                  <div className='w-10 h-10 bg-[#d4a574] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-semibold'>
                    1
                  </div>
                  <h4 className='font-medium text-[#2d2820] mb-2'>
                    Consultatie
                  </h4>
                  <p className='text-sm text-[#7d6b55]'>
                    Vertel ons over jullie wensen en dromen
                  </p>
                </div>
                <div className='text-center'>
                  <div className='w-10 h-10 bg-[#d4a574] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-semibold'>
                    2
                  </div>
                  <h4 className='font-medium text-[#2d2820] mb-1'>Ontwerp</h4>
                  <p className='text-sm text-[#7d6b55]'>
                    Ik maak een uniek ontwerp speciaal voor jullie
                  </p>
                </div>
                <div className='text-center'>
                  <div className='w-10 h-10 bg-[#d4a574] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-semibold'>
                    3
                  </div>
                  <h4 className='font-medium text-[#2d2820] mb-2'>Creatie</h4>
                  <p className='text-sm text-[#7d6b55]'>
                    Handgemaakt met liefde en aandacht voor detail
                  </p>
                </div>
              </div>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <Link href='/contact?type=custom'>
                  <Button
                    variant='primary'
                    leftIcon={<FiPhone className='w-4 h-4' />}
                  >
                    Start Gratis Consultatie
                  </Button>
                </Link>
                <Link href='/contact?type=custom'>
                  <Button
                    variant='outline'
                    leftIcon={<FiMail className='w-4 h-4' />}
                  >
                    Stuur een Bericht
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bridal Bouquet Showcase Section */}
      <section className='py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-white to-[#faf9f7]'>
        <div className='container px-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center'>
            <div className='order-2 lg:order-1'>
              <h2 className='text-2xl sm:text-3xl md:text-4xl text-[#2d2820] font-family-serif mb-4 sm:mb-6'>
                Jouw Droombruiloft Verdient het Perfecte Bouquet
              </h2>
              <p className='text-base sm:text-lg text-[#7d6b55] leading-relaxed mb-6'>
                Van klassiek romantisch tot modern en uniek; ik creëer het
                bruidsbouquet dat perfect past bij jullie stijl en
                persoonlijkheid. De vilt bloemen behouden hun perfecte vorm en
                kleuren, zodat jullie deze herinneringen voor altijd kunnen
                koesteren.
              </p>
              <div className='space-y-4 mb-8'>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#d4a574] mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-medium text-[#2d2820] mb-1'>
                      Volledig Gepersonaliseerd
                    </h4>
                    <p className='text-sm text-[#7d6b55]'>
                      Kleurenschema, grootte en stijl aangepast aan jullie
                      wensen
                    </p>
                  </div>
                </div>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#d4a574] mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-medium text-[#2d2820] mb-1'>
                      Blijvende Herinnering
                    </h4>
                    <p className='text-sm text-[#7d6b55]'>
                      Geen verwelking - jullie bouquet blijft altijd mooi
                    </p>
                  </div>
                </div>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#d4a574] mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-medium text-[#2d2820] mb-1'>
                      Compleet Arrangement
                    </h4>
                    <p className='text-sm text-[#7d6b55]'>
                      Inclusief corsages, boutonnières en ceremonie decoratie
                    </p>
                  </div>
                </div>
              </div>
              <Link href='/contact?type=custom&service=bruidsbouquet'>
                <Button
                  variant='primary'
                  size='lg'
                  rightIcon={<FiArrowRight className='w-5 h-5' />}
                  className='shadow-medium hover:shadow-strong hover:scale-105 transition-all duration-300'
                >
                  Plan Bruiloft Consultatie
                </Button>
              </Link>
            </div>
            <div className='order-1 lg:order-2'>
              <div className='relative'>
                {/* Bridal bouquet image */}
                <div className='aspect-[4/5] rounded-2xl overflow-hidden shadow-strong bg-gradient-to-br from-[#faf9f7] to-[#f5f2ee]'>
                  <OptimizedImage
                    src='/images/bridal-bouquet-placeholder.svg'
                    alt='Handgemaakte bruidsbouquet van vilt bloemen'
                    fill={true}
                    className='object-cover'
                    sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw'
                  />
                </div>
                {/* Decorative elements */}
                <div className='absolute -top-4 -right-4 w-8 h-8 bg-[#d4a574]/20 rounded-full animate-pulse'></div>
                <div className='absolute -bottom-4 -left-4 w-12 h-12 bg-[#ddb7ab]/20 rounded-full animate-pulse'></div>
                {/* Floating badges */}
                <div className='absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-medium'>
                  <div className='flex items-center space-x-2'>
                    <FiHeart className='w-4 h-4 text-[#d4a574]' />
                    <span className='text-xs font-medium text-[#2d2820]'>
                      Maatwerk
                    </span>
                  </div>
                </div>
                <div className='absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-medium'>
                  <div className='flex items-center space-x-2'>
                    <FiCheckCircle className='w-4 h-4 text-[#ddb7ab]' />
                    <span className='text-xs font-medium text-[#2d2820]'>
                      Voor Altijd
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom vs Ready-Made Comparison Section */}
      <section className='py-12 sm:py-16 md:py-20 lg:py-24 bg-white'>
        <div className='container px-4'>
          <div className='text-center mb-8 sm:mb-12 md:mb-16'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl text-[#2d2820] font-family-serif mb-3 sm:mb-4'>
              Twee Manieren om Jouw Perfecte Arrangement te Krijgen
            </h2>
            <p className='text-base sm:text-lg text-[#7d6b55] max-w-3xl mx-auto px-4'>
              Of je nu op zoek bent naar een volledig gepersonaliseerd maatwerk
              arrangement of inspiratie wilt halen uit mijn ready-to-buy
              collectie
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12'>
            {/* Custom Work - Primary */}
            <div className='bg-gradient-to-br from-[#d4a574]/10 to-[#ddb7ab]/10 rounded-2xl p-6 sm:p-8 border-2 border-[#d4a574] relative overflow-hidden'>
              <div className='absolute top-4 right-4 bg-[#d4a574] text-white px-3 py-1 rounded-full text-xs font-medium'>
                AANBEVOLEN
              </div>
              <div className='mb-6'>
                <div className='w-16 h-16 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] rounded-xl flex items-center justify-center text-white mb-4'>
                  <FiHeart className='w-8 h-8' />
                </div>
                <h3 className='text-xl sm:text-2xl font-semibold text-[#2d2820] font-family-serif mb-2'>
                  Maatwerk Arrangementen
                </h3>
                <p className='text-sm text-[#7d6b55] mb-4'>
                  Perfect voor bruiloften, memorials en speciale gelegenheden
                </p>
              </div>

              <div className='space-y-3 mb-6'>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#d4a574] mt-0.5 flex-shrink-0' />
                  <span className='text-sm text-[#2d2820]'>
                    Volledig gepersonaliseerd ontwerp
                  </span>
                </div>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#d4a574] mt-0.5 flex-shrink-0' />
                  <span className='text-sm text-[#2d2820]'>
                    Gratis design consultatie
                  </span>
                </div>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#d4a574] mt-0.5 flex-shrink-0' />
                  <span className='text-sm text-[#2d2820]'>
                    Aangepaste kleuren en stijlen
                  </span>
                </div>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#d4a574] mt-0.5 flex-shrink-0' />
                  <span className='text-sm text-[#2d2820]'>
                    Perfecte match met jullie thema
                  </span>
                </div>
              </div>

              <Link href='/contact?type=custom'>
                <Button
                  variant='primary'
                  size='lg'
                  fullWidth
                  rightIcon={<FiArrowRight className='w-5 h-5' />}
                >
                  Start Gratis Consultatie
                </Button>
              </Link>
            </div>

            {/* Ready-Made - Secondary */}
            <div className='bg-[#f5f2ee] rounded-2xl p-6 sm:p-8 border border-[#e8e2d9]'>
              <div className='mb-6'>
                <div className='w-16 h-16 bg-[#7d6b55] rounded-xl flex items-center justify-center text-white mb-4'>
                  <FiShoppingBag className='w-8 h-8' />
                </div>
                <h3 className='text-xl sm:text-2xl font-semibold text-[#2d2820] font-family-serif mb-2'>
                  Ready-to-Buy Collectie
                </h3>
                <p className='text-sm text-[#7d6b55] mb-4'>
                  Prachtige arrangementen die direct leverbaar zijn
                </p>
              </div>

              <div className='space-y-3 mb-6'>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#7d6b55] mt-0.5 flex-shrink-0' />
                  <span className='text-sm text-[#2d2820]'>
                    Direct beschikbaar
                  </span>
                </div>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#7d6b55] mt-0.5 flex-shrink-0' />
                  <span className='text-sm text-[#2d2820]'>
                    Snelle levering
                  </span>
                </div>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#7d6b55] mt-0.5 flex-shrink-0' />
                  <span className='text-sm text-[#2d2820]'>
                    Inspiratie voor maatwerk
                  </span>
                </div>
                <div className='flex items-start space-x-3'>
                  <FiCheckCircle className='w-5 h-5 text-[#7d6b55] mt-0.5 flex-shrink-0' />
                  <span className='text-sm text-[#2d2820]'>
                    Aanpasbaar op verzoek
                  </span>
                </div>
              </div>

              <Link href='/shop'>
                <Button
                  variant='outline'
                  size='lg'
                  fullWidth
                  rightIcon={<FiArrowRight className='w-5 h-5' />}
                >
                  Bekijk Collectie
                </Button>
              </Link>
            </div>
          </div>

          <div className='text-center mt-8 sm:mt-12'>
            <p className='text-sm text-[#7d6b55] italic'>
              💡 Tip: Zie je iets moois in onze collectie? We kunnen het
              aanpassen voor jouw speciale gelegenheid!
            </p>
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
              Ik combineer vakmanschap met persoonlijke aandacht voor elk uniek
              verhaal
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

      {/* Ready-Made Products Section - Secondary */}
      <section className='py-12 sm:py-16 md:py-20 lg:py-24'>
        <div className='container px-4'>
          <div className='text-center mb-8 sm:mb-12'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl text-[#2d2820] font-family-serif mb-4'>
              Ready-to-Buy Collectie
            </h2>
            <p className='text-base sm:text-lg text-[#7d6b55] max-w-3xl mx-auto px-4'>
              Naast maatwerk bied ik ook een selectie prachtige, kant-en-klare
              arrangementen voor directe levering of als inspiratie voor jouw
              custom ontwerp.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8'>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
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
                  Op dit moment zijn er geen producten beschikbaar.
                </p>
              </div>
            )}
          </div>

          <div className='text-center mt-8 sm:mt-12'>
            <Link href='/shop'>
              <Button
                variant='outline'
                size='lg'
                rightIcon={<FiArrowRight className='w-4 h-4' />}
                className='text-sm sm:text-base'
              >
                Bekijk Volledige Collectie
              </Button>
            </Link>
            <p className='text-sm text-[#7d6b55] mt-4'>
              Alle items kunnen aangepast worden naar jouw wensen
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className='py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] text-white'>
        <div className='container text-center px-4'>
          <div className='max-w-4xl mx-auto'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-family-serif font-bold mb-4 sm:mb-6 leading-tight'>
              Laten We Jouw Dromen Werkelijkheid Maken
            </h2>
            <p className='text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 leading-relaxed px-4 sm:px-0'>
              Of het nu gaat om jullie perfecte bruiloft, een betekenisvol
              memorial arrangement, of een ander speciaal moment - ik ben er om
              jullie verhaal tot leven te brengen met handgemaakte vilt bloemen
              die voor altijd meegaan.
            </p>
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto'>
              <Link href='/contact?type=custom' className='w-full sm:w-auto'>
                <Button
                  variant='secondary'
                  size='lg'
                  leftIcon={<FiHeart className='w-5 h-5' />}
                  className='w-full sm:min-w-[220px] h-12 sm:h-auto text-base sm:text-lg bg-white text-[#d4a574] hover:bg-white/90'
                >
                  Start Gratis Consultatie
                </Button>
              </Link>
              <Link href='/shop' className='w-full sm:w-auto'>
                <Button
                  variant='outline'
                  size='lg'
                  className='w-full sm:min-w-[200px] h-12 sm:h-auto text-base sm:text-lg border-white text-white hover:bg-white hover:text-[#d4a574]'
                  rightIcon={<FiShoppingBag className='w-5 h-5' />}
                >
                  Bekijk Inspiratie
                </Button>
              </Link>
            </div>

            <div className='mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/20'>
              <div className='flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 text-white/80'>
                <div className='flex items-center space-x-2'>
                  <FiStar className='w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0' />
                  <span className='text-xs sm:text-sm whitespace-nowrap'>
                    Persoonlijk Maatwerk
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <FiCheckCircle className='w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0' />
                  <span className='text-xs sm:text-sm whitespace-nowrap'>
                    Gratis Consultatie
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <FiHeart className='w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0' />
                  <span className='text-xs sm:text-sm whitespace-nowrap'>
                    Voor Eeuwig Mooi
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
