'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiShoppingBag,
  FiMenu,
  FiX,
  FiHeart,
  FiPhone,
  FiMail,
} from 'react-icons/fi';
import { useSearchContext } from '../context/SearchContext';
import { SearchModal, SearchButton } from './Search';

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  const { isSearchOpen, closeSearch } = useSearchContext();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // TODO: Connect to cart context/state management
    // This would come from your cart state management solution
    const updateCartCount = () => {
      // Placeholder - would get actual cart count from context
      setCartItemCount(0);
    };

    updateCartCount();
  }, []);

  const navigationLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/about', label: 'Over ons' },
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
              <span>+31 6 12 34 56 78</span>
            </div>
            <div className='hidden sm:flex items-center space-x-2'>
              <FiMail className='w-4 h-4' />
              <span>hello@mamabloemetjes.nl</span>
            </div>
          </div>
          <div className='text-center'>
            <span>Gratis bezorging over de €100</span>
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
                <span className='text-white font-serif font-bold text-xl'>
                  M
                </span>
              </div>
              <div className='hidden sm:block'>
                <h1 className='text-2xl font-serif font-bold text-[#2d2820] group-hover:text-[#d4a574] transition-colors duration-300'>
                  Mama Bloemetjes
                </h1>
                <p className='text-sm text-[#7d6b55] -mt-1'>
                  Handcrafted Velvet Flowers
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

              {/* Wishlist */}
              <button
                className='p-2 text-[#7d6b55] hover:text-[#d4a574] hover:bg-[#f5f2ee] rounded-lg transition-all duration-300'
                aria-label='Wishlist'
              >
                <FiHeart className='w-5 h-5' />
              </button>

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
