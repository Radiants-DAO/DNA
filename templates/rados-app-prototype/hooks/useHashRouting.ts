'use client';

import { useEffect, useRef } from 'react';
import { useWindowManager } from './useWindowManager';
import { isValidAppId } from '../lib/catalog';

export function useHashRouting() {
  const { windows, openWindow, setActiveTab } = useWindowManager();
  const isInitialMount = useRef(true);
  const isUpdatingFromHash = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parseAndOpenFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;

      const segments = hash.split(',').filter((s) => s.trim());
      isUpdatingFromHash.current = true;

      segments.forEach((segment) => {
        const [appId, tabId] = segment.trim().split(':');
        if (isValidAppId(appId)) {
          openWindow(appId);
          if (tabId) setActiveTab(appId, tabId);
        }
      });

      queueMicrotask(() => {
        isUpdatingFromHash.current = false;
      });
    };

    parseAndOpenFromHash();

    const handleHashChange = () => {
      if (!isUpdatingFromHash.current) parseAndOpenFromHash();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [openWindow, setActiveTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isUpdatingFromHash.current) return;

    const segments = windows
      .filter((w) => w.isOpen && isValidAppId(w.id))
      .map((w) => (w.activeTab ? `${w.id}:${w.activeTab}` : w.id));

    const newHash = segments.join(',');
    const currentHash = window.location.hash.slice(1);

    if (newHash !== currentHash) {
      if (newHash) {
        window.history.replaceState(null, '', `#${newHash}`);
      } else {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [windows]);
}
