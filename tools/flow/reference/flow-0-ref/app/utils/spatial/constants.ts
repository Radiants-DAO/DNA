import type { TreeLayoutConfig } from "../../types/spatial";

export const SPATIAL_PERFORMANCE = {
  LAYOUT_WARN_THRESHOLD: 500,
  LAYOUT_BUDGET_MS: 16,
  SVG_WARN_THRESHOLD: 500,
  SEARCH_DEBOUNCE_MS: 300,
  MAX_SEARCH_RESULTS: 50,
} as const;

export const DEFAULT_LAYOUT_CONFIG: TreeLayoutConfig = {
  horizontalGap: 24,      // Gap between sibling nodes (horizontal)
  verticalGap: 48,        // Gap between parent and children (vertical)
  nodeWidth: 200,
  nodeHeight: 64,
  rootOffsetX: 40,
  rootOffsetY: 40,
  maxVisibleChildren: 20,
};

export const AUTO_COLLAPSE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "__pycache__",
  "target",
  ".turbo",
  ".cache",
  "coverage",
  ".nyc_output",
  "vendor",
  ".venv",
  "venv",
] as const;

export const PAN_PHYSICS = {
  baseFriction: 0.975,
  highSpeedFriction: 0.94,
  minVelocity: 0.15,
  maxVelocity: 40,
  velocitySampleCount: 6,
  velocitySampleMaxAge: 80,
} as const;

export const FEEDBACK_TIMINGS = {
  copyFlashMs: 400,
  highlightPulseMs: 2000,
  chevronRotateMs: 150,
  bounceMs: 300,
} as const;

export const SPATIAL_Z_INDEX = {
  background: 0,
  connections: 1,
  nodes: 2,
  controls: 10,
  search: 20,
  toast: 30,
} as const;
