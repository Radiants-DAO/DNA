# Logo Asset Maker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Replace the static 9-card preset grid in the `Logos` tab of `BrandAssetsApp` with a live, two-pane logo asset maker that composes SVG bg + logo on the fly and exports as SVG or PNG.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-logo-maker` on `feat/logo-asset-maker`. All execution happens in this worktree — never in the main checkout.

**Architecture:** Client-side SVG composition + canvas rasterization. Pure helpers (`composeLogoSvg`, `patternToSvgDef`, `rasterizeSvgToPng`, ratio presets) live in `apps/rad-os/lib/logo-maker/` and are TDD'd in isolation. A new `LogoMaker.tsx` component composes them into a controls island + canvas island layout using the existing `AppWindow.Content layout="sidebar"` primitive. The existing `LOGOS` preset array, `LogoCard`, and tab-level format toggle are removed.

**Tech Stack:** React 19, Next.js 16, TypeScript, Vitest, `@rdna/radiants` (AppWindow, Button, Switch, Tooltip, Icon), `@rdna/pixel` (`PATTERN_REGISTRY`, `bitsToMergedRects`), `WordmarkLogo` / `RadMarkIcon` / `RadSunLogo` from `@rdna/radiants/icons/runtime` (all pure-path SVGs — no font-embedding gotcha).

---

## Background

### Brainstorm

`archive/brainstorms-ideas-ops-audit-2026-04-25/docs/brainstorms/2026-04-18-logo-asset-maker-brainstorm.md` — read this before starting. All key decisions (chosen approach, color palette, layout) come from there.

### Key files for orientation

| Path | Why |
|------|-----|
| `apps/rad-os/components/apps/BrandAssetsApp.tsx:478-566` | Current Logos tab implementation — what we're replacing |
| `apps/rad-os/components/apps/BrandAssetsApp.tsx:47-57` | `LOGOS` preset array — to be deleted |
| `apps/rad-os/lib/asset-downloads.ts` | Pre-baked asset href helper — `getBrandLogoDownloadHref` becomes unused after this work; check call sites before deletion |
| `packages/radiants/icons/DesktopIcons.tsx` | `RadMarkIcon`, `WordmarkLogo`, `RadSunLogo` source. All pure paths with `currentColor`/`color` prop. |
| `packages/radiants/components/core/AppWindow/AppWindow.tsx:101-118` | `AppWindow.Content layout="sidebar"` + `AppWindow.Island` primitives we'll compose |
| `packages/pixel/src/patterns.ts` | `PATTERN_REGISTRY` (50 × 8×8 grids) and `getPattern(name)` |
| `packages/pixel/src/path.ts` | `bitsToMergedRects` — efficient SVG rect emission |
| `packages/pixel/src/index.ts` | Barrel — confirms exports surfaced as `@rdna/pixel` |

### Resolved open questions from brainstorm

| Question | Resolution |
|----------|------------|
| Wordmark font in PNG export | **Non-issue.** `WordmarkLogo` and `RadSunLogo` use `<path>` only — no `<text>`. SVG → `<img>` → canvas works without font subsetting. |
| Persistence across sessions | **Defer.** v1 uses local `useState` only. Note in plan: revisit via `preferencesSlice` if user asks. |
| Mobile sidebar fallback | **Defer.** BrandAssetsApp already renders inside `AppWindow`/`MobileAppModal` chrome. Sidebar layout collapses to stacked on narrow widths via `@container` queries. Verify visually; if broken, file follow-up. |
| Pattern gallery UX | **Scrollable thumbnail grid, no categorization in v1.** 50 × 8×8 SVG thumbs is cheap to render all at once. Categorization is polish. |
| Pattern bg = transparent | **Disallowed.** Pattern fg/bg restricted to Cream / Ink / Yellow per brainstorm. |
| SVG `<pattern>` paste-compat | **Verify in QA step**, not blocking impl. Browsers + Figma + Slack support inline `<pattern>` per SVG spec. |

### Ratio presets (locked for v1)

| Label | Width × Height | Notes |
|-------|----------------|-------|
| Square 512 | 512 × 512 | Default |
| 16:9 1080p | 1920 × 1080 | Slide / hero |
| OG 1200×630 | 1200 × 630 | Open Graph |
| Favicon 128 | 128 × 128 | Small square |
| Story 9:16 | 1080 × 1920 | Vertical |

### Conventions

- **No hardcoded colors.** Use semantic tokens (`bg-page`, `text-main`, `border-line`). The composed output SVG is the one place we deliberately bake hex values (Cream `#FEF8E2`, Ink `#0F0E0C`, Yellow `#FCE184`) — that's the asset, not the UI.
- **No raw `<button>`.** Use `Button` from `@rdna/radiants/components/core`.
- **Pixel corners:** never combine with `border-*` or `overflow-hidden`. Use the existing `AppWindow.Island corners="pixel"` for the islands.
- **Tailwind v4 max-w bug:** if you need a max-width, use `max-w-[Nrem]` not `max-w-md`. Required reading: `MEMORY.md`.
- **TDD where it pays:** pure helpers (compose, rasterize, ratio math) are TDD'd. UI assembly is built once and verified visually. Don't add tests for prop wiring.
- **Frequent commits.** One commit per task. Conventional commit prefix: `feat(rad-os):` or `feat(logo-maker):`.

### Skills available

- `@vitest` for test patterns
- `@rdna-reviewer` if visual/RDNA conformance gets hairy
- `@qc-visual` after the UI is built — screenshot-driven review

---

## Task Plan

### Task 1: Module scaffold + brand color constant

**Files:**
- Create: `apps/rad-os/lib/logo-maker/index.ts`
- Create: `apps/rad-os/lib/logo-maker/colors.ts`

**Step 1: Create the colors module**

```ts
// apps/rad-os/lib/logo-maker/colors.ts

/**
 * Hex values baked into exported SVG/PNG assets.
 * NOT for use in UI — those use semantic tokens.
 * Mirrors BRAND_LOGO_COLORS in @rdna/radiants/icons/DesktopIcons.tsx.
 */
export const BRAND_HEX = {
  cream: '#FEF8E2',
  ink: '#0F0E0C',
  yellow: '#FCE184',
} as const;

export type BrandColor = keyof typeof BRAND_HEX;

/** Background option — adds 'transparent' to brand colors + 'pattern' as a sentinel. */
export type BgOption = BrandColor | 'transparent' | 'pattern';
```

**Step 2: Create the barrel**

```ts
// apps/rad-os/lib/logo-maker/index.ts
export * from './colors';
```

**Step 3: Commit**

```bash
git add apps/rad-os/lib/logo-maker
git commit -m "feat(logo-maker): scaffold module with brand color constants"
```

---

### Task 2: Ratio presets (TDD)

**Files:**
- Create: `apps/rad-os/lib/logo-maker/ratios.ts`
- Test: `apps/rad-os/lib/logo-maker/__tests__/ratios.test.ts`

**Step 1: Write the failing test**

```ts
// apps/rad-os/lib/logo-maker/__tests__/ratios.test.ts
import { describe, it, expect } from 'vitest';
import { RATIO_PRESETS, getRatioPreset, type RatioPresetId } from '../ratios';

describe('RATIO_PRESETS', () => {
  it('exposes the v1 preset list in order', () => {
    expect(RATIO_PRESETS.map((p) => p.id)).toEqual([
      'square-512',
      'wide-1080p',
      'og-1200x630',
      'favicon-128',
      'story-9-16',
    ]);
  });

  it('every preset has positive integer dimensions', () => {
    for (const p of RATIO_PRESETS) {
      expect(Number.isInteger(p.width)).toBe(true);
      expect(Number.isInteger(p.height)).toBe(true);
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
    }
  });

  it('getRatioPreset returns the matching preset', () => {
    expect(getRatioPreset('og-1200x630')?.width).toBe(1200);
    expect(getRatioPreset('og-1200x630')?.height).toBe(630);
  });

  it('getRatioPreset returns undefined for unknown ids', () => {
    expect(getRatioPreset('nope' as RatioPresetId)).toBeUndefined();
  });
});
```

**Step 2: Run the test — expect FAIL**

```bash
pnpm --filter rad-os test -- ratios.test.ts
```

Expected: fail with module-not-found / `RATIO_PRESETS is undefined`.

**Step 3: Implement ratios.ts**

```ts
// apps/rad-os/lib/logo-maker/ratios.ts

export interface RatioPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const RATIO_PRESETS = [
  { id: 'square-512',  label: 'Square 512',   width: 512,  height: 512  },
  { id: 'wide-1080p',  label: '16:9 1080p',   width: 1920, height: 1080 },
  { id: 'og-1200x630', label: 'OG 1200×630',  width: 1200, height: 630  },
  { id: 'favicon-128', label: 'Favicon 128',  width: 128,  height: 128  },
  { id: 'story-9-16',  label: 'Story 9:16',   width: 1080, height: 1920 },
] as const satisfies readonly RatioPreset[];

export type RatioPresetId = (typeof RATIO_PRESETS)[number]['id'];

export function getRatioPreset(id: RatioPresetId): RatioPreset | undefined {
  return RATIO_PRESETS.find((p) => p.id === id);
}
```

**Step 4: Re-run — expect PASS, then export from barrel**

```bash
pnpm --filter rad-os test -- ratios.test.ts
```

Add to `apps/rad-os/lib/logo-maker/index.ts`:

```ts
export * from './ratios';
```

**Step 5: Commit**

```bash
git add apps/rad-os/lib/logo-maker
git commit -m "feat(logo-maker): add ratio preset registry"
```

---

### Task 3: Pattern → SVG `<pattern>` element (TDD)

**Files:**
- Create: `apps/rad-os/lib/logo-maker/patternDef.ts`
- Test: `apps/rad-os/lib/logo-maker/__tests__/patternDef.test.ts`

The output is a string containing one `<pattern>` element with a viewport-tiled 8×8 grid. The pattern paints `fg` cells over a `bg` solid square.

**Step 1: Write the failing test**

```ts
// apps/rad-os/lib/logo-maker/__tests__/patternDef.test.ts
import { describe, it, expect } from 'vitest';
import { getPattern } from '@rdna/pixel';
import { patternToSvgDef } from '../patternDef';
import { BRAND_HEX } from '../colors';

describe('patternToSvgDef', () => {
  const grid = getPattern('checkerboard')!;

  it('returns a <pattern> with the given id', () => {
    const out = patternToSvgDef(grid, { id: 'p1', fg: 'ink', bg: 'cream', cellSize: 4 });
    expect(out).toMatch(/<pattern[^>]+id="p1"/);
  });

  it('embeds the bg color as a full-tile rect', () => {
    const out = patternToSvgDef(grid, { id: 'p1', fg: 'ink', bg: 'cream', cellSize: 4 });
    // Tile is 8 cells × 4px = 32px square
    expect(out).toContain(`fill="${BRAND_HEX.cream}"`);
    expect(out).toMatch(/width="32"\s+height="32"/);
  });

  it('emits fg cells using merged rects from @rdna/pixel', () => {
    const out = patternToSvgDef(grid, { id: 'p1', fg: 'ink', bg: 'cream', cellSize: 4 });
    expect(out).toContain(`fill="${BRAND_HEX.ink}"`);
  });

  it('uses userSpaceOnUse so cellSize maps to absolute pixels', () => {
    const out = patternToSvgDef(grid, { id: 'p1', fg: 'ink', bg: 'cream', cellSize: 4 });
    expect(out).toContain('patternUnits="userSpaceOnUse"');
  });
});
```

**Step 2: Run — expect FAIL**

```bash
pnpm --filter rad-os test -- patternDef.test.ts
```

**Step 3: Implement patternDef.ts**

```ts
// apps/rad-os/lib/logo-maker/patternDef.ts
import { bitsToMergedRects, type PixelGrid } from '@rdna/pixel';
import { BRAND_HEX, type BrandColor } from './colors';

export interface PatternDefOptions {
  id: string;
  fg: BrandColor;
  bg: BrandColor;
  /** Pixels per grid cell. Final tile = grid.width × cellSize square. */
  cellSize: number;
}

export function patternToSvgDef(
  grid: PixelGrid,
  { id, fg, bg, cellSize }: PatternDefOptions,
): string {
  const tile = grid.width * cellSize;
  const rects = bitsToMergedRects(grid);
  const fgHex = BRAND_HEX[fg];
  const bgHex = BRAND_HEX[bg];
  const fgRects = rects
    .map(
      (r) =>
        `<rect x="${r.x * cellSize}" y="${r.y * cellSize}" width="${r.width * cellSize}" height="${r.height * cellSize}" fill="${fgHex}"/>`,
    )
    .join('');
  return (
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${tile}" height="${tile}">` +
    `<rect width="${tile}" height="${tile}" fill="${bgHex}"/>` +
    fgRects +
    `</pattern>`
  );
}
```

**Step 4: Run — expect PASS**

```bash
pnpm --filter rad-os test -- patternDef.test.ts
```

If `bitsToMergedRects` signature differs from assumed `{ x, y, width, height }`, read `packages/pixel/src/path.ts` and adjust the rect accessor.

**Step 5: Export from barrel + commit**

Add to `apps/rad-os/lib/logo-maker/index.ts`:

```ts
export * from './patternDef';
```

```bash
git add apps/rad-os/lib/logo-maker
git commit -m "feat(logo-maker): add patternToSvgDef helper"
```

---

### Task 4: Compose logo SVG (TDD)

**Files:**
- Create: `apps/rad-os/lib/logo-maker/composeLogoSvg.ts`
- Test: `apps/rad-os/lib/logo-maker/__tests__/composeLogoSvg.test.ts`

This builds the **export-shaped** SVG. The preview can render the same string via `dangerouslySetInnerHTML` or by parsing — but the export string is the source of truth.

It needs to:
- Take a viewBox sized to the chosen ratio.
- Optionally paint a bg layer (solid or `url(#patternId)`).
- Draw the chosen logo glyph centered, scaled to fit ~80% of the smaller dimension.
- Recolor the logo by injecting the brand hex into the inner SVG paths.

The simplest robust approach: **inline raw `<path>` markup per logo variant**, parameterized by hex. We've already got the path strings in `DesktopIcons.tsx`. Extract them into `apps/rad-os/lib/logo-maker/logoPaths.ts` so the compose function isn't coupled to React.

**Step 1: Extract logo paths into a data module**

Create `apps/rad-os/lib/logo-maker/logoPaths.ts`:

```ts
// apps/rad-os/lib/logo-maker/logoPaths.ts

/**
 * Raw SVG path data for the brand logos. Source of truth lives in
 * packages/radiants/icons/DesktopIcons.tsx — keep these in sync.
 *
 * Each entry: viewBox + ordered list of <path d="..."> strings.
 * We render with a single fill color injected at compose time.
 */

export interface LogoPathSet {
  viewBox: { width: number; height: number };
  paths: string[];
}

export const LOGO_PATHS = {
  mark: {
    viewBox: { width: 65, height: 65 },
    paths: [
      'M29.6393 4.93988V0H34.5791V4.93988H39.519V9.87976H24.6994V4.93988H29.6393ZM59.2789 29.6392H64.2188V34.5791H59.2789V39.5189H54.339V24.6993H59.2789V29.6392ZM0 34.5797H4.93988V39.5196H9.87976V24.7H4.93988V29.6399H0V34.5797ZM14.8198 14.8189V19.7587H9.87988V9.87899H19.7596V14.8189H14.8198ZM44.4591 14.8189H49.399V19.7587H54.3389V9.87899H44.4591V14.8189ZM49.399 49.3981L49.399 44.4582H54.3389V54.338H44.4591V49.3981H49.399ZM19.7596 49.3981H14.8198V44.4582H9.87988V54.338H19.7596V49.3981ZM34.5797 59.279V64.2188H29.6398L29.6398 59.279H24.6999V54.3391H39.5195V59.279H34.5797ZM24.6991 14.8204H39.5187V19.7603H44.4586V24.7002H49.3985V39.5198H44.4586V44.4597H39.5187V49.3996H24.6991V44.4597H19.7592V39.5198H14.8193V24.7002H19.7592V19.7603H24.6991V14.8204Z',
    ],
  },
  wordmark: {
    viewBox: { width: 940, height: 130 },
    // Copy the 19 path `d` strings from WordmarkLogo in DesktopIcons.tsx, in order.
    paths: [/* fill in from DesktopIcons.tsx:75-95 */],
  },
  radsun: {
    viewBox: { width: 450, height: 130 },
    // Copy the 16 path `d` strings from RadSunLogo in DesktopIcons.tsx:107-123.
    paths: [/* fill in from DesktopIcons.tsx:107-123 */],
  },
} as const satisfies Record<string, LogoPathSet>;

export type LogoVariant = keyof typeof LOGO_PATHS;
```

> **Engineer note:** Open `packages/radiants/icons/DesktopIcons.tsx`, copy the `d=""` values verbatim (preserving order) into the `paths` arrays for `wordmark` (lines 75-95) and `radsun` (lines 107-123). Do not paraphrase or re-format — copy exact strings.

**Step 2: Write the failing test for composeLogoSvg**

```ts
// apps/rad-os/lib/logo-maker/__tests__/composeLogoSvg.test.ts
import { describe, it, expect } from 'vitest';
import { composeLogoSvg } from '../composeLogoSvg';
import { BRAND_HEX } from '../colors';

describe('composeLogoSvg', () => {
  it('produces an svg with the requested width/height/viewBox', () => {
    const out = composeLogoSvg({
      variant: 'mark',
      logoColor: 'ink',
      bg: { kind: 'solid', color: 'cream' },
      width: 512,
      height: 512,
    });
    expect(out).toMatch(/<svg[^>]+width="512"[^>]+height="512"/);
    expect(out).toContain('viewBox="0 0 512 512"');
  });

  it('paints a solid bg rect when bg.kind === "solid"', () => {
    const out = composeLogoSvg({
      variant: 'mark',
      logoColor: 'ink',
      bg: { kind: 'solid', color: 'cream' },
      width: 512,
      height: 512,
    });
    expect(out).toContain(`<rect width="512" height="512" fill="${BRAND_HEX.cream}"/>`);
  });

  it('omits the bg rect when bg.kind === "transparent"', () => {
    const out = composeLogoSvg({
      variant: 'mark',
      logoColor: 'ink',
      bg: { kind: 'transparent' },
      width: 512,
      height: 512,
    });
    expect(out).not.toMatch(/<rect width="512" height="512"/);
  });

  it('uses the pattern fill when bg.kind === "pattern"', () => {
    const out = composeLogoSvg({
      variant: 'mark',
      logoColor: 'yellow',
      bg: {
        kind: 'pattern',
        pattern: 'checkerboard',
        fg: 'ink',
        bgColor: 'cream',
      },
      width: 512,
      height: 512,
    });
    expect(out).toContain('<defs>');
    expect(out).toMatch(/<pattern id="logo-bg-pattern"/);
    expect(out).toContain('fill="url(#logo-bg-pattern)"');
  });

  it('injects the logo fill color', () => {
    const out = composeLogoSvg({
      variant: 'mark',
      logoColor: 'yellow',
      bg: { kind: 'transparent' },
      width: 512,
      height: 512,
    });
    expect(out).toContain(`fill="${BRAND_HEX.yellow}"`);
  });
});
```

**Step 3: Run — expect FAIL**

```bash
pnpm --filter rad-os test -- composeLogoSvg.test.ts
```

**Step 4: Implement composeLogoSvg.ts**

```ts
// apps/rad-os/lib/logo-maker/composeLogoSvg.ts
import { getPattern } from '@rdna/pixel';
import { BRAND_HEX, type BrandColor } from './colors';
import { LOGO_PATHS, type LogoVariant } from './logoPaths';
import { patternToSvgDef } from './patternDef';

export type Bg =
  | { kind: 'transparent' }
  | { kind: 'solid'; color: BrandColor }
  | { kind: 'pattern'; pattern: string; fg: BrandColor; bgColor: BrandColor };

export interface ComposeLogoOptions {
  variant: LogoVariant;
  logoColor: BrandColor;
  bg: Bg;
  width: number;
  height: number;
  /** Fraction of the smaller dimension the logo should occupy. Default 0.7. */
  fit?: number;
}

const PATTERN_ID = 'logo-bg-pattern';

export function composeLogoSvg({
  variant,
  logoColor,
  bg,
  width,
  height,
  fit = 0.7,
}: ComposeLogoOptions): string {
  const logo = LOGO_PATHS[variant];
  const fillHex = BRAND_HEX[logoColor];

  // Scale logo to fit `fit` of the smaller canvas dimension, preserving aspect.
  const targetSize = Math.min(width, height) * fit;
  const scale = Math.min(
    targetSize / logo.viewBox.width,
    targetSize / logo.viewBox.height,
  );
  const renderedW = logo.viewBox.width * scale;
  const renderedH = logo.viewBox.height * scale;
  const tx = (width - renderedW) / 2;
  const ty = (height - renderedH) / 2;

  // Background layer
  let defs = '';
  let bgRect = '';
  if (bg.kind === 'solid') {
    bgRect = `<rect width="${width}" height="${height}" fill="${BRAND_HEX[bg.color]}"/>`;
  } else if (bg.kind === 'pattern') {
    const grid = getPattern(bg.pattern);
    if (grid) {
      // Cell size: aim for ~tile of canvasSize/16 — gives chunky pixel-art feel at any ratio.
      const cellSize = Math.max(1, Math.round(Math.min(width, height) / 64));
      defs = `<defs>${patternToSvgDef(grid, { id: PATTERN_ID, fg: bg.fg, bg: bg.bgColor, cellSize })}</defs>`;
      bgRect = `<rect width="${width}" height="${height}" fill="url(#${PATTERN_ID})"/>`;
    }
  }

  // Logo layer — inject single fill color into all paths
  const paths = logo.paths
    .map((d) => `<path d="${d}" fill="${fillHex}"/>`)
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    defs +
    bgRect +
    `<g transform="translate(${tx} ${ty}) scale(${scale})">${paths}</g>` +
    `</svg>`
  );
}
```

**Step 5: Run — expect PASS**

```bash
pnpm --filter rad-os test -- composeLogoSvg.test.ts
```

**Step 6: Export from barrel + commit**

```ts
// index.ts
export * from './logoPaths';
export * from './composeLogoSvg';
```

```bash
git add apps/rad-os/lib/logo-maker
git commit -m "feat(logo-maker): compose logo SVG with bg + recolored glyph"
```

---

### Task 5: SVG → PNG rasterizer

**Files:**
- Create: `apps/rad-os/lib/logo-maker/rasterize.ts`

This runs in the browser only. Don't TDD with vitest+jsdom (no real `<canvas>` rasterization there) — write it tight, type it cleanly, and verify in the integration step.

**Step 1: Write the helper**

```ts
// apps/rad-os/lib/logo-maker/rasterize.ts

/**
 * Rasterize an SVG string to a PNG Blob at the given pixel dimensions.
 * Browser-only — uses <img>, OffscreenCanvas/HTMLCanvasElement, and toBlob.
 */
export async function rasterizeSvgToPng(
  svg: string,
  width: number,
  height: number,
): Promise<Blob> {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d canvas context unavailable');
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))),
        'image/png',
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load SVG image: ${src}`));
    img.src = src;
  });
}
```

**Step 2: Add to barrel + commit**

```ts
// index.ts
export * from './rasterize';
```

```bash
git add apps/rad-os/lib/logo-maker
git commit -m "feat(logo-maker): add rasterizeSvgToPng helper"
```

---

### Task 6: LogoMaker UI component

**Files:**
- Create: `apps/rad-os/components/apps/brand-assets/LogoMaker.tsx`

This is the UI assembly. One component file. It reads from local `useState`, calls the helpers from Task 1-5, renders the controls + canvas islands.

**Step 1: Build the component**

```tsx
// apps/rad-os/components/apps/brand-assets/LogoMaker.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import { AppWindow, Button, Switch, Tooltip } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { PATTERN_REGISTRY } from '@rdna/pixel';
import {
  composeLogoSvg,
  rasterizeSvgToPng,
  RATIO_PRESETS,
  type Bg,
  type BrandColor,
  type LogoVariant,
  type RatioPresetId,
} from '@/lib/logo-maker';

const VARIANTS: ReadonlyArray<{ value: LogoVariant; label: string }> = [
  { value: 'mark', label: 'Mark' },
  { value: 'wordmark', label: 'Wordmark' },
  { value: 'radsun', label: 'RadSun' },
];

const BG_OPTIONS = ['transparent', 'cream', 'ink', 'yellow', 'pattern'] as const;
type BgOption = (typeof BG_OPTIONS)[number];

const COLOR_OPTIONS: ReadonlyArray<BrandColor> = ['cream', 'ink', 'yellow'];

export function LogoMaker() {
  const [variant, setVariant] = useState<LogoVariant>('mark');
  const [bgOption, setBgOption] = useState<BgOption>('cream');
  const [pattern, setPattern] = useState<string>('checkerboard');
  const [patternFg, setPatternFg] = useState<BrandColor>('ink');
  const [patternBg, setPatternBg] = useState<BrandColor>('cream');
  const [logoColor, setLogoColor] = useState<BrandColor>('ink');
  const [ratio, setRatio] = useState<RatioPresetId>('square-512');
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [copied, setCopied] = useState(false);

  const preset = RATIO_PRESETS.find((p) => p.id === ratio)!;

  const bg: Bg = useMemo(() => {
    if (bgOption === 'transparent') return { kind: 'transparent' };
    if (bgOption === 'pattern') return { kind: 'pattern', pattern, fg: patternFg, bgColor: patternBg };
    return { kind: 'solid', color: bgOption };
  }, [bgOption, pattern, patternFg, patternBg]);

  const svg = useMemo(
    () => composeLogoSvg({ variant, logoColor, bg, width: preset.width, height: preset.height }),
    [variant, logoColor, bg, preset.width, preset.height],
  );

  const filename = `radiants-${variant}-${ratio}.${format}`;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [svg]);

  const handleDownload = useCallback(async () => {
    let blob: Blob;
    if (format === 'svg') {
      blob = new Blob([svg], { type: 'image/svg+xml' });
    } else {
      blob = await rasterizeSvgToPng(svg, preset.width, preset.height);
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [svg, format, preset.width, preset.height, filename]);

  return (
    <AppWindow.Content layout="sidebar">
      {/* ── Controls island ── */}
      <AppWindow.Island width="w-[16rem]" corners="pixel" padding="sm">
        <div className="flex flex-col gap-4">
          <ControlGroup label="Logo">
            <SegmentedRow
              options={VARIANTS}
              value={variant}
              onChange={setVariant}
            />
          </ControlGroup>

          <ControlGroup label="Background">
            <ColorRow
              options={BG_OPTIONS}
              value={bgOption}
              onChange={setBgOption}
            />
          </ControlGroup>

          {bgOption === 'pattern' && (
            <>
              <ControlGroup label="Pattern">
                <PatternPicker value={pattern} onChange={setPattern} />
              </ControlGroup>
              <ControlGroup label="Pattern foreground">
                <ColorRow options={COLOR_OPTIONS} value={patternFg} onChange={setPatternFg} />
              </ControlGroup>
              <ControlGroup label="Pattern background">
                <ColorRow options={COLOR_OPTIONS} value={patternBg} onChange={setPatternBg} />
              </ControlGroup>
            </>
          )}

          <ControlGroup label="Logo color">
            <ColorRow options={COLOR_OPTIONS} value={logoColor} onChange={setLogoColor} />
          </ControlGroup>

          <ControlGroup label="Ratio">
            <select
              value={ratio}
              onChange={(e) => setRatio(e.target.value as RatioPresetId)}
              className="w-full bg-page text-main border border-line rounded-sm px-2 py-1 text-sm"
            >
              {RATIO_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </ControlGroup>

          <ControlGroup label="Format">
            <div className="flex items-center gap-2">
              <span className={`font-heading text-xs uppercase ${format === 'png' ? 'text-main' : 'text-mute'}`}>PNG</span>
              <Switch checked={format === 'svg'} onChange={(c) => setFormat(c ? 'svg' : 'png')} size="sm" />
              <span className={`font-heading text-xs uppercase ${format === 'svg' ? 'text-main' : 'text-mute'}`}>SVG</span>
            </div>
          </ControlGroup>
        </div>
      </AppWindow.Island>

      {/* ── Canvas island ── */}
      <AppWindow.Island corners="pixel" padding="md" className="relative flex-1">
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <Tooltip content={copied ? 'Copied!' : 'Copy SVG'}>
            <Button size="sm" icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'} onClick={handleCopy}>
              Copy
            </Button>
          </Tooltip>
          <Button size="sm" icon="download" onClick={handleDownload}>
            Download
          </Button>
        </div>
        <div
          className="w-full h-full flex items-center justify-center"
          /* The composed SVG is the asset, not UI — inline it as-is. */
          dangerouslySetInnerHTML={{ __html: scaleSvgForPreview(svg) }}
        />
      </AppWindow.Island>
    </AppWindow.Content>
  );
}

// ─── Local helpers ────────────────────────────────────────────────────────

function scaleSvgForPreview(svg: string): string {
  // Strip the explicit width/height so the SVG fills its container while
  // preserving the viewBox (and therefore aspect ratio).
  return svg
    .replace(/\swidth="\d+"/, ' width="100%"')
    .replace(/\sheight="\d+"/, ' height="100%"')
    .replace('<svg ', '<svg style="max-width:100%;max-height:100%;" preserveAspectRatio="xMidYMid meet" ');
}

interface ControlGroupProps {
  label: string;
  children: React.ReactNode;
}

function ControlGroup({ label, children }: ControlGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-heading text-xs uppercase text-mute tracking-tight">{label}</span>
      {children}
    </div>
  );
}

interface SegmentedRowProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}

function SegmentedRow<T extends string>({ options, value, onChange }: SegmentedRowProps<T>) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant={opt.value === value ? 'primary' : 'ghost'}
          onClick={() => onChange(opt.value)}
          fullWidth
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

interface ColorRowProps<T extends string> {
  options: ReadonlyArray<T>;
  value: T;
  onChange: (v: T) => void;
}

function ColorRow<T extends string>({ options, value, onChange }: ColorRowProps<T>) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => (
        <Button
          key={opt}
          size="sm"
          variant={opt === value ? 'primary' : 'ghost'}
          onClick={() => onChange(opt)}
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}

interface PatternPickerProps {
  value: string;
  onChange: (name: string) => void;
}

function PatternPicker({ value, onChange }: PatternPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-1 max-h-[12rem] overflow-y-auto p-1 bg-page border border-line rounded-sm">
      {PATTERN_REGISTRY.map((p) => (
        <button
          key={p.name}
          type="button"
          onClick={() => onChange(p.name)}
          aria-label={p.name}
          aria-pressed={value === p.name}
          className={`aspect-square bg-flip text-main rounded-sm overflow-hidden ${value === p.name ? 'ring-2 ring-accent' : ''}`}
        >
          <PatternThumb name={p.name} />
        </button>
      ))}
    </div>
  );
}

function PatternThumb({ name }: { name: string }) {
  // Tiny inline SVG using currentColor for fg, transparent for bg.
  // Keeps the picker themeable (current bg-flip / text-main).
  // Implementation: render an 8x8 rect grid using bitsToMergedRects under currentColor.
  // For a v1 lightweight thumb, use a CSS background:
  return null; // see implementation note below
}
```

> **Engineer note on `PatternThumb`:** keep it cheap. Implement by importing `getPattern` and `bitsToMergedRects` from `@rdna/pixel`, returning an inline `<svg viewBox="0 0 8 8">` with `<rect fill="currentColor"/>` per merged rect. Don't reuse the export-side `patternToSvgDef` — that's keyed for hex injection, the thumb wants `currentColor`. ~10 lines.

**Step 2: Verify the file compiles**

```bash
pnpm --filter rad-os build  # or `pnpm --filter rad-os lint` for faster signal
```

Fix any type errors (most likely: `Button` `variant` prop names, `Tooltip` API, `Icon` name strings — check existing usages in `BrandAssetsApp.tsx` for the canonical spellings).

**Step 3: Commit**

```bash
git add apps/rad-os/components/apps/brand-assets/LogoMaker.tsx
git commit -m "feat(logo-maker): add LogoMaker UI with controls + live canvas"
```

---

### Task 7: Wire LogoMaker into BrandAssetsApp; remove old Logos UI

**Files:**
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx` (lines 27-57, 478-566 area)

**Step 1: Replace the Logos block**

In `BrandAssetsApp.tsx`:

1. Remove the `LogoVariant`, `LogoColor`, `LogoConfig` types (lines 27-35).
2. Remove the `LOGOS` const (lines 47-57).
3. Remove the `LogoCard` component (search for `function LogoCard` — this is what the old grid renders).
4. Remove the `logoFormat` state and the top-level format toggle (line 483 + lines 555-565 inside the `activeTab === 'logos'` block).
5. Remove the `getBrandLogoDownloadHref` import (line 21).
6. Replace the entire `activeTab === 'logos'` block (lines 553-566) with:

```tsx
{activeTab === 'logos' && <LogoMaker />}
```

7. Add the import near the top:

```tsx
import { LogoMaker } from '@/components/apps/brand-assets/LogoMaker';
```

8. The Logos tab no longer needs to live inside `<AppWindow.Content>` + `<AppWindow.Island>` chrome — `LogoMaker` provides its own. Restructure the JSX so when `activeTab === 'logos'`, you render just `<LogoMaker />` outside the wrapping `Content`/`Island`. Mirror the `activeTab === 'components'` branch at line 513 (which already does its own `Content`/`Island` composition).

**Step 2: Verify build + lint**

```bash
pnpm --filter rad-os lint
pnpm --filter rad-os build
```

Fix violations. Common things to expect:
- Unused imports → remove.
- RDNA design-system errors → see `pnpm lint:design-system` and the rules table in `CLAUDE.md`.

**Step 3: Check for orphaned `getBrandLogoDownloadHref` users**

```bash
# Use Grep tool, not bash:
# Grep for getBrandLogoDownloadHref across the repo
```

If no other call sites remain, delete the function from `apps/rad-os/lib/asset-downloads.ts` (keep `getFontDownloadHref` — it's unrelated). If the file becomes empty, delete the file and its import sites.

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/BrandAssetsApp.tsx apps/rad-os/lib/asset-downloads.ts
git commit -m "feat(rad-os): replace static Logos grid with LogoMaker"
```

---

### Task 8: Visual verification

**Step 1: Start the dev server**

```bash
pnpm dev
```

**Step 2: Open Brand Assets → Logos in the running app**

Use the @qc-visual skill or manual browser check. Run through each combination matrix:

| Check | What good looks like |
|-------|---------------------|
| Open Logos tab | Two-island layout: controls left, canvas right. No 9-card grid. |
| Switch variant Mark/Wordmark/RadSun | Canvas updates live. Logo stays centered, scales to fit. |
| Switch bg Cream/Ink/Yellow | Canvas bg updates. |
| Switch bg = Transparent | Canvas shows through to island (checkerboard or page bg — confirm intent: a faint checker overlay would help indicate transparency, but is **not** in v1 scope). |
| Switch bg = Pattern | Pattern picker, fg, and bg controls appear. Picking a pattern updates the canvas. |
| Switch ratio | Canvas reshapes (square → 16:9 → vertical etc.). Logo recenters. |
| Toggle Format PNG ↔ SVG | No visual change in the canvas (preview is always SVG). |
| Click Copy | Clipboard contains a valid SVG string (paste into a text editor to confirm). Toast/icon confirms copy. |
| Click Download with PNG | Browser downloads `radiants-<variant>-<ratio>.png` of the correct dimensions; opening it shows the same composition. |
| Click Download with SVG | Browser downloads a valid SVG. Open in browser → renders. Open in Figma → renders. |
| Patterned PNG | Pattern is preserved through rasterization (confirm cells align). |
| Patterned SVG copy/paste | Paste into Figma → renders correctly. (This validates the open question on `<pattern>` paste-compat.) |

**Step 3: Run the design-system linter**

```bash
pnpm lint:design-system
```

Zero errors required (per `packages/radiants/CLAUDE.md`).

**Step 4: Commit any visual fixes as discovered**

Conventional: `fix(logo-maker): <what>`.

---

### Task 9: Final test pass + cleanup

**Step 1: Run the full test suite for rad-os**

```bash
pnpm --filter rad-os test
```

All green required.

**Step 2: Run a workspace lint**

```bash
pnpm lint
```

**Step 3: Confirm no dead code remains**

Use Grep (the tool, not bash) to confirm:
- No remaining references to `LOGOS`, `LogoCard`, `LogoConfig` in `apps/rad-os/`.
- No remaining imports of `getBrandLogoDownloadHref` in `apps/rad-os/`.

If any survived, delete and re-commit.

**Step 4: Final commit (if anything was touched)**

```bash
git commit -m "chore(logo-maker): final cleanup of legacy LOGOS preset code"
```

---

## Out of Scope (deferred / follow-ups)

- **Persistence of last config** via `preferencesSlice`. Add when the user explicitly asks.
- **Pattern gallery categorization** (structural / diagonal / scatter / etc.). v1 is a flat scrollable grid.
- **Mobile-collapsed sidebar layout.** If the Brand Assets app is opened on mobile and the sidebar layout doesn't gracefully stack, file a follow-up — don't expand scope here.
- **A "transparent" indicator** (faint UI checker behind the canvas) to make transparent bg legible at a glance.
- **Custom dimensions input** (free-form W×H). v1 ships preset ratios only.
- **Static SVG/PNG files in `/public/assets/logos/`** can stay as-is — they aren't referenced after Task 7's `getBrandLogoDownloadHref` removal but deleting them is a separate housekeeping task.

---

## Execution Notes for Claude

- **Do not rename or restructure `@rdna/pixel`'s `PATTERN_REGISTRY` shape.** Consume what's there.
- **Do not edit `DesktopIcons.tsx`.** The path strings in `LOGO_PATHS` are a *copy*, deliberately — `DesktopIcons.tsx` remains the React-runtime source for in-app rendering and we don't want runtime imports of React components from a pure-string compose function.
- **One commit per task.** Resist bundling.
- **If a step fails an assumption** (e.g. `bitsToMergedRects` shape, `Button` prop API), read the source file to confirm, then adjust the local code rather than expanding scope.
