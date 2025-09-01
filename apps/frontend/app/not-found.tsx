'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import {
  FiHome,
  FiShoppingBag,
  FiHeart,
  FiMapPin,
  FiArrowRight,
} from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-[#faf9f7] via-[#f5f2ee] to-[#e8c4a0]/20 flex items-center justify-center px-4 py-16 relative overflow-hidden'>
      {/* Decorative floating elements */}
      <div className='absolute top-16 right-4 sm:right-1/4 w-12 sm:w-20 h-12 sm:h-20 bg-gradient-to-br from-[#d4a574]/15 to-[#e8c4a0]/10 rounded-full blur-xl sm:blur-2xl animate-[float_3s_ease-in-out_infinite]'></div>
      <div className='absolute bottom-20 left-4 sm:left-1/3 w-16 sm:w-28 h-16 sm:h-28 bg-gradient-to-br from-[#ddb7ab]/20 to-[#d4a574]/10 rounded-full blur-xl sm:blur-3xl animate-[float_3s_ease-in-out_infinite_1s]'></div>
      <div className='absolute top-1/2 right-2 sm:right-8 w-8 sm:w-16 h-8 sm:h-16 bg-gradient-to-br from-[#e8c4a0]/25 to-[#ddb7ab]/15 rounded-full blur-lg sm:blur-2xl animate-[float_3s_ease-in-out_infinite_2s]'></div>
      <div className='absolute top-1/4 left-8 w-6 sm:w-12 h-6 sm:h-12 bg-gradient-to-br from-[#8b9dc3]/20 to-[#d4a574]/15 rounded-full blur-lg animate-[float_3s_ease-in-out_infinite_0.5s]'></div>

      {/* Floating decorative cards */}
      <div className='hidden sm:block absolute top-20 left-12 bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-[#d4a574]/20 transform rotate-12 hover:rotate-6 transition-transform duration-700'>
        <FiHeart className='w-6 h-6 text-[#d4a574] mb-2' />
        <p className='text-xs text-[#7d6b55] font-medium'>Handgemaakt</p>
      </div>
      <div className='hidden md:block absolute bottom-32 right-16 bg-white/50 backdrop-blur-sm rounded-2xl p-3 shadow-soft border border-[#ddb7ab]/20 transform -rotate-6 hover:-rotate-3 transition-transform duration-700'>
        <FiMapPin className='w-5 h-5 text-[#ddb7ab]' />
      </div>

      {/* Main content */}
      <div className='container max-w-4xl mx-auto text-center relative z-10'>
        <div className='space-y-8 animate-[fadeInUp_0.8s_ease-out]'>
          {/* 404 Number with decorative styling */}
          <div className='relative'>
            <h1 className='text-8xl sm:text-9xl md:text-[12rem] font-bold text-[#d4a574]/20 font-family-serif leading-none select-none'>
              404
            </h1>
            <div className='absolute inset-0 flex items-center justify-center'>
              <span className='text-4xl sm:text-5xl md:text-6xl font-semibold text-[#2d2820] font-family-serif animate-[fadeInUp_0.8s_ease-out_0.2s_both]'>
                Bloem niet gevonden
              </span>
            </div>
          </div>

          {/* Description */}
          <div className='space-y-4 animate-[fadeInUp_0.8s_ease-out_0.4s_both]'>
            <p className='text-xl sm:text-2xl text-[#7d6b55] font-light'>
              Oeps! Deze pagina is verwelkt...
            </p>
            <p className='text-base sm:text-lg text-[#7d6b55] max-w-2xl mx-auto leading-relaxed px-4'>
              Het lijkt erop dat de pagina die je zoekt niet bestaat of is
              verplaatst. Maar maak je geen zorgen - onze prachtige vilt bloemen
              collectie bloeit nog steeds!
            </p>
          </div>

          {/* Action buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center px-4 animate-[fadeInUp_0.8s_ease-out_0.6s_both]'>
            <Link href='/' className='w-full sm:w-auto'>
              <Button
                variant='primary'
                size='lg'
                leftIcon={<FiHome className='w-5 h-5' />}
                className='w-full sm:min-w-[200px] h-12 sm:h-auto text-base sm:text-lg shadow-medium hover:shadow-strong hover:scale-105 transition-all duration-300'
              >
                Naar Startpagina
              </Button>
            </Link>
            <Link href='/shop' className='w-full sm:w-auto'>
              <Button
                variant='outline'
                size='lg'
                rightIcon={<FiShoppingBag className='w-5 h-5' />}
                className='w-full sm:min-w-[200px] h-12 sm:h-auto text-base sm:text-lg bg-white/60 backdrop-blur-md border-[#d4a574] text-[#d4a574] hover:bg-[#d4a574] hover:text-white shadow-soft hover:shadow-medium hover:scale-105 transition-all duration-300'
              >
                Bekijk Collectie
              </Button>
            </Link>
          </div>

          {/* Helpful links */}
          <div className='pt-8 animate-[fadeInUp_0.8s_ease-out_0.8s_both]'>
            <p className='text-sm text-[#7d6b55] mb-4'>
              Of misschien zoek je een van deze populaire pagina&qout;s?
            </p>
            <div className='flex flex-wrap justify-center gap-2 sm:gap-4'>
              <Link
                href='/shop'
                className='text-[#d4a574] hover:text-[#b8956a] transition-colors text-sm sm:text-base font-medium underline-offset-4 hover:underline'
              >
                Alle Bloemen
              </Link>
              <span className='text-[#7d6b55]/40'>•</span>
              <Link
                href='/contact'
                className='text-[#d4a574] hover:text-[#b8956a] transition-colors text-sm sm:text-base font-medium underline-offset-4 hover:underline'
              >
                Contact
              </Link>
              <span className='text-[#7d6b55]/40'>•</span>
              <Link
                href='/contact?type=custom'
                className='text-[#d4a574] hover:text-[#b8956a] transition-colors text-sm sm:text-base font-medium underline-offset-4 hover:underline'
              >
                Op Maat Bestellen
              </Link>
            </div>
          </div>

          {/* Featured message */}
          <div className='mt-12 bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-[#d4a574]/20 shadow-soft animate-[fadeInUp_0.8s_ease-out_1s_both]'>
            <div className='flex items-center justify-center space-x-3 mb-4'>
              <FiHeart className='w-6 h-6 text-[#d4a574]' />
              <h3 className='text-lg sm:text-xl font-medium text-[#2d2820] font-family-serif'>
                Handgemaakte Bloemen Die Voor Eeuwig Meegaan
              </h3>
            </div>
            <p className='text-[#7d6b55] text-sm sm:text-base leading-relaxed'>
              Ontdek onze unieke collectie vilt bloemen die de natuurlijke
              schoonheid vastleggen zonder ooit te verwelken. Perfect voor
              bruiloften, decoratie, en speciale momenten.
            </p>
            <div className='mt-6'>
              <Link href='/shop'>
                <Button
                  variant='ghost'
                  rightIcon={<FiArrowRight className='w-4 h-4' />}
                  className='text-[#d4a574] hover:text-[#b8956a] hover:bg-[#d4a574]/10'
                >
                  Ontdek de Collectie
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Additional decorative elements */}
      <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-[#d4a574]/30 to-transparent rounded-full'></div>
    </div>
  );
};

export default NotFound;
