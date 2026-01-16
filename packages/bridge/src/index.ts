/**
 * RadFlow Bridge - Entry Point
 *
 * This module initializes the RadFlow bridge in the target Next.js application.
 * It installs a fiber hook to track React components and sets up postMessage
 * communication with the RadFlow host.
 *
 * Usage:
 * The bridge is automatically injected via the withRadflow() Next.js config wrapper.
 * It only runs in development mode.
 */

export * from './types';

// Re-export withRadflow from the Next.js wrapper
export { withRadflow, type WithRadflowOptions } from './next.config.wrapper';

// Re-export installer utilities
export {
  installHealthEndpoint,
  isHealthEndpointInstalled,
  removeHealthEndpoint,
  detectRouterType,
  type InstallResult,
} from './installer';

/**
 * Initialize the RadFlow bridge.
 * Called automatically when the bridge script loads in the browser.
 */
function initBridge(): void {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Only initialize in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Prevent double initialization
  if (window.__RADFLOW__) {
    console.warn('[RadFlow] Bridge already initialized');
    return;
  }

  console.log('[RadFlow] Initializing bridge...');

  // Initialize with empty componentMap (populated by fiber-hook in fn-5.2)
  window.__RADFLOW__ = {
    version: '0.1.0',
    componentMap: new Map(),
    getEntry: (id) => window.__RADFLOW__?.componentMap.get(id),
    getEntryByElement: (el) => {
      const id = el.getAttribute('data-radflow-id');
      return id ? window.__RADFLOW__?.componentMap.get(id) : undefined;
    },
  };

  console.log('[RadFlow] Bridge initialized (v0.1.0)');

  // Fiber hook installation will be added in fn-5.2
  // Message bridge will be added in fn-5.3
}

// Auto-initialize when loaded in browser
if (typeof window !== 'undefined') {
  // Use requestIdleCallback or setTimeout to avoid blocking
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => initBridge());
  } else {
    setTimeout(initBridge, 0);
  }
}
