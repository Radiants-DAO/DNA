import { BrushTool } from '@/lib/dotting';
import { buildPixelPlaygroundIconRegistry } from '@/lib/icon-inventory';
import {
  PATTERN_REGISTRY,
  generateShape,
  listCornerShapeNames,
  type CornerShapeName,
  type PixelGrid,
} from '@rdna/pixel';
import type { ModeConfig, PixelMode, PixelPlaygroundState } from './types';

export const MODE_CONFIG: Record<PixelMode, ModeConfig> = {
  corners: {
    mode: 'corners',
    label: 'Corners',
    defaultSize: 8,
    minSize: 2,
    maxSize: 24,
    registryFile: 'packages/pixel/src/corners/registry.ts',
    registryName: 'the corner registry',
  },
  patterns: {
    mode: 'patterns',
    label: 'Patterns',
    defaultSize: 8,
    minSize: 8,
    maxSize: 8,
    registryFile: 'packages/pixel/src/patterns/registry.ts',
    registryName: 'the pattern registry',
  },
  icons: {
    mode: 'icons',
    label: 'Icons',
    defaultSize: 16,
    minSize: 8,
    maxSize: 32,
    registryFile: 'packages/pixel/src/icons/registry.ts',
    registryName: 'the pixel icon registry',
  },
  dither: {
    mode: 'dither',
    label: 'Dither',
    // Canvas isn't used for authoring in dither mode — leave as 8 so the
    // (hidden) default canvas stays cheap to mount.
    defaultSize: 8,
    minSize: 8,
    maxSize: 8,
    registryFile: 'packages/pixel/src/dither/prepare.ts',
    registryName: 'the dither ramp generator',
  },
};

export const DEFAULT_STATE: PixelPlaygroundState = {
  mode: 'patterns',
  gridSize: MODE_CONFIG.patterns.defaultSize,
  fgToken: 'main',
  bgToken: 'page',
  selectedEntry: null,
};

export interface ToolDef {
  tool: BrushTool;
  label: string;
  icon: string;
  large?: boolean;
  /** Kept in the def list but hidden from the palette UI. */
  hidden?: boolean;
}

/**
 * Return the registry list for a given mode.
 *
 * Preview sources:
 * - patterns: `PATTERN_REGISTRY` from `@rdna/pixel`; authoring source of
 *   truth is `packages/pixel/src/patterns/registry.ts`.
 * - icons: converted bitmap icon entries from `@rdna/pixel/icons`; the
 *   authored registry stays in `packages/pixel/src/icons/registry.ts`, and the
 *   browseable converted source used here comes from
 *   `packages/pixel/src/icons/source.ts`.
 * - corners: runtime-generated shape previews from `@rdna/pixel`; authored
 *   definitions and the shared prepare/materialize pipeline live under
 *   `packages/pixel/src/corners/*`. We surface each shape's top-left cover
 *   grid at the current grid size; the preview materializes the selected
 *   shape with the runtime `px()` path.
 *
 * Every branch returns a valid `readonly PixelGrid[]` (empty is fine).
 */
const ICON_REGISTRY = buildPixelPlaygroundIconRegistry();

export function getCornerShapeFromEntryName(
  name: string | null | undefined,
): CornerShapeName | null {
  if (!name) return null;
  const match = /^(.*)-\d+$/.exec(name);
  if (!match || match[1].startsWith('concave-')) return null;
  return match[1] as CornerShapeName;
}

function getCornerRegistry(gridSize: number): readonly PixelGrid[] {
  return listCornerShapeNames().map((shape) => {
    const cornerSet = generateShape(shape, gridSize);
    return {
      ...cornerSet.tl,
      name: `${shape}-${gridSize}`,
    };
  });
}

export function getRegistryForMode(
  mode: PixelMode,
  gridSize = MODE_CONFIG[mode].defaultSize,
): readonly PixelGrid[] {
  switch (mode) {
    case 'patterns':
      return PATTERN_REGISTRY;
    case 'icons':
      return ICON_REGISTRY;
    case 'corners':
      return getCornerRegistry(gridSize);
    case 'dither':
      return [];
  }
}

export const TOOL_DEFS: ToolDef[] = [
  { tool: BrushTool.DOT, label: 'Pen', icon: 'pencil' },
  { tool: BrushTool.ERASER, label: 'Eraser', icon: 'interface-essential-eraser', large: true },
  { tool: BrushTool.PAINT_BUCKET, label: 'Fill', icon: 'design-color-bucket', large: true },
  { tool: BrushTool.LINE, label: 'Line', icon: 'slash-small' },
  { tool: BrushTool.RECTANGLE, label: 'Rect', icon: 'outline-box' },
  { tool: BrushTool.RECTANGLE_FILLED, label: 'Fill Rect', icon: 'notched-square' },
  { tool: BrushTool.ELLIPSE, label: 'Ellipse', icon: 'interface-essential-alert-circle-1', large: true },
  { tool: BrushTool.ELLIPSE_FILLED, label: 'Fill Ellipse', icon: 'interface-essential-alert-circle-2', large: true },
  { tool: BrushTool.SELECT, label: 'Select', icon: 'interface-essential-cursor-select', large: true },
  { tool: BrushTool.NONE, label: 'Pan', icon: 'hand-point', hidden: true },
];
