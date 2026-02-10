const NAV_SETTLE_DELAY_MS = 500;

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
  setTimeout(() => {
    const snapshot = [...listeners];
    for (const cb of snapshot) {
      try {
        cb();
      } catch (e) {
        console.error('[navigationWatcher]', e);
      }
    }
  }, NAV_SETTLE_DELAY_MS);
});
