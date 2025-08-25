export interface ProductImage {
  product_id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  tax: number;
  subtotal: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: ProductImage[] | null;
  size: string | null; // Backend enum: small, medium, large, extralarge
  colors: string[] | null; // Backend enum: red, blue, green, etc.
  product_type: string; // Backend enum: flower, bouquet
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface ContactForm {
  name: string;
  email: string;
  phone: string | null;
  message: string;
  product_id: string | null;
  occasion: string | null;
  preferred_contact_method: 'email' | 'phone';
}

export interface OrderSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface Customer {
  name: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface Order {
  id: string;
  customer: Customer;
  items: CartItem[];
  orderSummary: OrderSummary;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  createdAt: Date;
  estimatedDelivery?: Date;
  specialInstructions?: string;
}
