'use client';

import { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { mockProducts } from '../data/products';

interface UseSearchOptions {
  searchFields?: (keyof Product)[];
  minSearchLength?: number;
  debounceDelay?: number;
}

interface SearchResult {
  products: Product[];
  isSearching: boolean;
  searchQuery: string;
  hasSearched: boolean;
  totalResults: number;
}

export const useSearch = (options: UseSearchOptions = {}): SearchResult & {
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
} => {
  const {
    searchFields = ['name', 'description', 'category'],
    minSearchLength = 2,
    debounceDelay = 300,
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, debounceDelay);

    if (searchQuery.length >= minSearchLength) {
      setIsSearching(true);
    }

    return () => clearTimeout(timer);
  }, [searchQuery, debounceDelay, minSearchLength]);

  // Update hasSearched when we have a debounced query
  useEffect(() => {
    if (debouncedQuery.length >= minSearchLength) {
      setHasSearched(true);
    } else if (debouncedQuery.length === 0) {
      setHasSearched(false);
    }
  }, [debouncedQuery, minSearchLength]);

  // Search logic
  const searchResults = useMemo(() => {
    if (debouncedQuery.length < minSearchLength) {
      return [];
    }

    const query = debouncedQuery.toLowerCase().trim();

    return mockProducts.filter((product) => {
      // Search in specified fields
      const matchesFields = searchFields.some((field) => {
        const value = product[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (Array.isArray(value)) {
          return value.some((item) =>
            typeof item === 'string' && item.toLowerCase().includes(query)
          );
        }
        return false;
      });

      // Also search in colors and occasions if they exist
      const matchesColors = product.colors?.some((color) =>
        color.toLowerCase().includes(query)
      ) || false;

      const matchesOccasions = product.occasion?.some((occasion) =>
        occasion.toLowerCase().includes(query)
      ) || false;

      return matchesFields || matchesColors || matchesOccasions;
    });
  }, [debouncedQuery, searchFields, minSearchLength]);

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setHasSearched(false);
    setIsSearching(false);
  };

  return {
    products: searchResults,
    isSearching,
    searchQuery,
    hasSearched,
    totalResults: searchResults.length,
    setSearchQuery,
    clearSearch,
  };
};

// Hook for getting search suggestions
export const useSearchSuggestions = (query: string, limit: number = 5) => {
  return useMemo(() => {
    if (query.length < 2) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    mockProducts.forEach((product) => {
      // Add matching product names
      if (product.name.toLowerCase().includes(queryLower)) {
        suggestions.add(product.name);
      }

      // Add matching categories
      if (product.category.toLowerCase().includes(queryLower)) {
        suggestions.add(product.category);
      }

      // Add matching occasions
      product.occasion?.forEach((occasion) => {
        if (occasion.toLowerCase().includes(queryLower)) {
          suggestions.add(occasion);
        }
      });

      // Add matching colors
      product.colors?.forEach((color) => {
        if (color.toLowerCase().includes(queryLower)) {
          suggestions.add(color.replace('-', ' '));
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }, [query, limit]);
};
