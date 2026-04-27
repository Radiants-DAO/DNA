import { prepareCornerProfile } from './prepare.js';
import type {
  CornerRecipeMaterializeOptions,
  CornerStyleMaterializeOptions,
  PreparedCornerProfile,
  PreparedCornerRecipe,
} from './types.js';

const DEFAULT_THEME_SHAPE = 'circle';

export function materializeCornerStyle(
  prepared: PreparedCornerProfile,
  options: CornerStyleMaterializeOptions = {},
): Record<string, string> {
  const style: Record<string, string> = {};
  const corners = options.corner
    ? [options.corner]
    : (['tl', 'tr', 'br', 'bl'] as const);

  for (const corner of corners) {
    style[`--px-${corner}-cover`] = prepared.cover[corner].maskImage;
    style[`--px-${corner}-border`] = prepared.border[corner].maskImage;
    style[`--px-${corner}-s`] = `calc(${prepared.gridSize}px * var(--pixel-scale, 1))`;
  }

  return style;
}

export function materializeCornerRecipe(
  recipe: PreparedCornerRecipe,
  options: CornerRecipeMaterializeOptions = {},
): Record<string, string> {
  const style: Record<string, string> = {};
  const themeShape = options.themeShape ?? DEFAULT_THEME_SHAPE;

  for (const corner of ['tl', 'tr', 'br', 'bl'] as const) {
    const entry = recipe.corners[corner];

    if (entry.kind === 'flat') {
      continue;
    }

    const profile =
      entry.kind === 'theme'
        ? prepareCornerProfile(themeShape, entry.radiusPx)
        : entry.profile;

    Object.assign(style, materializeCornerStyle(profile, { corner }));
  }

  const edgeKeys = ['et', 'er', 'eb', 'el'] as const;
  for (let index = 0; index < recipe.edges.length; index += 1) {
    if (recipe.edges[index] !== 1) {
      style[`--px-${edgeKeys[index]}`] = String(recipe.edges[index]);
    }
  }

  return style;
}

export function clampCornerRadii(
  width: number,
  height: number,
  radii: [number, number, number, number],
): [number, number, number, number] {
  const maxRadius = Math.max(0, Math.floor(Math.min(width, height) / 2));

  return radii.map((radius) => Math.max(0, Math.min(radius, maxRadius))) as [
    number,
    number,
    number,
    number,
  ];
}

export const fitCornerRadii = clampCornerRadii;
