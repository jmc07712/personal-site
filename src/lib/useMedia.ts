'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a media query. The server and the first client render report `false`, so
 * markup never differs during hydration; anything layout-critical is done in CSS instead.
 */
export function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const POCKET_QUERY = '(max-width: 768px)';
export const CAN_DRAG_QUERY = '(min-width: 769px) and (pointer: fine)';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
