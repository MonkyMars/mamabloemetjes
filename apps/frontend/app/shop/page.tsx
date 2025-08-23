'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getProducts, searchProducts } from '../../data/products';
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
import {
  translateColor,
  translateSize,
  type BackendColor,
  type BackendSize,
  type BackendProductType,
} from '../../lib/translations';

interface FilterState {
  priceRange: [number, number];
  colors: BackendColor[];
  sizes: BackendSize[];
  productType: 'all' | BackendProductType;
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
    productType: 'all',
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
            (productColor) =>
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
    key: 'colors' | 'sizes',
    value: BackendColor | BackendSize,
  ) => {
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
  };

  const clearFilters = () => {
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
  };

  const clearSearchFilter = () => {
    setLocalSearchQuery('');
    clearSearch();
    if (searchParams.get('search')) {
      router.push('/shop');
    }
  };

  const clearColorFilter = (color: BackendColor) => {
    toggleArrayFilter('colors', color);
  };

  const clearSizeFilter = (size: BackendSize) => {
    toggleArrayFilter('sizes', size);
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
          <h1 className='heading-1 mb-4'>Onze Collectie</h1>
          <p className='text-lg text-[#7d6b55] max-w-2xl'>
            Ontdek onze prachtige handgemaakte vilt bloemen, perfect voor elke
            gelegenheid. Elk stuk is gemaakt met liefde en aandacht voor detail.
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
                placeholder='Zoek bloemen...'
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
            filters.productType !== 'all' ||
            effectiveSearchQuery) && (
            <div className='mt-4 flex flex-wrap items-center gap-2'>
              <span className='text-sm text-[#7d6b55] font-medium'>
                Actieve filters:
              </span>

              {effectiveSearchQuery && (
                <span className='badge bg-[#d4a574] text-white'>
                  Zoeken: {effectiveSearchQuery}
                  <button onClick={clearSearchFilter} className='ml-2'>
                    <FiX className='w-3 h-3' />
                  </button>
                </span>
              )}

              {filters.productType !== 'all' && (
                <span className='badge bg-[#8b9dc3] text-white'>
                  {filters.productType === 'flower'
                    ? '🌸 Losse Bloemen'
                    : '💐 Boeketten'}
                  <button
                    onClick={() => handleFilterChange('productType', 'all')}
                    className='ml-2'
                  >
                    <FiX className='w-3 h-3' />
                  </button>
                </span>
              )}

              {filters.colors.map((color) => (
                <span key={color} className='badge bg-[#c77a3a] text-white'>
                  {translateColor(color)}
                  <button
                    onClick={() => clearColorFilter(color)}
                    className='ml-2'
                  >
                    <FiX className='w-3 h-3' />
                  </button>
                </span>
              ))}

              {filters.sizes.map((size) => (
                <span key={size} className='badge bg-[#7fb069] text-white'>
                  {translateSize(size)}
                  <button
                    onClick={() => clearSizeFilter(size)}
                    className='ml-2'
                  >
                    <FiX className='w-3 h-3' />
                  </button>
                </span>
              ))}

              <button
                onClick={clearFilters}
                className='text-sm text-[#d4a574] hover:text-[#b8956a] font-medium'
              >
                Alles wissen
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
                    viewMode={viewMode}
                    onAddToCart={(product) => {
                      console.log('Toegevoegd aan winkelwagen:', product.name);
                      // TODO: Implement cart functionality
                    }}
                    onToggleWishlist={(product) => {
                      console.log('Verlanglijst gewijzigd:', product.name);
                      // TODO: Implement wishlist functionality
                    }}
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
