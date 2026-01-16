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
  type InstallOptions,
} from './installer';

/**
 * Initialize the RadFlow bridge.
 *
 * CRITICAL: This runs SYNCHRONOUSLY at module load time to ensure we install
 * the DevTools hook BEFORE React initializes. The bridge is injected as the
 * first entry in the webpack client bundle via withRadflow().
 *
 * Do NOT use setTimeout, requestIdleCallback, or any async pattern here.
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

  console.log('[RadFlow] Initializing bridge (synchronous, before React)...');

  // Install DevTools hook IMMEDIATELY before React can initialize
  // This is critical - must happen synchronously at module load
  installDevToolsHook();

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

  // Message bridge will be added in fn-5.3
}

/**
 * Install or chain the React DevTools global hook.
 * Must run BEFORE React initializes to intercept fiber commits.
 */
function installDevToolsHook(): void {
  // Ensure the hook exists (React will use it if present)
  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      rendererInterfaces: new Map(),
      inject: () => 0,
      onCommitFiberRoot: () => {},
    };
    console.log('[RadFlow] Created DevTools hook (will intercept React)');
  } else {
    console.log('[RadFlow] Chaining existing DevTools hook');
  }

  // Actual fiber interception will be added in fn-5.2
  // For now, just ensure the hook exists so React registers with it
}

// CRITICAL: Initialize SYNCHRONOUSLY at module load time
// This ensures we install the DevTools hook BEFORE React boots
// Do NOT use setTimeout, requestIdleCallback, or any async pattern here
if (typeof window !== 'undefined') {
  initBridge();
}
