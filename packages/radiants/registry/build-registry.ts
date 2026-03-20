import { componentMap } from './component-map';
import { overrides } from './registry.overrides';
import { buildRegistryMetadata } from './build-registry-metadata';
import type { RegistryEntry } from './types';

/**
 * Build the full runtime registry by combining canonical metadata with
 * React component refs and Demo components from registry.overrides.tsx.
 */
export function buildRegistry(): RegistryEntry[] {
  return buildRegistryMetadata().map((metadata) => {
    const map = componentMap[metadata.name];
    const override = overrides[metadata.name];

    return {
      ...metadata,
      component: map?.component as any,
      Demo: override?.Demo,
    };
  });
}
