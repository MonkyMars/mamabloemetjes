import api from '@/lib/axios';
import { Product, Cart } from '@/types';
import { ApiResponse } from '@/types/api';

// Product functions
export const getProductById = async (uuid: string): Promise<Product> => {
  const response = await api.get<ApiResponse<Product>>(`/products/${uuid}`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch product with ID ${uuid}`);
  }
  return response.data.data;
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get<ApiResponse<Product[]>>('/products');
  if (response.status !== 200) {
    throw new Error(`Failed to fetch products`);
  }
  return response.data.data;
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
  const response = await api.get<ApiResponse<Product[]>>(
    `/products/search?q=${encodeURIComponent(query)}`,
  );
  if (response.status !== 200) {
    throw new Error(`Failed to search products`);
  }
  return response.data.data;
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
): Product => ({
  id,
  name,
  sku: `SKU-${id.slice(0, 8).toUpperCase()}`,
  price,
  description,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  images: [
    {
      product_id: id,
      url: `/images/products/${id}/main.jpg`,
      alt_text: name,
      is_primary: true,
    },
  ],
});

// Temporary mock data - replace with actual API calls
export const mockProducts: Product[] = [
  createMockProduct(
    'velvet-rose-bouquet-1',
    'Velvet Rose Bouquet',
    89.99,
    'Luxurious deep red roses',
  ),
  createMockProduct(
    'spring-garden-mix-2',
    'Spring Garden Mix',
    65.0,
    'Fresh seasonal spring flowers',
  ),
  createMockProduct(
    'elegant-lily-arrangement-3',
    'Elegant Lily Arrangement',
    120.0,
    'Sophisticated white lilies',
  ),
  createMockProduct(
    'wildflower-meadow-4',
    'Wildflower Meadow',
    45.0,
    'Rustic wildflower collection',
  ),
  createMockProduct(
    'romantic-peonies-5',
    'Romantic Peonies',
    95.0,
    'Soft pink peony bouquet',
  ),
  createMockProduct(
    'sunflower-sunshine-6',
    'Sunflower Sunshine',
    55.0,
    'Bright cheerful sunflowers',
  ),
  createMockProduct(
    'orchid-elegance-7',
    'Orchid Elegance',
    150.0,
    'Premium orchid arrangement',
  ),
  createMockProduct(
    'tulip-festival-8',
    'Tulip Festival',
    40.0,
    'Colorful tulip bouquet',
  ),
];

// Utility function to get mock product by ID (for fallback)
export const getMockProductById = (id: string): Product | undefined => {
  return mockProducts.find((product) => product.id === id);
};
