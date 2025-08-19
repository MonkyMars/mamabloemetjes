import { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: 'velvet-rose-bouquet-1',
    name: 'Crimson Dreams Bouquet',
    description: 'A stunning arrangement of deep red velvet roses, perfect for romantic occasions. Each bloom is carefully crafted with premium velvet fabric.',
    price: 89.99,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop',
    category: 'bouquet',
    occasion: ['romantic', 'anniversary', 'valentine'],
    isCustomizable: true,
    colors: ['deep-red', 'burgundy'],
    size: 'medium'
  },
  {
    id: 'velvet-peony-arrangement-1',
    name: 'Blush Garden Arrangement',
    description: 'Soft pink velvet peonies arranged in a rustic wooden box. A delicate piece that brings warmth to any space.',
    price: 124.99,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&h=500&fit=crop',
    category: 'arrangement',
    occasion: ['home-decor', 'housewarming', 'mothers-day'],
    isCustomizable: true,
    colors: ['blush-pink', 'cream', 'sage-green'],
    size: 'large'
  },
  {
    id: 'velvet-wildflower-bouquet-1',
    name: 'Meadow Whispers',
    description: 'A charming mix of velvet wildflowers in earthy tones. Perfect for bohemian weddings or nature lovers.',
    price: 67.50,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop',
    category: 'bouquet',
    occasion: ['wedding', 'boho', 'casual'],
    isCustomizable: true,
    colors: ['lavender', 'cream', 'dusty-rose', 'sage'],
    size: 'medium'
  },
  {
    id: 'velvet-chrysanthemum-arrangement-1',
    name: 'Autumn Harvest Centerpiece',
    description: 'Rich velvet chrysanthemums in warm autumn hues, beautifully arranged in a ceramic vessel. Ideal for fall celebrations.',
    price: 98.00,
    stock: 6,
    imageUrl: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=500&h=500&fit=crop',
    category: 'arrangement',
    occasion: ['thanksgiving', 'fall-wedding', 'home-decor'],
    isCustomizable: true,
    colors: ['burnt-orange', 'golden-yellow', 'deep-red'],
    size: 'large'
  },
  {
    id: 'velvet-tulip-bouquet-1',
    name: 'Spring Awakening',
    description: 'Fresh-looking velvet tulips in pastel shades that capture the essence of spring. Light and cheerful.',
    price: 54.99,
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=500&h=500&fit=crop',
    category: 'bouquet',
    occasion: ['spring', 'easter', 'birthday'],
    isCustomizable: true,
    colors: ['soft-pink', 'light-yellow', 'lavender', 'white'],
    size: 'small'
  },
  {
    id: 'velvet-sunflower-arrangement-1',
    name: 'Golden Sunshine Display',
    description: 'Vibrant velvet sunflowers that radiate joy and warmth. A statement piece that brightens any room.',
    price: 112.00,
    stock: 9,
    imageUrl: 'https://images.unsplash.com/photo-1597848212624-e772827f1c9b?w=500&h=500&fit=crop',
    category: 'arrangement',
    occasion: ['summer', 'graduation', 'congratulations'],
    isCustomizable: false,
    colors: ['golden-yellow', 'brown'],
    size: 'large'
  },
  {
    id: 'velvet-lily-bouquet-1',
    name: 'Elegant White Lilies',
    description: 'Pure white velvet lilies symbolizing rebirth and purity. Perfect for solemn occasions or minimalist aesthetics.',
    price: 76.50,
    stock: 11,
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop',
    category: 'bouquet',
    occasion: ['sympathy', 'memorial', 'minimalist'],
    isCustomizable: true,
    colors: ['pure-white', 'cream'],
    size: 'medium'
  },
  {
    id: 'velvet-mixed-seasonal-1',
    name: 'Winter Wonderland',
    description: 'A magical mix of white and silver velvet flowers with touches of evergreen. Captures the beauty of winter.',
    price: 134.99,
    stock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=500&h=500&fit=crop',
    category: 'seasonal',
    occasion: ['winter', 'christmas', 'new-year'],
    isCustomizable: true,
    colors: ['white', 'silver', 'deep-green'],
    size: 'large'
  },
  {
    id: 'velvet-dahlia-bouquet-1',
    name: 'Vintage Romance',
    description: 'Dusty rose and mauve velvet dahlias arranged with vintage charm. Perfect for romantic vintage-themed events.',
    price: 91.25,
    stock: 7,
    imageUrl: 'https://images.unsplash.com/photo-1563784462041-5f97ac5b8461?w=500&h=500&fit=crop',
    category: 'bouquet',
    occasion: ['vintage-wedding', 'anniversary', 'romantic'],
    isCustomizable: true,
    colors: ['dusty-rose', 'mauve', 'cream'],
    size: 'medium'
  },
  {
    id: 'velvet-orchid-arrangement-1',
    name: 'Exotic Elegance',
    description: 'Sophisticated velvet orchids in rich purple tones. A luxurious arrangement for those who appreciate refined beauty.',
    price: 156.00,
    stock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1550275994-cdc890bc1d5f?w=500&h=500&fit=crop',
    category: 'arrangement',
    occasion: ['luxury', 'corporate', 'special-occasion'],
    isCustomizable: true,
    colors: ['deep-purple', 'magenta', 'white'],
    size: 'large'
  },
  {
    id: 'velvet-baby-breath-bouquet-1',
    name: 'Cloud Nine',
    description: 'Delicate white velvet baby\'s breath creating an ethereal, cloud-like bouquet. Simple yet enchanting.',
    price: 43.75,
    stock: 22,
    imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0c7fcfab8da?w=500&h=500&fit=crop',
    category: 'bouquet',
    occasion: ['minimalist', 'modern', 'casual'],
    isCustomizable: false,
    colors: ['white'],
    size: 'small'
  },
  {
    id: 'velvet-rainbow-arrangement-1',
    name: 'Joyful Celebration',
    description: 'A vibrant mix of colorful velvet flowers arranged to spread joy and happiness. Perfect for celebrations of all kinds.',
    price: 118.50,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=500&h=500&fit=crop',
    category: 'arrangement',
    occasion: ['birthday', 'celebration', 'congratulations'],
    isCustomizable: true,
    colors: ['rainbow', 'multi-color'],
    size: 'large'
  }
];

export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find(product => product.id === id);
};

export const getProductsByCategory = (category: Product['category']): Product[] => {
  return mockProducts.filter(product => product.category === category);
};

export const getProductsByOccasion = (occasion: string): Product[] => {
  return mockProducts.filter(product =>
    product.occasion?.includes(occasion)
  );
};

export const getLowStockProducts = (): Product[] => {
  return mockProducts.filter(product => product.stock < 10);
};
