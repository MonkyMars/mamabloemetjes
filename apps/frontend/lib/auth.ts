import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, RefreshResponse, RefreshTokenRequest, User } from '../types/auth';
import { ApiResponse } from '../types/api';

// Create axios instance with base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
authApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshAccessToken();
        const token = getAccessToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return authApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Token management functions
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const setUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// API functions
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await authApi.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const authData = response.data.data;

    // Store tokens and user data
    setTokens(authData.access_token, authData.refresh_token);
    setUser(authData.user);

    return authData;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Login failed. Please try again.');
  }
};

export const register = async (credentials: RegisterRequest): Promise<AuthResponse> => {
  try {
    const response = await authApi.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    const authData = response.data.data;

    // Store tokens and user data
    setTokens(authData.access_token, authData.refresh_token);
    setUser(authData.user);

    return authData;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Registration failed. Please try again.');
  }
};

export const logout = async (): Promise<void> => {
  try {
    await authApi.post('/auth/logout');
  } catch (error) {
    // Even if logout fails on server, clear local tokens
    console.warn('Server logout failed:', error);
  } finally {
    clearTokens();
  }
};

export const refreshAccessToken = async (): Promise<RefreshResponse> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await authApi.post<ApiResponse<RefreshResponse>>('/auth/refresh', {
      refresh_token: refreshToken,
    } as RefreshTokenRequest);

    const refreshData = response.data.data;

    // Update access token
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', refreshData.access_token);
    }

    return refreshData;
  } catch (error) {
    clearTokens();
    throw new Error('Token refresh failed');
  }
};

export const verifyToken = async (): Promise<User> => {
  try {
    const response = await authApi.get<ApiResponse<User>>('/auth/verify');
    const user = response.data.data;
    setUser(user);
    return user;
  } catch (error) {
    clearTokens();
    throw new Error('Token verification failed');
  }
};

export const getProfile = async (): Promise<User> => {
  try {
    const response = await authApi.get<ApiResponse<User>>('/auth/profile');
    const user = response.data.data;
    setUser(user);
    return user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to fetch profile');
  }
};

// Validation functions matching backend validation
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email is required';
  }

  if (email.length > 254) {
    return 'Email is too long';
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }

  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (password.length > 128) {
    return 'Password is too long (max 128 characters)';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }

  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!password.split('').some(char => specialChars.includes(char))) {
    return 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)';
  }

  return null;
};
