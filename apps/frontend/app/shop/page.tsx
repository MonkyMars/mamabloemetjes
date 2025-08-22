'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getProducts, searchProducts } from '../../data/product';
import { Product } from '../../types';
import ProductCard from '../../components/ProductCard';
import { Button } from '../../components/Button';
import { useSearchContext } from '../../context/SearchContext';
import {
  FiFilter,
  FiGrid,
  FiList,
  FiSearch,
  FiX,
  FiChevronDown,
  FiSliders,
} from 'react-icons/fi';
import { NextPage } from 'next';

interface FilterState {
  priceRange: [number, number];
  colors: string[];
  sizes: string[];
  occasions: string[];
}

const ShopComponent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    searchResults,
    searchQuery: globalSearchQuery,
    hasSearched,
    clearSearch,
  } = useSearchContext();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 200],
    colors: [],
    sizes: [],
    occasions: [],
  });

  // Initialize products and handle URL search params
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const urlSearch = searchParams.get('search');

        let loadedProducts: Product[] = [];
        if (urlSearch) {
          setLocalSearchQuery(urlSearch);
          loadedProducts = await searchProducts(urlSearch);
        } else {
          loadedProducts = await getProducts();
        }

        setProducts(loadedProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [searchParams]);

  // Get effective search query and products
  const effectiveSearchQuery = searchParams.get('search') || localSearchQuery;
  const effectiveProducts = useMemo(() => {
    // If we have global search results from navigation, use those
    if (hasSearched && globalSearchQuery && !effectiveSearchQuery) {
      return searchResults;
    }
    return products;
  }, [
    hasSearched,
    globalSearchQuery,
    searchResults,
    products,
    effectiveSearchQuery,
  ]);

  // Get unique filter options
  // Update filter options when products change
  const filterOptions = useMemo(() => {
    return {
      colors: ['red', 'pink', 'white', 'yellow', 'purple', 'blue', 'mixed'],
      sizes: ['small', 'medium', 'large', 'extra-large'],
      occasions: ['wedding', 'anniversary', 'birthday', 'sympathy', 'everyday'],
    };
  }, []);

  // Filter and sort products
  useEffect(() => {
    const filtered = effectiveProducts.filter((product) => {
      // Search query
      if (
        effectiveSearchQuery &&
        !product.name
          .toLowerCase()
          .includes(effectiveSearchQuery.toLowerCase()) &&
        !product.description
          .toLowerCase()
          .includes(effectiveSearchQuery.toLowerCase()) &&
        !product.sku.toLowerCase().includes(effectiveSearchQuery.toLowerCase())
      ) {
        return false;
      }

      // Price range
      if (
        product.price < filters.priceRange[0] ||
        product.price > filters.priceRange[1]
      ) {
        return false;
      }

      // Only show active products
      if (!product.is_active) {
        return false;
      }

      return true;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [effectiveProducts, effectiveSearchQuery, filters, sortBy]);

  const handleFilterChange = (key: keyof FilterState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (
    key: 'colors' | 'sizes' | 'occasions',
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 200],
      colors: [],
      sizes: [],
      occasions: [],
    });
    setLocalSearchQuery('');
    clearSearch();

    // Clear URL search parameter if it exists
    if (searchParams.get('search')) {
      router.push('/shop');
    }
  };

  const clearSearchFilter = () => {
    setLocalSearchQuery('');
    clearSearch();
    if (searchParams.get('search')) {
      router.push('/shop');
    }
  };

  const clearColorFilter = (color: string) => {
    toggleArrayFilter('colors', color);
  };

  const clearSizeFilter = (size: string) => {
    toggleArrayFilter('sizes', size);
  };

  const clearOccasionFilter = (occasion: string) => {
    toggleArrayFilter('occasions', occasion);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen pt-24 pb-16'>
        <div className='container'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {[...Array(8)].map((_, i) => (
              <div key={i} className='card loading-shimmer h-96'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen pt-24 pb-16'>
      <div className='container'>
        {/* Page Header */}
        <div className='mb-12'>
          <h1 className='heading-1 mb-4'>Our Collection</h1>
          <p className='text-lg text-[#7d6b55] max-w-2xl'>
            Discover our beautiful handcrafted velvet flowers, perfect for any
            occasion. Each piece is made with love and attention to detail.
          </p>
        </div>

        {/* Search and Controls */}
        <div className='mb-8'>
          <div className='flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between'>
            {/* Search Bar */}
            <div className='relative flex-1 max-w-md'>
              <FiSearch className='absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9a8470] w-5 h-5' />
              <input
                type='text'
                placeholder='Search flowers...'
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className='input-field pl-12'
              />
            </div>

            <div className='flex items-center gap-4'>
              {/* Sort Dropdown */}
              <div className='relative'>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className='input-field pr-12 appearance-none cursor-pointer'
                >
                  <option value='name'>Sort by Name</option>
                  <option value='price-low'>Price: Low to High</option>
                  <option value='price-high'>Price: High to Low</option>
                  <option value='newest'>Newest First</option>
                </select>
                <FiChevronDown className='absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9a8470] w-5 h-5 pointer-events-none' />
              </div>

              {/* View Toggle */}
              <div className='flex border border-[#e8e2d9] rounded-lg p-1'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#d4a574] text-white' : 'text-[#7d6b55] hover:bg-[#f5f2ee]'}`}
                >
                  <FiGrid className='w-4 h-4' />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#d4a574] text-white' : 'text-[#7d6b55] hover:bg-[#f5f2ee]'}`}
                >
                  <FiList className='w-4 h-4' />
                </button>
              </div>

              {/* Filter Toggle */}
              <Button
                variant='outline'
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<FiFilter className='w-4 h-4' />}
                className='lg:hidden'
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.colors.length > 0 ||
            filters.sizes.length > 0 ||
            filters.occasions.length > 0 ||
            effectiveSearchQuery) && (
            <div className='mt-4 flex flex-wrap items-center gap-2'>
              <span className='text-sm text-[#7d6b55] font-medium'>
                Active filters:
              </span>

              {effectiveSearchQuery && (
                <span className='badge bg-[#d4a574] text-white'>
                  Search: {effectiveSearchQuery}
                  <button onClick={clearSearchFilter} className='ml-2'>
                    <FiX className='w-3 h-3' />
                  </button>
                </span>
              )}

              {filters.colors.map((color) => (
                <span key={color} className='badge bg-[#ddb7ab] text-white'>
                  {color}
                  <button
                    onClick={() => clearColorFilter(color)}
                    className='ml-2'
                  >
                    <FiX className='w-3 h-3' />
                  </button>
                </span>
              ))}

              {filters.sizes.map((size) => (
                <span
                  key={size}
                  className='badge bg-[#a8c8a0] text-white capitalize'
                >
                  {size}
                  <button
                    onClick={() => clearSizeFilter(size)}
                    className='ml-2'
                  >
                    <FiX className='w-3 h-3' />
                  </button>
                </span>
              ))}

              {filters.occasions.map((occasion) => (
                <span key={occasion} className='badge bg-[#b8a8c8] text-white'>
                  {occasion.replace('-', ' ')}
                  <button
                    onClick={() => clearOccasionFilter(occasion)}
                    className='ml-2'
                  >
                    <FiX className='w-3 h-3' />
                  </button>
                </span>
              ))}

              <button
                onClick={clearFilters}
                className='text-sm text-[#d4a574] hover:text-[#b8956a] font-medium ml-2'
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className='flex gap-8'>
          {/* Sidebar Filters */}
          <aside
            className={`w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}
          >
            <div className='card p-6 sticky top-32'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='heading-4 flex items-center'>
                  <FiSliders className='w-5 h-5 mr-2' />
                  Filters
                </h3>
                <button
                  onClick={clearFilters}
                  className='text-sm text-[#d4a574] hover:text-[#b8956a]'
                >
                  Clear all
                </button>
              </div>

              <div className='space-y-6'>
                {/* Price Range */}
                <div>
                  <h4 className='font-medium text-[#2d2820] mb-3'>
                    Price Range
                  </h4>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between text-sm text-[#7d6b55]'>
                      <span>{formatPrice(filters.priceRange[0])}</span>
                      <span>{formatPrice(filters.priceRange[1])}</span>
                    </div>
                    <input
                      type='range'
                      min='0'
                      max='200'
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        handleFilterChange('priceRange', [
                          filters.priceRange[0],
                          parseInt(e.target.value),
                        ])
                      }
                      className='w-full accent-[#d4a574]'
                    />
                  </div>
                </div>

                {/* Colors */}
                {filterOptions.colors.length > 0 && (
                  <div>
                    <h4 className='font-medium text-[#2d2820] mb-3'>Colors</h4>
                    <div className='space-y-2'>
                      {filterOptions.colors.map((color) => (
                        <label
                          key={color}
                          className='flex items-center cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={filters.colors.includes(color)}
                            onChange={() => toggleArrayFilter('colors', color)}
                            className='mr-3 text-[#d4a574] focus:ring-[#d4a574]'
                          />
                          <span className='text-[#7d6b55] capitalize'>
                            {color.replace('-', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {filterOptions.sizes.length > 0 && (
                  <div>
                    <h4 className='font-medium text-[#2d2820] mb-3'>Size</h4>
                    <div className='space-y-2'>
                      {filterOptions.sizes.map((size) => (
                        <label
                          key={size}
                          className='flex items-center cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={filters.sizes.includes(size as string)}
                            onChange={() =>
                              toggleArrayFilter('sizes', size as string)
                            }
                            className='mr-3 text-[#d4a574] focus:ring-[#d4a574]'
                          />
                          <span className='text-[#7d6b55] capitalize'>
                            {size}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Occasions */}
                {filterOptions.occasions.length > 0 && (
                  <div>
                    <h4 className='font-medium text-[#2d2820] mb-3'>
                      Occasions
                    </h4>
                    <div className='space-y-2 max-h-40 overflow-y-auto'>
                      {filterOptions.occasions.map((occasion) => (
                        <label
                          key={occasion}
                          className='flex items-center cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={filters.occasions.includes(occasion)}
                            onChange={() =>
                              toggleArrayFilter('occasions', occasion)
                            }
                            className='mr-3 text-[#d4a574] focus:ring-[#d4a574]'
                          />
                          <span className='text-[#7d6b55] capitalize'>
                            {occasion.replace('-', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className='flex-1'>
            {/* Results Count */}
            <div className='mb-6'>
              <p className='text-[#7d6b55]'>
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>

            {/* Products */}
            {filteredProducts.length > 0 ? (
              <div
                className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-1'
                }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(product) => {
                      console.log('Added to cart:', product.name);
                      // TODO: Implement cart functionality
                    }}
                    onToggleWishlist={(product) => {
                      console.log('Toggled wishlist:', product.name);
                      // TODO: Implement wishlist functionality
                    }}
                    className={viewMode === 'list' ? 'flex-row' : ''}
                  />
                ))}
              </div>
            ) : (
              <div className='text-center py-16'>
                <div className='w-24 h-24 mx-auto mb-6 bg-[#f5f2ee] rounded-full flex items-center justify-center'>
                  <FiSearch className='w-12 h-12 text-[#9a8470]' />
                </div>
                <h3 className='heading-3 mb-4'>No products found</h3>
                <p className='text-[#7d6b55] mb-6'>
                  Try adjusting your filters or search terms to find what
                  you&qout;re looking for.
                </p>
                <Button variant='outline' onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const ShopPage: NextPage = () => {
  return (
    <Suspense fallback={<div className='loading'>Loading...</div>}>
      <ShopComponent />
    </Suspense>
  );
};

export default ShopPage;
