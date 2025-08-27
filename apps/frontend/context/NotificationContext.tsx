'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationBanner from '../components/NotificationBanner';

interface Notification {
  id: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  duration?: number;
}

interface NotificationContextType {
  showNotification: (
    message: string,
    type?: 'error' | 'warning' | 'info' | 'success',
    duration?: number,
  ) => void;
  showStockError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback(
    (
      message: string,
      type: 'error' | 'warning' | 'info' | 'success' = 'warning',
      duration: number = 3000,
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      setNotification({ id, message, type, duration });
    },
    [],
  );

  const showStockError = useCallback(() => {
    showNotification('Geen voorraad beschikbaar', 'warning', 3000);
  }, [showNotification]);

  const handleClose = useCallback(() => {
    setNotification(null);
  }, []);

  const value = {
    showNotification,
    showStockError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={handleClose}
          show={!!notification}
        />
      )}
    </NotificationContext.Provider>
  );
};
