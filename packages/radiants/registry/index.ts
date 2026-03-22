export { buildRegistry } from './build-registry';
export { buildRegistryMetadata } from './build-registry-metadata';
export { CATEGORIES, CATEGORY_LABELS } from './types';
export type { PropDef, SlotDef } from '@rdna/preview';
export type {
  RegistryEntry,
  RegistryMetadataEntry,
  RuntimeAttachment,
  ComponentCategory,
  VariantDemo,
  DisplayMeta,
  RenderMode,
  ForcedState,
} from './types';

import { buildRegistry } from './build-registry';

/** Pre-built registry of all RDNA components */
export const registry = buildRegistry();
