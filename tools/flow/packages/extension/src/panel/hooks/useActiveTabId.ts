import { useState, useEffect, useRef } from 'react';

/**
 * Resolves the active tab ID for the current window.
 *
 * In a Side Panel context, queries chrome.tabs and listens for tab changes.
 * Scoped to the window the Side Panel was opened in — ignores activations
 * in other windows to avoid reconnecting to the wrong tab.
 *
 * Returns `null` until the tabId is resolved.
 */
export function useActiveTabId(): number | null {
  const [tabId, setTabId] = useState<number | null>(null);
  const windowIdRef = useRef<number | null>(null);

  useEffect(() => {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          setTabId(activeTab.id);
        }
        if (activeTab?.windowId) {
          windowIdRef.current = activeTab.windowId;
        }
      })
      .catch(() => {});

    const handleActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      // Only react to activations in our window
      if (windowIdRef.current !== null && activeInfo.windowId !== windowIdRef.current) {
        return;
      }
      setTabId(activeInfo.tabId);
    };

    const handleRemoved = (removedTabId: number) => {
      setTabId((current) => (current === removedTabId ? null : current));
    };

    chrome.tabs.onActivated.addListener(handleActivated);
    chrome.tabs.onRemoved.addListener(handleRemoved);

    return () => {
      chrome.tabs.onActivated.removeListener(handleActivated);
      chrome.tabs.onRemoved.removeListener(handleRemoved);
    };
  }, []);

  return tabId;
}
