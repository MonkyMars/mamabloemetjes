export interface Cart {
  id: string;
  user_id?: string;
  currency: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  unit_tax_cents: number;
  unit_subtotal_cents: number;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  product_name: string;
  product_sku: string;
}

export interface CartResponse {
  cart: Cart;
  items: CartItem[];
}

export interface GuestCartItem {
  product_id: string;
  quantity: number;
}

export interface AddCartItemRequest {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface MergeCartRequest {
  items: GuestCartItem[];
}

export interface CartContextType {
  cart: CartResponse | null;
  isLoading: boolean;
  error: string | null;
  addItem: (product_id: string, quantity: number) => Promise<void>;
  updateItem: (item_id: string, quantity: number) => Promise<void>;
  removeItem: (item_id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalCents: () => number;
  totalTaxCents: () => number;
  totalSubtotalCents: () => number;
  totalQuantity: () => number;
}

export interface LocalCartItem {
  product_id: string;
  quantity: number;
}

export interface LocalCart {
  items: LocalCartItem[];
  version: string;
}
