'use client';

import React from 'react';

interface ProductCardSkeletonProps {
  viewMode?: 'grid' | 'list';
  className?: string;
}

const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  viewMode = 'grid',
  className = '',
}) => {
  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse ${className}`}>
        <div className="flex">
          {/* Image Skeleton */}
          <div className="w-28 h-28 bg-gray-200 flex-shrink-0"></div>

          {/* Content Skeleton */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded mb-1 w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="mt-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>

          {/* Action Button Skeleton */}
          <div className="flex flex-col justify-center p-4">
            <div className="h-10 bg-gray-200 rounded-lg mb-2 w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse ${className}`}>
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200"></div>

      {/* Content Skeleton */}
      <div className="p-6">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded mb-3 w-4/5"></div>

        {/* Description */}
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>

        {/* Badge */}
        <div className="h-6 bg-gray-200 rounded-full w-20 mb-3"></div>

        {/* Colors */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 bg-gray-200 rounded w-12"></div>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* Size */}
        <div className="h-3 bg-gray-200 rounded w-16 mb-4"></div>

        {/* Price and Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="h-11 bg-gray-200 rounded-lg mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
