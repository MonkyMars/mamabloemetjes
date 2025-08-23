'use client';

import Link from 'next/link';
import {
  FiPhone,
  FiMail,
  FiInstagram,
  FiFacebook,
  FiHeart,
} from 'react-icons/fi';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { label: 'Alle Producten', href: '/shop' },
      { label: 'Boeketten', href: '/shop/bouquets' },
      { label: 'Arrangementen', href: '/shop/arrangements' },
      { label: 'Seizoen', href: '/shop/seasonal' },
      { label: 'Maatwerk', href: '/custom' },
    ],
    info: [
      { label: 'Over Ons', href: '/about' },
      { label: 'Ons Verhaal', href: '/story' },
      { label: 'Verzorgingsinstructies', href: '/care' },
      { label: 'Verzendinfo', href: '/shipping' },
      { label: 'Retourneren', href: '/returns' },
    ],
    support: [
      { label: 'Contact', href: '/contact' },
      { label: 'Veelgestelde Vragen', href: '/faq' },
      { label: 'Maatgids', href: '/size-guide' },
      { label: 'Bestelling Volgen', href: '/track' },
      { label: 'Cadeaubonnen', href: '/gift-cards' },
    ],
  };

  return (
    <footer className='bg-[#2d2820] text-[#f5f2ee]'>
      {/* Newsletter Section */}
      <div className='border-b border-[#453d30]'>
        <div className='container py-12'>
          <div className='max-w-2xl mx-auto text-center'>
            <h3 className='text-2xl font-family-serif font-semibold mb-4 text-[#e8c4a0]'>
              Blijf in Bloei
            </h3>
            <p className='text-[#d6ccc0] mb-6'>
              Abonneer je op onze nieuwsbrief voor exclusieve aanbiedingen,
              verzorgingstips en als eerste toegang tot nieuwe collecties.
            </p>
            <form className='flex flex-col sm:flex-row gap-4 max-w-md mx-auto'>
              <input
                type='email'
                placeholder='Jouw e-mailadres'
                className='flex-1 px-4 py-3 bg-[#453d30] border border-[#615340] rounded-xl text-white placeholder-[#9a8470] focus:border-[#d4a574] focus:outline-none focus:ring-4 focus:ring-[#d4a574]/20 transition-all duration-300'
                required
              />
              <button
                type='submit'
                className='px-6 py-3 bg-[#d4a574] hover:bg-[#b8956a] text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1'
              >
                Aanmelden
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className='container py-16'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12'>
          {/* Brand Section */}
          <div className='lg:col-span-2'>
            <div className='flex items-center space-x-3 mb-6'>
              <div className='w-12 h-12 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] rounded-full flex items-center justify-center'>
                <span className='text-white font-family-serif font-bold text-xl'>
                  M
                </span>
              </div>
              <div>
                <h2 className='text-xl font-family-serif font-bold text-[#e8c4a0]'>
                  Mama Bloemetjes
                </h2>
                <p className='text-sm text-[#9a8470] -mt-1'>
                  Handgemaakte Fluwelen Bloemen
                </p>
              </div>
            </div>
            <p className='text-[#d6ccc0] mb-6 leading-relaxed'>
              Het creëren van prachtige, blijvende herinneringen met
              handgemaakte fluwelen bloemen. Elk stuk wordt met liefde gemaakt
              om warmte en elegantie te brengen in jouw bijzondere momenten.
            </p>

            {/* Contact Information */}
            <div className='space-y-3'>
              <div className='flex items-center space-x-3 text-[#d6ccc0]'>
                <FiPhone className='w-5 h-5 text-[#ddb7ab] flex-shrink-0' />
                <span>+31 6 00 00 00 00</span>
              </div>
              <div className='flex items-center space-x-3 text-[#d6ccc0]'>
                <FiMail className='w-5 h-5 text-[#ddb7ab] flex-shrink-0' />
                <span>hello@mamabloemetjes.nl</span>
              </div>
            </div>

            {/* Social Media */}
            <div className='flex space-x-4 mt-6'>
              <a
                href='https://instagram.com/mamabloemetjes'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 bg-[#453d30] hover:bg-[#d4a574] text-[#d6ccc0] hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-1'
                aria-label='Volg ons op Instagram'
              >
                <FiInstagram className='w-5 h-5' />
              </a>
              <a
                href='https://facebook.com/mamabloemetjes'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 bg-[#453d30] hover:bg-[#d4a574] text-[#d6ccc0] hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-1'
                aria-label='Volg ons op Facebook'
              >
                <FiFacebook className='w-5 h-5' />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className='text-lg font-family-serif font-semibold text-[#e8c4a0] mb-6'>
              Winkel
            </h3>
            <ul className='space-y-3'>
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-[#d6ccc0] hover:text-[#ddb7ab] transition-colors duration-300 text-sm'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information Links */}
          <div>
            <h3 className='text-lg font-family-serif font-semibold text-[#e8c4a0] mb-6'>
              Informatie
            </h3>
            <ul className='space-y-3'>
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-[#d6ccc0] hover:text-[#ddb7ab] transition-colors duration-300 text-sm'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className='text-lg font-family-serif font-semibold text-[#e8c4a0] mb-6'>
              Ondersteuning
            </h3>
            <ul className='space-y-3'>
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-[#d6ccc0] hover:text-[#ddb7ab] transition-colors duration-300 text-sm'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className='border-t border-[#453d30]'>
        <div className='container py-6'>
          <div className='flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0'>
            <div className='flex items-center space-x-4 text-sm text-[#9a8470]'>
              <span>© {currentYear} Mama Bloemetjes</span>
              <span>•</span>
              <Link
                href='/privacy'
                className='hover:text-[#ddb7ab] transition-colors duration-300'
              >
                Privacybeleid
              </Link>
              <span>•</span>
              <Link
                href='/terms'
                className='hover:text-[#ddb7ab] transition-colors duration-300'
              >
                Algemene Voorwaarden
              </Link>
            </div>

            <div className='flex items-center space-x-2 text-sm text-[#9a8470]'>
              <span>Gemaakt met</span>
              <FiHeart className='w-4 h-4 text-[#ddb7ab]' />
              <span>in Amsterdam</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
