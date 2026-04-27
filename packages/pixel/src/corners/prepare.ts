import { mirrorH, mirrorV } from '../core.js';
import { bitsToMaskURI, bitsToPath } from '../path.js';
import type { PixelGrid } from '../types.js';
import { getCornerOverrideVersion, resolveCornerDefinition } from './registry.js';
import type {
  CornerRecipeDefinition,
  NormalizedCornerRecipe,
  PreparedCornerAsset,
  PreparedCornerProfile,
  PreparedCornerRecipe,
  PreparedCornerRecipeEntry,
  RequiredCornerMap,
} from './types.js';

const DEFAULT_EDGES: [0 | 1, 0 | 1, 0 | 1, 0 | 1] = [1, 1, 1, 1];
const PROFILE_CACHE_RADIUS_LIMIT = 32;
const profileCache = new Map<string, PreparedCornerProfile>();
let profileCacheVersion = getCornerOverrideVersion();

function syncProfileCacheVersion() {
  const nextVersion = getCornerOverrideVersion();
  if (nextVersion === profileCacheVersion) {
    return;
  }

  profileCache.clear();
  profileCacheVersion = nextVersion;
}

function prepareAsset(grid: PixelGrid): PreparedCornerAsset {
  const path = bitsToPath(grid.bits, grid.width, grid.height);

  return {
    bits: grid.bits,
    path,
    maskImage: bitsToMaskURI(path, grid.width, grid.height),
    width: grid.width,
    height: grid.height,
  };
}

function mirrorGrid(grid: PixelGrid, corner: keyof RequiredCornerMap<PixelGrid>): PixelGrid {
  switch (corner) {
    case 'tl':
      return grid;
    case 'tr':
      return mirrorH(grid);
    case 'br':
      return mirrorH(mirrorV(grid));
    case 'bl':
      return mirrorV(grid);
  }
}

function buildCornerMap(grid: PixelGrid): RequiredCornerMap<PreparedCornerAsset> {
  return {
    tl: prepareAsset(mirrorGrid(grid, 'tl')),
    tr: prepareAsset(mirrorGrid(grid, 'tr')),
    br: prepareAsset(mirrorGrid(grid, 'br')),
    bl: prepareAsset(mirrorGrid(grid, 'bl')),
  };
}

function zeroGrid(gridSize: number, name: string): PixelGrid {
  return {
    name,
    width: gridSize,
    height: gridSize,
    bits: '0'.repeat(gridSize * gridSize),
  };
}

export function prepareCornerProfile(
  shape: string,
  radiusPx: number,
): PreparedCornerProfile {
  syncProfileCacheVersion();

  const key = `${shape}:${radiusPx}`;
  const shouldCache = radiusPx <= PROFILE_CACHE_RADIUS_LIMIT;
  const cached = shouldCache ? profileCache.get(key) : undefined;

  if (cached) {
    return cached;
  }

  const resolved = resolveCornerDefinition(shape, radiusPx);
  const cornerSet = resolved.cornerSet;

  const gridSize = cornerSet.tl.width;
  const borderGrid = cornerSet.border ?? zeroGrid(gridSize, `${cornerSet.name}-border-empty`);
  const prepared: PreparedCornerProfile = {
    key,
    shape,
    radiusPx,
    gridSize,
    source: resolved.source,
    cover: buildCornerMap(cornerSet.tl),
    border: buildCornerMap(borderGrid),
  };

  if (shouldCache) {
    profileCache.set(key, prepared);
  }
  return prepared;
}

export function normalizeCornerRecipe(
  recipe: CornerRecipeDefinition | NormalizedCornerRecipe,
): NormalizedCornerRecipe {
  return {
    name: recipe.name,
    corners: {
      tl: recipe.corners.tl ?? 0,
      tr: recipe.corners.tr ?? 0,
      br: recipe.corners.br ?? 0,
      bl: recipe.corners.bl ?? 0,
    },
    edges: recipe.edges ?? DEFAULT_EDGES,
  };
}

export function prepareCornerRecipe(
  recipe: CornerRecipeDefinition | NormalizedCornerRecipe,
): PreparedCornerRecipe {
  const normalized = normalizeCornerRecipe(recipe);
  const corners = {} as PreparedCornerRecipe['corners'];

  for (const corner of ['tl', 'tr', 'br', 'bl'] as const) {
    const value = normalized.corners[corner];

    if (value === 0) {
      corners[corner] = { kind: 'flat' };
      continue;
    }

    if (value.binding.source === 'theme') {
      corners[corner] = {
        kind: 'theme',
        radiusPx: value.radiusPx,
        binding: value.binding,
      } satisfies PreparedCornerRecipeEntry;
      continue;
    }

    corners[corner] = {
      kind: 'fixed',
      radiusPx: value.radiusPx,
      binding: value.binding,
      profile: prepareCornerProfile(value.binding.shape, value.radiusPx),
    } satisfies PreparedCornerRecipeEntry;
  }

  return {
    name: normalized.name,
    corners,
    edges: normalized.edges,
  };
}
