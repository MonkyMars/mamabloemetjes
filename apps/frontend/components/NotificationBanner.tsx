'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';

interface NotificationBannerProps {
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  duration?: number;
  onClose?: () => void;
  show: boolean;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  type = 'warning',
  duration = 3000,
  onClose,
  show,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsAnimating(true);

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, handleClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-amber-50 border-amber-200 text-amber-800';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'info':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-amber-500';
    }
  };

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isAnimating
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-md ${getTypeStyles()}`}
      >
        <FiAlertCircle className={`w-5 h-5 flex-shrink-0 ${getIconColor()}`} />
        <span className='text-sm font-medium flex-1'>{message}</span>
        <button
          onClick={handleClose}
          className={`flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors ${getIconColor()}`}
        >
          <FiX className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner;
