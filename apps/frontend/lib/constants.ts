// Tax and pricing constants
export const TAX_RATE = 0.21; // 21% BTW (VAT) in Netherlands

// Shipping constants
export const FREE_SHIPPING_THRESHOLD = 75; // €75 for free shipping
export const STANDARD_SHIPPING_COST = 7.5; // €7.50 standard shipping

// Currency constants
export const DEFAULT_CURRENCY = 'EUR';
export const DEFAULT_LOCALE = 'nl-NL';

// Cart constants
export const MAX_QUANTITY_PER_ITEM = 99;
export const MIN_QUANTITY_PER_ITEM = 1;

// API constants
export const PRICE_VALIDATION_DEBOUNCE_MS = 1500;
export const PRODUCT_CACHE_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes
export const PRODUCT_CACHE_GC_TIME_MS = 10 * 60 * 1000; // 10 minutes
