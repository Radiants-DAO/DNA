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

export * from './types.js';

// Re-export withRadflow from the Next.js wrapper
export { withRadflow, type WithRadflowOptions } from './next.config.wrapper.js';

// NOTE: Installer utilities are NOT exported from main entry point
// because they use Node.js 'fs' module which breaks client-side bundling.
// Import directly from '@rdna/bridge/installer' for server-side use.

// Import fiber hook for initialization
import { installFiberHook, getOrCreateHook } from './fiber-hook.js';
import { getComponentMap, getEntry, getEntryByElement } from './component-map.js';
import { serializeMap } from './component-map.js';
import { initMessageBridge, sendToHost, isConnected, updateHighlightPosition } from './message-bridge.js';

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

  // Initialize message bridge after DOM is ready
  // The bridge needs document.body to create the highlight overlay
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initMessageBridge();
      setupScrollResizeListeners();
    });
  } else {
    // DOM already loaded
    initMessageBridge();
    setupScrollResizeListeners();
  }

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

  // inject is set up by getOrCreateHook — log status
  if (hook.rendererInterfaces?.size ?? 0 > 0) {
    console.log('[RadFlow] Chaining existing DevTools hook');
  } else {
    console.log('[RadFlow] Created DevTools hook (will intercept React)');
  }
}

/**
 * Set up listeners to update highlight position on scroll/resize.
 */
function setupScrollResizeListeners(): void {
  // Update highlight position on scroll (debounced via rAF)
  let rafId: number | null = null;
  const updateOnFrame = () => {
    updateHighlightPosition();
    rafId = null;
  };

  const handleScrollResize = () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(updateOnFrame);
    }
  };

  window.addEventListener('scroll', handleScrollResize, { passive: true });
  window.addEventListener('resize', handleScrollResize, { passive: true });
}

// CRITICAL: Initialize SYNCHRONOUSLY at module load time
// This ensures we install the DevTools hook BEFORE React boots
// Do NOT use setTimeout, requestIdleCallback, or any async pattern here
if (typeof window !== 'undefined') {
  initBridge();
}
