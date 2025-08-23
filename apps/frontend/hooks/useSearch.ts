'use client';

import { useState, useEffect } from 'react';
import { Product } from '../types';
import api from '../lib/axios';

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

interface BackendSearchResult {
  products: Product[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  search_time_ms: number;
  suggestions?: string[];
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
  const [totalResults, setTotalResults] = useState(0);

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
        setTotalResults(0);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get<{
          status: string;
          data: BackendSearchResult;
        }>(`/products/search?q=${encodeURIComponent(debouncedQuery)}`);

        if (response.status === 200 && response.data.status === 'success') {
          const searchData = response.data.data;
          setResults(searchData.products);
          setTotalResults(searchData.total_count);
        } else {
          throw new Error('Search request failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
        setTotalResults(0);
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
    setTotalResults(0);
    setError(null);
  };

  return {
    results,
    isLoading,
    error,
    totalResults,
    setSearchQuery,
    clearSearch,
  };
};

// Hook for search suggestions using new backend API
export const useSearchSuggestions = (query: string): string[] => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const generateSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await api.get<{ status: string; data: string[] }>(
          `/products/search/suggestions?q=${encodeURIComponent(query)}`,
        );

        if (response.status === 200 && response.data.status === 'success') {
          setSuggestions(response.data.data.slice(0, 5));
        } else {
          setSuggestions([]);
        }
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

// Hook for popular searches
export const usePopularSearches = (limit: number = 5): string[] => {
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const response = await api.get<{ status: string; data: string[] }>(
          `/products/search/popular?per_page=${limit}`,
        );

        if (response.status === 200 && response.data.status === 'success') {
          setPopularSearches(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch popular searches:', error);
        setPopularSearches([]);
      }
    };

    fetchPopularSearches();
  }, [limit]);

  return popularSearches;
};
