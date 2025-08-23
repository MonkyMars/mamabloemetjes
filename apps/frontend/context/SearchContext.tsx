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
    results,
    isLoading,
    totalResults,
    setSearchQuery,
    clearSearch: clearSearchHook,
  } = useSearch({
    searchFields: ['name', 'description', 'colors'],
    minSearchLength: 2,
    debounceDelay: 300,
  });

  // Track search state
  const [searchQuery, setSearchQueryState] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Update search query and track search state
  const handleSetSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      setSearchQuery(query);
      if (query.trim()) {
        setHasSearched(true);
      }
    },
    [setSearchQuery],
  );

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
    setSearchQueryState('');
    setHasSearched(false);
    setIsSearchOpen(false);
  }, [clearSearchHook]);

  const value: SearchContextType = {
    // Search state
    searchQuery,
    searchResults: results,
    isSearching: isLoading,
    hasSearched,
    totalResults,

    // Search UI state
    isSearchOpen,

    // Actions
    setSearchQuery: handleSetSearchQuery,
    clearSearch,
    openSearch,
    closeSearch,
    toggleSearch,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};

export const useSearchContext = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};
