import api from './axios';
import { User } from '../types/auth';
import { ApiResponse } from '../types/api';
import { CurrencyCalculator, Decimal } from './currency';

export interface UpdateProfileRequest {
  first_name?: string;
  preposition?: string;
  last_name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  shipping_address: {
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
    country: string;
  };
  billing_address: {
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
    country: string;
  };
  created_at: string;
  updated_at: string;
}

export interface OrderLine {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  created_at: string;
}

export interface OrderWithLines extends Order {
  order_lines: OrderLine[];
}

// Profile API functions
export const getProfile = async (): Promise<User> => {
  try {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw new Error('Profiel ophalen mislukt. Probeer het opnieuw.');
  }
};

export const updateProfile = async (
  updates: UpdateProfileRequest,
): Promise<User> => {
  try {
    // Note: This endpoint might need to be implemented in the backend
    const response = await api.put<ApiResponse<User>>('/auth/profile', updates);
    return response.data.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Profiel bijwerken mislukt. Probeer het opnieuw.');
  }
};

export const changePassword = async (
  passwordData: ChangePasswordRequest,
): Promise<void> => {
  try {
    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      throw new Error('Wachtwoorden komen niet overeen.');
    }

    // Note: This endpoint might need to be implemented in the backend
    await api.post('/auth/change-password', {
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    });
  } catch (error) {
    console.error('Error changing password:', error);
    throw new Error('Wachtwoord wijzigen mislukt. Probeer het opnieuw.');
  }
};

// Orders API functions
export const getUserOrders = async (): Promise<Order[]> => {
  try {
    const response = await api.get<ApiResponse<Order[]>>('/api/orders');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Bestellingen ophalen mislukt. Probeer het opnieuw.');
  }
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    const response = await api.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error('Bestelling ophalen mislukt. Probeer het opnieuw.');
  }
};

export const getOrderWithLines = async (
  orderId: string,
): Promise<OrderWithLines> => {
  try {
    const response = await api.get<ApiResponse<OrderWithLines>>(
      `/api/orders/${orderId}/details`,
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw new Error('Bestellingdetails ophalen mislukt. Probeer het opnieuw.');
  }
};

// Utility functions
export const formatOrderStatus = (status: Order['status']): string => {
  const statusMap: Record<Order['status'], string> = {
    pending: 'In behandeling',
    processing: 'Wordt verwerkt',
    shipped: 'Verzonden',
    delivered: 'Afgeleverd',
    cancelled: 'Geannuleerd',
  };

  return statusMap[status] || status;
};

export const getOrderStatusColor = (status: Order['status']): string => {
  const colorMap: Record<Order['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const formatCurrency = (amount: number): string => {
  // Convert number to Decimal and use the proper currency formatter
  const decimalAmount = new Decimal(amount);
  return CurrencyCalculator.format(decimalAmount);
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
};

export const formatDateTime = (dateString: string): string => {
  return new Intl.DateTimeFormat('nl-NL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

// Validation functions
export const validateProfileUpdate = (
  data: UpdateProfileRequest,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (data.first_name !== undefined) {
    if (!data.first_name.trim()) {
      errors.first_name = 'Voornaam is verplicht';
    } else if (data.first_name.length > 50) {
      errors.first_name = 'Voornaam mag maximaal 50 tekens bevatten';
    }
  }

  if (data.last_name !== undefined) {
    if (!data.last_name.trim()) {
      errors.last_name = 'Achternaam is verplicht';
    } else if (data.last_name.length > 50) {
      errors.last_name = 'Achternaam mag maximaal 50 tekens bevatten';
    }
  }

  if (data.preposition !== undefined && data.preposition.length > 20) {
    errors.preposition = 'Tussenvoegsel mag maximaal 20 tekens bevatten';
  }

  if (data.email !== undefined) {
    if (!data.email.trim()) {
      errors.email = 'E-mailadres is verplicht';
    } else if (data.email.length > 254) {
      errors.email = 'E-mailadres is te lang';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(data.email)) {
        errors.email = 'Ongeldig e-mailadres formaat';
      }
    }
  }

  return errors;
};

export const validatePasswordChange = (
  data: ChangePasswordRequest,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.current_password) {
    errors.current_password = 'Huidig wachtwoord is verplicht';
  }

  if (!data.new_password) {
    errors.new_password = 'Nieuw wachtwoord is verplicht';
  } else {
    if (data.new_password.length < 8) {
      errors.new_password = 'Wachtwoord moet minimaal 8 tekens lang zijn';
    }

    if (data.new_password.length > 128) {
      errors.new_password = 'Wachtwoord is te lang (maximaal 128 tekens)';
    }

    if (!/[A-Z]/.test(data.new_password)) {
      errors.new_password = 'Wachtwoord moet minimaal één hoofdletter bevatten';
    }

    if (!/[a-z]/.test(data.new_password)) {
      errors.new_password =
        'Wachtwoord moet minimaal één kleine letter bevatten';
    }

    if (!/\d/.test(data.new_password)) {
      errors.new_password = 'Wachtwoord moet minimaal één cijfer bevatten';
    }

    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (
      !data.new_password.split('').some((char) => specialChars.includes(char))
    ) {
      errors.new_password =
        'Wachtwoord moet minimaal één speciaal teken bevatten';
    }
  }

  if (!data.confirm_password) {
    errors.confirm_password = 'Bevestig het nieuwe wachtwoord';
  } else if (data.new_password !== data.confirm_password) {
    errors.confirm_password = 'Wachtwoorden komen niet overeen';
  }

  return errors;
};
