'use client';

import { useEffect, useRef } from 'react';
import { useWindowManager } from './useWindowManager';
import { isValidAppId } from '@/lib/constants';

/**
 * Hook that syncs window state with URL hash.
 *
 * URL Format:
 * - #brand - Opens brand window
 * - #brand,manifesto - Opens multiple windows
 *
 * Behavior:
 * - On mount: Parse hash and open corresponding windows
 * - On window open: Add appId to hash
 * - On window close: Remove appId from hash
 * - Invalid app IDs are silently ignored
 *
 * @example
 * function App() {
 *   useHashRouting();
 *   return <Desktop />;
 * }
 */
export function useHashRouting() {
  const { windows, openWindow, closeWindow } = useWindowManager();
  const isInitialMount = useRef(true);
  const isUpdatingFromHash = useRef(false);

  // Parse hash and open windows on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parseAndOpenFromHash = () => {
      const hash = window.location.hash.slice(1); // Remove #
      if (!hash) return;

      const appIds = hash.split(',').filter((id) => id.trim());

      isUpdatingFromHash.current = true;

      appIds.forEach((id) => {
        const trimmedId = id.trim();
        if (isValidAppId(trimmedId)) {
          openWindow(trimmedId);
        }
        // Invalid IDs are silently ignored
      });

      // Reset flag after a short delay to allow state to update
      setTimeout(() => {
        isUpdatingFromHash.current = false;
      }, 100);
    };

    parseAndOpenFromHash();

    // Also listen for hash changes (e.g., back/forward navigation)
    const handleHashChange = () => {
      if (!isUpdatingFromHash.current) {
        parseAndOpenFromHash();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [openWindow]);

  // Update hash when windows change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip the initial mount effect
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Skip if we're currently updating from hash
    if (isUpdatingFromHash.current) return;

    // Get all open windows
    const openAppIds = windows
      .filter((w) => w.isOpen)
      .map((w) => w.id)
      .filter((id) => isValidAppId(id));

    // Update hash
    const newHash = openAppIds.join(',');
    const currentHash = window.location.hash.slice(1);

    if (newHash !== currentHash) {
      if (newHash) {
        window.history.replaceState(null, '', `#${newHash}`);
      } else {
        // Remove hash if no windows are open
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [windows]);
}

export default useHashRouting;
