'use client';

import { useState, useEffect } from 'react';

/**
 * ClientOnly component to prevent hydration mismatches
 * Renders children only on the client side after hydration
 */
export default function ClientOnly({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
}
