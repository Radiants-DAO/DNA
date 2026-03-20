import { buildRegistryMetadata } from './build-registry-metadata';
import { runtimeAttachments } from './runtime-attachments';
import type { RegistryEntry } from './types';

/**
 * Build the full runtime registry: canonical metadata + React runtime wiring.
 */
export function buildRegistry(): RegistryEntry[] {
  return buildRegistryMetadata().map((metadata) => ({
    ...metadata,
    ...runtimeAttachments[metadata.name],
  }));
}
