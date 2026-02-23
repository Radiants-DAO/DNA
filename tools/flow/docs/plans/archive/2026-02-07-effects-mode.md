# Effects Mode — Implementation Plan

> **Status: COMPLETE** — `effectsTool.ts` (733 lines) + `effectsTool.css` implemented and wired into content.ts as design sub-mode 4. Controls opacity, blend mode, box-shadow, backdrop-filter, and filter.

**Goal:** Replace the Shadow sub-mode (Design → 6) with an Effects mode — a floating popover (same pattern as the Color picker) that controls blend mode, opacity, box-shadow, backdrop-filter, and filter on the selected element.

**Architecture:** Tool factory pattern matching `colorTool.ts` — `createEffectsTool({ shadowRoot, engine, onUpdate }) → { attach, detach, destroy }`. Renders inside the overlay shadow DOM at z-index 10 (above the event interceptor). Reads current computed values on attach, applies changes via `engine.applyStyle()`. Also removes blend mode from the color picker (it belongs here).

**Tech Stack:** TypeScript, CSS (inline via `?inline` import), unified mutation engine, existing `parseBoxShadow`/`stringifyBoxShadow` from `packages/extension/src/panel/components/designer/boxShadowParser.ts`.

---

## Context & File Map

### Existing files to reference

| File | Purpose |
|------|---------|
| `packages/extension/src/content/modes/tools/colorTool.ts` | Pattern to follow — tool factory, DOM building, popover positioning, keyboard shortcuts |
| `packages/extension/src/content/modes/tools/colorTool.css` | Dark card styling to replicate |
| `packages/extension/src/content/modes/tools/colorTokens.ts` | Helper module pattern (separate from tool) |
| `packages/extension/src/panel/components/designer/boxShadowParser.ts` | `parseBoxShadow()` and `stringifyBoxShadow()` — already tested, 15 passing tests |
| `packages/shared/src/types/modes.ts` | `DesignSubMode` union type + `DESIGN_SUB_MODES` config array |
| `packages/extension/src/entrypoints/content.ts` | Where tools are imported, instantiated, and wired to mode system |
| `packages/extension/src/content/mutations/unifiedMutationEngine.ts` | `applyStyle(el, changes: Record<string, string>): MutationDiff \| null` |

### Files to create

| File | Purpose |
|------|---------|
| `packages/extension/src/content/modes/tools/effectsTool.ts` | Tool factory |
| `packages/extension/src/content/modes/tools/effectsTool.css` | Popover styles |

### Files to modify

| File | Change |
|------|--------|
| `packages/shared/src/types/modes.ts` | Rename `shadow` → `effects` in union + config |
| `packages/extension/src/entrypoints/content.ts` | Wire effects tool (same pattern as color tool) |
| `packages/extension/src/content/modes/tools/colorTool.ts` | Remove blend mode dropdown + related state |
| `packages/extension/src/content/modes/tools/colorTool.css` | Remove `.flow-color-blend` styles |
| `packages/extension/src/content/__tests__/modeController.test.ts` | Update `shadow` → `effects` in sub-mode cycle test |

---

## Popover Layout

```
┌──────────────────────────────────┐
│  Opacity          [====●===] 80% │  ← horizontal slider
├──────────────────────────────────┤
│  Blend Mode       [ multiply ▾ ] │  ← dropdown
├──────────────────────────────────┤
│  BOX SHADOW                      │
│  ┌──────────┐ ┌──────────┐      │
│  │ X   [=●=]│ │ Y   [=●=]│      │  ← offset sliders
│  └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐      │
│  │ Blur [●==]│ │ Spr [=●=]│      │  ← blur + spread
│  └──────────┘ └──────────┘      │
│  Color [■ #000]  □ Inset         │  ← color swatch + inset toggle
├──────────────────────────────────┤
│  BACKDROP FILTER                 │
│  Blur       [====●=========] 4px │
│  Brightness [========●=====] 100%│
│  Contrast   [========●=====] 100%│
│  Saturate   [========●=====] 100%│
├──────────────────────────────────┤
│  FILTER                          │
│  Blur       [●=============] 0px │
│  Brightness [========●=====] 100%│
│  Contrast   [========●=====] 100%│
│  Grayscale  [●=============]  0% │
│  Sepia      [●=============]  0% │
│  Hue Rotate [●=============]  0° │
│  Invert     [●=============]  0% │
│  Saturate   [========●=====] 100%│
└──────────────────────────────────┘
```

Width: 280px. Sections are collapsible (click header to toggle). Only sections with non-default values are expanded on attach.

---

## CSS Properties Controlled

| Section | CSS Property | Default | Range |
|---------|-------------|---------|-------|
| Opacity | `opacity` | `1` | 0–1 (displayed as 0–100%) |
| Blend | `mix-blend-mode` | `normal` | enum (16 modes) |
| Box Shadow X | `box-shadow` (offsetX) | `0` | -50px to 50px |
| Box Shadow Y | `box-shadow` (offsetY) | `0` | -50px to 50px |
| Box Shadow Blur | `box-shadow` (blur) | `0` | 0 to 100px |
| Box Shadow Spread | `box-shadow` (spread) | `0` | -50px to 50px |
| Box Shadow Color | `box-shadow` (color) | `rgba(0,0,0,0.25)` | any color |
| Box Shadow Inset | `box-shadow` (inset) | `false` | boolean |
| Backdrop Blur | `backdrop-filter` | `none` | 0–50px |
| Backdrop Brightness | `backdrop-filter` | `1` | 0–2 (0–200%) |
| Backdrop Contrast | `backdrop-filter` | `1` | 0–2 (0–200%) |
| Backdrop Saturate | `backdrop-filter` | `1` | 0–2 (0–200%) |
| Filter Blur | `filter` | `none` | 0–50px |
| Filter Brightness | `filter` | `1` | 0–2 (0–200%) |
| Filter Contrast | `filter` | `1` | 0–2 (0–200%) |
| Filter Grayscale | `filter` | `0` | 0–1 (0–100%) |
| Filter Sepia | `filter` | `0` | 0–1 (0–100%) |
| Filter Hue Rotate | `filter` | `0deg` | 0–360deg |
| Filter Invert | `filter` | `0` | 0–1 (0–100%) |
| Filter Saturate | `filter` | `1` | 0–2 (0–200%) |

---

## Task 1: Rename `shadow` → `effects` in shared types

**Files:**
- Modify: `packages/shared/src/types/modes.ts:35` (union type) and `:188-194` (config)
- Modify: `packages/extension/src/content/__tests__/modeController.test.ts:106`

**Step 1: Update the DesignSubMode union**

In `packages/shared/src/types/modes.ts`, change:
```typescript
// Before
  | 'shadow'        // 6 - Arrow keys for shadow params

// After
  | 'effects'       // 6 - Visual effects (blend, shadow, filters)
```

**Step 2: Update the DESIGN_SUB_MODES config**

In the same file, change the shadow entry:
```typescript
// Before
  {
    id: 'shadow',
    key: '6',
    label: 'Shadow',
    icon: 'square',
    tooltip: 'Arrow keys for shadow params',
    panelSection: 'BoxShadowsSection',
  },

// After
  {
    id: 'effects',
    key: '6',
    label: 'Effects',
    icon: 'sparkles',
    tooltip: 'Blend, shadow, filters',
    panelSection: 'BoxShadowsSection',
  },
```

**Step 3: Update modeController test**

In `packages/extension/src/content/__tests__/modeController.test.ts`, change:
```typescript
// Before
        'position', 'spacing', 'flex', 'move', 'color',
        'shadow', 'typography', 'guides', 'accessibility',

// After
        'position', 'spacing', 'flex', 'move', 'color',
        'effects', 'typography', 'guides', 'accessibility',
```

**Step 4: Typecheck**

Run: `pnpm --filter @flow/shared exec tsc --noEmit && pnpm --filter @flow/extension typecheck`
Expected: Pass (no other code references `'shadow'` as a sub-mode ID yet)

**Step 5: Run tests**

Run: `pnpm --filter @flow/extension test`
Expected: 320 tests pass

**Step 6: Commit**

```bash
git add packages/shared/src/types/modes.ts packages/extension/src/content/__tests__/modeController.test.ts
git commit -m "refactor: rename shadow sub-mode to effects"
```

---

## Task 2: Remove blend mode from color picker

**Files:**
- Modify: `packages/extension/src/content/modes/tools/colorTool.ts`
- Modify: `packages/extension/src/content/modes/tools/colorTool.css`
- Modify: `packages/extension/src/content/modes/tools/colorTokens.ts` (remove BLEND_MODES export)

**Step 1: Remove blend mode DOM + state from colorTool.ts**

Remove the following:
- State variable: `let currentBlendMode = 'normal'`
- Import: `BLEND_MODES` from `./colorTokens`
- DOM block: the `blendRow` creation (blendRow, blendLabel, blendSelect, event listener, container.appendChild(blendRow)) — approximately lines 103–120
- The `applyBlendMode()` function (lines ~381–384)
- In `attach()`: the two lines reading/setting `currentBlendMode` and `blendSelect.value`

**Step 2: Remove blend CSS from colorTool.css**

Delete the entire `.flow-color-blend` block and its children (`.flow-color-blend label`, `.flow-color-blend select`, `.flow-color-blend select:focus`).

**Step 3: Move BLEND_MODES to a shared location**

Move the `BLEND_MODES` constant from `colorTokens.ts` to a new location that both color tool and effects tool can import. The simplest approach: leave it in `colorTokens.ts` for now (effects tool will import it from there). No change needed.

**Step 4: Typecheck + test**

Run: `pnpm --filter @flow/extension typecheck && pnpm --filter @flow/extension test`
Expected: Pass

**Step 5: Commit**

```bash
git add packages/extension/src/content/modes/tools/colorTool.ts packages/extension/src/content/modes/tools/colorTool.css
git commit -m "refactor: remove blend mode from color picker (moving to effects)"
```

---

## Task 3: Create `effectsTool.css`

**Files:**
- Create: `packages/extension/src/content/modes/tools/effectsTool.css`

**Step 1: Write the stylesheet**

Follow the same dark card pattern as `colorTool.css`. Key classes:

```css
/* ── Effects Tool — Floating Popover ── */

.flow-effects {
  position: fixed;
  width: 280px;
  max-height: 80vh;
  overflow-y: auto;
  background: rgba(23, 23, 23, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(63, 63, 70, 0.6);
  border-radius: 10px;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', monospace;
  font-size: 11px;
  color: #e4e4e7;
  pointer-events: auto;
  user-select: none;
  z-index: 10;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

/* Scrollbar styling (match toolbar aesthetic) */
.flow-effects::-webkit-scrollbar { width: 4px; }
.flow-effects::-webkit-scrollbar-track { background: transparent; }
.flow-effects::-webkit-scrollbar-thumb { background: rgba(63, 63, 70, 0.6); border-radius: 2px; }

/* ── Section Headers (collapsible) ── */
.flow-fx-section { margin-bottom: 8px; }
.flow-fx-section:last-child { margin-bottom: 0; }

.flow-fx-header {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 0; cursor: pointer;
  font-size: 9px; font-weight: 600;
  color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;
}
.flow-fx-header:hover { color: #a1a1aa; }
.flow-fx-header .flow-fx-chevron {
  transition: transform 0.15s ease-out;
  font-size: 8px;
}
.flow-fx-section.collapsed .flow-fx-chevron { transform: rotate(-90deg); }
.flow-fx-section.collapsed .flow-fx-body { display: none; }

.flow-fx-body { padding: 4px 0; }

/* ── Slider Row ── */
.flow-fx-row {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 6px;
}
.flow-fx-row:last-child { margin-bottom: 0; }

.flow-fx-label {
  width: 56px; flex-shrink: 0;
  font-size: 10px; color: #a1a1aa;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.flow-fx-slider {
  flex: 1; height: 4px;
  appearance: none; -webkit-appearance: none;
  background: rgba(63, 63, 70, 0.6);
  border-radius: 2px; outline: none; cursor: pointer;
}
.flow-fx-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px; height: 12px; border-radius: 50%;
  background: #e4e4e7; border: 2px solid #2563eb; cursor: pointer;
}

.flow-fx-value {
  width: 36px; flex-shrink: 0;
  font-size: 9px; color: #a1a1aa;
  text-align: right; font-variant-numeric: tabular-nums;
}

/* ── Dropdown ── */
.flow-fx-select {
  flex: 1;
  background: rgba(39, 39, 42, 0.8);
  border: 1px solid rgba(63, 63, 70, 0.5);
  border-radius: 4px;
  color: #e4e4e7; font-size: 10px; font-family: inherit;
  padding: 3px 4px; cursor: pointer; outline: none;
}
.flow-fx-select:focus { border-color: #2563eb; }

/* ── Inset Toggle ── */
.flow-fx-toggle {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; color: #a1a1aa; cursor: pointer;
}
.flow-fx-toggle input[type="checkbox"] {
  accent-color: #2563eb;
}

/* ── Shadow Color Swatch ── */
.flow-fx-swatch {
  width: 20px; height: 20px; border-radius: 4px;
  border: 1px solid rgba(63, 63, 70, 0.5);
  cursor: pointer; flex-shrink: 0;
}
```

**Step 2: Commit**

```bash
git add packages/extension/src/content/modes/tools/effectsTool.css
git commit -m "feat: add effects tool popover styles"
```

---

## Task 4: Create `effectsTool.ts`

**Files:**
- Create: `packages/extension/src/content/modes/tools/effectsTool.ts`

This is the largest task. The tool follows the exact same factory pattern as `colorTool.ts`.

**Step 1: Write the tool**

```typescript
/**
 * Effects Tool — Design Sub-Mode 6
 *
 * Floating popover controlling visual effects on the selected element:
 * - Opacity (element-level)
 * - Blend mode (mix-blend-mode)
 * - Box shadow (parsed via boxShadowParser)
 * - Backdrop filter (blur, brightness, contrast, saturate)
 * - Filter (blur, brightness, contrast, grayscale, sepia, hue-rotate, invert, saturate)
 *
 * Sections are collapsible. Only sections with non-default values expand on attach.
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import { parseBoxShadow, stringifyBoxShadow } from '../../../panel/components/designer/boxShadowParser'
import { BLEND_MODES } from './colorTokens'
import styles from './effectsTool.css?inline'
```

Key implementation details:

**State shape:**
```typescript
interface EffectsState {
  opacity: number           // 0–100
  blendMode: string         // mix-blend-mode value
  shadow: { offsetX: number; offsetY: number; blur: number; spread: number; color: string; inset: boolean }
  backdrop: { blur: number; brightness: number; contrast: number; saturate: number }
  filter: { blur: number; brightness: number; contrast: number; grayscale: number; sepia: number; hueRotate: number; invert: number; saturate: number }
}
```

**DOM structure** — build imperatively (same as colorTool.ts):
1. Opacity row: label + horizontal slider + value display
2. Blend mode row: label + `<select>` dropdown
3. Box Shadow section (collapsible): 4 sliders (X, Y, blur, spread) + color swatch + inset checkbox
4. Backdrop Filter section (collapsible): 4 sliders (blur, brightness, contrast, saturate)
5. Filter section (collapsible): 8 sliders

**Helper functions to implement:**

```typescript
// Build a filter/backdrop-filter CSS string from individual values
function buildFilterString(values: Record<string, number>, defaults: Record<string, number>): string {
  const parts: string[] = []
  for (const [fn, val] of Object.entries(values)) {
    if (val === defaults[fn]) continue  // skip defaults
    switch (fn) {
      case 'blur': parts.push(`blur(${val}px)`); break
      case 'hueRotate': parts.push(`hue-rotate(${val}deg)`); break
      case 'brightness': case 'contrast': case 'saturate':
        parts.push(`${fn}(${val})`); break
      case 'grayscale': case 'sepia': case 'invert':
        parts.push(`${fn}(${val})`); break
    }
  }
  return parts.length > 0 ? parts.join(' ') : 'none'
}

// Parse a filter/backdrop-filter CSS string into individual values
function parseFilterString(css: string, defaults: Record<string, number>): Record<string, number> {
  const result = { ...defaults }
  const regex = /([\w-]+)\(([^)]+)\)/g
  let match
  while ((match = regex.exec(css)) !== null) {
    const [, fn, val] = match
    const num = parseFloat(val)
    if (fn === 'hue-rotate') result.hueRotate = num
    else if (fn in result) result[fn] = num
  }
  return result
}
```

**Section collapse logic:**
- On `attach()`, read computed values. Compare to defaults.
- If a section has all-default values, add `collapsed` class to its container.
- Click on section header toggles `collapsed` class.

**Slider creation helper** (to avoid repeating DOM code 16 times):
```typescript
function createSliderRow(
  parent: HTMLElement,
  label: string,
  min: number, max: number, step: number, initial: number,
  unit: string,
  onChange: (value: number) => void,
): { slider: HTMLInputElement; valueEl: HTMLSpanElement } {
  const row = document.createElement('div')
  row.className = 'flow-fx-row'

  const lbl = document.createElement('span')
  lbl.className = 'flow-fx-label'
  lbl.textContent = label
  row.appendChild(lbl)

  const slider = document.createElement('input')
  slider.type = 'range'
  slider.className = 'flow-fx-slider'
  slider.min = String(min)
  slider.max = String(max)
  slider.step = String(step)
  slider.value = String(initial)
  row.appendChild(slider)

  const valueEl = document.createElement('span')
  valueEl.className = 'flow-fx-value'
  valueEl.textContent = `${initial}${unit}`
  row.appendChild(valueEl)

  slider.addEventListener('input', () => {
    const v = Number(slider.value)
    valueEl.textContent = `${Math.round(v * 100) / 100}${unit}`
    onChange(v)
  })

  parent.appendChild(row)
  return { slider, valueEl }
}
```

**Popover positioning:** Identical to `colorTool.ts` — position below-right of element, flip if near viewport edge, clamp to viewport with 8px margin. Re-position on scroll/resize.

**Public API:** Same as colorTool — `{ attach(el), detach(), destroy() }`.

**Step 2: Commit**

```bash
git add packages/extension/src/content/modes/tools/effectsTool.ts
git commit -m "feat: add effects tool with blend, shadow, and filter controls"
```

---

## Task 5: Wire effects tool into content script

**Files:**
- Modify: `packages/extension/src/entrypoints/content.ts`

Follow the exact same pattern as the color tool wiring.

**Step 1: Import**

```typescript
import { createEffectsTool } from '../content/modes/tools/effectsTool';
```

**Step 2: Instantiate** (right after the colorTool creation block)

```typescript
const effectsTool = createEffectsTool({
  shadowRoot: overlayRoot,
  engine: unifiedMutationEngine,
  onUpdate: () => {
    port.postMessage({ type: 'mutation:updated', payload: null });
  },
});

let effectsToolAttached = false;
```

**Step 3: Add to mode subscription**

Extend the existing `cleanupToolWiring` subscriber to also handle `'effects'`:

```typescript
const cleanupToolWiring = modeController.subscribe((state) => {
  // Color tool
  if (state.topLevel === 'design' && state.designSubMode === 'color' && selectedElement) {
    if (!colorToolAttached) {
      colorTool.attach(selectedElement as HTMLElement);
      colorToolAttached = true;
    }
  } else if (colorToolAttached) {
    colorTool.detach();
    colorToolAttached = false;
  }

  // Effects tool
  if (state.topLevel === 'design' && state.designSubMode === 'effects' && selectedElement) {
    if (!effectsToolAttached) {
      effectsTool.attach(selectedElement as HTMLElement);
      effectsToolAttached = true;
    }
  } else if (effectsToolAttached) {
    effectsTool.detach();
    effectsToolAttached = false;
  }
});
```

**Step 4: Add to click handler**

In the `onClick` handler, after the color tool block:

```typescript
if (currentState.topLevel === 'design' && currentState.designSubMode === 'effects') {
  effectsTool.detach();
  effectsTool.attach(el as HTMLElement);
  effectsToolAttached = true;
}
```

**Step 5: Add to cleanup**

In the disconnect handler, add:
```typescript
effectsTool.destroy();
```

**Step 6: Typecheck + test + build**

Run: `pnpm --filter @flow/extension typecheck && pnpm --filter @flow/extension test && pnpm --filter @flow/extension build`
Expected: All pass

**Step 7: Commit**

```bash
git add packages/extension/src/entrypoints/content.ts
git commit -m "feat: wire effects tool to mode system"
```

---

## Task 6: Manual verification

1. `pnpm --filter @flow/extension build`
2. Load extension on a page with CSS (Monolith hackathon app works well)
3. Press `D` → sub-mode bar should show **"Effects"** at position 6
4. Press `6` to enter Effects mode
5. Click an element — effects popover appears near it
6. **Opacity slider**: drags smoothly, element opacity changes in real time
7. **Blend mode dropdown**: selecting a mode applies `mix-blend-mode`
8. **Box shadow**: adjust X/Y/blur/spread sliders — shadow updates live. Toggle inset.
9. **Backdrop filter**: blur slider adds background blur. Other sliders work.
10. **Filter**: blur slider blurs the element. Grayscale, sepia, hue-rotate all work.
11. **Section collapse**: click headers to collapse/expand. Sections with all-default values start collapsed.
12. **Color picker** (`D → 5`): blend mode dropdown is gone. Only tabs + palette + alpha slider remain.
13. **Scroll/resize**: popover repositions when viewport changes.
14. **Undo**: `Ctrl+Z` in the panel reverts the last change.

---

## Appendix: Filter Defaults

```typescript
const BACKDROP_DEFAULTS = { blur: 0, brightness: 1, contrast: 1, saturate: 1 }
const FILTER_DEFAULTS = { blur: 0, brightness: 1, contrast: 1, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, saturate: 1 }
```

These are used for:
- Determining which sections start collapsed (all defaults → collapsed)
- Building the CSS string (skip default values to keep it clean)
- Resetting individual properties
