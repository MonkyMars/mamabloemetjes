'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to check if the component is running on the client side.
 * This helps prevent hydration mismatches by ensuring consistent rendering
 * between server and client.
 *
 * @returns {boolean} true if the component is mounted on the client, false during SSR
 */
export const useIsClient = (): boolean => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};

export default useIsClient;
