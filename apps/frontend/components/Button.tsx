'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[#d4a574] hover:bg-[#b8956a] text-white shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:ring-[#d4a574]/20',
        secondary:
          'bg-[#8b9dc3] hover:bg-[#7a8bb0] text-white shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:ring-[#8b9dc3]/20',
        accent:
          'bg-[#ddb7ab] hover:bg-[#c9a196] text-white shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:ring-[#ddb7ab]/20',
        outline:
          'border-2 border-[#d4a574] text-[#d4a574] hover:bg-[#d4a574] hover:text-white focus:ring-[#d4a574]/20',
        ghost:
          'text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee] focus:ring-[#d4a574]/20',
        link: 'text-[#d4a574] underline-offset-4 hover:underline focus:ring-[#d4a574]/20',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:ring-red-600/20',
      },
      size: {
        sm: 'h-9 px-4 py-2 text-sm',
        md: 'h-11 px-6 py-3 text-base',
        lg: 'h-13 px-8 py-4 text-lg',
        xl: 'h-15 px-10 py-5 text-xl',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className='animate-spin -ml-1 mr-2 h-4 w-4'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
        )}
        {!loading && leftIcon && (
          <span className='mr-2 flex-shrink-0'>{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className='ml-2 flex-shrink-0'>{rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
