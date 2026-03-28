# Radiants Pixel Corners Generator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Replace hand-authored pixel-corner geometry with a config-driven generator that reproduces current output exactly, supports arbitrary per-corner composition, and keeps manual shadow/focus utilities hand-authored.

**Architecture:** Split `packages/radiants/pixel-corners.css` into a thin hand-authored shell plus a checked-in generated file. The generated file contains both shared base styles (which depend on which variants exist) and per-variant clip-path geometry. The generator reads a config of reusable corner profiles (defined as TL corner point sequences) and composed variants, then emits three clip-paths per variant: element, wrapper inner clip, and `::after` border ring. V1 supports explicit corner-slot composition and edge masks; runtime-size-aware `rounded-full` style stair-stepping is a separate research track and must not be approximated silently in the initial rollout.

**Tech Stack:** CSS, Node ESM scripts, Vitest, pnpm workspaces

**Worktree:** Create with `git worktree add .claude/worktrees/pixel-corners-generator -b feat/pixel-corners-generator` from repo root.

**Reference:** [Pixel Corners Calculator](https://pixelcorners.lukeb.co.uk/) — use to verify corner coordinates for new profiles. Based on [Luke Morrigan's technique](https://codefoodpixels.com/blog/2022/01/17/pixelated-rounded-corners-with-css-clip-path/).

---

## Success Criteria

1. `packages/radiants/pixel-corners.generated.css` is the only generated artifact and is checked into git.
2. `packages/radiants/pixel-corners.css` keeps only hand-authored imports/utilities: shadow utilities, border-color overrides, and focus-ring rules.
3. Current shipped variants (`xs`, `sm`, `md`, `lg`, `xl`, `t-sm-b-md`, `l-sm`, `sm-notl`, `pixel-corners`) are emitted from config with no visual drift.
4. The config supports four independent corner slots, so one-corner variants are possible without hand-writing polygon strings.
5. Border omissions are expressed as a generic edge mask, not one-off booleans like `noBorderRight`.
6. The generator is deterministic and covered by tests.
7. `rounded-full` / size-aware stair-stepping is explicitly documented as unsupported in V1 unless a separate runtime strategy is approved.

## Current Problems To Eliminate

- `packages/radiants/pixel-corners.css` duplicates the same geometry three times per variant: element, wrapper inner clip, and `::after` ring.
- One-off shapes have started accumulating as handwritten polygons at the bottom of the file.
- There is no deterministic generation path, so adding a new variant means editing long polygon strings by hand.
- The current API does not scale cleanly to "only one corner is rounded" or other arbitrary corner combinations.
- Compound variants (`t-sm-b-md`, `l-sm`, `sm-notl`) re-declare their own `::after` boilerplate instead of sharing base styles.
- A future `rounded-full` / pill / circle story is easy to hand-wave about but does not fit a static generator unless the runtime-size problem is addressed explicitly.

## Target Model

### Generated File

`packages/radiants/pixel-corners.generated.css` contains everything that depends on which variants exist:

- **Shared base styles:**
  - `::after` pseudo-element boilerplate (content, position, z-index, background, pointer-events, margin)
  - `position: relative` on all element and wrapper selectors
  - `border: 1px solid transparent` on all element selectors
  - `border-radius` fallbacks per variant
  - Wrapper `width/height: fit-content`
  - Wrapper inner `display: block`
- **Per-variant geometry:**
  - Outer clip-path (element + wrapper)
  - Wrapper inner clip-path
  - Border-ring clip-path (`::after`)

The generated file includes a comment about the `position: relative` rule:

```css
/* position: relative is required for the ::after border pseudo-element.
   Consumers that need absolute/fixed positioning (e.g. AppWindow) must
   override with an inline style: style={{ position: 'absolute' }} */
```

### Hand-Authored Shell

`packages/radiants/pixel-corners.css` contains only:

- `@import './pixel-corners.generated.css';`
- Shadow utilities (`.pixel-shadow-*`)
- Border color overrides (`.pixel-border-danger::after`)
- Focus-ring rules (`:focus-visible`)

### Profile Model

Profiles store the **TL corner point sequence** as authored source of truth. The sequence traces the corner outline from bottom-left to top-right (left edge → top edge). The generator mirrors TL → TR/BR/BL mechanically using `calc(100% - N)`.

```js
export const PIXEL_CORNER_PROFILES = {
  xs: {
    radius: 2,
    borderRadius: '2px',
    points: [[0,2], [1,2], [1,1], [2,1], [2,0]],
  },
  sm: {
    radius: 4,
    borderRadius: '6px',
    points: [[0,5], [1,5], [1,3], [2,3], [2,2], [3,2], [3,1], [5,1], [5,0]],
  },
  md: {
    radius: 6,
    borderRadius: '6px',
    points: [
      [0,9], [1,9], [1,8], [1,6], [2,6], [2,5], [3,5], [3,4],
      [4,3], [5,3], [5,2], [6,2], [6,1], [8,1], [9,1], [9,0],
    ],
  },
  lg: {
    radius: 8,
    borderRadius: '8px',
    points: [
      [0,12], [1,12], [1,9], [2,9], [2,8], [3,8], [3,7], [3,6],
      [4,6], [4,5], [5,4], [6,4], [6,3], [7,3], [8,3], [8,2],
      [9,2], [9,1], [12,1], [12,0],
    ],
  },
  xl: {
    radius: 16,
    borderRadius: '16px',
    points: [
      [0,19], [1,19], [1,16], [2,16], [2,15], [2,13], [3,13], [3,12],
      [4,12], [4,11], [4,10], [5,10], [5,9], [6,9], [6,8], [7,8],
      [7,7], [8,7], [8,6], [9,6], [9,5], [10,5], [10,4], [11,4],
      [12,4], [12,3], [13,3], [13,2], [15,2], [16,2], [16,1], [19,1], [19,0],
    ],
  },
};
```

Implementation rules:

- `points` is authoritative for shipped profiles — locked to existing art direction
- `radius` is metadata for documentation and the calculator reference
- `borderRadius` is the CSS `border-radius` fallback value (not always equal to radius)
- A helper may derive `points` from `radius` when `points` is omitted (for future convenience), but shipped profiles must keep explicit `points` arrays

### Config Model

Variants compose four corner slots referencing profile IDs or `'square'`:

```js
export const PIXEL_CORNER_CONFIG = {
  profiles: PIXEL_CORNER_PROFILES,
  variants: [
    {
      name: 'sm',
      selectors: ['.pixel-rounded-sm'],
      wrapperSelector: '.pixel-rounded-sm--wrapper',
      corners: { tl: 'sm', tr: 'sm', br: 'sm', bl: 'sm' },
    },
    {
      name: 'lg',
      selectors: ['.pixel-rounded-lg', '.pixel-corners'],
      wrapperSelector: '.pixel-rounded-lg--wrapper',
      wrapperAliases: ['.pixel-corners--wrapper'],
      corners: { tl: 'lg', tr: 'lg', br: 'lg', bl: 'lg' },
    },
    {
      name: 'l-sm',
      selectors: ['.pixel-rounded-l-sm'],
      corners: { tl: 'sm', tr: 'square', br: 'square', bl: 'sm' },
      edges: { top: true, right: false, bottom: true, left: true },
    },
  ],
};
```

Edge visibility is explicit — defaults to all `true`:

```js
edges: { top: true, right: true, bottom: true, left: true }
```

Current special cases become normal config:
  - `t-sm-b-md`: top corners = `sm`, bottom corners = `md`
  - `l-sm`: left corners = `sm`, right corners = `square`, `edges.right: false`
  - `sm-notl`: TL = `square`, TR/BR/BL = `sm`

## Explicit Non-Goals For V1

- Do not implement runtime-size-aware pixel corners.
- Do not reinterpret `rounded-full` as a generated pixel class.
- Do not ship an `auto` mode that guesses based on `border-radius: 9999px`.

Reason:

- the current system is static CSS generation
- true circle/pill stair-stepping depends on rendered width and height
- that requires either runtime measurement, SVG/mask infrastructure, or a different rendering model

If someone tries to add `mode: 'auto'` or `profile: 'full'` to the generator config in V1, the generator should throw with a clear error that points to the follow-up design decision.

---

## Phase 1: Split Manual CSS From Generated Geometry

### Task 1: Create the generated CSS boundary

**Files:**
- Create: `packages/radiants/pixel-corners.generated.css`
- Create: `packages/radiants/test/pixel-corners-generator.test.ts`
- Modify: `packages/radiants/pixel-corners.css`

**Step 1: Write the failing tests**

Create `packages/radiants/test/pixel-corners-generator.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '..');
const shellCssPath = join(root, 'pixel-corners.css');
const generatedCssPath = join(root, 'pixel-corners.generated.css');

describe('pixel corners file layout', () => {
  it('keeps a checked-in generated geometry file', () => {
    expect(existsSync(generatedCssPath)).toBe(true);
  });

  it('keeps manual utilities in the shell file', () => {
    const shellCss = readFileSync(shellCssPath, 'utf8');
    expect(shellCss).toContain("@import './pixel-corners.generated.css';");
    expect(shellCss).toContain('.pixel-shadow-surface');
    expect(shellCss).toContain('.pixel-border-danger::after');
    expect(shellCss).toContain(':focus-visible');
  });

  it('does not contain geometry in the shell file', () => {
    const shellCss = readFileSync(shellCssPath, 'utf8');
    expect(shellCss).not.toContain('clip-path');
    expect(shellCss).not.toContain('position: relative');
  });
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- FAIL because `pixel-corners.generated.css` does not exist yet and `pixel-corners.css` does not import it.

**Step 3: Split the current CSS**

Move into `packages/radiants/pixel-corners.generated.css`:
- Shared base styles (lines 17-67): `::after` boilerplate, `position: relative`, `border`, `border-radius`, wrapper `fit-content`, wrapper inner `display: block`
- All geometry sections: XS through XL outer/inner/ring clip-paths
- All compound variant sections: `t-sm-b-md`, `l-sm`, `sm-notl` — including their `::after` boilerplate and `position: relative` (will be unified into shared selectors by the generator later)

Leave in `packages/radiants/pixel-corners.css`:
- `@import './pixel-corners.generated.css';` at the top
- Shadow utilities (`.pixel-shadow-*`)
- Border color overrides (`.pixel-border-danger::after`)
- Focus-ring rules (`:focus-visible`)

Keep the current runtime contract unchanged for `packages/radiants/index.css`.

**Step 4: Run the test to verify it passes**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/radiants/pixel-corners.css packages/radiants/pixel-corners.generated.css packages/radiants/test/pixel-corners-generator.test.ts
git commit -m "refactor(radiants): split pixel-corner geometry from manual utilities"
```

## Phase 2: Lock The Generator Contract With Tests

### Task 2: Define the config and generator API in tests first

**Files:**
- Create: `packages/radiants/scripts/pixel-corners.config.mjs`
- Create: `packages/radiants/scripts/pixel-corners-lib.mjs`
- Modify: `packages/radiants/test/pixel-corners-generator.test.ts`

**Step 1: Write the failing tests**

Extend `packages/radiants/test/pixel-corners-generator.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('generator contract', () => {
  it('reproduces the checked-in generated CSS from config', async () => {
    const { PIXEL_CORNER_CONFIG } = await import('../scripts/pixel-corners.config.mjs');
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');
    const expected = readFileSync(generatedCssPath, 'utf8');

    expect(renderPixelCornersGeneratedCss(PIXEL_CORNER_CONFIG)).toBe(expected);
  });

  it('supports a single rounded corner without handwritten polygons', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    const css = renderPixelCornersGeneratedCss({
      profiles: {
        sm: {
          radius: 4,
          borderRadius: '6px',
          points: [[0,5], [1,5], [1,3], [2,3], [2,2], [3,2], [3,1], [5,1], [5,0]],
        },
      },
      variants: [
        {
          name: 'tl-sm',
          selectors: ['.pixel-rounded-tl-sm'],
          corners: { tl: 'sm', tr: 'square', br: 'square', bl: 'square' },
          edges: { top: true, right: true, bottom: true, left: true },
        },
      ],
    });

    expect(css).toContain('.pixel-rounded-tl-sm');
    expect(css).toContain('clip-path');
  });

  it('rejects unsupported auto-sized profiles in v1', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    expect(() =>
      renderPixelCornersGeneratedCss({
        profiles: {},
        variants: [
          {
            name: 'auto-pill',
            mode: 'auto',
            selectors: ['.pixel-rounded-auto-pill'],
            corners: { tl: 'square', tr: 'square', br: 'square', bl: 'square' },
          },
        ],
      }),
    ).toThrow(/auto-sized pixel corners are not supported in v1/i);
  });
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- FAIL because the config and generator modules do not exist.

**Step 3: Create minimal stubs**

Create:

```js
// packages/radiants/scripts/pixel-corners.config.mjs
export const PIXEL_CORNER_CONFIG = {
  profiles: {},
  variants: [],
};
```

```js
// packages/radiants/scripts/pixel-corners-lib.mjs
export function renderPixelCornersGeneratedCss() {
  throw new Error('Not implemented');
}
```

**Step 4: Run the test again**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- FAIL with implementation errors instead of missing-module errors.

**Step 5: Commit**

```bash
git add packages/radiants/scripts/pixel-corners.config.mjs packages/radiants/scripts/pixel-corners-lib.mjs packages/radiants/test/pixel-corners-generator.test.ts
git commit -m "test(radiants): define pixel-corners generator contract"
```

## Phase 3: Build The Geometry Composer

### Task 3: Implement TL corner mirroring and corner-slot composition

**Files:**
- Modify: `packages/radiants/scripts/pixel-corners-lib.mjs`
- Modify: `packages/radiants/test/pixel-corners-generator.test.ts`

**Step 1: Write focused failing tests for composition**

Add tests that assert:

- A profile's TL points are correctly mirrored to TR, BR, BL
- `'square'` resolves to a right-angle corner (no staircase)
- Mixed corner profiles produce valid composite polygons
- Edge masks remove only border-ring edges and do not change the outer element shape

```ts
describe('corner mirroring', () => {
  it('mirrors TL points to TR using calc(100% - x)', async () => {
    const { mirrorTR } = await import('../scripts/pixel-corners-lib.mjs');
    const tl = [[0,5], [1,5], [1,3], [2,3], [2,2], [3,2], [3,1], [5,1], [5,0]];
    const tr = mirrorTR(tl);

    // TR corner: x is flipped, y stays, points trace top-right to bottom-right
    expect(tr[0]).toEqual(['calc(100% - 5px)', '0px']);
    expect(tr[tr.length - 1]).toEqual(['100%', '5px']);
  });
});

describe('variant composition', () => {
  it('supports mixed corner profiles', async () => {
    const { composeVariantGeometry } = await import('../scripts/pixel-corners-lib.mjs');

    const profiles = {
      sm: {
        radius: 4,
        borderRadius: '6px',
        points: [[0,5], [1,5], [1,3], [2,3], [2,2], [3,2], [3,1], [5,1], [5,0]],
      },
    };

    const geometry = composeVariantGeometry(
      {
        name: 'l-sm',
        selectors: ['.pixel-rounded-l-sm'],
        corners: { tl: 'sm', tr: 'square', br: 'square', bl: 'sm' },
        edges: { top: true, right: false, bottom: true, left: true },
      },
      profiles,
    );

    expect(geometry.outer).toBeTruthy();
    expect(geometry.ring).toBeTruthy();
    // Square corners should produce straight edges (no calc() needed)
    expect(geometry.outer).toContain('100% 0px');
  });

  it('rejects auto mode', async () => {
    const { composeVariantGeometry } = await import('../scripts/pixel-corners-lib.mjs');

    expect(() =>
      composeVariantGeometry(
        { name: 'auto', mode: 'auto', selectors: [], corners: { tl: 'square', tr: 'square', br: 'square', bl: 'square' } },
        {},
      ),
    ).toThrow(/auto-sized pixel corners are not supported in v1/i);
  });
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- FAIL because composition helpers are not implemented.

**Step 3: Implement the corner mirroring and variant composer**

Implement in `packages/radiants/scripts/pixel-corners-lib.mjs`:

```js
/**
 * Format a coordinate value as CSS.
 * 0 → '0px', N → 'Npx', 'calc(...)' passthrough.
 */
function px(v) {
  return typeof v === 'string' ? v : `${v}px`;
}

/**
 * Mirror TL points → TR (flip x, keep y, reverse order).
 * TL traces left-edge → top-edge. TR traces top-edge → right-edge.
 */
export function mirrorTR(tlPoints) {
  return [...tlPoints]
    .reverse()
    .map(([x, y]) => [x === 0 ? '100%' : `calc(100% - ${x}px)`, px(y)]);
}

/**
 * Mirror TL points → BR (flip both x and y, keep order).
 * BR traces right-edge → bottom-edge.
 */
export function mirrorBR(tlPoints) {
  return tlPoints.map(([x, y]) => [
    x === 0 ? '100%' : `calc(100% - ${x}px)`,
    y === 0 ? '100%' : `calc(100% - ${y}px)`,
  ]);
}

/**
 * Mirror TL points → BL (flip y, keep x, reverse order).
 * BL traces bottom-edge → left-edge.
 */
export function mirrorBL(tlPoints) {
  return [...tlPoints]
    .reverse()
    .map(([x, y]) => [px(x), y === 0 ? '100%' : `calc(100% - ${y}px)`]);
}

/** TL points formatted as CSS strings. */
export function formatTL(tlPoints) {
  return tlPoints.map(([x, y]) => [px(x), px(y)]);
}

/** Square corner: two points forming a right angle at the given position. */
function squareCorner(position) {
  switch (position) {
    case 'tl': return [['0px', '0px']];
    case 'tr': return [['100%', '0px']];
    case 'br': return [['100%', '100%']];
    case 'bl': return [['0px', '100%']];
  }
}

function resolveCorner(slot, position, profiles) {
  if (slot === 'square') return squareCorner(position);
  const profile = profiles[slot];
  if (!profile) throw new Error(`Unknown profile: ${slot}`);
  switch (position) {
    case 'tl': return formatTL(profile.points);
    case 'tr': return mirrorTR(profile.points);
    case 'br': return mirrorBR(profile.points);
    case 'bl': return mirrorBL(profile.points);
  }
}

function defaultEdges() {
  return { top: true, right: true, bottom: true, left: true };
}

export function composeVariantGeometry(variant, profiles) {
  if (variant.mode === 'auto') {
    throw new Error('Auto-sized pixel corners are not supported in v1. See follow-up track in the pixel-corners generator plan.');
  }

  const { corners, edges = defaultEdges() } = variant;
  const tl = resolveCorner(corners.tl, 'tl', profiles);
  const tr = resolveCorner(corners.tr, 'tr', profiles);
  const br = resolveCorner(corners.br, 'br', profiles);
  const bl = resolveCorner(corners.bl, 'bl', profiles);

  const outerPoints = [...bl, ...tl, ...tr, ...br];
  const outer = outerPoints.map(([x, y]) => `${x} ${y}`).join(', ');

  // Inner clip: offset by 1px inward from each edge
  const inner = buildInnerPolygon(corners, profiles);

  // Ring: outer path + cutout at 50% seam + inner path (with edge mask)
  const ring = buildRingPolygon(outerPoints, corners, profiles, edges);

  return { outer, inner, ring };
}
```

The `buildInnerPolygon` and `buildRingPolygon` helpers offset each corner's points by 1px inward (the border width) and handle the edge-mask omissions for the ring. The ring polygon uses the standard "outer path → 50% seam → inner path → 50% seam" technique to create a 1px border shape.

**Step 4: Run the test to verify it passes**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- PASS for the focused composition cases

**Step 5: Commit**

```bash
git add packages/radiants/scripts/pixel-corners-lib.mjs packages/radiants/test/pixel-corners-generator.test.ts
git commit -m "feat(radiants): compose pixel-corner variants from reusable corner profiles"
```

## Phase 4: Add The Generator Script And Check In Generated Output

### Task 4: Wire a CLI script that writes the generated CSS artifact

**Files:**
- Create: `packages/radiants/scripts/generate-pixel-corners.mjs`
- Modify: `packages/radiants/package.json`
- Modify: `packages/radiants/scripts/pixel-corners-lib.mjs`

**Step 1: Write the failing test**

Add a test that asserts the checked-in generated CSS exactly matches the renderer output:

```ts
it('keeps the checked-in generated css in sync', async () => {
  const { PIXEL_CORNER_CONFIG } = await import('../scripts/pixel-corners.config.mjs');
  const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');
  const expected = readFileSync(generatedCssPath, 'utf8');

  expect(renderPixelCornersGeneratedCss(PIXEL_CORNER_CONFIG)).toBe(expected);
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- FAIL until the real config is populated and the renderer returns the checked-in output.

**Step 3: Implement the full renderer**

The `renderPixelCornersGeneratedCss(config)` function should emit:

1. A stable banner:
```css
/* AUTO-GENERATED FILE. DO NOT EDIT.
   Source: scripts/pixel-corners.config.mjs
   Run: pnpm --filter @rdna/radiants generate:pixel-corners
   Calculator: https://pixelcorners.lukeb.co.uk/
*/
```

2. A note about the `position: relative` interaction:
```css
/* position: relative is required for the ::after border pseudo-element.
   Consumers that need absolute/fixed positioning (e.g. AppWindow) must
   override with an inline style: style={{ position: 'absolute' }} */
```

3. Shared base styles — collected from all variants:
   - `::after` boilerplate for all element + wrapper selectors
   - `position: relative` for all element + wrapper selectors
   - `border: 1px solid transparent` for all element selectors
   - `border-radius` per variant (using the profile's `borderRadius` value)
   - `width/height: fit-content` for all wrapper selectors
   - `display: block` for all `wrapper > element` pairs

4. Per-variant geometry blocks:
   - Outer clip-path (element + wrapper selectors)
   - Wrapper inner clip-path (wrapper > element selector)
   - Ring clip-path (`::after` selectors)

**Step 4: Create the CLI script**

Create `packages/radiants/scripts/generate-pixel-corners.mjs`:

```js
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PIXEL_CORNER_CONFIG } from './pixel-corners.config.mjs';
import { renderPixelCornersGeneratedCss } from './pixel-corners-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'pixel-corners.generated.css');
writeFileSync(outputPath, renderPixelCornersGeneratedCss(PIXEL_CORNER_CONFIG));
console.log(`Generated ${outputPath}`);
```

Update `packages/radiants/package.json` scripts:

```json
{
  "scripts": {
    "generate:icons": "node scripts/generate-icons.mjs",
    "generate:pixel-corners": "node scripts/generate-pixel-corners.mjs",
    "generate:schemas": "tsx ../preview/src/generate-schemas.ts ./components/core"
  }
}
```

**Step 5: Run the generator**

Run:

```bash
pnpm --filter @rdna/radiants generate:pixel-corners
```

Expected:
- writes `packages/radiants/pixel-corners.generated.css`

**Step 6: Run the tests**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- PASS

**Step 7: Commit**

```bash
git add packages/radiants/scripts/generate-pixel-corners.mjs packages/radiants/scripts/pixel-corners.config.mjs packages/radiants/scripts/pixel-corners-lib.mjs packages/radiants/package.json packages/radiants/pixel-corners.generated.css packages/radiants/test/pixel-corners-generator.test.ts
git commit -m "feat(radiants): add pixel-corners css generator"
```

## Phase 5: Encode Current Variants In Config And Remove Handwritten Geometry

### Task 5: Move all current shapes into config and verify zero drift

**Files:**
- Modify: `packages/radiants/scripts/pixel-corners.config.mjs`
- Modify: `packages/radiants/pixel-corners.generated.css`
- Modify: `packages/radiants/test/pixel-corners-generator.test.ts`

**Step 1: Write the failing tests**

Add assertions that the config includes the currently shipped shapes:

```ts
it('covers all currently shipped pixel corner variants', async () => {
  const { PIXEL_CORNER_CONFIG } = await import('../scripts/pixel-corners.config.mjs');
  const names = PIXEL_CORNER_CONFIG.variants.map((variant) => variant.name);

  expect(names).toEqual(
    expect.arrayContaining([
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
      't-sm-b-md',
      'l-sm',
      'sm-notl',
    ]),
  );
});

it('includes .pixel-corners as an alias for lg', async () => {
  const { PIXEL_CORNER_CONFIG } = await import('../scripts/pixel-corners.config.mjs');
  const lg = PIXEL_CORNER_CONFIG.variants.find((v) => v.name === 'lg');

  expect(lg.selectors).toContain('.pixel-corners');
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- FAIL because the config is not populated yet.

**Step 3: Populate the real profiles and variants**

Update `packages/radiants/scripts/pixel-corners.config.mjs` with all profiles and variants:

```js
export const PIXEL_CORNER_PROFILES = {
  xs: {
    radius: 2,
    borderRadius: '2px',
    points: [[0,2], [1,2], [1,1], [2,1], [2,0]],
  },
  sm: {
    radius: 4,
    borderRadius: '6px',
    points: [[0,5], [1,5], [1,3], [2,3], [2,2], [3,2], [3,1], [5,1], [5,0]],
  },
  md: {
    radius: 6,
    borderRadius: '6px',
    points: [
      [0,9], [1,9], [1,8], [1,6], [2,6], [2,5], [3,5], [3,4],
      [4,3], [5,3], [5,2], [6,2], [6,1], [8,1], [9,1], [9,0],
    ],
  },
  lg: {
    radius: 8,
    borderRadius: '8px',
    points: [
      [0,12], [1,12], [1,9], [2,9], [2,8], [3,8], [3,7], [3,6],
      [4,6], [4,5], [5,4], [6,4], [6,3], [7,3], [8,3], [8,2],
      [9,2], [9,1], [12,1], [12,0],
    ],
  },
  xl: {
    radius: 16,
    borderRadius: '16px',
    points: [
      [0,19], [1,19], [1,16], [2,16], [2,15], [2,13], [3,13], [3,12],
      [4,12], [4,11], [4,10], [5,10], [5,9], [6,9], [6,8], [7,8],
      [7,7], [8,7], [8,6], [9,6], [9,5], [10,5], [10,4], [11,4],
      [12,4], [12,3], [13,3], [13,2], [15,2], [16,2], [16,1], [19,1], [19,0],
    ],
  },
};

export const PIXEL_CORNER_CONFIG = {
  profiles: PIXEL_CORNER_PROFILES,
  variants: [
    {
      name: 'xs',
      selectors: ['.pixel-rounded-xs'],
      wrapperSelector: '.pixel-rounded-xs--wrapper',
      corners: { tl: 'xs', tr: 'xs', br: 'xs', bl: 'xs' },
    },
    {
      name: 'sm',
      selectors: ['.pixel-rounded-sm'],
      wrapperSelector: '.pixel-rounded-sm--wrapper',
      corners: { tl: 'sm', tr: 'sm', br: 'sm', bl: 'sm' },
    },
    {
      name: 'md',
      selectors: ['.pixel-rounded-md'],
      wrapperSelector: '.pixel-rounded-md--wrapper',
      corners: { tl: 'md', tr: 'md', br: 'md', bl: 'md' },
    },
    {
      name: 'lg',
      selectors: ['.pixel-rounded-lg', '.pixel-corners'],
      wrapperSelector: '.pixel-rounded-lg--wrapper',
      wrapperAliases: ['.pixel-corners--wrapper'],
      corners: { tl: 'lg', tr: 'lg', br: 'lg', bl: 'lg' },
    },
    {
      name: 'xl',
      selectors: ['.pixel-rounded-xl'],
      wrapperSelector: '.pixel-rounded-xl--wrapper',
      corners: { tl: 'xl', tr: 'xl', br: 'xl', bl: 'xl' },
    },
    {
      name: 't-sm-b-md',
      selectors: ['.pixel-rounded-t-sm-b-md'],
      corners: { tl: 'sm', tr: 'sm', br: 'md', bl: 'md' },
    },
    {
      name: 'l-sm',
      selectors: ['.pixel-rounded-l-sm'],
      corners: { tl: 'sm', tr: 'square', br: 'square', bl: 'sm' },
      edges: { top: true, right: false, bottom: true, left: true },
    },
    {
      name: 'sm-notl',
      selectors: ['.pixel-rounded-sm-notl'],
      corners: { tl: 'square', tr: 'sm', br: 'sm', bl: 'sm' },
    },
  ],
};
```

**Step 4: Regenerate the CSS**

Run:

```bash
pnpm --filter @rdna/radiants generate:pixel-corners
```

Expected:
- `packages/radiants/pixel-corners.generated.css` contains the current shipped geometry with all compound variants unified into shared base selectors and no manual polygon edits left behind.

**Step 5: Verify zero visual drift**

Diff the generated output against the manually-split file from Phase 1. The clip-path polygon strings must be identical. Shared base styles for compound variants should now use the unified selectors instead of per-variant `::after` boilerplate.

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- PASS

**Step 6: Commit**

```bash
git add packages/radiants/scripts/pixel-corners.config.mjs packages/radiants/pixel-corners.generated.css packages/radiants/test/pixel-corners-generator.test.ts
git commit -m "refactor(radiants): generate all shipped pixel-corner variants from config"
```

## Phase 6: Document The Workflow And The V1 Boundaries

### Task 6: Update docs so future edits do not regress back to handwritten polygons

**Files:**
- Modify: `packages/radiants/README.md`
- Modify: `packages/radiants/DESIGN.md`

No automated doc-content tests — the generator contract tests in Phases 2-5 are the safety net. Documentation updates are verified by human review.

**Step 1: Update `packages/radiants/README.md`**

Add a section:
- Pixel-corner geometry is generated from `scripts/pixel-corners.config.mjs`
- Regeneration command: `pnpm --filter @rdna/radiants generate:pixel-corners`
- Manual utilities (shadows, focus rings, border overrides) stay in `pixel-corners.css`
- New corner profiles can be verified with the [Pixel Corners Calculator](https://pixelcorners.lukeb.co.uk/)

**Step 2: Update `packages/radiants/DESIGN.md`**

- Replace references that imply all geometry is handwritten in `pixel-corners.css`
- Document the config-driven generator and per-corner composition support
- Document that `rounded-full` remains unchanged in V1 — smooth `border-radius`, no pixel staircase
- Document that auto-sized pixel corners are not supported in V1 — this is a follow-up research track
- Document the `position: relative` interaction and AppWindow inline override pattern
- Fix any radius/profile documentation drift so the docs match the shipped config exactly

**Step 3: Commit**

```bash
git add packages/radiants/README.md packages/radiants/DESIGN.md
git commit -m "docs(radiants): document pixel-corners generator workflow and v1 boundaries"
```

## Phase 7: Full Verification

### Task 7: Verify regeneration and package tests

**Files:**
- No source changes expected

**Step 1: Run the generator on a clean worktree**

Run:

```bash
pnpm --filter @rdna/radiants generate:pixel-corners
git diff -- packages/radiants/pixel-corners.generated.css packages/radiants/pixel-corners.css
```

Expected:
- no diff after regeneration

**Step 2: Run the focused tests**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run test/pixel-corners-generator.test.ts --cache=false
```

Expected:
- PASS

**Step 3: Run the full Radiants test suite**

Run:

```bash
pnpm --filter @rdna/radiants test:components
```

Expected:
- PASS

**Step 4: Commit the verification checkpoint**

```bash
git add packages/radiants/pixel-corners.generated.css packages/radiants/pixel-corners.css packages/radiants/scripts/pixel-corners.config.mjs packages/radiants/scripts/pixel-corners-lib.mjs packages/radiants/scripts/generate-pixel-corners.mjs packages/radiants/test/pixel-corners-generator.test.ts packages/radiants/README.md packages/radiants/DESIGN.md packages/radiants/package.json
git commit -m "chore(radiants): verify generated pixel-corners pipeline"
```

## Follow-Up Track: Size-Aware Round/Pill Pixel Corners

Do not include this in the initial implementation branch. If a consumer truly needs pixelated `rounded-full`, open a follow-up spike with one of these paths:

1. Runtime measurement via `ResizeObserver` and a separate JS-applied class family.
2. SVG or `mask-image` based rendering that can scale from element dimensions.
3. A bounded preset family like `pixel-pill-xs/sm/md/lg` that is explicit and not truly automatic.

The follow-up spike should answer:

- can the effect stay deterministic across SSR and hydration
- can it work without layout jank
- can it preserve the current no-JS default for standard rounded classes
- can it support circles and pills separately

If those answers are not good enough, keep `rounded-full` smooth and explicit.
