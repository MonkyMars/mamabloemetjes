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
    firstName: '',
    preposition: '',
    lastName: '',
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
    const newErrors: ValidationError & {
      confirmPassword?: string;
      firstName?: string;
      lastName?: string;
    } = {};

    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Voornaam is verplicht';
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Achternaam is verplicht';
    }

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
      newErrors.confirmPassword = 'Bevestig je wachtwoord';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Wachtwoorden komen niet overeen';
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
            confirmPassword: 'Wachtwoorden komen niet overeen',
          }));
        } else if (
          errors.confirmPassword === 'Wachtwoorden komen niet overeen'
        ) {
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
      await register(
        formData.firstName,
        formData.preposition,
        formData.lastName,
        formData.email,
        formData.password,
      );

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

    if (score < 3) return { score, label: 'Zwak', color: 'bg-red-500' };
    if (score < 5) return { score, label: 'Goed', color: 'bg-yellow-500' };
    return { score, label: 'Sterk', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className='card p-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='heading-3 mb-2'>Maak Je Account Aan</h1>
          <p className='text-neutral-600'>
            Word lid van Mama Bloemetjes en begin je bloemenreis
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Name Fields */}
          <div className='space-y-4'>
            <Input
              type='text'
              label='Voornaam'
              placeholder='Voer je voornaam in'
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              error={errors.firstName}
              leftIcon={<FiUser className='w-5 h-5' />}
              required
              disabled={isSubmitting}
              autoComplete='given-name'
            />
            <div className='grid grid-cols-3 gap-2'>
              <Input
                type='text'
                label='Tussenvoegsel'
                placeholder='van, de, der'
                value={formData.preposition}
                onChange={handleInputChange('preposition')}
                disabled={isSubmitting}
                autoComplete='additional-name'
              />
              <div className='col-span-2'>
                <Input
                  type='text'
                  label='Achternaam'
                  placeholder='Voer je achternaam in'
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={errors.lastName}
                  leftIcon={<FiUser className='w-5 h-5' />}
                  required
                  disabled={isSubmitting}
                  autoComplete='family-name'
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <Input
            type='email'
            label='E-mailadres'
            placeholder='Voer je e-mailadres in'
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
              label='Wachtwoord'
              placeholder='Maak een sterk wachtwoord'
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
                    Wachtwoordsterkte:
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
                  <p>Wachtwoord moet bevatten:</p>
                  <ul className='ml-4 space-y-1'>
                    <li
                      className={
                        formData.password.length >= 8
                          ? 'text-green-600'
                          : 'text-neutral-400'
                      }
                    >
                      • Minimaal 8 tekens
                    </li>
                    <li
                      className={
                        /[A-Z]/.test(formData.password)
                          ? 'text-green-600'
                          : 'text-neutral-400'
                      }
                    >
                      • Één hoofdletter
                    </li>
                    <li
                      className={
                        /[a-z]/.test(formData.password)
                          ? 'text-green-600'
                          : 'text-neutral-400'
                      }
                    >
                      • Één kleine letter
                    </li>
                    <li
                      className={
                        /\d/.test(formData.password)
                          ? 'text-green-600'
                          : 'text-neutral-400'
                      }
                    >
                      • Één cijfer
                    </li>
                    <li
                      className={
                        /[!@#$%^&*()_+-=[\]{}|;:,.<>?]/.test(formData.password)
                          ? 'text-green-600'
                          : 'text-neutral-400'
                      }
                    >
                      • Één speciaal teken
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <Input
            type='password'
            label='Bevestig Wachtwoord'
            placeholder='Bevestig je wachtwoord'
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={errors.confirmPassword}
            success={
              formData.confirmPassword &&
              formData.password === formData.confirmPassword
                ? 'Wachtwoorden komen overeen'
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
            Door een account aan te maken, ga je akkoord met onze{' '}
            <Link
              href='/terms'
              className='text-primary-500 hover:text-primary-600 transition-colors'
            >
              Algemene Voorwaarden
            </Link>{' '}
            en{' '}
            <Link
              href='/privacy'
              className='text-primary-500 hover:text-primary-600 transition-colors'
            >
              Privacybeleid
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
            {isSubmitting ? 'Account Aanmaken...' : 'Account Aanmaken'}
          </Button>
        </form>

        {/* Footer Links */}
        {showLoginLink && (
          <div className='mt-8 text-center pt-6 border-t border-neutral-200'>
            <p className='text-sm text-neutral-600'>
              Heb je al een account?{' '}
              <Link
                href='/login'
                className='text-primary-500 hover:text-primary-600 font-medium transition-colors duration-300'
              >
                Log hier in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;
