export { buildRegistry } from './build-registry';
export { buildRegistryMetadata } from './build-registry-metadata';
export { PropControls, getControllableProps } from './PropControls';
export {
  getPreviewStateNames,
  resolvePreviewState,
  type ActivePreviewState,
} from './preview-states';
export { CATEGORIES, CATEGORY_LABELS } from './types';
export { useShowcaseProps } from './useShowcaseProps';
export type {
  A11yContract,
  ComponentCategory,
  DensityContract,
  CompositionRules,
  ElementReplacement,
  ForcedState,
  PreviewState,
  PropDef,
  SlotDef,
  StructuralRule,
  StyleOwnership,
} from './types';
export type {
  RegistryEntry,
  RegistryMetadataEntry,
  RuntimeAttachment,
  VariantDemo,
  RenderMode,
} from './types';

import { buildRegistry } from './build-registry';

/** Pre-built registry of all RDNA components */
export const registry = buildRegistry();
