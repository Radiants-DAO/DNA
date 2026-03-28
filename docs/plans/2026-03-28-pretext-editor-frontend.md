# Pretext Layout Editor — Frontend Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Build the visual inspector panel UI, DOM overlay system, and GoodNewsApp integration for the pretext layout editor — the user-facing half of `@rdna/controls/pretext`.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-pretext-editor` → branch `feat/pretext-editor` (same as backend plan)

**Architecture:** The frontend builds on the backend's `usePretextSurface` hook, types, and geometry engine. It provides: (1) a shared DOM overlay system for hover-highlight + click-select, (2) an InDesign-style inspector panel with wrap side, offsets, contour type controls, and (3) GoodNewsApp integration as the first consumer. Built from `@rdna/controls` primitives (Select, TextInput, Toggle, Folder). Undo/redo via Zustand temporal middleware.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Vitest, `@rdna/controls` (host package), `@rdna/radiants` (peer dep for UI primitives)

**Depends on:**
- Backend plan (`docs/plans/2026-03-28-pretext-editor-backend.md`) Tasks 1–9 completed (types, geometry, `usePretextSurface`, descriptor, measure)
- `@rdna/controls` P0 controls existing: Select, TextInput, Toggle, Folder (from `docs/plans/2026-03-27-rdna-controls-library.md`)
- If `@rdna/controls` P0 isn't built yet, this plan uses native HTML controls as placeholders and swaps them later.

**Key reference files:**
- `packages/controls/src/pretext/` — backend API (types, usePretextSurface, geometry, descriptor, measure)
- `apps/rad-os/components/apps/GoodNewsApp.tsx` — first consumer (current implementation)
- `@chenglou/pretext/demos/editorial-engine.ts` — reference patterns (syncPool, fitHeadline)

---

### Task 1: DOM Overlay Component — Hover Highlight

The overlay system highlights registered elements on hover. Shared across all `@rdna/controls` control types, but built here first for pretext.

**Files:**
- Create: `packages/controls/src/overlay/DomOverlay.tsx`
- Create: `packages/controls/src/overlay/index.ts`
- Test: `packages/controls/test/overlay/DomOverlay.test.tsx`

**Step 1: Write the failing test**

Create `packages/controls/test/overlay/DomOverlay.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DomOverlay } from '../../src/overlay/DomOverlay';
import { useRef } from 'react';

function TestHarness({ onSelect }: { onSelect: (id: string) => void }) {
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);

  const targets = [
    { id: 'box-a', ref: ref1, label: 'Box A' },
    { id: 'box-b', ref: ref2, label: 'Box B' },
  ];

  return (
    <div style={{ position: 'relative', width: 400, height: 400 }}>
      <div ref={ref1} data-testid="box-a" style={{ position: 'absolute', left: 10, top: 10, width: 100, height: 100 }}>
        A
      </div>
      <div ref={ref2} data-testid="box-b" style={{ position: 'absolute', left: 200, top: 200, width: 100, height: 100 }}>
        B
      </div>
      <DomOverlay targets={targets} onSelect={onSelect} selectedId={null} />
    </div>
  );
}

describe('DomOverlay', () => {
  it('renders without crashing', () => {
    const onSelect = vi.fn();
    render(<TestHarness onSelect={onSelect} />);
    expect(screen.getByTestId('box-a')).toBeTruthy();
  });

  it('is exported as a component', async () => {
    const mod = await import('../../src/overlay/DomOverlay');
    expect(typeof mod.DomOverlay).toBe('function');
  });
});
```

**Step 2: Run to verify failure**

```bash
pnpm --filter @rdna/controls exec vitest run test/overlay/DomOverlay.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Implement**

Create `packages/controls/src/overlay/DomOverlay.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export type OverlayTarget = {
  id: string;
  ref: RefObject<HTMLElement | SVGElement | null>;
  label?: string;
};

type OverlayProps = {
  targets: OverlayTarget[];
  onSelect: (id: string) => void;
  selectedId: string | null;
};

type OverlayRect = {
  id: string;
  label?: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * DOM overlay for hover-highlight and click-select. Renders a transparent
 * layer over the container that draws outlines around registered targets.
 *
 * Pattern borrowed from interface-kit's DOM inspector overlay.
 */
export function DomOverlay({ targets, onSelect, selectedId }: OverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [rects, setRects] = useState<OverlayRect[]>([]);

  // Measure target positions relative to the overlay container
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const measured: OverlayRect[] = [];
    for (const target of targets) {
      const el = target.ref.current;
      if (!el) continue;
      const r = el.getBoundingClientRect();
      measured.push({
        id: target.id,
        label: target.label,
        x: r.left - containerRect.left,
        y: r.top - containerRect.top,
        w: r.width,
        h: r.height,
      });
    }
    setRects(measured);
  }, [targets]);

  // Re-measure on mount and when targets change
  useEffect(() => {
    measure();
    // Also re-measure on scroll/resize
    const observer = new ResizeObserver(measure);
    const container = containerRef.current;
    if (container) observer.observe(container);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', measure);
    };
  }, [measure]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const mx = e.clientX - containerRect.left;
    const my = e.clientY - containerRect.top;

    // Hit-test: find topmost target under cursor
    let hit: string | null = null;
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i]!;
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        hit = r.id;
        break;
      }
    }
    setHoveredId(hit);
  }, [rects]);

  const handleMouseLeave = useCallback(() => setHoveredId(null), []);

  const handleClick = useCallback(() => {
    if (hoveredId) onSelect(hoveredId);
  }, [hoveredId, onSelect]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 50 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {rects.map(r => {
        const isHovered = r.id === hoveredId;
        const isSelected = r.id === selectedId;
        if (!isHovered && !isSelected) return null;

        return (
          <div
            key={r.id}
            className="absolute pointer-events-none"
            style={{
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              outline: isSelected ? '2px solid oklch(0.7 0.15 250)' : '1px dashed oklch(0.7 0.1 250 / 0.6)',
              outlineOffset: 2,
              borderRadius: 2,
            }}
          >
            {r.label && (isHovered || isSelected) && (
              <div
                className="absolute text-xs px-1 py-0.5 rounded"
                style={{
                  top: -20,
                  left: 0,
                  background: 'oklch(0.25 0.02 250)',
                  color: 'oklch(0.9 0 0)',
                  fontSize: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {r.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

Create `packages/controls/src/overlay/index.ts`:

```ts
export { DomOverlay } from './DomOverlay';
export type { OverlayTarget } from './DomOverlay';
```

**Step 4: Run tests**

```bash
pnpm --filter @rdna/controls exec vitest run test/overlay/DomOverlay.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/controls/src/overlay/ packages/controls/test/overlay/
git commit -m "feat(controls): add shared DOM overlay component"
```

---

### Task 2: Inspector Panel Shell — PretextInspector

The main inspector panel component. Shows settings for the currently selected element.

**Files:**
- Create: `packages/controls/src/pretext/PretextInspector.tsx`
- Test: `packages/controls/test/pretext/PretextInspector.test.tsx`

**Step 1: Write the failing test**

Create `packages/controls/test/pretext/PretextInspector.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PretextInspector } from '../../src/pretext/PretextInspector';
import type { PretextSurface } from '../../src/pretext/usePretextSurface';

const mockSurface: PretextSurface = {
  columns: [{ id: 'main', x: 0, width: 400 }],
  obstacles: [
    { id: 'hero', contour: 'boundingBox', bounds: { x: 0, y: 0, width: 200, height: 100 }, wrap: 'both', offsets: { top: 8, right: 8, bottom: 8, left: 8 } },
  ],
  textBlocks: [{ id: 'body', font: '16px serif', lineHeight: 24 }],
  selectedId: 'hero',
  select: () => {},
  deselect: () => {},
  updateObstacle: () => {},
  updateColumn: () => {},
  updateTextBlock: () => {},
  getDescriptor: () => ({ version: 1, columns: [], obstacles: [], textBlocks: [] }),
};

describe('PretextInspector', () => {
  it('renders panel title', () => {
    render(<PretextInspector surface={mockSurface} />);
    expect(screen.getByText('Text Wrap')).toBeTruthy();
  });

  it('shows selected element id', () => {
    render(<PretextInspector surface={mockSurface} />);
    expect(screen.getByText('hero')).toBeTruthy();
  });

  it('shows nothing selected message when no selection', () => {
    render(<PretextInspector surface={{ ...mockSurface, selectedId: null }} />);
    expect(screen.getByText(/select an element/i)).toBeTruthy();
  });
});
```

**Step 2: Run to verify failure**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/PretextInspector.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Implement**

Create `packages/controls/src/pretext/PretextInspector.tsx`:

```tsx
'use client';

import { useCallback } from 'react';
import type { PretextSurface } from './usePretextSurface';
import type { ObstacleDef, ColumnDef, TextBlockDef, WrapSide, Offsets } from './types';

type Props = {
  surface: PretextSurface;
};

const WRAP_SIDES: { value: WrapSide; label: string }[] = [
  { value: 'leftSide', label: 'Left Side' },
  { value: 'rightSide', label: 'Right Side' },
  { value: 'both', label: 'Both Sides' },
  { value: 'largestArea', label: 'Largest Area' },
];

// ============================================================================
// Sub-panels for each element type
// ============================================================================

function ObstaclePanel({
  obstacle,
  onUpdate,
}: {
  obstacle: ObstacleDef;
  onUpdate: (patch: Partial<ObstacleDef>) => void;
}) {
  const wrap = ('wrap' in obstacle ? obstacle.wrap : 'both') as WrapSide;
  const offsets = ('offsets' in obstacle ? obstacle.offsets : { top: 0, right: 0, bottom: 0, left: 0 }) as Offsets;

  return (
    <div className="flex flex-col gap-3">
      {/* Contour / type indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">Type</span>
        <span className="text-xs font-mono">
          {'contour' in obstacle ? obstacle.contour : (obstacle as { type: string }).type}
        </span>
      </div>

      {/* Wrap side */}
      {'wrap' in obstacle && (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Wrap To</span>
          <select
            value={wrap}
            onChange={e => onUpdate({ wrap: e.target.value as WrapSide })}
            className="bg-surface-secondary text-main text-xs px-2 py-1 rounded border border-line"
          >
            {WRAP_SIDES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      )}

      {/* Offsets */}
      {'offsets' in obstacle && offsets && (
        <fieldset className="flex flex-col gap-1">
          <legend className="text-xs text-muted">Offsets (px)</legend>
          <div className="grid grid-cols-2 gap-1">
            {(['top', 'right', 'bottom', 'left'] as const).map(side => (
              <label key={side} className="flex items-center gap-1">
                <span className="text-xs w-8 text-right">{side[0]!.toUpperCase()}</span>
                <input
                  type="number"
                  value={offsets[side]}
                  onChange={e => onUpdate({
                    offsets: { ...offsets, [side]: Number(e.target.value) },
                  })}
                  className="bg-surface-secondary text-main text-xs px-1 py-0.5 w-14 rounded border border-line"
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Circle-specific fields */}
      {'contour' in obstacle && obstacle.contour === 'circle' && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">Circle</span>
          {(['cx', 'cy', 'radius'] as const).map(field => (
            <label key={field} className="flex items-center gap-1">
              <span className="text-xs w-12">{field}</span>
              <input
                type="number"
                value={(obstacle as Record<string, number>)[field]}
                onChange={e => onUpdate({ [field]: Number(e.target.value) } as Partial<ObstacleDef>)}
                className="bg-surface-secondary text-main text-xs px-1 py-0.5 w-16 rounded border border-line"
              />
            </label>
          ))}
        </div>
      )}

      {/* Dropcap-specific fields */}
      {'type' in obstacle && (obstacle as { type: string }).type === 'dropcap' && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">Drop Cap</span>
          <label className="flex items-center gap-1">
            <span className="text-xs w-12">Char</span>
            <input
              type="text"
              value={(obstacle as { character: string }).character}
              maxLength={1}
              onChange={e => onUpdate({ character: e.target.value } as Partial<ObstacleDef>)}
              className="bg-surface-secondary text-main text-xs px-1 py-0.5 w-10 rounded border border-line text-center"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-xs w-12">Lines</span>
            <input
              type="number"
              value={(obstacle as { lineCount: number }).lineCount}
              min={1}
              max={10}
              onChange={e => onUpdate({ lineCount: Number(e.target.value) } as Partial<ObstacleDef>)}
              className="bg-surface-secondary text-main text-xs px-1 py-0.5 w-14 rounded border border-line"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-xs w-12">Font</span>
            <input
              type="text"
              value={(obstacle as { font: string }).font}
              onChange={e => onUpdate({ font: e.target.value } as Partial<ObstacleDef>)}
              className="bg-surface-secondary text-main text-xs px-1 py-0.5 flex-1 rounded border border-line"
            />
          </label>
        </div>
      )}

      {/* Pullquote-specific fields */}
      {'type' in obstacle && (obstacle as { type: string }).type === 'pullquote' && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">Pull Quote</span>
          <label className="flex items-center gap-1">
            <span className="text-xs w-12">Font</span>
            <input
              type="text"
              value={(obstacle as { font: string }).font}
              onChange={e => onUpdate({ font: e.target.value } as Partial<ObstacleDef>)}
              className="bg-surface-secondary text-main text-xs px-1 py-0.5 flex-1 rounded border border-line"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-xs w-12">Width</span>
            <input
              type="number"
              value={(obstacle as { maxWidth: number }).maxWidth}
              onChange={e => onUpdate({ maxWidth: Number(e.target.value) } as Partial<ObstacleDef>)}
              className="bg-surface-secondary text-main text-xs px-1 py-0.5 w-16 rounded border border-line"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function ColumnPanel({
  column,
  onUpdate,
}: {
  column: ColumnDef;
  onUpdate: (patch: Partial<ColumnDef>) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-1">
        <span className="text-xs w-12">X</span>
        <input
          type="number"
          value={column.x}
          onChange={e => onUpdate({ x: Number(e.target.value) })}
          className="bg-surface-secondary text-main text-xs px-1 py-0.5 w-16 rounded border border-line"
        />
      </label>
      <label className="flex items-center gap-1">
        <span className="text-xs w-12">Width</span>
        <input
          type="number"
          value={column.width}
          onChange={e => onUpdate({ width: Number(e.target.value) })}
          className="bg-surface-secondary text-main text-xs px-1 py-0.5 w-16 rounded border border-line"
        />
      </label>
    </div>
  );
}

function TextBlockPanel({
  block,
  onUpdate,
}: {
  block: TextBlockDef;
  onUpdate: (patch: Partial<TextBlockDef>) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-1">
        <span className="text-xs w-12">Font</span>
        <input
          type="text"
          value={block.font}
          onChange={e => onUpdate({ font: e.target.value })}
          className="bg-surface-secondary text-main text-xs px-1 py-0.5 flex-1 rounded border border-line"
        />
      </label>
      <label className="flex items-center gap-1">
        <span className="text-xs w-12">LH</span>
        <input
          type="number"
          value={block.lineHeight}
          step={0.1}
          onChange={e => onUpdate({ lineHeight: Number(e.target.value) })}
          className="bg-surface-secondary text-main text-xs px-1 py-0.5 w-16 rounded border border-line"
        />
      </label>
      {block.maxColumnHeight !== undefined && (
        <label className="flex items-center gap-1">
          <span className="text-xs w-12">Max H</span>
          <input
            type="number"
            value={block.maxColumnHeight}
            onChange={e => onUpdate({ maxColumnHeight: Number(e.target.value) })}
            className="bg-surface-secondary text-main text-xs px-1 py-0.5 w-16 rounded border border-line"
          />
        </label>
      )}
    </div>
  );
}

// ============================================================================
// Main inspector
// ============================================================================

export function PretextInspector({ surface }: Props) {
  const { selectedId, obstacles, columns, textBlocks, updateObstacle, updateColumn, updateTextBlock, getDescriptor } = surface;

  const selectedObstacle = obstacles.find(o => o.id === selectedId);
  const selectedColumn = columns.find(c => c.id === selectedId);
  const selectedTextBlock = textBlocks.find(t => t.id === selectedId);

  const handleCopy = useCallback(async () => {
    const json = JSON.stringify(getDescriptor(), null, 2);
    await navigator.clipboard.writeText(json);
  }, [getDescriptor]);

  return (
    <div className="flex flex-col gap-3 p-3 bg-surface rounded border border-line text-main" style={{ width: 220, fontSize: 12 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">Text Wrap</span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-0.5 rounded border border-line hover:bg-surface-secondary"
          title="Copy layout descriptor JSON"
        >
          Copy
        </button>
      </div>

      {/* Selection indicator */}
      {selectedId ? (
        <div className="text-xs text-muted">
          Selected: <span className="font-mono text-main">{selectedId}</span>
        </div>
      ) : (
        <div className="text-xs text-muted italic">
          Select an element to inspect
        </div>
      )}

      {/* Element-specific panel */}
      {selectedObstacle && (
        <ObstaclePanel
          obstacle={selectedObstacle}
          onUpdate={patch => updateObstacle(selectedId!, patch)}
        />
      )}

      {selectedColumn && (
        <ColumnPanel
          column={selectedColumn}
          onUpdate={patch => updateColumn(selectedId!, patch)}
        />
      )}

      {selectedTextBlock && (
        <TextBlockPanel
          block={selectedTextBlock}
          onUpdate={patch => updateTextBlock(selectedId!, patch)}
        />
      )}

      {/* Element list for quick selection */}
      <div className="border-t border-line pt-2 mt-1">
        <span className="text-xs text-muted mb-1 block">Elements</span>
        <div className="flex flex-col gap-0.5">
          {obstacles.map(o => (
            <button
              key={o.id}
              onClick={() => surface.select(o.id)}
              className={`text-left text-xs px-1 py-0.5 rounded ${o.id === selectedId ? 'bg-accent text-accent-inv' : 'hover:bg-surface-secondary'}`}
            >
              {o.id} <span className="text-muted">({'contour' in o ? o.contour : (o as { type: string }).type})</span>
            </button>
          ))}
          {columns.map(c => (
            <button
              key={c.id}
              onClick={() => surface.select(c.id)}
              className={`text-left text-xs px-1 py-0.5 rounded ${c.id === selectedId ? 'bg-accent text-accent-inv' : 'hover:bg-surface-secondary'}`}
            >
              {c.id} <span className="text-muted">(column)</span>
            </button>
          ))}
          {textBlocks.map(t => (
            <button
              key={t.id}
              onClick={() => surface.select(t.id)}
              className={`text-left text-xs px-1 py-0.5 rounded ${t.id === selectedId ? 'bg-accent text-accent-inv' : 'hover:bg-surface-secondary'}`}
            >
              {t.id} <span className="text-muted">(text)</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Update barrel exports**

Add to `packages/controls/src/pretext/index.ts`:

```ts
export { PretextInspector } from './PretextInspector';
```

**Step 5: Run tests**

```bash
pnpm --filter @rdna/controls exec vitest run test/pretext/PretextInspector.test.tsx
```

Expected: all 3 tests PASS.

**Step 6: Commit**

```bash
git add packages/controls/src/pretext/PretextInspector.tsx packages/controls/test/pretext/PretextInspector.test.tsx packages/controls/src/pretext/index.ts
git commit -m "feat(pretext): add PretextInspector panel component"
```

---

### Task 3: GoodNewsApp Integration — Wire Up `usePretextSurface`

This is the first consumer integration. We wire the existing GoodNewsApp to use `usePretextSurface` and render the `PretextInspector`.

**Files:**
- Modify: `apps/rad-os/components/apps/GoodNewsApp.tsx`

**Step 1: Add imports**

At the top of GoodNewsApp.tsx, add:

```tsx
import { usePretextSurface, PretextInspector, DomOverlay } from '@rdna/controls/pretext';
```

Note: `DomOverlay` is exported from `@rdna/controls/overlay` — update the import path if the barrel doesn't re-export it from the pretext subpath. You may need:

```tsx
import { DomOverlay } from '@rdna/controls/overlay';
```

**Step 2: Register the surface inside GoodNewsApp**

After the existing state declarations (`obs`, `hull`, etc.), add the surface registration:

```tsx
const surface = usePretextSurface({
  columns: [
    { id: 'left', x: margin, width: lW - 8 },
    { id: 'center', x: margin + lW + ruleW + 8, width: cW - 16 },
    { id: 'right', x: margin + lW + ruleW + cW + ruleW + 8, width: rW - 8 },
  ],
  obstacles: [
    {
      id: 'logo',
      contour: 'polygon' as const,
      hull: hull ?? [],
      bounds: { x: obs.x, y: obs.y, width: obs.w, height: obs.h },
      wrap: 'both' as const,
      offsets: { top: OBS_V_PAD, right: OBS_H_PAD, bottom: OBS_V_PAD, left: OBS_H_PAD },
    },
    {
      id: 'dropcap',
      type: 'dropcap' as const,
      character: 'G',
      font: DROP_CAP_FONT,
      lineCount: 3,
    },
  ],
  textBlocks: [
    { id: 'body', font: BODY_FONT, lineHeight: BODY_LH },
  ],
  onLayoutChange: (descriptor) => {
    // For now, log to console. The copy button in the inspector handles export.
    console.log('[pretext-inspector] layout changed', descriptor);
  },
});
```

**Step 3: Render the inspector panel**

Inside the return JSX, after the document flow `<div>`, add:

```tsx
{/* Pretext Layout Inspector */}
<div className="absolute top-2 right-2" style={{ zIndex: 100 }}>
  <PretextInspector surface={surface} />
</div>
```

**Step 4: Test manually**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-editor
pnpm dev
```

Open `localhost:3000`, launch GoodNewsApp. Verify:
- Inspector panel appears in the top-right corner
- Element list shows "logo (polygon)", "dropcap (dropcap)", "body (text)"
- Clicking an element shows its settings
- Changing a value logs to console

**Step 5: Commit**

```bash
git add apps/rad-os/components/apps/GoodNewsApp.tsx
git commit -m "feat(rad-os): integrate PretextInspector into GoodNewsApp"
```

---

### Task 4: Wire Inspector Changes Back to Layout

Currently the `onLayoutChange` callback just logs. This task wires inspector changes (wrap side, offsets, circle params) back into the actual `computeLayout` function so text reflows live.

**Files:**
- Modify: `apps/rad-os/components/apps/GoodNewsApp.tsx`

**Step 1: Replace hardcoded obstacle parameters with surface state**

In the `useEffect` that calls `computeLayout`, read obstacle settings from `surface` instead of the hardcoded constants:

```tsx
useEffect(() => {
  if (typeof window === 'undefined') return;
  document.fonts.ready.then(() => {
    // Read current obstacle settings from the surface
    const logoObs = surface.obstacles.find(o => o.id === 'logo');
    const currentOffsets = logoObs && 'offsets' in logoObs && logoObs.offsets
      ? logoObs.offsets
      : { top: OBS_V_PAD, right: OBS_H_PAD, bottom: OBS_V_PAD, left: OBS_H_PAD };

    // ... pass currentOffsets into computeLayout
  });
}, [containerWidth, obs, hull, surface.obstacles]);
```

**Step 2: Parameterize `computeLayout` to accept offsets**

Update the `computeLayout` function signature to accept obstacle offsets as a parameter instead of using the hardcoded `OBS_H_PAD` / `OBS_V_PAD` constants.

**Step 3: Test manually**

Open GoodNewsApp, select the logo obstacle, change the offsets in the inspector. Verify text reflows live.

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/GoodNewsApp.tsx
git commit -m "feat(rad-os): wire inspector changes to live pretext reflow"
```

---

### Task 5: JSON Export Button

The "Copy" button in the inspector header already exists from Task 2. This task verifies it works end-to-end and adds a visual confirmation toast.

**Step 1: Test the copy button manually**

Open GoodNewsApp, click "Copy" in the inspector. Paste into a text editor. Verify the JSON includes columns, obstacles with current settings, and text blocks.

**Step 2: Add a brief visual feedback state**

In `PretextInspector.tsx`, add a `copied` state that shows "Copied!" for 1.5s after clicking Copy:

```tsx
const [copied, setCopied] = useState(false);

const handleCopy = useCallback(async () => {
  const json = JSON.stringify(getDescriptor(), null, 2);
  await navigator.clipboard.writeText(json);
  setCopied(true);
  setTimeout(() => setCopied(false), 1500);
}, [getDescriptor]);

// In the JSX:
<button ...>
  {copied ? 'Copied!' : 'Copy'}
</button>
```

**Step 3: Commit**

```bash
git add packages/controls/src/pretext/PretextInspector.tsx
git commit -m "feat(pretext): add copy confirmation to inspector"
```

---

### Task 6: Final Frontend Smoke Test

**Step 1: Write barrel test**

Create `packages/controls/test/pretext/frontend-smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('@rdna/controls/pretext frontend exports', () => {
  it('exports PretextInspector', async () => {
    const mod = await import('../../src/pretext/index');
    expect(typeof mod.PretextInspector).toBe('function');
  });

  it('exports usePretextSurface', async () => {
    const mod = await import('../../src/pretext/index');
    expect(typeof mod.usePretextSurface).toBe('function');
  });

  it('exports buildDescriptor', async () => {
    const mod = await import('../../src/pretext/index');
    expect(typeof mod.buildDescriptor).toBe('function');
  });
});
```

**Step 2: Run all tests**

```bash
pnpm --filter @rdna/controls exec vitest run
```

Expected: all tests PASS.

**Step 3: Commit**

```bash
git add packages/controls/test/pretext/frontend-smoke.test.ts
git commit -m "test(pretext): add frontend barrel smoke test"
```

---

## Summary

After all 6 tasks, the frontend provides:

| Component | What |
|---|---|
| `DomOverlay` | Shared hover-highlight + click-select overlay (reusable across all `@rdna/controls`) |
| `PretextInspector` | InDesign-style Text Wrap panel: wrap side, offsets, contour type, circle/dropcap/pullquote fields, element list, copy button |
| GoodNewsApp integration | First consumer: `usePretextSurface` registration, inspector panel, live reflow on setting changes |

## Future Tasks (not in this plan)

| Phase | What |
|---|---|
| P2 | Undo/redo via Zustand temporal middleware on surface state |
| P2 | Replace native HTML controls with `@rdna/controls` primitives (Select, TextInput, etc.) when available |
| P2 | Pretext-aware Claude skill that reads the JSON descriptor and writes/edits `computeLayout()` |
| P3 | Column edge dragging (direct manipulation of column widths in the layout) |
| P3 | Dock/detach integration with AppWindow chrome (CD-player pattern from controls brainstorm) |
