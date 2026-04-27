# Pixel Dither (1-bit Density Ramps) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Ship a `@rdna/pixel/dither` submodule that generates Bayer-matrix 1-bit density ramps through the existing `buildMaskAsset` / `maskHostStyle` pipeline, replace the `AppWindow` chrome gradient with a stepped dither ramp of `--color-window-chrome-from` on `--color-window-chrome-to`, and add a simple `dither` mode in `pixel-playground` to author and copy-out presets.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-logo-maker` (branch `feat/logo-asset-maker`)

**Architecture:** `@rdna/pixel/dither` produces a tall `PixelGrid` (matrix_size wide × `steps × matrix_size` tall) whose bits come from per-band Bayer thresholding, then reuses the package's existing `bitsToMaskURI` path to emit a CSS `mask-image` data URI. Consumers render it as an absolutely-positioned overlay `<div>` whose `background-color` is the mask fill token, layered over a solid base-color element. No canvas, no GPU — pure CSS.

**Tech Stack:** TypeScript, Vitest (for `@rdna/pixel`), React 19 (for playground), Tailwind v4 (for AppWindow consumer). No new runtime dependencies.

---

## Reference Material (read before executing)

- Brainstorm: `archive/brainstorms-ideas-ops-audit-2026-04-25/docs/brainstorms/2026-04-24-pixel-dither-brainstorm.md`
- Prior survey: `docs/brainstorms/2026-04-13-dither-pipeline-brainstorm.md` (this plan = Option A + Spike 1 from that doc)
- House rendering contract: `packages/pixel/src/path.ts` (`bitsToPath`, `bitsToMaskURI`), `packages/pixel/src/mask.ts` (`buildMaskAsset`, `maskHostStyle`)
- Pattern submodule precedent (what our submodule layout mirrors): `packages/pixel/src/patterns/{registry,prepare,types}.ts` + `packages/pixel/src/patterns.ts` re-export + `packages/pixel/package.json` `./patterns` export
- Test style precedent: `packages/pixel/src/__tests__/pattern-prepare.test.ts`, `patterns.test.ts`, `mask.test.ts`
- Playground entry: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx`
- Playground mode wiring: `apps/rad-os/components/apps/pixel-playground/{types.ts,constants.ts,ModeNav.tsx,previews/ModePreview.tsx,pixel-code-gen.ts}`
- AppWindow target: `packages/radiants/components/core/AppWindow/AppWindow.tsx:1190` (the `shellStyle.background` branch)
- Token chain: `packages/radiants/tokens.css:138-139` (light), `packages/radiants/dark.css:126-127` (dark)
- CLAUDE guidance: `packages/radiants/CLAUDE.md` (RDNA tokens + pixel-corners rules), `apps/rad-os/CLAUDE.md`

**Key conventions to respect:**

- Semantic tokens only in `/radiants` and `/rad-os` — no raw `#hex`. Dither fill/base bind to `--color-window-chrome-from` / `--color-window-chrome-to`.
- Pixel-cornered elements **never** get `border-*`, `shadow-*`, or `overflow-hidden`.
- Tailwind v4 `max-w-{size}` trap — avoid T-shirt sizes, use explicit `rem` values.
- Each `@rdna/pixel` submodule is ESM, no build-time codegen, and re-exports cleanly from `src/index.ts`.
- Tests live at `packages/pixel/src/__tests__/<name>.test.ts` (Vitest). Run with `pnpm --filter @rdna/pixel test`.

---

## Task Graph

```
Task 1 (bayer matrix)  ─┐
Task 2 (ramp bits)      ├─→ Task 3 (ditherRamp public API)
                        │     ├─→ Task 4 (index + subpath export)
                        │     │     ├─→ Task 5 (AppWindow consumer)
                        │     │     └─→ Task 6 (playground type + config)
                        │     │           ├─→ Task 7 (DitherPreview UI)
                        │     │           └─→ Task 8 (code-gen dither branch)
                        │     │                 └─→ Task 9 (ModeNav / default state sanity)
                        │     └─ Task 10 (docs stub + manual QA checklist)
```

Tasks 1 → 4 are sequential on `@rdna/pixel`. Task 5 (AppWindow) and Task 6 (playground scaffolding) can run in parallel after Task 4. Tasks 7-9 sequentially refine the playground. Task 10 is the final wrap-up.

Commit after every task. One task = one commit.

---

### Task 1: Bayer matrix generator

Generates the classic recursive Bayer matrix of size `n × n` (for `n ∈ {2, 4, 8, 16}`) as `number[][]`. Values are integers in `[0, n²)`; used later as threshold values when building the density ramp.

**Files:**
- Create: `packages/pixel/src/dither/bayer.ts`
- Create: `packages/pixel/src/__tests__/dither-bayer.test.ts`

**Step 1: Write the failing test**

Create `packages/pixel/src/__tests__/dither-bayer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { bayerMatrix } from '../dither/bayer';

describe('bayerMatrix', () => {
  it('returns the canonical 2×2 base matrix', () => {
    expect(bayerMatrix(2)).toEqual([
      [0, 2],
      [3, 1],
    ]);
  });

  it('returns a 4×4 matrix matching the standard Bayer recursion', () => {
    // B_4[2i+u][2j+v] = 4 * B_2[i][j] + B_2[u][v]
    expect(bayerMatrix(4)).toEqual([
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ]);
  });

  it('produces an n×n matrix for n in {2,4,8,16}', () => {
    for (const n of [2, 4, 8, 16] as const) {
      const m = bayerMatrix(n);
      expect(m).toHaveLength(n);
      for (const row of m) {
        expect(row).toHaveLength(n);
      }
    }
  });

  it('contains every integer from 0 to n²-1 exactly once', () => {
    for (const n of [2, 4, 8, 16] as const) {
      const m = bayerMatrix(n);
      const flat = m.flat().sort((a, b) => a - b);
      expect(flat).toEqual(Array.from({ length: n * n }, (_, i) => i));
    }
  });

  it('throws for non-power-of-two sizes', () => {
    expect(() => bayerMatrix(3 as 2)).toThrow();
    expect(() => bayerMatrix(0 as 2)).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @rdna/pixel test -- dither-bayer
```

Expected: `Cannot find module '../dither/bayer'` or equivalent resolution error.

**Step 3: Write minimal implementation**

Create `packages/pixel/src/dither/bayer.ts`:

```ts
export type BayerMatrixSize = 2 | 4 | 8 | 16;

const BASE: readonly (readonly number[])[] = [
  [0, 2],
  [3, 1],
];

function isPowerOfTwoAtLeastTwo(n: number): n is BayerMatrixSize {
  return Number.isInteger(n) && n >= 2 && (n & (n - 1)) === 0;
}

/**
 * Build the recursive Bayer threshold matrix of side length `n`.
 *
 * Recursion: B_{2k}[2i+u][2j+v] = 4 * B_k[i][j] + B_2[u][v].
 *
 * Values span [0, n²) and each value appears exactly once.
 */
export function bayerMatrix(n: BayerMatrixSize): number[][] {
  if (!isPowerOfTwoAtLeastTwo(n)) {
    throw new Error(`bayerMatrix: size must be a power of two ≥ 2, received ${n}`);
  }

  let current: number[][] = BASE.map((row) => [...row]);
  let size = 2;

  while (size < n) {
    const next: number[][] = [];
    const nextSize = size * 2;
    for (let y = 0; y < nextSize; y++) {
      const row: number[] = [];
      const innerY = y % 2;
      const outerY = (y - innerY) / 2;
      for (let x = 0; x < nextSize; x++) {
        const innerX = x % 2;
        const outerX = (x - innerX) / 2;
        row.push(4 * current[outerY][outerX] + BASE[innerY][innerX]);
      }
      next.push(row);
    }
    current = next;
    size = nextSize;
  }

  return current;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @rdna/pixel test -- dither-bayer
```

Expected: all 5 tests PASS.

**Step 5: Commit**

```bash
git add packages/pixel/src/dither/bayer.ts packages/pixel/src/__tests__/dither-bayer.test.ts
git commit -m "feat(@rdna/pixel): add recursive Bayer threshold matrix generator"
```

---

### Task 2: Density-ramp bitstring generator

Given a Bayer matrix and a step count, emits the bitstring of a tall `PixelGrid` whose vertical position determines a threshold. Each band of `matrix` rows compares its matrix cell to a band-specific threshold.

**Files:**
- Create: `packages/pixel/src/dither/ramp.ts`
- Create: `packages/pixel/src/__tests__/dither-ramp.test.ts`

**Step 1: Write the failing test**

Create `packages/pixel/src/__tests__/dither-ramp.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { ditherRampBits } from '../dither/ramp';

describe('ditherRampBits', () => {
  it('down direction with matrix=2, steps=2 produces dense-top → sparse-bottom', () => {
    // B_2 = [[0, 2], [3, 1]]
    // Band 0 (top, dense): threshold = 0.75 → cells with (v+0.5)/4 < 0.75 are ON → 0,1,2 are ON; 3 is OFF
    // Band 1 (bottom, sparse): threshold = 0.25 → only v=0 is ON
    // → rows (top to bottom):
    //   band0 row 0: [1,1]  band0 row 1: [0,1]
    //   band1 row 0: [1,0]  band1 row 1: [0,0]
    expect(
      ditherRampBits({ matrix: 2, steps: 2, direction: 'down' }),
    ).toBe('11' + '01' + '10' + '00');
  });

  it('up direction with matrix=2, steps=2 mirrors down vertically', () => {
    const down = ditherRampBits({ matrix: 2, steps: 2, direction: 'down' });
    const up = ditherRampBits({ matrix: 2, steps: 2, direction: 'up' });
    // rows reversed in bands of `matrix` rows each (2 rows per band)
    const bandRows = (bits: string, w: number) =>
      Array.from({ length: bits.length / w }, (_, i) => bits.slice(i * w, (i + 1) * w));
    const downRows = bandRows(down, 2);
    const upRows = bandRows(up, 2);
    expect(upRows).toEqual([downRows[2], downRows[3], downRows[0], downRows[1]]);
  });

  it('emits a bitstring of length matrix × matrix × steps', () => {
    for (const matrix of [2, 4, 8, 16] as const) {
      for (const steps of [1, 4, 8]) {
        const bits = ditherRampBits({ matrix, steps, direction: 'down' });
        expect(bits).toHaveLength(matrix * matrix * steps);
      }
    }
  });

  it('each band density is monotonic across steps in direction order', () => {
    const matrix = 4;
    const steps = 8;
    const bits = ditherRampBits({ matrix, steps, direction: 'down' });
    const bandSize = matrix * matrix;
    const fills: number[] = [];
    for (let b = 0; b < steps; b++) {
      const band = bits.slice(b * bandSize, (b + 1) * bandSize);
      fills.push([...band].filter((c) => c === '1').length);
    }
    // down: dense at top (high fill) → sparse at bottom (low fill)
    for (let i = 1; i < fills.length; i++) {
      expect(fills[i]).toBeLessThanOrEqual(fills[i - 1]);
    }
  });

  it('rejects non-positive step counts', () => {
    expect(() => ditherRampBits({ matrix: 4, steps: 0, direction: 'down' })).toThrow();
    expect(() => ditherRampBits({ matrix: 4, steps: -1, direction: 'down' })).toThrow();
    expect(() => ditherRampBits({ matrix: 4, steps: 1.5, direction: 'down' })).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @rdna/pixel test -- dither-ramp
```

Expected: module-not-found error.

**Step 3: Write minimal implementation**

Create `packages/pixel/src/dither/ramp.ts`:

```ts
import { bayerMatrix, type BayerMatrixSize } from './bayer.js';

export type DitherDirection = 'up' | 'down';

export interface DitherRampOptions {
  readonly matrix: BayerMatrixSize;
  readonly steps: number;
  readonly direction: DitherDirection;
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`ditherRampBits: ${label} must be a positive integer, received ${value}`);
  }
}

/**
 * Build a density-ramp bitstring for a tall PixelGrid.
 *
 * Width  = `matrix`
 * Height = `matrix * steps`
 *
 * Each horizontal band of `matrix` rows shares a single density threshold
 * `(k + 0.5) / steps`. Within the band, a cell (x,y) is "1" iff that
 * threshold exceeds the normalized Bayer value `(B[y][x] + 0.5) / matrix²`.
 *
 * `direction: 'down'` puts the dense band at the top (k=steps-1 maps to top).
 * `direction: 'up'`   puts the dense band at the bottom.
 */
export function ditherRampBits({ matrix, steps, direction }: DitherRampOptions): string {
  assertPositiveInteger(steps, 'steps');
  const m = bayerMatrix(matrix);
  const matrixArea = matrix * matrix;
  const bits: string[] = [];

  for (let k = 0; k < steps; k++) {
    const bandIndex = direction === 'down' ? steps - 1 - k : k;
    const density = (bandIndex + 0.5) / steps;
    for (let y = 0; y < matrix; y++) {
      for (let x = 0; x < matrix; x++) {
        const normalized = (m[y][x] + 0.5) / matrixArea;
        bits.push(density > normalized ? '1' : '0');
      }
    }
  }

  return bits.join('');
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @rdna/pixel test -- dither-ramp
```

Expected: all 5 tests PASS.

**Step 5: Commit**

```bash
git add packages/pixel/src/dither/ramp.ts packages/pixel/src/__tests__/dither-ramp.test.ts
git commit -m "feat(@rdna/pixel): add Bayer-threshold density-ramp bitstring generator"
```

---

### Task 3: `ditherRamp()` public API

Composes the bitstring into a `PixelGrid` plus the existing `MaskAsset` and `MaskHostStyle` artifacts so consumers can drop the return value straight onto a CSS overlay. Cache by `(matrix, steps, direction)` key — matches the caching style of `preparePattern` / `preparePatterns`.

**Files:**
- Create: `packages/pixel/src/dither/prepare.ts`
- Create: `packages/pixel/src/dither/types.ts`
- Create: `packages/pixel/src/__tests__/dither-prepare.test.ts`

**Step 1: Write the failing test**

Create `packages/pixel/src/__tests__/dither-prepare.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { buildMaskAsset, maskHostStyle } from '../mask';
import { ditherRampBits } from '../dither/ramp';
import { ditherRamp } from '../dither/prepare';

describe('ditherRamp', () => {
  it('returns a PixelGrid whose bits match ditherRampBits', () => {
    const result = ditherRamp({ matrix: 4, steps: 6, direction: 'down' });
    expect(result.grid).toEqual({
      name: 'dither-ramp-4-6-down',
      width: 4,
      height: 4 * 6,
      bits: ditherRampBits({ matrix: 4, steps: 6, direction: 'down' }),
    });
  });

  it('derives mask + style from the existing buildMaskAsset / maskHostStyle helpers', () => {
    const result = ditherRamp({ matrix: 4, steps: 6, direction: 'down' });
    const mask = buildMaskAsset(result.grid);
    expect(result.mask).toEqual(mask);
    expect(result.style).toEqual(
      maskHostStyle(mask, { tiled: true }),
    );
    expect(result.style.maskRepeat).toBe('repeat');
  });

  it('caches by (matrix, steps, direction)', () => {
    const a = ditherRamp({ matrix: 4, steps: 6, direction: 'down' });
    const b = ditherRamp({ matrix: 4, steps: 6, direction: 'down' });
    expect(a).toBe(b);

    const c = ditherRamp({ matrix: 4, steps: 6, direction: 'up' });
    expect(c).not.toBe(a);
  });

  it('supports all {2,4,8,16} × direction combinations without throwing', () => {
    for (const matrix of [2, 4, 8, 16] as const) {
      for (const direction of ['up', 'down'] as const) {
        const result = ditherRamp({ matrix, steps: 4, direction });
        expect(result.grid.width).toBe(matrix);
        expect(result.grid.height).toBe(matrix * 4);
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @rdna/pixel test -- dither-prepare
```

Expected: module-not-found error.

**Step 3: Write minimal implementation**

Create `packages/pixel/src/dither/types.ts`:

```ts
import type { PixelGrid } from '../types.js';
import type { MaskAsset, MaskHostStyle } from '../mask.js';
import type { BayerMatrixSize } from './bayer.js';
import type { DitherDirection, DitherRampOptions } from './ramp.js';

export type { BayerMatrixSize, DitherDirection, DitherRampOptions };

export interface PreparedDitherRamp {
  readonly grid: PixelGrid;
  readonly mask: MaskAsset;
  readonly style: MaskHostStyle;
}
```

Create `packages/pixel/src/dither/prepare.ts`:

```ts
import { buildMaskAsset, maskHostStyle } from '../mask.js';
import { ditherRampBits } from './ramp.js';
import type { DitherRampOptions, PreparedDitherRamp } from './types.js';

const cache = new Map<string, PreparedDitherRamp>();

function cacheKey({ matrix, steps, direction }: DitherRampOptions): string {
  return `${matrix}-${steps}-${direction}`;
}

/**
 * Build a cached density ramp: PixelGrid + CSS mask asset + CSS style object.
 *
 * Consumers render as `<div style={result.style} background={fillColor} />`
 * stacked over a solid `base` background. Colors are intentionally not baked
 * in — the mask is color-agnostic.
 */
export function ditherRamp(options: DitherRampOptions): PreparedDitherRamp {
  const key = cacheKey(options);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const bits = ditherRampBits(options);
  const grid = {
    name: `dither-ramp-${key}`,
    width: options.matrix,
    height: options.matrix * options.steps,
    bits,
  };

  const mask = buildMaskAsset(grid);
  const style = maskHostStyle(mask, { tiled: true });

  const prepared: PreparedDitherRamp = { grid, mask, style };
  cache.set(key, prepared);
  return prepared;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @rdna/pixel test -- dither-prepare
```

Expected: all 4 tests PASS.

**Step 5: Commit**

```bash
git add packages/pixel/src/dither/ \
        packages/pixel/src/__tests__/dither-prepare.test.ts
git commit -m "feat(@rdna/pixel): add ditherRamp public API with cached PixelGrid + mask + style"
```

---

### Task 4: Wire subpath export + root barrel

Make `@rdna/pixel/dither` importable as a subpath and surface the public types from `@rdna/pixel` itself (matching how `patterns` is exported).

**Files:**
- Create: `packages/pixel/src/dither.ts` (barrel, mirrors `src/patterns.ts`)
- Modify: `packages/pixel/src/index.ts` (root barrel)
- Modify: `packages/pixel/package.json` (exports map)

**Step 1: Write the failing integration test**

Create `packages/pixel/src/__tests__/dither-barrel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import * as pixel from '../index';
import * as dither from '../dither';

describe('@rdna/pixel dither barrel', () => {
  it('re-exports ditherRamp and bayerMatrix from the package root', () => {
    expect(typeof pixel.ditherRamp).toBe('function');
    expect(typeof pixel.bayerMatrix).toBe('function');
  });

  it('re-exports ditherRamp from the dither subpath barrel', () => {
    expect(typeof dither.ditherRamp).toBe('function');
    expect(typeof dither.ditherRampBits).toBe('function');
    expect(typeof dither.bayerMatrix).toBe('function');
  });

  it('root barrel ditherRamp matches the submodule ditherRamp', () => {
    expect(pixel.ditherRamp).toBe(dither.ditherRamp);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @rdna/pixel test -- dither-barrel
```

Expected: `ditherRamp` is undefined on `pixel` and `dither` module resolution fails.

**Step 3: Create the submodule barrel**

Create `packages/pixel/src/dither.ts`:

```ts
export { bayerMatrix } from './dither/bayer.js';
export { ditherRampBits } from './dither/ramp.js';
export { ditherRamp } from './dither/prepare.js';

export type { BayerMatrixSize } from './dither/bayer.js';
export type { DitherDirection, DitherRampOptions } from './dither/ramp.js';
export type { PreparedDitherRamp } from './dither/types.js';
```

**Step 4: Add root-barrel exports**

Modify `packages/pixel/src/index.ts` — append alongside the existing `patterns` block:

```ts
export { bayerMatrix, ditherRamp, ditherRampBits } from './dither.js';
export type {
  BayerMatrixSize,
  DitherDirection,
  DitherRampOptions,
  PreparedDitherRamp,
} from './dither.js';
```

**Step 5: Add package subpath**

Modify `packages/pixel/package.json` — add to the `"exports"` map (alphabetically near `./patterns`):

```json
"./dither": {
  "types": "./dist/dither.d.ts",
  "import": "./dist/dither.js"
},
```

**Step 6: Run test to verify it passes**

```bash
pnpm --filter @rdna/pixel test -- dither-barrel
pnpm --filter @rdna/pixel test
```

Expected: dither-barrel tests PASS; full suite still PASS.

**Step 7: Commit**

```bash
git add packages/pixel/src/dither.ts \
        packages/pixel/src/index.ts \
        packages/pixel/package.json \
        packages/pixel/src/__tests__/dither-barrel.test.ts
git commit -m "feat(@rdna/pixel): expose dither via root barrel and ./dither subpath export"
```

---

### Task 5: AppWindow consumer — replace linear-gradient with dither overlay

Swap the `shellStyle.background` linear-gradient for a solid `--color-window-chrome-to` base, and render an absolutely-positioned overlay `<div>` inside the shell whose `mask-image` is the dither ramp and whose `background-color` is `--color-window-chrome-from`. Dark mode currently flattens both chrome tokens to `--color-ink` → overlay becomes invisible (acceptable per brainstorm v1).

Start with a smoke test that the new overlay ships with the expected CSS pieces, then make it pass.

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx` (around line 1186–1192 and the standard-window render block)
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.test.tsx` (add one overlay-presence test)

Before editing, run:

```bash
git status -- packages/radiants/components/core/AppWindow
```

to confirm no conflicting uncommitted AppWindow work. (Per `git status` at plan time, `AppWindow.tsx` and `AppWindow.test.tsx` already have staged modifications on `feat/logo-asset-maker` — coordinate the overlay change with those edits rather than reverting them. If the existing edits already cover the overlay, skip to verification.)

**Step 1: Write the failing test**

Add to `packages/radiants/components/core/AppWindow/AppWindow.test.tsx` (inside the existing describe block that covers shell rendering — use the nearest test file's style, e.g. render an `<AppWindow open>` and query the DOM):

```tsx
it('renders a dither-chrome overlay inside standard (non-chromeless, non-mobile) window chrome', () => {
  render(
    <AppWindow
      open
      title="Test"
      onOpenChange={() => {}}
      presentation="window"
    >
      <div>content</div>
    </AppWindow>,
  );

  const overlay = document.querySelector<HTMLElement>('[data-appwindow-chrome-dither]');
  expect(overlay).not.toBeNull();
  expect(overlay!.style.maskRepeat || overlay!.style.webkitMaskRepeat).toBe('repeat');
  expect(overlay!.style.backgroundColor).toBe('var(--color-window-chrome-from)');
});
```

If the existing test file does not already import `render`/vitest DOM helpers, follow the file's existing pattern — do not introduce a new testing stack.

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @rdna/radiants test -- AppWindow
```

Expected: `overlay` is `null`.

**Step 3: Update `shellStyle` and render the overlay**

In `packages/radiants/components/core/AppWindow/AppWindow.tsx`:

1. At the top of the file, add the import:

   ```ts
   import { ditherRamp } from '@rdna/pixel/dither';
   ```

2. Just above `const shellStyle: AppWindowShellStyle = isChromelessWindow ? ...` (currently around line 1180) introduce a memoized ramp:

   ```ts
   const CHROME_DITHER = ditherRamp({ matrix: 8, steps: 10, direction: 'down' });
   ```

   Hoist to module scope (outside the component) so every window shares the cached asset.

3. Change the `shellStyle` assignment for non-chromeless windows from:

   ```ts
   background: isMobilePresentation
     ? 'var(--color-page)'
     : 'linear-gradient(0deg, var(--color-window-chrome-from) 0%, var(--color-window-chrome-to) 100%)',
   ```

   to:

   ```ts
   background: isMobilePresentation
     ? 'var(--color-page)'
     : 'var(--color-window-chrome-to)',
   ```

4. Inside the shell's JSX — at the same level where shell children render, before the title bar — add the overlay:

   ```tsx
   {!isMobilePresentation && !isChromelessWindow ? (
     <div
       aria-hidden
       data-appwindow-chrome-dither
       className="pointer-events-none absolute inset-0"
       style={{
         backgroundColor: 'var(--color-window-chrome-from)',
         ...CHROME_DITHER.style,
         // Override the `no-repeat`-oriented width/height that `maskHostStyle`
         // sets when `tiled: true` is off; tiled: true already strips those.
         // Scale the tile so one matrix cell ≈ 1 CSS px of the chrome band.
         maskSize: `${CHROME_DITHER.mask.maskWidth}px ${CHROME_DITHER.mask.maskHeight}px`,
         WebkitMaskSize: `${CHROME_DITHER.mask.maskWidth}px ${CHROME_DITHER.mask.maskHeight}px`,
         maskRepeat: 'repeat',
         WebkitMaskRepeat: 'repeat',
       }}
     />
   ) : null}
   ```

   - `data-appwindow-chrome-dither` gives tests + devtools a handle.
   - Overlay is position-absolute but the parent shell is already `position: relative` (set by `isStandardWindow` branch at line ~1215). If the parent shell is NOT the positioned ancestor in your final structure, wrap the overlay in a positioned container rather than changing the shell's positioning.
   - Scale experiment: if 1 CSS px per matrix cell is too fine, try `matrix * 2` px — document the chosen scale in the commit message.

5. **Lint discipline:** no new colors introduced. All semantic. If the eslint plugin flags the inline `backgroundColor` because it references `var(...)` directly, follow the existing exception pattern in `AppWindow.tsx` (there are existing semantic-color inline styles — match their style; do NOT add a disable comment unless one was already required).

**Step 4: Run test + full AppWindow suite + design-system lint**

```bash
pnpm --filter @rdna/radiants test -- AppWindow
pnpm lint:design-system
```

Expected: new test PASSES; lint passes with zero errors.

**Step 5: Manual visual verification**

Start dev:

```bash
pnpm dev
```

1. Open RadOS at `http://localhost:3000`, launch any app with a standard AppWindow (e.g. BrandAssets).
2. Confirm the chrome band shows a stepped yellow-on-cream stipple instead of the smooth gradient.
3. Toggle light ↔ dark mode. Dark mode chrome should flatten to solid ink (overlay invisible) — document any drift in the commit message.
4. Open three or four windows simultaneously — the tile should repeat cleanly (no per-window offset; cached ramp shared).
5. Resize a window — the ramp tile stays fixed; only more tiles appear.

**Step 6: Commit**

```bash
git add packages/radiants/components/core/AppWindow/AppWindow.tsx \
        packages/radiants/components/core/AppWindow/AppWindow.test.tsx
git commit -m "feat(AppWindow): replace chrome gradient with 8x8 Bayer dither overlay"
```

---

### Task 6: Playground — register a `dither` mode

Extend the `PixelMode` union, add mode config, and teach `getRegistryForMode` how to respond for dither (empty registry — no authored entries to browse).

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/types.ts`
- Modify: `apps/rad-os/components/apps/pixel-playground/constants.ts`
- Modify: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx` (MODE_ORDER list)

**Step 1: Write the failing test**

Create `apps/rad-os/components/apps/pixel-playground/__tests__/mode-config-dither.test.ts` (the `__tests__/` directory already exists under the playground):

```ts
import { describe, expect, it } from 'vitest';

import { MODE_CONFIG, getRegistryForMode } from '../constants';

describe('dither mode config', () => {
  it('registers the dither mode with sensible defaults', () => {
    expect(MODE_CONFIG.dither).toBeDefined();
    expect(MODE_CONFIG.dither.mode).toBe('dither');
    expect(MODE_CONFIG.dither.label).toBe('Dither');
    expect(MODE_CONFIG.dither.defaultSize).toBeGreaterThan(0);
  });

  it('returns an empty registry for dither mode', () => {
    expect(getRegistryForMode('dither')).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter rad-os test -- mode-config-dither
```

Expected: `MODE_CONFIG.dither` is undefined (TypeScript + runtime).

**Step 3: Extend the types**

In `apps/rad-os/components/apps/pixel-playground/types.ts`:

```ts
export type PixelMode = 'corners' | 'patterns' | 'icons' | 'dither';
```

**Step 4: Extend MODE_CONFIG and getRegistryForMode**

In `apps/rad-os/components/apps/pixel-playground/constants.ts`:

1. Add a `dither` entry to `MODE_CONFIG`:

   ```ts
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
   ```

2. Extend `getRegistryForMode`:

   ```ts
   export function getRegistryForMode(mode: PixelMode): readonly PixelGrid[] {
     switch (mode) {
       case 'patterns':
         return PATTERN_REGISTRY;
       case 'icons':
         return ICON_REGISTRY;
       case 'corners':
         return Object.values(CORNER_SETS).map((set) => set.tl);
       case 'dither':
         return [];
     }
   }
   ```

3. In `PixelPlayground.tsx`, update `MODE_ORDER`:

   ```ts
   const MODE_ORDER: ReadonlyArray<PixelMode> = ['corners', 'patterns', 'icons', 'dither'];
   ```

**Step 5: Run test to verify it passes**

```bash
pnpm --filter rad-os test -- mode-config-dither
```

Expected: both tests PASS.

**Step 6: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/types.ts \
        apps/rad-os/components/apps/pixel-playground/constants.ts \
        apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx \
        apps/rad-os/components/apps/pixel-playground/__tests__/mode-config-dither.test.ts
git commit -m "feat(pixel-playground): register dither mode + empty registry"
```

---

### Task 7: Playground — DitherPreview component

A self-contained component for the dither-mode preview slot. Owns three knobs (matrix size, step count, direction), calls `ditherRamp`, and renders:
- a "tile" preview (the raw `PixelGrid` bits rendered via an inline SVG at native pixel scale), and
- an "applied" preview (a mocked AppWindow-shell rectangle with `--color-window-chrome-to` base and the dither overlay using `--color-window-chrome-from`).

Keep knobs simple — `ToggleGroup` or `RadioGroup` for matrix + direction, a number input or stepper for steps.

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/previews/DitherPreview.tsx`
- Modify: `apps/rad-os/components/apps/pixel-playground/previews/ModePreview.tsx`

**Step 1: Write DitherPreview**

Create `apps/rad-os/components/apps/pixel-playground/previews/DitherPreview.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { bitsToMergedRects, ditherRamp, type BayerMatrixSize, type DitherDirection } from '@rdna/pixel';
import { RadioGroup } from '@rdna/radiants/components/core';

const MATRIX_SIZES: BayerMatrixSize[] = [2, 4, 8, 16];
const DIRECTIONS: DitherDirection[] = ['down', 'up'];

export function DitherPreview() {
  const [matrix, setMatrix] = useState<BayerMatrixSize>(8);
  const [steps, setSteps] = useState(10);
  const [direction, setDirection] = useState<DitherDirection>('down');

  const ramp = useMemo(
    () => ditherRamp({ matrix, steps, direction }),
    [matrix, steps, direction],
  );

  const rects = useMemo(
    () => bitsToMergedRects(ramp.grid.bits, ramp.grid.width, ramp.grid.height),
    [ramp.grid],
  );

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <span className="font-heading text-xs text-mute uppercase tracking-wide shrink-0">
        Dither ramp preview
      </span>

      {/* ── Knobs ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 shrink-0">
        <label className="flex flex-col gap-1">
          <span className="font-heading text-[10px] uppercase text-mute">Matrix</span>
          <RadioGroup
            value={String(matrix)}
            onValueChange={(v) => setMatrix(Number(v) as BayerMatrixSize)}
          >
            {MATRIX_SIZES.map((n) => (
              <RadioGroup.Item key={n} value={String(n)}>{n}×{n}</RadioGroup.Item>
            ))}
          </RadioGroup>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-heading text-[10px] uppercase text-mute">Steps</span>
          <input
            type="number"
            min={2}
            max={32}
            value={steps}
            onChange={(e) => {
              const next = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(next) && next >= 2 && next <= 32) setSteps(next);
            }}
            className="bg-depth text-main font-mono text-sm px-2 py-1 rounded-sm w-16"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-heading text-[10px] uppercase text-mute">Direction</span>
          <RadioGroup
            value={direction}
            onValueChange={(v) => setDirection(v as DitherDirection)}
          >
            {DIRECTIONS.map((d) => (
              <RadioGroup.Item key={d} value={d}>{d}</RadioGroup.Item>
            ))}
          </RadioGroup>
        </label>
      </div>

      {/* ── Tile preview ───────────────────────────────────────── */}
      <div
        className="shrink-0"
        style={{
          width: ramp.grid.width * 8,
          height: ramp.grid.height * 8,
          backgroundColor: 'var(--color-cream)',
          imageRendering: 'pixelated',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${ramp.grid.width} ${ramp.grid.height}`}
          shapeRendering="crispEdges"
          aria-label="Dither ramp tile"
        >
          {rects.map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill="var(--color-sun-yellow)"
            />
          ))}
        </svg>
      </div>

      {/* ── Applied preview (mock chrome band) ─────────────────── */}
      <div className="flex-1 min-h-0 relative" style={{ backgroundColor: 'var(--color-window-chrome-to)' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: 'var(--color-window-chrome-from)',
            ...ramp.style,
            maskSize: `${ramp.mask.maskWidth}px ${ramp.mask.maskHeight}px`,
            WebkitMaskSize: `${ramp.mask.maskWidth}px ${ramp.mask.maskHeight}px`,
            maskRepeat: 'repeat',
            WebkitMaskRepeat: 'repeat',
          }}
        />
      </div>
    </div>
  );
}
```

**Step 2: Wire into ModePreview**

Modify `apps/rad-os/components/apps/pixel-playground/previews/ModePreview.tsx`:

```tsx
import { DitherPreview } from './DitherPreview';
// ...
export function ModePreview({ mode, grid, selectedEntry = null }: ModePreviewProps) {
  if (mode === 'patterns') return <PatternPreview grid={grid} />;
  if (mode === 'corners') return <CornerPreview grid={grid} />;
  if (mode === 'dither') return <DitherPreview />;
  return <IconPreview grid={grid} selectedEntry={selectedEntry} />;
}
```

**Step 3: Lint**

```bash
pnpm lint:design-system
```

Expected: zero errors. If the inline `fill="var(--color-sun-yellow)"` on SVG rects is flagged by `rdna/no-hardcoded-colors`, check how `PatternPreview.tsx` handles the same rule (it adds a scoped exception comment with owner/expires/issue metadata) and mirror that pattern.

**Step 4: Manual verification**

```bash
pnpm dev
```

1. Open the Pixel Playground app in RadOS.
2. Switch to the `Dither` mode via ModeNav.
3. Tweak matrix/steps/direction; both tile + applied previews update live.
4. Confirm the applied preview visually matches the AppWindow chrome from Task 5 when matrix=8, steps=10, direction='down'.

**Step 5: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/previews/DitherPreview.tsx \
        apps/rad-os/components/apps/pixel-playground/previews/ModePreview.tsx
git commit -m "feat(pixel-playground): add DitherPreview with matrix/steps/direction knobs"
```

---

### Task 8: Playground — code-gen for dither mode

Teach `pixel-code-gen.ts` how to emit code for the current dither configuration. Because dither mode currently doesn't push values through the shared `grid`/`currentGrid` flow, we expose the current knobs via a narrow escape hatch: pass an optional `dither: { matrix, steps, direction }` meta field on the grid name, OR (simpler) add a parallel `generateDitherCode` helper called directly from `DitherPreview`.

The **simpler path** is a parallel helper; the `PixelCodeOutput` "Prompt / Snippet / Bitstring / SVG" toggle is already tied to the canvas grid and we don't want to perturb the canvas flow.

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/dither-code-gen.ts`
- Create: `apps/rad-os/components/apps/pixel-playground/__tests__/dither-code-gen.test.ts`
- Modify: `apps/rad-os/components/apps/pixel-playground/previews/DitherPreview.tsx` (render output + copy button)

**Step 1: Write the failing test**

Create `apps/rad-os/components/apps/pixel-playground/__tests__/dither-code-gen.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { generateDitherCode } from '../dither-code-gen';

describe('generateDitherCode', () => {
  it('snippet format emits a ready-to-paste ditherRamp call', () => {
    expect(
      generateDitherCode('snippet', { matrix: 8, steps: 10, direction: 'down' }),
    ).toBe(`ditherRamp({ matrix: 8, steps: 10, direction: 'down' })`);
  });

  it('prompt format explains where to consume the ramp', () => {
    const out = generateDitherCode('prompt', { matrix: 4, steps: 6, direction: 'up' });
    expect(out).toContain("import { ditherRamp } from '@rdna/pixel/dither'");
    expect(out).toContain('matrix: 4');
    expect(out).toContain('steps: 6');
    expect(out).toContain("direction: 'up'");
  });

  it('bitstring format returns the raw tile bits grouped by row', () => {
    const out = generateDitherCode('bitstring', { matrix: 2, steps: 2, direction: 'down' });
    // 4 rows total, 2 chars wide each
    expect(out.split('\n')).toHaveLength(4);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter rad-os test -- dither-code-gen
```

Expected: module not found.

**Step 3: Write the generator**

Create `apps/rad-os/components/apps/pixel-playground/dither-code-gen.ts`:

```ts
import { ditherRamp, type DitherRampOptions } from '@rdna/pixel';

export type DitherOutputFormat = 'prompt' | 'snippet' | 'bitstring';

export function generateDitherCode(
  format: DitherOutputFormat,
  options: DitherRampOptions,
): string {
  switch (format) {
    case 'snippet':
      return `ditherRamp({ matrix: ${options.matrix}, steps: ${options.steps}, direction: '${options.direction}' })`;
    case 'prompt':
      return [
        `Use this dither ramp preset:`,
        ``,
        `  import { ditherRamp } from '@rdna/pixel/dither';`,
        ``,
        `  const ramp = ditherRamp({ matrix: ${options.matrix}, steps: ${options.steps}, direction: '${options.direction}' });`,
        ``,
        `Render as an absolutely-positioned overlay whose background-color is the fill`,
        `token and whose mask comes from ramp.style — stacked over a base element whose`,
        `background-color is the base token. See packages/radiants/components/core/AppWindow.`,
      ].join('\n');
    case 'bitstring': {
      const { grid } = ditherRamp(options);
      const lines: string[] = [];
      for (let y = 0; y < grid.height; y++) {
        const row: string[] = [];
        for (let x = 0; x < grid.width; x++) {
          row.push(grid.bits.charAt(y * grid.width + x) === '1' ? '■' : '·');
        }
        lines.push(row.join(' '));
      }
      return lines.join('\n');
    }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter rad-os test -- dither-code-gen
```

Expected: all 3 tests PASS.

**Step 5: Surface the output in the preview**

Extend `DitherPreview.tsx` — add a small output block below the applied preview with a format toggle + Copy button. Match the structure of `PixelCodeOutput.tsx` (header row with Copy button, `<pre>` body, `<ToggleGroup>` footer). Do not refactor `PixelCodeOutput` — this is a dither-local readout for v1.

Keep the addition tight:

```tsx
import { useState } from 'react';
import { Button, ToggleGroup } from '@rdna/radiants/components/core';
import { generateDitherCode, type DitherOutputFormat } from '../dither-code-gen';

// inside DitherPreview, alongside the existing knobs + previews:
const [format, setFormat] = useState<DitherOutputFormat>('snippet');
const [copied, setCopied] = useState(false);
const code = generateDitherCode(format, { matrix, steps, direction });

const handleCopy = async () => {
  await navigator.clipboard.writeText(code);
  setCopied(true);
  setTimeout(() => setCopied(false), 1500);
};
```

Render below the applied preview:

```tsx
<div className="shrink-0 flex flex-col gap-2">
  <div className="flex items-center justify-between">
    <span className="font-heading text-xs text-mute uppercase tracking-wide">Output</span>
    <Button
      size="sm"
      icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'}
      onClick={handleCopy}
    >
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  </div>
  <pre className="font-mono text-xs text-sub bg-depth p-3 whitespace-pre-wrap">{code}</pre>
  <ToggleGroup
    value={[format]}
    onValueChange={(vals) => { if (vals.length) setFormat(vals[0] as DitherOutputFormat); }}
    size="sm"
  >
    <ToggleGroup.Item value="snippet">Snippet</ToggleGroup.Item>
    <ToggleGroup.Item value="prompt">Prompt</ToggleGroup.Item>
    <ToggleGroup.Item value="bitstring">Bitstring</ToggleGroup.Item>
  </ToggleGroup>
</div>
```

**Step 6: Manual verification**

```bash
pnpm dev
```

1. Open the Playground → Dither mode.
2. Change knobs; confirm the output readout updates.
3. Click Copy; paste into a scratch file — the snippet is syntactically valid TS.

**Step 7: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/dither-code-gen.ts \
        apps/rad-os/components/apps/pixel-playground/__tests__/dither-code-gen.test.ts \
        apps/rad-os/components/apps/pixel-playground/previews/DitherPreview.tsx
git commit -m "feat(pixel-playground): add dither-mode code-gen with snippet/prompt/bitstring"
```

---

### Task 9: Sanity sweep — full test + lint + manual QA

**Step 1: Run all affected test suites**

```bash
pnpm --filter @rdna/pixel test
pnpm --filter rad-os test
pnpm --filter @rdna/radiants test
```

Expected: green across the board.

**Step 2: Design-system lint**

```bash
pnpm lint:design-system
```

Expected: zero errors. (Warnings are fine if they pre-exist.)

**Step 3: Full build (catches subpath export + tsconfig mismatches)**

```bash
pnpm --filter @rdna/pixel build
```

Expected: clean build; `dist/dither.js` and `dist/dither.d.ts` present.

```bash
ls packages/pixel/dist/dither*
```

Expected: 2 files (`dither.js` and `dither.d.ts`). If the submodule split produced extra files, verify the package.json subpath still resolves.

**Step 4: Manual QA checklist**

Run `pnpm dev` and verify:

- [ ] AppWindow chrome shows stepped yellow-on-cream dither (light mode).
- [ ] AppWindow chrome is solid ink in dark mode (overlay invisible).
- [ ] Overlay is crisp at 100% zoom and at 125% / 150% browser zoom.
- [ ] Playground dither mode renders; knobs react instantly; copy button copies.
- [ ] Switching modes in the playground never throws a console error.
- [ ] Other playground modes (corners/patterns/icons) still work unchanged.

**Step 5: Commit any fix-ups (if any) and tag**

If any task required follow-up fixes caught in the sweep, commit them now with a single `chore: post-dither sweep` commit.

---

### Task 10: Brainstorm status + changelog note

Mark the brainstorm doc as shipped and leave one breadcrumb for future consumers.

**Files:**
- Modify: `archive/brainstorms-ideas-ops-audit-2026-04-25/docs/brainstorms/2026-04-24-pixel-dither-brainstorm.md`

**Step 1: Update status**

Flip the front-matter line from `**Status:** Decided — ready for /wf-plan` to `**Status:** Shipped in feat/logo-asset-maker — <commit-sha-of-task-5>` (the AppWindow commit is the visible user-facing milestone).

Optionally append a short "## Shipped As" section listing the file entry points:

```markdown
## Shipped As

- `@rdna/pixel/dither` — `packages/pixel/src/dither/{bayer,ramp,prepare,types}.ts`
- `AppWindow` consumer — `packages/radiants/components/core/AppWindow/AppWindow.tsx`
- Playground mode — `apps/rad-os/components/apps/pixel-playground/previews/DitherPreview.tsx`
```

**Step 2: Commit**

```bash
git add archive/brainstorms-ideas-ops-audit-2026-04-25/docs/brainstorms/2026-04-24-pixel-dither-brainstorm.md
git commit -m "docs: mark pixel-dither brainstorm as shipped"
```

---

## Done Criteria

- `pnpm --filter @rdna/pixel test` green, including all new dither tests.
- `pnpm --filter @rdna/pixel build` emits `dist/dither.js` and `dist/dither.d.ts`.
- `import { ditherRamp } from '@rdna/pixel/dither'` resolves in both rad-os and radiants workspaces.
- AppWindow renders a dither overlay in light mode; no visual regression in dark mode.
- Playground has a fourth `Dither` mode with knobs + tile preview + applied preview + copy-out output.
- `pnpm lint:design-system` clean.
