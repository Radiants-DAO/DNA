type ScanCallback = () => void;

const listeners: ScanCallback[] = [];

/**
 * Register a callback to re-run when the inspected page navigates.
 * Fires on both full page loads and SPA pushState/replaceState.
 * Returns an unsubscribe function.
 */
export function onPageNavigated(callback: ScanCallback): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// Set up once — this runs in the DevTools panel context
chrome.devtools.network.onNavigated.addListener((_url: string) => {
  // Small delay to let the new page's DOM settle
  setTimeout(() => {
    for (const cb of listeners) {
      try {
        cb();
      } catch (e) {
        console.error('[navigationWatcher]', e);
      }
    }
  }, 500);
});
