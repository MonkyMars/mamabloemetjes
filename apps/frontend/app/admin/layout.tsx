'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import {
  FiShield,
  FiUsers,
  FiBarChart,
  FiPackage,
  FiSettings,
  FiChevronLeft,
  FiHome,
} from 'react-icons/fi';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Show loading state
  if (isLoading) {
    return (
      <div className='min-h-screen bg-[#faf9f7] flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-[#d4a574] border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-[#7d6b55]'>Laden...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className='min-h-screen bg-[#faf9f7] flex items-center justify-center px-4'>
        <div className='text-center'>
          <FiShield className='w-16 h-16 text-[#d4a574] mx-auto mb-4' />
          <h1 className='text-2xl font-medium text-[#2d2820] mb-4'>
            Toegang Geweigerd
          </h1>
          <p className='text-[#7d6b55] mb-6'>
            Je hebt geen beheerrechten om deze pagina te bekijken.
          </p>
          <Link href='/profile'>
            <Button variant='primary'>Terug naar Profiel</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#faf9f7]'>
      {/* Admin Header */}
      <div className='bg-white border-b border-[#e8e2d9] sticky top-0 z-40'>
        <div className='container mx-auto px-4 max-w-7xl'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-4'>
              <FiShield className='w-6 h-6 text-[#d4a574]' />
              <h1 className='text-lg font-medium text-[#2d2820]'>
                Admin Dashboard
              </h1>
              <span className='px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                Administrator
              </span>
            </div>
            <div className='flex items-center space-x-3'>
              <Link href='/profile'>
                <Button
                  variant='ghost'
                  size='sm'
                  leftIcon={<FiChevronLeft className='w-4 h-4' />}
                >
                  Terug naar Profiel
                </Button>
              </Link>
              <Link href='/'>
                <Button
                  variant='ghost'
                  size='sm'
                  leftIcon={<FiHome className='w-4 h-4' />}
                >
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className='bg-white border-b border-[#e8e2d9]'>
        <div className='container mx-auto px-4 max-w-7xl'>
          <nav className='flex space-x-8'>
            <Link
              href='/admin/users'
              className='py-4 px-2 border-b-2 border-transparent text-[#7d6b55] hover:text-[#2d2820] hover:border-[#e8e2d9] transition-colors duration-200 flex items-center space-x-2'
            >
              <FiUsers className='w-4 h-4' />
              <span>Gebruikers</span>
            </Link>
            <Link
              href='/admin/orders'
              className='py-4 px-2 border-b-2 border-transparent text-[#7d6b55] hover:text-[#2d2820] hover:border-[#e8e2d9] transition-colors duration-200 flex items-center space-x-2'
            >
              <FiPackage className='w-4 h-4' />
              <span>Bestellingen</span>
            </Link>
            <Link
              href='/admin/analytics'
              className='py-4 px-2 border-b-2 border-transparent text-[#7d6b55] hover:text-[#2d2820] hover:border-[#e8e2d9] transition-colors duration-200 flex items-center space-x-2'
            >
              <FiBarChart className='w-4 h-4' />
              <span>Analytics</span>
            </Link>
            <Link
              href='/admin/settings'
              className='py-4 px-2 border-b-2 border-transparent text-[#7d6b55] hover:text-[#2d2820] hover:border-[#e8e2d9] transition-colors duration-200 flex items-center space-x-2'
            >
              <FiSettings className='w-4 h-4' />
              <span>Instellingen</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Admin Content */}
      <main>{children}</main>

      {/* Admin Footer */}
      <footer className='bg-white border-t border-[#e8e2d9] mt-auto'>
        <div className='container mx-auto px-4 max-w-7xl py-6'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-[#7d6b55]'>
              © 2024 Mama Bloemetjes - Admin Dashboard
            </p>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-[#7d6b55]'>
                Ingelogd als: {user?.first_name} {user?.last_name}
              </span>
              <span className='w-2 h-2 bg-green-500 rounded-full'></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;
