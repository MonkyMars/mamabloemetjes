'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useCart, useGuestCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import {
  FiArrowLeft,
  FiShoppingBag,
  FiCreditCard,
  FiShield,
  FiTruck,
  FiLoader,
  FiCheckCircle,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHome,
} from 'react-icons/fi';
import { Product } from '@/types';
import { getFullName } from '@/lib/auth';

interface BillingInfo {
  firstName: string;
  preposition: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
}

interface AddressValidationResponse {
  is_valid: boolean;
  suggestions: AddressSuggestion[];
  validation_score: number;
}

interface AddressSuggestion {
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  province: string;
  confidence: number;
}

const CheckoutPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const authenticatedCart = useCart();
  const guestCart = useGuestCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    firstName: user?.first_name || '',
    preposition: user?.preposition || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Nederland',
  });
  const [errors, setErrors] = useState<Partial<BillingInfo>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [addressValidation, setAddressValidation] =
    useState<AddressValidationResponse | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  // Use authenticated or guest cart based on auth status
  const cart = isAuthenticated ? authenticatedCart.cart : null;
  const isLoading = isAuthenticated ? authenticatedCart.isLoading : false;
  const error = isAuthenticated ? authenticatedCart.error : null;

  // Load product details for cart items
  useEffect(() => {
    const loadProductDetails = async () => {
      const productIds = new Set<string>();

      // Collect product IDs from authenticated cart
      if (cart?.items) {
        cart.items.forEach((item) => productIds.add(item.product_id));
      }

      // Collect product IDs from guest cart
      if (!isAuthenticated) {
        guestCart.items.forEach((item) => productIds.add(item.product_id));
      }

      // Fetch product details for all unique product IDs
      const productPromises = Array.from(productIds).map(async (productId) => {
        try {
          const response = await api.get(`/products/${productId}`);
          return { id: productId, data: response.data.data };
        } catch (error) {
          console.error(`Failed to load product ${productId}:`, error);
        }
        return null;
      });

      const productResults = await Promise.all(productPromises);
      const productMap: Record<string, Product> = {};

      productResults.forEach((result) => {
        if (result) {
          productMap[result.id] = result.data;
        }
      });

      setProducts(productMap);
    };

    loadProductDetails();
  }, [cart, guestCart.items, isAuthenticated]);

  // Pre-fill user data for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      setBillingInfo((prev) => ({
        ...prev,
        firstName: user.first_name || '',
        preposition: user.preposition || '',
        lastName: user.last_name || '',
        email: user.email || '',
      }));
    }
  }, [isAuthenticated, user]);

  const calculateOrderSummary = (): OrderSummary => {
    let priceTotal = 0; // This is the total including tax (what customer pays)
    let subtotal = 0;
    let tax = 0;
    let itemCount = 0;

    if (isAuthenticated && cart?.items) {
      priceTotal =
        cart.items.reduce((sum, item) => {
          return sum + item.quantity * item.unit_price_cents;
        }, 0) / 100; // Convert from cents
      subtotal =
        cart.items.reduce((sum, item) => {
          return sum + item.quantity * item.unit_subtotal_cents;
        }, 0) / 100; // Convert from cents
      tax =
        cart.items.reduce((sum, item) => {
          return sum + item.quantity * item.unit_tax_cents;
        }, 0) / 100; // Convert from cents
      itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    } else if (!isAuthenticated) {
      priceTotal = guestCart.items.reduce((sum, item) => {
        const product = products[item.product_id];
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);
      subtotal = guestCart.items.reduce((sum, item) => {
        const product = products[item.product_id];
        return sum + (product ? product.subtotal * item.quantity : 0);
      }, 0);
      tax = guestCart.items.reduce((sum, item) => {
        const product = products[item.product_id];
        return sum + (product ? product.tax * item.quantity : 0);
      }, 0);
      itemCount = guestCart.totalQuantity();
    }

    const shippingThreshold = 75;
    const shipping = priceTotal >= shippingThreshold ? 0 : 7.5;
    const total = priceTotal + shipping;

    return {
      subtotal,
      tax,
      shipping,
      total,
      itemCount,
    };
  };

  const validateBillingInfo = (): boolean => {
    const newErrors: Partial<BillingInfo> = {};

    if (!billingInfo.firstName.trim()) {
      newErrors.firstName = 'Voornaam is verplicht';
    }
    if (!billingInfo.lastName.trim()) {
      newErrors.lastName = 'Achternaam is verplicht';
    }
    if (!billingInfo.email.trim()) {
      newErrors.email = 'E-mailadres is verplicht';
    } else if (!/\S+@\S+\.\S+/.test(billingInfo.email)) {
      newErrors.email = 'Ongeldig e-mailadres';
    }
    if (!billingInfo.phone.trim()) {
      newErrors.phone = 'Telefoonnummer is verplicht';
    }
    if (!billingInfo.address.trim()) {
      newErrors.address = 'Adres is verplicht';
    }
    if (!billingInfo.city.trim()) {
      newErrors.city = 'Stad is verplicht';
    }
    if (!billingInfo.postalCode.trim()) {
      newErrors.postalCode = 'Postcode is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof BillingInfo, value: string) => {
    setBillingInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateAddress = async () => {
    if (!billingInfo.address || !billingInfo.postalCode || !billingInfo.city) {
      return;
    }

    setIsValidatingAddress(true);
    try {
      const response = await api.post('/api/checkout/validate-address', {
        street:
          billingInfo.address.split(' ').slice(1).join(' ') ||
          billingInfo.address,
        house_number: billingInfo.address.split(' ')[0] || '1',
        postal_code: billingInfo.postalCode,
        city: billingInfo.city,
        province: 'Noord-Holland', // Should be dynamic
      });

      setAddressValidation(response.data.data);
      setShowAddressSuggestions(response.data.data.suggestions.length > 0);
    } catch (error) {
      console.error('Address validation failed:', error);
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const getAddressSuggestions = async () => {
    if (!billingInfo.postalCode) return;

    try {
      const response = await api.post('/api/checkout/address-suggestions', {
        postal_code: billingInfo.postalCode,
        house_number: billingInfo.address.split(' ')[0] || undefined,
      });

      const suggestions = response.data.data;
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        setBillingInfo((prev) => ({
          ...prev,
          address: `${suggestion.house_number} ${suggestion.street}`,
          city: suggestion.city,
        }));
      }
    } catch (error) {
      console.error('Failed to get address suggestions:', error);
    }
  };

  const applySuggestion = (suggestion: AddressSuggestion) => {
    setBillingInfo((prev) => ({
      ...prev,
      address: `${suggestion.house_number} ${suggestion.street}`,
      postalCode: suggestion.postal_code,
      city: suggestion.city,
    }));
    setShowAddressSuggestions(false);
    setAddressValidation(null);
  };

  const handlePlaceOrder = async () => {
    if (!validateBillingInfo()) {
      return;
    }

    if (!acceptTerms) {
      alert('Je moet akkoord gaan met de algemene voorwaarden');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare cart items for checkout
      const cartItems = isAuthenticated
        ? cart?.items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })) || []
        : guestCart.items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          }));

      // Prepare checkout request
      const checkoutRequest = {
        billing_info: {
          first_name: billingInfo.firstName,
          preposition: billingInfo.preposition,
          last_name: billingInfo.lastName,
          email: billingInfo.email,
          phone: billingInfo.phone,
          address: {
            street: billingInfo.address,
            house_number: billingInfo.address.split(' ')[0] || '1', // Simple extraction
            postal_code: billingInfo.postalCode,
            city: billingInfo.city,
            province: 'Noord-Holland', // Default province, should be dynamic
            country: billingInfo.country,
          },
        },
        shipping_info: {
          same_as_billing: true,
          address: null,
        },
        gdpr_consent: {
          terms_and_conditions: acceptTerms,
          privacy_policy: acceptTerms,
          marketing_communications: false,
          data_processing: acceptTerms,
          consent_timestamp: new Date().toISOString(),
          ip_address: '127.0.0.1', // This should be determined server-side
          user_agent: navigator.userAgent,
        },
        guest_account_creation: !isAuthenticated,
        notes: null,
        cart_items: cartItems,
      };

      // Send checkout request to backend
      const response = await api.post('/checkout/process', checkoutRequest);

      // Redirect to payment URL
      if (response.data.data.payment_url) {
        window.location.href = response.data.data.payment_url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error: unknown) {
      console.error('Failed to place order:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || 'Onbekende fout';
      alert(
        'Er is een fout opgetreden bij het plaatsen van je bestelling: ' +
          errorMessage,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const orderSummary = calculateOrderSummary();
  const hasItems = isAuthenticated
    ? (cart?.items?.length || 0) > 0
    : guestCart.items.length > 0;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <FiLoader className='animate-spin w-5 h-5 text-primary-500' />
          <span>Bestelling laden...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={() => window.location.reload()}>
            Probeer Opnieuw
          </Button>
        </div>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        <div className='container mx-auto px-4 py-8'>
          <div className='max-w-2xl mx-auto text-center'>
            <FiShoppingBag className='w-16 h-16 text-neutral-400 mx-auto mb-6' />
            <h1 className='heading-2 mb-4'>Je winkelwagen is leeg</h1>
            <p className='text-neutral-600 mb-8'>
              Voeg eerst producten toe aan je winkelwagen voordat je kunt
              afrekenen.
            </p>
            <Link href='/shop'>
              <Button leftIcon={<FiArrowLeft />}>Verder Winkelen</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center space-x-4'>
            <Link href='/cart'>
              <Button variant='ghost' size='sm' leftIcon={<FiArrowLeft />}>
                Terug naar Winkelwagen
              </Button>
            </Link>
          </div>
          <h1 className='heading-2'>Afrekenen</h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Billing Information */}
          <div className='lg:col-span-2 space-y-8'>
            {/* User Status */}
            <div className='card p-6'>
              <div className='flex items-center space-x-3 mb-4'>
                <FiUser className='w-5 h-5 text-primary-500' />
                <h2 className='text-xl font-semibold text-neutral-800'>
                  {isAuthenticated ? 'Ingelogd als' : 'Gast Bestelling'}
                </h2>
              </div>
              {isAuthenticated ? (
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <p className='text-green-800'>
                    <strong>{getFullName(user)}</strong>
                    <br />
                    {user?.email}
                  </p>
                </div>
              ) : (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <p className='text-blue-800'>
                    Je rekent af als gast.
                    <Link
                      href='/login'
                      className='ml-1 text-primary-500 hover:underline'
                    >
                      Log in
                    </Link>{' '}
                    voor een snellere checkout.
                  </p>
                </div>
              )}
            </div>

            {/* Billing Information Form */}
            <div className='card p-6'>
              <div className='flex items-center space-x-3 mb-6'>
                <FiMapPin className='w-5 h-5 text-primary-500' />
                <h2 className='text-xl font-semibold text-neutral-800'>
                  Factuurgegevens
                </h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='md:col-span-2'>
                  <Input
                    label='Voornaam'
                    value={billingInfo.firstName}
                    onChange={(e) =>
                      handleInputChange('firstName', e.target.value)
                    }
                    error={errors.firstName}
                    leftIcon={<FiUser />}
                    required
                    disabled={isAuthenticated}
                  />
                </div>
                <div>
                  <Input
                    label='Tussenvoegsel'
                    value={billingInfo.preposition}
                    onChange={(e) =>
                      handleInputChange('preposition', e.target.value)
                    }
                    error={errors.preposition}
                    placeholder='van, de, etc.'
                    disabled={isAuthenticated}
                  />
                </div>
              </div>

              <div className='mt-4'>
                <Input
                  label='Achternaam'
                  value={billingInfo.lastName}
                  onChange={(e) =>
                    handleInputChange('lastName', e.target.value)
                  }
                  error={errors.lastName}
                  required
                  disabled={isAuthenticated}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <Input
                  label='E-mailadres'
                  type='email'
                  value={billingInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  leftIcon={<FiMail />}
                  required
                  disabled={isAuthenticated}
                />
                <Input
                  label='Telefoonnummer'
                  type='tel'
                  value={billingInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={errors.phone}
                  leftIcon={<FiPhone />}
                  required
                />
              </div>

              <div className='mt-4'>
                <Input
                  label='Adres'
                  value={billingInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  onBlur={validateAddress}
                  error={errors.address}
                  leftIcon={<FiHome />}
                  required
                />
                {isValidatingAddress && (
                  <div className='mt-2 flex items-center space-x-2 text-sm text-neutral-600'>
                    <FiLoader className='animate-spin w-4 h-4' />
                    <span>Adres valideren...</span>
                  </div>
                )}
                {addressValidation && !addressValidation.is_valid && (
                  <div className='mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-sm text-yellow-800 mb-2'>
                      Dit adres kon niet gevalideerd worden (betrouwbaarheid:{' '}
                      {Math.round(addressValidation.validation_score * 100)}%)
                    </p>
                    {showAddressSuggestions &&
                      addressValidation.suggestions.length > 0 && (
                        <div>
                          <p className='text-sm text-yellow-800 mb-2'>
                            Voorgestelde adressen:
                          </p>
                          <div className='space-y-2'>
                            {addressValidation.suggestions
                              .slice(0, 3)
                              .map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => applySuggestion(suggestion)}
                                  className='w-full text-left p-2 bg-white border border-yellow-300 rounded hover:bg-yellow-50 transition-colors'
                                >
                                  <div className='text-sm'>
                                    <div className='font-medium'>
                                      {suggestion.house_number}{' '}
                                      {suggestion.street}
                                    </div>
                                    <div className='text-neutral-600'>
                                      {suggestion.postal_code} {suggestion.city}
                                    </div>
                                    <div className='text-xs text-green-600'>
                                      Betrouwbaarheid:{' '}
                                      {Math.round(suggestion.confidence * 100)}%
                                    </div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
                {addressValidation && addressValidation.is_valid && (
                  <div className='mt-2 flex items-center space-x-2 text-sm text-green-600'>
                    <FiCheckCircle className='w-4 h-4' />
                    <span>Adres gevalideerd</span>
                  </div>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <Input
                  label='Stad'
                  value={billingInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  error={errors.city}
                  required
                />
                <Input
                  label='Postcode'
                  value={billingInfo.postalCode}
                  onChange={(e) =>
                    handleInputChange('postalCode', e.target.value)
                  }
                  onBlur={getAddressSuggestions}
                  error={errors.postalCode}
                  required
                  helperText='Formaat: 1234AB'
                />
                <Input
                  label='Land'
                  value={billingInfo.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                  disabled
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className='card p-6'>
              <div className='flex items-center space-x-3 mb-6'>
                <FiCreditCard className='w-5 h-5 text-primary-500' />
                <h2 className='text-xl font-semibold text-neutral-800'>
                  Betaalmethode
                </h2>
              </div>

              <div className='border-2 border-primary-200 rounded-xl p-4 bg-primary-50'>
                <div className='flex items-center space-x-3'>
                  <div className='w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center'>
                    <div className='w-2 h-2 bg-white rounded-full'></div>
                  </div>
                  <div className='flex-1'>
                    <div className='font-semibold text-neutral-800'>iDEAL</div>
                    <div className='text-sm text-neutral-600'>
                      Betaal veilig met je eigen bank
                    </div>
                  </div>
                  <div className='text-2xl font-bold text-primary-600'>
                    iDEAL
                  </div>
                </div>
              </div>

              <div className='mt-4 p-4 bg-neutral-100 rounded-lg'>
                <div className='flex items-center space-x-2 text-sm text-neutral-600'>
                  <FiShield className='w-4 h-4' />
                  <span>
                    Je wordt na het plaatsen van je bestelling doorgestuurd naar
                    je bank voor een veilige betaling.
                  </span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className='card p-6'>
              <label className='flex items-start space-x-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className='mt-1 w-4 h-4 text-primary-500 border-2 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2'
                />
                <span className='text-sm text-neutral-700'>
                  Ik ga akkoord met de{' '}
                  <Link
                    href='/terms'
                    className='text-primary-500 hover:underline'
                  >
                    algemene voorwaarden
                  </Link>{' '}
                  en het{' '}
                  <Link
                    href='/privacy'
                    className='text-primary-500 hover:underline'
                  >
                    privacybeleid
                  </Link>
                  .
                </span>
              </label>
            </div>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='card p-6 sticky top-4'>
              <h2 className='text-xl font-semibold text-neutral-800 mb-6'>
                Bestelling Overzicht
              </h2>

              {/* Order Items */}
              <div className='space-y-4 mb-6'>
                {isAuthenticated &&
                  cart?.items.map((item) => {
                    const product = products[item.product_id];
                    if (!product) return null;

                    return (
                      <div
                        key={item.id}
                        className='flex items-center space-x-3'
                      >
                        <div className='relative w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden'>
                          {product.images?.[0].url && (
                            <Image
                              src={product.images?.[0].url}
                              alt={product.name}
                              fill
                              className='object-cover'
                            />
                          )}
                        </div>
                        <div className='flex-1'>
                          <div className='font-medium text-neutral-800 line-clamp-1'>
                            {product.name}
                          </div>
                          <div className='text-sm text-neutral-600'>
                            {item.quantity}x €
                            {(item.unit_price_cents / 100).toFixed(2)}
                          </div>
                        </div>
                        <div className='font-semibold text-neutral-800'>
                          €
                          {(
                            (item.quantity * item.unit_price_cents) /
                            100
                          ).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}

                {!isAuthenticated &&
                  guestCart.items.map((item) => {
                    const product = products[item.product_id];
                    if (!product) return null;

                    return (
                      <div
                        key={item.product_id}
                        className='flex items-center space-x-3'
                      >
                        <div className='relative w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden'>
                          {product.images?.[0].url && (
                            <Image
                              src={product.images?.[0].url}
                              alt={product.name}
                              fill
                              className='object-cover'
                            />
                          )}
                        </div>
                        <div className='flex-1'>
                          <div className='font-medium text-neutral-800 line-clamp-1'>
                            {product.name}
                          </div>
                          <div className='text-sm text-neutral-600'>
                            {item.quantity}x €{product.price.toFixed(2)}
                          </div>
                        </div>
                        <div className='font-semibold text-neutral-800'>
                          €{(item.quantity * product.price).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className='border-t border-neutral-200 pt-4 space-y-3'>
                {/* Subtotal */}
                <div className='flex justify-between text-neutral-700'>
                  <span>Subtotaal ({orderSummary.itemCount} items)</span>
                  <span>
                    €{(orderSummary.subtotal + orderSummary.tax).toFixed(2)}
                  </span>
                </div>

                {/* Tax */}
                <div className='flex justify-between text-neutral-700 text-sm'>
                  <span>Waarvan BTW (21%)</span>
                  <span>€{orderSummary.tax.toFixed(2)}</span>
                </div>

                {/* Shipping */}
                <div className='flex justify-between text-neutral-700'>
                  <div className='flex items-center space-x-1'>
                    <FiTruck className='w-4 h-4' />
                    <span>Verzendkosten</span>
                  </div>
                  <span>
                    {orderSummary.shipping === 0 ? (
                      <span className='text-green-600 font-medium'>Gratis</span>
                    ) : (
                      `€${orderSummary.shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                {orderSummary.shipping === 0 && (
                  <div className='text-xs text-green-600 bg-green-50 p-2 rounded'>
                    Gratis verzending vanaf €75
                  </div>
                )}
              </div>

              <div className='border-t border-neutral-300 pt-4 mt-4'>
                <div className='flex justify-between text-lg font-semibold text-neutral-800'>
                  <span>Totaal</span>
                  <span>€{orderSummary.total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                fullWidth
                size='lg'
                onClick={handlePlaceOrder}
                loading={isProcessing}
                disabled={!acceptTerms}
                className='mt-6'
                leftIcon={!isProcessing ? <FiCreditCard /> : undefined}
              >
                {isProcessing
                  ? 'Bestelling Plaatsen...'
                  : 'Bestelling Plaatsen'}
              </Button>

              <div className='mt-4 text-center'>
                <div className='flex items-center justify-center space-x-2 text-sm text-neutral-600'>
                  <FiShield className='w-4 h-4' />
                  <span>Veilig betalen met iDEAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
