'use client';

import React, { useState, useEffect } from 'react';
import { Product, ContactForm } from '../types';
import { Button } from './Button';
import { FiX, FiSend, FiHeart, FiCheckCircle } from 'react-icons/fi';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  initialMessage?: string;
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  product,
  initialMessage = '',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    message: initialMessage,
    productId: product?.id || '',
    occasion: '',
    preferredContactMethod: 'email',
  });

  const [errors, setErrors] = useState<Partial<ContactForm>>({});

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      setFormData((prev) => ({
        ...prev,
        productId: product.id,
        message:
          initialMessage ||
          `Hi! I&apos;m interested in &quot;${product.name}&quot; and would like to know more about it, especially regarding customization options for my special occasion.`,
      }));
      setIsSubmitted(false);
      setErrors({});
    }
  }, [isOpen, product, initialMessage]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Replace with actual API call
      console.log('Contact form submitted:', formData);

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof ContactForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
      productId: '',
      occasion: '',
      preferredContactMethod: 'email',
    });
    setErrors({});
    setIsSubmitted(false);
    onClose();
  };

  const occasions = [
    'Wedding',
    'Anniversary',
    'Birthday',
    'Mothers Day',
    'Valentines Day',
    'Graduation',
    'Housewarming',
    'Sympathy',
    'Corporate Event',
    'Just Because',
    'Other',
  ];

  if (!isOpen) return null;

  return (
    <div className='modal-backdrop' onClick={handleClose}>
      <div
        className='bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform scale-in'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-[#e8e2d9] px-8 py-6 rounded-t-3xl'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-serif font-semibold text-[#2d2820]'>
                {isSubmitted ? 'Thank You!' : 'Ask About This Bouquet'}
              </h2>
              {product && !isSubmitted && (
                <p className='text-[#7d6b55] mt-1'>
                  Inquiry about &apos;{product.name}&apos;
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className='w-10 h-10 rounded-full bg-[#f5f2ee] hover:bg-[#e8e2d9] flex items-center justify-center transition-colors duration-200'
              aria-label='Close modal'
            >
              <FiX className='w-5 h-5 text-[#7d6b55]' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='px-8 py-6'>
          {isSubmitted ? (
            // Success State
            <div className='text-center py-8'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <FiCheckCircle className='w-8 h-8 text-green-600' />
              </div>
              <h3 className='text-xl font-semibold text-[#2d2820] mb-4'>
                Message Sent Successfully!
              </h3>
              <p className='text-[#7d6b55] mb-6 leading-relaxed'>
                Thank you for your inquiry about &quot;{product?.name}&quot;.
                We&apos;ll get back to you within 24 hours with personalized
                information and customization options.
              </p>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <Button variant='primary' onClick={handleClose}>
                  Continue Shopping
                </Button>
                <Button
                  variant='outline'
                  onClick={() => (window.location.href = '/contact')}
                >
                  Visit Contact Page
                </Button>
              </div>
            </div>
          ) : (
            // Form State
            <>
              {/* Product Info */}
              {product && (
                <div className='mb-6 p-6 bg-[#f5f2ee] rounded-2xl border border-[#e8e2d9]'>
                  <div className='flex items-start space-x-4'>
                    <div className='w-16 h-16 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] rounded-xl flex items-center justify-center flex-shrink-0'>
                      <span className='text-white text-2xl'>🌸</span>
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2 mb-2'>
                        <FiHeart className='w-4 h-4 text-[#d4a574]' />
                        <h4 className='font-semibold text-[#2d2820]'>
                          {product.name}
                        </h4>
                      </div>
                      <p className='text-sm text-[#7d6b55] mb-2 line-clamp-2'>
                        {product.description}
                      </p>
                      <div className='flex items-center justify-between'>
                        <span className='font-serif font-semibold text-[#d4a574]'>
                          €{product.price.toFixed(2)}
                        </span>
                        {product.isCustomizable && (
                          <span className='badge bg-[#8b9dc3]/10 text-[#8b9dc3] text-xs'>
                            ✨ Customizable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Name and Email Row */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label
                      htmlFor='modal-name'
                      className='block text-sm font-medium text-[#2d2820] mb-2'
                    >
                      Full Name *
                    </label>
                    <input
                      type='text'
                      id='modal-name'
                      name='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder='Your full name'
                    />
                    {errors.name && (
                      <p className='text-red-600 text-sm mt-1'>{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='modal-email'
                      className='block text-sm font-medium text-[#2d2820] mb-2'
                    >
                      Email Address *
                    </label>
                    <input
                      type='email'
                      id='modal-email'
                      name='email'
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`input-field ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder='your@email.com'
                    />
                    {errors.email && (
                      <p className='text-red-600 text-sm mt-1'>
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone and Occasion Row */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label
                      htmlFor='modal-phone'
                      className='block text-sm font-medium text-[#2d2820] mb-2'
                    >
                      Phone Number
                    </label>
                    <input
                      type='tel'
                      id='modal-phone'
                      name='phone'
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`input-field ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder='+31 6 12 34 56 78'
                    />
                    {errors.phone && (
                      <p className='text-red-600 text-sm mt-1'>
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='modal-occasion'
                      className='block text-sm font-medium text-[#2d2820] mb-2'
                    >
                      Occasion
                    </label>
                    <select
                      id='modal-occasion'
                      name='occasion'
                      value={formData.occasion}
                      onChange={handleInputChange}
                      className='input-field'
                    >
                      <option value=''>Select an occasion</option>
                      {occasions.map((occasion) => (
                        <option
                          key={occasion}
                          value={occasion.toLowerCase().replace(' ', '-')}
                        >
                          {occasion}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preferred Contact Method */}
                <div>
                  <label className='block text-sm font-medium text-[#2d2820] mb-3'>
                    How would you prefer to be contacted?
                  </label>
                  <div className='flex space-x-6'>
                    <label className='flex items-center cursor-pointer'>
                      <input
                        type='radio'
                        name='preferredContactMethod'
                        value='email'
                        checked={formData.preferredContactMethod === 'email'}
                        onChange={handleInputChange}
                        className='mr-2 text-[#d4a574] focus:ring-[#d4a574]'
                      />
                      <span className='text-[#7d6b55]'>Email</span>
                    </label>
                    <label className='flex items-center cursor-pointer'>
                      <input
                        type='radio'
                        name='preferredContactMethod'
                        value='phone'
                        checked={formData.preferredContactMethod === 'phone'}
                        onChange={handleInputChange}
                        className='mr-2 text-[#d4a574] focus:ring-[#d4a574]'
                      />
                      <span className='text-[#7d6b55]'>Phone</span>
                    </label>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor='modal-message'
                    className='block text-sm font-medium text-[#2d2820] mb-2'
                  >
                    Your Message *
                  </label>
                  <textarea
                    id='modal-message'
                    name='message'
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className={`textarea-field ${errors.message ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder='Tell us about your vision, special requirements, or any questions...'
                  />
                  {errors.message && (
                    <p className='text-red-600 text-sm mt-1'>
                      {errors.message}
                    </p>
                  )}
                  <p className='text-sm text-[#9a8470] mt-2'>
                    Let us know about colors, size preferences, delivery dates,
                    or any special customizations.
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className='flex flex-col sm:flex-row gap-3 pt-4'>
                  <Button
                    type='submit'
                    variant='primary'
                    size='lg'
                    fullWidth
                    loading={isSubmitting}
                    leftIcon={
                      !isSubmitting ? <FiSend className='w-5 h-5' /> : undefined
                    }
                  >
                    {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='lg'
                    onClick={handleClose}
                    className='sm:w-auto'
                  >
                    Cancel
                  </Button>
                </div>

                <p className='text-sm text-[#9a8470] text-center'>
                  We&apos;ll respond within 24 hours with personalized
                  recommendations.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
