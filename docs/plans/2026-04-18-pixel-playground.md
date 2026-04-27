# Pixel Playground Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Add a `Pixel` tab to `BrandAssetsApp` containing a 1-bit pixel-art editor with three modes (Corners / Patterns / Icons). User draws on a canvas, sees a live preview, and copies a paste-to-agent snippet that adds the asset to the relevant registry file.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA` on branch `main` (per user instruction — plan on main, no feature branch).

**Architecture:** Fork the pared-down subset of Studio into `apps/rad-os/components/apps/pixel-playground/` (sibling to `studio/`). Reuse `@/lib/dotting` for canvas + tools. Add a registry sidebar (left), mode-specific preview island (right), and a `ComponentCodeOutput`-style copy panel (bottom-right). Modes are data-driven via a `MODE_CONFIG` map keyed by `'corners' | 'patterns' | 'icons'`.

**Tech Stack:** React 19, TypeScript, Tailwind v4, `@/lib/dotting`, `@rdna/pixel`, `@rdna/radiants`, Vitest.

**Brainstorm:** `archive/brainstorms-ideas-ops-audit-2026-04-25/docs/brainstorms/2026-04-18-pixel-playground-brainstorm.md`

---

## Conventions & Gotchas

- **No RDNA violations.** Use semantic tokens only (`bg-card`, `text-sub`, `border-rule`, etc.). Run `pnpm lint:design-system` after touching any component.
- **No pixel-corner side effects.** If you use `pixel-rounded-*` classes, never add `border-*` or `overflow-hidden` on the same element.
- **Font sizes:** use the `text-xs`/`text-sm` scale, never `text-[Npx]`.
- **TDD for pure functions.** The code generators, bitstring extractors, and symmetry transforms are pure — unit-test them. UI components don't need tests (verify visually in browser).
- **Variable grid size:** to resize a `<Dotting>` canvas, re-mount it via a changing `key` prop. Set `minColumnCount=maxColumnCount=size` and `minRowCount=maxRowCount=size` so dotting stays locked at that size.
- **Bitstring convention:** row-major, `'1'` = filled cell, `'0'` = empty cell, length = `width × height`.
- **Dark mode:** FG/BG constants must not be hard-coded hex — derive from CSS vars at runtime via `getComputedStyle` if passing into dotting, OR make the canvas always use `var(--color-ink)` as FG and `var(--color-page)` as BG and let the theme flip handle dark mode.
- **The pixel package (`@rdna/pixel`) is the source of truth** for bitstring validation, path generation, and mask URIs. Do not reimplement these.

---

## Phase 1: Plumbing

### Task 1: Add `Pixel` tab to BrandAssetsApp (no content yet)

**Files:**
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx:493-499` (add nav entry)
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx` (conditional render stub)

**Step 1: Add `pixel` to `TAB_NAV`**

At `BrandAssetsApp.tsx:493-499`, between `components` and `ai-gen`:

```tsx
const TAB_NAV = [
  { value: 'logos', label: 'Logos', icon: <RadMarkIcon /> },
  { value: 'colors', label: 'Color', icon: <Icon name="pencil" /> },
  { value: 'fonts', label: 'Type', icon: <FontAaIcon /> },
  { value: 'pixel', label: 'Pixel', icon: <Icon name="outline-box" /> },
  { value: 'components', label: 'UI Library', icon: <Icon name="outline-box" /> },
  { value: 'ai-gen', label: 'AI', icon: <Icon name="usericon" /> },
] as const;
```

(We'll pick a better pixel-y icon in Task 11; `outline-box` is a placeholder.)

**Step 2: Add conditional render branch**

The `components` tab renders a dedicated layout at `BrandAssetsApp.tsx:513-538`. Add a sibling branch *above* it (since `activeTab === 'components'` is already its own branch, `pixel` should be its own branch too, not inside the `else` that handles Logos/Color/Fonts/AI).

Update the top-level ternary at `BrandAssetsApp.tsx:513`:

```tsx
{activeTab === 'components' ? (
  /* ...existing... */
) : activeTab === 'pixel' ? (
  <AppWindow.Content className="bg-gradient-to-b from-cream to-sun-yellow dark:from-page dark:to-page">
    <div className="p-5 text-sm text-sub">Pixel playground — coming soon.</div>
  </AppWindow.Content>
) : (
  /* ...existing else... */
)}
```

The gradient bg matches the sibling tabs; keep the `eslint-disable-next-line` comment if you copy from the existing branch.

**Step 3: Manually verify**

Run the dev server, open BrandAssets, click the new `Pixel` tab. Confirm the placeholder text renders inside a window island.

```bash
pnpm dev
# Navigate to localhost:3000, open BrandAssets, click Pixel
```

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/BrandAssetsApp.tsx
git commit -m "feat(brand-assets): stub Pixel tab in nav"
```

---

### Task 2: Scaffold `pixel-playground` directory + types

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/index.ts`
- Create: `apps/rad-os/components/apps/pixel-playground/types.ts`
- Create: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx`
- Create: `apps/rad-os/components/apps/pixel-playground/constants.ts`

**Step 1: Create `types.ts`**

```ts
import type { PixelGrid } from '@rdna/pixel';

export type PixelMode = 'corners' | 'patterns' | 'icons';

export type OutputFormat = 'prompt' | 'snippet' | 'bitstring' | 'svg';

export interface PixelPlaygroundState {
  mode: PixelMode;
  gridSize: number; // side length — canvas is always square for v1
  fgToken: string; // e.g. 'main'  → resolves to var(--color-main)
  bgToken: string; // e.g. 'page'  → resolves to var(--color-page)
  selectedEntry: PixelGrid | null; // currently-forked entry, or null for +New
}

export interface ModeConfig {
  mode: PixelMode;
  label: string;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  /** Registry file path (for Prompt output). */
  registryFile: string;
  /** Exported symbol name to append to (for Prompt output). */
  registryName: string;
}
```

**Step 2: Create `constants.ts`**

```ts
import type { ModeConfig, PixelMode, PixelPlaygroundState } from './types';

export const MODE_CONFIG: Record<PixelMode, ModeConfig> = {
  corners: {
    mode: 'corners',
    label: 'Corners',
    defaultSize: 8,
    minSize: 2,
    maxSize: 24,
    registryFile: 'packages/pixel/src/shapes.ts',
    registryName: 'SHAPE_REGISTRY',
  },
  patterns: {
    mode: 'patterns',
    label: 'Patterns',
    defaultSize: 8,
    minSize: 4,
    maxSize: 16,
    registryFile: 'packages/pixel/src/patterns.ts',
    registryName: 'PATTERN_REGISTRY',
  },
  icons: {
    mode: 'icons',
    label: 'Icons',
    defaultSize: 16,
    minSize: 8,
    maxSize: 32,
    registryFile: 'packages/radiants/pixel-icons/source.ts',
    registryName: 'pixelIconSource',
  },
};

export const DEFAULT_STATE: PixelPlaygroundState = {
  mode: 'patterns',
  gridSize: MODE_CONFIG.patterns.defaultSize,
  fgToken: 'main',
  bgToken: 'page',
  selectedEntry: null,
};

/** Resolved CSS colors for canvas (1-bit: filled = ink, empty = page). */
export const CANVAS_FG_VAR = 'var(--color-ink)';
export const CANVAS_BG_VAR = 'var(--color-page)';
```

**Step 3: Create `PixelPlayground.tsx` (shell only)**

```tsx
'use client';

import { useState } from 'react';
import type { PixelPlaygroundState } from './types';
import { DEFAULT_STATE } from './constants';

export function PixelPlayground() {
  const [state, setState] = useState<PixelPlaygroundState>(DEFAULT_STATE);

  return (
    <div className="h-full flex">
      <div className="w-56 shrink-0 border-r border-rule bg-card flex flex-col">
        <div className="p-3 text-xs text-mute uppercase">Sidebar</div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 bg-depth grid place-items-center text-sm text-mute">
          Canvas ({state.mode}, {state.gridSize}×{state.gridSize})
        </div>
      </div>
      <div className="w-72 shrink-0 border-l border-rule bg-card flex flex-col">
        <div className="flex-1 p-3 text-xs text-mute uppercase">Preview</div>
        <div className="h-48 border-t border-rule p-3 text-xs text-mute uppercase">Output</div>
      </div>
    </div>
  );
}
```

**Step 4: Create `index.ts`**

```ts
export { PixelPlayground } from './PixelPlayground';
export type { PixelMode, OutputFormat, PixelPlaygroundState } from './types';
```

**Step 5: Wire into BrandAssetsApp**

Replace the Task-1 stub at the `pixel` branch of `BrandAssetsApp.tsx`:

```tsx
) : activeTab === 'pixel' ? (
  <AppWindow.Content className="bg-gradient-to-b from-cream to-sun-yellow dark:from-page dark:to-page">
    <AppWindow.Island corners="pixel" padding="none" noScroll className="@container">
      <PixelPlayground />
    </AppWindow.Island>
  </AppWindow.Content>
) : (
```

Add import near the other apps imports at the top:

```tsx
import { PixelPlayground } from '@/components/apps/pixel-playground';
```

Keep the same `eslint-disable-next-line rdna/no-hardcoded-colors` as the sibling branch, since the gradient uses brand colors.

**Step 6: Verify in browser**

`pnpm dev` → BrandAssets → Pixel tab. Confirm three-column shell renders with correct semantic colors in both light + dark.

**Step 7: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/ apps/rad-os/components/apps/BrandAssetsApp.tsx
git commit -m "feat(pixel-playground): scaffold component shell"
```

---

### Task 3: Add sub-tab navigation (Corners / Patterns / Icons)

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/ModeNav.tsx`
- Modify: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx`

**Step 1: Create `ModeNav.tsx`**

```tsx
'use client';

import { ToggleGroup } from '@rdna/radiants/components/core';
import type { PixelMode } from './types';
import { MODE_CONFIG } from './constants';

interface ModeNavProps {
  mode: PixelMode;
  onChange: (mode: PixelMode) => void;
}

export function ModeNav({ mode, onChange }: ModeNavProps) {
  return (
    <ToggleGroup
      orientation="vertical"
      size="sm"
      value={[mode]}
      onValueChange={(vals) => {
        const next = vals[vals.length - 1];
        if (next) onChange(next as PixelMode);
      }}
    >
      {Object.values(MODE_CONFIG).map((cfg) => (
        <ToggleGroup.Item key={cfg.mode} value={cfg.mode}>
          {cfg.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup>
  );
}
```

**Step 2: Wire into `PixelPlayground.tsx`**

Replace the sidebar placeholder:

```tsx
<div className="w-56 shrink-0 border-r border-rule bg-card flex flex-col">
  <div className="p-3 border-b border-rule">
    <ModeNav
      mode={state.mode}
      onChange={(mode) => setState((prev) => ({
        ...prev,
        mode,
        gridSize: MODE_CONFIG[mode].defaultSize,
        selectedEntry: null,
      }))}
    />
  </div>
  <div className="flex-1 overflow-y-auto p-3 text-xs text-mute uppercase">Registry</div>
</div>
```

Add imports:

```tsx
import { ModeNav } from './ModeNav';
import { MODE_CONFIG } from './constants';
```

**Step 3: Verify**

Switching modes should reset grid size to the mode's default and clear `selectedEntry`.

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/
git commit -m "feat(pixel-playground): mode nav (corners/patterns/icons)"
```

---

## Phase 2: Core Editor

### Task 4: `OneBitCanvas` — `<Dotting>` locked to 1-bit + variable size

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/OneBitCanvas.tsx`

**Step 1: Write the component**

```tsx
'use client';

import { type MutableRefObject } from 'react';
import {
  Dotting,
  type DottingRef,
  type BrushTool,
  type LayerProps,
  type PixelModifyItem,
} from '@/lib/dotting';
import { CANVAS_BG_VAR, CANVAS_FG_VAR } from './constants';

export interface OneBitCanvasProps {
  dottingRef: MutableRefObject<DottingRef | null>;
  gridSize: number;
  brushTool: BrushTool;
  /** When true, strokes paint FG (ink). When false, paint BG (page). */
  brushIsFg: boolean;
  isGridVisible: boolean;
  /** Monotonic key — increment to force re-mount when forking/resizing. */
  canvasKey: number;
  initialBits?: string; // optional starting bitstring (length = gridSize²)
}

function bitsToInitLayers(bits: string, size: number): LayerProps[] {
  const origin = -Math.floor(size / 2);
  const data: PixelModifyItem[][] = [];
  for (let r = 0; r < size; r++) {
    const row: PixelModifyItem[] = [];
    for (let c = 0; c < size; c++) {
      const on = bits.charAt(r * size + c) === '1';
      row.push({
        rowIndex: origin + r,
        columnIndex: origin + c,
        color: on ? CANVAS_FG_VAR : CANVAS_BG_VAR,
      });
    }
    data.push(row);
  }
  return [{ id: 'default', data }];
}

export function OneBitCanvas({
  dottingRef,
  gridSize,
  brushTool,
  brushIsFg,
  isGridVisible,
  canvasKey,
  initialBits,
}: OneBitCanvasProps) {
  const initLayers = initialBits
    ? bitsToInitLayers(initialBits, gridSize)
    : bitsToInitLayers('0'.repeat(gridSize * gridSize), gridSize);

  return (
    <div
      className="flex-1 min-w-0 min-h-0 bg-depth grid place-items-center p-3"
      style={{ containerType: 'size' }}
    >
      <div style={{ width: 'min(100cqw, 100cqh)', height: 'min(100cqw, 100cqh)' }}>
        <Dotting
          key={canvasKey}
          ref={dottingRef}
          width="100%"
          height="100%"
          brushTool={brushTool}
          brushColor={brushIsFg ? CANVAS_FG_VAR : CANVAS_BG_VAR}
          isGridVisible={isGridVisible}
          isGridFixed={true}
          isPanZoomable={false}
          initAutoScale={true}
          initLayers={initLayers}
          backgroundColor={CANVAS_BG_VAR}
          defaultPixelColor={CANVAS_BG_VAR}
          gridStrokeColor="var(--color-rule)"
          gridStrokeWidth={0.5}
          minScale={0.3}
          maxScale={10}
          minColumnCount={gridSize}
          minRowCount={gridSize}
          maxColumnCount={gridSize}
          maxRowCount={gridSize}
        />
      </div>
    </div>
  );
}
```

**Step 2: Verify dotting accepts CSS var strings for colors**

Open `apps/rad-os/lib/dotting/components/Canvas/` and scan for how `brushColor` / `backgroundColor` flow. If dotting does `ctx.fillStyle = color` on a canvas (not SVG), it **cannot** resolve `var(--*)` — the canvas 2D context needs a resolved color. Two fallback paths:

- **Path A (simpler):** resolve vars once via `getComputedStyle(document.documentElement).getPropertyValue('--color-ink')` and pass the hex/oklch string. Re-resolve when `darkMode` flips (subscribe to `usePreferencesStore().darkMode`).
- **Path B (dotting core edit):** teach dotting to resolve CSS vars internally. Out of scope for this feature.

**If Path A is required**, pull colors via `useResolvedColor` (create as a local helper):

```tsx
function useResolvedColor(token: string): string {
  const { darkMode } = usePreferencesStore();
  return useMemo(() => {
    if (typeof window === 'undefined') return '#000';
    return getComputedStyle(document.documentElement)
      .getPropertyValue(token)
      .trim() || '#000';
  }, [token, darkMode]);
}
```

And pass resolved strings to `<Dotting>` instead of the `var(...)` expressions. Existing Studio uses literal hex (`#0f0e0c` / `#fef8e2`) so `<Dotting>` is known not to handle CSS vars.

**Document the decision** inline with a comment in `OneBitCanvas.tsx`.

**Step 3: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/OneBitCanvas.tsx
git commit -m "feat(pixel-playground): OneBitCanvas wrapping Dotting"
```

---

### Task 5: Fork EditorToolbar + ToolPalette

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/ToolPalette.tsx`
- Create: `apps/rad-os/components/apps/pixel-playground/EditorToolbar.tsx`

**Step 1: `ToolPalette.tsx`** — copy from `studio/ToolPalette.tsx` verbatim. Same tool set works for 1-bit.

**Step 2: `EditorToolbar.tsx`** — copy from `studio/EditorToolbar.tsx`, drop the Radnom button and the PNG download button. Keep undo/redo/grid toggle/clear. Remove the `onRadnom` prop.

```tsx
// Signature
interface EditorToolbarProps {
  dottingRef: MutableRefObject<DottingRef | null>;
  isGridVisible: boolean;
  onGridToggle: (visible: boolean) => void;
}
```

Toolbar body keeps `Undo | Redo | Grid toggle | Clear`. No trailing spacer + Radnom + Download.

**Step 3: Wire both into `PixelPlayground.tsx`**

Replace center column placeholder:

```tsx
<div className="flex-1 min-w-0 flex flex-col">
  <EditorToolbar
    dottingRef={dottingRef}
    isGridVisible={isGridVisible}
    onGridToggle={setGridVisible}
  />
  <div className="flex flex-1 min-h-0">
    <div className="shrink-0 p-2 border-r border-rule">
      <ToolPalette activeTool={activeTool} onToolChange={changeBrushTool} />
    </div>
    <OneBitCanvas
      dottingRef={dottingRef}
      gridSize={state.gridSize}
      brushTool={activeTool}
      brushIsFg={brushColor !== CANVAS_BG_VAR}
      isGridVisible={isGridVisible}
      canvasKey={canvasKey}
    />
  </div>
</div>
```

Add the brush hook + refs at the top of `PixelPlayground`:

```tsx
const dottingRef = useRef<DottingRef>(null);
const { brushTool, brushColor, changeBrushTool, changeBrushColor } = useBrush(dottingRef);
const [isGridVisible, setGridVisible] = useState(true);
const [canvasKey, setCanvasKey] = useState(0);
const activeTool = brushTool ?? BrushTool.DOT;
```

Imports:

```tsx
import { useRef } from 'react';
import { BrushTool, useBrush, type DottingRef } from '@/lib/dotting';
import { OneBitCanvas } from './OneBitCanvas';
import { EditorToolbar } from './EditorToolbar';
import { ToolPalette } from './ToolPalette';
import { CANVAS_BG_VAR } from './constants';
```

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/
git commit -m "feat(pixel-playground): toolbar + tool palette + canvas wiring"
```

---

### Task 6: Grid size control

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx`

**Step 1: Add grid-size stepper in sidebar**

Below the ModeNav in the sidebar:

```tsx
<div className="p-3 border-b border-rule flex items-center gap-2">
  <span className="font-heading text-xs text-mute uppercase">Size</span>
  <Button
    size="sm"
    iconOnly
    icon="minus"
    disabled={state.gridSize <= MODE_CONFIG[state.mode].minSize}
    onClick={() => {
      setState((prev) => ({ ...prev, gridSize: Math.max(MODE_CONFIG[prev.mode].minSize, prev.gridSize - 1) }));
      setCanvasKey((k) => k + 1);
    }}
  />
  <span className="font-mono text-sm tabular-nums min-w-[2ch] text-center">{state.gridSize}</span>
  <Button
    size="sm"
    iconOnly
    icon="plus"
    disabled={state.gridSize >= MODE_CONFIG[state.mode].maxSize}
    onClick={() => {
      setState((prev) => ({ ...prev, gridSize: Math.min(MODE_CONFIG[prev.mode].maxSize, prev.gridSize + 1) }));
      setCanvasKey((k) => k + 1);
    }}
  />
</div>
```

Note: resizing always re-mounts the canvas and loses pixels. That's acceptable for v1; "preserve existing cells on resize" is an enhancement.

**Step 2: Verify**

Click +/−, confirm canvas re-mounts at the new size. Confirm min/max bounds.

**Step 3: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx
git commit -m "feat(pixel-playground): grid size stepper"
```

---

## Phase 3: Output Panel

### Task 7: `generatePixelCode` pure function + tests

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/pixel-code-gen.ts`
- Create: `apps/rad-os/components/apps/pixel-playground/__tests__/pixel-code-gen.test.ts`

**Step 1: Write failing tests first**

```ts
import { describe, expect, it } from 'vitest';
import { generatePixelCode } from '../pixel-code-gen';
import type { PixelGrid } from '@rdna/pixel';

const sample: PixelGrid = {
  name: 'starfield',
  width: 8,
  height: 8,
  bits: '10000000000100000000001000100000000000000010100000000000001000010000000000000001',
};

describe('generatePixelCode — patterns', () => {
  it('snippet format emits a TS object literal', () => {
    const out = generatePixelCode('patterns', 'snippet', sample);
    expect(out).toContain("name: 'starfield'");
    expect(out).toContain("width: 8");
    expect(out).toContain("height: 8");
    expect(out).toContain("bits: '10000000000100000000001000100000000000000010100000000000001000010000000000000001'");
  });

  it('prompt format names the registry file and symbol', () => {
    const out = generatePixelCode('patterns', 'prompt', sample);
    expect(out).toContain('packages/pixel/src/patterns.ts');
    expect(out).toContain('PATTERN_REGISTRY');
    expect(out).toContain("name: 'starfield'");
  });

  it('bitstring format shows row-by-row visualization', () => {
    const out = generatePixelCode('patterns', 'bitstring', sample);
    // 8 rows of 8 chars, with · for 0 and ■ for 1
    const lines = out.split('\n').filter((l) => l.length > 0);
    expect(lines[0]).toContain('■');
    expect(lines[0]).toContain('·');
    expect(lines[0]).toHaveLength(8 * 2 - 1); // 8 glyphs + 7 spaces
  });

  it('svg format emits a self-contained <svg>', () => {
    const out = generatePixelCode('patterns', 'svg', sample);
    expect(out.startsWith('<svg ')).toBe(true);
    expect(out).toContain('width="8"');
    expect(out).toContain('height="8"');
    expect(out).toContain('<path');
  });
});

describe('generatePixelCode — icons', () => {
  it('prompt points at pixelIconSource in radiants', () => {
    const icon: PixelGrid = { name: 'arrow', width: 16, height: 16, bits: '0'.repeat(256) };
    const out = generatePixelCode('icons', 'prompt', icon);
    expect(out).toContain('packages/radiants/pixel-icons/source.ts');
    expect(out).toContain('pixelIconSource');
  });
});

describe('generatePixelCode — corners', () => {
  it('prompt points at shapes.ts and SHAPE_REGISTRY', () => {
    const corner: PixelGrid = { name: 'notch-8', width: 8, height: 8, bits: '0'.repeat(64) };
    const out = generatePixelCode('corners', 'prompt', corner);
    expect(out).toContain('packages/pixel/src/shapes.ts');
    expect(out).toContain('SHAPE_REGISTRY');
  });
});
```

Run to confirm failure:

```bash
pnpm --filter rad-os test pixel-code-gen -- --run
```

Expected: `FAIL Cannot find module '../pixel-code-gen'`.

**Step 2: Implement**

```ts
import type { PixelGrid } from '@rdna/pixel';
import type { OutputFormat, PixelMode } from './types';
import { MODE_CONFIG } from './constants';
import { bitsToPath } from '@rdna/pixel';

export function generatePixelCode(
  mode: PixelMode,
  format: OutputFormat,
  grid: PixelGrid,
): string {
  switch (format) {
    case 'snippet':
      return formatSnippet(grid);
    case 'prompt':
      return formatPrompt(mode, grid);
    case 'bitstring':
      return formatBitstring(grid);
    case 'svg':
      return formatSvg(grid);
  }
}

function formatSnippet(grid: PixelGrid): string {
  return `{ name: '${grid.name}', width: ${grid.width}, height: ${grid.height}, bits: '${grid.bits}' }`;
}

function formatPrompt(mode: PixelMode, grid: PixelGrid): string {
  const cfg = MODE_CONFIG[mode];
  const verb = {
    patterns: 'Add this pattern to',
    icons: 'Add this pixel icon to',
    corners: 'Register this custom corner shape in',
  }[mode];
  return [
    `${verb} ${cfg.registryName} in ${cfg.registryFile}:`,
    '',
    `  ${formatSnippet(grid)}`,
  ].join('\n');
}

function formatBitstring(grid: PixelGrid): string {
  const lines: string[] = [];
  for (let r = 0; r < grid.height; r++) {
    const row: string[] = [];
    for (let c = 0; c < grid.width; c++) {
      row.push(grid.bits.charAt(r * grid.width + c) === '1' ? '■' : '·');
    }
    lines.push(row.join(' '));
  }
  return lines.join('\n');
}

function formatSvg(grid: PixelGrid): string {
  const d = bitsToPath(grid.bits, grid.width, grid.height);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid.width} ${grid.height}" width="${grid.width}" height="${grid.height}">`,
    `  <path fill="currentColor" d="${d}" />`,
    `</svg>`,
  ].join('\n');
}
```

**Step 3: Run tests, confirm all pass**

```bash
pnpm --filter rad-os test pixel-code-gen -- --run
```

Expected: 6 passed.

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/pixel-code-gen.ts apps/rad-os/components/apps/pixel-playground/__tests__/
git commit -m "feat(pixel-playground): output code generators + tests"
```

---

### Task 8: `PixelCodeOutput` component

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/PixelCodeOutput.tsx`
- Modify: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx`

**Step 1: Build component (mirror `ComponentCodeOutput`)**

```tsx
'use client';

import { useState } from 'react';
import { Button, ToggleGroup } from '@rdna/radiants/components/core';
import type { PixelGrid } from '@rdna/pixel';
import type { OutputFormat, PixelMode } from './types';
import { generatePixelCode } from './pixel-code-gen';

interface PixelCodeOutputProps {
  mode: PixelMode;
  grid: PixelGrid | null;
}

export function PixelCodeOutput({ mode, grid }: PixelCodeOutputProps) {
  const [format, setFormat] = useState<OutputFormat>('prompt');
  const [copied, setCopied] = useState(false);

  if (!grid) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-mute text-center">Draw something to see its output</p>
      </div>
    );
  }

  const code = generatePixelCode(mode, format, grid);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col min-h-0 max-h-full overflow-hidden">
      <div className="shrink-0 px-3 py-2 border-b border-rule">
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
      </div>

      <div className="min-h-0 p-3 overflow-auto">
        <pre className="font-mono text-xs text-sub bg-depth p-3 whitespace-pre-wrap">{code}</pre>
      </div>

      <div className="shrink-0 px-3 py-2 border-t border-rule">
        <ToggleGroup
          value={[format]}
          onValueChange={(vals) => { if (vals.length) setFormat(vals[0] as OutputFormat); }}
          size="sm"
          compact
        >
          <ToggleGroup.Item value="prompt">Prompt</ToggleGroup.Item>
          <ToggleGroup.Item value="snippet">Snippet</ToggleGroup.Item>
          <ToggleGroup.Item value="bitstring">Bitstring</ToggleGroup.Item>
          <ToggleGroup.Item value="svg">SVG</ToggleGroup.Item>
        </ToggleGroup>
      </div>
    </div>
  );
}
```

**Step 2: Wire into right column**

Replace the output placeholder in `PixelPlayground.tsx`:

```tsx
<div className="h-48 border-t border-rule">
  <PixelCodeOutput mode={state.mode} grid={currentGrid} />
</div>
```

`currentGrid` comes from Task 9.

**Step 3: Commit** (will wire in Task 9)

---

### Task 9: Bitstring extraction from dotting layer data

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/bits-from-layer.ts`
- Create: `apps/rad-os/components/apps/pixel-playground/__tests__/bits-from-layer.test.ts`
- Modify: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx`

**Step 1: Failing test**

```ts
import { describe, expect, it } from 'vitest';
import { bitsFromLayer } from '../bits-from-layer';
import type { LayerProps } from '@/lib/dotting';

const FG = '#111';
const BG = '#fff';

function makeLayer(size: number, on: Array<[number, number]>): LayerProps {
  const origin = -Math.floor(size / 2);
  const set = new Set(on.map(([r, c]) => `${r}:${c}`));
  const data = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push({
        rowIndex: origin + r,
        columnIndex: origin + c,
        color: set.has(`${r}:${c}`) ? FG : BG,
      });
    }
    data.push(row);
  }
  return { id: 'default', data };
}

describe('bitsFromLayer', () => {
  it('emits 1s for FG pixels and 0s for BG', () => {
    const layer = makeLayer(3, [[0, 0], [1, 1], [2, 2]]);
    const bits = bitsFromLayer(layer, 3, FG);
    expect(bits).toBe('100010001');
  });

  it('treats anything not matching FG as 0', () => {
    const layer = makeLayer(2, []);
    const bits = bitsFromLayer(layer, 2, FG);
    expect(bits).toBe('0000');
  });
});
```

Run: `pnpm --filter rad-os test bits-from-layer -- --run` → FAIL.

**Step 2: Implement**

```ts
import type { LayerProps } from '@/lib/dotting';

export function bitsFromLayer(layer: LayerProps, size: number, fgColor: string): string {
  const chars: string[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = layer.data[r]?.[c];
      chars.push(cell && cell.color === fgColor ? '1' : '0');
    }
  }
  return chars.join('');
}
```

Run tests → PASS.

**Step 3: Wire into PixelPlayground**

Use the dotting `useLayers` hook (exported from `@/lib/dotting/hooks`) to subscribe to layer changes:

```tsx
import { useLayers } from '@/lib/dotting';

// inside PixelPlayground
const { layers } = useLayers(dottingRef);
const fgColor = useResolvedColor('--color-ink'); // from Task 4 helper

const currentGrid: PixelGrid | null = useMemo(() => {
  const layer = layers?.[0];
  if (!layer) return null;
  const bits = bitsFromLayer(layer, state.gridSize, fgColor);
  const hasAny = bits.includes('1');
  if (!hasAny && !state.selectedEntry) return null;
  return {
    name: state.selectedEntry?.name ?? 'untitled',
    width: state.gridSize,
    height: state.gridSize,
    bits,
  };
}, [layers, state.gridSize, state.selectedEntry, fgColor]);
```

Pass `currentGrid` to `<PixelCodeOutput grid={currentGrid} ... />`.

**Step 4: Verify**

Draw pixels, confirm the output pane updates on every stroke.

**Step 5: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/
git commit -m "feat(pixel-playground): live bitstring + output panel"
```

---

## Phase 4: Registry Browser

### Task 10: Thumbnail renderer

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/PixelThumb.tsx`

**Step 1: Build component**

```tsx
import type { PixelGrid } from '@rdna/pixel';
import { bitsToPath } from '@rdna/pixel';

interface PixelThumbProps {
  grid: PixelGrid;
  size?: number; // rendered px
  className?: string;
}

export function PixelThumb({ grid, size = 40, className = '' }: PixelThumbProps) {
  const d = bitsToPath(grid.bits, grid.width, grid.height);
  return (
    <svg
      className={`text-main ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${grid.width} ${grid.height}`}
      aria-hidden
      style={{ imageRendering: 'pixelated' }}
    >
      <rect width={grid.width} height={grid.height} fill="var(--color-page)" />
      <path d={d} fill="currentColor" />
    </svg>
  );
}
```

**Step 2: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/PixelThumb.tsx
git commit -m "feat(pixel-playground): PixelThumb renderer"
```

---

### Task 11: Registry sidebar with fork-to-edit

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/RegistryList.tsx`
- Modify: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx`

**Step 1: Gather registries per mode**

Create a helper in `constants.ts`:

```ts
import { PATTERN_REGISTRY, CORNER_SETS } from '@rdna/pixel';
import { pixelIconSource } from '@rdna/radiants/pixel-icons';
import type { PixelGrid } from '@rdna/pixel';
import type { PixelMode } from './types';

export function getRegistryForMode(mode: PixelMode): readonly PixelGrid[] {
  switch (mode) {
    case 'patterns':
      return PATTERN_REGISTRY;
    case 'icons':
      return pixelIconSource;
    case 'corners':
      // CORNER_SETS is Record<string, PixelCornerSet>; emit TL covers only
      return Object.values(CORNER_SETS).map((set) => set.tl);
  }
}
```

**Step 2: Build `RegistryList.tsx`**

```tsx
'use client';

import type { PixelGrid } from '@rdna/pixel';
import { Icon } from '@rdna/radiants/icons/runtime';
import { PixelThumb } from './PixelThumb';

interface RegistryListProps {
  entries: readonly PixelGrid[];
  selectedName: string | null;
  onSelect: (entry: PixelGrid | null) => void; // null = +New
}

export function RegistryList({ entries, selectedName, onSelect }: RegistryListProps) {
  return (
    <ul className="grid grid-cols-3 gap-1.5 p-2">
      <li>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`w-full aspect-square flex items-center justify-center border border-rule hover:border-line ${
            selectedName === null ? 'border-line bg-depth' : 'bg-card'
          }`}
          aria-label="New blank"
        >
          <Icon name="plus" />
        </button>
      </li>
      {entries.map((entry) => (
        <li key={entry.name}>
          <button
            type="button"
            onClick={() => onSelect(entry)}
            className={`w-full aspect-square flex items-center justify-center border border-rule hover:border-line ${
              selectedName === entry.name ? 'border-line bg-depth' : 'bg-card'
            }`}
            aria-label={entry.name}
            title={entry.name}
          >
            <PixelThumb grid={entry} size={32} />
          </button>
        </li>
      ))}
    </ul>
  );
}
```

**Step 3: Wire into `PixelPlayground`**

In the sidebar below the grid-size stepper:

```tsx
<div className="flex-1 overflow-y-auto">
  <RegistryList
    entries={getRegistryForMode(state.mode)}
    selectedName={state.selectedEntry?.name ?? null}
    onSelect={(entry) => {
      setState((prev) => ({
        ...prev,
        selectedEntry: entry,
        gridSize: entry ? entry.width : MODE_CONFIG[prev.mode].defaultSize,
      }));
      setCanvasKey((k) => k + 1);
    }}
  />
</div>
```

Pass `state.selectedEntry?.bits` into `<OneBitCanvas initialBits=... />`.

**Step 4: Verify**

Click a pattern → canvas loads with that pattern's cells. Click `+` → canvas blanks.

**Step 5: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/
git commit -m "feat(pixel-playground): registry browser + fork-to-edit"
```

---

## Phase 5: Mode-Specific Previews

### Task 12: Pattern preview (tiled bg)

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/previews/PatternPreview.tsx`

**Step 1: Build**

```tsx
'use client';

import { useMemo } from 'react';
import { buildMaskAsset, maskHostStyle } from '@rdna/pixel';
import type { PixelGrid } from '@rdna/pixel';

interface PatternPreviewProps {
  grid: PixelGrid;
  fgVar?: string;
  bgVar?: string;
  scale?: number;
}

export function PatternPreview({
  grid,
  fgVar = 'var(--color-main)',
  bgVar = 'var(--color-page)',
  scale = 4,
}: PatternPreviewProps) {
  const style = useMemo(() => {
    const asset = buildMaskAsset(grid);
    return maskHostStyle(asset, { tiled: true, scale });
  }, [grid, scale]);

  return (
    <div className="h-full w-full flex flex-col gap-3 p-3">
      <div className="text-xs text-mute uppercase">Tiled on page surface</div>
      <div className="flex-1 relative overflow-hidden border border-rule" style={{ background: bgVar }}>
        <div className="absolute inset-0" style={{ ...style, background: fgVar }} />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/previews/
git commit -m "feat(pixel-playground): pattern preview"
```

---

### Task 13: Icon preview (size specimens)

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/previews/IconPreview.tsx`

```tsx
'use client';

import type { PixelGrid } from '@rdna/pixel';
import { PixelThumb } from '../PixelThumb';

interface IconPreviewProps {
  grid: PixelGrid;
}

const SPECIMENS = [16, 24, 32, 48, 64];

export function IconPreview({ grid }: IconPreviewProps) {
  return (
    <div className="h-full w-full flex flex-col gap-4 p-3">
      <div className="text-xs text-mute uppercase">Specimens</div>
      <div className="flex-1 flex flex-wrap items-end gap-4 content-start">
        {SPECIMENS.map((s) => (
          <div key={s} className="flex flex-col items-center gap-1">
            <PixelThumb grid={grid} size={s} />
            <span className="font-mono text-xs text-mute">{s}px</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Commit:** `feat(pixel-playground): icon preview`

---

### Task 14: Corner preview (live 4-way mirror + mock frame)

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/previews/CornerPreview.tsx`
- Create: `apps/rad-os/components/apps/pixel-playground/previews/corner-mirror.ts`
- Create: `apps/rad-os/components/apps/pixel-playground/__tests__/corner-mirror.test.ts`

**Step 1: Test mirroring helpers**

The `@rdna/pixel` package already exports `mirrorH`, `mirrorV`, `mirrorForCorner`. Write a small test to confirm our preview uses them correctly:

```ts
import { describe, expect, it } from 'vitest';
import { buildCornerMockGrids } from '../previews/corner-mirror';

describe('buildCornerMockGrids', () => {
  it('returns four grids (tl/tr/bl/br) for a given TL', () => {
    const tl = { name: 'tl', width: 2, height: 2, bits: '1010' };
    const out = buildCornerMockGrids(tl);
    expect(out.tl.bits).toBe('1010');
    expect(out.tr.bits).toBe('0101'); // mirrorH
    expect(out.bl.bits).toBe('1010'); // mirrorV of 1010 (rows reversed)... verify with @rdna/pixel
    expect(out.br.bits).toHaveLength(4);
  });
});
```

(Adjust expected strings to match actual `mirrorH`/`mirrorV` behavior; write them against the real functions.)

Run → FAIL.

**Step 2: Implement helper**

```ts
// corner-mirror.ts
import { mirrorForCorner } from '@rdna/pixel';
import type { PixelGrid } from '@rdna/pixel';

export function buildCornerMockGrids(tl: PixelGrid) {
  return {
    tl,
    tr: mirrorForCorner(tl, 'tr'),
    bl: mirrorForCorner(tl, 'bl'),
    br: mirrorForCorner(tl, 'br'),
  };
}
```

Run → PASS.

**Step 3: Build `CornerPreview`**

```tsx
'use client';

import type { PixelGrid } from '@rdna/pixel';
import { buildCornerMockGrids } from './corner-mirror';
import { PixelThumb } from '../PixelThumb';

interface CornerPreviewProps {
  tl: PixelGrid;
}

export function CornerPreview({ tl }: CornerPreviewProps) {
  const corners = buildCornerMockGrids(tl);
  const cornerPx = 40;
  return (
    <div className="h-full w-full flex flex-col gap-3 p-3">
      <div className="text-xs text-mute uppercase">4-way mirror</div>
      <div className="flex-1 grid place-items-center bg-depth">
        <div className="relative w-64 h-40 bg-card">
          <div className="absolute top-0 left-0"><PixelThumb grid={corners.tl} size={cornerPx} /></div>
          <div className="absolute top-0 right-0"><PixelThumb grid={corners.tr} size={cornerPx} /></div>
          <div className="absolute bottom-0 left-0"><PixelThumb grid={corners.bl} size={cornerPx} /></div>
          <div className="absolute bottom-0 right-0"><PixelThumb grid={corners.br} size={cornerPx} /></div>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/previews/ apps/rad-os/components/apps/pixel-playground/__tests__/
git commit -m "feat(pixel-playground): corner preview with 4-way mirror"
```

---

### Task 15: Wire previews into right column

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx`

**Step 1: Replace preview placeholder**

```tsx
<div className="flex-1 min-h-0">
  {currentGrid ? (
    state.mode === 'patterns' ? <PatternPreview grid={currentGrid} /> :
    state.mode === 'icons'    ? <IconPreview grid={currentGrid} /> :
                                <CornerPreview tl={currentGrid} />
  ) : (
    <div className="h-full grid place-items-center text-sm text-mute p-4">
      Draw or fork a registry entry to preview
    </div>
  )}
</div>
```

Add imports from `./previews/*`.

**Step 2: Verify each mode**

Light + dark; switch modes and confirm preview adapts.

**Step 3: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx
git commit -m "feat(pixel-playground): wire per-mode previews"
```

---

## Phase 6: Quality Pass

### Task 16: Lint + type-check + RDNA check

**Step 1: Run all checks**

```bash
pnpm lint:design-system
pnpm --filter rad-os typecheck
pnpm --filter rad-os test -- --run
pnpm lint
```

**Step 2: Fix any RDNA violations**

Common suspects:
- Semantic token swaps (`bg-[#...]` → `bg-page` etc.)
- `font-joystix` uppercase conventions on section headers
- Arbitrary spacing values

**Step 3: Visual pass in both themes**

- Light + dark, at each mode, with and without a forked registry entry, with a small and large grid.
- Verify `pnpm test --filter rad-os` passes (≥10 new tests from Tasks 7, 9, 14).

**Step 4: Commit fixes**

```bash
git add -p  # stage fixes
git commit -m "chore(pixel-playground): rdna + lint + visual polish"
```

---

## Deferred (explicitly out of scope for v1)

These are flagged in the brainstorm and should ship as follow-on PRs, not crammed into this plan:

- **Symmetry / mirror stroke modes** for patterns/icons (corners already mirror in preview).
- **Shape-generator seeds** for corners (dropdown to seed from `SHAPE_REGISTRY`).
- **SVG/image import** via `packages/pixel/src/import.ts`.
- **FG/BG preview token picker** (preview uses `--color-main` / `--color-page` hard-wired for v1).
- **Persist last state across tab switches** (currently resets on mount).
- **Preserve-cells-on-resize.**
- **Mobile modal variant.**
- **Category selector for prompt output** ("under Figurative") — currently Prompt format omits the group hint.

---

## Summary of Files Touched

**New** (`apps/rad-os/components/apps/pixel-playground/`):
- `index.ts`, `types.ts`, `constants.ts`
- `PixelPlayground.tsx`
- `ModeNav.tsx`, `OneBitCanvas.tsx`, `ToolPalette.tsx`, `EditorToolbar.tsx`
- `PixelCodeOutput.tsx`, `pixel-code-gen.ts`
- `bits-from-layer.ts`
- `PixelThumb.tsx`, `RegistryList.tsx`
- `previews/PatternPreview.tsx`, `previews/IconPreview.tsx`, `previews/CornerPreview.tsx`, `previews/corner-mirror.ts`
- `__tests__/pixel-code-gen.test.ts`, `__tests__/bits-from-layer.test.ts`, `__tests__/corner-mirror.test.ts`

**Modified:**
- `apps/rad-os/components/apps/BrandAssetsApp.tsx` — add `pixel` to `TAB_NAV`, add render branch.

**Untouched but read-from:**
- `@rdna/pixel` — `PATTERN_REGISTRY`, `CORNER_SETS`, `pixelIconSource`, `mirrorForCorner`, `bitsToPath`, `buildMaskAsset`, `maskHostStyle`
- `@/lib/dotting` — `Dotting`, `useBrush`, `useDotting`, `useLayers`, `BrushTool`
- `apps/rad-os/components/apps/studio/*` — reference for fork (do NOT modify)
- `apps/rad-os/components/ui/ui-library/ComponentCodeOutput.tsx` — reference for output panel
