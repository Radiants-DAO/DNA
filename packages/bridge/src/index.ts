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

// Import fiber hook for initialization
import { installFiberHook, getOrCreateHook } from './fiber-hook';
import { getComponentMap, getEntry, getEntryByElement } from './component-map';
import { serializeMap } from './component-map';
import { sendToHost, isConnected } from './message-bridge';

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
  installDevToolsHookEarly();

  // Initialize the bridge API on window
  const componentMap = getComponentMap();
  window.__RADFLOW__ = {
    version: '0.1.0',
    componentMap,
    getEntry: (id) => getEntry(id),
    getEntryByElement: (el) => getEntryByElement(el),
  };

  // Install the fiber hook with callback to notify host of updates
  installFiberHook(() => {
    // Send updated componentMap to host when React commits
    if (isConnected()) {
      sendToHost({
        type: 'COMPONENT_MAP',
        entries: serializeMap(),
      });
    }
  });

  console.log('[RadFlow] Bridge initialized (v0.1.0)');
}

/**
 * Install or chain the React DevTools global hook.
 * Must run BEFORE React initializes to intercept fiber commits.
 *
 * This is called during module load (synchronously) to ensure the hook
 * exists before React's first render.
 */
function installDevToolsHookEarly(): void {
  // getOrCreateHook ensures the hook exists and creates it if not present
  const hook = getOrCreateHook();

  if (!hook.inject) {
    // Add inject method if not present (React uses this to register)
    hook.inject = () => {
      console.log('[RadFlow] React renderer registered');
      return 0;
    };
  }

  // Log whether we're creating or chaining
  if (hook.rendererInterfaces?.size ?? 0 > 0) {
    console.log('[RadFlow] Chaining existing DevTools hook');
  } else {
    console.log('[RadFlow] Created DevTools hook (will intercept React)');
  }
}

// CRITICAL: Initialize SYNCHRONOUSLY at module load time
// This ensures we install the DevTools hook BEFORE React boots
// Do NOT use setTimeout, requestIdleCallback, or any async pattern here
if (typeof window !== 'undefined') {
  initBridge();
}
