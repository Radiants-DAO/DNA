'use client';

import { useEffect, useRef } from 'react';
import { useWindowManager } from './useWindowManager';
import { isValidAppId } from '../lib/catalog';

export function useHashRouting() {
  const { windows, openWindow, closeWindow, setActiveTab } = useWindowManager();
  const isInitialMount = useRef(true);
  const isUpdatingFromHash = useRef(false);
  const windowsRef = useRef(windows);

  windowsRef.current = windows;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncWindowsFromHash = () => {
      const hash = window.location.hash.slice(1);
      const segments = hash ? hash.split(',').filter((s) => s.trim()) : [];
      const desiredWindows = new Map<string, string | undefined>();
      isUpdatingFromHash.current = true;

      segments.forEach((segment) => {
        const [appId, tabId] = segment.trim().split(':');
        if (isValidAppId(appId)) {
          desiredWindows.set(appId, tabId);
        }
      });

      windowsRef.current
        .filter((windowState) => windowState.isOpen && isValidAppId(windowState.id))
        .forEach((windowState) => {
          if (!desiredWindows.has(windowState.id)) {
            closeWindow(windowState.id);
          }
        });

      desiredWindows.forEach((tabId, appId) => {
        openWindow(appId);
        if (tabId) setActiveTab(appId, tabId);
      });

      queueMicrotask(() => {
        isUpdatingFromHash.current = false;
      });
    };

    syncWindowsFromHash();

    const handleHashChange = () => {
      if (!isUpdatingFromHash.current) syncWindowsFromHash();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [openWindow, closeWindow, setActiveTab]);

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
