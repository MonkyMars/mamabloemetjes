export interface User {
  id: string;
  first_name: string;
  preposition?: string;
  last_name: string;
  email: string;
  role: 'user' | 'admin';
  email_verified?: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  preposition: string;
  last_name: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    first_name: string,
    preposition: string,
    last_name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface AuthError {
  message: string;
  field?: string;
}

export interface ValidationError {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  general?: string;
}
