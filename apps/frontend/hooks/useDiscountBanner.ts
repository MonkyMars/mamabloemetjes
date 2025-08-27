'use client';

import { useState, useEffect, useCallback } from 'react';
import { DiscountPromotionWithProducts } from '@/types/promotion';

interface UseDiscountBannerOptions {
  storageKey?: string;
  dismissalDuration?: number; // Hours until banner shows again after dismissal
  autoShowDelay?: number; // Seconds to wait before showing banner
}

interface UseDiscountBannerReturn {
  isVisible: boolean;
  showBanner: () => void;
  dismissBanner: () => void;
  isDismissed: boolean;
  timeUntilExpiry: number | null;
}

export const useDiscountBanner = (
  promotion: DiscountPromotionWithProducts | null,
  options: UseDiscountBannerOptions = {},
): UseDiscountBannerReturn => {
  const {
    storageKey = 'discount-banner-dismissed',
    dismissalDuration = 24, // 24 hours
    autoShowDelay = 3, // 3 seconds
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);

  // Check if banner was previously dismissed
  const checkDismissalStatus = useCallback(() => {
    if (!promotion || typeof window === 'undefined') return true;

    const dismissedData = localStorage.getItem(`${storageKey}-${promotion.id}`);
    if (!dismissedData) return false;

    try {
      const { timestamp } = JSON.parse(dismissedData);
      const dismissedAt = new Date(timestamp);
      const now = new Date();
      const hoursSinceDismissal =
        (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60);

      return hoursSinceDismissal < dismissalDuration;
    } catch {
      // If parsing fails, assume not dismissed
      return false;
    }
  }, [promotion, storageKey, dismissalDuration]);

  // Check if promotion is still active
  const isPromotionActive = useCallback(() => {
    if (!promotion) return false;

    const now = new Date();
    const endDate = new Date(promotion.end_date);
    return now < endDate;
  }, [promotion]);

  // Calculate time until promotion expires
  const calculateTimeUntilExpiry = useCallback(() => {
    if (!promotion) return null;

    const now = new Date();
    const endDate = new Date(promotion.end_date);
    const diff = endDate.getTime() - now.getTime();

    return diff > 0 ? diff : null;
  }, [promotion]);

  // Show banner
  const showBanner = useCallback(() => {
    if (!promotion || !isPromotionActive()) return;
    setIsVisible(true);
  }, [promotion, isPromotionActive]);

  // Dismiss banner
  const dismissBanner = useCallback(() => {
    if (!promotion || typeof window === 'undefined') return;

    setIsVisible(false);
    setIsDismissed(true);

    // Store dismissal timestamp
    const dismissalData = {
      promotionId: promotion.id,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(
      `${storageKey}-${promotion.id}`,
      JSON.stringify(dismissalData),
    );
  }, [promotion, storageKey]);

  // Initialize banner state
  useEffect(() => {
    if (!promotion || !isPromotionActive()) {
      setIsVisible(false);
      return;
    }

    const wasDismissed = checkDismissalStatus();
    setIsDismissed(wasDismissed);

    if (!wasDismissed) {
      // Show banner after delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, autoShowDelay * 1000);

      return () => clearTimeout(timer);
    }
  }, [promotion, checkDismissalStatus, isPromotionActive, autoShowDelay]);

  // Update time until expiry
  useEffect(() => {
    if (!promotion || !isPromotionActive()) {
      setTimeUntilExpiry(null);
      return;
    }

    const updateTime = () => {
      setTimeUntilExpiry(calculateTimeUntilExpiry());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [promotion, isPromotionActive, calculateTimeUntilExpiry]);

  // Hide banner when promotion expires
  useEffect(() => {
    if (timeUntilExpiry !== null && timeUntilExpiry <= 0) {
      setIsVisible(false);
    }
  }, [timeUntilExpiry]);

  return {
    isVisible: isVisible && !isDismissed && isPromotionActive(),
    showBanner,
    dismissBanner,
    isDismissed,
    timeUntilExpiry,
  };
};

// Hook for managing multiple discount banners
export const useMultipleDiscountBanners = (
  promotions: DiscountPromotionWithProducts[],
  options: UseDiscountBannerOptions = {},
) => {
  const [currentPromotionIndex, setCurrentPromotionIndex] = useState(0);
  const [allDismissed, setAllDismissed] = useState(false);

  const currentPromotion = promotions[currentPromotionIndex] || null;

  const bannerState = useDiscountBanner(currentPromotion, options);

  // Move to next promotion when current is dismissed
  useEffect(() => {
    if (
      bannerState.isDismissed &&
      currentPromotionIndex < promotions.length - 1
    ) {
      setCurrentPromotionIndex((prev) => prev + 1);
    } else if (
      bannerState.isDismissed &&
      currentPromotionIndex === promotions.length - 1
    ) {
      setAllDismissed(true);
    }
  }, [bannerState.isDismissed, currentPromotionIndex, promotions.length]);

  return {
    ...bannerState,
    currentPromotion,
    promotionIndex: currentPromotionIndex,
    totalPromotions: promotions.length,
    allDismissed,
    nextPromotion: () => {
      if (currentPromotionIndex < promotions.length - 1) {
        setCurrentPromotionIndex((prev) => prev + 1);
      }
    },
    previousPromotion: () => {
      if (currentPromotionIndex > 0) {
        setCurrentPromotionIndex((prev) => prev - 1);
      }
    },
  };
};

// Hook for banner visibility preferences
export const useDiscountBannerPreferences = () => {
  const [showBanners, setShowBanners] = useState(true);
  const [preferredPosition, setPreferredPosition] = useState<'top' | 'bottom'>(
    'top',
  );

  useEffect(() => {
    // Load preferences from localStorage
    if (typeof window === 'undefined') return;

    const preferences = localStorage.getItem('discount-banner-preferences');
    if (preferences) {
      try {
        const { showBanners: show, position } = JSON.parse(preferences);
        setShowBanners(show ?? true);
        setPreferredPosition(position ?? 'top');
      } catch {
        // If parsing fails, use defaults
      }
    }
  }, []);

  const updatePreferences = useCallback(
    (newPreferences: {
      showBanners?: boolean;
      preferredPosition?: 'top' | 'bottom';
    }) => {
      setShowBanners((prev) => newPreferences.showBanners ?? prev);
      setPreferredPosition((prev) => newPreferences.preferredPosition ?? prev);

      const preferences = {
        showBanners: newPreferences.showBanners ?? showBanners,
        preferredPosition:
          newPreferences.preferredPosition ?? preferredPosition,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'discount-banner-preferences',
          JSON.stringify(preferences),
        );
      }
    },
    [showBanners, preferredPosition],
  );

  return {
    showBanners,
    preferredPosition,
    updatePreferences,
    disableBanners: () => updatePreferences({ showBanners: false }),
    enableBanners: () => updatePreferences({ showBanners: true }),
    setPosition: (position: 'top' | 'bottom') =>
      updatePreferences({ preferredPosition: position }),
  };
};
