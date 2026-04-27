# @rdna/pixel — Unified Pixel Art Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Replace CSS mask patterns and clip-path pixel corners with a single bitstring-based rendering engine. Patterns stay canvas-driven; corner and border primitives use SVG rectangles generated from the same 1-bit geometry. 16px icon migration deferred (most SVGs aren't pixel-grid-aligned; prototype with 1-5 hand-picked icons).

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-pixel-art` (branch: `feat/pixel-art-system`)

**Architecture:** Standalone `@rdna/pixel` package provides bitstring parsing, canvas rendering, SVG rect extraction, bit-flip transitions, and corner/border geometry. `@rdna/radiants` consumes it for Pattern, PixelCorner, PixelBorder, and PixelTransition components. All pixel art assets (patterns, corner shapes) are stored as human-readable bitstrings.

**Tech Stack:** TypeScript, Canvas API, React 19, Vitest, pnpm workspaces

**Brainstorm:** `docs/brainstorms/2026-03-31-radiants-pixel-art-system-brainstorm.md`

### Review Fixes Applied

This plan incorporates fixes from architectural review (2026-03-31):

1. **Canvas fillStyle cannot accept CSS `var()` strings.** All components resolve CSS variables via `getComputedStyle(el).backgroundColor` on a hidden DOM element before passing to canvas.
2. **ResizeObserver required** on Pattern component (old CSS masks auto-resized; canvas does not).
3. **Pattern children visibility** — canvas gets `z-index: 0` and children wrapper gets `z-index: 1` so children render above the canvas.
4. **DPR handling** — tiling loop uses `canvasW / dpr` and `canvasH / dpr` (CSS-space) for bounds checking after `ctx.scale(dpr, dpr)`.
5. **Transition cache miss** — `interpolateFrame` operates on raw bitstrings, not PixelGrid objects. `parseBits` called once per animation start, not per frame.
6. **PixelCorner compound variants** — API supports `sizes` record prop (`{ tl: 'sm', br: 'md' }`) for mixed corners.
7. **Missing consumers added** — GoodNewsApp, typography-playground (6 files), pattern-playground (3 files), templates/ directory.
8. **`pixel-shadow-*` migration** — explicit task for 20+ consumers before `pixel-corners.css` deletion.
9. **`--pat-*` CSS token stubs** — keep a minimal token file for `base.css`/`dark.css`/`globals.css` consumers until they're migrated to canvas.
10. **ESLint references fixed** — config is `eslint/index.mjs`, not `configs/recommended.mjs`. Test files and `contract.mjs` included.
11. **Barrel exports** — explicit task to update `components/core/index.ts`.
12. **Phase 5 (16px icons) removed** — most SVGs not pixel-grid-aligned. Prototype with 1-5 hand-picked icons only.
13. **Small-element threshold** — elements with xs corners on components under 48px use standard `rounded-*` instead of PixelBorder or PixelCorner wrappers (extra SVG wrappers for 2×2 pixels are wasteful).

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
  "description": "1-bit pixel art engine — bitstring storage, canvas rendering, bit-flip transitions",
  "type": "module",
  "publishConfig": { "access": "public" },
  "files": ["dist", "src"],
  "exports": {
    ".": { "types": "./src/index.ts", "import": "./src/index.ts" },
    "./core": { "types": "./src/core.ts", "import": "./src/core.ts" },
    "./renderer": { "types": "./src/renderer.ts", "import": "./src/renderer.ts" },
    "./transition": { "types": "./src/transition.ts", "import": "./src/transition.ts" },
    "./corners": { "types": "./src/corners.ts", "import": "./src/corners.ts" }
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
 * Get the CSS positioning style for a corner canvas.
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

### Task 4.3: Rewrite Pattern component to canvas

**Files:**
- Modify: `packages/radiants/components/core/Pattern/Pattern.tsx`
- Modify: `packages/radiants/package.json` (add `@rdna/pixel` dependency)

**Step 1: Add @rdna/pixel dependency to radiants**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm --filter @rdna/radiants add @rdna/pixel@workspace:*`

**Step 2: Rewrite Pattern.tsx**

Replace the entire component. The new version uses a `<canvas>` element instead of CSS mask classes.

```tsx
// packages/radiants/components/core/Pattern/Pattern.tsx
'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { getPattern, paintGrid, paintTiledGrid } from '@rdna/pixel';

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

/**
 * Resolve a CSS color value (including var() references) to an actual color string
 * that canvas fillStyle accepts. Sets the value on a DOM element's backgroundColor
 * and reads back the computed style.
 */
function resolveCSSColor(el: HTMLElement, cssValue: string): string {
  el.style.backgroundColor = cssValue;
  const resolved = getComputedStyle(el).backgroundColor;
  el.style.backgroundColor = '';
  return resolved || '#000';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const grid = getPattern(pat);
    if (!grid) return;

    // Resolve CSS variable to actual color string for canvas
    const resolvedColor = resolveCSSColor(
      container,
      color ?? 'var(--color-main)',
    );

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to container (DPR-aware)
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    if (tiled) {
      paintTiledGrid(ctx, grid, resolvedColor, scale, rect.width, rect.height);
    } else {
      paintGrid(ctx, grid, resolvedColor, scale);
    }
  }, [pat, color, scale, tiled]);

  // Paint on mount + prop changes
  useEffect(() => { paint(); }, [paint]);

  // Repaint on container resize (CSS masks did this automatically; canvas does not)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => paint());
    ro.observe(container);
    return () => ro.disconnect();
  }, [paint]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        backgroundColor: bg,
        ...style,
      }}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {children && (
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      )}
    </div>
  );
}
```

**Step 3: Verify existing Pattern consumers still work**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm dev`

Manually check that `<Pattern pat="checkerboard" />` renders visibly. The API is the same (`pat`, `color`, `bg`, `scale`), so consumers should not need changes.

**Step 4: Commit**

```bash
git add packages/radiants/components/core/Pattern/Pattern.tsx packages/radiants/package.json pnpm-lock.yaml
git commit -m "feat(Pattern): rewrite to canvas renderer via @rdna/pixel"
```

---

## Phase 5: Pixel Corner Migration

### 16px Icon Status (not in this plan's scope, reference only)

Audit of `packages/radiants/assets/icons/16px/` (155 total SVGs):
- **90 pixel-grid-aligned** (integer-only path coordinates — clean conversion)
- **65 sub-pixel** (fractional coordinates — need redrawing on-grid in dotting first)

Detection method: `grep -rL '\.[0-9]' packages/radiants/assets/icons/16px/*.svg`

**Pixel-aligned (90):**
align-center, align-left, align-right, broadcast-dish, broken-battery, calendar, calendar2,
camera, cd, cd-horizontal, chevron-down, chevron-left, chevron-right, close-filled, code-folder,
code-window, code-window-filled, coins, comments-blank, computer, copy-to-clipboard, crosshair1,
crosshair2, crosshair2-retro, cursor2, cut, document, document-image, document2, download,
electric, envelope-open, eye-hidden, film-camera, fire, folder-closed, folder-open, full-screen,
go-forward, grid-3x3, grip-horizontal, grip-vertical, hamburger, hard-drive, headphones, heart,
info, info-filled, joystick, line-chart, lock-closed, minus, more-horizontal, more-vertical,
multiple-images, outline-box, paper-plane, pencil, pie-chart, plug, plus, power1, print,
question-filled, refresh-filled, refresh1, reload, resize-corner, save, search, settings-cog,
share, sort-filter-filled, sparkles, swap, trash-full, trophy, trophy2, tv, twitter, upload,
USDC, usericon, volume-faders, volume-mute, warning-filled, warning-hollow, wrench, zip-file,
zip-file2

**Sub-pixel (65) — need redrawing:**
cell-bars, checkmark, clock, close, code-file, comments-typing, copied-to-clipboard, copy,
crosshair-3, crosshair4, cursor-text, discord, eject, envelope-closed, equalizer, eye,
film-strip, film-strip-outline, game-controller, globe, hand-point, home, home2, hourglass,
lightbulb, lightbulb2, list, lock-open, microphone, microphone-mute, money, moon,
music-8th-notes, pause, picture-in-picture, play, power2, question, queue, rad-mark,
radiants-logo, record-playback, record-player, save-2, seek-back, seek-forward, skip-back,
skip-forward, skull-and-crossbones, sort-descending, sort-filter-empty, stop-playback, tape,
telephone, trash, trash-open, usb, usb-icon, volume-high, volume-low, volume-med,
warning-filled-outline, wifi, window-error, windows

The 90 aligned icons can be batch-converted with the `convert-icons.ts` script once the core engine is stable. The 65 sub-pixel icons should be redrawn on-grid in the dotting editor. This work is a separate phase after the core engine ships.



### Task 5.1: Corner art bitstrings

**Files:**
- Create: `packages/pixel/src/corner-sets.ts`
- Create: `packages/pixel/src/__tests__/corner-sets.test.ts`

The corner shapes will be drawn in the dotting editor and stored as bitstrings. For the initial implementation, derive approximations from the existing clip-path polygon point coordinates.

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
  paintGrid,
  type CornerPosition,
} from '@rdna/pixel';

export type CornerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface PixelCornerProps {
  /** Corner size — single size for all corners, or record for mixed */
  size: CornerSize | Partial<Record<CornerPosition, CornerSize>>;
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
 * Renders 4 small canvas elements positioned at each corner of the parent.
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
  const refsMap = useRef<Map<CornerPosition, HTMLCanvasElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const set = getCornerSet(size);
    if (!set) return;

    // Resolve CSS variables to actual color strings for canvas fillStyle.
    // Canvas cannot accept var() references — we must read computed values.
    const container = containerRef.current;
    if (!container) return;
    container.style.backgroundColor = cornerBg;
    const resolvedBg = getComputedStyle(container).backgroundColor || '#fff';
    container.style.backgroundColor = borderColor;
    const resolvedBorder = getComputedStyle(container).backgroundColor || '#000';
    container.style.backgroundColor = '';

    for (const pos of corners) {
      const canvas = refsMap.current.get(pos);
      if (!canvas) continue;

      const coverGrid = mirrorForCorner(set.tl, pos);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = coverGrid.width * pixelSize * dpr;
      canvas.height = coverGrid.height * pixelSize * dpr;

      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;

      // Layer 1: cover (bg-colored pixels to hide smooth corner)
      paintGrid(ctx, coverGrid, resolvedBg, pixelSize);

      // Layer 2: border (staircase edge)
      if (set.border) {
        const borderGrid = mirrorForCorner(set.border, pos);
        paintGrid(ctx, borderGrid, resolvedBorder, pixelSize);
      }
    }
  }, [size, cornerBg, borderColor, pixelSize, corners]);

  const set = getCornerSet(size);
  if (!set) return null;

  const cssSize = set.tl.width * pixelSize;

  return (
    <div
      ref={containerRef}
      style={{
        '--_pcorner-bg': cornerBg,
        '--_pcorner-border': borderColor,
      } as React.CSSProperties}
      aria-hidden
    >
      {corners.map((pos) => (
        <canvas
          key={pos}
          ref={(el) => {
            if (el) refsMap.current.set(pos, el);
            else refsMap.current.delete(pos);
          }}
          style={{
            position: 'absolute',
            [pos.includes('t') ? 'top' : 'bottom']: 0,
            [pos.includes('l') ? 'left' : 'right']: 0,
            width: cssSize,
            height: cssSize,
            imageRendering: 'pixelated',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      ))}
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
git commit -m "feat(PixelCorner): canvas overlay component replacing clip-path corners"
```

---

### Task 5.3: Migrate AppWindow from clip-path to PixelBorder

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

This is the highest-value migration — AppWindow is the primary consumer with the most clip-path pain (position override hacks, shadow restrictions).

Implementation update (2026-04-10): the branch moved from a corner-only `PixelCorner` overlay to a `PixelBorder` / `PixelBorderEdges` architecture. Continue phase 5 using that architecture so the migration stays on one primitive.

**Step 1: Read the current AppWindow implementation**

Read `packages/radiants/components/core/AppWindow/AppWindow.tsx`, specifically:
- Line ~996: the `pixel-rounded-md` class usage
- Line ~917: any other `pixel-rounded` usages
- The inline `style={{ position: 'absolute' }}` override

**Step 2: Replace pixel-rounded classes**

In the main window container (line ~996):
- Remove `pixel-rounded-md` from className
- Remove the old CSS border/shadow assumptions from the clipped path
- Add `<PixelBorderEdges size="md" />` as a child on the absolute window shell
- Remove the inline `style={{ position: 'absolute' }}` override (no longer needed — `position: absolute` now works naturally)
- Replace the clipped `box-shadow` path with `filter: drop-shadow(...)` on the shell

In `AppWindow.Island`:
- Replace `pixel-rounded-sm` islands with `<PixelBorder size="sm">...</PixelBorder>`
- Let `PixelBorder` own the clipping wrapper; do not add a second CSS border

**Step 3: Verify visually**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm dev`
Open RadOS, check that windows have pixel corners, can be dragged, and have shadows.

**Step 4: Commit**

```bash
git add packages/radiants/components/core/AppWindow/AppWindow.tsx
git commit -m "refactor(AppWindow): migrate from clip-path to PixelBorder"
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
- `GoodNewsApp.tsx` — raw `rdna-pat` CSS consumer, NOT `<Pattern>`, needs full rewrite to canvas

**Batch 6 — Playground + templates (missed in original plan):**
- `typography-playground/UsageGuide.tsx` (lines 26, 47)
- `typography-playground/TypeManual.tsx` (lines 62, 190, 250)
- `typography-playground/TypeStyles.tsx` (line 361)
- `pattern-playground/PatternCodeOutput.tsx` (line 50)
- `pattern-playground/PatternPreview.tsx` (lines 59-60, 64-65)
- `pattern-playground/PatternGridPicker.tsx` (line 53)

**Batch 7 — `pixel-shadow-*` migration (20+ consumers):**

`pixel-shadow-*` classes are defined in `pixel-corners.css` (which gets deleted in cleanup). All consumers must migrate to standard `shadow-*` or `drop-shadow-*` BEFORE deletion. Grep for `pixel-shadow-` across all `.tsx` files and migrate each to the appropriate standard shadow class.

**Note on wrapper ownership:** `PixelBorder` owns the clipping wrapper internally. Do not stack another outer border/overflow wrapper around it unless you intend to clip the SVG edge fragments too. For shells that cannot be wrapped, use `PixelBorderEdges`.

**Note on small elements:** Elements with xs corners on components under 48px (Badge, Checkbox, Switch, Slider thumb) should use standard `rounded-xs` or `rounded-sm` instead of `PixelBorder` — a wrapper plus 4 SVG corners is disproportionate overhead.

**Migration pattern for each file:**

For components that are wrappers (Card, Dialog, etc.) where `PixelBorder` can own the shell:
```tsx
// Before:
<div className="pixel-rounded-sm bg-card ...">

// After:
<PixelBorder size="sm" className="bg-card ..." shadow="2px 2px 0 var(--color-ink)">
  <div className="p-4">...</div>
</PixelBorder>
```

For already-positioned shells that cannot be wrapped:
```tsx
<div className="relative ...">
  <PixelBorderEdges size="md" />
  {children}
</div>
```

For small inline elements (Badge, Checkbox, etc.) where an extra wrapper is wasteful, use standard `rounded-*`.

**Step 1: Migrate Batch 1 (core components)**

Work through each file, replacing `pixel-rounded-*` with either:
- `PixelBorder` for wrapper/shell components
- `PixelBorderEdges` for already-positioned containers
- standard `rounded-*` for small inline elements

**Step 2: Run lint + dev server to verify**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm lint && pnpm dev`

**Step 3: Commit per batch**

```bash
git commit -m "refactor(core): migrate Button, Card, Badge, Tabs, Dialog to PixelBorder"
git commit -m "refactor(forms): migrate Input, Select, Switch, Checkbox, Slider to PixelBorder"
git commit -m "refactor(menus): migrate Menubar, NavigationMenu, ContextMenu, Popover to PixelBorder"
git commit -m "refactor(misc): migrate Avatar, Collapsible, ToggleGroup, Meter to PixelBorder"
git commit -m "refactor(rad-os): migrate app-level pixel-rounded consumers to PixelBorder"
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

## Phase 7: Cleanup

### Task 7.1: Remove deprecated CSS and generators

**Files to delete:**
- `packages/radiants/patterns.css` — replaced by canvas renderer
- `packages/radiants/pixel-corners.generated.css` — replaced by PixelBorder / PixelCorner SVG primitives
- `packages/radiants/pixel-corners.css` — manual utilities no longer needed
- `packages/radiants/pattern-shadows.css` — to be rewritten (see note)
- `packages/radiants/scripts/generate-pixel-corners.mjs`
- `packages/radiants/scripts/pixel-corners-lib.mjs` (396 lines)
- `packages/radiants/scripts/pixel-corners.config.mjs` (98 lines)

**Step 1: Create minimal `--pat-*` token stub**

`base.css`, `dark.css`, and `apps/rad-os/app/globals.css` still reference `--pat-*` tokens
via `mask-image` (e.g., `var(--pat-checkerboard)` in slider tracks, `var(--pat-dust)` in globals).
Until those consumers are migrated to canvas, keep a minimal stub file with ONLY the tokens they use:

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
rm packages/radiants/scripts/pixel-corners.config.mjs
```

**Step 4: Remove `generate:pixel-corners` script from `packages/radiants/package.json`**

**Step 3: Verify build**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm build`
Expected: No import errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated CSS mask patterns, clip-path corners, and generators"
```

---

### Task 7.2: Remove deprecated ESLint rules

**Files to delete:**
- `packages/radiants/eslint/rules/no-clipped-shadow.mjs` (214 lines)
- `packages/radiants/eslint/rules/no-pixel-border.mjs` (161 lines)
- `packages/radiants/eslint/rules/no-pattern-color-override.mjs`
- `packages/radiants/eslint/__tests__/no-clipped-shadow.test.mjs`
- `packages/radiants/eslint/__tests__/no-pixel-border.test.mjs`
- `packages/radiants/eslint/__tests__/pixel-corner-contract.test.mjs`

**Files to modify:**
- `packages/radiants/eslint/index.mjs` — remove rule imports and config entries (this is the actual config file, NOT `configs/recommended.mjs` which doesn't exist)
- `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs` — remove references to deleted rules (lines 9-10)
- `packages/radiants/eslint/contract.mjs` — remove `pixelCorners` contract shape
- `packages/radiants/generated/eslint-contract.json` — regenerate after contract.mjs changes

**Step 1: Remove rule files and update configs**

**Step 2: Run lint to verify no broken references**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm lint`
Expected: No errors about missing rules.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(eslint): remove no-clipped-shadow, no-pixel-border, no-pattern-color-override rules"
```

---

### Task 7.3: Update tests

**Files to modify:**
- `packages/radiants/test/pixel-corners-generator.test.ts` — delete (tests the old generator)
- `packages/radiants/components/core/AppWindow/AppWindow.test.tsx` — update pixel-rounded selectors to the new `PixelBorder` / `PixelBorderEdges` path
- `packages/radiants/components/core/PixelCorner/PixelCorner.test.tsx` — cover the inner mask path while `PixelCorner` remains public
- `packages/radiants/components/core/PixelBorder/PixelBorder.test.tsx` — add smoke tests for the new wrapper primitive
- `packages/radiants/components/core/Input/Input.test.tsx` — update pixel-rounded-xs assertions once the input migration lands

**Step 1: Delete obsolete test**

```bash
rm packages/radiants/test/pixel-corners-generator.test.ts
```

**Step 2: Update remaining test assertions**

Search for `pixel-rounded` in test files and update assertions to match the new `PixelBorder` / `PixelBorderEdges` path or the chosen `rounded-*` fallback for small elements.

**Step 3: Run full test suite**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pixel-art && pnpm test`
Expected: All pass.

**Step 4: Commit**

```bash
git add -A
git commit -m "test: update tests for canvas pixel art system, remove clip-path test"
```

---

### Task 7.4: Update barrel exports

**Files:**
- Modify: `packages/radiants/components/core/index.ts` — add exports for PixelCorner, PixelBorder, PixelTransition

**Step 1: Add exports**

```ts
export { PixelCorner, type PixelCornerProps } from './PixelCorner';
export { PixelBorder, PixelBorderEdges, type PixelBorderProps, type PixelBorderSize } from './PixelBorder';
export { PixelTransition, type PixelTransitionProps } from './PixelTransition';
```

**Step 2: Commit**

```bash
git add packages/radiants/components/core/index.ts
git commit -m "chore: export PixelCorner, PixelBorder, and PixelTransition from core barrel"
```

---

### Task 7.5: Update DESIGN.md

**Files:**
- Modify: `packages/radiants/DESIGN.md` — update Border Radius section, Pattern section

Update the documentation to reflect:
- Pixel corners are now SVG rect primitives generated from bitstrings, not clip-path
- wrapper components use `PixelBorder`; corner-only use cases use `PixelCorner`
- `box-shadow` is replaced by `filter: drop-shadow()` on pixel shells
- Pattern rendering is now canvas-based
- New `@rdna/pixel` package is the engine
- Remove all clip-path-related rules and warnings

**Step 1: Edit DESIGN.md**

**Step 2: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: update DESIGN.md for canvas pixel art system"
```

---

## Phase Summary

| Phase | Tasks | What it delivers | Parallelizable |
|-------|-------|-----------------|----------------|
| **1. Scaffold + Core** | 1.1–1.3 | `@rdna/pixel` package with types, bitstring engine, canvas renderer | — |
| **2. Transitions** | 2.1 | Bit-flip animation system (random, radial, scanline, scatter) | ✅ with Phase 3 |
| **3. Corners** | 3.1 | Corner mirroring + positioning logic | ✅ with Phase 2 |
| **4. Patterns** | 4.1–4.3 | 51 patterns as bitstrings, Pattern component rewrite | After Phase 1 |
| **5. Corner Migration** | 5.1–5.4 | PixelCorner component, 43+ file migration from clip-path, `pixel-shadow-*` migration | After Phases 1+3 |
| **6. PixelTransition** | 6.1 | Animated morph component | After Phase 2 |
| **7. Cleanup** | 7.1–7.5 | Remove ~1,200 lines of CSS/generators/ESLint rules, update barrel exports, update docs | After all above |

**Excluded from this plan:**
- Dotting editor RadOS app (user building separately)
- 16px icon migration (most SVGs not pixel-grid-aligned — prototype with 1-5 hand-picked icons first)
- Shadow system rewrite (open question — separate task)
- SSR fallback (future)
- Full migration of CSS `--pat-*` consumers in `base.css`/`dark.css`/`globals.css` (stub file bridges the gap)
