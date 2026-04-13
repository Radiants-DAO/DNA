import { generateCorner } from './generate.js';
import { generateShape, listShapes } from './shapes.js';
import type { CornerShapeName } from './shapes.js';
import { bitsToPath, bitsToMaskURI } from './path.js';
import type { PixelCornerSet } from './types.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A single corner value:
 * - `number` — circle corner at that pixel size (0 = no corner / square)
 * - `[mode, size]` — specific shape at given size
 */
export type Corner = number | [mode: string, size: number];

/** Options for the 4-corner and uniform overloads. */
export interface PxOptions {
  /** Which edges are visible — CSS order: top, right, bottom, left. Default [1,1,1,1]. */
  edges?: [top: 0 | 1, right: 0 | 1, bottom: 0 | 1, left: 0 | 1];
  /** Border color override — sets `--color-line`. */
  color?: string;
}

/** Full config object form. */
export interface PxConfig {
  /** Shape mode — default 'circle'. */
  mode?: string;
  /** Uniform radius or per-corner [tl, tr, br, bl]. */
  radius: number | [tl: Corner, tr: Corner, br: Corner, bl: Corner];
  /** Which edges are visible — CSS order: top, right, bottom, left. Default [1,1,1,1]. */
  edges?: [top: 0 | 1, right: 0 | 1, bottom: 0 | 1, left: 0 | 1];
  /** Border color override. */
  color?: string;
  /** Mode-specific sub-settings. */
  [key: string]: unknown;
}

/** Mode-specific options (extends PxOptions with arbitrary keys). */
export interface ModeOptions extends PxOptions {
  [key: string]: unknown;
}

/** Return value of px(). */
export interface PxProps {
  className: string;
  style: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CachedCornerData {
  gridSize: number;
  coverURIs: [tl: string, tr: string, bl: string, br: string];
  borderURIs: [tl: string, tr: string, bl: string, br: string];
}

const cache = new Map<string, CachedCornerData>();

function getCornerData(mode: string, size: number): CachedCornerData {
  const key = `${mode}:${size}`;
  let data = cache.get(key);
  if (data) return data;

  let cornerSet: PixelCornerSet;
  const gridSize = size + 1;

  if (mode === 'circle') {
    cornerSet = generateCorner(size);
  } else {
    cornerSet = generateShape(mode as CornerShapeName, gridSize);
  }

  const coverPath = bitsToPath(cornerSet.tl.bits, gridSize, gridSize);
  const borderPath = cornerSet.border
    ? bitsToPath(cornerSet.border.bits, gridSize, gridSize)
    : '';

  const coverURIs: [string, string, string, string] = [
    bitsToMaskURI(coverPath, gridSize),
    bitsToMaskURI(coverPath, gridSize, `translate(${gridSize},0) scale(-1,1)`),
    bitsToMaskURI(coverPath, gridSize, `translate(0,${gridSize}) scale(1,-1)`),
    bitsToMaskURI(
      coverPath,
      gridSize,
      `translate(${gridSize},${gridSize}) scale(-1,-1)`,
    ),
  ];

  const borderURIs: [string, string, string, string] = borderPath
    ? [
        bitsToMaskURI(borderPath, gridSize),
        bitsToMaskURI(
          borderPath,
          gridSize,
          `translate(${gridSize},0) scale(-1,1)`,
        ),
        bitsToMaskURI(
          borderPath,
          gridSize,
          `translate(0,${gridSize}) scale(1,-1)`,
        ),
        bitsToMaskURI(
          borderPath,
          gridSize,
          `translate(${gridSize},${gridSize}) scale(-1,-1)`,
        ),
      ]
    : ['', '', '', ''];

  data = { gridSize, coverURIs, borderURIs };
  cache.set(key, data);
  return data;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Corner position keys in the order: tl, tr, br, bl. */
const CORNER_KEYS = ['tl', 'tr', 'br', 'bl'] as const;

/** URI variable index for each corner position.
 *  coverURIs/borderURIs are ordered [tl, tr, bl, br] (generation order).
 *  But CORNER_KEYS is [tl, tr, br, bl] (CSS border-radius order).
 *  Map from CORNER_KEYS index → URI array index.
 */
const URI_INDEX: Record<string, number> = { tl: 0, tr: 1, br: 3, bl: 2 };

/** Resolve a Corner value to { mode, size }. */
function resolveCorner(corner: Corner): { mode: string; size: number } {
  if (typeof corner === 'number') {
    return { mode: 'circle', size: corner };
  }
  return { mode: corner[0], size: corner[1] };
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Generate pixel-corner CSS properties for any element.
 *
 * Returns `{ className, style }` to spread onto an element. The className
 * references the `pixel-corner` CSS class (defined in `@rdna/radiants`),
 * which provides the mask infrastructure. The style object sets CSS custom
 * properties that drive the per-corner masks.
 *
 * @example
 * // Uniform 8px circle corners
 * <div {...px(8)} />
 *
 * // Top corners only
 * <div {...px(6, 6, 0, 0)} />
 *
 * // Chamfer shape
 * <div {...px('chamfer', 8)} />
 *
 * // Full config
 * <div {...px({ mode: 'chamfer', radius: [8, 8, 0, 0], edges: [1,1,0,1] })} />
 */
export function px(...args: unknown[]): PxProps {
  // --- Parse arguments into a normalized config ---
  let corners: [Corner, Corner, Corner, Corner];
  let edges: [0 | 1, 0 | 1, 0 | 1, 0 | 1] | undefined;
  let color: string | undefined;

  if (args.length === 0) {
    throw new Error('px() requires at least one argument');
  }

  // Single number → uniform circle (with optional PxOptions)
  if (typeof args[0] === 'number' && (args.length === 1 || (args.length === 2 && isOptions(args[1])))) {
    const size = args[0] as number;
    corners = [size, size, size, size];
    if (args.length === 2) {
      const opts = args[1] as PxOptions;
      edges = opts.edges;
      color = opts.color;
    }
  }
  // Single object → PxConfig
  else if (
    args.length === 1 &&
    typeof args[0] === 'object' &&
    args[0] !== null &&
    !Array.isArray(args[0])
  ) {
    const config = args[0] as PxConfig;
    const mode = config.mode ?? 'circle';
    if (typeof config.radius === 'number') {
      const c: Corner = config.radius === 0 ? 0 : [mode, config.radius];
      corners = [c, c, c, c];
    } else {
      // Per-corner array — apply mode to any plain numbers
      corners = config.radius.map((r) => {
        if (typeof r === 'number') {
          return r === 0 ? 0 : ([mode, r] as [string, number]);
        }
        return r;
      }) as [Corner, Corner, Corner, Corner];
    }
    edges = config.edges;
    color = config.color;
  }
  // String first → mode + size
  else if (typeof args[0] === 'string') {
    const mode = args[0] as string;
    const size = args[1] as number;
    if (typeof size !== 'number') {
      throw new Error('px(mode, size): size must be a number');
    }
    const c: Corner = size === 0 ? 0 : [mode, size];
    corners = [c, c, c, c];
    if (args.length >= 3 && isOptions(args[2])) {
      const opts = args[2] as ModeOptions;
      edges = opts.edges;
      color = opts.color;
    }
  }
  // 4 corner args
  else if (args.length >= 4 && isCorner(args[0]) && isCorner(args[1]) && isCorner(args[2]) && isCorner(args[3])) {
    corners = [args[0] as Corner, args[1] as Corner, args[2] as Corner, args[3] as Corner];
    if (args.length >= 5 && isOptions(args[4])) {
      const opts = args[4] as PxOptions;
      edges = opts.edges;
      color = opts.color;
    }
  } else {
    throw new Error('px(): unrecognized argument pattern');
  }

  // --- Build style object ---
  const style: Record<string, string> = {};

  for (let i = 0; i < 4; i++) {
    const pos = CORNER_KEYS[i];
    const uriIdx = URI_INDEX[pos];
    const corner = corners[i];
    const { mode, size } = resolveCorner(corner);

    if (size === 0) {
      // Size 0 is the CSS default — don't set any vars for this corner.
      continue;
    }

    const data = getCornerData(mode, size);

    style[`--px-${pos}-cover`] = data.coverURIs[uriIdx];
    style[`--px-${pos}-border`] = data.borderURIs[uriIdx];
    style[`--px-${pos}-s`] = `calc(${data.gridSize}px * var(--pixel-scale, 1))`;
  }

  // Edge toggles — only set when not default (default is 1)
  if (edges) {
    const edgeKeys = ['et', 'er', 'eb', 'el'] as const;
    for (let i = 0; i < 4; i++) {
      if (edges[i] !== 1) {
        style[`--px-${edgeKeys[i]}`] = String(edges[i]);
      }
    }
  }

  // Color override
  if (color) {
    style['--color-line'] = color;
  }

  return {
    className: 'pixel-corner',
    style,
  };
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isCorner(val: unknown): val is Corner {
  if (typeof val === 'number') return true;
  if (
    Array.isArray(val) &&
    val.length === 2 &&
    typeof val[0] === 'string' &&
    typeof val[1] === 'number'
  ) {
    return true;
  }
  return false;
}

function isOptions(val: unknown): val is PxOptions {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}
