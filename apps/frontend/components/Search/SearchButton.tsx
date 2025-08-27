'use client';

import React from 'react';
import { useSearchContext } from '@//context/SearchContext';
import { FiSearch } from 'react-icons/fi';

interface SearchButtonProps {
  variant?: 'default' | 'mobile' | 'minimal';
  className?: string;
  showText?: boolean;
}

const SearchButton: React.FC<SearchButtonProps> = ({
  variant = 'default',
  className = '',
  showText = true,
}) => {
  const { openSearch } = useSearchContext();

  const baseClasses =
    'flex items-center gap-2 transition-colors focus:outline-none';

  const variantClasses = {
    default: 'px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200',
    mobile: 'p-3 text-gray-600 hover:text-[#d4a574]',
    minimal: 'p-2 text-gray-500 hover:text-gray-700',
  };

  return (
    <button
      onClick={openSearch}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label='Open search'
    >
      <FiSearch className='w-5 h-5' />
      {showText && variant === 'default' && (
        <span className='text-sm'>Zoeken...</span>
      )}
    </button>
  );
};

export default SearchButton;
