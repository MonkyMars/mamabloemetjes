'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchContext } from '@/context/SearchContext';
import { useSearchSuggestions, usePopularSearches } from '@/hooks/useSearch';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import {
  FiSearch,
  FiX,
  FiArrowRight,
  FiTrendingUp,
  FiLoader,
} from 'react-icons/fi';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const {
    searchQuery,
    searchResults,
    isSearching,
    hasSearched,
    totalResults,
    setSearchQuery,
    clearSearch,
  } = useSearchContext();

  const suggestions = useSearchSuggestions(localQuery);
  const popularSearches = usePopularSearches(5);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    const availableSuggestions =
      localQuery.length >= 2 ? suggestions : popularSearches;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < availableSuggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : availableSuggestions.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(availableSuggestions[selectedSuggestionIndex]);
        } else if (localQuery.trim()) {
          handleSearch(localQuery);
        }
        break;
      case 'Tab':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          setLocalQuery(availableSuggestions[selectedSuggestionIndex]);
          setSelectedSuggestionIndex(-1);
        }
        break;
    }
  };

  const handleInputChange = (value: string) => {
    setLocalQuery(value);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(true);

    // Auto-search after a delay
    if (value.trim().length >= 2) {
      setSearchQuery(value);
    } else if (value.trim().length === 0) {
      clearSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion);
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
      setShowSuggestions(false);
      // Navigate to shop page with search query
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleViewAllResults = () => {
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    clearSearch();
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
    onClose();
  };

  if (!isOpen) return null;

  const displaySuggestions =
    localQuery.length >= 2 ? suggestions : popularSearches;
  const showResults = hasSearched && searchQuery.length >= 2;
  const hasResults = searchResults.length > 0;

  return (
    <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'>
      <div className='flex min-h-screen items-start justify-center p-4 pt-16'>
        <div className='w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[80vh] flex flex-col'>
          {/* Search Header */}
          <div className='p-6 border-b border-gray-100'>
            <div className='flex items-center gap-4'>
              <div className='flex-1 relative'>
                <FiSearch className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  ref={searchInputRef}
                  type='text'
                  placeholder='Zoek naar bloemen, boeketten...'
                  value={localQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  className='w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-[#d4a574] focus:outline-none transition-colors'
                />
                {localQuery && (
                  <button
                    onClick={handleClearSearch}
                    className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  >
                    <FiX className='w-5 h-5' />
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
              >
                <FiX className='w-6 h-6' />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className='flex-1 overflow-hidden'>
            {showSuggestions &&
              displaySuggestions.length > 0 &&
              !showResults && (
                <div className='p-6'>
                  <div className='flex items-center gap-2 mb-4'>
                    {localQuery.length >= 2 ? (
                      <FiSearch className='w-4 h-4 text-gray-500' />
                    ) : (
                      <FiTrendingUp className='w-4 h-4 text-gray-500' />
                    )}
                    <span className='text-sm font-medium text-gray-500'>
                      {localQuery.length >= 2
                        ? 'Suggesties'
                        : 'Populaire zoekopdrachten'}
                    </span>
                  </div>
                  <div className='space-y-1'>
                    {displaySuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                          index === selectedSuggestionIndex
                            ? 'bg-[#d4a574]/10 text-[#d4a574]'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <FiSearch className='w-4 h-4 text-gray-400' />
                        <span>{suggestion}</span>
                        <FiArrowRight className='w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity' />
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {isSearching && (
              <div className='flex items-center justify-center py-12'>
                <div className='flex items-center gap-3 text-gray-500'>
                  <FiLoader className='w-5 h-5 animate-spin' />
                  <span>Zoeken...</span>
                </div>
              </div>
            )}

            {showResults && !isSearching && (
              <div className='flex-1 overflow-y-auto'>
                {hasResults ? (
                  <div className='p-6'>
                    <div className='flex items-center justify-between mb-6'>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          Zoekresultaten voor &apos;{searchQuery}&apos;
                        </h3>
                        <p className='text-sm text-gray-500 mt-1'>
                          {totalResults}{' '}
                          {totalResults === 1 ? 'resultaat' : 'resultaten'}{' '}
                          gevonden
                        </p>
                      </div>
                      <button
                        onClick={handleViewAllResults}
                        className='flex items-center gap-2 px-4 py-2 bg-[#d4a574] text-white rounded-lg hover:bg-[#c19660] transition-colors'
                      >
                        Alle resultaten
                        <FiArrowRight className='w-4 h-4' />
                      </button>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                      {searchResults.slice(0, 6).map((product: Product) => (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product.id)}
                          className='cursor-pointer transform hover:scale-105 transition-transform'
                        >
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>

                    {totalResults > 6 && (
                      <div className='mt-6 text-center'>
                        <button
                          onClick={handleViewAllResults}
                          className='inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
                        >
                          Bekijk alle {totalResults} resultaten
                          <FiArrowRight className='w-4 h-4' />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-12 px-6 text-center'>
                    <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                      <FiSearch className='w-8 h-8 text-gray-400' />
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      Geen resultaten gevonden
                    </h3>
                    <p className='text-gray-500 mb-6 max-w-md'>
                      We konden geen bloemen vinden die overeenkomen met &apos;
                      {searchQuery}&apos;. Probeer een ander zoekwoord of bekijk
                      onze populaire categorieën.
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {popularSearches.slice(0, 3).map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSuggestionClick(term)}
                          className='px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors'
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!showSuggestions && !showResults && !isSearching && (
              <div className='flex flex-col items-center justify-center py-12 px-6 text-center'>
                <div className='w-16 h-16 bg-[#d4a574]/10 rounded-full flex items-center justify-center mb-4'>
                  <FiSearch className='w-8 h-8 text-[#d4a574]' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Zoek door onze collectie
                </h3>
                <p className='text-gray-500 mb-6 max-w-md'>
                  Vind de perfecte bloemen voor elke gelegenheid. Zoek op naam,
                  kleur, type of gelegenheid.
                </p>
                {popularSearches.length > 0 && (
                  <div>
                    <p className='text-sm font-medium text-gray-700 mb-3 flex items-center gap-2'>
                      <FiTrendingUp className='w-4 h-4' />
                      Populaire zoekopdrachten
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {popularSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSuggestionClick(term)}
                          className='px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors'
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
