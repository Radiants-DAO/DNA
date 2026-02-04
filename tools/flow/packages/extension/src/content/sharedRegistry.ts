/**
 * Shared Feature Registry
 *
 * Singleton registry for content script features (guides, selection, etc.)
 * that can be activated/deactivated via panel:feature messages.
 *
 * Both content.ts and panelRouter.ts import this to ensure they share
 * the same registry instance.
 */

import { createRegistry, type Feature } from './features/registry';

// Singleton instance
let sharedRegistry: ReturnType<typeof createRegistry> | null = null;

/**
 * Get the shared feature registry singleton.
 * Creates the registry on first call.
 */
export function getSharedFeatureRegistry(): ReturnType<typeof createRegistry> {
  if (!sharedRegistry) {
    sharedRegistry = createRegistry();
  }
  return sharedRegistry;
}

/**
 * Register a feature with the shared registry.
 */
export function registerSharedFeature(id: string, feature: Feature): void {
  getSharedFeatureRegistry().register(id, feature);
}

/**
 * Activate a feature by id in the shared registry.
 */
export function activateSharedFeature(id: string): boolean {
  return getSharedFeatureRegistry().activate(id);
}

/**
 * Deactivate the currently active feature in the shared registry.
 */
export function deactivateSharedFeature(): void {
  getSharedFeatureRegistry().deactivate();
}

// Re-export the Feature type for convenience
export type { Feature } from './features/registry';
