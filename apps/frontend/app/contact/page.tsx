'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../components/Button';
import { getProductById } from '../../data/products';
import { ContactForm, Product } from '../../types';
import {
  FiPhone,
  FiMail,
  FiSend,
  FiCheckCircle,
  FiHeart,
} from 'react-icons/fi';
import { NextPage } from 'next';
import { sendContactForm } from '@/data/contact';

const ContactComponent: React.FC = () => {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');
  const type = searchParams.get('type') as 'custom' | 'product' | null;
  const [product, setProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    message: '',
    product_id: productId || null,
    occasion: '',
    preferred_contact_method: 'email',
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
            message: `Hallo! Ik ben geïnteresseerd in "${foundProduct.name}" en zou graag meer willen weten over aanpassingsmogelijkheden.`,
          }));
        } catch (error) {
          console.error('Failed to load product:', error);
          setProduct(null);
        }
      } else if (type === 'custom') {
        setFormData((prev) => ({
          ...prev,
          message: `Hallo! Ik ben geïnteresseerd in een aangepast bloemstuk. Hier zijn enkele details over wat ik zoek:\n\n- Gelegenheid:\n- Gewenste bloemen:\n- Kleurenschema:\n- Budget:\n- Aanvullende opmerkingen:`,
        }));
      } else {
        setProduct(null);
      }
    };

    loadProduct();
  }, [productId, type]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Naam is verplicht';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mailadres is verplicht';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Voer een geldig e-mailadres in';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Bericht is verplicht';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Voer een geldig telefoonnummer in';
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
      sendContactForm(formData);
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
      icon: <FiPhone className='w-6 h-6' />,
      title: 'Bel Ons',
      details: ['+31 6 00 00 00 00', 'Beschikbaar tijdens kantooruren'],
    },
    {
      icon: <FiMail className='w-6 h-6' />,
      title: 'Mail Ons',
      details: ['hello@mamabloemetjes.nl', 'We reageren binnen 24 uur'],
    },
  ];

  const occasions = [
    'Bruiloft',
    'Jubileum',
    'Verjaardag',
    'Moederdag',
    'Valentijnsdag',
    'Afstuderen',
    'Housewarming',
    'Condoleance',
    'Bedrijfsevenement',
    'Zomaar',
    'Anders',
  ];

  if (isSubmitted) {
    return (
      <div className='min-h-screen pt-24 pb-16 flex items-center justify-center'>
        <div className='container'>
          <div className='max-w-2xl mx-auto text-center'>
            <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
              <FiCheckCircle className='w-10 h-10 text-green-600' />
            </div>
            <h1 className='heading-2 mb-4'>Bedankt!</h1>
            <p className='text-lg text-[#7d6b55] mb-8 leading-relaxed'>
              We hebben uw bericht ontvangen en nemen zo snel mogelijk contact
              met u op.
              {product && (
                <span className='block mt-2'>
                  We helpen u graag met &quot;{product.name}&quot;!
                </span>
              )}
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                variant='primary'
                onClick={() => (window.location.href = '/')}
              >
                Terug naar Home
              </Button>
              <Button
                variant='outline'
                onClick={() => (window.location.href = '/shop')}
              >
                Verder Winkelen
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
          <h1 className='heading-1 mb-4'>Neem Contact Op</h1>
          <p className='text-lg text-[#7d6b55] max-w-2xl mx-auto leading-relaxed'>
            We horen graag van u! Of u nu vragen heeft over onze producten, hulp
            nodig heeft bij een maatwerk bestelling, of gewoon hallo wilt zeggen
            – wij zijn er om te helpen.
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
                      Vraag over: {product.name}
                    </span>
                  </div>
                  <p className='text-sm text-[#7d6b55]'>
                    We bieden persoonlijke assistentie voor dit product
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
                    Volledige Naam *
                  </label>
                  <input
                    type='text'
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder='Uw volledige naam'
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
                    E-mailadres *
                  </label>
                  <input
                    type='email'
                    id='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input-field ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder='uw@email.nl'
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
                    Telefoonnummer
                  </label>
                  <input
                    type='tel'
                    id='phone'
                    name='phone'
                    value={formData.phone || ''}
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
                    Gelegenheid
                  </label>
                  <select
                    id='occasion'
                    name='occasion'
                    value={formData.occasion || ''}
                    onChange={handleInputChange}
                    className='input-field'
                  >
                    <option value=''>
                      Selecteer een gelegenheid (optioneel)
                    </option>
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
                    Gewenste Contactmethode
                  </label>
                  <div className='flex space-x-6'>
                    <label className='flex items-center cursor-pointer'>
                      <input
                        type='radio'
                        name='preferredContactMethod'
                        value='email'
                        checked={formData.preferred_contact_method === 'email'}
                        onChange={handleInputChange}
                        className='mr-2 text-[#d4a574] focus:ring-[#d4a574]'
                      />
                      <span className='text-[#7d6b55]'>E-mail</span>
                    </label>
                    <label className='flex items-center cursor-pointer'>
                      <input
                        type='radio'
                        name='preferredContactMethod'
                        value='phone'
                        checked={formData.preferred_contact_method === 'phone'}
                        onChange={handleInputChange}
                        className='mr-2 text-[#d4a574] focus:ring-[#d4a574]'
                      />
                      <span className='text-[#7d6b55]'>Telefoon</span>
                    </label>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor='message'
                    className='block text-sm font-medium text-[#2d2820] mb-2'
                  >
                    Bericht *
                  </label>
                  <textarea
                    id='message'
                    name='message'
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`textarea-field ${errors.message ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder='Vertel ons over uw project, vragen, of hoe we kunnen helpen...'
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
                  {isSubmitting ? 'Bericht Versturen...' : 'Bericht Versturen'}
                </Button>

                <p className='text-sm text-[#9a8470] text-center'>
                  We reageren doorgaans binnen 24 uur tijdens werkdagen.
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

            {/* FAQ Link */}
            {/*<div className='card p-6 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] text-white'>
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
            </div>*/}
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
