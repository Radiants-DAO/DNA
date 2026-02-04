/**
 * A feature that can be activated and deactivated.
 * The activate function returns a cleanup/deactivate function.
 */
export type Feature = {
  activate: () => () => void;
};

/**
 * Create a feature registry for managing activatable features.
 * Only one feature can be active at a time.
 */
export function createRegistry() {
  const features = new Map<string, Feature>();
  let cleanup: (() => void) | null = null;

  return {
    /**
     * Register a feature with an id.
     */
    register(id: string, feature: Feature) {
      features.set(id, feature);
    },

    /**
     * Activate a feature by id. Deactivates any currently active feature first.
     * Returns false if the feature id is not registered.
     */
    activate(id: string): boolean {
      const feature = features.get(id);
      if (!feature) {
        console.warn(`[registry] Unknown feature id: "${id}"`);
        return false;
      }
      cleanup?.();
      cleanup = feature.activate();
      return true;
    },

    /**
     * Deactivate the currently active feature without switching to another.
     */
    deactivate() {
      cleanup?.();
      cleanup = null;
    },

    /**
     * Get list of registered feature ids.
     */
    getRegistered(): string[] {
      return Array.from(features.keys());
    },
  };
}
