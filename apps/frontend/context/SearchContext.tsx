'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSearch } from '../hooks/useSearch';
import { Product } from '../types';

interface SearchContextType {
  // Search state
  searchQuery: string;
  searchResults: Product[];
  isSearching: boolean;
  hasSearched: boolean;
  totalResults: number;

  // Search UI state
  isSearchOpen: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const {
    products: searchResults,
    isSearching,
    searchQuery,
    hasSearched,
    totalResults,
    setSearchQuery,
    clearSearch: clearSearchHook,
  } = useSearch({
    searchFields: ['name', 'description', 'category'],
    minSearchLength: 2,
    debounceDelay: 300,
  });

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
  }, []);

  const clearSearch = useCallback(() => {
    clearSearchHook();
    setIsSearchOpen(false);
  }, [clearSearchHook]);

  const value: SearchContextType = {
    // Search state
    searchQuery,
    searchResults,
    isSearching,
    hasSearched,
    totalResults,

    // Search UI state
    isSearchOpen,

    // Actions
    setSearchQuery,
    clearSearch,
    openSearch,
    closeSearch,
    toggleSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};
