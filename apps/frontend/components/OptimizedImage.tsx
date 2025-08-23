'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  className?: string;
  fallbackSrc?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes = '100vw',
  priority = false,
  quality = 85,
  className = '',
  fallbackSrc,
  placeholder = 'blur',
  blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7+H9v4++ADCmhzgMoOe+d1+dTSTBcV/9k=',
  onLoad,
  onError,
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
    onError?.();
  }, [onError]);

  // If there's an error and we have a fallback, show fallback
  if (error && fallbackSrc) {
    return (
      <OptimizedImage
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        quality={quality}
        className={className}
        onLoad={onLoad}
        onError={onError}
        placeholder='empty'
      />
    );
  }

  // If there's an error and no fallback, show placeholder
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#f5f2ee] to-[#e8e2d9] ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <div className='text-center text-[#9a8470]'>
          <div className='w-16 h-16 mx-auto mb-2 bg-[#d6ccc0] rounded-full flex items-center justify-center'>
            <span className='text-2xl'>🌸</span>
          </div>
          <p className='text-xs font-medium'>Afbeelding niet beschikbaar</p>
        </div>
      </div>
    );
  }

  const imageProps = {
    src,
    alt,
    quality,
    className: `transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`,
    onLoad: handleLoad,
    onError: handleError,
    placeholder,
    blurDataURL,
    priority,
    ...(fill ? { fill: true, sizes } : { width, height }),
  };

  return <Image {...imageProps} alt={alt} />;
};

export default OptimizedImage;
