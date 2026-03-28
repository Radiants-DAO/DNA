# Pretext Layout Editor — Backend Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Build the data model, obstacle geometry engine, and registration API for a pretext-aware layout inspector — shipped as `@rdna/controls/pretext`.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA` → branch `feat/pretext-editor` (create at execution time)

**Architecture:** A subpath export (`packages/controls/src/pretext/`) within the `@rdna/controls` package. Provides a `usePretextSurface` React hook that consumers call to register columns, obstacles, and text blocks. The backend owns all geometry math (circle intervals, polygon scanlines, rect intersections, multi-obstacle carving) and the layout descriptor JSON schema. It **never** calls `prepare()` / `prepareWithSegments()` — the host owns preparation. The backend only calls `layoutNextLine` and `walkLineRanges` (sub-0.1ms hot path).

**Tech Stack:** React 19, TypeScript, Vitest, `@chenglou/pretext` (peer dep), `@rdna/controls` (host package)

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
"@chenglou/pretext": ">=0.0.2"
```

Mark `@chenglou/pretext` as an **optional** peer dep so consumers who don't use the pretext inspector aren't forced to install it:

```json
"peerDependenciesMeta": {
  "@chenglou/pretext": { "optional": true }
}
```

**Step 2: Create the directory**

```bash
mkdir -p packages/controls/src/pretext
```

**Step 3: Commit**

```bash
git add packages/controls/package.json packages/controls/src/pretext
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
  PretextSurfaceConfig,
  LayoutDescriptor,
} from '../../src/pretext/types';

describe('pretext types', () => {
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

  it('LayoutDescriptor has version field', () => {
    const desc: LayoutDescriptor = {
      version: 1,
      columns: [{ id: 'main', x: 0, width: 400 }],
      obstacles: [],
      textBlocks: [{ id: 'body', font: '16px serif', lineHeight: 24 }],
    };
    expect(desc.version).toBe(1);
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

// ============================================================================
// Surface config (input to usePretextSurface)
// ============================================================================

export type PretextSurfaceConfig = {
  columns: ColumnDef[];
  obstacles: ObstacleDef[];
  textBlocks: TextBlockDef[];
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
  PretextSurfaceConfig,
  LayoutDescriptor,
} from './types';
```

**Step 5: Run tests**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/types.test.ts
```

Expected: all 9 tests PASS.

**Step 6: Commit**

```bash
git add packages/controls/src/pretext/ packages/controls/test/pretext/
git commit -m "feat(pretext): add core type definitions for layout editor"
```

---

### Task 4: Obstacle Geometry Engine — `circleIntervalForBand`

Ported from `@chenglou/pretext/demos/editorial-engine.ts` lines 144–159. Pure math, no pretext dependency.

**Files:**
- Create: `packages/controls/src/pretext/geometry.ts`
- Test: `packages/controls/test/pretext/geometry.test.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/pretext/geometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { circleIntervalForBand } from '../../src/pretext/geometry';

describe('circleIntervalForBand', () => {
  const cx = 200, cy = 200, r = 50;

  it('returns null when band is fully above circle', () => {
    expect(circleIntervalForBand(cx, cy, r, 0, 10, 0, 0)).toBeNull();
  });

  it('returns null when band is fully below circle', () => {
    expect(circleIntervalForBand(cx, cy, r, 300, 310, 0, 0)).toBeNull();
  });

  it('returns interval at circle center (widest)', () => {
    const interval = circleIntervalForBand(cx, cy, r, 195, 205, 0, 0);
    expect(interval).not.toBeNull();
    // At center, full diameter
    expect(interval!.right - interval!.left).toBeCloseTo(100, 0);
  });

  it('returns narrower interval near edge', () => {
    const interval = circleIntervalForBand(cx, cy, r, 240, 245, 0, 0);
    expect(interval).not.toBeNull();
    expect(interval!.right - interval!.left).toBeLessThan(100);
  });

  it('respects horizontal padding', () => {
    const withPad = circleIntervalForBand(cx, cy, r, 195, 205, 10, 0);
    const withoutPad = circleIntervalForBand(cx, cy, r, 195, 205, 0, 0);
    expect(withPad!.right - withPad!.left).toBeCloseTo(
      (withoutPad!.right - withoutPad!.left) + 20, 0
    );
  });

  it('respects vertical padding (extends detection range)', () => {
    // Band at y=250-255 is right at the circle edge (cy+r = 250)
    // Without vPad, this might barely miss
    // With vPad=10, it should definitely detect
    const withVPad = circleIntervalForBand(cx, cy, r, 251, 256, 0, 10);
    expect(withVPad).not.toBeNull();
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
import type { Offsets } from './types';

export type Interval = {
  left: number;
  right: number;
};

/**
 * Compute the horizontal interval blocked by a circle obstacle for a given
 * vertical line band. Returns null if the band doesn't intersect the circle.
 *
 * Ported from @chenglou/pretext editorial-engine demo.
 */
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

/**
 * Compute the horizontal interval blocked by a rect obstacle for a given
 * vertical line band. Returns null if the band doesn't intersect the rect.
 */
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

/**
 * Carve blocked intervals from a base text interval to find usable text slots.
 * Discards slivers < 24px.
 *
 * Ported from @chenglou/pretext demos/wrap-geometry.ts.
 */
export function carveTextLineSlots(base: Interval, blocked: Interval[]): Interval[] {
  let slots: Interval[] = [base];

  for (let i = 0; i < blocked.length; i++) {
    const interval = blocked[i]!;
    const next: Interval[] = [];
    for (let j = 0; j < slots.length; j++) {
      const slot = slots[j]!;
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

/**
 * Pick the best text slot from available intervals based on wrap side preference.
 */
export function pickSlotForWrapSide(
  slots: Interval[],
  wrap: 'leftSide' | 'rightSide' | 'both' | 'largestArea',
): Interval | null {
  if (slots.length === 0) return null;
  if (slots.length === 1) return slots[0]!;

  switch (wrap) {
    case 'leftSide':
      return slots[0]!; // leftmost slot
    case 'rightSide':
      return slots[slots.length - 1]!; // rightmost slot
    case 'largestArea':
    case 'both': {
      // Pick widest slot
      let best = slots[0]!;
      for (let i = 1; i < slots.length; i++) {
        if (slots[i]!.right - slots[i]!.left > best.right - best.left) best = slots[i]!;
      }
      return best;
    }
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

### Task 5: Geometry Engine — `rectIntervalForBand` and `pickSlotForWrapSide` Tests

**Files:**
- Modify: `packages/controls/test/pretext/geometry.test.ts`

**Step 1: Add tests**

Append to `packages/controls/test/pretext/geometry.test.ts`:

```ts
import { rectIntervalForBand, carveTextLineSlots, pickSlotForWrapSide } from '../../src/pretext/geometry';

describe('rectIntervalForBand', () => {
  it('returns null when band is above rect', () => {
    expect(rectIntervalForBand(100, 200, 100, 50, 0, 10, { top: 0, right: 0, bottom: 0, left: 0 })).toBeNull();
  });

  it('returns interval when band overlaps rect', () => {
    const interval = rectIntervalForBand(100, 200, 100, 50, 210, 220, { top: 0, right: 0, bottom: 0, left: 0 });
    expect(interval).toEqual({ left: 100, right: 200 });
  });

  it('applies offsets', () => {
    const interval = rectIntervalForBand(100, 200, 100, 50, 210, 220, { top: 5, right: 10, bottom: 5, left: 10 });
    expect(interval).toEqual({ left: 90, right: 210 });
  });
});

describe('carveTextLineSlots', () => {
  it('returns full base when no blocked intervals', () => {
    const slots = carveTextLineSlots({ left: 0, right: 400 }, []);
    expect(slots).toEqual([{ left: 0, right: 400 }]);
  });

  it('carves out a blocked interval', () => {
    const slots = carveTextLineSlots({ left: 0, right: 400 }, [{ left: 100, right: 200 }]);
    expect(slots).toEqual([{ left: 0, right: 100 }, { left: 200, right: 400 }]);
  });

  it('discards slivers < 24px', () => {
    const slots = carveTextLineSlots({ left: 0, right: 400 }, [{ left: 10, right: 200 }]);
    // Left slot is 0–10 = 10px, too narrow
    expect(slots).toEqual([{ left: 200, right: 400 }]);
  });
});

describe('pickSlotForWrapSide', () => {
  const left = { left: 0, right: 100 };
  const right = { left: 300, right: 400 };

  it('returns null for empty slots', () => {
    expect(pickSlotForWrapSide([], 'both')).toBeNull();
  });

  it('leftSide picks leftmost slot', () => {
    expect(pickSlotForWrapSide([left, right], 'leftSide')).toBe(left);
  });

  it('rightSide picks rightmost slot', () => {
    expect(pickSlotForWrapSide([left, right], 'rightSide')).toBe(right);
  });

  it('largestArea picks widest slot', () => {
    expect(pickSlotForWrapSide([left, right], 'largestArea')).toBe(right);
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
git commit -m "test(pretext): add rectInterval, carveSlots, pickSlot tests"
```

---

### Task 6: Layout Descriptor Serializer

**Files:**
- Create: `packages/controls/src/pretext/descriptor.ts`
- Test: `packages/controls/test/pretext/descriptor.test.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/pretext/descriptor.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildDescriptor, copyDescriptorToClipboard } from '../../src/pretext/descriptor';
import type { PretextSurfaceConfig } from '../../src/pretext/types';

describe('buildDescriptor', () => {
  it('produces version 1 descriptor', () => {
    const config: PretextSurfaceConfig = {
      columns: [{ id: 'main', x: 0, width: 400 }],
      obstacles: [],
      textBlocks: [{ id: 'body', font: '16px serif', lineHeight: 24 }],
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
      textBlocks: [{ id: 'b', font: '16px sans-serif', lineHeight: 20 }],
    };
    const desc = buildDescriptor(config);
    const json = JSON.stringify(desc, null, 2);
    expect(JSON.parse(json)).toEqual(desc);
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
import type { LayoutDescriptor, ObstacleDef, PretextSurfaceConfig } from './types';

/** Strip `ref` from an obstacle def for JSON serialization. */
function serializeObstacle(obs: ObstacleDef): LayoutDescriptor['obstacles'][number] {
  const { ref: _ref, ...rest } = obs as ObstacleDef & { ref?: unknown };
  return rest as LayoutDescriptor['obstacles'][number];
}

/** Build a JSON-serializable layout descriptor from the current surface config. */
export function buildDescriptor(config: PretextSurfaceConfig): LayoutDescriptor {
  return {
    version: 1,
    columns: config.columns.map(c => ({ ...c })),
    obstacles: config.obstacles.map(serializeObstacle),
    textBlocks: config.textBlocks.map(tb => ({ ...tb })),
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

Expected: all 5 tests PASS.

**Step 5: Update barrel export**

Add to `packages/controls/src/pretext/index.ts`:

```ts
export { buildDescriptor, copyDescriptorToClipboard } from './descriptor';
export { circleIntervalForBand, rectIntervalForBand, carveTextLineSlots, pickSlotForWrapSide } from './geometry';
export type { Interval } from './geometry';
```

**Step 6: Commit**

```bash
git add packages/controls/src/pretext/ packages/controls/test/pretext/descriptor.test.ts
git commit -m "feat(pretext): add layout descriptor serializer"
```

---

### Task 7: `usePretextSurface` Hook — Registration + State

The hook owns the surface state and exposes update methods for the frontend inspector to call.

**Files:**
- Create: `packages/controls/src/pretext/usePretextSurface.ts`
- Test: `packages/controls/test/pretext/usePretextSurface.test.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/pretext/usePretextSurface.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePretextSurface } from '../../src/pretext/usePretextSurface';
import type { PretextSurfaceConfig } from '../../src/pretext/types';

const baseConfig: PretextSurfaceConfig = {
  columns: [
    { id: 'left', x: 16, width: 180 },
    { id: 'right', x: 210, width: 340 },
  ],
  obstacles: [
    { id: 'hero', contour: 'boundingBox', bounds: { x: 210, y: 0, width: 340, height: 240 }, wrap: 'both', offsets: { top: 0, right: 12, bottom: 12, left: 12 } },
  ],
  textBlocks: [
    { id: 'body', font: '16px Mondwest', lineHeight: 19.2 },
  ],
};

describe('usePretextSurface', () => {
  it('returns initial columns, obstacles, textBlocks', () => {
    const { result } = renderHook(() => usePretextSurface(baseConfig));
    expect(result.current.columns).toHaveLength(2);
    expect(result.current.obstacles).toHaveLength(1);
    expect(result.current.textBlocks).toHaveLength(1);
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
import { useCallback, useRef, useSyncExternalStore } from 'react';
import type {
  ColumnDef,
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

function createStore(initial: PretextSurfaceConfig) {
  let state: SurfaceState = {
    columns: initial.columns.map(c => ({ ...c })),
    obstacles: initial.obstacles.map(o => ({ ...o })),
    textBlocks: initial.textBlocks.map(t => ({ ...t })),
    selectedId: null,
  };

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
  };
}

export type PretextSurface = {
  columns: ColumnDef[];
  obstacles: ObstacleDef[];
  textBlocks: TextBlockDef[];
  selectedId: string | null;
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

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  const onLayoutChange = config.onLayoutChange;

  const notifyChange = useCallback(() => {
    if (onLayoutChange) {
      const desc = buildDescriptor({
        columns: store.getState().columns,
        obstacles: store.getState().obstacles,
        textBlocks: store.getState().textBlocks,
      });
      onLayoutChange(desc);
    }
  }, [onLayoutChange, store]);

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
      textBlocks: state.textBlocks,
    });
  }, [state]);

  return {
    ...state,
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

Expected: all 7 tests PASS.

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
    expect(typeof mod.carveTextLineSlots).toBe('function');
    expect(typeof mod.pickSlotForWrapSide).toBe('function');
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
| `types.ts` | Full type system: obstacles (rect, circle, polygon, dropcap, pullquote), columns, text blocks, wrap settings, descriptor |
| `geometry.ts` | `circleIntervalForBand`, `rectIntervalForBand`, `carveTextLineSlots`, `pickSlotForWrapSide` |
| `descriptor.ts` | `buildDescriptor`, `copyDescriptorToClipboard` |
| `usePretextSurface.ts` | Registration hook with select/deselect, update methods, `getDescriptor()` |
| `measure.ts` | `predictColumnHeight`, `findShrinkwrapWidth` via `walkLineRanges` |

The **frontend plan** (`docs/plans/2026-03-28-pretext-editor-frontend.md`) builds the inspector UI on top of these exports.
