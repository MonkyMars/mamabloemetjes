export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: 'bouquet' | 'arrangement' | 'single' | 'seasonal';
  occasion?: string[];
  isCustomizable: boolean;
  colors?: string[];
  size?: 'small' | 'medium' | 'large';
}

export interface CartItem {
  product: Product;
  quantity: number;
  customization?: {
    colors?: string[];
    occasion?: string;
    personalMessage?: string;
  };
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  message: string;
  productId?: string;
  occasion?: string;
  preferredContactMethod: 'email' | 'phone';
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
