'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../components/Button';
import { getProductById } from '../../data/products';
import { ContactForm, Product } from '../../types';
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiSend,
  FiCheckCircle,
  FiHeart,
  FiInstagram,
  FiFacebook,
} from 'react-icons/fi';
import { NextPage } from 'next';

const ContactComponent: React.FC = () => {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');
  const [product, setProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    message: '',
    productId: productId || '',
    occasion: '',
    preferredContactMethod: 'email',
  });

  const [errors, setErrors] = useState<Partial<ContactForm>>({});

  useEffect(() => {
    const loadProduct = async () => {
      if (productId) {
        try {
          const foundProduct = await getProductById(productId);
          setProduct(foundProduct);
          setFormData((prev) => ({
            ...prev,
            message: `Hi! I'm interested in "${foundProduct.name}" and would like to know more about customization options.`,
          }));
        } catch (error) {
          console.error('Failed to load product:', error);
          setProduct(null);
        }
      }
    };

    loadProduct();
  }, [productId]);

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
      await new Promise((resolve) => setTimeout(resolve, 2000));

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

  const contactInfo = [
    {
      icon: <FiMapPin className='w-6 h-6' />,
      title: 'Visit Our Studio',
      details: ['Bloemenstraat 123', '1234 AB Amsterdam', 'Netherlands'],
    },
    {
      icon: <FiPhone className='w-6 h-6' />,
      title: 'Call Us',
      details: ['+31 6 12 34 56 78', 'Available during business hours'],
    },
    {
      icon: <FiMail className='w-6 h-6' />,
      title: 'Email Us',
      details: ['hello@mamabloemetjes.nl', 'We respond within 24 hours'],
    },
    {
      icon: <FiClock className='w-6 h-6' />,
      title: 'Business Hours',
      details: [
        'Monday - Friday: 9:00 - 17:00',
        'Saturday: 10:00 - 16:00',
        'Sunday: Closed',
      ],
    },
  ];

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

  if (isSubmitted) {
    return (
      <div className='min-h-screen pt-24 pb-16 flex items-center justify-center'>
        <div className='container'>
          <div className='max-w-2xl mx-auto text-center'>
            <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
              <FiCheckCircle className='w-10 h-10 text-green-600' />
            </div>
            <h1 className='heading-2 mb-4'>Thank You!</h1>
            <p className='text-lg text-[#7d6b55] mb-8 leading-relaxed'>
              We&apos;ve received your message and will get back to you within
              24 hours.
              {product && (
                <span className='block mt-2'>
                  We&apos;re excited to help you with &quot;{product.name}
                  &quot;!
                </span>
              )}
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                variant='primary'
                onClick={() => (window.location.href = '/')}
              >
                Back to Home
              </Button>
              <Button
                variant='outline'
                onClick={() => (window.location.href = '/shop')}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen pt-24 pb-16'>
      <div className='container'>
        {/* Page Header */}
        <div className='text-center mb-16'>
          <h1 className='heading-1 mb-4'>Get in Touch</h1>
          <p className='text-lg text-[#7d6b55] max-w-2xl mx-auto leading-relaxed'>
            We&apos;d love to hear from you! Whether you have questions about
            our products, need help with a custom order, or just want to say
            hello – we&apos;re here to help.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-16'>
          {/* Contact Form */}
          <div>
            <div className='card p-8'>
              {product && (
                <div className='mb-8 p-6 bg-[#f5f2ee] rounded-xl border border-[#e8e2d9]'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <FiHeart className='w-5 h-5 text-[#d4a574]' />
                    <span className='font-medium text-[#2d2820]'>
                      Inquiry about: {product.name}
                    </span>
                  </div>
                  <p className='text-sm text-[#7d6b55]'>
                    We&apos;ll provide personalized assistance for this product
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Name */}
                <div>
                  <label
                    htmlFor='name'
                    className='block text-sm font-medium text-[#2d2820] mb-2'
                  >
                    Full Name *
                  </label>
                  <input
                    type='text'
                    id='name'
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

                {/* Email */}
                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-medium text-[#2d2820] mb-2'
                  >
                    Email Address *
                  </label>
                  <input
                    type='email'
                    id='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input-field ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder='your@email.com'
                  />
                  {errors.email && (
                    <p className='text-red-600 text-sm mt-1'>{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor='phone'
                    className='block text-sm font-medium text-[#2d2820] mb-2'
                  >
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    id='phone'
                    name='phone'
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`input-field ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder='+31 6 12 34 56 78'
                  />
                  {errors.phone && (
                    <p className='text-red-600 text-sm mt-1'>{errors.phone}</p>
                  )}
                </div>

                {/* Occasion */}
                <div>
                  <label
                    htmlFor='occasion'
                    className='block text-sm font-medium text-[#2d2820] mb-2'
                  >
                    Occasion
                  </label>
                  <select
                    id='occasion'
                    name='occasion'
                    value={formData.occasion}
                    onChange={handleInputChange}
                    className='input-field'
                  >
                    <option value=''>Select an occasion (optional)</option>
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

                {/* Preferred Contact Method */}
                <div>
                  <label className='block text-sm font-medium text-[#2d2820] mb-3'>
                    Preferred Contact Method
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
                    htmlFor='message'
                    className='block text-sm font-medium text-[#2d2820] mb-2'
                  >
                    Message *
                  </label>
                  <textarea
                    id='message'
                    name='message'
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`textarea-field ${errors.message ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder='Tell us about your project, questions, or how we can help...'
                  />
                  {errors.message && (
                    <p className='text-red-600 text-sm mt-1'>
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
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
                  {isSubmitting ? 'Sending Message...' : 'Send Message'}
                </Button>

                <p className='text-sm text-[#9a8470] text-center'>
                  We typically respond within 24 hours during business days.
                </p>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className='space-y-8'>
            {/* Contact Details */}
            <div className='grid grid-cols-1 gap-6'>
              {contactInfo.map((info, index) => (
                <div key={index} className='card p-6'>
                  <div className='flex items-start space-x-4'>
                    <div className='w-12 h-12 bg-[#d4a574] rounded-xl flex items-center justify-center text-white flex-shrink-0'>
                      {info.icon}
                    </div>
                    <div>
                      <h3 className='font-semibold text-[#2d2820] mb-2'>
                        {info.title}
                      </h3>
                      {info.details.map((detail, idx) => (
                        <p key={idx} className='text-[#7d6b55] text-sm'>
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Media */}
            <div className='card p-6'>
              <h3 className='font-semibold text-[#2d2820] mb-4'>Follow Us</h3>
              <p className='text-[#7d6b55] text-sm mb-4'>
                Stay updated with our latest creations and behind-the-scenes
                content.
              </p>
              <div className='flex space-x-4'>
                <a
                  href='https://instagram.com/mamabloemetjes'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300'
                  aria-label='Follow us on Instagram'
                >
                  <FiInstagram className='w-6 h-6' />
                </a>
                <a
                  href='https://facebook.com/mamabloemetjes'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300'
                  aria-label='Follow us on Facebook'
                >
                  <FiFacebook className='w-6 h-6' />
                </a>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className='card p-6'>
              <h3 className='font-semibold text-[#2d2820] mb-4'>
                Visit Our Studio
              </h3>
              <div className='bg-[#f5f2ee] rounded-xl h-48 flex items-center justify-center text-[#9a8470]'>
                <div className='text-center'>
                  <FiMapPin className='w-12 h-12 mx-auto mb-2' />
                  <p className='text-sm'>Interactive map coming soon</p>
                  <p className='text-xs mt-1'>Bloemenstraat 123, Amsterdam</p>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className='card p-6 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] text-white'>
              <h3 className='font-semibold mb-2'>Frequently Asked Questions</h3>
              <p className='text-white/90 text-sm mb-4'>
                Find quick answers to common questions about our products and
                services.
              </p>
              <Button
                variant='secondary'
                size='sm'
                className='bg-white text-[#d4a574] hover:bg-white/90'
                onClick={() => (window.location.href = '/faq')}
              >
                View FAQ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactPage: NextPage = () => {
  return (
    <Suspense fallback={<div className='loading'>Loading...</div>}>
      <ContactComponent />
    </Suspense>
  );
};

export default ContactPage;
