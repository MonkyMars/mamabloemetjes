'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchContext } from '../context/SearchContext';
import { useSearchSuggestions } from '../hooks/useSearch';
import {
  FiSearch,
  FiX,
  FiArrowRight,
  FiTrendingUp,
  FiClock,
} from 'react-icons/fi';
import Image from 'next/image';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  showSuggestions?: boolean;
  onResultClick?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  className = '',
  placeholder = 'Search flowers, arrangements, occasions...',
  showSuggestions = true,
  onResultClick,
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    searchQuery,
    searchResults,
    isSearching,
    hasSearched,
    totalResults,
    setSearchQuery,
    clearSearch,
    isSearchOpen,
    closeSearch,
  } = useSearchContext();

  const suggestions = useSearchSuggestions(searchQuery, 5);

  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleProductClick = useCallback(
    (productId: string) => {
      router.push(`/shop/${productId}`);
      setShowResults(false);
      closeSearch();
      onResultClick?.();
    },
    [router, closeSearch, onResultClick],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setSearchQuery(suggestion);
      setShowResults(true);
      inputRef.current?.focus();
    },
    [setSearchQuery],
  );

  const handleViewAllResults = useCallback(() => {
    router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    setShowResults(false);
    closeSearch();
    onResultClick?.();
  }, [router, searchQuery, closeSearch, onResultClick]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : searchResults.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
            handleProductClick(searchResults[selectedIndex].id);
          } else if (searchQuery.trim()) {
            handleViewAllResults();
          }
          break;
        case 'Escape':
          setShowResults(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    showResults,
    selectedIndex,
    searchResults,
    searchQuery,
    handleProductClick,
    handleViewAllResults,
  ]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowResults(value.length >= 2);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setShowResults(true);
    }
  };

  const handleClear = () => {
    clearSearch();
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi',
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className='bg-[#d4a574]/20 text-[#2d2820]'>
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <FiSearch className='w-5 h-5 text-[#7d6b55]' />
        </div>

        <input
          ref={inputRef}
          type='text'
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className='w-full pl-10 pr-10 py-3 border border-[#e8e2d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574] focus:border-transparent bg-white text-[#2d2820] placeholder-[#7d6b55]'
        />

        {searchQuery && (
          <button
            onClick={handleClear}
            className='absolute inset-y-0 right-0 pr-3 flex items-center text-[#7d6b55] hover:text-[#d4a574] transition-colors'
          >
            <FiX className='w-5 h-5' />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className='absolute top-full left-0 right-0 mt-2 bg-white border border-[#e8e2d9] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto'
        >
          {isSearching && (
            <div className='p-4 text-center text-[#7d6b55]'>
              <div className='animate-spin w-5 h-5 border-2 border-[#d4a574] border-t-transparent rounded-full mx-auto mb-2'></div>
              Searching...
            </div>
          )}

          {!isSearching && hasSearched && (
            <>
              {/* Search Results Header */}
              {totalResults > 0 && (
                <div className='p-3 border-b border-[#e8e2d9] bg-[#f5f2ee]'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-[#2d2820]'>
                      {totalResults} result{totalResults !== 1 ? 's' : ''} found
                    </span>
                    <button
                      onClick={handleViewAllResults}
                      className='text-sm text-[#d4a574] hover:text-[#b8935f] font-medium flex items-center space-x-1'
                    >
                      <span>View all</span>
                      <FiArrowRight className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              )}

              {/* Product Results */}
              {searchResults.length > 0 ? (
                <div className='py-2'>
                  {searchResults.slice(0, 6).map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-[#f5f2ee] transition-colors flex items-center space-x-3 ${
                        selectedIndex === index ? 'bg-[#f5f2ee]' : ''
                      }`}
                    >
                      <Image
                        width={48}
                        height={48}
                        src={product.imageUrl}
                        alt={product.name}
                        className='w-12 h-12 rounded-lg object-cover'
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='text-sm font-medium text-[#2d2820] truncate'>
                          {highlightText(product.name, searchQuery)}
                        </div>
                        <div className='text-xs text-[#7d6b55] truncate'>
                          {highlightText(product.category, searchQuery)}
                        </div>
                        <div className='text-sm font-medium text-[#d4a574]'>
                          {formatPrice(product.price)}
                        </div>
                      </div>
                      {product.stock < 5 && (
                        <span className='text-xs text-orange-600 font-medium'>
                          Low stock
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className='p-6 text-center'>
                  <FiSearch className='w-12 h-12 text-[#7d6b55] mx-auto mb-3' />
                  <h3 className='text-sm font-medium text-[#2d2820] mb-1'>
                    No results found
                  </h3>
                  <p className='text-xs text-[#7d6b55]'>
                    Try searching for something else
                  </p>
                </div>
              )}
            </>
          )}

          {/* Suggestions */}
          {!hasSearched && showSuggestions && suggestions.length > 0 && (
            <div className='py-2'>
              <div className='px-4 py-2 text-xs font-medium text-[#7d6b55] uppercase tracking-wide border-b border-[#e8e2d9]'>
                <FiTrendingUp className='w-4 h-4 inline mr-2' />
                Popular searches
              </div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className='w-full px-4 py-2 text-left hover:bg-[#f5f2ee] transition-colors flex items-center space-x-3 text-sm text-[#2d2820]'
                >
                  <FiClock className='w-4 h-4 text-[#7d6b55]' />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
