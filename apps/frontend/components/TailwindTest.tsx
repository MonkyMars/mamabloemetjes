'use client';

import React from 'react';

const TailwindTest: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-primary-500 mb-6">
        Tailwind v4 Test
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Colors Test */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            Basic Colors
          </h2>
          <div className="space-y-2">
            <div className="w-full h-8 bg-primary-500 rounded"></div>
            <div className="w-full h-8 bg-secondary-500 rounded"></div>
            <div className="w-full h-8 bg-accent-500 rounded"></div>
            <div className="w-full h-8 bg-neutral-500 rounded"></div>
          </div>
        </div>

        {/* Typography Test */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            Typography
          </h2>
          <div className="space-y-2">
            <p className="font-sans text-sm text-neutral-600">Sans Font (Inter)</p>
            <p className="font-serif text-lg text-neutral-800">Serif Font (Playfair)</p>
            <p className="text-primary-600 font-medium">Primary Color Text</p>
          </div>
        </div>

        {/* Spacing Test */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            Custom Spacing
          </h2>
          <div className="space-y-4">
            <div className="w-18 h-8 bg-primary-200 rounded"></div>
            <div className="w-88 h-4 bg-secondary-200 rounded"></div>
          </div>
        </div>

        {/* Border Radius Test */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            Custom Border Radius
          </h2>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-accent-300 rounded-xl"></div>
            <div className="w-16 h-16 bg-accent-400 rounded-2xl"></div>
            <div className="w-16 h-16 bg-accent-500 rounded-3xl"></div>
          </div>
        </div>

        {/* Shadow Test */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            Custom Shadows
          </h2>
          <div className="space-y-4">
            <div className="w-20 h-12 bg-primary-100 rounded-lg shadow-soft"></div>
            <div className="w-20 h-12 bg-primary-200 rounded-lg shadow-medium"></div>
            <div className="w-20 h-12 bg-primary-300 rounded-lg shadow-strong"></div>
          </div>
        </div>

        {/* Component Classes Test */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            Custom Components
          </h2>
          <div className="space-y-3">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
            <button className="btn-outline">Outline Button</button>
            <button className="btn-ghost">Ghost Button</button>
          </div>
        </div>
      </div>

      {/* Responsive Test */}
      <div className="mt-8 bg-gradient-to-r from-primary-500 to-secondary-500 p-6 rounded-2xl text-white">
        <h2 className="text-2xl font-bold mb-4">Responsive Test</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-white/20 p-4 rounded-lg text-center">
            <span className="block sm:hidden">Mobile</span>
            <span className="hidden sm:block md:hidden">Small</span>
            <span className="hidden md:block lg:hidden">Medium</span>
            <span className="hidden lg:block">Large</span>
          </div>
        </div>
      </div>

      {/* Animation Test */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">
          Animations
        </h2>
        <div className="space-y-4">
          <div className="w-20 h-20 bg-primary-500 rounded-lg fade-in"></div>
          <div className="w-20 h-20 bg-secondary-500 rounded-lg slide-up"></div>
          <div className="w-20 h-20 bg-accent-500 rounded-lg scale-in"></div>
        </div>
      </div>

      {/* Status */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
          ✅ If you can see all styled elements above, Tailwind v4 is working correctly!
        </div>
      </div>
    </div>
  );
};

export default TailwindTest;
