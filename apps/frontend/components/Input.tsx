'use client';

import React, { forwardRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';
import { FiEye, FiEyeOff, FiAlertCircle, FiCheck } from 'react-icons/fi';

const inputVariants = cva(
  'w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-400',
  {
    variants: {
      variant: {
        default:
          'border-neutral-200 bg-white text-neutral-900 focus:border-primary-500 focus:ring-primary-500/20 hover:border-neutral-300',
        error:
          'border-red-500 bg-white text-neutral-900 focus:border-red-500 focus:ring-red-500/20',
        success:
          'border-green-500 bg-white text-neutral-900 focus:border-green-500 focus:ring-green-500/20',
      },
      size: {
        sm: 'h-10 px-3 py-2 text-sm',
        md: 'h-12 px-4 py-3 text-base',
        lg: 'h-14 px-5 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const labelVariants = cva(
  'block text-sm font-medium mb-2 transition-colors duration-300',
  {
    variants: {
      variant: {
        default: 'text-neutral-700',
        error: 'text-red-600',
        success: 'text-green-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = 'text',
      label,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      disabled,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Determine the actual input type
    const inputType =
      showPasswordToggle && type === 'password'
        ? isPasswordVisible
          ? 'text'
          : 'password'
        : type;

    // Determine variant based on error/success state
    const currentVariant = error ? 'error' : success ? 'success' : variant;

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    const hasLeftIcon = leftIcon !== undefined;
    const hasRightIcon =
      rightIcon !== undefined || showPasswordToggle || error || success;

    return (
      <div className='w-full'>
        {label && (
          <label className={cn(labelVariants({ variant: currentVariant }))}>
            {label}
            {props.required && (
              <span className='text-red-500 ml-1' aria-label='required'>
                *
              </span>
            )}
          </label>
        )}

        <div className='relative'>
          {hasLeftIcon && (
            <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none'>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              inputVariants({ variant: currentVariant, size }),
              hasLeftIcon && 'pl-10',
              hasRightIcon && 'pr-10',
              className,
            )}
            disabled={disabled}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />

          {hasRightIcon && (
            <div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1'>
              {error && (
                <FiAlertCircle
                  className='w-5 h-5 text-red-500'
                  aria-hidden='true'
                />
              )}
              {success && !error && (
                <FiCheck
                  className='w-5 h-5 text-green-500'
                  aria-hidden='true'
                />
              )}
              {showPasswordToggle &&
                type === 'password' &&
                !error &&
                !success && (
                  <button
                    type='button'
                    onClick={togglePasswordVisibility}
                    className='text-neutral-400 hover:text-neutral-600 focus:text-neutral-600 focus:outline-none transition-colors duration-200'
                    aria-label={
                      isPasswordVisible ? 'Hide password' : 'Show password'
                    }
                    tabIndex={-1}
                  >
                    {isPasswordVisible ? (
                      <FiEyeOff className='w-5 h-5' />
                    ) : (
                      <FiEye className='w-5 h-5' />
                    )}
                  </button>
                )}
              {rightIcon &&
                !showPasswordToggle &&
                !error &&
                !success &&
                rightIcon}
            </div>
          )}
        </div>

        {(error || success || helperText) && (
          <div className='mt-2'>
            {error && (
              <p className='text-sm text-red-600 flex items-center space-x-1'>
                <FiAlertCircle className='w-4 h-4 flex-shrink-0' />
                <span>{error}</span>
              </p>
            )}
            {success && !error && (
              <p className='text-sm text-green-600 flex items-center space-x-1'>
                <FiCheck className='w-4 h-4 flex-shrink-0' />
                <span>{success}</span>
              </p>
            )}
            {helperText && !error && !success && (
              <p className='text-sm text-neutral-500'>{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input, inputVariants };
