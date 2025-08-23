'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiLoader } from 'react-icons/fi';
import { Button } from '../Button';
import { Input } from '../Input';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../lib/auth';
import { ValidationError } from '../../types/auth';

export interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  showRegisterLink?: boolean;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectTo = '/',
  showRegisterLink = true,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<ValidationError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const { login } = useAuth();
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: ValidationError = {};

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field-specific error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      // Clear general submit error
      if (submitError) {
        setSubmitError('');
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await login(formData.email, formData.password);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectTo);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className='card p-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='heading-3 mb-2'>Welcome Back</h1>
          <p className='text-neutral-600'>
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Email Field */}
          <Input
            type='email'
            label='Email Address'
            placeholder='Enter your email'
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            leftIcon={<FiMail className='w-5 h-5' />}
            required
            disabled={isSubmitting}
            autoComplete='email'
          />

          {/* Password Field */}
          <Input
            type='password'
            label='Password'
            placeholder='Enter your password'
            value={formData.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            leftIcon={<FiLock className='w-5 h-5' />}
            showPasswordToggle
            required
            disabled={isSubmitting}
            autoComplete='current-password'
          />

          {/* Submit Error */}
          {submitError && (
            <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
              <p className='text-sm text-red-600'>{submitError}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type='submit'
            variant='primary'
            size='lg'
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={
              isSubmitting ? <FiLoader className='animate-spin' /> : undefined
            }
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer Links */}
        <div className='mt-8 text-center space-y-4'>
          {/* Forgot Password Link */}
          <div>
            <Link
              href='/forgot-password'
              className='text-sm text-primary-500 hover:text-primary-600 transition-colors duration-300'
            >
              Forgot your password?
            </Link>
          </div>

          {/* Register Link */}
          {showRegisterLink && (
            <div className='pt-4 border-t border-neutral-200'>
              <p className='text-sm text-neutral-600'>
                Don&apos;t have an account?{' '}
                <Link
                  href='/register'
                  className='text-primary-500 hover:text-primary-600 font-medium transition-colors duration-300'
                >
                  Create one here
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
