'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiLoader, FiUser } from 'react-icons/fi';
import { Button } from '../Button';
import { Input } from '../Input';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../lib/auth';
import { ValidationError } from '../../types/auth';

export interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  showLoginLink?: boolean;
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  redirectTo = '/',
  showLoginLink = true,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<
    ValidationError & { confirmPassword?: string }
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const { register } = useAuth();
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: ValidationError & { confirmPassword?: string } = {};

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    // Validate password confirmation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      if (errors[field as keyof typeof errors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      // Clear general submit error
      if (submitError) {
        setSubmitError('');
      }

      // Real-time password confirmation validation
      if (field === 'confirmPassword' || field === 'password') {
        const password = field === 'password' ? value : formData.password;
        const confirmPassword =
          field === 'confirmPassword' ? value : formData.confirmPassword;

        if (confirmPassword && password !== confirmPassword) {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: 'Passwords do not match',
          }));
        } else if (errors.confirmPassword === 'Passwords do not match') {
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
        }
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
      await register(formData.email, formData.password);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectTo);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (
    password: string,
  ): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+-=[\]{}|;:,.<>?]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score < 3) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score < 5) return { score, label: 'Good', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className='card p-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='heading-3 mb-2'>Create Your Account</h1>
          <p className='text-neutral-600'>
            Join Mama Bloemetjes to start your floral journey
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
          <div>
            <Input
              type='password'
              label='Password'
              placeholder='Create a strong password'
              value={formData.password}
              onChange={handleInputChange('password')}
              error={errors.password}
              leftIcon={<FiLock className='w-5 h-5' />}
              showPasswordToggle
              required
              disabled={isSubmitting}
              autoComplete='new-password'
            />

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className='mt-3'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm text-neutral-600'>
                    Password strength:
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      passwordStrength.score < 3
                        ? 'text-red-600'
                        : passwordStrength.score < 5
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className='w-full bg-neutral-200 rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <div className='mt-2 text-xs text-neutral-500 space-y-1'>
                  <p>Password must contain:</p>
                  <ul className='ml-4 space-y-1'>
                    <li
                      className={
                        formData.password.length >= 8
                          ? 'text-green-600'
                          : 'text-neutral-400'
                      }
                    >
                      • At least 8 characters
                    </li>
                    <li
                      className={
                        /[A-Z]/.test(formData.password)
                          ? 'text-green-600'
                          : 'text-neutral-400'
                      }
                    >
                      • One uppercase letter
                    </li>
                    <li
                      className={
                        /[a-z]/.test(formData.password)
                          ? 'text-green-600'
                          : 'text-neutral-400'
                      }
                    >
                      • One lowercase letter
                    </li>
                    <li
                      className={
                        /\d/.test(formData.password)
                          ? 'text-green-600'
                          : 'text-neutral-400'
                      }
                    >
                      • One number
                    </li>
                    <li
                      className={
                        /[!@#$%^&*()_+-=[\]{}|;:,.<>?]/.test(formData.password)
                          ? 'text-green-600'
                          : 'text-neutral-400'
                      }
                    >
                      • One special character
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <Input
            type='password'
            label='Confirm Password'
            placeholder='Confirm your password'
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={errors.confirmPassword}
            success={
              formData.confirmPassword &&
              formData.password === formData.confirmPassword
                ? 'Passwords match'
                : undefined
            }
            leftIcon={<FiLock className='w-5 h-5' />}
            showPasswordToggle
            required
            disabled={isSubmitting}
            autoComplete='new-password'
          />

          {/* Submit Error */}
          {submitError && (
            <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
              <p className='text-sm text-red-600'>{submitError}</p>
            </div>
          )}

          {/* Terms and Privacy */}
          <div className='text-xs text-neutral-500 leading-relaxed'>
            By creating an account, you agree to our{' '}
            <Link
              href='/terms'
              className='text-primary-500 hover:text-primary-600 transition-colors'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy'
              className='text-primary-500 hover:text-primary-600 transition-colors'
            >
              Privacy Policy
            </Link>
            .
          </div>

          {/* Submit Button */}
          <Button
            type='submit'
            variant='primary'
            size='lg'
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={
              isSubmitting ? <FiLoader className='animate-spin' /> : <FiUser />
            }
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Footer Links */}
        {showLoginLink && (
          <div className='mt-8 text-center pt-6 border-t border-neutral-200'>
            <p className='text-sm text-neutral-600'>
              Already have an account?{' '}
              <Link
                href='/login'
                className='text-primary-500 hover:text-primary-600 font-medium transition-colors duration-300'
              >
                Sign in here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;
