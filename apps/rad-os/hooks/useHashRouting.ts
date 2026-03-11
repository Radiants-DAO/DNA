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
 * - #settings:general - Opens settings window with "general" tab active
 * - #brand,settings:general - Multiple windows, one with a tab
 *
 * Behavior:
 * - On mount: Parse hash and open corresponding windows (+ set tabs)
 * - On window open/tab change: Update hash
 * - On window close: Remove from hash
 * - Invalid app IDs are silently ignored
 *
 * @example
 * function App() {
 *   useHashRouting();
 *   return <Desktop />;
 * }
 */
export function useHashRouting() {
  const { windows, openWindow, closeWindow, setActiveTab } = useWindowManager();
  const isInitialMount = useRef(true);
  const isUpdatingFromHash = useRef(false);

  // Parse hash and open windows on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parseAndOpenFromHash = () => {
      const hash = window.location.hash.slice(1); // Remove #
      if (!hash) return;

      const segments = hash.split(',').filter((s) => s.trim());

      isUpdatingFromHash.current = true;

      segments.forEach((segment) => {
        const [appId, tabId] = segment.trim().split(':');
        if (isValidAppId(appId)) {
          openWindow(appId);
          if (tabId) {
            setActiveTab(appId, tabId);
          }
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
  }, [openWindow, setActiveTab]);

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

    // Build hash segments: "appId" or "appId:tabId"
    const segments = windows
      .filter((w) => w.isOpen && isValidAppId(w.id))
      .map((w) => (w.activeTab ? `${w.id}:${w.activeTab}` : w.id));

    const newHash = segments.join(',');
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
