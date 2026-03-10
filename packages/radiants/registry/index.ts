export { buildRegistry } from './build-registry';
export { CATEGORIES, CATEGORY_LABELS } from './types';
export type { RegistryEntry, ComponentCategory, VariantDemo, DisplayMeta, RenderMode } from './types';

import { buildRegistry } from './build-registry';

/** Pre-built registry of all RDNA components */
export const registry = buildRegistry();
