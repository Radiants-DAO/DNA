# BitGridEditor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Replace the Dotting-based `OneBitCanvas` in the Pixel Playground with a small, purpose-built `BitGridEditor` — 1-bit SVG grid, tiny tool kit (pen/eraser/fill/line/rect/ellipse), bitstring as source of truth, no canvas-remount dance.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-logo-maker` (branch `feat/logo-asset-maker`)

**Architecture:**
- Single `<svg>` with one `<rect>` per cell (max 32×32 = 1024 rects — trivial to render).
- State lives in the editor as two `Uint8Array(size*size)` buffers: `committed` (real bits) and `preview` (ephemeral in-progress shape for line/rect/ellipse).
- Tools are pure functions `(start, end, size) → Set<cellIndex>` stamped onto the buffer on mouseup.
- Undo/redo is a snapshot stack of `Uint8Array` copies (capped).
- Imperative handle: `{ undo, redo, clear, getBits, setBits }`. Parent subscribes via a tiny `useBitGrid(ref, resetKey)` hook that listens to a `bits-change` event the editor dispatches on commit.
- **Size and `initialBits` are props.** Changing them updates the buffer via `useEffect` — no `key`/remount dance.

**Tech Stack:** React, TypeScript, Tailwind v4, `@rdna/radiants` components, Vitest.

**Scope note:** `apps/rad-os/components/apps/studio/` still uses `@/lib/dotting` for multi-layer, palette-indexed pixel art. `lib/dotting/` stays. Only `apps/rad-os/components/apps/pixel-playground/` migrates.

---

## Consumer surface we must preserve

After this plan lands, these consumer files keep the same *conceptual* API (names change; behavior is 1:1):

| File | Today (Dotting) | After (BitGrid) |
|---|---|---|
| `PixelPlayground.tsx` | `useBrush`, `useData`, `BrushTool`, `DottingRef`, `canvasKey` | `useBitGrid`, `Tool`, `BitGridEditorRef`, no canvasKey |
| `OneBitCanvas.tsx` | `<Dotting ... />` w/ 5 stacked canvases | `<BitGridEditor ... />` (single SVG) |
| `EditorToolbar.tsx` | `useDotting(ref)` → `{ undo, redo, clear }` | `ref.current?.undo/redo/clear` (no hook needed) |
| `ToolPalette.tsx` | `BrushTool` enum | `Tool` string union |
| `constants.ts` | `BrushTool.DOT` etc. in `TOOL_DEFS` | `'pen'` etc. |
| `bits-from-layer.ts` | used in `useMemo` in PixelPlayground | **deleted** (editor emits bits directly) |

---

## Task 1: Create the BitGridEditor module skeleton

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/bit-grid/index.ts`
- Create: `apps/rad-os/components/apps/pixel-playground/bit-grid/types.ts`

**Step 1: Write `types.ts`**

```ts
// apps/rad-os/components/apps/pixel-playground/bit-grid/types.ts
export type Tool =
  | 'pen'
  | 'eraser'
  | 'fill'
  | 'line'
  | 'rect'
  | 'rect-fill'
  | 'ellipse'
  | 'ellipse-fill';

export const TOOLS: readonly Tool[] = [
  'pen',
  'eraser',
  'fill',
  'line',
  'rect',
  'rect-fill',
  'ellipse',
  'ellipse-fill',
] as const;

export interface BitGridEditorRef {
  /** Snapshot of the committed grid as a size*size bitstring ('0'/'1'). */
  getBits: () => string;
  /** Replace the grid from a bitstring; pushes history. Length must equal size*size. */
  setBits: (bits: string) => void;
  /** Zero all cells. Pushes history. */
  clear: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
```

**Step 2: Write `index.ts`**

```ts
// apps/rad-os/components/apps/pixel-playground/bit-grid/index.ts
export { BitGridEditor } from './BitGridEditor';
export { useBitGrid } from './useBitGrid';
export type { BitGridEditorRef, Tool } from './types';
export { TOOLS } from './types';
```

**Step 3: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/bit-grid/
git commit -m "feat(pixel-playground): scaffold bit-grid module"
```

---

## Task 2: Bit buffer + history (pure, TDD)

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/bit-grid/buffer.ts`
- Create: `apps/rad-os/components/apps/pixel-playground/bit-grid/__tests__/buffer.test.ts`

**Step 1: Write failing tests**

```ts
// __tests__/buffer.test.ts
import { describe, it, expect } from 'vitest';
import { createBuffer, bufferToBits, bitsToBuffer, cloneBuffer, setCell, getCell } from '../buffer';

describe('buffer', () => {
  it('creates a zero buffer of size*size', () => {
    const buf = createBuffer(3);
    expect(buf).toHaveLength(9);
    expect(Array.from(buf)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('round-trips bits', () => {
    const buf = bitsToBuffer('101010101', 3);
    expect(bufferToBits(buf)).toBe('101010101');
  });

  it('throws when bits length != size*size', () => {
    expect(() => bitsToBuffer('101', 3)).toThrow();
  });

  it('setCell / getCell are (r,c)-indexed', () => {
    const buf = createBuffer(4);
    setCell(buf, 4, 1, 2, 1);
    expect(getCell(buf, 4, 1, 2)).toBe(1);
    expect(getCell(buf, 4, 0, 0)).toBe(0);
  });

  it('cloneBuffer is a deep copy', () => {
    const a = bitsToBuffer('11110000', 4)[0]; // buffer, not offset
    const a2 = bitsToBuffer('1111000011110000', 4);
    const b = cloneBuffer(a2);
    b[0] = 0;
    expect(a2[0]).toBe(1);
  });
});
```

**Step 2: Run it and watch it fail**

```bash
pnpm --filter rad-os test -- buffer.test.ts
```
Expected: module not found / exports missing.

**Step 3: Write `buffer.ts`**

```ts
// buffer.ts
export type BitBuffer = Uint8Array;

export function createBuffer(size: number): BitBuffer {
  return new Uint8Array(size * size);
}

export function bitsToBuffer(bits: string, size: number): BitBuffer {
  if (bits.length !== size * size) {
    throw new Error(`bits length ${bits.length} != size*size ${size * size}`);
  }
  const buf = new Uint8Array(size * size);
  for (let i = 0; i < bits.length; i++) buf[i] = bits.charCodeAt(i) === 49 ? 1 : 0; // '1' = 49
  return buf;
}

export function bufferToBits(buf: BitBuffer): string {
  let out = '';
  for (let i = 0; i < buf.length; i++) out += buf[i] ? '1' : '0';
  return out;
}

export function cloneBuffer(buf: BitBuffer): BitBuffer {
  return new Uint8Array(buf);
}

export function setCell(buf: BitBuffer, size: number, r: number, c: number, value: 0 | 1): void {
  if (r < 0 || r >= size || c < 0 || c >= size) return;
  buf[r * size + c] = value;
}

export function getCell(buf: BitBuffer, size: number, r: number, c: number): 0 | 1 {
  if (r < 0 || r >= size || c < 0 || c >= size) return 0;
  return buf[r * size + c] === 1 ? 1 : 0;
}
```

**Step 4: Run tests — green.**

**Step 5: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/bit-grid/buffer.ts apps/rad-os/components/apps/pixel-playground/bit-grid/__tests__/buffer.test.ts
git commit -m "feat(bit-grid): add bit buffer helpers with tests"
```

---

## Task 3: Rasterize — line (Bresenham, TDD)

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/bit-grid/rasterize.ts`
- Create: `apps/rad-os/components/apps/pixel-playground/bit-grid/__tests__/rasterize.test.ts`

**Step 1: Write failing tests**

```ts
// __tests__/rasterize.test.ts
import { describe, it, expect } from 'vitest';
import { line } from '../rasterize';

function cells(cellSet: Set<number>, size: number): string[] {
  const out: string[] = [];
  for (const idx of cellSet) out.push(`${Math.floor(idx / size)},${idx % size}`);
  return out.sort();
}

describe('line', () => {
  it('horizontal line', () => {
    expect(cells(line(0, 0, 0, 3, 5), 5)).toEqual(['0,0', '0,1', '0,2', '0,3']);
  });
  it('vertical line', () => {
    expect(cells(line(0, 0, 3, 0, 5), 5)).toEqual(['0,0', '1,0', '2,0', '3,0']);
  });
  it('45-degree diagonal', () => {
    expect(cells(line(0, 0, 3, 3, 5), 5)).toEqual(['0,0', '1,1', '2,2', '3,3']);
  });
  it('single point when start === end', () => {
    expect(cells(line(2, 2, 2, 2, 5), 5)).toEqual(['2,2']);
  });
  it('clips cells outside the grid', () => {
    const result = line(-1, -1, 2, 2, 3);
    // Should only include cells inside 0..2
    for (const idx of result) expect(idx).toBeGreaterThanOrEqual(0);
  });
});
```

**Step 2: Run — fails.**

**Step 3: Implement Bresenham**

```ts
// rasterize.ts
function emit(out: Set<number>, size: number, r: number, c: number): void {
  if (r < 0 || r >= size || c < 0 || c >= size) return;
  out.add(r * size + c);
}

export function line(r0: number, c0: number, r1: number, c1: number, size: number): Set<number> {
  const out = new Set<number>();
  let r = r0;
  let c = c0;
  const dr = Math.abs(r1 - r0);
  const dc = Math.abs(c1 - c0);
  const sr = r0 < r1 ? 1 : -1;
  const sc = c0 < c1 ? 1 : -1;
  let err = dc - dr;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    emit(out, size, r, c);
    if (r === r1 && c === c1) break;
    const e2 = 2 * err;
    if (e2 > -dr) { err -= dr; c += sc; }
    if (e2 < dc)  { err += dc; r += sr; }
  }
  return out;
}
```

**Step 4: Tests pass.**

**Step 5: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/bit-grid/rasterize.ts apps/rad-os/components/apps/pixel-playground/bit-grid/__tests__/rasterize.test.ts
git commit -m "feat(bit-grid): add line rasterizer"
```

---

## Task 4: Rasterize — rect outline + rect filled (TDD)

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/bit-grid/rasterize.ts`
- Modify: `apps/rad-os/components/apps/pixel-playground/bit-grid/__tests__/rasterize.test.ts`

**Step 1: Add failing tests**

```ts
import { rect, rectFilled } from '../rasterize';

describe('rect', () => {
  it('outline — corners and edges only', () => {
    expect(cells(rect(0, 0, 2, 2, 5), 5)).toEqual([
      '0,0', '0,1', '0,2',
      '1,0',          '1,2',
      '2,0', '2,1', '2,2',
    ].sort());
  });
  it('outline — normalizes flipped coords', () => {
    expect(cells(rect(2, 2, 0, 0, 5), 5)).toEqual(cells(rect(0, 0, 2, 2, 5), 5));
  });
  it('outline 1x1 = single cell', () => {
    expect(cells(rect(1, 1, 1, 1, 3), 3)).toEqual(['1,1']);
  });
});

describe('rectFilled', () => {
  it('fills every cell in the bounds', () => {
    expect(cells(rectFilled(0, 0, 1, 1, 3), 3)).toEqual(['0,0', '0,1', '1,0', '1,1']);
  });
});
```

**Step 2: Run — fails.**

**Step 3: Implement**

```ts
// rasterize.ts (append)
export function rect(r0: number, c0: number, r1: number, c1: number, size: number): Set<number> {
  const out = new Set<number>();
  const rMin = Math.min(r0, r1), rMax = Math.max(r0, r1);
  const cMin = Math.min(c0, c1), cMax = Math.max(c0, c1);
  for (let c = cMin; c <= cMax; c++) { emit(out, size, rMin, c); emit(out, size, rMax, c); }
  for (let r = rMin; r <= rMax; r++) { emit(out, size, r, cMin); emit(out, size, r, cMax); }
  return out;
}

export function rectFilled(r0: number, c0: number, r1: number, c1: number, size: number): Set<number> {
  const out = new Set<number>();
  const rMin = Math.min(r0, r1), rMax = Math.max(r0, r1);
  const cMin = Math.min(c0, c1), cMax = Math.max(c0, c1);
  for (let r = rMin; r <= rMax; r++) for (let c = cMin; c <= cMax; c++) emit(out, size, r, c);
  return out;
}
```

**Step 4: Tests pass.**

**Step 5: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/bit-grid/rasterize.ts apps/rad-os/components/apps/pixel-playground/bit-grid/__tests__/rasterize.test.ts
git commit -m "feat(bit-grid): add rect and rect-filled rasterizers"
```

---

## Task 5: Rasterize — ellipse outline + ellipse filled (TDD)

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/bit-grid/rasterize.ts`
- Modify: `apps/rad-os/components/apps/pixel-playground/bit-grid/__tests__/rasterize.test.ts`

**Step 1: Add failing tests**

```ts
import { ellipse, ellipseFilled } from '../rasterize';

describe('ellipse', () => {
  it('produces a closed outline touching the bounding box edges', () => {
    const s = 8;
    const cellsSet = ellipse(0, 0, 7, 7, s);
    // Cardinal extremes must be set
    expect(cellsSet.has(0 * s + 3) || cellsSet.has(0 * s + 4)).toBe(true); // top
    expect(cellsSet.has(7 * s + 3) || cellsSet.has(7 * s + 4)).toBe(true); // bottom
    expect(cellsSet.has(3 * s + 0) || cellsSet.has(4 * s + 0)).toBe(true); // left
    expect(cellsSet.has(3 * s + 7) || cellsSet.has(4 * s + 7)).toBe(true); // right
  });
  it('degenerate 1x1 = single cell', () => {
    expect(Array.from(ellipse(2, 2, 2, 2, 5))).toEqual([2 * 5 + 2]);
  });
  it('normalizes flipped coords', () => {
    expect([...ellipse(7, 7, 0, 0, 8)]).toEqual([...ellipse(0, 0, 7, 7, 8)]);
  });
});

describe('ellipseFilled', () => {
  it('never emits cells outside the bounding box', () => {
    const s = 8;
    const all = ellipseFilled(1, 1, 6, 6, s);
    for (const idx of all) {
      const r = Math.floor(idx / s), c = idx % s;
      expect(r).toBeGreaterThanOrEqual(1); expect(r).toBeLessThanOrEqual(6);
      expect(c).toBeGreaterThanOrEqual(1); expect(c).toBeLessThanOrEqual(6);
    }
  });
  it('is a superset of the outline for the same bounds', () => {
    const s = 16;
    const out = ellipse(2, 2, 12, 12, s);
    const full = ellipseFilled(2, 2, 12, 12, s);
    for (const idx of out) expect(full.has(idx)).toBe(true);
  });
});
```

**Step 2: Run — fails.**

**Step 3: Implement (midpoint ellipse over bbox; filled = scanline test)**

```ts
// rasterize.ts (append)
function ellipseBounds(r0: number, c0: number, r1: number, c1: number) {
  const rMin = Math.min(r0, r1), rMax = Math.max(r0, r1);
  const cMin = Math.min(c0, c1), cMax = Math.max(c0, c1);
  const a = (cMax - cMin) / 2;   // horizontal semi-axis (cols)
  const b = (rMax - rMin) / 2;   // vertical semi-axis (rows)
  const cx = (cMin + cMax) / 2;
  const cy = (rMin + rMax) / 2;
  return { rMin, rMax, cMin, cMax, a, b, cx, cy };
}

export function ellipse(r0: number, c0: number, r1: number, c1: number, size: number): Set<number> {
  const { rMin, rMax, cMin, cMax, a, b, cx, cy } = ellipseBounds(r0, c0, r1, c1);
  const out = new Set<number>();
  if (a < 0.5 && b < 0.5) { emit(out, size, Math.round(cy), Math.round(cx)); return out; }
  // Scan the bounding box; a cell is on the outline if its ellipse value is close to 1.
  // ε chosen so we get a single-cell-thick perimeter that's continuous.
  const aa = Math.max(a, 0.5) ** 2;
  const bb = Math.max(b, 0.5) ** 2;
  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) {
      const dy = r - cy, dx = c - cx;
      const v = (dx * dx) / aa + (dy * dy) / bb;
      // Cell is "on" if inside AND any 4-neighbor is outside (perimeter test).
      if (v <= 1) {
        const neighbours = [
          [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
        ];
        const hasOutside = neighbours.some(([nr, nc]) => {
          if (nr < rMin || nr > rMax || nc < cMin || nc > cMax) return true;
          const ndy = nr - cy, ndx = nc - cx;
          return (ndx * ndx) / aa + (ndy * ndy) / bb > 1;
        });
        if (hasOutside) emit(out, size, r, c);
      }
    }
  }
  return out;
}

export function ellipseFilled(r0: number, c0: number, r1: number, c1: number, size: number): Set<number> {
  const { rMin, rMax, cMin, cMax, a, b, cx, cy } = ellipseBounds(r0, c0, r1, c1);
  const out = new Set<number>();
  const aa = Math.max(a, 0.5) ** 2;
  const bb = Math.max(b, 0.5) ** 2;
  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) {
      const dy = r - cy, dx = c - cx;
      if ((dx * dx) / aa + (dy * dy) / bb <= 1) emit(out, size, r, c);
    }
  }
  return out;
}
```

**Step 4: Tests pass.**

**Step 5: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/bit-grid/rasterize.ts apps/rad-os/components/apps/pixel-playground/bit-grid/__tests__/rasterize.test.ts
git commit -m "feat(bit-grid): add ellipse and ellipse-filled rasterizers"
```

---

## Task 6: Flood fill (TDD)

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/bit-grid/flood-fill.ts`
- Create: `apps/rad-os/components/apps/pixel-playground/bit-grid/__tests__/flood-fill.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { floodFill } from '../flood-fill';
import { bitsToBuffer } from '../buffer';

describe('floodFill', () => {
  it('fills a 0-region reached from a 0 seed', () => {
    // 3x3, top row = 1s, rest = 0s; seed middle → fills bottom 6 cells
    const buf = bitsToBuffer('111000000', 3);
    const filled = floodFill(buf, 3, 1, 1, 1);
    expect(filled.size).toBe(6);
  });
  it('is a no-op if seed already matches target value', () => {
    const buf = bitsToBuffer('111111111', 3);
    const filled = floodFill(buf, 3, 1, 1, 1);
    expect(filled.size).toBe(0);
  });
  it('is 4-connected (does not leak diagonally)', () => {
    // checkerboard: 10101 01010 10101 01010 10101 -- seed at (0,0)=1 would fill only 1s it can 4-walk to
    const buf = bitsToBuffer('1010101010101010101010101', 5);
    const filled = floodFill(buf, 5, 0, 0, 0); // toggle the 1-region to 0
    // The 1s are not 4-connected to each other — only the seed flips
    expect(filled.size).toBe(1);
  });
});
```

**Step 2: Run — fails.**

**Step 3: Implement 4-connected BFS**

```ts
// flood-fill.ts
import type { BitBuffer } from './buffer';
import { getCell } from './buffer';

/**
 * Return the set of cell indices (r*size+c) that would be flipped if a paint
 * bucket at (sr, sc) filled with `target` value. Does NOT mutate the buffer.
 */
export function floodFill(
  buf: BitBuffer,
  size: number,
  sr: number,
  sc: number,
  target: 0 | 1,
): Set<number> {
  const out = new Set<number>();
  if (sr < 0 || sr >= size || sc < 0 || sc >= size) return out;
  const seedValue = getCell(buf, size, sr, sc);
  if (seedValue === target) return out;

  const queue: Array<[number, number]> = [[sr, sc]];
  while (queue.length) {
    const [r, c] = queue.pop()!;
    const idx = r * size + c;
    if (out.has(idx)) continue;
    if (getCell(buf, size, r, c) !== seedValue) continue;
    out.add(idx);
    if (r > 0)        queue.push([r - 1, c]);
    if (r < size - 1) queue.push([r + 1, c]);
    if (c > 0)        queue.push([r, c - 1]);
    if (c < size - 1) queue.push([r, c + 1]);
  }
  return out;
}
```

**Step 4: Tests pass.**

**Step 5: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/bit-grid/flood-fill.ts apps/rad-os/components/apps/pixel-playground/bit-grid/__tests__/flood-fill.test.ts
git commit -m "feat(bit-grid): add 4-connected flood fill"
```

---

## Task 7: BitGridEditor component + useBitGrid hook

Larger task — kept as one because the component, the ref, and the subscription hook must land together to compile.

**Files:**
- Create: `apps/rad-os/components/apps/pixel-playground/bit-grid/BitGridEditor.tsx`
- Create: `apps/rad-os/components/apps/pixel-playground/bit-grid/useBitGrid.ts`

**Step 1: Write `useBitGrid.ts`**

```ts
// useBitGrid.ts
import { useEffect, useState, type RefObject } from 'react';
import type { BitGridEditorRef } from './types';

/**
 * Subscribe to the editor's committed-bits stream. Returns the current bits
 * (initially whatever the editor reports; falls back to '' until mounted).
 *
 * resetKey bumps are a safety hatch for callers that force-remount the editor.
 * The normal path — size/initialBits as props — doesn't need a reset key.
 */
export function useBitGrid(
  ref: RefObject<BitGridEditorRef | null>,
  resetKey?: unknown,
): { bits: string } {
  const [bits, setBits] = useState<string>('');

  useEffect(() => {
    const el = (ref as unknown as { current: (BitGridEditorRef & { addEventListener?: EventTarget['addEventListener']; removeEventListener?: EventTarget['removeEventListener'] }) | null }).current;
    if (!el) return;

    // Seed with current state
    setBits(el.getBits());

    // The editor forwards its ref and also exposes addEventListener/removeEventListener
    // on the ref via a private EventTarget it owns (see BitGridEditor.tsx).
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ bits: string }>).detail;
      if (detail) setBits(detail.bits);
    };
    el.addEventListener?.('bits-change', handler);
    return () => el.removeEventListener?.('bits-change', handler);
  }, [ref, resetKey]);

  return { bits };
}
```

**Step 2: Write `BitGridEditor.tsx`**

```tsx
// BitGridEditor.tsx
'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { BitGridEditorRef, Tool } from './types';
import {
  bitsToBuffer,
  bufferToBits,
  cloneBuffer,
  createBuffer,
  type BitBuffer,
} from './buffer';
import { ellipse, ellipseFilled, line, rect, rectFilled } from './rasterize';
import { floodFill } from './flood-fill';

export interface BitGridEditorProps {
  size: number;
  tool: Tool;
  /** When true, new strokes/shapes set cells to 1; when false, to 0. */
  brushIsFg: boolean;
  isGridVisible: boolean;
  /** Optional seed bits (length must equal size*size). Changing reloads the grid. */
  initialBits?: string;
  /** FG cell color (ink). */
  fgColor: string;
  /** BG cell color (page). */
  bgColor: string;
  /** Grid stroke color. */
  gridColor: string;
  className?: string;
}

const HISTORY_CAP = 50;

export const BitGridEditor = forwardRef<BitGridEditorRef, BitGridEditorProps>(
  function BitGridEditor(
    { size, tool, brushIsFg, isGridVisible, initialBits, fgColor, bgColor, gridColor, className },
    forwardedRef,
  ) {
    const target: 0 | 1 = brushIsFg ? 1 : 0;

    // Committed buffer and its render-tick.
    const committedRef = useRef<BitBuffer>(createBuffer(size));
    const [, bump] = useState(0);
    const render = () => bump((x) => x + 1);

    // History (snapshots of committed).
    const undoStack = useRef<BitBuffer[]>([]);
    const redoStack = useRef<BitBuffer[]>([]);

    // Preview (ephemeral shape under the pointer).
    const [previewCells, setPreviewCells] = useState<Set<number> | null>(null);
    const dragStart = useRef<{ r: number; c: number } | null>(null);

    // Emitter for bits-change events.
    const emitterRef = useRef<EventTarget>(new EventTarget());

    function emitBitsChange() {
      emitterRef.current.dispatchEvent(
        new CustomEvent('bits-change', { detail: { bits: bufferToBits(committedRef.current) } }),
      );
    }

    function pushHistory(prev: BitBuffer) {
      undoStack.current.push(prev);
      if (undoStack.current.length > HISTORY_CAP) undoStack.current.shift();
      redoStack.current.length = 0;
    }

    function setBuffer(next: BitBuffer) {
      pushHistory(cloneBuffer(committedRef.current));
      committedRef.current = next;
      emitBitsChange();
      render();
    }

    // Reset on size change — clear buffer, seed with initialBits if provided.
    useEffect(() => {
      const fresh = initialBits && initialBits.length === size * size
        ? bitsToBuffer(initialBits, size)
        : createBuffer(size);
      committedRef.current = fresh;
      undoStack.current.length = 0;
      redoStack.current.length = 0;
      setPreviewCells(null);
      dragStart.current = null;
      emitBitsChange();
      render();
      // Intentionally omit emitBitsChange/render from deps — they are stable closures.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size, initialBits]);

    // Imperative handle — and splice in addEventListener/removeEventListener
    // from the emitter so useBitGrid can subscribe.
    useImperativeHandle(
      forwardedRef,
      () => {
        const emitter = emitterRef.current;
        const api: BitGridEditorRef = {
          getBits: () => bufferToBits(committedRef.current),
          setBits: (bits) => {
            if (bits.length !== size * size) return;
            setBuffer(bitsToBuffer(bits, size));
          },
          clear: () => setBuffer(createBuffer(size)),
          undo: () => {
            const prev = undoStack.current.pop();
            if (!prev) return;
            redoStack.current.push(cloneBuffer(committedRef.current));
            committedRef.current = prev;
            emitBitsChange();
            render();
          },
          redo: () => {
            const next = redoStack.current.pop();
            if (!next) return;
            undoStack.current.push(cloneBuffer(committedRef.current));
            committedRef.current = next;
            emitBitsChange();
            render();
          },
          canUndo: () => undoStack.current.length > 0,
          canRedo: () => redoStack.current.length > 0,
        };
        return Object.assign(api, {
          addEventListener: emitter.addEventListener.bind(emitter),
          removeEventListener: emitter.removeEventListener.bind(emitter),
        });
      },
      [size],
    );

    // Render: static grid of cells.
    const cellSize = 100 / size; // in svg user-units; viewBox is 0..100
    const cells = useMemo(() => {
      const buf = committedRef.current;
      const out: Array<{ key: string; x: number; y: number; filled: boolean; preview: boolean }> = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const idx = r * size + c;
          const committed = buf[idx] === 1;
          const preview = previewCells?.has(idx) ?? false;
          out.push({
            key: `${r}-${c}`,
            x: c * cellSize,
            y: r * cellSize,
            filled: preview ? target === 1 : committed,
            preview,
          });
        }
      }
      return out;
      // render-tick is the opaque trigger — committedRef is mutable.
    }, [size, cellSize, previewCells, target]);

    function pointerToCell(e: React.PointerEvent<SVGSVGElement>): { r: number; c: number } | null {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const c = Math.floor((x / rect.width) * size);
      const r = Math.floor((y / rect.height) * size);
      if (r < 0 || r >= size || c < 0 || c >= size) return null;
      return { r, c };
    }

    function stamp(cellsSet: Set<number>) {
      const next = cloneBuffer(committedRef.current);
      for (const idx of cellsSet) next[idx] = target;
      setBuffer(next);
    }

    function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
      const cell = pointerToCell(e);
      if (!cell) return;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      dragStart.current = cell;

      if (tool === 'pen' || tool === 'eraser') {
        const s = new Set<number>([cell.r * size + cell.c]);
        // eraser with brushIsFg=true still erases to BG — call site sets brushIsFg
        // appropriately. Keeping this dumb: stamp `target` regardless.
        stamp(s);
      } else if (tool === 'fill') {
        const set = floodFill(committedRef.current, size, cell.r, cell.c, target);
        if (set.size) stamp(set);
      }
      // line/rect/ellipse: wait for move/up.
    }

    function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
      const cell = pointerToCell(e);
      if (!cell) return;

      if (tool === 'pen' || tool === 'eraser') {
        if (!dragStart.current) return;
        // Interpolate a line from the previous cell to the current one to avoid gaps.
        const strokeCells = line(dragStart.current.r, dragStart.current.c, cell.r, cell.c, size);
        stamp(strokeCells);
        dragStart.current = cell;
      } else if (dragStart.current && (tool === 'line' || tool === 'rect' || tool === 'rect-fill' || tool === 'ellipse' || tool === 'ellipse-fill')) {
        const start = dragStart.current;
        let preview: Set<number>;
        switch (tool) {
          case 'line': preview = line(start.r, start.c, cell.r, cell.c, size); break;
          case 'rect': preview = rect(start.r, start.c, cell.r, cell.c, size); break;
          case 'rect-fill': preview = rectFilled(start.r, start.c, cell.r, cell.c, size); break;
          case 'ellipse': preview = ellipse(start.r, start.c, cell.r, cell.c, size); break;
          case 'ellipse-fill': preview = ellipseFilled(start.r, start.c, cell.r, cell.c, size); break;
        }
        setPreviewCells(preview);
      }
    }

    function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
      const cell = pointerToCell(e);
      const start = dragStart.current;
      dragStart.current = null;

      if (start && cell && (tool === 'line' || tool === 'rect' || tool === 'rect-fill' || tool === 'ellipse' || tool === 'ellipse-fill')) {
        let finalCells: Set<number>;
        switch (tool) {
          case 'line': finalCells = line(start.r, start.c, cell.r, cell.c, size); break;
          case 'rect': finalCells = rect(start.r, start.c, cell.r, cell.c, size); break;
          case 'rect-fill': finalCells = rectFilled(start.r, start.c, cell.r, cell.c, size); break;
          case 'ellipse': finalCells = ellipse(start.r, start.c, cell.r, cell.c, size); break;
          case 'ellipse-fill': finalCells = ellipseFilled(start.r, start.c, cell.r, cell.c, size); break;
        }
        if (finalCells.size) stamp(finalCells);
      }
      setPreviewCells(null);
    }

    return (
      <svg
        viewBox={`0 0 100 100`}
        preserveAspectRatio="xMidYMid meet"
        className={className}
        style={{ touchAction: 'none', imageRendering: 'pixelated', width: '100%', height: '100%', display: 'block', background: bgColor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* cells */}
        {cells.map((cell) => (
          <rect
            key={cell.key}
            x={cell.x}
            y={cell.y}
            width={cellSize}
            height={cellSize}
            fill={cell.filled ? fgColor : bgColor}
            opacity={cell.preview ? 0.6 : 1}
            shapeRendering="crispEdges"
          />
        ))}
        {/* grid lines */}
        {isGridVisible && (
          <g stroke={gridColor} strokeWidth={0.5} shapeRendering="crispEdges" pointerEvents="none">
            {Array.from({ length: size + 1 }, (_, i) => (
              <line key={`h${i}`} x1={0} x2={100} y1={i * cellSize} y2={i * cellSize} />
            ))}
            {Array.from({ length: size + 1 }, (_, i) => (
              <line key={`v${i}`} x1={i * cellSize} x2={i * cellSize} y1={0} y2={100} />
            ))}
          </g>
        )}
      </svg>
    );
  },
);
```

**Step 3: Run the test suite**

```bash
pnpm --filter rad-os test -- bit-grid
```
Expected: existing unit tests still pass; nothing new to assert yet on the component itself.

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/bit-grid/BitGridEditor.tsx apps/rad-os/components/apps/pixel-playground/bit-grid/useBitGrid.ts
git commit -m "feat(bit-grid): add BitGridEditor component + useBitGrid hook"
```

---

## Task 8: Rewrite `constants.ts` — Tool union + new TOOL_DEFS

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/constants.ts`

**Step 1: Edit the imports and tool defs**

Replace the Dotting import and enum references with the new `Tool` union. `eraser/fill` are still `large` visually; SELECT / PAN drop entirely (v1).

```ts
// Replace the first import line:
//   import { BrushTool } from '@/lib/dotting';
// with:
import type { Tool } from './bit-grid';
```

Replace the `ToolDef` interface and `TOOL_DEFS` array:

```ts
export interface ToolDef {
  tool: Tool;
  label: string;
  icon: string;
  large?: boolean;
}

export const TOOL_DEFS: ToolDef[] = [
  { tool: 'pen', label: 'Pen', icon: 'pencil' },
  { tool: 'eraser', label: 'Eraser', icon: 'interface-essential-eraser', large: true },
  { tool: 'fill', label: 'Fill', icon: 'design-color-bucket', large: true },
  { tool: 'line', label: 'Line', icon: 'slash-small' },
  { tool: 'rect', label: 'Rect', icon: 'outline-box' },
  { tool: 'rect-fill', label: 'Fill Rect', icon: 'notched-square' },
  { tool: 'ellipse', label: 'Ellipse', icon: 'interface-essential-alert-circle-1', large: true },
  { tool: 'ellipse-fill', label: 'Fill Ellipse', icon: 'interface-essential-alert-circle-2', large: true },
];
```

Also drop the `hidden` field (no tools are hidden anymore).

**Step 2: Type-check**

```bash
pnpm --filter rad-os tsc --noEmit
```
Expected: `constants.ts` compiles; consumers (ToolPalette, PixelPlayground) now have type errors — fix in subsequent tasks.

**Step 3: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/constants.ts
git commit -m "refactor(pixel-playground): constants use Tool string union"
```

---

## Task 9: Migrate `ToolPalette.tsx`

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/ToolPalette.tsx`

**Step 1: Swap the type import**

```diff
- import { type BrushTool } from '@/lib/dotting';
+ import type { Tool } from './bit-grid';
```

**Step 2: Swap prop types**

```diff
- activeTool: BrushTool;
- onToolChange: (tool: BrushTool) => void;
+ activeTool: Tool;
+ onToolChange: (tool: Tool) => void;
```

And in the `onValueChange`:

```diff
- if (next != null) onToolChange(next as BrushTool);
+ if (next != null) onToolChange(next as Tool);
```

Remove the `.filter(def => !def.hidden)` — no hidden tools anymore:

```diff
- {TOOL_DEFS.filter((def) => !def.hidden).map((def) => (
+ {TOOL_DEFS.map((def) => (
```

**Step 3: Type-check**

```bash
pnpm --filter rad-os tsc --noEmit
```
Expected: `ToolPalette.tsx` compiles cleanly.

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/ToolPalette.tsx
git commit -m "refactor(pixel-playground): ToolPalette uses Tool union"
```

---

## Task 10: Rewrite `OneBitCanvas.tsx` → thin wrapper around `BitGridEditor`

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/OneBitCanvas.tsx`

Replace the whole file:

```tsx
'use client';

import { type MutableRefObject } from 'react';
import { BitGridEditor, type BitGridEditorRef, type Tool } from './bit-grid';
import { useResolvedColor } from './useResolvedColor';

export interface OneBitCanvasProps {
  editorRef: MutableRefObject<BitGridEditorRef | null>;
  gridSize: number;
  tool: Tool;
  /** When true strokes paint FG (ink); when false, BG (page). */
  brushIsFg: boolean;
  isGridVisible: boolean;
  /** Optional seed bits (length must equal gridSize²). */
  initialBits?: string;
}

export function OneBitCanvas({
  editorRef,
  gridSize,
  tool,
  brushIsFg,
  isGridVisible,
  initialBits,
}: OneBitCanvasProps) {
  const fg = useResolvedColor('--color-ink', '#0f0e0c');
  const bg = useResolvedColor('--color-page', '#fef8e2');
  const gridStroke = useResolvedColor('--color-rule', '#0f0e0c20');

  return (
    <div className="w-full h-full min-w-0 min-h-0 bg-depth flex items-center justify-center">
      <div className="aspect-square max-w-full max-h-full h-full w-auto">
        <BitGridEditor
          ref={editorRef}
          size={gridSize}
          tool={tool}
          brushIsFg={brushIsFg}
          isGridVisible={isGridVisible}
          initialBits={initialBits}
          fgColor={fg}
          bgColor={bg}
          gridColor={gridStroke}
        />
      </div>
    </div>
  );
}
```

**Step 2: Type-check — should compile, but PixelPlayground and EditorToolbar will still be broken.**

**Step 3: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/OneBitCanvas.tsx
git commit -m "refactor(pixel-playground): OneBitCanvas wraps BitGridEditor"
```

---

## Task 11: Rewrite `EditorToolbar.tsx` to use the ref directly

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/EditorToolbar.tsx`

No more `useDotting` hook — talk to the ref directly.

```tsx
'use client';

import { type MutableRefObject } from 'react';
import type { BitGridEditorRef } from './bit-grid';
import { Button, Tooltip, Switch } from '@rdna/radiants/components/core';

interface EditorToolbarProps {
  editorRef: MutableRefObject<BitGridEditorRef | null>;
  isGridVisible: boolean;
  onGridToggle: (visible: boolean) => void;
}

export function EditorToolbar({ editorRef, isGridVisible, onGridToggle }: EditorToolbarProps) {
  return (
    <div className="h-full flex items-center gap-1 px-2">
      <Tooltip content="Undo" position="top">
        <Button mode="text" size="sm" iconOnly icon="seek-back" aria-label="Undo"
                onClick={() => editorRef.current?.undo()} />
      </Tooltip>
      <Tooltip content="Redo" position="top">
        <Button mode="text" size="sm" iconOnly icon="go-forward" aria-label="Redo"
                onClick={() => editorRef.current?.redo()} />
      </Tooltip>

      <span aria-hidden className="self-stretch w-px bg-rule mx-1" />

      <div className="flex items-center gap-1.5">
        <span className="font-joystix text-xs text-sub uppercase select-none">Grid</span>
        <Switch checked={isGridVisible} onChange={() => onGridToggle(!isGridVisible)} size="sm" />
      </div>

      <span aria-hidden className="self-stretch w-px bg-rule mx-1" />

      <Tooltip content="Clear canvas" position="top">
        <Button mode="text" size="sm" iconOnly icon="trash" aria-label="Clear canvas"
                onClick={() => editorRef.current?.clear()} />
      </Tooltip>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/EditorToolbar.tsx
git commit -m "refactor(pixel-playground): EditorToolbar talks to BitGridEditor ref"
```

---

## Task 12: Migrate `PixelPlayground.tsx` — kill `canvasKey`, `useBrush`, `useData`, `bits-from-layer`

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx`
- Delete: `apps/rad-os/components/apps/pixel-playground/bits-from-layer.ts`
- Delete: `apps/rad-os/components/apps/pixel-playground/__tests__/bits-from-layer.test.ts`

**Step 1: Rewrite PixelPlayground.tsx** (keep the layout exactly as it was; only the editor plumbing changes)

Key changes:
- Remove `useBrush`, `useData`, `canvasKey`, `dottingRef`, `bits-from-layer` usage.
- Add local `tool` state; remove brush/color plumbing (1-bit is always `target = brushIsFg`).
- Add `editorRef: useRef<BitGridEditorRef>(null)` and `useBitGrid(editorRef)` → `{ bits }`.
- Pass `size={gridSize}` and `initialBits={state.selectedEntry?.bits}` to `OneBitCanvas`.
- Build `currentGrid: PixelGrid | null` from `bits` directly (no layer conversion).

The new top of the component:

```tsx
'use client';

import { useRef, useState, useMemo } from 'react';
import { AppWindow, Button } from '@rdna/radiants/components/core';
import type { PixelGrid } from '@rdna/pixel';
import type { PixelPlaygroundState } from './types';
import { DEFAULT_STATE, MODE_CONFIG, getRegistryForMode } from './constants';
import { ModeNav } from './ModeNav';
import { OneBitCanvas } from './OneBitCanvas';
import { EditorToolbar } from './EditorToolbar';
import { ToolPalette } from './ToolPalette';
import { PixelCodeOutput } from './PixelCodeOutput';
import { ModePreview } from './previews/ModePreview';
import { RegistryList } from './RegistryList';
import {
  type BitGridEditorRef,
  type Tool,
  useBitGrid,
} from './bit-grid';

export function PixelPlayground() {
  const [state, setState] = useState<PixelPlaygroundState>(DEFAULT_STATE);
  const [tool, setTool] = useState<Tool>('pen');
  const [isGridVisible, setGridVisible] = useState(true);

  const editorRef = useRef<BitGridEditorRef>(null);
  const { bits } = useBitGrid(editorRef);

  const currentGrid = useMemo<PixelGrid | null>(() => {
    if (!bits || bits.length !== state.gridSize * state.gridSize) {
      return state.selectedEntry; // fall back to the seeded entry until the editor emits
    }
    const hasAny = bits.includes('1');
    if (!hasAny && !state.selectedEntry) return null;
    return {
      name: state.selectedEntry?.name ?? 'untitled',
      width: state.gridSize,
      height: state.gridSize,
      bits,
    };
  }, [bits, state.gridSize, state.selectedEntry]);

  // ...layout (unchanged) — just replace the <OneBitCanvas> element and the size-bump handlers.
}
```

In the JSX, the canvas becomes:

```tsx
<OneBitCanvas
  editorRef={editorRef}
  gridSize={state.gridSize}
  tool={tool}
  brushIsFg={tool !== 'eraser'}
  isGridVisible={isGridVisible}
  initialBits={state.selectedEntry?.bits}
/>
```

The `<ToolPalette>` becomes:

```tsx
<ToolPalette activeTool={tool} onToolChange={setTool} />
```

The `<EditorToolbar>` becomes:

```tsx
<EditorToolbar
  editorRef={editorRef}
  isGridVisible={isGridVisible}
  onGridToggle={setGridVisible}
/>
```

**Remove every `setCanvasKey` call** — the editor reacts to size/initialBits changes via `useEffect`, no remount dance needed.

**Step 2: Delete the stale files**

```bash
git rm apps/rad-os/components/apps/pixel-playground/bits-from-layer.ts
git rm apps/rad-os/components/apps/pixel-playground/__tests__/bits-from-layer.test.ts
```

**Step 3: Type-check + run tests**

```bash
pnpm --filter rad-os tsc --noEmit
pnpm --filter rad-os test -- pixel-playground
```
Expected: clean compile, all tests pass.

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx
git commit -m "refactor(pixel-playground): migrate to BitGridEditor, drop dotting usage"
```

---

## Task 13: Lock patterns-mode size (follow-up from diagnosis)

**Files:**
- Modify: `apps/rad-os/components/apps/pixel-playground/constants.ts`

**Step 1: Freeze patterns to 8×8**

In `MODE_CONFIG.patterns`:

```diff
- minSize: 4,
- maxSize: 16,
+ minSize: 8,
+ maxSize: 8,
```

The existing size buttons in `PixelPlayground.tsx` already disable when `gridSize <= minSize` and `>= maxSize`, so both buttons auto-disable in patterns mode. No JSX changes needed.

**Step 2: Commit**

```bash
git add apps/rad-os/components/apps/pixel-playground/constants.ts
git commit -m "fix(pixel-playground): lock patterns to 8x8"
```

---

## Task 14: Visual QA in the browser

Not TDD — this is a human-in-the-loop pass. Required because the editor is interactive.

**Step 1: Start dev server**

```bash
pnpm dev
```
Open http://localhost:3000, open the Lab app, Pixel tab.

**Step 2: Walk through the checklist** (confirm each in the UI)

- [ ] Canvas renders at 8×8 in patterns mode, grid visible by default.
- [ ] Pen: click and drag — cells fill contiguously, no gaps on fast drags.
- [ ] Eraser: drag over filled cells — they clear.
- [ ] Fill: click on empty region, the 4-connected region fills.
- [ ] Line: drag from A to B — preview shows during drag, commits on release.
- [ ] Rect + Rect fill: same — preview then commit.
- [ ] Ellipse + Ellipse fill: same; outline is 1-cell-thick and continuous.
- [ ] Undo / Redo step through every committed action.
- [ ] Clear zeroes the grid (and is undoable).
- [ ] Grid toggle hides/shows the rule lines.
- [ ] Switching mode (corners ↔ patterns ↔ icons) resets the canvas with the new default size — **no runtime error, no hydration warning**.
- [ ] Selecting a registry entry loads it into the canvas.
- [ ] Increasing size in corners/icons mode works without error.
- [ ] Patterns mode's size buttons are both disabled (locked at 8).

**Step 3: If anything fails, open `qc-debug` and fix before proceeding.**

---

## Task 15: Final sweep — no `@/lib/dotting` imports remain in pixel-playground

**Step 1: Grep**

```bash
grep -rn "@/lib/dotting" apps/rad-os/components/apps/pixel-playground/ || echo "OK: no dotting imports in pixel-playground"
```
Expected: `OK: no dotting imports in pixel-playground`.

If anything remains, migrate it using the patterns from Tasks 9–12.

**Step 2: Confirm lib/dotting is still referenced by Studio**

```bash
grep -rln "@/lib/dotting" apps/rad-os/components/apps/studio/ | wc -l
```
Expected: ≥1 (Studio still uses it — this is correct, Studio was never in scope).

**Step 3: Final commit if anything changed**

```bash
git status
git diff
# If clean, nothing to commit — just close out.
```

---

## References / gotchas

- **Tailwind v4 max-w trap:** if any Tailwind-sized containers land in the BitGridEditor tree, remember `max-w-md` = 16px. Use arbitrary rems. (See auto-memory.)
- **Hydration mismatch in Taskbar:** the ID-mismatch error from issue 1 is **unrelated** to this plan — do not chase it here. File it as a separate investigation.
- **Keep `lib/dotting/` alive:** Studio still depends on it. No deletions there.
- **Pointer capture:** `setPointerCapture` in `onPointerDown` is essential for drag-outside-the-svg to still fire pointer events on the same target.

## Execution handoff

Plan complete and saved to `docs/plans/2026-04-20-bitgrid-editor.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration.

**2. Parallel Session (separate)** — open a new session in this worktree with wf-execute, batched with checkpoints.

Which approach?
