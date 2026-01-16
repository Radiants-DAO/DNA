/**
 * RadFlow Fiber Hook
 *
 * Integrates with React's __REACT_DEVTOOLS_GLOBAL_HOOK__ to intercept
 * fiber commits and build the componentMap.
 *
 * Implementation: fn-5.2
 */

import type { ReactDevToolsHook, FiberRoot } from './types';

/**
 * Install the RadFlow fiber hook.
 * Chains with existing DevTools hooks (doesn't replace them).
 */
export function installFiberHook(): void {
  // Implementation in fn-5.2
  console.log('[RadFlow] Fiber hook installation pending (fn-5.2)');
}

/**
 * Handle a fiber root commit.
 * Called by React after each render commit.
 */
export function handleCommit(_root: FiberRoot): void {
  // Implementation in fn-5.2
}

/**
 * Get the existing DevTools hook or create a minimal one.
 */
export function getOrCreateHook(): ReactDevToolsHook {
  if (typeof window === 'undefined') {
    return {};
  }

  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      rendererInterfaces: new Map(),
    };
  }

  return window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}
