// Translation utilities for backend enums

export type BackendColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'black'
  | 'white'
  | 'purple'
  | 'orange'
  | 'pink';

export type BackendSize = 'small' | 'medium' | 'large' | 'extralarge';

export type BackendProductType = 'bouquet' | 'flower';

// Color translations
const colorTranslations: Record<BackendColor, string> = {
  red: 'Rood',
  blue: 'Blauw',
  green: 'Groen',
  yellow: 'Geel',
  black: 'Zwart',
  white: 'Wit',
  purple: 'Paars',
  orange: 'Oranje',
  pink: 'Roze',
};

// Size translations
const sizeTranslations: Record<BackendSize, string> = {
  small: 'Klein',
  medium: 'Middel',
  large: 'Groot',
  extralarge: 'Extra Groot',
};

// Product type translations
const productTypeTranslations: Record<BackendProductType, string> = {
  bouquet: 'Boeket',
  flower: 'Bloem',
};

// Color CSS classes for visual representation
const colorClasses: Record<BackendColor, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  black: 'bg-black',
  white: 'bg-white border-2 border-gray-300',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-400',
};

// Translation functions
export const translateColor = (color: string): string => {
  const normalizedColor = color.toLowerCase() as BackendColor;
  return colorTranslations[normalizedColor] || color;
};

export const translateSize = (size: string): string => {
  const normalizedSize = size.toLowerCase() as BackendSize;
  return sizeTranslations[normalizedSize] || size;
};

export const translateProductType = (productType: string): string => {
  const normalizedType = productType.toLowerCase() as BackendProductType;
  return productTypeTranslations[normalizedType] || productType;
};

export const getColorClass = (color: string): string => {
  const normalizedColor = color.toLowerCase() as BackendColor;
  return (
    colorClasses[normalizedColor] ||
    'bg-gradient-to-br from-[#ddb7ab] to-[#d4a574]'
  );
};

// Helper function to translate arrays
export const translateColors = (colors: string[]): string[] => {
  return colors.map(translateColor);
};

// Utility function to get product type icon
export const getProductTypeIcon = (productType: string): string => {
  const normalizedType = productType.toLowerCase() as BackendProductType;
  return normalizedType === 'flower' ? '🌸' : '💐';
};

// Utility function to get product type description
export const getProductTypeDescription = (productType: string): string => {
  const normalizedType = productType.toLowerCase() as BackendProductType;
  return normalizedType === 'flower' ? 'Losse Bloem' : 'Compleet Boeket';
};
