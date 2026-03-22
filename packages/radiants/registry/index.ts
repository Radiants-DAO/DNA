export { buildRegistry } from './build-registry';
export { buildRegistryMetadata } from './build-registry-metadata';
export { PropControls, getControllableProps } from './PropControls';
export { CATEGORIES, CATEGORY_LABELS } from './types';
export { useShowcaseProps } from './useShowcaseProps';
export type { PropDef, SlotDef, ComponentCategory, ForcedState } from './types';
export type {
  RegistryEntry,
  RegistryMetadataEntry,
  RuntimeAttachment,
  VariantDemo,
  DisplayMeta,
  RenderMode,
} from './types';

import { buildRegistry } from './build-registry';

/** Pre-built registry of all RDNA components */
export const registry = buildRegistry();
