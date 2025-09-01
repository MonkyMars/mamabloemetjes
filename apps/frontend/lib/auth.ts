import axios from 'axios';
import api from './axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshResponse,
  RefreshTokenRequest,
  User,
} from '../types/auth';
import { ApiResponse } from '../types/api';
import { capitalize } from './utils';

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
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
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
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
export const login = async (
  credentials: LoginRequest,
): Promise<AuthResponse> => {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials,
    );
    const authData = response.data.data;

    // Store tokens and user data
    setTokens(authData.access_token, authData.refresh_token);
    setUser(authData.user);

    return authData;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Inloggen mislukt. Probeer het opnieuw.');
  }
};

export const register = async (
  credentials: RegisterRequest,
): Promise<AuthResponse> => {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      credentials,
    );
    const authData = response.data.data;

    // Store tokens and user data
    setTokens(authData.access_token, authData.refresh_token);
    setUser(authData.user);

    return authData;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Registratie mislukt. Probeer het opnieuw.');
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
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
    throw new Error('Geen refresh token beschikbaar');
  }

  try {
    const response = await api.post<ApiResponse<RefreshResponse>>(
      '/auth/refresh',
      {
        refresh_token: refreshToken,
      } as RefreshTokenRequest,
    );

    const refreshData = response.data.data;

    // Update access token
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', refreshData.access_token);
    }

    return refreshData;
  } catch {
    clearTokens();
    throw new Error('Token vernieuwen mislukt');
  }
};

export const verifyToken = async (): Promise<User> => {
  try {
    const response = await api.get<ApiResponse<User>>('/auth/verify');
    const user = response.data.data;
    setUser(user);
    return user;
  } catch {
    clearTokens();
    throw new Error('Token verificatie mislukt');
  }
};

export const getProfile = async (): Promise<User> => {
  try {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    const user = response.data.data;
    setUser(user);
    return user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Profiel ophalen mislukt');
  }
};

// Validation functions matching backend validation
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'E-mailadres is verplicht';
  }

  if (email.length > 254) {
    return 'E-mailadres is te lang';
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return 'Ongeldig e-mailadres formaat';
  }

  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Wachtwoord is verplicht';
  }

  if (password.length < 8) {
    return 'Wachtwoord moet minimaal 8 tekens lang zijn';
  }

  if (password.length > 128) {
    return 'Wachtwoord is te lang (maximaal 128 tekens)';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Wachtwoord moet minimaal één hoofdletter bevatten';
  }

  if (!/[a-z]/.test(password)) {
    return 'Wachtwoord moet minimaal één kleine letter bevatten';
  }

  if (!/\d/.test(password)) {
    return 'Wachtwoord moet minimaal één cijfer bevatten';
  }

  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!password.split('').some((char) => specialChars.includes(char))) {
    return 'Wachtwoord moet minimaal één speciaal teken bevatten (!@#$%^&*()_+-=[]{}|;:,.<>?)';
  }

  return null;
};

export const getFullName = (user: User | null): string => {
  if (!user) return '';
  const fullName = user.preposition
    ? `${capitalize(user.first_name)} ${user.preposition} ${capitalize(user.last_name)}`
    : `${capitalize(user.first_name)} ${capitalize(user.last_name)}`;
  return fullName.trim();
};
