'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, AuthContextType } from '../types/auth';
import * as authService from '../lib/auth';
import * as cartService from '../lib/cart';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const accessToken = authService.getAccessToken();

        if (storedUser && accessToken) {
          // Verify token is still valid
          try {
            const verifiedUser = await authService.verifyToken();
            setUser(verifiedUser);
          } catch (error) {
            // Token invalid, clear stored data
            console.error(error);
            authService.clearTokens();
            setUser(null);
          }
        }
      } catch {
        console.error('Auth initialization error');
        authService.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const authResponse = await authService.login({ email, password });
      setUser(authResponse.user);

      // Merge guest cart after successful login
      await mergeGuestCartOnLogin();
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const mergeGuestCartOnLogin = async (): Promise<void> => {
    try {
      const localCart = cartService.getLocalCart();
      if (localCart.items.length > 0) {
        // Merge guest cart with user's cart
        await cartService.mergeCart({ items: localCart.items });
        // Clear local cart after successful merge
        cartService.clearLocalCart();
      }
    } catch (error) {
      console.error('Failed to merge guest cart:', error);
      // Don't throw error as login was successful, cart merge is secondary
    }
  };

  const register = async (
    first_name: string,
    preposition: string,
    last_name: string,
    email: string,
    password: string,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const authResponse = await authService.register({
        first_name,
        preposition,
        last_name,
        email,
        password,
      });
      setUser(authResponse.user);

      // Merge guest cart after successful registration
      await mergeGuestCartOnLogin();
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      await authService.refreshAccessToken();
      // Verify the new token and get updated user info
      const verifiedUser = await authService.verifyToken();
      setUser(verifiedUser);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
