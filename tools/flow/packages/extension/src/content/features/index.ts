/**
 * List of all available feature IDs.
 */
export const featureIds = [
  'spacing',
  'typography',
  'colors',
  'shadows',
  'layout',
  'position',
  'text',
  'search',
  'accessibility',
  'imageswap',
  'screenshot',
] as const;

export type FeatureId = (typeof featureIds)[number];
