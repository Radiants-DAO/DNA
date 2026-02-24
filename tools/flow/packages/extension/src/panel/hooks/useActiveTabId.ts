import { useState, useEffect } from 'react';

/**
 * Resolves the active tab ID for the current window.
 *
 * In a Side Panel context, queries chrome.tabs and listens for tab changes.
 * Returns `null` until the tabId is resolved.
 */
export function useActiveTabId(): number | null {
  const [tabId, setTabId] = useState<number | null>(null);

  useEffect(() => {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          setTabId(activeTab.id);
        }
      })
      .catch(() => {});

    const handleActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
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
