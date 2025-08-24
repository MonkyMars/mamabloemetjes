'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiShoppingBag,
  FiMenu,
  FiX,
  FiPhone,
  FiMail,
  FiUser,
  FiLogOut,
  FiLogIn,
  FiUserPlus,
  FiTruck,
} from 'react-icons/fi';
import { useSearchContext } from '../context/SearchContext';
import { SearchModal, SearchButton } from './Search';
import { useAuth } from '../context/AuthContext';
import { useCart, useGuestCart } from '../hooks/useCart';
import { getFullName } from '@/lib/auth';

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const { isSearchOpen, closeSearch } = useSearchContext();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const authenticatedCart = useCart();
  const guestCart = useGuestCart();

  // Get cart item count based on authentication status
  const cartItemCount = isAuthenticated
    ? authenticatedCart.totalQuantity()
    : guestCart.totalQuantity();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isUserMenuOpen) {
        setTimeout(() => setIsUserMenuOpen(false), 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const navigationLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Bar */}
      <div className='bg-[#8b9dc3] text-white text-sm py-2'>
        <div className='container flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <FiPhone className='w-4 h-4' />
              <span>+31 6 00 00 00 00</span>
            </div>
            <div className='hidden sm:flex items-center space-x-2'>
              <FiMail className='w-4 h-4' />
              <span>hello@mamabloemetjes.nl</span>
            </div>
          </div>
          <div className='hidden sm:flex items-center space-x-2'>
            <FiTruck className='w-4 h-4' />
            <span>Gratis bezorging vanaf €75</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
        }`}
      >
        <div className='container'>
          <div className='flex items-center justify-between h-20'>
            {/* Logo */}
            <Link href='/' className='flex items-center space-x-3 group'>
              <div className='w-12 h-12 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300'>
                <span className='text-white font-family-serif font-bold text-xl'>
                  M
                </span>
              </div>
              <div className='hidden sm:block'>
                <h1 className='text-xl mb-0.5 font-family-serif font-bold text-[#2d2820] group-hover:text-[#d4a574] transition-colors duration-300'>
                  Mama Bloemetjes
                </h1>
                <p className='text-sm text-[#7d6b55] -mt-1'>
                  Handgemaakte Vilt Bloemen
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className='hidden lg:flex items-center space-x-8'>
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-medium transition-colors duration-300 relative group ${
                    isActiveLink(link.href)
                      ? 'text-[#d4a574]'
                      : 'text-[#7d6b55] hover:text-[#d4a574]'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-[#d4a574] transition-all duration-300 ${
                      isActiveLink(link.href)
                        ? 'w-full'
                        : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className='flex items-center space-x-4'>
              {/* Search */}
              <SearchButton
                variant='minimal'
                showText={false}
                className='text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee] rounded-lg'
              />

              {/* Cart */}
              <Link
                href='/cart'
                className='relative p-2 text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee] rounded-lg transition-all duration-300 group'
                aria-label='Shopping cart'
              >
                <FiShoppingBag className='w-5 h-5' />
                {cartItemCount > 0 && (
                  <span className='absolute -top-1 -right-1 bg-[#d4a574] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Link>

              {/* Authentication */}
              {!isLoading && (
                <>
                  {isAuthenticated && user ? (
                    <div className='relative hidden lg:block'>
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className='flex items-center space-x-2 p-2 text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee] rounded-lg transition-all duration-300'
                        aria-label='User menu'
                      >
                        <div className='w-8 h-8 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] rounded-full flex items-center justify-center'>
                          <span className='text-white font-medium text-sm'>
                            {user.first_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className='text-sm font-medium hidden xl:block'>
                          {getFullName(user)}
                        </span>
                      </button>

                      {/* User Dropdown */}
                      {isUserMenuOpen && (
                        <div className='absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50'>
                          <div className='px-4 py-2 border-b border-neutral-100'>
                            <p className='text-sm font-medium text-neutral-900'>
                              {user.email}
                            </p>
                            <p className='text-xs text-neutral-500 capitalize'>
                              {user.role} account
                            </p>
                          </div>
                          <Link
                            href='/profile'
                            className='flex items-center space-x-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-200'
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <FiUser className='w-4 h-4' />
                            <span>Profiel</span>
                          </Link>
                          <button
                            onClick={async () => {
                              await logout();
                              setIsUserMenuOpen(false);
                            }}
                            className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200'
                          >
                            <FiLogOut className='w-4 h-4' />
                            <span>Uitloggen</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='hidden lg:flex items-center space-x-2'>
                      <Link
                        href='/login'
                        className='flex items-center space-x-1 px-3 py-2 text-sm font-medium text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee] rounded-lg transition-all duration-300'
                      >
                        <FiLogIn className='w-4 h-4' />
                        <span>Inloggen</span>
                      </Link>
                      <Link
                        href='/register'
                        className='flex items-center space-x-1 px-3 py-2 text-sm font-medium bg-[#d4a574] hover:bg-[#b8956a] text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md'
                      >
                        <FiUserPlus className='w-4 h-4' />
                        <span>Registreren</span>
                      </Link>
                    </div>
                  )}
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className='lg:hidden p-2 text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee] rounded-lg transition-all duration-300'
                aria-label='Toggle menu'
              >
                {isMenuOpen ? (
                  <FiX className='w-6 h-6' />
                ) : (
                  <FiMenu className='w-6 h-6' />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className='lg:hidden bg-white border-t border-[#e8e2d9] shadow-lg'>
            <div className='container py-6'>
              <div className='flex flex-col space-y-4'>
                {/* Mobile Search */}
                <div className='mb-4'>
                  <SearchButton
                    variant='default'
                    className='w-full justify-center'
                    showText={true}
                  />
                </div>

                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`font-medium py-2 px-4 rounded-lg transition-all duration-300 ${
                      isActiveLink(link.href)
                        ? 'text-[#d4a574] bg-[#f5f2ee]'
                        : 'text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Mobile Authentication */}
                {!isLoading && (
                  <div className='pt-4 mt-4 border-t border-[#e8e2d9]'>
                    {isAuthenticated && user ? (
                      <div className='space-y-4'>
                        <div className='flex items-center space-x-3 px-4 py-2 bg-[#f5f2ee] rounded-lg'>
                          <div className='w-10 h-10 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] rounded-full flex items-center justify-center'>
                            <span className='text-white font-medium'>
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className='text-sm font-medium text-neutral-900'>
                              {user.email}
                            </p>
                            <p className='text-xs text-neutral-500 capitalize'>
                              {user.role} account
                            </p>
                          </div>
                        </div>
                        <Link
                          href='/profile'
                          onClick={() => setIsMenuOpen(false)}
                          className='flex items-center space-x-2 px-4 py-2 text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee] rounded-lg transition-all duration-300'
                        >
                          <FiUser className='w-5 h-5' />
                          <span className='font-medium'>Profiel</span>
                        </Link>
                        <button
                          onClick={async () => {
                            await logout();
                            setIsMenuOpen(false);
                          }}
                          className='flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300'
                        >
                          <FiLogOut className='w-5 h-5' />
                          <span className='font-medium'>Uitloggen</span>
                        </button>
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        <Link
                          href='/login'
                          onClick={() => setIsMenuOpen(false)}
                          className='flex items-center space-x-2 w-full px-4 py-2 text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee] rounded-lg transition-all duration-300'
                        >
                          <FiLogIn className='w-5 h-5' />
                          <span className='font-medium'>Inloggen</span>
                        </Link>
                        <Link
                          href='/register'
                          onClick={() => setIsMenuOpen(false)}
                          className='flex items-center space-x-2 w-full px-4 py-2 bg-[#d4a574] hover:bg-[#b8956a] text-white rounded-lg transition-all duration-300'
                        >
                          <FiUserPlus className='w-5 h-5' />
                          <span className='font-medium'>Registreren</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile Contact Info */}
                <div className='pt-4 mt-4 border-t border-[#e8e2d9]'>
                  <div className='flex flex-col space-y-2 text-sm text-[#7d6b55]'>
                    <div className='flex items-center space-x-2'>
                      <FiPhone className='w-4 h-4' />
                      <span>+31 6 12 34 56 78</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <FiMail className='w-4 h-4' />
                      <span>hello@mamabloemetjes.nl</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
};

export default Navigation;
