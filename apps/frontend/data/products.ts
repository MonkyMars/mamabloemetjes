import api from '@/lib/axios';
import { Product, Cart } from '@/types';
import { ApiResponse } from '@/types/api';

// Product functions
export const getProductById = async (uuid: string): Promise<Product> => {
  const response = await api.get<ApiResponse<Product>>(`/products/${uuid}`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch product with ID ${uuid}`);
  }

  const product: Product = {
    ...response.data.data,
    product_type: response.data.data.product_type.toLocaleLowerCase(),
  };

  return product;
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get<ApiResponse<Product[]>>('/products');
  if (response.status !== 200) {
    throw new Error(`Failed to fetch products`);
  }

  return response.data.data.map((product) => ({
    ...product,
    product_type: product.product_type.toLocaleLowerCase(),
  }));
};

export const getFeaturedProducts = async (
  limit: number = 8,
): Promise<Product[]> => {
  const response = await api.get<ApiResponse<Product[]>>(
    `/products/featured?limit=${limit}`,
  );
  if (response.status !== 200) {
    throw new Error(`Failed to fetch featured products`);
  }
  return response.data.data;
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const response = await api.get<
    ApiResponse<{
      products: Product[];
      total_count: number;
      page: number;
      per_page: number;
      total_pages: number;
      search_time_ms: number;
      suggestions?: string[];
    }>
  >(`/products/search?q=${encodeURIComponent(query)}`);
  if (response.status !== 200) {
    throw new Error(`Failed to search products`);
  }
  return response.data.data.products;
};

// Cart functions
export const getCart = async (): Promise<Cart> => {
  const response = await api.get<ApiResponse<Cart>>('/cart');
  if (response.status !== 200) {
    throw new Error('Failed to fetch cart');
  }
  return response.data.data;
};

export const addToCart = async (
  productId: string,
  quantity: number = 1,
): Promise<Cart> => {
  const response = await api.post<ApiResponse<Cart>>('/cart/items', {
    product_id: productId,
    quantity,
  });
  if (response.status !== 200 && response.status !== 201) {
    throw new Error('Failed to add item to cart');
  }
  return response.data.data;
};

export const updateCartItem = async (
  productId: string,
  quantity: number,
): Promise<Cart> => {
  const response = await api.put<ApiResponse<Cart>>(
    `/cart/items/${productId}`,
    {
      quantity,
    },
  );
  if (response.status !== 200) {
    throw new Error('Failed to update cart item');
  }
  return response.data.data;
};

export const removeFromCart = async (productId: string): Promise<Cart> => {
  const response = await api.delete<ApiResponse<Cart>>(
    `/cart/items/${productId}`,
  );
  if (response.status !== 200) {
    throw new Error('Failed to remove item from cart');
  }
  return response.data.data;
};

export const clearCart = async (): Promise<void> => {
  const response = await api.delete('/cart');
  if (response.status !== 200 && response.status !== 204) {
    throw new Error('Failed to clear cart');
  }
};

// Fallback mock data for development (remove when backend is fully integrated)
const createMockProduct = (
  id: string,
  name: string,
  price: number,
  description: string,
  productType: 'flower' | 'bouquet',
  size?: string,
  colors?: string[],
): Product => ({
  id,
  name,
  sku: `SKU-${id.slice(0, 8).toUpperCase()}`,
  price,
  description,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  stock: 100,
  images: [
    {
      product_id: id,
      url: `/images/products/${id}/main.jpg`,
      alt_text: name,
      is_primary: true,
    },
  ],
  size: size || null,
  colors: colors || null,
  product_type: productType,
});

// Temporary mock data - replace with actual API calls
export const mockProducts: Product[] = [
  createMockProduct(
    'velvet-rose-bouquet-1',
    'Luxe Velvet Roos Boeket',
    89.99,
    'Luxueuze dieprode rozen handgemaakt van velvet',
    'bouquet',
    'large',
    ['red', 'pink'],
  ),
  createMockProduct(
    'single-red-rose-1',
    'Rode Velvet Roos',
    12.99,
    'Enkele handgemaakte rode roos van premium velvet',
    'flower',
    'medium',
    ['red'],
  ),
  createMockProduct(
    'spring-garden-mix-2',
    'Lente Tuin Mix Boeket',
    65.0,
    'Vers seizoensgebonden lentebloemen arrangement',
    'bouquet',
    'large',
    ['pink', 'white', 'yellow'],
  ),
  createMockProduct(
    'single-pink-tulip-1',
    'Roze Velvet Tulp',
    8.99,
    'Enkele handgemaakte tulp in zacht roze velvet',
    'flower',
    'small',
    ['pink'],
  ),
  createMockProduct(
    'elegant-lily-arrangement-3',
    'Elegante Lelie Arrangement',
    120.0,
    'Verfijnde witte lelies in stijlvol arrangement',
    'bouquet',
    'extralarge',
    ['white'],
  ),
  createMockProduct(
    'single-white-lily-1',
    'Witte Velvet Lelie',
    15.99,
    'Enkele witte lelie van hoogwaardig velvet materiaal',
    'flower',
    'large',
    ['white'],
  ),
  createMockProduct(
    'wildflower-meadow-4',
    'Wilde Bloemen Weide Boeket',
    45.0,
    'Rustieke collectie wilde bloemen uit de weide',
    'bouquet',
    'medium',
    ['purple', 'yellow', 'white'],
  ),
  createMockProduct(
    'single-sunflower-1',
    'Gele Velvet Zonnebloem',
    10.99,
    'Vrolijke handgemaakte zonnebloem in helder geel',
    'flower',
    'large',
    ['yellow'],
  ),
];

// Utility function to get mock product by ID (for fallback)
export const getMockProductById = (id: string): Product | undefined => {
  return mockProducts.find((product) => product.id === id);
};
