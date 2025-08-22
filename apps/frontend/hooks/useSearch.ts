'use client';

import { useState, useEffect } from 'react';
import { Product } from '../types';
import { searchProducts } from '../data/product';

interface UseSearchOptions {
  searchFields?: (keyof Product)[];
  minSearchLength?: number;
  debounceDelay?: number;
}

interface SearchResult {
  results: Product[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
}

export const useSearch = (
  options: UseSearchOptions = {},
): SearchResult & {
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
} => {
  const { minSearchLength = 2, debounceDelay = 300 } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceDelay]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < minSearchLength) {
        setResults([]);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const searchResults = await searchProducts(debouncedQuery);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, minSearchLength]);

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setResults([]);
    setError(null);
  };

  return {
    results,
    isLoading,
    error,
    totalResults: results.length,
    setSearchQuery,
    clearSearch,
  };
};

// Hook for search suggestions
export const useSearchSuggestions = (query: string): string[] => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const generateSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        // Get search results and extract suggestions from product names
        const searchResults = await searchProducts(query);
        const productSuggestions = searchResults
          .map((product) => product.name)
          .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5);

        // Add some common search terms based on the query
        const commonSuggestions: string[] = [];
        const queryLower = query.toLowerCase();

        if (queryLower.includes('rose') || queryLower.includes('red')) {
          commonSuggestions.push('Red Roses', 'Rose Bouquet');
        }
        if (queryLower.includes('wedding') || queryLower.includes('bride')) {
          commonSuggestions.push('Wedding Flowers', 'Bridal Bouquet');
        }
        if (queryLower.includes('birth') || queryLower.includes('gift')) {
          commonSuggestions.push('Birthday Flowers', 'Gift Bouquet');
        }

        const allSuggestions = [
          ...new Set([...productSuggestions, ...commonSuggestions]),
        ].slice(0, 5);

        setSuggestions(allSuggestions);
      } catch (error) {
        console.error('Failed to generate suggestions:', error);
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(generateSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return suggestions;
};
