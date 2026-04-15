# @rdna/pixel — Unified Pixel Art System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task.

**Goal:** Replace CSS mask patterns and clip-path pixel corners with a unified 1-bit pixel asset pipeline. Static surfaces render from SVG/DOM, transitions render from canvas, and 16px/24px icons become canonical grid/tilemap assets instead of runtime SVG.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-pixel-art` (branch: `feat/pixel-art-system`)

**Architecture:** Standalone `@rdna/pixel` owns grid validation, mirroring, diffing, SVG serialization, canvas painting, transition ordering, and SVG-to-grid import/normalization. `@rdna/radiants` consumes it for `Pattern`, `PixelCorner`, `PixelTransition`, and later `PixelIcon`. Patterns, corners, and icon glyphs are stored as canonical bit-grids; SVG remains only as source art at import time.

**Tech Stack:** TypeScript, React 19, SVG, Canvas API, Vitest, pnpm workspaces

**Brainstorm:** `docs/brainstorms/2026-03-31-radiants-pixel-art-system-brainstorm.md`

### Review Fixes Applied

This plan incorporates fixes from architectural review (2026-03-31):

1. **Static rendering is SVG-first.** `Pattern`, `PixelCorner`, and `PixelIcon` stay declarative and theme-reactive; canvas is reserved for animated frames and previews.
2. **Canvas CSS-color probing is no longer required for static surfaces.** Inline SVG can consume CSS variables and `currentColor` directly, avoiding the `bg` clobber bug from the earlier Pattern sketch.
3. **Theme changes stay live by default.** `.dark` toggles and token changes update SVG-rendered pixel art without manual repaint observers.
4. **Transition cache miss remains fixed.** `interpolateFrame` operates on raw bitstrings, and frame parsing happens once per animation start rather than once per RAF tick.
5. **PixelCorner must preserve current compound semantics.** Mixed-size and omitted-corner variants map to per-corner size records and `square`/omitted corners instead of a single-size API.
6. **Missing consumers remain in scope.** GoodNewsApp, typography-playground, pattern-playground, and templates/ are still part of the migration surface.
7. **`pixel-shadow-*` migration stays explicit.** Move consumers before deleting old pixel-corner CSS utilities.
8. **`--pat-*` CSS token stubs stay until the final CSS consumers are migrated.** Do not remove token bridges early.
9. **Icon migration is back in scope.** The 16px Dropbox source is grid-authored, and the in-repo 24px SVG set is mechanically importable after normalization.
10. **24px icon import requires a normalization/outlier pass.** Most files snap to a 0.5 lattice; track the small number of exceptions in an outlier manifest rather than blocking the whole phase.
11. **ESLint/test path references corrected.** Use `eslint/index.mjs`, `contract.mjs`, and the real component test locations under `packages/radiants/components/core/`.
12. **`no-pattern-color-override` is not removed until the last CSS pattern consumer is gone.**
13. **Small-element threshold still applies.** Elements with xs corners under 48px can keep standard `rounded-*` instead of four extra corner overlays.

---

## Phase 1: Package Scaffold + Core Engine

### Task 1.1: Scaffold `@rdna/pixel` package

**Files:**
- Create: `packages/pixel/package.json`
- Create: `packages/pixel/tsconfig.json`
- Create: `packages/pixel/src/index.ts`
- Create: `packages/pixel/src/types.ts`

**Step 1: Create package.json**

```json
{
  "name": "@rdna/pixel",
  "version": "0.1.0",
  "description": "1-bit pixel engine — core grids, SVG/canvas renderers, transitions, icon import",
  "type": "module",
  "publishConfig": { "access": "public" },
  "files": ["dist", "src"],
  "exports": {
    ".": { "types": "./src/index.ts", "import": "./src/index.ts" },
    "./core": { "types": "./src/core.ts", "import": "./src/core.ts" },
    "./renderer": { "types": "./src/renderer.ts", "import": "./src/renderer.ts" },
    "./svg": { "types": "./src/svg.ts", "import": "./src/svg.ts" },
    "./transition": { "types": "./src/transition.ts", "import": "./src/transition.ts" },
    "./corners": { "types": "./src/corners.ts", "import": "./src/corners.ts" },
    "./import": { "types": "./src/import.ts", "import": "./src/import.ts" }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:ci": "vitest run"
  },
  "devDependencies": {
    "@types/node": "^20",
    "typescript": "^5",
    "vitest": "^2.1.9"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "rewriteRelativeImportExtensions": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["src/__tests__"]
}
```

**Step 3: Create types.ts**

```ts
/** A 1-bit pixel grid — the universal primitive */
export interface PixelGrid {
  name: string;
  width: number;
  height: number;
  /** Binary string of 0s and 1s, length = width × height */
  bits: string;
}

/** Corner set — top-left grid + metadata, other corners derived by mirroring */
export interface PixelCornerSet {
  name: string;
  /** Top-left corner grid (mirrored for other 3 corners) */
  tl: PixelGrid;
  /** Border pixel color layer bits (same grid, drawn in border color) */
  border?: PixelGrid;
  /** Pixel border thickness — default 1 */
  borderWidth?: number;
}

/** Spatial pattern for bit-flip transitions */
export type TransitionMode = 'random' | 'radial' | 'scanline' | 'scatter';

/** Transition config between two grids of the same dimensions */
export interface TransitionConfig {
  from: PixelGrid;
  to: PixelGrid;
  mode: TransitionMode;
  /** Duration in ms */
  duration: number;
}

/** Keyframe animation — array of frames at fixed FPS */
export interface PixelAnimation {
  name: string;
  width: number;
  height: number;
  fps: number;
  frames: string[];
}

/** Corner position */
export type CornerPosition = 'tl' | 'tr' | 'bl' | 'br';
```

**Step 4: Create index.ts (empty barrel, filled incrementally)**

```ts
export type {
  PixelGrid,
  PixelCornerSet,
  TransitionMode,
  TransitionConfig,
  PixelAnimation,
  CornerPosition,
} from './types';
```

**Step 5: Install dependencies**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm install`

**Step 6: Verify**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel build`
Expected: Compiles without errors.

**Step 7: Commit**

```bash
git add packages/pixel/
git commit -m "feat(pixel): scaffold @rdna/pixel package with types"
```

---

### Task 1.2: Core bitstring engine

**Files:**
- Create: `packages/pixel/src/core.ts`
- Create: `packages/pixel/src/__tests__/core.test.ts`
- Modify: `packages/pixel/src/index.ts`

**Step 1: Write failing tests**

```ts
// packages/pixel/src/__tests__/core.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseBits,
  validateGrid,
  gridFromHex,
  mirrorH,
  mirrorV,
  diffBits,
  bitsToGrid,
} from '../core';

describe('parseBits', () => {
  it('converts bitstring to Uint8Array', () => {
    const result = parseBits('10110100');
    expect(result).toEqual(new Uint8Array([1, 0, 1, 1, 0, 1, 0, 0]));
  });

  it('throws on invalid characters', () => {
    expect(() => parseBits('102')).toThrow('Invalid bitstring');
  });

  it('handles empty string', () => {
    expect(parseBits('')).toEqual(new Uint8Array(0));
  });
});

describe('validateGrid', () => {
  it('passes for valid grid', () => {
    expect(() =>
      validateGrid({ name: 'test', width: 2, height: 2, bits: '1010' })
    ).not.toThrow();
  });

  it('throws when bits length mismatches dimensions', () => {
    expect(() =>
      validateGrid({ name: 'test', width: 2, height: 2, bits: '101' })
    ).toThrow('bits length 3 !== width(2) × height(2) = 4');
  });
});

describe('gridFromHex', () => {
  it('converts pattern hex to PixelGrid', () => {
    // "AA 55" = 10101010 01010101 = 2×8 checkerboard rows
    const grid = gridFromHex('checker', 8, 'AA 55 AA 55 AA 55 AA 55');
    expect(grid.width).toBe(8);
    expect(grid.height).toBe(8);
    expect(grid.bits.length).toBe(64);
    expect(grid.bits.slice(0, 8)).toBe('10101010'); // 0xAA
    expect(grid.bits.slice(8, 16)).toBe('01010101'); // 0x55
  });
});

describe('mirrorH', () => {
  it('mirrors grid horizontally', () => {
    const grid = bitsToGrid('mirror-test', 4, 2, '10001100');
    const mirrored = mirrorH(grid);
    expect(mirrored.bits).toBe('00010011');
  });
});

describe('mirrorV', () => {
  it('mirrors grid vertically', () => {
    const grid = bitsToGrid('mirror-test', 4, 2, '10001100');
    const mirrored = mirrorV(grid);
    expect(mirrored.bits).toBe('11001000');
  });
});

describe('diffBits', () => {
  it('returns indices of bits that differ', () => {
    const a = '11001100';
    const b = '10011001';
    const diff = diffBits(a, b);
    // positions 1, 2, 5, 7 differ
    expect(diff).toEqual([1, 2, 5, 7]);
  });

  it('returns empty array for identical strings', () => {
    expect(diffBits('1010', '1010')).toEqual([]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: FAIL — modules not found.

**Step 3: Implement core.ts**

```ts
// packages/pixel/src/core.ts
import type { PixelGrid } from './types';

/**
 * Parse a bitstring ("10101010...") into a Uint8Array where each element is 0 or 1.
 * This is the "prepare" step — call once, reuse for rendering.
 */
export function parseBits(bits: string): Uint8Array {
  const arr = new Uint8Array(bits.length);
  for (let i = 0; i < bits.length; i++) {
    const c = bits.charCodeAt(i);
    if (c === 48) arr[i] = 0;      // '0'
    else if (c === 49) arr[i] = 1; // '1'
    else throw new Error(`Invalid bitstring: unexpected '${bits[i]}' at index ${i}`);
  }
  return arr;
}

/** Validate that a PixelGrid's bits length matches width × height. */
export function validateGrid(grid: PixelGrid): void {
  const expected = grid.width * grid.height;
  if (grid.bits.length !== expected) {
    throw new Error(
      `bits length ${grid.bits.length} !== width(${grid.width}) × height(${grid.height}) = ${expected}`
    );
  }
}

/** Convenience: create a PixelGrid with validation. */
export function bitsToGrid(name: string, width: number, height: number, bits: string): PixelGrid {
  const grid: PixelGrid = { name, width, height, bits };
  validateGrid(grid);
  return grid;
}

/**
 * Convert a space-separated hex string (e.g., "AA 55 AA 55 AA 55 AA 55")
 * to a PixelGrid. Each hex byte = one row of 8 bits.
 */
export function gridFromHex(name: string, size: number, hex: string): PixelGrid {
  const bytes = hex.trim().split(/\s+/);
  let bits = '';
  for (const byte of bytes) {
    bits += parseInt(byte, 16).toString(2).padStart(8, '0');
  }
  return bitsToGrid(name, size, size, bits);
}

/** Mirror a grid horizontally (flip left-right). */
export function mirrorH(grid: PixelGrid): PixelGrid {
  const rows: string[] = [];
  for (let y = 0; y < grid.height; y++) {
    const row = grid.bits.slice(y * grid.width, (y + 1) * grid.width);
    rows.push(row.split('').reverse().join(''));
  }
  return { ...grid, name: `${grid.name}-mirrorH`, bits: rows.join('') };
}

/** Mirror a grid vertically (flip top-bottom). */
export function mirrorV(grid: PixelGrid): PixelGrid {
  const rows: string[] = [];
  for (let y = 0; y < grid.height; y++) {
    rows.push(grid.bits.slice(y * grid.width, (y + 1) * grid.width));
  }
  return { ...grid, name: `${grid.name}-mirrorV`, bits: rows.reverse().join('') };
}

/**
 * Return indices where bits differ between two equal-length bitstrings.
 * Used by the transition engine to compute which bits to flip.
 */
export function diffBits(a: string, b: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) result.push(i);
  }
  return result;
}
```

**Step 4: Update index.ts**

Add to exports:
```ts
export {
  parseBits,
  validateGrid,
  bitsToGrid,
  gridFromHex,
  mirrorH,
  mirrorV,
  diffBits,
} from './core';
```

**Step 5: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: All PASS.

**Step 6: Commit**

```bash
git add packages/pixel/src/core.ts packages/pixel/src/__tests__/core.test.ts packages/pixel/src/index.ts
git commit -m "feat(pixel): core bitstring engine — parse, validate, mirror, diff"
```

---

### Task 1.3: Canvas renderer

**Files:**
- Create: `packages/pixel/src/renderer.ts`
- Create: `packages/pixel/src/__tests__/renderer.test.ts`
- Modify: `packages/pixel/src/index.ts`

**Step 1: Write failing tests**

```ts
// packages/pixel/src/__tests__/renderer.test.ts
import { describe, it, expect, vi } from 'vitest';
import { paintGrid, paintTiledGrid, createGridCanvas } from '../renderer';
import { bitsToGrid } from '../core';

// Minimal canvas mock for Node (no real canvas in vitest/jsdom by default)
function mockCanvas(w: number, h: number) {
  const fills: Array<{ x: number; y: number; w: number; h: number }> = [];
  const ctx = {
    fillStyle: '',
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
      fills.push({ x, y, w, h });
    }),
    clearRect: vi.fn(),
    canvas: { width: w, height: h },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills };
}

describe('paintGrid', () => {
  it('calls fillRect for each set bit', () => {
    const grid = bitsToGrid('test', 2, 2, '1010');
    const { ctx, fills } = mockCanvas(2, 2);

    paintGrid(ctx, grid, '#000', 1);

    // Bits: 1(0,0) 0(1,0) 1(0,1) 0(1,1)
    // Should paint pixels at (0,0) and (0,1)
    expect(ctx.fillRect).toHaveBeenCalledTimes(2);
    expect(fills[0]).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(fills[1]).toEqual({ x: 0, y: 1, w: 1, h: 1 });
  });

  it('scales pixels by pixelSize', () => {
    const grid = bitsToGrid('test', 2, 2, '1000');
    const { ctx, fills } = mockCanvas(8, 8);

    paintGrid(ctx, grid, '#f00', 4);

    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(fills[0]).toEqual({ x: 0, y: 0, w: 4, h: 4 });
  });

  it('sets fillStyle to provided color', () => {
    const grid = bitsToGrid('test', 1, 1, '1');
    const { ctx } = mockCanvas(1, 1);

    paintGrid(ctx, grid, 'oklch(0.9 0.1 90)');

    expect(ctx.fillStyle).toBe('oklch(0.9 0.1 90)');
  });
});

describe('paintTiledGrid', () => {
  it('tiles the grid to fill the canvas', () => {
    // 2×2 grid tiled onto 4×4 area at 1px per pixel = 4 tiles
    const grid = bitsToGrid('dot', 2, 2, '1000');
    const { ctx } = mockCanvas(4, 4);

    paintTiledGrid(ctx, grid, '#000', 1, 4, 4);

    // One set bit per tile × 4 tiles = 4 fills
    expect(ctx.fillRect).toHaveBeenCalledTimes(4);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: FAIL — module not found.

**Step 3: Implement renderer.ts**

```ts
// packages/pixel/src/renderer.ts
import type { PixelGrid } from './types';
import { parseBits } from './core';

// Cache parsed bitstrings (keyed by bits string reference)
const cache = new WeakMap<object, Uint8Array>();

function getParsed(grid: PixelGrid): Uint8Array {
  // Use grid object as key if same reference; fall back to parsing
  let parsed = cache.get(grid);
  if (!parsed) {
    parsed = parseBits(grid.bits);
    cache.set(grid, parsed);
  }
  return parsed;
}

/**
 * Paint a PixelGrid onto a canvas context.
 * Each set bit becomes a filled rectangle of `pixelSize` × `pixelSize`.
 */
export function paintGrid(
  ctx: CanvasRenderingContext2D,
  grid: PixelGrid,
  color: string,
  pixelSize: number,
): void {
  const parsed = getParsed(grid);
  ctx.fillStyle = color;
  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i]) {
      const x = (i % grid.width) * pixelSize;
      const y = Math.floor(i / grid.width) * pixelSize;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
}

/**
 * Paint a PixelGrid tiled to fill the given area (in CSS pixels).
 * Used for patterns that repeat (8×8 tiles filling an arbitrary area).
 * IMPORTANT: If ctx has been scaled for DPR, pass the CSS-pixel dimensions
 * (not canvas.width/height which are physical pixels).
 */
export function paintTiledGrid(
  ctx: CanvasRenderingContext2D,
  grid: PixelGrid,
  color: string,
  pixelSize: number,
  cssWidth: number,
  cssHeight: number,
): void {
  const parsed = getParsed(grid);
  const tileW = grid.width * pixelSize;
  const tileH = grid.height * pixelSize;

  ctx.fillStyle = color;
  for (let ty = 0; ty < cssHeight; ty += tileH) {
    for (let tx = 0; tx < cssWidth; tx += tileW) {
      for (let i = 0; i < parsed.length; i++) {
        if (parsed[i]) {
          const px = tx + (i % grid.width) * pixelSize;
          const py = ty + Math.floor(i / grid.width) * pixelSize;
          if (px < cssWidth && py < cssHeight) {
            ctx.fillRect(px, py, pixelSize, pixelSize);
          }
        }
      }
    }
  }
}

/**
 * Create an offscreen canvas with a grid painted on it.
 * Returns the canvas element (can be used as an image source or appended to DOM).
 */
export function createGridCanvas(
  grid: PixelGrid,
  color: string,
  pixelSize: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = grid.width * pixelSize;
  canvas.height = grid.height * pixelSize;
  const ctx = canvas.getContext('2d')!;
  paintGrid(ctx, grid, color, pixelSize);
  return canvas;
}
```

**Step 4: Update index.ts**

Add to exports:
```ts
export { paintGrid, paintTiledGrid, createGridCanvas } from './renderer';
```

**Step 5: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: All PASS.

**Step 6: Commit**

```bash
git add packages/pixel/src/renderer.ts packages/pixel/src/__tests__/renderer.test.ts packages/pixel/src/index.ts
git commit -m "feat(pixel): canvas renderer — paintGrid, paintTiledGrid, createGridCanvas"
```

---

### Task 1.4: SVG renderer + SVG import normalization

**Files:**
- Create: `packages/pixel/src/svg.ts`
- Create: `packages/pixel/src/import.ts`
- Create: `packages/pixel/src/__tests__/svg.test.ts`
- Create: `packages/pixel/src/__tests__/import.test.ts`
- Modify: `packages/pixel/src/index.ts`

**Step 1: Add SVG helpers for static rendering**

Create helpers that convert a `PixelGrid` into stable SVG geometry so `Pattern`, `PixelCorner`, and `PixelIcon` do not each reimplement grid traversal:

```ts
// packages/pixel/src/svg.ts
import type { PixelGrid } from './types';
import { parseBits } from './core';

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function listFilledRects(grid: PixelGrid, pixelSize = 1): PixelRect[] {
  const bits = parseBits(grid.bits);
  const rects: PixelRect[] = [];
  for (let i = 0; i < bits.length; i++) {
    if (!bits[i]) continue;
    rects.push({
      x: (i % grid.width) * pixelSize,
      y: Math.floor(i / grid.width) * pixelSize,
      width: pixelSize,
      height: pixelSize,
    });
  }
  return rects;
}
```

**Step 2: Add SVG import + normalization primitives**

The importer must accept rectilinear source art, snap coordinates to a lattice, reject unsupported curves, and emit a report for outliers instead of silently mangling them:

```ts
// packages/pixel/src/import.ts
import type { PixelGrid } from './types';

export interface ImportOptions {
  size: number;
  snapStep?: 1 | 0.5;
}

export interface ImportReport {
  snappedValues: number;
  offGridValues: number[];
  hadCurves: boolean;
  hadDiagonalSegments: boolean;
}

export function svgToGrid(
  name: string,
  svg: string,
  options: ImportOptions,
): { grid: PixelGrid; report: ImportReport } {
  // Parse only rectilinear source art. Snap axis-aligned coordinates to the requested
  // lattice and return an outlier report if values cannot be normalized cleanly.
}
```

**Step 3: Write tests with repo-local fixtures**

- Add tiny rectilinear fixtures under `packages/pixel/src/__tests__/fixtures/`
- Cover: SVG rect extraction, `currentColor`-friendly static rendering, 16px integer-grid import, 24px half-step normalization, and rejection/reporting of unsupported inputs

**Step 4: Export helpers**

Add to `packages/pixel/src/index.ts`:

```ts
export { listFilledRects } from './svg';
export { svgToGrid, type ImportOptions, type ImportReport } from './import';
```

**Step 5: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: All PASS.

**Step 6: Commit**

```bash
git add packages/pixel/src/svg.ts packages/pixel/src/import.ts packages/pixel/src/__tests__/svg.test.ts packages/pixel/src/__tests__/import.test.ts packages/pixel/src/index.ts
git commit -m "feat(pixel): add SVG renderer helpers and rectilinear SVG import pipeline"
```

---

## Phase 2: Transition Engine

### Task 2.1: Bit-flip transition system

**Files:**
- Create: `packages/pixel/src/transition.ts`
- Create: `packages/pixel/src/__tests__/transition.test.ts`
- Modify: `packages/pixel/src/index.ts`

**Step 1: Write failing tests**

```ts
// packages/pixel/src/__tests__/transition.test.ts
import { describe, it, expect } from 'vitest';
import { computeFlipOrder, interpolateFrame } from '../transition';

describe('computeFlipOrder', () => {
  it('returns diff indices in random order for "random" mode', () => {
    const from = '11001100';
    const to   = '00110011';
    const order = computeFlipOrder(from, to, 'random', 4, 2);
    // All 8 bits differ, so all indices should appear
    expect(order.sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('returns diff indices sorted by distance from center for "radial" mode', () => {
    const from = '10000001';
    const to   = '01111110';
    const order = computeFlipOrder(from, to, 'radial', 8, 1);
    // All 8 bits differ. Center is at x=3.5
    // Indices closest to center should come first
    expect(order[0]).toBe(3); // or 4 — both are nearest center
    expect(order[order.length - 1]).toBe(0); // or 7 — edges are last
  });

  it('returns diff indices top-to-bottom for "scanline" mode', () => {
    const from = '1111';
    const to   = '0000';
    const order = computeFlipOrder(from, to, 'scanline', 2, 2);
    // row 0: indices 0,1; row 1: indices 2,3
    expect(order).toEqual([0, 1, 2, 3]);
  });

  it('returns empty array when grids are identical', () => {
    expect(computeFlipOrder('1010', '1010', 'random', 2, 2)).toEqual([]);
  });
});

describe('interpolateFrame', () => {
  it('returns from-grid at progress 0', () => {
    const from = '11110000';
    const to   = '00001111';
    const order = [0, 1, 2, 3, 4, 5, 6, 7];
    expect(interpolateFrame(from, to, order, 0)).toBe('11110000');
  });

  it('returns to-grid at progress 1', () => {
    const from = '11110000';
    const to   = '00001111';
    const order = [0, 1, 2, 3, 4, 5, 6, 7];
    expect(interpolateFrame(from, to, order, 1)).toBe('00001111');
  });

  it('flips half the bits at progress 0.5', () => {
    const from = '11110000';
    const to   = '00001111';
    // Order: flip indices 0,1,2,3 first, then 4,5,6,7
    const order = [0, 1, 2, 3, 4, 5, 6, 7];
    const frame = interpolateFrame(from, to, order, 0.5);
    // First 4 in order flipped: indices 0-3 become to-values (0),
    // indices 4-7 stay from-values (0)
    expect(frame).toBe('00000000');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: FAIL.

**Step 3: Implement transition.ts**

```ts
// packages/pixel/src/transition.ts
import type { TransitionMode } from './types';
import { diffBits } from './core';

/**
 * Compute the order in which differing bits should be flipped
 * when transitioning from one bitstring to another.
 */
export function computeFlipOrder(
  from: string,
  to: string,
  mode: TransitionMode,
  width: number,
  height: number,
): number[] {
  const diffs = diffBits(from, to);
  if (diffs.length === 0) return [];

  switch (mode) {
    case 'scanline':
      // Already in index order = top-to-bottom, left-to-right
      return diffs;

    case 'radial': {
      const cx = (width - 1) / 2;
      const cy = (height - 1) / 2;
      return diffs.sort((a, b) => {
        const ax = a % width, ay = Math.floor(a / width);
        const bx = b % width, by = Math.floor(b / width);
        const da = (ax - cx) ** 2 + (ay - cy) ** 2;
        const db = (bx - cx) ** 2 + (by - cy) ** 2;
        return da - db;
      });
    }

    case 'scatter': {
      // Spread bits evenly — interleave from sparse positions
      const sorted = [...diffs].sort((a, b) => {
        const ay = Math.floor(a / width), by = Math.floor(b / width);
        if (ay !== by) return ay - by;
        return (a % width) - (b % width);
      });
      // Take every Nth element to spread spatially
      const result: number[] = [];
      const step = Math.max(2, Math.floor(sorted.length / 8));
      for (let offset = 0; offset < step; offset++) {
        for (let i = offset; i < sorted.length; i += step) {
          result.push(sorted[i]);
        }
      }
      return result;
    }

    case 'random':
    default: {
      // Fisher-Yates shuffle
      const arr = [...diffs];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
  }
}

/**
 * Generate an intermediate frame at a given progress (0–1).
 * Flips bits in the order specified by `flipOrder`.
 */
export function interpolateFrame(
  from: string,
  to: string,
  flipOrder: number[],
  progress: number,
): string {
  if (progress <= 0) return from;
  if (progress >= 1) return to;

  const flipsToApply = Math.round(flipOrder.length * progress);
  const frame = from.split('');

  for (let i = 0; i < flipsToApply; i++) {
    const idx = flipOrder[i];
    frame[idx] = to[idx];
  }

  return frame.join('');
}

/**
 * Run a transition animation, calling `onFrame` with each intermediate bitstring.
 * Returns a cancel function.
 */
export function animateTransition(
  from: string,
  to: string,
  flipOrder: number[],
  duration: number,
  onFrame: (bits: string) => void,
): () => void {
  let startTime: number | null = null;
  let rafId: number;
  let cancelled = false;

  function tick(timestamp: number) {
    if (cancelled) return;
    if (startTime === null) startTime = timestamp;

    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    onFrame(interpolateFrame(from, to, flipOrder, progress));

    if (progress < 1) {
      rafId = requestAnimationFrame(tick);
    }
  }

  rafId = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
```

**Step 4: Update index.ts**

Add to exports:
```ts
export { computeFlipOrder, interpolateFrame, animateTransition } from './transition';
```

**Step 5: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: All PASS.

**Step 6: Commit**

```bash
git add packages/pixel/src/transition.ts packages/pixel/src/__tests__/transition.test.ts packages/pixel/src/index.ts
git commit -m "feat(pixel): transition engine — computeFlipOrder, interpolateFrame, animateTransition"
```

---

## Phase 3: Corner Overlay System

### Task 3.1: Corner positioning + mirroring logic

**Files:**
- Create: `packages/pixel/src/corners.ts`
- Create: `packages/pixel/src/__tests__/corners.test.ts`
- Modify: `packages/pixel/src/index.ts`

**Step 1: Write failing tests**

```ts
// packages/pixel/src/__tests__/corners.test.ts
import { describe, it, expect } from 'vitest';
import { mirrorForCorner, getCornerStyle } from '../corners';
import { bitsToGrid } from '../core';

describe('mirrorForCorner', () => {
  // A 3×3 top-left corner:
  //   1 1 0
  //   1 0 0
  //   0 0 0
  const tl = bitsToGrid('corner-tl', 3, 3, '110100000');

  it('returns original for tl', () => {
    expect(mirrorForCorner(tl, 'tl').bits).toBe('110100000');
  });

  it('mirrors horizontally for tr', () => {
    // Expected:
    //   0 1 1
    //   0 0 1
    //   0 0 0
    expect(mirrorForCorner(tl, 'tr').bits).toBe('011001000');
  });

  it('mirrors vertically for bl', () => {
    // Expected:
    //   0 0 0
    //   1 0 0
    //   1 1 0
    expect(mirrorForCorner(tl, 'bl').bits).toBe('000100110');
  });

  it('mirrors both for br', () => {
    // Expected:
    //   0 0 0
    //   0 0 1
    //   0 1 1
    expect(mirrorForCorner(tl, 'br').bits).toBe('000001011');
  });
});

describe('getCornerStyle', () => {
  it('returns correct absolute positioning for tl', () => {
    const style = getCornerStyle('tl', 4, 2);
    expect(style).toEqual({ position: 'absolute', top: 0, left: 0, width: 8, height: 8 });
  });

  it('returns correct positioning for br', () => {
    const style = getCornerStyle('br', 4, 2);
    expect(style).toEqual({ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8 });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: FAIL.

**Step 3: Implement corners.ts**

```ts
// packages/pixel/src/corners.ts
import type { PixelGrid, CornerPosition } from './types';
import { mirrorH, mirrorV } from './core';

/**
 * Derive a corner grid for a given position from a top-left source.
 * tl = original, tr = mirrorH, bl = mirrorV, br = mirrorH + mirrorV.
 */
export function mirrorForCorner(tl: PixelGrid, position: CornerPosition): PixelGrid {
  switch (position) {
    case 'tl': return tl;
    case 'tr': return mirrorH(tl);
    case 'bl': return mirrorV(tl);
    case 'br': return mirrorH(mirrorV(tl));
  }
}

/**
 * Get the CSS positioning style for a corner overlay.
 * @param position — which corner
 * @param gridSize — grid width/height in pixels (e.g., 8 for an 8×8 corner)
 * @param pixelSize — render scale (e.g., 2 = each grid pixel is 2×2 CSS pixels)
 */
export function getCornerStyle(
  position: CornerPosition,
  gridSize: number,
  pixelSize: number,
): Record<string, string | number> {
  const size = gridSize * pixelSize;
  const base: Record<string, string | number> = {
    position: 'absolute',
    width: size,
    height: size,
  };

  switch (position) {
    case 'tl': return { ...base, top: 0, left: 0 };
    case 'tr': return { ...base, top: 0, right: 0 };
    case 'bl': return { ...base, bottom: 0, left: 0 };
    case 'br': return { ...base, bottom: 0, right: 0 };
  }
}

/** All four corner positions. */
export const CORNER_POSITIONS: CornerPosition[] = ['tl', 'tr', 'bl', 'br'];
```

**Step 4: Update index.ts**

Add to exports:
```ts
export { mirrorForCorner, getCornerStyle, CORNER_POSITIONS } from './corners';
```

**Step 5: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: All PASS.

**Step 6: Commit**

```bash
git add packages/pixel/src/corners.ts packages/pixel/src/__tests__/corners.test.ts packages/pixel/src/index.ts
git commit -m "feat(pixel): corner overlay system — mirrorForCorner, getCornerStyle"
```

---

## Phase 4: Pattern Migration

### Task 4.1: Hex-to-bitstring conversion script

**Files:**
- Create: `packages/pixel/scripts/convert-patterns.ts`

This script reads the existing `packages/radiants/patterns/registry.ts` hex values and outputs bitstring equivalents.

**Step 1: Write the conversion script**

```ts
// packages/pixel/scripts/convert-patterns.ts
/**
 * Run with: npx tsx packages/pixel/scripts/convert-patterns.ts
 *
 * Reads the existing radiants pattern registry (hex format)
 * and outputs each pattern as a bitstring PixelGrid entry.
 */

// Inline the pattern data (copy from radiants/patterns/registry.ts)
// so this script has zero import dependencies.
const HEX_PATTERNS = [
  { name: 'solid', hex: 'FF FF FF FF FF FF FF FF' },
  { name: 'empty', hex: '00 00 00 00 00 00 00 00' },
  { name: 'checkerboard', hex: 'AA 55 AA 55 AA 55 AA 55' },
  // ... (all 51 — import programmatically or paste from registry)
];

function hexToBitstring(hex: string): string {
  return hex
    .trim()
    .split(/\s+/)
    .map((byte) => parseInt(byte, 16).toString(2).padStart(8, '0'))
    .join('');
}

for (const p of HEX_PATTERNS) {
  const bits = hexToBitstring(p.hex);
  console.log(`  { name: '${p.name}', width: 8, height: 8, bits: '${bits}' },`);
}
```

**Important:** Before running, copy the full 51-pattern array from `packages/radiants/patterns/registry.ts` into the `HEX_PATTERNS` array, extracting just `name` and `hex` fields.

**Step 2: Run conversion**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && npx tsx packages/pixel/scripts/convert-patterns.ts`
Expected: 51 lines of bitstring pattern entries printed to stdout.

**Step 3: Commit**

```bash
git add packages/pixel/scripts/convert-patterns.ts
git commit -m "chore(pixel): hex-to-bitstring conversion script for patterns"
```

---

### Task 4.2: Pattern registry in bitstring format

**Files:**
- Create: `packages/pixel/src/patterns.ts`
- Create: `packages/pixel/src/__tests__/patterns.test.ts`
- Modify: `packages/pixel/src/index.ts`

**Step 1: Write failing tests**

```ts
// packages/pixel/src/__tests__/patterns.test.ts
import { describe, it, expect } from 'vitest';
import { PATTERN_REGISTRY, getPattern } from '../patterns';

describe('PATTERN_REGISTRY', () => {
  it('contains 51 patterns', () => {
    expect(PATTERN_REGISTRY.length).toBe(51);
  });

  it('each pattern has bits matching width × height', () => {
    for (const p of PATTERN_REGISTRY) {
      expect(p.bits.length).toBe(p.width * p.height);
    }
  });

  it('each pattern is 8×8', () => {
    for (const p of PATTERN_REGISTRY) {
      expect(p.width).toBe(8);
      expect(p.height).toBe(8);
    }
  });

  it('solid pattern is all 1s', () => {
    const solid = getPattern('solid');
    expect(solid).toBeDefined();
    expect(solid!.bits).toBe('1'.repeat(64));
  });

  it('empty pattern is all 0s', () => {
    const empty = getPattern('empty');
    expect(empty).toBeDefined();
    expect(empty!.bits).toBe('0'.repeat(64));
  });

  it('checkerboard alternates correctly', () => {
    const cb = getPattern('checkerboard');
    expect(cb).toBeDefined();
    // Row 0: 10101010 (0xAA), Row 1: 01010101 (0x55)
    expect(cb!.bits.slice(0, 8)).toBe('10101010');
    expect(cb!.bits.slice(8, 16)).toBe('01010101');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: FAIL.

**Step 3: Create patterns.ts**

Populate with output from the conversion script (Task 4.1). Structure:

```ts
// packages/pixel/src/patterns.ts
import type { PixelGrid } from './types';

export const PATTERN_REGISTRY: PixelGrid[] = [
  // -- Structural --
  { name: 'solid', width: 8, height: 8, bits: '1111111111111111111111111111111111111111111111111111111111111111' },
  { name: 'empty', width: 8, height: 8, bits: '0000000000000000000000000000000000000000000000000000000000000000' },
  { name: 'checkerboard', width: 8, height: 8, bits: '1010101001010101101010100101010110101010010101011010101001010101' },
  // ... all 51 patterns from conversion script output
];

/** Look up a pattern by name. */
export function getPattern(name: string): PixelGrid | undefined {
  return PATTERN_REGISTRY.find((p) => p.name === name);
}

/** All pattern names (typed union). */
export type PatternName = (typeof PATTERN_REGISTRY)[number]['name'];
```

**Step 4: Update index.ts**

Add to exports:
```ts
export { PATTERN_REGISTRY, getPattern, type PatternName } from './patterns';
```

**Step 5: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/pixel test`
Expected: All PASS.

**Step 6: Commit**

```bash
git add packages/pixel/src/patterns.ts packages/pixel/src/__tests__/patterns.test.ts packages/pixel/src/index.ts
git commit -m "feat(pixel): 51 patterns migrated to bitstring registry"
```

---

### Task 4.3: Rewrite Pattern component to SVG

**Files:**
- Modify: `packages/radiants/components/core/Pattern/Pattern.tsx`
- Modify: `packages/radiants/package.json` (add `@rdna/pixel` dependency)

**Step 1: Add @rdna/pixel dependency to radiants**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/radiants add @rdna/pixel@workspace:*`

**Step 2: Rewrite Pattern.tsx**

Replace the CSS-mask implementation with an inline SVG layer. Static pattern rendering should stay declarative so CSS variables, `bg`, SSR, and theme toggles work without imperative repaints.

```tsx
// packages/radiants/components/core/Pattern/Pattern.tsx
'use client';

import React, { useId } from 'react';
import { getPattern, listFilledRects } from '@rdna/pixel';

export interface PatternProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pattern name from the registry */
  pat: string;
  /** Foreground color — any CSS color value. Defaults to var(--color-main) */
  color?: string;
  /** Background color behind the pattern. Defaults to transparent */
  bg?: string;
  /** Scale multiplier: 1 = 1px per grid pixel, 2 = 2px, etc. */
  scale?: 1 | 2 | 3 | 4;
  /** If true, tile the pattern to fill the container. Default: true. */
  tiled?: boolean;
}

export function Pattern({
  pat,
  color,
  bg,
  scale = 1,
  tiled = true,
  className = '',
  style,
  children,
  ...rest
}: PatternProps) {
  const grid = getPattern(pat);
  const patternId = useId().replace(/:/g, '_');
  if (!grid) return null;

  const rects = listFilledRects(grid, scale);
  const tileWidth = grid.width * scale;
  const tileHeight = grid.height * scale;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        backgroundColor: bg,
        ...style,
      }}
      {...rest}
    >
      <svg
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          color: color ?? 'var(--color-main)',
          zIndex: 0,
        }}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={patternId}
            width={tileWidth}
            height={tileHeight}
            patternUnits="userSpaceOnUse"
          >
            {rects.map((rect) => (
              <rect
                key={`${rect.x}-${rect.y}`}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill="currentColor"
              />
            ))}
          </pattern>
        </defs>
        {tiled ? (
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        ) : (
          rects.map((rect) => (
            <rect
              key={`single-${rect.x}-${rect.y}`}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill="currentColor"
            />
          ))
        )}
      </svg>
      {children && (
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      )}
    </div>
  );
}
```

**Step 3: Verify existing Pattern consumers still work**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm dev`

Manually check that `<Pattern pat="checkerboard" />` renders visibly, `bg` remains intact, and a theme toggle updates pattern color live. The API stays the same (`pat`, `color`, `bg`, `scale`), so consumers should not need changes.

**Step 4: Commit**

```bash
git add packages/radiants/components/core/Pattern/Pattern.tsx packages/radiants/package.json pnpm-lock.yaml
git commit -m "feat(Pattern): rewrite to SVG renderer via @rdna/pixel"
```

---

## Phase 5: Pixel Corner Migration

### Pixel Icon Scope (in scope for this plan)

- **16px canonical source art:** `/Users/rivermassey/Dropbox/_cronus_icons` contains 143 SVGs that are rectilinear, monochrome, and integer-grid-authored. Treat this as the import source for the 16px pixel-icon family.
- **Current repo 16px set mismatch:** `packages/radiants/assets/icons/16px/` does not exactly match the Dropbox names. Build an alias/exception manifest instead of blocking migration on perfect file-name parity.
- **24px repo source is also viable:** `packages/radiants/assets/icons/24px/` contains 662 monochrome rectilinear SVGs. `660/662` snap cleanly to a 0.5 lattice; import them mechanically after normalization and track the two outliers in an outlier manifest.
- **Conclusion:** icon migration is back in scope. Do not prototype with 1-5 icons only. Build the importer first, then migrate the compatible 16px and 24px sets to canonical grid data.



### Task 5.1: Corner art bitstrings

**Files:**
- Create: `packages/pixel/src/corner-sets.ts`
- Create: `packages/pixel/src/__tests__/corner-sets.test.ts`

The corner shapes will be stored as bitstrings, but the initial source of truth is the existing `pixel-corners.config.mjs` semantics, not loose approximations. Generate top-left cover/border grids from the current profiles, then add hand-authored overrides only where direct conversion is insufficient. Preserve compound variants such as `pixel-rounded-t-sm`, `pixel-rounded-l-sm`, `pixel-rounded-t-sm-b-md`, and `sm-notl` via per-corner size maps and omitted-corner metadata.

**Step 1: Derive initial corner art from existing config**

Read the existing `pixel-corners.config.mjs` profiles. Each profile has a `points` array defining the top-left corner staircase. Convert these coordinate points to a filled bitstring on a grid.

For example, the `sm` profile (radius 4px, points `[[0,5],[1,5],[1,3],[2,3],[2,2],[3,2],[3,1],[5,1],[5,0]]`) defines a 5×5 corner where the staircase path fills certain pixels. The grid should be `5×5` and the bitstring represents which pixels are the "cover" layer (bg-colored) and which are the "border" layer.

**Cover layer** (bg-colored, hides smooth corner): pixels outside the staircase curve.
**Border layer** (border-colored): the 1px staircase edge itself.

```ts
// packages/pixel/src/corner-sets.ts
import type { PixelGrid, PixelCornerSet } from './types';

/**
 * Corner sets derived from existing pixel-corners.config.mjs profiles.
 * These are the top-left corners — other positions derived by mirroring.
 *
 * Grid convention: 1 = opaque pixel (drawn), 0 = transparent (shows element below).
 * The "cover" grid is drawn in cornerBg color to hide the smooth CSS border-radius.
 * The "border" grid is drawn in border color for the 1px staircase edge.
 */

// xs: 2px radius — 2×2 grid
const XS_COVER: PixelGrid = {
  name: 'corner-xs-cover', width: 2, height: 2,
  bits: '10'
      + '00',
};
const XS_BORDER: PixelGrid = {
  name: 'corner-xs-border', width: 2, height: 2,
  bits: '01'
      + '10',
};

// sm: 4px radius — 5×5 grid
const SM_COVER: PixelGrid = {
  name: 'corner-sm-cover', width: 5, height: 5,
  bits: '11100'
      + '10000'
      + '10000'
      + '00000'
      + '00000',
};
const SM_BORDER: PixelGrid = {
  name: 'corner-sm-border', width: 5, height: 5,
  bits: '00011'
      + '01000'
      + '01000'
      + '10000'
      + '10000',
};

// md: 6px radius — 9×9 grid
const MD_COVER: PixelGrid = {
  name: 'corner-md-cover', width: 9, height: 9,
  bits: '111111100'
      + '111110000'
      + '110000000'
      + '110000000'
      + '100000000'
      + '100000000'
      + '000000000'
      + '000000000'
      + '000000000',
};
const MD_BORDER: PixelGrid = {
  name: 'corner-md-border', width: 9, height: 9,
  bits: '000000011'
      + '000001000'
      + '001000000'
      + '001000000'
      + '010000000'
      + '010000000'
      + '100000000'
      + '100000000'
      + '100000000',
};

// lg: 8px radius — 12×12 grid
const LG_COVER: PixelGrid = {
  name: 'corner-lg-cover', width: 12, height: 12,
  bits: '111111111100'
      + '111111110000'
      + '111111000000'
      + '111110000000'
      + '111000000000'
      + '111000000000'
      + '110000000000'
      + '100000000000'
      + '100000000000'
      + '000000000000'
      + '000000000000'
      + '000000000000',
};
const LG_BORDER: PixelGrid = {
  name: 'corner-lg-border', width: 12, height: 12,
  bits: '000000000011'
      + '000000001000'
      + '000001000000'
      + '000001000000'
      + '000100000000'
      + '000100000000'
      + '001000000000'
      + '010000000000'
      + '010000000000'
      + '100000000000'
      + '100000000000'
      + '100000000000',
};

// xl: 16px radius — will be drawn in dotting editor, placeholder for now
const XL_COVER: PixelGrid = {
  name: 'corner-xl-cover', width: 16, height: 16,
  bits: '0'.repeat(256), // TODO: draw in dotting editor
};
const XL_BORDER: PixelGrid = {
  name: 'corner-xl-border', width: 16, height: 16,
  bits: '0'.repeat(256), // TODO: draw in dotting editor
};

export const CORNER_SETS: Record<string, PixelCornerSet> = {
  xs: { name: 'xs', tl: XS_COVER, border: XS_BORDER },
  sm: { name: 'sm', tl: SM_COVER, border: SM_BORDER },
  md: { name: 'md', tl: MD_COVER, border: MD_BORDER },
  lg: { name: 'lg', tl: LG_COVER, border: LG_BORDER },
  xl: { name: 'xl', tl: XL_COVER, border: XL_BORDER },
};

export function getCornerSet(size: string): PixelCornerSet | undefined {
  return CORNER_SETS[size];
}
```

**Note:** These bitstrings are initial approximations. The user will refine them by drawing in the dotting editor. The grid sizes (2×2, 5×5, 9×9, 12×12, 16×16) are derived from the existing config `radius` values.

**Step 2: Write tests**

```ts
// packages/pixel/src/__tests__/corner-sets.test.ts
import { describe, it, expect } from 'vitest';
import { CORNER_SETS, getCornerSet } from '../corner-sets';
import { validateGrid } from '../core';

describe('CORNER_SETS', () => {
  it('has 5 sizes', () => {
    expect(Object.keys(CORNER_SETS)).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
  });

  it('each cover grid has valid dimensions', () => {
    for (const set of Object.values(CORNER_SETS)) {
      expect(() => validateGrid(set.tl)).not.toThrow();
    }
  });

  it('each border grid matches cover grid dimensions', () => {
    for (const set of Object.values(CORNER_SETS)) {
      if (set.border) {
        expect(set.border.width).toBe(set.tl.width);
        expect(set.border.height).toBe(set.tl.height);
      }
    }
  });

  it('sm cover has expected shape', () => {
    const sm = getCornerSet('sm');
    expect(sm).toBeDefined();
    // Top-left 5×5, row 0 should have cover pixels in upper-left
    expect(sm!.tl.bits.slice(0, 5)).toBe('11100');
  });
});
```

**Step 3: Run tests, commit**

```bash
git add packages/pixel/src/corner-sets.ts packages/pixel/src/__tests__/corner-sets.test.ts
git commit -m "feat(pixel): corner art bitstrings for xs/sm/md/lg (xl placeholder)"
```

---

### Task 5.2: PixelCorner React component

**Files:**
- Create: `packages/radiants/components/core/PixelCorner/PixelCorner.tsx`
- Create: `packages/radiants/components/core/PixelCorner/index.ts`

**Step 1: Write the component**

```tsx
// packages/radiants/components/core/PixelCorner/PixelCorner.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import {
  getCornerSet,
  mirrorForCorner,
  CORNER_POSITIONS,
  type CornerPosition,
  type PixelGrid,
} from '@rdna/pixel';

export type CornerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CornerSpec = CornerSize | 'square';

export interface PixelCornerProps {
  /** Corner size — single size for all corners, or record for mixed/omitted corners */
  size: CornerSize | Partial<Record<CornerPosition, CornerSpec>>;
  /**
   * Background color behind the element — used to paint the cover layer
   * that hides the smooth CSS border-radius.
   * Defaults to 'var(--color-page)'.
   */
  cornerBg?: string;
  /** Border color for the pixel staircase edge. Defaults to 'var(--color-line)'. */
  borderColor?: string;
  /** Render scale — pixels per grid cell. Default 1. */
  pixelSize?: number;
  /** Which corners to render. Default: all four. */
  corners?: CornerPosition[];
}

/**
 * Renders up to 4 small SVG elements positioned at each corner of the parent.
 * Parent MUST have `position: relative` (or absolute/fixed).
 *
 * Usage:
 *   <div className="relative rounded-md border border-line shadow-md">
 *     <PixelCorner size="md" />
 *     {children}
 *   </div>
 */
export function PixelCorner({
  size,
  cornerBg = 'var(--color-page)',
  borderColor = 'var(--color-line)',
  pixelSize = 1,
  corners = CORNER_POSITIONS,
}: PixelCornerProps) {
  function renderGrid(grid: PixelGrid, fill: string) {
    return grid.bits.split('').map((bit, i) => {
      if (bit !== '1') return null;
      const x = (i % grid.width) * pixelSize;
      const y = Math.floor(i / grid.width) * pixelSize;
      return (
        <rect
          key={`${fill}-${x}-${y}`}
          x={x}
          y={y}
          width={pixelSize}
          height={pixelSize}
          style={{ fill }}
        />
      );
    });
  }

  function sizeForCorner(pos: CornerPosition): CornerSpec {
    return typeof size === 'string' ? size : size[pos] ?? 'square';
  }

  return (
    <div aria-hidden>
      {corners.map((pos) => {
        const resolvedSize = sizeForCorner(pos);
        if (resolvedSize === 'square') return null;

        const set = getCornerSet(resolvedSize);
        if (!set) return null;

        const coverGrid = mirrorForCorner(set.tl, pos);
        const borderGrid = set.border ? mirrorForCorner(set.border, pos) : null;
        const cssSize = coverGrid.width * pixelSize;

        return (
          <svg
            key={pos}
            viewBox={`0 0 ${cssSize} ${cssSize}`}
            style={{
              position: 'absolute',
              [pos.includes('t') ? 'top' : 'bottom']: 0,
              [pos.includes('l') ? 'left' : 'right']: 0,
              width: cssSize,
              height: cssSize,
              pointerEvents: 'none',
              overflow: 'visible',
              zIndex: 1,
            }}
          >
            {renderGrid(coverGrid, cornerBg)}
            {borderGrid ? renderGrid(borderGrid, borderColor) : null}
          </svg>
        );
      })}
    </div>
  );
}
```

**Step 2: Create index.ts barrel**

```ts
// packages/radiants/components/core/PixelCorner/index.ts
export { PixelCorner, type PixelCornerProps } from './PixelCorner';
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/PixelCorner/
git commit -m "feat(PixelCorner): SVG overlay component replacing clip-path corners"
```

---

### Task 5.3: Migrate AppWindow from clip-path to PixelCorner

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

This is the highest-value migration — AppWindow is the primary consumer with the most clip-path pain (position override hacks, shadow restrictions).

Preserve the existing mixed-corner semantics during migration. Do not flatten `pixel-rounded-t-sm`, `pixel-rounded-l-sm`, or `pixel-rounded-t-sm-b-md` into a single uniform size.

**Step 1: Read the current AppWindow implementation**

Read `packages/radiants/components/core/AppWindow/AppWindow.tsx`, specifically:
- Line ~996: the `pixel-rounded-md` class usage
- Line ~917: any other `pixel-rounded` usages
- The inline `style={{ position: 'absolute' }}` override

**Step 2: Replace pixel-rounded classes**

In the main window container (line ~996):
- Remove `pixel-rounded-md` from className
- Add `rounded-md` (standard CSS border-radius as the base)
- Add `<PixelCorner size="md" />` as a child
- Remove the inline `style={{ position: 'absolute' }}` override (no longer needed — `position: absolute` now works naturally)
- Replace `pixel-shadow-*` with standard `shadow-*` classes (since `box-shadow` now works)

**Step 3: Verify visually**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm dev`
Open RadOS, check that windows have pixel corners, can be dragged, and have shadows.

**Step 4: Commit**

```bash
git add packages/radiants/components/core/AppWindow/AppWindow.tsx
git commit -m "refactor(AppWindow): migrate from clip-path to PixelCorner overlay"
```

---

### Task 5.4: Migrate remaining pixel-rounded consumers

**Files to modify (grouped by priority):**

**Batch 1 — Core components (packages/radiants/components/core/):**
- `Button/Button.tsx` (lines 93-97) — 5 size variants
- `Card/Card.tsx` (lines 38-40) — 3 variants
- `Badge/Badge.tsx` (line 11)
- `Tabs/Tabs.tsx` (lines 101, 159, 185, 215, 354, 376)
- `Dialog/Dialog.tsx` (line 121)
- `AlertDialog/AlertDialog.tsx` (line 119)

**Batch 2 — Form components:**
- `Input/Input.tsx` (lines 265, 325)
- `Select/Select.tsx` (lines 84, 199)
- `Switch/Switch.tsx` (lines 35, 107)
- `Checkbox/Checkbox.tsx` (line 150)
- `Slider/Slider.tsx` (lines 74-75, 132)
- `NumberField/NumberField.tsx` (line 178)
- `Combobox/Combobox.tsx` (lines 124, 134, 195)

**Batch 3 — Menu/navigation components:**
- `Menubar/Menubar.tsx` (lines 85, 145)
- `NavigationMenu/NavigationMenu.tsx` (lines 158, 208, 236)
- `ContextMenu/ContextMenu.tsx` (line 72)
- `DropdownMenu/DropdownMenu.tsx` (line 129)
- `Popover/Popover.tsx` (line 129)
- `Toolbar/Toolbar.tsx` (lines 65, 95, 123)

**Batch 4 — Misc components + apps:**
- `Avatar/Avatar.tsx` (line 22)
- `Collapsible/Collapsible.tsx` (lines 86, 123)
- `ToggleGroup/ToggleGroup.tsx` (line 68)
- `Meter/Meter.tsx` (line 32)
- `CountdownTimer/CountdownTimer.tsx` (lines 49-51, 84)
- `PreviewCard/PreviewCard.tsx` (line 103)
- `InputSet/InputSet.tsx` (line 35)

**Batch 5 — App-level consumers (apps/rad-os/):**
- `BrandAssetsApp.tsx` (8 usages)
- `DesignSystemTab.tsx` (3 usages)
- `PatternsTab.tsx` (5 usages)
- `StartMenu.tsx` (1 usage)
- `GoodNewsApp.tsx` — raw `rdna-pat` CSS consumer, NOT `<Pattern>`, needs full rewrite to the new SVG-backed Pattern surface

**Batch 6 — Playground + templates (missed in original plan):**
- `typography-playground/UsageGuide.tsx` (lines 26, 47)
- `typography-playground/TypeManual.tsx` (lines 62, 190, 250)
- `typography-playground/TypeStyles.tsx` (line 361)
- `pattern-playground/PatternCodeOutput.tsx` (line 50)
- `pattern-playground/PatternPreview.tsx` (lines 59-60, 64-65)
- `pattern-playground/PatternGridPicker.tsx` (line 53)
- `templates/rados-app-prototype/components/StartMenu.tsx` (line 76 — also uses `pixel-shadow-floating`)

**Batch 7 — `pixel-shadow-*` migration (20+ consumers):**

`pixel-shadow-*` classes are defined in `pixel-corners.css` (which gets deleted in cleanup). All consumers must migrate to standard `shadow-*` or `drop-shadow-*` BEFORE deletion. Grep for `pixel-shadow-` across all `.tsx` files and migrate each to the appropriate standard shadow class.

**Note on `overflow-hidden` conflict:** `UsageGuide.tsx` line 26 uses `pixel-rounded-sm overflow-hidden` together. Under the overlay system, `overflow-hidden` on the parent would clip the corner SVGs. Either remove `overflow-hidden` or add `overflow-visible` on the PixelCorner container.

**Note on small elements:** Elements with xs corners on components under 48px (Badge, Checkbox, Switch, Slider thumb) should use standard `rounded-xs` or `rounded-sm` instead of PixelCorner — 4 overlay SVGs for 2×2 pixels is disproportionate overhead.

**Migration pattern for each file:**

For components that are wrappers (Card, Dialog, etc.) where PixelCorner makes sense as a child:
```tsx
// Before:
<div className="pixel-rounded-sm bg-card ...">

// After:
<div className="relative rounded-sm border border-line bg-card ...">
  <PixelCorner size="sm" cornerBg="var(--color-page)" />
```

For small inline elements (Badge, Checkbox, etc.) where 4 extra overlay SVGs per instance is wasteful, consider whether the element needs pixel corners at all or can use standard `rounded-*`.

**Step 1: Migrate Batch 1 (core components)**

Work through each file, replacing `pixel-rounded-*` → `rounded-* + <PixelCorner>`.

**Step 2: Run lint + dev server to verify**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm lint && pnpm dev`

**Step 3: Commit per batch**

```bash
git commit -m "refactor(core): migrate Button, Card, Badge, Tabs, Dialog to PixelCorner"
git commit -m "refactor(forms): migrate Input, Select, Switch, Checkbox, Slider to PixelCorner"
git commit -m "refactor(menus): migrate Menubar, NavigationMenu, ContextMenu, Popover to PixelCorner"
git commit -m "refactor(misc): migrate Avatar, Collapsible, ToggleGroup, Meter to PixelCorner"
git commit -m "refactor(rad-os): migrate app-level pixel-rounded consumers to PixelCorner"
```

---

## Phase 6: PixelTransition Component

### Task 6.1: PixelTransition React component

**Files:**
- Create: `packages/radiants/components/core/PixelTransition/PixelTransition.tsx`
- Create: `packages/radiants/components/core/PixelTransition/index.ts`

```tsx
// packages/radiants/components/core/PixelTransition/PixelTransition.tsx
'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import {
  computeFlipOrder,
  animateTransition,
  paintGrid,
  bitsToGrid,
  type TransitionMode,
  type PixelGrid,
} from '@rdna/pixel';

export interface PixelTransitionProps {
  /** Starting grid */
  from: PixelGrid;
  /** Ending grid */
  to: PixelGrid;
  /** Transition mode */
  mode?: TransitionMode;
  /** Duration in ms. Default 300. */
  duration?: number;
  /** Foreground color */
  color?: string;
  /** Pixel scale multiplier */
  pixelSize?: number;
  /** Whether to auto-play on mount. Default true. */
  autoPlay?: boolean;
  /** Callback when transition completes */
  onComplete?: () => void;
  className?: string;
}

export function PixelTransition({
  from,
  to,
  mode = 'random',
  duration = 300,
  color = 'var(--color-main)',
  pixelSize = 1,
  autoPlay = true,
  onComplete,
  className,
}: PixelTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const play = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const flipOrder = computeFlipOrder(from.bits, to.bits, mode, from.width, from.height);

    const resolvedColor = getComputedStyle(canvas).color || '#000';
    const dpr = window.devicePixelRatio || 1;

    cancelRef.current = animateTransition(
      from.bits,
      to.bits,
      flipOrder,
      duration,
      (bits) => {
        const grid = bitsToGrid('frame', from.width, from.height, bits);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);
        paintGrid(ctx, grid, resolvedColor, pixelSize);
        ctx.restore();

        if (bits === to.bits) onComplete?.();
      },
    );
  }, [from, to, mode, duration, color, pixelSize, onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = from.width * pixelSize * dpr;
    canvas.height = from.height * pixelSize * dpr;

    if (autoPlay) play();
    return () => cancelRef.current?.();
  }, [play, autoPlay, from.width, from.height, pixelSize]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: from.width * pixelSize,
        height: from.height * pixelSize,
        imageRendering: 'pixelated',
        color,
      }}
    />
  );
}
```

**Step 1: Create the component and barrel export**

**Step 2: Commit**

```bash
git add packages/radiants/components/core/PixelTransition/
git commit -m "feat(PixelTransition): animated bit-flip morph component"
```

---

### Task 6.2: Build pixel icon import pipeline

**Files:**
- Modify: `packages/pixel/src/import.ts`
- Modify: `packages/pixel/src/__tests__/import.test.ts`
- Create: `packages/radiants/scripts/import-pixel-icons.mjs`
- Create: `packages/radiants/icons/pixel/aliases.ts`
- Modify: `packages/pixel/src/index.ts`

**Step 1: Extend the rectilinear SVG importer for icon sources**

Use the `svgToGrid()` primitives from Phase 1 to parse source art into canonical bit-grids. The importer must:
- reject curves
- normalize rectilinear coordinates onto a `1` or `0.5` lattice
- emit an outlier report instead of silently rounding unknown geometry
- support both external 16px source art and in-repo 24px source art

**Step 2: Add repo-local fixture tests**

Do not depend on Dropbox in CI. Add local fixture SVGs that cover:
- clean 16px integer-grid import
- 24px half-step normalization
- alias generation
- outlier reporting for unsupported inputs

**Step 3: Create the CLI script**

Create `packages/radiants/scripts/import-pixel-icons.mjs` to:
- read source SVG directories
- convert them to canonical grids
- write generated icon modules + manifest files
- fail loudly if unexpected outliers appear

**Step 4: Commit**

```bash
git add packages/pixel/src/import.ts packages/pixel/src/__tests__/import.test.ts packages/radiants/scripts/import-pixel-icons.mjs packages/radiants/icons/pixel/aliases.ts packages/pixel/src/index.ts
git commit -m "feat(pixel-icons): add import pipeline for canonical grid assets"
```

---

### Task 6.3: Import 16px and 24px icon sets into canonical grids

**Files:**
- Create: `packages/radiants/icons/pixel/16/` (generated)
- Create: `packages/radiants/icons/pixel/24/` (generated)
- Create: `packages/radiants/icons/pixel/manifest.json`
- Create: `packages/radiants/icons/pixel/outliers.json`
- Modify: `packages/radiants/icons/index.ts`

**Step 1: Import the 16px canonical source**

Run the importer against `/Users/rivermassey/Dropbox/_cronus_icons` and write generated 16px grid assets into `packages/radiants/icons/pixel/16/`.

**Step 2: Import the in-repo 24px source**

Run the importer against `packages/radiants/assets/icons/24px/` and write generated 24px grid assets into `packages/radiants/icons/pixel/24/`.

**Step 3: Add alias + outlier manifests**

- Map the current 16px runtime names to the imported canonical names
- Record the small number of 24px outliers in `outliers.json`
- Keep the import phase green for the whole compatible corpus instead of blocking on those few files

**Step 4: Verify counts**

Verify that the generated manifest matches:
- 16px Dropbox source: 143 files imported
- 24px repo source: 662 files processed, with outliers explicitly tracked

**Step 5: Commit**

```bash
git add packages/radiants/icons/pixel/16 packages/radiants/icons/pixel/24 packages/radiants/icons/pixel/manifest.json packages/radiants/icons/pixel/outliers.json packages/radiants/icons/index.ts
git commit -m "feat(pixel-icons): import 16px and 24px icon sets as canonical grids"
```

---

### Task 6.4: Add `PixelIcon` static renderer + animated icon support

**Files:**
- Create: `packages/radiants/components/core/PixelIcon/PixelIcon.tsx`
- Create: `packages/radiants/components/core/PixelIcon/index.ts`
- Modify: `packages/radiants/components/core/index.ts`
- Modify: `packages/radiants/icons/index.ts`

**Step 1: Create `PixelIcon`**

Render static icons from canonical grids via inline SVG. The component should accept:
- `name`
- `size` (`16` or `24`)
- `color`
- `pixelSize`
- optional fallback to legacy SVG only for temporarily unmigrated names

**Step 2: Support animated icons**

For icon state changes, consume the same canonical grid data via:
- `PixelTransition` for computed bit-flip animations
- authored `frames[]` for semantic animations that should not be generated automatically

**Step 3: Migrate a small representative consumer set**

Use 1-3 existing icon consumers to prove:
- static SVG rendering from grid data
- animated icon state changes
- no dependency on runtime SVG for migrated names

**Step 4: Commit**

```bash
git add packages/radiants/components/core/PixelIcon packages/radiants/components/core/index.ts packages/radiants/icons/index.ts
git commit -m "feat(PixelIcon): render canonical grid icons and support animation"
```

---

## Phase 7: Cleanup

### Task 7.1: Remove deprecated CSS and generators

**Files to delete:**
- `packages/radiants/patterns.css` — replaced by SVG renderer
- `packages/radiants/pixel-corners.generated.css` — replaced by PixelCorner SVG overlay
- `packages/radiants/pixel-corners.css` — manual utilities no longer needed
- `packages/radiants/pattern-shadows.css` — only after the final `pixel-shadow-*` consumers migrate
- `packages/radiants/scripts/generate-pixel-corners.mjs`
- `packages/radiants/scripts/pixel-corners-lib.mjs` (396 lines)

**Step 1: Create minimal `--pat-*` token stub**

`base.css`, `dark.css`, and `apps/rad-os/app/globals.css` still reference `--pat-*` tokens
via `mask-image` (e.g., `var(--pat-checkerboard)` in slider tracks, `var(--pat-dust)` in globals).
Until those consumers are migrated away from CSS masks, keep a minimal stub file with ONLY the tokens they use:

Create `packages/radiants/patterns-legacy-stubs.css` with the few `--pat-*` tokens still referenced
in CSS files. Remove this file once all CSS consumers are migrated.

**Step 2: Remove CSS imports**

In `packages/radiants/index.css`, replace the `@import` for `patterns.css` with `patterns-legacy-stubs.css`.
Remove imports for:
- `pixel-corners.generated.css`
- `pixel-corners.css`
- `pattern-shadows.css`

**Step 3: Delete the files**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pixel-art
rm packages/radiants/patterns.css
rm packages/radiants/pixel-corners.generated.css
rm packages/radiants/pixel-corners.css
rm packages/radiants/pattern-shadows.css
rm packages/radiants/scripts/generate-pixel-corners.mjs
rm packages/radiants/scripts/pixel-corners-lib.mjs
```

Delete `packages/radiants/scripts/pixel-corners.config.mjs` only after the generated corner registry reproduces all current mixed-side and omitted-corner semantics.

**Step 4: Remove `generate:pixel-corners` script from `packages/radiants/package.json`**

**Step 5: Verify build**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm build`
Expected: No import errors.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated CSS mask patterns, clip-path corners, and generators"
```

---

### Task 7.2: Remove deprecated ESLint rules

**Files to delete:**
- `packages/radiants/eslint/rules/no-clipped-shadow.mjs` (214 lines)
- `packages/radiants/eslint/rules/no-pixel-border.mjs` (161 lines)
- `packages/radiants/eslint/__tests__/no-clipped-shadow.test.mjs`
- `packages/radiants/eslint/__tests__/no-pixel-border.test.mjs`
- `packages/radiants/eslint/__tests__/pixel-corner-contract.test.mjs`

**Files to modify:**
- `packages/radiants/eslint/index.mjs` — remove rule imports and config entries (this is the actual config file, NOT `configs/recommended.mjs` which doesn't exist)
- `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs` — remove references to deleted rules (lines 9-10)
- `packages/radiants/eslint/contract.mjs` — remove `pixelCorners` contract shape
- `packages/radiants/generated/eslint-contract.json` — regenerate after contract.mjs changes

**Step 1: Remove rule files and update configs**

Keep `packages/radiants/eslint/rules/no-pattern-color-override.mjs` until the last CSS `mask-image`/`--pat-*` consumer is removed.

**Step 2: Run lint to verify no broken references**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm lint`
Expected: No errors about missing rules.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(eslint): remove no-clipped-shadow and no-pixel-border rules"
```

---

### Task 7.3: Update tests

**Files to modify:**
- `packages/radiants/test/pixel-corners-generator.test.ts` — delete (tests the old generator)
- `packages/radiants/components/core/AppWindow/AppWindow.test.tsx` — update selector from `pixel-rounded-md` to the new `rounded-*` + `PixelCorner` structure
- `packages/radiants/components/core/Input/Input.test.tsx` — update pixel-rounded assertions

**Step 1: Delete obsolete test**

```bash
rm packages/radiants/test/pixel-corners-generator.test.ts
```

**Step 2: Update remaining test assertions**

Search for `pixel-rounded` in test files and update class name assertions to match the new `rounded-*` + `PixelCorner` pattern.

**Step 3: Run full test suite**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm test`
Expected: All pass.

**Step 4: Commit**

```bash
git add -A
git commit -m "test: update tests for the new pixel art system, remove clip-path test"
```

---

### Task 7.4: Update barrel exports

**Files:**
- Modify: `packages/radiants/components/core/index.ts` — add exports for PixelCorner, PixelTransition

**Step 1: Add exports**

```ts
export { PixelCorner, type PixelCornerProps } from './PixelCorner';
export { PixelTransition, type PixelTransitionProps } from './PixelTransition';
```

**Step 2: Commit**

```bash
git add packages/radiants/components/core/index.ts
git commit -m "chore: export PixelCorner and PixelTransition from core barrel"
```

---

### Task 7.5: Update DESIGN.md

**Files:**
- Modify: `packages/radiants/DESIGN.md` — update Border Radius section, Pattern section

Update the documentation to reflect:
- Pixel corners are now SVG overlays, not clip-path
- `border-*`, `box-shadow`, `overflow-hidden` are all allowed on pixel-cornered elements
- Pattern and PixelIcon static rendering are SVG-based
- PixelTransition remains canvas-based
- New `@rdna/pixel` package owns the shared grid model and renderers
- Remove all clip-path-related rules and warnings

**Step 1: Edit DESIGN.md**

**Step 2: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: update DESIGN.md for the SVG-first pixel art system"
```

---

## Phase Summary

| Phase | Tasks | What it delivers | Parallelizable |
|-------|-------|-----------------|----------------|
| **1. Scaffold + Core** | 1.1–1.4 | `@rdna/pixel` package with types, bitstring engine, canvas + SVG helpers, import primitives | — |
| **2. Transitions** | 2.1 | Bit-flip animation system (random, radial, scanline, scatter) | ✅ with Phase 3 |
| **3. Corners** | 3.1 | Corner mirroring + positioning logic | ✅ with Phase 2 |
| **4. Patterns** | 4.1–4.3 | 51 patterns as bitstrings, Pattern component rewrite to SVG | After Phase 1 |
| **5. Corner Migration** | 5.1–5.4 | PixelCorner component, 43+ file migration from clip-path, `pixel-shadow-*` migration | After Phases 1+3 |
| **6. Animation + Icons** | 6.1–6.4 | PixelTransition, icon import pipeline, canonical 16px/24px grids, PixelIcon | After Phases 1+2 |
| **7. Cleanup** | 7.1–7.5 | Remove ~1,200 lines of CSS/generators/ESLint rules, update barrel exports, update docs | After all above |

**Excluded from this plan:**
- Dotting editor RadOS app (user building separately)
- Shadow system rewrite (open question — separate task)
- SSR fallback (future)
- Full removal of CSS `--pat-*` consumers in `base.css`/`dark.css`/`globals.css` before the replacement surfaces land (stub file bridges the gap)
