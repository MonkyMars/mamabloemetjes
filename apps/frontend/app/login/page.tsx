'use client';

import React from 'react';
import { LoginForm } from '../../components/auth/LoginForm';
import FloatingElements from '../../components/FloatingElements';

export default function LoginPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 relative overflow-hidden'>
      {/* Background decorative elements */}
      <FloatingElements />

      {/* Background pattern */}
      <div className='absolute inset-0 opacity-20'>
        <div className='absolute top-20 left-10 w-32 h-32 bg-primary-200 rounded-full blur-3xl'></div>
        <div className='absolute top-40 right-20 w-48 h-48 bg-secondary-200 rounded-full blur-3xl'></div>
        <div className='absolute bottom-32 left-1/4 w-40 h-40 bg-accent-200 rounded-full blur-3xl'></div>
        <div className='absolute bottom-20 right-10 w-56 h-56 bg-primary-100 rounded-full blur-3xl'></div>
      </div>

      {/* Content */}
      <div className='relative z-10 flex items-center justify-center min-h-screen px-4 py-12'>
        <div className='w-full max-w-md'>
          {/* Logo/Brand section */}
          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full shadow-lg mb-4'>
              <span className='text-white font-serif font-bold text-2xl'>
                M
              </span>
            </div>
            <h1 className='text-2xl font-serif font-bold text-neutral-900 mb-2'>
              Mama Bloemetjes
            </h1>
            <p className='text-neutral-600'>Handgemaakte Vilt Bloemen</p>
          </div>

          {/* Login Form */}
          <LoginForm className='fade-in' redirectTo='/' />
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className='absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500'></div>
    </div>
  );
}
