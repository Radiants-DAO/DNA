# Pretext Layout Editor — Backend Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Build the data model, obstacle geometry engine, and registration API for a pretext-aware layout inspector — shipped as `@rdna/controls/pretext`.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA` → branch `feat/pretext-editor` (create at execution time)

**Architecture:** A subpath export (`packages/controls/src/pretext/`) within the `@rdna/controls` package. It provides a `usePretextSurface` React hook that registers columns, obstacles, and runtime text handles prepared by the host. The backend owns the geometry math (circle, rect, and polygon scanlines), wrap-slot selection, host-sync API, and layout descriptor schema; exported descriptors strip runtime-only fields like `prepared` and DOM refs. It **never** calls `prepare()` / `prepareWithSegments()` — the host owns preparation. The backend only calls `layoutNextLine` and `walkLineRanges` on already-prepared text.

**Tech Stack:** React 19, TypeScript, Vitest, `@chenglou/pretext` (optional peer dep + local devDependency for package tests), `@rdna/controls` (host package)

**Depends on:** `packages/controls/` package shell existing (Task 2 from `docs/plans/2026-03-27-rdna-controls-library.md`). If that hasn't been executed yet, run those first two tasks before starting here.

**Key reference files:**
- `@chenglou/pretext/src/layout.ts` — public API types (`LayoutCursor`, `LayoutLine`, `PreparedTextWithSegments`, `walkLineRanges`, `layoutNextLine`)
- `@chenglou/pretext/demos/wrap-geometry.ts` — `carveTextLineSlots`, `getPolygonIntervalForBand`, `transformWrapPoints`, `getWrapHull`, types (`Point`, `Interval`, `Rect`)
- `@chenglou/pretext/demos/editorial-engine.ts` — `circleIntervalForBand`, `CircleObstacle`, `PullquotePlacement`, `layoutColumn`, `fitHeadline`, `syncPool`
- `apps/rad-os/components/apps/GoodNewsApp.tsx` — first consumer (current implementation to be migrated)

---

### Task 1: Create Feature Branch

**Step 1: Create worktree and branch**

Run:

```bash
cd /Users/rivermassey/Desktop/dev/DNA
git worktree add ../DNA-pretext-editor -b feat/pretext-editor
```

**Step 2: Verify**

Run:

```bash
git worktree list
```

Expected: new entry at `../DNA-pretext-editor` on `feat/pretext-editor`.

All subsequent tasks run from `/Users/rivermassey/Desktop/dev/DNA-pretext-editor`.

---

### Task 2: Verify Package Shell Exists

The `@rdna/controls` package must exist before we add the pretext subpath. Check:

```bash
ls packages/controls/package.json
```

If it doesn't exist, execute Tasks 1–2 from `docs/plans/2026-03-27-rdna-controls-library.md` first, then return here.

**Step 1: Add the pretext subpath export to `packages/controls/package.json`**

Add to the `"exports"` field:

```json
"./pretext": "./src/pretext/index.ts"
```

Add to `"peerDependencies"`:

```json
"@chenglou/pretext": "^0.0.2"
```

Mark `@chenglou/pretext` as an **optional** peer dep so consumers who don't use the pretext inspector aren't forced to install it:

```json
"peerDependenciesMeta": {
  "@chenglou/pretext": { "optional": true }
}
```

Also add `@chenglou/pretext` to `"devDependencies"` of `packages/controls/package.json` so the package's own source and tests can resolve it locally:

```bash
pnpm --filter @rdna/controls add -D @chenglou/pretext@^0.0.2
```

This repo currently installs `@chenglou/pretext` in app/package consumers, not at the workspace root, so the extra local devDependency is required for `packages/controls` test/build ergonomics.

**Step 2: Create the directory**

```bash
mkdir -p packages/controls/src/pretext
```

**Step 3: Commit**

```bash
git add packages/controls/package.json packages/controls/src/pretext pnpm-lock.yaml
git commit -m "feat(controls): add pretext subpath export"
```

---

### Task 3: Type Definitions — Obstacle, Column, TextBlock, Surface Config

This is the core data model. Everything else builds on these types.

**Files:**
- Create: `packages/controls/src/pretext/types.ts`
- Create: `packages/controls/src/pretext/index.ts`
- Test: `packages/controls/test/pretext/types.test.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/pretext/types.test.ts`:

```ts
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import { describe, expect, it } from 'vitest';
import type {
  WrapSide,
  ContourType,
  Offsets,
  ColumnDef,
  RectObstacleDef,
  CircleObstacleDef,
  PolygonObstacleDef,
  DropcapObstacleDef,
  PullquoteObstacleDef,
  ObstacleDef,
  TextBlockDef,
  TextBlockRegistration,
  HostSurfaceRegistration,
  PretextSurfaceConfig,
  LayoutDescriptor,
} from '../../src/pretext/types';

describe('pretext types', () => {
  const prepared = {} as PreparedTextWithSegments;

  it('WrapSide has expected values', () => {
    const sides: WrapSide[] = ['leftSide', 'rightSide', 'both', 'largestArea'];
    expect(sides).toHaveLength(4);
  });

  it('ContourType has expected values', () => {
    const types: ContourType[] = ['boundingBox', 'circle', 'polygon'];
    expect(types).toHaveLength(3);
  });

  it('ColumnDef has required fields', () => {
    const col: ColumnDef = { id: 'left', x: 16, width: 180 };
    expect(col.id).toBe('left');
  });

  it('RectObstacleDef is valid', () => {
    const obs: RectObstacleDef = {
      id: 'hero',
      contour: 'boundingBox',
      bounds: { x: 210, y: 0, width: 340, height: 240 },
      wrap: 'both',
      offsets: { top: 0, right: 12, bottom: 12, left: 12 },
    };
    expect(obs.contour).toBe('boundingBox');
  });

  it('CircleObstacleDef is valid', () => {
    const obs: CircleObstacleDef = {
      id: 'orb',
      contour: 'circle',
      cx: 300,
      cy: 400,
      radius: 60,
      wrap: 'both',
      offsets: { top: 6, right: 6, bottom: 6, left: 6 },
    };
    expect(obs.contour).toBe('circle');
  });

  it('DropcapObstacleDef is valid', () => {
    const obs: DropcapObstacleDef = {
      id: 'dropcap',
      type: 'dropcap',
      character: 'G',
      font: "64px 'Waves Blackletter CPC'",
      lineCount: 3,
    };
    expect(obs.type).toBe('dropcap');
  });

  it('PullquoteObstacleDef is valid', () => {
    const obs: PullquoteObstacleDef = {
      id: 'quote',
      type: 'pullquote',
      text: 'In the twilight...',
      font: 'italic 20px Mondwest',
      maxWidth: 160,
      wrap: 'rightSide',
      offsets: { top: 12, right: 12, bottom: 12, left: 0 },
    };
    expect(obs.type).toBe('pullquote');
  });

  it('TextBlockDef has required fields', () => {
    const block: TextBlockDef = {
      id: 'body',
      font: '16px Mondwest',
      lineHeight: 19.2,
    };
    expect(block.font).toBe('16px Mondwest');
  });

  it('TextBlockDef supports optional whiteSpace', () => {
    const block: TextBlockDef = {
      id: 'code',
      font: '14px monospace',
      lineHeight: 20,
      whiteSpace: 'pre-wrap',
    };
    expect(block.whiteSpace).toBe('pre-wrap');
  });

  it('TextBlockRegistration carries prepared text at runtime', () => {
    const block: TextBlockRegistration = {
      id: 'body',
      font: '16px Mondwest',
      lineHeight: 19.2,
      prepared,
    };
    expect(block.prepared).toBe(prepared);
  });

  it('HostSurfaceRegistration requires prepared text handles', () => {
    const config: HostSurfaceRegistration = {
      columns: [],
      obstacles: [],
      textBlocks: [{ id: 'body', font: '16px serif', lineHeight: 24, prepared }],
    };
    expect(config.textBlocks[0]!.prepared).toBe(prepared);
  });

  it('PretextSurfaceConfig extends HostSurfaceRegistration', () => {
    const config: PretextSurfaceConfig = {
      columns: [],
      obstacles: [],
      textBlocks: [{ id: 'body', font: '16px serif', lineHeight: 24, prepared }],
    };
    expect(config.textBlocks).toHaveLength(1);
  });

  it('LayoutDescriptor has version field', () => {
    const desc: LayoutDescriptor = {
      version: 1,
      columns: [{ id: 'main', x: 0, width: 400 }],
      obstacles: [],
      textBlocks: [{ id: 'body', font: '16px serif', lineHeight: 24 }],
    };
    expect(desc.version).toBe(1);
    expect('prepared' in desc.textBlocks[0]!).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-editor
pnpm --filter @rdna/controls exec vitest run test/pretext/types.test.ts
```

Expected: FAIL — module `../../src/pretext/types` not found.

**Step 3: Write the types**

Create `packages/controls/src/pretext/types.ts`:

```ts
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import type { RefObject } from 'react';

// ============================================================================
// Wrap settings — mirrors InDesign Text Wrap panel
// ============================================================================

/** Which side of an obstacle text flows to. */
export type WrapSide = 'leftSide' | 'rightSide' | 'both' | 'largestArea';

/** How the obstacle's shape is computed for line-width carving. */
export type ContourType = 'boundingBox' | 'circle' | 'polygon';

/** Per-side padding (px) around the obstacle before computing available text width. */
export type Offsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

// ============================================================================
// Column
// ============================================================================

export type ColumnDef = {
  id: string;
  x: number;
  width: number;
};

// ============================================================================
// Obstacles — discriminated union by `contour` or `type`
// ============================================================================

type ObstacleBase = {
  id: string;
  ref?: RefObject<HTMLElement | SVGElement | null>;
  wrap?: WrapSide;
  offsets?: Offsets;
};

export type RectObstacleDef = ObstacleBase & {
  contour: 'boundingBox';
  bounds: { x: number; y: number; width: number; height: number };
};

export type CircleObstacleDef = ObstacleBase & {
  contour: 'circle';
  cx: number;
  cy: number;
  radius: number;
};

export type PolygonObstacleDef = ObstacleBase & {
  contour: 'polygon';
  /** Normalized hull points (0–1), transformed to obstacle bounds at layout time. */
  hull: Array<{ x: number; y: number }>;
  bounds: { x: number; y: number; width: number; height: number };
};

/** Named obstacle: drop cap. Inspector measures character width via layoutNextLine. */
export type DropcapObstacleDef = ObstacleBase & {
  type: 'dropcap';
  character: string;
  font: string;
  /** How many body-text lines the drop cap spans. */
  lineCount: number;
};

/** Named obstacle: pull quote. Two-pass: layout quote → measure bounds → use as rect obstacle. */
export type PullquoteObstacleDef = ObstacleBase & {
  type: 'pullquote';
  text: string;
  font: string;
  maxWidth: number;
  wrap?: WrapSide;
  offsets?: Offsets;
};

export type ObstacleDef =
  | RectObstacleDef
  | CircleObstacleDef
  | PolygonObstacleDef
  | DropcapObstacleDef
  | PullquoteObstacleDef;

// ============================================================================
// Text block
// ============================================================================

export type TextBlockDef = {
  id: string;
  font: string;
  lineHeight: number;
  maxColumnHeight?: number;
  whiteSpace?: 'normal' | 'pre-wrap';
};

/** Runtime registration entry. Host passes a prepared handle; descriptor strips it. */
export type TextBlockRegistration = TextBlockDef & {
  prepared: PreparedTextWithSegments;
};

// ============================================================================
// Surface config (input to usePretextSurface)
// ============================================================================

export type HostSurfaceRegistration = {
  columns: ColumnDef[];
  obstacles: ObstacleDef[];
  textBlocks: TextBlockRegistration[];
};

export type PretextSurfaceConfig = HostSurfaceRegistration & {
  onLayoutChange?: (descriptor: LayoutDescriptor) => void;
};

// ============================================================================
// Layout descriptor (JSON output — LLM-consumable)
// ============================================================================

export type LayoutDescriptor = {
  version: 1;
  columns: ColumnDef[];
  obstacles: Array<
    | (Omit<RectObstacleDef, 'ref'> & { contour: 'boundingBox' })
    | (Omit<CircleObstacleDef, 'ref'> & { contour: 'circle' })
    | (Omit<PolygonObstacleDef, 'ref'> & { contour: 'polygon' })
    | (Omit<DropcapObstacleDef, 'ref'> & { type: 'dropcap' })
    | (Omit<PullquoteObstacleDef, 'ref'> & { type: 'pullquote' })
  >;
  textBlocks: TextBlockDef[];
};
```

**Step 4: Create the barrel export**

Create `packages/controls/src/pretext/index.ts`:

```ts
export type {
  WrapSide,
  ContourType,
  Offsets,
  ColumnDef,
  RectObstacleDef,
  CircleObstacleDef,
  PolygonObstacleDef,
  DropcapObstacleDef,
  PullquoteObstacleDef,
  ObstacleDef,
  TextBlockDef,
  TextBlockRegistration,
  HostSurfaceRegistration,
  PretextSurfaceConfig,
  LayoutDescriptor,
} from './types';
```

**Step 5: Run tests**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/types.test.ts
```

Expected: all 13 tests PASS.

**Step 6: Commit**

```bash
git add packages/controls/src/pretext/ packages/controls/test/pretext/
git commit -m "feat(pretext): add core type definitions for layout editor"
```

---

### Task 4: Geometry Engine — Circle, Rect, Polygon, Slot Carving

Port the installed pretext demo helpers that are actually needed by the backend: `circleIntervalForBand`, `rectIntervalForBand`, `transformWrapPoints`, `getPolygonIntervalForBand`, and `carveTextLineSlots`. Do **not** port `getWrapHull()` into this package; the installed implementation depends on `Image` + `OffscreenCanvas`, and hosts can keep using the demo helper or precomputed hulls.

**Files:**
- Create: `packages/controls/src/pretext/geometry.ts`
- Test: `packages/controls/test/pretext/geometry.test.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/pretext/geometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  carveTextLineSlots,
  circleIntervalForBand,
  getPolygonIntervalForBand,
  rectIntervalForBand,
  transformWrapPoints,
  type Point,
} from '../../src/pretext/geometry';

describe('geometry helpers', () => {
  const cx = 200, cy = 200, r = 50;

  it('returns null when band is fully above circle', () => {
    expect(circleIntervalForBand(cx, cy, r, 0, 10, 0, 0)).toBeNull();
  });

  it('returns interval at circle center (widest)', () => {
    const interval = circleIntervalForBand(cx, cy, r, 195, 205, 0, 0);
    expect(interval).not.toBeNull();
    expect(interval!.right - interval!.left).toBeCloseTo(100, 0);
  });

  it('rectIntervalForBand applies offsets', () => {
    const interval = rectIntervalForBand(100, 200, 100, 50, 210, 220, {
      top: 5,
      right: 10,
      bottom: 5,
      left: 10,
    });
    expect(interval).toEqual({ left: 90, right: 210 });
  });

  it('transformWrapPoints converts normalized hull to pixel space', () => {
    const points = transformWrapPoints(
      [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      { x: 100, y: 200, width: 50, height: 80 },
      0,
    );
    expect(points).toEqual([{ x: 100, y: 200 }, { x: 150, y: 280 }]);
  });

  it('getPolygonIntervalForBand returns a horizontal interval for an overlapping band', () => {
    const hull: Point[] = [
      { x: 100, y: 100 },
      { x: 180, y: 100 },
      { x: 180, y: 180 },
      { x: 100, y: 180 },
    ];
    expect(getPolygonIntervalForBand(hull, 120, 130, 0, 0)).toEqual({ left: 100, right: 180 });
  });

  it('carveTextLineSlots removes blocked intervals', () => {
    const slots = carveTextLineSlots(
      { left: 0, right: 400 },
      [{ left: 100, right: 200 }],
    );
    expect(slots).toEqual([{ left: 0, right: 100 }, { left: 200, right: 400 }]);
  });
});
```

**Step 2: Run to verify failure**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/geometry.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement**

Create `packages/controls/src/pretext/geometry.ts`:

```ts
import type { Offsets, WrapSide } from './types';

export type Interval = {
  left: number;
  right: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function circleIntervalForBand(
  cx: number,
  cy: number,
  r: number,
  bandTop: number,
  bandBottom: number,
  hPad: number,
  vPad: number,
): Interval | null {
  const top = bandTop - vPad;
  const bottom = bandBottom + vPad;
  if (top >= cy + r || bottom <= cy - r) return null;
  const minDy = cy >= top && cy <= bottom ? 0 : cy < top ? top - cy : cy - bottom;
  if (minDy >= r) return null;
  const maxDx = Math.sqrt(r * r - minDy * minDy);
  return { left: cx - maxDx - hPad, right: cx + maxDx + hPad };
}

export function rectIntervalForBand(
  x: number,
  y: number,
  width: number,
  height: number,
  bandTop: number,
  bandBottom: number,
  offsets: Offsets,
): Interval | null {
  if (bandBottom <= y - offsets.top || bandTop >= y + height + offsets.bottom) return null;
  return { left: x - offsets.left, right: x + width + offsets.right };
}

export function transformWrapPoints(points: Point[], rect: Rect, angle: number): Point[] {
  if (angle === 0) {
    return points.map(point => ({
      x: rect.x + point.x * rect.width,
      y: rect.y + point.y * rect.height,
    }));
  }

  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return points.map(point => {
    const localX = (point.x - 0.5) * rect.width;
    const localY = (point.y - 0.5) * rect.height;
    return {
      x: centerX + localX * cos - localY * sin,
      y: centerY + localX * sin + localY * cos,
    };
  });
}

function getPolygonXsAtY(points: Point[], y: number): number[] {
  const xs: number[] = [];
  let a = points[points.length - 1];
  if (!a) return xs;

  for (let index = 0; index < points.length; index++) {
    const b = points[index]!;
    if ((a.y <= y && y < b.y) || (b.y <= y && y < a.y)) {
      xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
    }
    a = b;
  }

  xs.sort((left, right) => left - right);
  return xs;
}

export function getPolygonIntervalForBand(
  points: Point[],
  bandTop: number,
  bandBottom: number,
  horizontalPadding: number,
  verticalPadding: number,
): Interval | null {
  const sampleTop = bandTop - verticalPadding;
  const sampleBottom = bandBottom + verticalPadding;
  const startY = Math.floor(sampleTop);
  const endY = Math.ceil(sampleBottom);

  let left = Infinity;
  let right = -Infinity;

  for (let y = startY; y <= endY; y++) {
    const xs = getPolygonXsAtY(points, y + 0.5);
    for (let index = 0; index + 1 < xs.length; index += 2) {
      const runLeft = xs[index]!;
      const runRight = xs[index + 1]!;
      if (runLeft < left) left = runLeft;
      if (runRight > right) right = runRight;
    }
  }

  if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
  return { left: left - horizontalPadding, right: right + horizontalPadding };
}

export function carveTextLineSlots(base: Interval, blocked: Interval[]): Interval[] {
  let slots: Interval[] = [base];

  for (let blockedIndex = 0; blockedIndex < blocked.length; blockedIndex++) {
    const interval = blocked[blockedIndex]!;
    const next: Interval[] = [];
    for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
      const slot = slots[slotIndex]!;
      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot);
        continue;
      }
      if (interval.left > slot.left) next.push({ left: slot.left, right: interval.left });
      if (interval.right < slot.right) next.push({ left: interval.right, right: slot.right });
    }
    slots = next;
  }

  return slots.filter(slot => slot.right - slot.left >= 24);
}

export function selectSlotsForWrapSide(slots: Interval[], wrap: WrapSide): Interval[] {
  if (slots.length === 0) return [];

  const ordered = [...slots].sort((left, right) => left.left - right.left);
  if (ordered.length === 1) return ordered;

  switch (wrap) {
    case 'leftSide':
      return [ordered[0]!];
    case 'rightSide':
      return [ordered[ordered.length - 1]!];
    case 'largestArea': {
      let best = ordered[0]!;
      for (let i = 1; i < ordered.length; i++) {
        if (ordered[i]!.right - ordered[i]!.left > best.right - best.left) best = ordered[i]!;
      }
      return [best];
    }
    case 'both':
      return ordered;
  }
}
```

**Step 4: Run tests**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/geometry.test.ts
```

Expected: all 6 tests PASS.

**Step 5: Commit**

```bash
git add packages/controls/src/pretext/geometry.ts packages/controls/test/pretext/geometry.test.ts
git commit -m "feat(pretext): add obstacle geometry engine"
```

---

### Task 5: Geometry Semantics — Wrap-Side Slot Selection

The installed `@chenglou/pretext` editorial demo lays text into **every** viable slot when wrap is effectively "both sides". The backend helper must preserve that behavior instead of collapsing to a single "best" slot.

**Files:**
- Modify: `packages/controls/test/pretext/geometry.test.ts`

**Step 1: Add tests**

Append to `packages/controls/test/pretext/geometry.test.ts`:

```ts
import { selectSlotsForWrapSide } from '../../src/pretext/geometry';

describe('selectSlotsForWrapSide', () => {
  const left = { left: 0, right: 100 };
  const right = { left: 260, right: 400 };

  it('returns [] for empty slots', () => {
    expect(selectSlotsForWrapSide([], 'both')).toEqual([]);
  });

  it('leftSide returns the leftmost slot only', () => {
    expect(selectSlotsForWrapSide([left, right], 'leftSide')).toEqual([left]);
  });

  it('rightSide returns the rightmost slot only', () => {
    expect(selectSlotsForWrapSide([left, right], 'rightSide')).toEqual([right]);
  });

  it('largestArea returns the widest slot only', () => {
    expect(selectSlotsForWrapSide([left, right], 'largestArea')).toEqual([right]);
  });

  it('both returns every viable slot in reading order', () => {
    expect(selectSlotsForWrapSide([right, left], 'both')).toEqual([left, right]);
  });
});
```

**Step 2: Run tests**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/geometry.test.ts
```

Expected: all tests PASS (implementation already written in Task 4).

**Step 3: Commit**

```bash
git add packages/controls/test/pretext/geometry.test.ts
git commit -m "test(pretext): align wrap-slot semantics with pretext demos"
```

---

### Task 6: Layout Descriptor Serializer

**Files:**
- Create: `packages/controls/src/pretext/descriptor.ts`
- Test: `packages/controls/test/pretext/descriptor.test.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/pretext/descriptor.test.ts`:

```ts
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import { describe, expect, it } from 'vitest';
import { buildDescriptor, copyDescriptorToClipboard } from '../../src/pretext/descriptor';
import type { PretextSurfaceConfig } from '../../src/pretext/types';

describe('buildDescriptor', () => {
  const prepared = {} as PreparedTextWithSegments;

  it('produces version 1 descriptor', () => {
    const config: PretextSurfaceConfig = {
      columns: [{ id: 'main', x: 0, width: 400 }],
      obstacles: [],
      textBlocks: [{ id: 'body', font: '16px serif', lineHeight: 24, prepared }],
    };
    const desc = buildDescriptor(config);
    expect(desc.version).toBe(1);
    expect(desc.columns).toHaveLength(1);
    expect(desc.obstacles).toHaveLength(0);
    expect(desc.textBlocks).toHaveLength(1);
  });

  it('strips ref from obstacles', () => {
    const config: PretextSurfaceConfig = {
      columns: [],
      obstacles: [
        {
          id: 'hero',
          contour: 'boundingBox' as const,
          bounds: { x: 0, y: 0, width: 100, height: 100 },
          wrap: 'both' as const,
          offsets: { top: 0, right: 0, bottom: 0, left: 0 },
          ref: { current: null },
        },
      ],
      textBlocks: [],
    };
    const desc = buildDescriptor(config);
    const obs = desc.obstacles[0]!;
    expect('ref' in obs).toBe(false);
  });

  it('includes circle-specific fields', () => {
    const config: PretextSurfaceConfig = {
      columns: [],
      obstacles: [
        { id: 'orb', contour: 'circle' as const, cx: 100, cy: 200, radius: 50, wrap: 'both' as const, offsets: { top: 6, right: 6, bottom: 6, left: 6 } },
      ],
      textBlocks: [],
    };
    const desc = buildDescriptor(config);
    const obs = desc.obstacles[0] as { cx: number; cy: number; radius: number };
    expect(obs.cx).toBe(100);
    expect(obs.radius).toBe(50);
  });

  it('includes dropcap-specific fields', () => {
    const config: PretextSurfaceConfig = {
      columns: [],
      obstacles: [
        { id: 'dc', type: 'dropcap' as const, character: 'A', font: '64px serif', lineCount: 3 },
      ],
      textBlocks: [],
    };
    const desc = buildDescriptor(config);
    const obs = desc.obstacles[0] as { type: string; character: string };
    expect(obs.type).toBe('dropcap');
    expect(obs.character).toBe('A');
  });

  it('JSON-serializes cleanly', () => {
    const config: PretextSurfaceConfig = {
      columns: [{ id: 'a', x: 0, width: 200 }],
      obstacles: [],
      textBlocks: [{ id: 'b', font: '16px sans-serif', lineHeight: 20, prepared }],
    };
    const desc = buildDescriptor(config);
    const json = JSON.stringify(desc, null, 2);
    expect(JSON.parse(json)).toEqual(desc);
  });

  it('strips prepared from textBlocks', () => {
    const config: PretextSurfaceConfig = {
      columns: [],
      obstacles: [],
      textBlocks: [{ id: 'body', font: '16px serif', lineHeight: 24, prepared }],
    };
    const desc = buildDescriptor(config);
    expect('prepared' in desc.textBlocks[0]!).toBe(false);
  });
});
```

**Step 2: Run to verify failure**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/descriptor.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement**

Create `packages/controls/src/pretext/descriptor.ts`:

```ts
import type {
  LayoutDescriptor,
  ObstacleDef,
  PretextSurfaceConfig,
  TextBlockDef,
  TextBlockRegistration,
} from './types';

/** Strip `ref` from an obstacle def for JSON serialization. */
function serializeObstacle(obs: ObstacleDef): LayoutDescriptor['obstacles'][number] {
  const { ref: _ref, ...rest } = obs as ObstacleDef & { ref?: unknown };
  return rest as LayoutDescriptor['obstacles'][number];
}

function serializeTextBlock(block: TextBlockRegistration): TextBlockDef {
  const { prepared: _prepared, ...rest } = block;
  return rest;
}

/** Build a JSON-serializable layout descriptor from the current surface config. */
export function buildDescriptor(config: PretextSurfaceConfig): LayoutDescriptor {
  return {
    version: 1,
    columns: config.columns.map(c => ({ ...c })),
    obstacles: config.obstacles.map(serializeObstacle),
    textBlocks: config.textBlocks.map(serializeTextBlock),
  };
}

/** Copy descriptor JSON to clipboard. Returns the JSON string. */
export async function copyDescriptorToClipboard(config: PretextSurfaceConfig): Promise<string> {
  const json = JSON.stringify(buildDescriptor(config), null, 2);
  await navigator.clipboard.writeText(json);
  return json;
}
```

**Step 4: Run tests**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/descriptor.test.ts
```

Expected: all 6 tests PASS.

**Step 5: Update barrel export**

Add to `packages/controls/src/pretext/index.ts`:

```ts
export { buildDescriptor, copyDescriptorToClipboard } from './descriptor';
export {
  circleIntervalForBand,
  rectIntervalForBand,
  transformWrapPoints,
  getPolygonIntervalForBand,
  carveTextLineSlots,
  selectSlotsForWrapSide,
} from './geometry';
export type { Interval, Point, Rect } from './geometry';
```

**Step 6: Commit**

```bash
git add packages/controls/src/pretext/ packages/controls/test/pretext/descriptor.test.ts
git commit -m "feat(pretext): add layout descriptor serializer"
```

---

### Task 7: `usePretextSurface` Hook — Registration + State

The hook owns descriptor-friendly surface state plus a runtime lookup of prepared text handles. External geometry/prepare changes enter through `syncFromHost()`. Local inspector edits use `updateObstacle()`, `updateColumn()`, and `updateTextBlock()`.

**Files:**
- Create: `packages/controls/src/pretext/usePretextSurface.ts`
- Test: `packages/controls/test/pretext/usePretextSurface.test.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/pretext/usePretextSurface.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import { usePretextSurface } from '../../src/pretext/usePretextSurface';
import type { HostSurfaceRegistration, PretextSurfaceConfig } from '../../src/pretext/types';

const prepared = {} as PreparedTextWithSegments;
const nextPrepared = {} as PreparedTextWithSegments;

const baseConfig: PretextSurfaceConfig = {
  columns: [
    { id: 'left', x: 16, width: 180 },
    { id: 'right', x: 210, width: 340 },
  ],
  obstacles: [
    { id: 'hero', contour: 'boundingBox', bounds: { x: 210, y: 0, width: 340, height: 240 }, wrap: 'both', offsets: { top: 0, right: 12, bottom: 12, left: 12 } },
  ],
  textBlocks: [
    { id: 'body', font: '16px Mondwest', lineHeight: 19.2, prepared },
  ],
};

describe('usePretextSurface', () => {
  it('returns initial columns, obstacles, textBlocks', () => {
    const { result } = renderHook(() => usePretextSurface(baseConfig));
    expect(result.current.columns).toHaveLength(2);
    expect(result.current.obstacles).toHaveLength(1);
    expect(result.current.textBlocks).toHaveLength(1);
  });

  it('exposes prepared text handles through getPreparedText()', () => {
    const { result } = renderHook(() => usePretextSurface(baseConfig));
    expect(result.current.getPreparedText('body')).toBe(prepared);
  });

  it('exposes selectedId as null initially', () => {
    const { result } = renderHook(() => usePretextSurface(baseConfig));
    expect(result.current.selectedId).toBeNull();
  });

  it('select() updates selectedId', () => {
    const { result } = renderHook(() => usePretextSurface(baseConfig));
    act(() => result.current.select('hero'));
    expect(result.current.selectedId).toBe('hero');
  });

  it('deselect() clears selectedId', () => {
    const { result } = renderHook(() => usePretextSurface(baseConfig));
    act(() => result.current.select('hero'));
    act(() => result.current.deselect());
    expect(result.current.selectedId).toBeNull();
  });

  it('updateObstacle() mutates obstacle and calls onLayoutChange', () => {
    const onChange = vi.fn();
    const config = { ...baseConfig, onLayoutChange: onChange };
    const { result } = renderHook(() => usePretextSurface(config));

    act(() => result.current.updateObstacle('hero', { wrap: 'leftSide' }));

    const updated = result.current.obstacles.find(o => o.id === 'hero')!;
    expect(updated.wrap).toBe('leftSide');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('updateColumn() mutates column and calls onLayoutChange', () => {
    const onChange = vi.fn();
    const config = { ...baseConfig, onLayoutChange: onChange };
    const { result } = renderHook(() => usePretextSurface(config));

    act(() => result.current.updateColumn('left', { width: 200 }));

    const updated = result.current.columns.find(c => c.id === 'left')!;
    expect(updated.width).toBe(200);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('syncFromHost refreshes host geometry and prepared handles', () => {
    const { result } = renderHook(() => usePretextSurface(baseConfig));
    const nextHost: HostSurfaceRegistration = {
      columns: [
        { id: 'left', x: 16, width: 220 },
        { id: 'right', x: 240, width: 320 },
      ],
      obstacles: [
        {
          id: 'hero',
          contour: 'boundingBox',
          bounds: { x: 240, y: 0, width: 320, height: 240 },
          wrap: 'leftSide',
          offsets: { top: 0, right: 12, bottom: 12, left: 12 },
        },
      ],
      textBlocks: [
        { id: 'body', font: '16px Mondwest', lineHeight: 19.2, prepared: nextPrepared },
      ],
    };

    act(() => result.current.syncFromHost(nextHost));

    expect(result.current.columns[0]!.width).toBe(220);
    expect(result.current.getPreparedText('body')).toBe(nextPrepared);
  });

  it('getDescriptor() returns serializable descriptor', () => {
    const { result } = renderHook(() => usePretextSurface(baseConfig));
    const desc = result.current.getDescriptor();
    expect(desc.version).toBe(1);
    expect(JSON.stringify(desc)).toBeTruthy();
  });
});
```

**Step 2: Run to verify failure**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/usePretextSurface.test.ts
```

Expected: FAIL — module not found.

**Step 3: Install @testing-library/react if needed**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-editor
pnpm --filter @rdna/controls add -D @testing-library/react @testing-library/dom
```

**Step 4: Implement**

Create `packages/controls/src/pretext/usePretextSurface.ts`:

```ts
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type {
  ColumnDef,
  HostSurfaceRegistration,
  LayoutDescriptor,
  ObstacleDef,
  PretextSurfaceConfig,
  TextBlockDef,
} from './types';
import { buildDescriptor } from './descriptor';

// ============================================================================
// Internal store — useSyncExternalStore for hot-path updates without full
// React re-render tree invalidation. Mirrors DialKit's module-level pattern
// but scoped per-hook instance.
// ============================================================================

type SurfaceState = {
  columns: ColumnDef[];
  obstacles: ObstacleDef[];
  textBlocks: TextBlockDef[];
  selectedId: string | null;
};

function cloneHostRegistration(host: HostSurfaceRegistration): {
  columns: ColumnDef[];
  obstacles: ObstacleDef[];
  textBlocks: TextBlockDef[];
  preparedById: Map<string, PreparedTextWithSegments>;
} {
  return {
    columns: host.columns.map(column => ({ ...column })),
    obstacles: host.obstacles.map(obstacle => ({ ...obstacle })),
    textBlocks: host.textBlocks.map(({ prepared: _prepared, ...textBlock }) => ({ ...textBlock })),
    preparedById: new Map(host.textBlocks.map(textBlock => [textBlock.id, textBlock.prepared])),
  };
}

function createStore(initial: PretextSurfaceConfig) {
  const cloned = cloneHostRegistration(initial);
  let state: SurfaceState = {
    columns: cloned.columns,
    obstacles: cloned.obstacles,
    textBlocks: cloned.textBlocks,
    selectedId: null,
  };
  let preparedById = cloned.preparedById;

  const listeners = new Set<() => void>();

  function emit() {
    for (const fn of listeners) fn();
  }

  return {
    getState: () => state,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    syncFromHost: (next: HostSurfaceRegistration) => {
      const clonedNext = cloneHostRegistration(next);
      const nextIds = new Set([
        ...clonedNext.columns.map(column => column.id),
        ...clonedNext.obstacles.map(obstacle => obstacle.id),
        ...clonedNext.textBlocks.map(textBlock => textBlock.id),
      ]);
      preparedById = clonedNext.preparedById;
      state = {
        ...state,
        columns: clonedNext.columns,
        obstacles: clonedNext.obstacles,
        textBlocks: clonedNext.textBlocks,
        selectedId: state.selectedId !== null && nextIds.has(state.selectedId) ? state.selectedId : null,
      };
      emit();
    },
    select: (id: string | null) => {
      state = { ...state, selectedId: id };
      emit();
    },
    updateObstacle: (id: string, patch: Partial<ObstacleDef>) => {
      state = {
        ...state,
        obstacles: state.obstacles.map(o =>
          o.id === id ? { ...o, ...patch } as ObstacleDef : o
        ),
      };
      emit();
    },
    updateColumn: (id: string, patch: Partial<ColumnDef>) => {
      state = {
        ...state,
        columns: state.columns.map(c =>
          c.id === id ? { ...c, ...patch } : c
        ),
      };
      emit();
    },
    updateTextBlock: (id: string, patch: Partial<TextBlockDef>) => {
      state = {
        ...state,
        textBlocks: state.textBlocks.map(t =>
          t.id === id ? { ...t, ...patch } : t
        ),
      };
      emit();
    },
    getPreparedText: (id: string) => preparedById.get(id) ?? null,
  };
}

export type PretextSurface = {
  columns: ColumnDef[];
  obstacles: ObstacleDef[];
  textBlocks: TextBlockDef[];
  selectedId: string | null;
  syncFromHost: (next: HostSurfaceRegistration) => void;
  getPreparedText: (id: string) => PreparedTextWithSegments | null;
  select: (id: string) => void;
  deselect: () => void;
  updateObstacle: (id: string, patch: Partial<ObstacleDef>) => void;
  updateColumn: (id: string, patch: Partial<ColumnDef>) => void;
  updateTextBlock: (id: string, patch: Partial<TextBlockDef>) => void;
  getDescriptor: () => LayoutDescriptor;
};

export function usePretextSurface(config: PretextSurfaceConfig): PretextSurface {
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createStore(config);
  }
  const store = storeRef.current;
  const onLayoutChangeRef = useRef(config.onLayoutChange);

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  useEffect(() => {
    onLayoutChangeRef.current = config.onLayoutChange;
  }, [config.onLayoutChange]);

  const notifyChange = useCallback(() => {
    if (onLayoutChangeRef.current) {
      const desc = buildDescriptor({
        columns: store.getState().columns,
        obstacles: store.getState().obstacles,
        textBlocks: store.getState().textBlocks.map(textBlock => ({
          ...textBlock,
          prepared: store.getPreparedText(textBlock.id)!,
        })),
      });
      onLayoutChangeRef.current(desc);
    }
  }, [store]);

  const syncFromHost = useCallback((next: HostSurfaceRegistration) => {
    store.syncFromHost(next);
  }, [store]);
  const select = useCallback((id: string) => store.select(id), [store]);
  const deselect = useCallback(() => store.select(null), [store]);

  const updateObstacle = useCallback((id: string, patch: Partial<ObstacleDef>) => {
    store.updateObstacle(id, patch);
    notifyChange();
  }, [store, notifyChange]);

  const updateColumn = useCallback((id: string, patch: Partial<ColumnDef>) => {
    store.updateColumn(id, patch);
    notifyChange();
  }, [store, notifyChange]);

  const updateTextBlock = useCallback((id: string, patch: Partial<TextBlockDef>) => {
    store.updateTextBlock(id, patch);
    notifyChange();
  }, [store, notifyChange]);

  const getDescriptor = useCallback((): LayoutDescriptor => {
    return buildDescriptor({
      columns: state.columns,
      obstacles: state.obstacles,
      textBlocks: state.textBlocks.map(textBlock => ({
        ...textBlock,
        prepared: store.getPreparedText(textBlock.id)!,
      })),
    });
  }, [state, store]);

  return {
    ...state,
    syncFromHost,
    getPreparedText: store.getPreparedText,
    select,
    deselect,
    updateObstacle,
    updateColumn,
    updateTextBlock,
    getDescriptor,
  };
}
```

**Step 5: Update barrel export**

Add to `packages/controls/src/pretext/index.ts`:

```ts
export { usePretextSurface } from './usePretextSurface';
export type { PretextSurface } from './usePretextSurface';
```

**Step 6: Run tests**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/usePretextSurface.test.ts
```

Expected: all 9 tests PASS.

**Step 7: Commit**

```bash
git add packages/controls/src/pretext/ packages/controls/test/pretext/usePretextSurface.test.ts
git commit -m "feat(pretext): add usePretextSurface hook"
```

---

### Task 8: `walkLineRanges` Height Prediction Utility

A pure utility that uses pretext's `walkLineRanges` to predict column height without materializing line text — critical for the inspector's internal layout calculations.

**Files:**
- Create: `packages/controls/src/pretext/measure.ts`
- Test: `packages/controls/test/pretext/measure.test.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/pretext/measure.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { predictColumnHeight, findShrinkwrapWidth } from '../../src/pretext/measure';

// Note: These tests require a browser environment for canvas measureText.
// In Node/Vitest, prepareWithSegments won't work correctly.
// We test the function signatures and logic with mocked prepared text.
// Real integration tests happen in the browser via GoodNewsApp.

describe('predictColumnHeight', () => {
  it('is exported as a function', () => {
    expect(typeof predictColumnHeight).toBe('function');
  });
});

describe('findShrinkwrapWidth', () => {
  it('is exported as a function', () => {
    expect(typeof findShrinkwrapWidth).toBe('function');
  });
});
```

**Step 2: Implement**

Create `packages/controls/src/pretext/measure.ts`:

```ts
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import { walkLineRanges } from '@chenglou/pretext';

/**
 * Predict how tall text will be in a given column width.
 * Uses walkLineRanges (no string allocation) — sub-0.1ms.
 *
 * IMPORTANT: This never calls prepare(). The caller must pass
 * an already-prepared text handle.
 */
export function predictColumnHeight(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  lineHeight: number,
): number {
  const lineCount = walkLineRanges(prepared, maxWidth, () => {});
  return lineCount * lineHeight;
}

/**
 * Binary-search for the tightest container width that fits text in
 * at most `targetLines` lines. The "multiline shrink-wrap" that CSS can't do.
 *
 * IMPORTANT: This never calls prepare(). The caller must pass
 * an already-prepared text handle.
 */
export function findShrinkwrapWidth(
  prepared: PreparedTextWithSegments,
  targetLines: number,
  lineHeight: number,
  minWidth = 50,
  maxWidth = 2000,
): { width: number; height: number } {
  let lo = minWidth;
  let hi = maxWidth;

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    let count = 0;
    walkLineRanges(prepared, mid, () => { count++; });
    if (count > targetLines) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  let finalCount = 0;
  walkLineRanges(prepared, hi, () => { finalCount++; });

  return { width: hi, height: finalCount * lineHeight };
}
```

**Step 3: Update barrel export**

Add to `packages/controls/src/pretext/index.ts`:

```ts
export { predictColumnHeight, findShrinkwrapWidth } from './measure';
```

**Step 4: Run tests**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/measure.test.ts
```

Expected: PASS (smoke tests only — real integration tests are browser-based).

**Step 5: Commit**

```bash
git add packages/controls/src/pretext/ packages/controls/test/pretext/measure.test.ts
git commit -m "feat(pretext): add walkLineRanges height prediction utilities"
```

---

### Task 9: Final Backend Smoke Test

**Step 1: Write a barrel import test**

Create `packages/controls/test/pretext/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('@rdna/controls/pretext barrel', () => {
  it('exports all public types and functions', async () => {
    const mod = await import('../../src/pretext/index');

    // Functions
    expect(typeof mod.buildDescriptor).toBe('function');
    expect(typeof mod.copyDescriptorToClipboard).toBe('function');
    expect(typeof mod.circleIntervalForBand).toBe('function');
    expect(typeof mod.rectIntervalForBand).toBe('function');
    expect(typeof mod.transformWrapPoints).toBe('function');
    expect(typeof mod.getPolygonIntervalForBand).toBe('function');
    expect(typeof mod.carveTextLineSlots).toBe('function');
    expect(typeof mod.selectSlotsForWrapSide).toBe('function');
    expect(typeof mod.usePretextSurface).toBe('function');
    expect(typeof mod.predictColumnHeight).toBe('function');
    expect(typeof mod.findShrinkwrapWidth).toBe('function');
  });
});
```

**Step 2: Run all pretext tests**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/
```

Expected: all tests PASS across all files.

**Step 3: Commit**

```bash
git add packages/controls/test/pretext/smoke.test.ts
git commit -m "test(pretext): add barrel export smoke test"
```

---

## Summary

After all 9 tasks, the backend provides:

| Module | What |
|---|---|
| `types.ts` | Full type system: obstacles (rect, circle, polygon, dropcap, pullquote), columns, runtime text-block registration, wrap settings, descriptor |
| `geometry.ts` | `circleIntervalForBand`, `rectIntervalForBand`, `transformWrapPoints`, `getPolygonIntervalForBand`, `carveTextLineSlots`, `selectSlotsForWrapSide` |
| `descriptor.ts` | `buildDescriptor`, `copyDescriptorToClipboard` |
| `usePretextSurface.ts` | Registration hook with host sync, prepared-text lookup, select/deselect, update methods, `getDescriptor()` |
| `measure.ts` | `predictColumnHeight`, `findShrinkwrapWidth` via `walkLineRanges` |

The **frontend plan** (`docs/plans/2026-03-28-pretext-editor-frontend.md`) builds the inspector UI on top of these exports.
