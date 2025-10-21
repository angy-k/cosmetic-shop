'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect if we're on the client side
 * Useful for preventing hydration mismatches
 */
export function useNoSSR() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook to safely access window object
 */
export function useWindow() {
  const isClient = useNoSSR();
  return isClient ? window : undefined;
}

/**
 * Hook to detect browser extensions that might interfere with hydration
 */
export function useBrowserExtensionDetection() {
  const [hasExtensions, setHasExtensions] = useState(false);
  const isClient = useNoSSR();

  useEffect(() => {
    if (!isClient) return;

    // Check for common extension attributes
    const checkForExtensions = () => {
      const body = document.body;
      const extensionAttributes = [
        'cz-shortcut-listen', // ColorZilla
        'data-new-gr-c-s-check-loaded', // Grammarly
        'data-gr-ext-installed', // Grammarly
        'spellcheck', // Various spell checkers
        'data-adblock', // Ad blockers
        'data-lastpass', // LastPass
      ];

      const hasExtensionAttrs = extensionAttributes.some(attr => 
        body.hasAttribute(attr)
      );

      setHasExtensions(hasExtensionAttrs);
    };

    // Check immediately and after a short delay
    checkForExtensions();
    const timer = setTimeout(checkForExtensions, 100);

    return () => clearTimeout(timer);
  }, [isClient]);

  return hasExtensions;
}
