'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product } from '@//types';
import ProductCard from '@//components/ProductCard';
import { Button } from '@//components/Button';
import { useSearchContext } from '@//context/SearchContext';
import { useProducts, useSearchProducts } from '@//hooks/useProducts';
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
import {
  translateColor,
  translateSize,
  type BackendColor,
  type BackendSize,
  type BackendProductType,
} from '@//lib/translations';

interface FilterState {
  priceRange: [number, number];
  colors: BackendColor[];
  sizes: BackendSize[];
  productType: 'all' | BackendProductType;
}

const ShopComponent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearSearch } = useSearchContext();

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 200],
    colors: [],
    sizes: [],
    productType: 'all',
  });

  // Get URL search parameter
  const urlSearchQuery = searchParams.get('search') || '';

  // Use TanStack Query hooks
  const {
    data: allProducts = [],
    isLoading: isLoadingProducts,
    error: productsError,
  } = useProducts();

  const {
    data: querySearchResults = [],
    isLoading: isSearching,
    error: searchError,
  } = useSearchProducts(urlSearchQuery);

  // Determine which products to use and loading state
  const products = urlSearchQuery ? querySearchResults : allProducts;
  const isLoading = urlSearchQuery ? isSearching : isLoadingProducts;
  const error = urlSearchQuery ? searchError : productsError;

  // Handle URL search parameter changes
  useEffect(() => {
    if (urlSearchQuery && urlSearchQuery !== localSearchQuery) {
      setLocalSearchQuery(urlSearchQuery);
    }
  }, [urlSearchQuery, localSearchQuery]);

  // Get effective search query and products
  const effectiveSearchQuery = useMemo(() => {
    return urlSearchQuery || localSearchQuery;
  }, [urlSearchQuery, localSearchQuery]);

  // Get unique filter options
  // Update filter options when products change
  const filterOptions = useMemo(() => {
    return {
      colors: [
        'red',
        'blue',
        'green',
        'yellow',
        'black',
        'white',
        'purple',
        'orange',
        'pink',
      ] as BackendColor[],
      sizes: ['small', 'medium', 'large', 'extralarge'] as BackendSize[],
    };
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
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

      // Product type filter
      if (
        filters.productType !== 'all' &&
        product.product_type !== filters.productType
      ) {
        return false;
      }

      // Colors filter
      if (
        filters.colors.length > 0 &&
        product.colors &&
        !filters.colors.some((filterColor) =>
          product.colors?.some(
            (productColor: string) =>
              productColor.toLowerCase() === filterColor.toLowerCase(),
          ),
        )
      ) {
        return false;
      }

      // Sizes filter
      if (
        filters.sizes.length > 0 &&
        product.size &&
        !filters.sizes.some(
          (filterSize) =>
            product.size?.toLowerCase() === filterSize.toLowerCase(),
        )
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
    filtered.sort((a: Product, b: Product) => {
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

    return filtered;
  }, [products, effectiveSearchQuery, filters, sortBy]);

  const handleFilterChange = useCallback(
    (
      key: keyof FilterState,
      value: string | number | string[] | [number, number],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const toggleArrayFilter = useCallback(
    (key: 'colors' | 'sizes', value: BackendColor | BackendSize) => {
      if (key === 'colors') {
        const colorValue = value as BackendColor;
        setFilters((prev) => ({
          ...prev,
          colors: prev.colors.includes(colorValue)
            ? prev.colors.filter((item) => item !== colorValue)
            : [...prev.colors, colorValue],
        }));
      } else if (key === 'sizes') {
        const sizeValue = value as BackendSize;
        setFilters((prev) => ({
          ...prev,
          sizes: prev.sizes.includes(sizeValue)
            ? prev.sizes.filter((item) => item !== sizeValue)
            : [...prev.sizes, sizeValue],
        }));
      }
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      priceRange: [0, 200],
      colors: [],
      sizes: [],
      productType: 'all',
    });
    setLocalSearchQuery('');
    clearSearch();

    // Clear URL search parameter if it exists
    if (searchParams.get('search')) {
      router.push('/shop');
    }
  }, [clearSearch, router, searchParams]);

  const clearSearchFilter = useCallback(() => {
    setLocalSearchQuery('');
    clearSearch();
    if (searchParams.get('search')) {
      router.push('/shop');
    }
  }, [clearSearch, router, searchParams]);

  const clearColorFilter = useCallback(
    (color: BackendColor) => {
      toggleArrayFilter('colors', color);
    },
    [toggleArrayFilter],
  );

  const clearSizeFilter = useCallback(
    (size: BackendSize) => {
      toggleArrayFilter('sizes', size);
    },
    [toggleArrayFilter],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalSearchQuery(e.target.value);
    },
    [],
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSortBy(e.target.value);
    },
    [],
  );

  const handleGridView = useCallback(() => {
    setViewMode('grid');
  }, []);

  const handleListView = useCallback(() => {
    setViewMode('list');
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
    // Prevent body scroll when mobile filter is open
    if (!showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showFilters]);

  // Close filters on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFilters) {
        setShowFilters(false);
        document.body.style.overflow = 'unset';
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showFilters]);

  // Clean up body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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

  if (error) {
    return (
      <div className='min-h-screen pt-24 pb-16'>
        <div className='container'>
          <div className='text-center py-12'>
            <p className='text-red-600 text-lg mb-4'>
              Er is een fout opgetreden bij het laden van de producten.
            </p>
            <Button variant='outline' onClick={() => window.location.reload()}>
              Probeer opnieuw
            </Button>
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
          <h1 className='heading-1 mb-4'>Onze Collectie</h1>
          <p className='text-lg text-[#7d6b55] max-w-2xl'>
            Ontdek onze prachtige handgemaakte vilt bloemen, perfect voor elke
            gelegenheid. Elk stuk is gemaakt met liefde en aandacht voor detail.
          </p>
        </div>

        {/* Search and Controls */}
        <div className='mb-6 md:mb-8 space-y-4'>
          {/* Mobile Search Bar */}
          <div className='relative lg:hidden'>
            <FiSearch className='absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9a8470] w-5 h-5' />
            <input
              type='text'
              placeholder='Zoek bloemen...'
              value={localSearchQuery}
              onChange={handleSearchChange}
              className='input-field pl-12 text-lg py-4'
            />
          </div>

          {/* Mobile Controls Row */}
          <div className='flex flex-col sm:flex-row gap-3 lg:hidden'>
            {/* Filter Toggle - Full width on mobile */}
            <Button
              variant='outline'
              onClick={toggleFilters}
              leftIcon={<FiFilter className='w-5 h-5' />}
              className='flex-1 justify-center py-4 text-lg font-medium'
            >
              Filters ({filteredProducts.length})
            </Button>

            {/* Sort and View Controls */}
            <div className='flex gap-3'>
              {/* Sort Dropdown */}
              <div className='relative flex-1'>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className='input-field pr-12 appearance-none cursor-pointer text-base py-4 w-full'
                >
                  <option value='name'>Naam</option>
                  <option value='price-low'>Prijs ↑</option>
                  <option value='price-high'>Prijs ↓</option>
                  <option value='newest'>Nieuw</option>
                </select>
                <FiChevronDown className='absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9a8470] w-5 h-5 pointer-events-none' />
              </div>

              {/* View Toggle */}
              <div className='flex border-2 border-[#e8e2d9] rounded-xl p-1'>
                <button
                  onClick={handleGridView}
                  className={`p-3 rounded-lg ${viewMode === 'grid' ? 'bg-[#d4a574] text-white' : 'text-[#7d6b55] hover:bg-[#f5f2ee]'}`}
                >
                  <FiGrid className='w-5 h-5' />
                </button>
                <button
                  onClick={handleListView}
                  className={`p-3 rounded-lg ${viewMode === 'list' ? 'bg-[#d4a574] text-white' : 'text-[#7d6b55] hover:bg-[#f5f2ee]'}`}
                >
                  <FiList className='w-5 h-5' />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Controls */}
          <div className='hidden lg:flex lg:items-center lg:justify-between'>
            {/* Search Bar */}
            <div className='relative flex-1 max-w-md'>
              <FiSearch className='absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9a8470] w-5 h-5' />
              <input
                type='text'
                placeholder='Zoek bloemen...'
                value={localSearchQuery}
                onChange={handleSearchChange}
                className='input-field pl-12'
              />
            </div>

            <div className='flex items-center gap-4'>
              {/* Sort Dropdown */}
              <div className='relative'>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className='input-field pr-12 appearance-none cursor-pointer'
                >
                  <option value='name'>Sorteer op naam</option>
                  <option value='price-low'>Prijs: Laag naar hoog</option>
                  <option value='price-high'>Prijs: Hoog naar laag</option>
                  <option value='newest'>Nieuwste eerst</option>
                </select>
                <FiChevronDown className='absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9a8470] w-5 h-5 pointer-events-none' />
              </div>

              {/* View Toggle */}
              <div className='flex border border-[#e8e2d9] rounded-lg p-1'>
                <button
                  onClick={handleGridView}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#d4a574] text-white' : 'text-[#7d6b55] hover:bg-[#f5f2ee]'}`}
                >
                  <FiGrid className='w-4 h-4' />
                </button>
                <button
                  onClick={handleListView}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#d4a574] text-white' : 'text-[#7d6b55] hover:bg-[#f5f2ee]'}`}
                >
                  <FiList className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.colors.length > 0 ||
            filters.sizes.length > 0 ||
            filters.productType !== 'all' ||
            effectiveSearchQuery) && (
            <div className='mt-6 p-4 bg-[#f5f2ee] rounded-xl'>
              <div className='flex flex-wrap items-center gap-3'>
                <span className='text-sm md:text-base text-[#7d6b55] font-medium'>
                  Actieve filters:
                </span>

                {effectiveSearchQuery && (
                  <span className='badge bg-[#d4a574] text-white text-sm px-3 py-2'>
                    Zoeken: {effectiveSearchQuery}
                    <button
                      onClick={clearSearchFilter}
                      className='ml-2 hover:opacity-75'
                    >
                      <FiX className='w-4 h-4' />
                    </button>
                  </span>
                )}

                {filters.productType !== 'all' && (
                  <span className='badge bg-[#8b9dc3] text-white text-sm px-3 py-2'>
                    {filters.productType === 'flower'
                      ? '🌸 Losse Bloemen'
                      : '💐 Boeketten'}
                    <button
                      onClick={() => handleFilterChange('productType', 'all')}
                      className='ml-2 hover:opacity-75'
                    >
                      <FiX className='w-4 h-4' />
                    </button>
                  </span>
                )}

                {filters.colors.map((color) => (
                  <span
                    key={color}
                    className='badge bg-[#c77a3a] text-white text-sm px-3 py-2'
                  >
                    {translateColor(color)}
                    <button
                      onClick={() => clearColorFilter(color)}
                      className='ml-2 hover:opacity-75'
                    >
                      <FiX className='w-4 h-4' />
                    </button>
                  </span>
                ))}

                {filters.sizes.map((size) => (
                  <span
                    key={size}
                    className='badge bg-[#7fb069] text-white text-sm px-3 py-2'
                  >
                    {translateSize(size)}
                    <button
                      onClick={() => clearSizeFilter(size)}
                      className='ml-2 hover:opacity-75'
                    >
                      <FiX className='w-4 h-4' />
                    </button>
                  </span>
                ))}

                <button
                  onClick={clearFilters}
                  className='text-sm md:text-base text-[#d4a574] hover:text-[#b8956a] font-medium px-3 py-2 rounded-lg hover:bg-white transition-colors whitespace-nowrap'
                >
                  Alles wissen
                </button>
              </div>
            </div>
          )}
        </div>

        <div className='flex gap-6 lg:gap-8'>
          {/* Mobile Filter Overlay */}
          {showFilters && (
            <div
              className='fixed inset-0 bg-black/50 z-50 lg:hidden filter-overlay'
              onClick={toggleFilters}
            >
              <div
                className='fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl z-50 overflow-y-auto slide-in-left'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className='heading-4 flex items-center'>
                      <FiSliders className='w-5 h-5 mr-2' />
                      Filters
                    </h3>
                    <button
                      onClick={toggleFilters}
                      className='p-2 hover:bg-gray-100 rounded-lg'
                    >
                      <FiX className='w-6 h-6' />
                    </button>
                  </div>

                  <div className='space-y-8'>
                    {/* Product Type Filter */}
                    <div>
                      <h4 className='font-medium text-[#2d2820] mb-4 text-lg'>
                        Product Type
                      </h4>
                      <div className='space-y-3'>
                        <label className='flex items-center cursor-pointer p-3 hover:bg-gray-50 rounded-lg'>
                          <input
                            type='radio'
                            name='productTypeMobile'
                            value='all'
                            checked={filters.productType === 'all'}
                            onChange={(e) =>
                              handleFilterChange('productType', e.target.value)
                            }
                            className='mr-4 w-5 h-5 text-[#d4a574] focus:ring-[#d4a574]'
                          />
                          <span className='text-[#7d6b55] text-lg'>
                            Alle producten
                          </span>
                        </label>
                        <label className='flex items-center cursor-pointer p-3 hover:bg-gray-50 rounded-lg'>
                          <input
                            type='radio'
                            name='productTypeMobile'
                            value='flower'
                            checked={filters.productType === 'flower'}
                            onChange={(e) =>
                              handleFilterChange('productType', e.target.value)
                            }
                            className='mr-4 w-5 h-5 text-[#d4a574] focus:ring-[#d4a574]'
                          />
                          <span className='text-[#7d6b55] text-lg'>
                            🌸 Losse bloemen
                          </span>
                        </label>
                        <label className='flex items-center cursor-pointer p-3 hover:bg-gray-50 rounded-lg'>
                          <input
                            type='radio'
                            name='productTypeMobile'
                            value='bouquet'
                            checked={filters.productType === 'bouquet'}
                            onChange={(e) =>
                              handleFilterChange('productType', e.target.value)
                            }
                            className='mr-4 w-5 h-5 text-[#d4a574] focus:ring-[#d4a574]'
                          />
                          <span className='text-[#7d6b55] text-lg'>
                            💐 Boeketten
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <h4 className='font-medium text-[#2d2820] mb-4 text-lg'>
                        Prijsbereik
                      </h4>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between text-base text-[#7d6b55]'>
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
                          className='w-full h-3 accent-[#d4a574]'
                        />
                      </div>
                    </div>

                    {/* Colors */}
                    {filterOptions.colors.length > 0 && (
                      <div>
                        <h4 className='font-medium text-[#2d2820] mb-4 text-lg'>
                          Kleuren
                        </h4>
                        <div className='space-y-3'>
                          {filterOptions.colors.map((color) => (
                            <label
                              key={color}
                              className='flex items-center cursor-pointer p-3 hover:bg-gray-50 rounded-lg'
                            >
                              <input
                                type='checkbox'
                                checked={filters.colors.includes(color)}
                                onChange={() =>
                                  toggleArrayFilter('colors', color)
                                }
                                className='mr-4 w-5 h-5 text-[#d4a574] focus:ring-[#d4a574]'
                              />
                              <span className='text-[#7d6b55] text-lg'>
                                {translateColor(color)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sizes */}
                    {filterOptions.sizes.length > 0 && (
                      <div>
                        <h4 className='font-medium text-[#2d2820] mb-4 text-lg'>
                          Maat
                        </h4>
                        <div className='space-y-3'>
                          {filterOptions.sizes.map((size) => (
                            <label
                              key={size}
                              className='flex items-center cursor-pointer p-3 hover:bg-gray-50 rounded-lg'
                            >
                              <input
                                type='checkbox'
                                checked={filters.sizes.includes(size)}
                                onChange={() =>
                                  toggleArrayFilter('sizes', size)
                                }
                                className='mr-4 w-5 h-5 text-[#d4a574] focus:ring-[#d4a574]'
                              />
                              <span className='text-[#7d6b55] text-lg'>
                                {translateSize(size)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Filter Actions */}
                  <div className='mt-8 pt-6 border-t border-gray-200 space-y-4'>
                    <button
                      onClick={clearFilters}
                      className='w-full p-4 text-[#d4a574] hover:text-[#b8956a] font-medium text-lg border border-[#d4a574] rounded-xl hover:bg-[#d4a574]/5'
                    >
                      Clear all filters
                    </button>
                    <button
                      onClick={toggleFilters}
                      className='w-full p-4 bg-[#d4a574] hover:bg-[#b8956a] text-white font-medium text-lg rounded-xl'
                    >
                      Show {filteredProducts.length} products
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sidebar Filters */}
          <aside className='w-80 flex-shrink-0 hidden lg:block'>
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
                {/* Product Type Filter */}
                <div>
                  <h4 className='font-medium text-[#2d2820] mb-3'>
                    Product Type
                  </h4>
                  <div className='space-y-2'>
                    <label className='flex items-center cursor-pointer'>
                      <input
                        type='radio'
                        name='productType'
                        value='all'
                        checked={filters.productType === 'all'}
                        onChange={(e) =>
                          handleFilterChange('productType', e.target.value)
                        }
                        className='mr-3 text-[#d4a574] focus:ring-[#d4a574]'
                      />
                      <span className='text-[#7d6b55]'>Alle producten</span>
                    </label>
                    <label className='flex items-center cursor-pointer'>
                      <input
                        type='radio'
                        name='productType'
                        value='flower'
                        checked={filters.productType === 'flower'}
                        onChange={(e) =>
                          handleFilterChange('productType', e.target.value)
                        }
                        className='mr-3 text-[#d4a574] focus:ring-[#d4a574]'
                      />
                      <span className='text-[#7d6b55]'>🌸 Losse bloemen</span>
                    </label>
                    <label className='flex items-center cursor-pointer'>
                      <input
                        type='radio'
                        name='productType'
                        value='bouquet'
                        checked={filters.productType === 'bouquet'}
                        onChange={(e) =>
                          handleFilterChange('productType', e.target.value)
                        }
                        className='mr-3 text-[#d4a574] focus:ring-[#d4a574]'
                      />
                      <span className='text-[#7d6b55]'>💐 Boeketten</span>
                    </label>
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className='font-medium text-[#2d2820] mb-3'>
                    Prijsbereik
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
                    <h4 className='font-medium text-[#2d2820] mb-3'>Kleuren</h4>
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
                          <span className='text-[#7d6b55]'>
                            {translateColor(color)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {filterOptions.sizes.length > 0 && (
                  <div>
                    <h4 className='font-medium text-[#2d2820] mb-3'>Maat</h4>
                    <div className='space-y-2'>
                      {filterOptions.sizes.map((size) => (
                        <label
                          key={size}
                          className='flex items-center cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={filters.sizes.includes(size)}
                            onChange={() => toggleArrayFilter('sizes', size)}
                            className='mr-3 text-[#d4a574] focus:ring-[#d4a574]'
                          />
                          <span className='text-[#7d6b55]'>
                            {translateSize(size)}
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
          <main className='flex-1 lg:ml-0'>
            {/* Results Count */}
            <div className='mb-4 md:mb-6 flex items-center justify-between'>
              <p className='text-[#7d6b55] text-sm md:text-base'>
                {filteredProducts.length} van {products.length} producten
              </p>
              {/* Mobile view toggle - only show on mobile */}
              <div className='flex border-2 border-[#e8e2d9] rounded-lg p-1 lg:hidden'>
                <button
                  onClick={handleGridView}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#d4a574] text-white' : 'text-[#7d6b55] hover:bg-[#f5f2ee]'}`}
                >
                  <FiGrid className='w-4 h-4' />
                </button>
                <button
                  onClick={handleListView}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#d4a574] text-white' : 'text-[#7d6b55] hover:bg-[#f5f2ee]'}`}
                >
                  <FiList className='w-4 h-4' />
                </button>
              </div>
            </div>

            {/* Products */}
            {filteredProducts.length > 0 ? (
              <div
                className={`grid gap-3 sm:gap-4 md:gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                    : 'grid-cols-1 max-w-2xl mx-auto lg:max-w-none'
                }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className='text-center py-12 md:py-16 px-4'>
                <div className='w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-[#f5f2ee] rounded-full flex items-center justify-center'>
                  <FiSearch className='w-10 h-10 md:w-12 md:h-12 text-[#9a8470]' />
                </div>
                <h3 className='text-xl md:text-2xl lg:text-3xl font-medium text-neutral-800 font-family-serif mb-4'>
                  Geen producten gevonden
                </h3>
                <p className='text-[#7d6b55] mb-6 text-sm md:text-base max-w-md mx-auto'>
                  Probeer je filters of zoektermen aan te passen om te vinden
                  wat je zoekt.
                </p>
                <Button
                  variant='outline'
                  onClick={clearFilters}
                  className='px-6 py-3 text-sm md:text-base'
                >
                  Filters wissen
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
