# Merged Layout Panel Implementation Plan

> **Status: COMPLETE** — `spacingTool.ts` deleted (commit 681c8d1), spacing sub-mode removed, modes renumbered 1-7 (commit 91c73fb). `layoutTool.ts` (2,298 lines) is the merged panel with display, alignment, flex/grid, gap, and spacing sections. `spacingScale.ts` provides scale utilities.

**Goal:** Merge the Spacing and Layout design sub-modes into a single "Layout" panel with Figma-inspired spacing inputs, direction-aware alignment hotkeys, and on-element drag handles.

**Architecture:** Delete `spacingTool.ts/css`. Rewrite `layoutTool.ts/css` from scratch as the merged panel. Update the shared `DESIGN_SUB_MODES` config (remove `'spacing'`, renumber 1–7). Rewire `content.ts` to drop the spacing tool. The new panel has 6 sections stacked vertically: header → display tabs → alignment (flex/grid) → flex/grid-specific controls → gap → spacing (margin/padding).

**Tech Stack:** TypeScript (content script), CSS custom properties (`--flow-*` from `toolTheme.css`), `computeToolPanelPosition` for placement, `UnifiedMutationEngine` for mutations, `@flow/shared` for mode types.

**Brainstorm:** `docs/brainstorms/2026-02-20-merged-layout-panel-brainstorm.md`

---

## Task 1: Remove `'spacing'` from mode system and renumber

This task is purely config/types — no UI changes yet. The spacing tool will temporarily break (it references `'spacing'` as its mode ID), which is fine because Task 2 deletes it.

**Files:**
- Modify: `packages/shared/src/types/modes.ts`
- Modify: `packages/extension/src/content/modes/modeController.ts`
- Modify: `packages/extension/src/entrypoints/content.ts`

**Step 1: Update `DesignSubMode` union and `DESIGN_SUB_MODES` array**

In `packages/shared/src/types/modes.ts`:

Remove `'spacing'` from the `DesignSubMode` type union. Renumber the remaining entries:

```ts
export type DesignSubMode =
  | 'layout'        // 1 - Display, flex/grid, spacing, alignment
  | 'color'         // 2 - Semantic color picker
  | 'typography'    // 3 - Arrow keys for font properties
  | 'effects'       // 4 - Visual effects (blend, shadow, filters)
  | 'position'      // 5 - Position, offsets, z-index
  | 'guides'        // 6 - Click-to-anchor measurements
  | 'accessibility' // 7 - WCAG audit
```

Update `DESIGN_SUB_MODES` array — remove the spacing entry entirely, renumber keys:

```ts
export const DESIGN_SUB_MODES: readonly DesignSubModeConfig[] = [
  {
    id: 'layout',
    key: '1',
    label: 'Layout',
    icon: 'layout-grid',
    tooltip: 'Display, flex/grid, spacing, alignment',
    panelSection: 'LayoutSection',
  },
  {
    id: 'color',
    key: '2',
    label: 'Color',
    icon: 'palette',
    tooltip: 'Semantic color picker',
    panelSection: 'ColorsSection',
  },
  {
    id: 'typography',
    key: '3',
    label: 'Typography',
    icon: 'type',
    tooltip: 'Arrow keys for font properties',
    panelSection: 'TypographySection',
  },
  {
    id: 'effects',
    key: '4',
    label: 'Effects',
    icon: 'sparkles',
    tooltip: 'Blend, shadow, filters',
    panelSection: 'BoxShadowsSection',
  },
  {
    id: 'position',
    key: '5',
    label: 'Position',
    icon: 'move',
    tooltip: 'Position, offsets, z-index',
    panelSection: 'PositionSection',
  },
  {
    id: 'guides',
    key: '6',
    label: 'Guides',
    icon: 'ruler',
    tooltip: 'Click-to-anchor measurements',
    panelSection: null,
  },
  {
    id: 'accessibility',
    key: '7',
    label: 'Accessibility',
    icon: 'accessibility',
    tooltip: 'WCAG audit',
    panelSection: 'AccessibilityPanel',
  },
] as const
```

**Step 2: Update modeController default**

In `packages/extension/src/content/modes/modeController.ts`, the fallback is already `'layout'` (changed in a previous session). Verify the comment on line ~55 says `'layout'` not `'spacing'` or `'position'`. If stale, fix it.

**Step 3: Remove spacingTool from content.ts**

In `packages/extension/src/entrypoints/content.ts`:

- Remove the import: `import { createSpacingTool } from '../content/modes/tools/spacingTool'`
- Remove the instantiation: `const spacingTool = createSpacingTool({ ... })`
- Remove `let spacingToolAttached = false`
- Remove the entire spacing tool attach/detach subscriber block (the `state.designSubMode === 'spacing'` conditional)
- Remove `spacingTool.destroy()` from the disconnect cleanup
- Confirm the layout tool's attach condition uses `designSubMode === 'layout'` (it already should)

**Step 4: Build and verify**

```bash
cd packages/extension && pnpm build
```

Expected: Build succeeds. The panel toolbar now shows 7 sub-modes (Layout through Accessibility, numbered 1–7). Spacing tool is gone — selecting an element in design mode defaults to the layout panel.

**Step 5: Commit**

```
feat: remove spacing sub-mode, renumber design modes 1-7

Spacing functionality will be absorbed into the Layout panel
in the next task. This commit removes the spacing entry from
DESIGN_SUB_MODES, deletes the spacing tool wiring from
content.ts, and renumbers remaining modes.
```

---

## Task 2: Delete spacingTool files

**Files:**
- Delete: `packages/extension/src/content/modes/tools/spacingTool.ts`
- Delete: `packages/extension/src/content/modes/tools/spacingTool.css`

**Step 1: Delete both files**

```bash
rm packages/extension/src/content/modes/tools/spacingTool.ts
rm packages/extension/src/content/modes/tools/spacingTool.css
```

**Step 2: Build and verify**

```bash
cd packages/extension && pnpm build
```

Expected: Clean build. No remaining imports of `spacingTool`.

**Step 3: Commit**

```
chore: delete spacingTool.ts and spacingTool.css

Functionality will be rebuilt inside the merged layoutTool.
```

---

## Task 3: Extract shared spacing utilities into `spacingScale.ts`

Before rewriting the layout tool, extract reusable spacing logic from the deleted spacingTool into a small utility file. This keeps the layout tool focused on UI.

**Files:**
- Create: `packages/extension/src/content/modes/tools/spacingScale.ts`

**Step 1: Create the file**

Extract from the old spacingTool:
- `TAILWIND_SPACING` array (22 stops)
- `findNearestTwIndex(px)` — find closest TW scale position
- `stepTailwind(currentPx, direction, large)` — step up/down in the scale
- `pxToDisplayValue(px)` — convert px to TW label if exact match

```ts
/**
 * Tailwind Spacing Scale utilities.
 *
 * Shared between the Layout tool panel inputs and the on-element drag handles.
 * Provides snapping to the Tailwind spacing scale with optional raw-px mode.
 */

export const TAILWIND_SPACING: { label: string; px: number }[] = [
  { label: '0', px: 0 },
  { label: 'px', px: 1 },
  { label: '0.5', px: 2 },
  { label: '1', px: 4 },
  { label: '1.5', px: 6 },
  { label: '2', px: 8 },
  { label: '2.5', px: 10 },
  { label: '3', px: 12 },
  { label: '3.5', px: 14 },
  { label: '4', px: 16 },
  { label: '5', px: 20 },
  { label: '6', px: 24 },
  { label: '7', px: 28 },
  { label: '8', px: 32 },
  { label: '9', px: 36 },
  { label: '10', px: 40 },
  { label: '11', px: 44 },
  { label: '12', px: 48 },
  { label: '14', px: 56 },
  { label: '16', px: 64 },
  { label: '20', px: 80 },
  { label: '24', px: 96 },
]

const TW_PX_VALUES = TAILWIND_SPACING.map(s => s.px)

export function findNearestTwIndex(px: number): number {
  let closest = 0
  let minDiff = Infinity
  for (let i = 0; i < TW_PX_VALUES.length; i++) {
    const diff = Math.abs(TW_PX_VALUES[i] - px)
    if (diff < minDiff) {
      minDiff = diff
      closest = i
    }
  }
  return closest
}

export function stepTailwind(currentPx: number, direction: 1 | -1, large: boolean): number {
  const idx = findNearestTwIndex(currentPx)
  const step = large ? 3 : 1
  const nextIdx = Math.max(0, Math.min(TW_PX_VALUES.length - 1, idx + direction * step))
  return TW_PX_VALUES[nextIdx]
}

export function pxToDisplayValue(px: number): string {
  const match = TAILWIND_SPACING.find(s => s.px === px)
  return match ? match.label : String(Math.round(px))
}
```

**Step 2: Build and verify**

```bash
cd packages/extension && pnpm build
```

**Step 3: Commit**

```
refactor: extract Tailwind spacing scale into spacingScale.ts
```

---

## Task 4: Extract scrub label utility into `scrubLabel.ts`

The `attachScrub` function is duplicated in effectsTool and typographyTool. Extract once for reuse.

**Files:**
- Create: `packages/extension/src/content/modes/tools/scrubLabel.ts`

**Step 1: Create the file**

```ts
/**
 * Scrub Label — drag on a label element to adjust a numeric value.
 *
 * Default mode: steps through Tailwind spacing scale.
 * Alt+drag: raw px mode (linear sensitivity).
 */

export interface ScrubOptions {
  labelEl: HTMLElement
  getValue: () => number
  setValue: (v: number) => void
  min: number
  max: number
  step: number
}

export function attachScrub(opts: ScrubOptions): void {
  const { labelEl, getValue, setValue, min, max, step } = opts
  let startX = 0
  let startVal = 0
  let isScrubbing = false

  function onPointerDown(e: PointerEvent) {
    startX = e.clientX
    startVal = getValue()
    isScrubbing = true
    labelEl.classList.add('scrubbing')
    labelEl.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: PointerEvent) {
    if (!isScrubbing) return
    const dx = e.clientX - startX
    const range = max - min
    const sensitivity = range / 200
    const raw = startVal + dx * sensitivity
    const clamped = Math.max(min, Math.min(max, raw))
    const stepped = Math.round(clamped / step) * step
    setValue(stepped)
  }

  function onPointerUp() {
    isScrubbing = false
    labelEl.classList.remove('scrubbing')
  }

  labelEl.addEventListener('pointerdown', onPointerDown)
  labelEl.addEventListener('pointermove', onPointerMove)
  labelEl.addEventListener('pointerup', onPointerUp)
  labelEl.addEventListener('pointercancel', onPointerUp)
}
```

**Step 2: Build and verify**

```bash
cd packages/extension && pnpm build
```

**Step 3: Commit**

```
refactor: extract scrub label utility into scrubLabel.ts
```

---

## Task 5: Rewrite layoutTool — scaffold and display section

This is the main rewrite. We'll build it incrementally across Tasks 5–9. Start with the container, header, and display mode selector.

**Files:**
- Rewrite: `packages/extension/src/content/modes/tools/layoutTool.ts`
- Rewrite: `packages/extension/src/content/modes/tools/layoutTool.css`

**Step 1: Write the new layoutTool.ts scaffold**

Delete all existing content and start fresh. The new file structure:

```ts
/**
 * Layout Tool — Design Sub-Mode 1
 *
 * Merged panel covering display mode, flex/grid controls, alignment,
 * gap, and spacing (margin + padding). Figma-inspired compact layout.
 *
 * Sections (top to bottom):
 * 1. Panel header (shared sub-mode switcher)
 * 2. Display mode icon tabs (flex-row, flex-col, grid, block) + overflow dropdown
 * 3. Alignment section (3x3 dot grid + X/Y dropdowns) — flex/grid only
 * 4. Flex-specific: wrap dropdown
 * 5. Grid-specific: cols/rows spinners, grid alignment
 * 6. Gap input(s) with lock toggle
 * 7. Spacing section: margin/padding tab, H/V or 4-side inputs, box-sizing
 *
 * Keyboard:
 * - Arrow keys navigate the 3x3 alignment grid (direction-aware)
 * - Shift+arrow cycles distribute/stretch values
 * - Cmd+↑↓ toggles flex-direction
 * - All arrows disabled when a panel input is focused
 *
 * On-element overlay:
 * - 4 padding drag handles (default), Alt switches to margin
 * - Drag modifiers: Shift=all sides, Alt=opposing pair
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import { parseValueWithUnit } from './unitInput'
import { createToolPanelHeader } from './toolPanelHeader'
import { computeToolPanelPosition } from './toolPanelPosition'
import { stepTailwind, findNearestTwIndex, pxToDisplayValue, TAILWIND_SPACING } from './spacingScale'
import { attachScrub } from './scrubLabel'
import { shouldIgnoreKeyboardShortcut } from '../../features/keyboardGuards'
import styles from './layoutTool.css?inline'

// ── Types ──

type DisplayType = 'block' | 'flex' | 'grid' | 'none'
type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse'
type Edge = 'top' | 'right' | 'bottom' | 'left'
type SpacingType = 'margin' | 'padding'

export interface LayoutToolOptions {
  shadowRoot: ShadowRoot
  engine: UnifiedMutationEngine
  onUpdate?: () => void
}

export interface LayoutTool {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
}

// ── Constants ──

const EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'] as const
const DISPLAY_TABS: DisplayType[] = ['block', 'flex', 'grid', 'none']

const JUSTIFY_VALUES = [
  'flex-start', 'center', 'flex-end',
  'space-between', 'space-around', 'space-evenly',
] as const

const ALIGN_VALUES = [
  'stretch', 'flex-start', 'center', 'flex-end', 'baseline',
] as const

const FLEX_DIRECTIONS: FlexDirection[] = ['row', 'column', 'row-reverse', 'column-reverse']
const WRAP_OPTIONS: FlexWrap[] = ['nowrap', 'wrap', 'wrap-reverse']

// ... (display icons, direction icons — port from old layoutTool)

export function createLayoutTool(options: LayoutToolOptions): LayoutTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null

  // ── Display state ──
  let currentDisplay: DisplayType = 'block'
  let currentInline = false
  let currentDirection: FlexDirection = 'row'
  let currentWrap: FlexWrap = 'nowrap'
  let currentJustify = 'flex-start'
  let currentAlign = 'stretch'
  let currentGap = 0
  let currentGapUnit = 'px'
  let gapLocked = true

  // ── Grid state ──
  let currentGridCols = 2
  let currentGridRows = 2

  // ── Spacing state ──
  let activeSpacingType: SpacingType = 'padding'
  let spacingExpanded = false // false = H/V mode, true = 4-side mode

  // ── Inject styles ──
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Build DOM ──
  const container = document.createElement('div')
  container.className = 'flow-layout'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // Section 1: Panel header
  const toolHeader = createToolPanelHeader({ shadowRoot, currentModeId: 'layout' })
  container.appendChild(toolHeader.header)

  // Section 2: Display mode tabs — BUILD IN THIS TASK
  // Section 3: Alignment — Task 6
  // Section 4: Flex controls — Task 6
  // Section 5: Grid controls — Task 6
  // Section 6: Gap — Task 6
  // Section 7: Spacing — Task 7

  // ... (display tabs, built here — port the icon tabs from the brainstorm)
  // ... (placeholder for remaining sections)

  // ══════════════════════════════════════════════════════════
  // POSITIONING
  // ══════════════════════════════════════════════════════════

  function positionNearElement() {
    if (!target) return
    const pos = computeToolPanelPosition(target, 260, container.offsetHeight || 500)
    container.style.left = `${pos.left}px`
    container.style.top = `${pos.top}px`
  }

  function onScrollOrResize() { positionNearElement() }

  // ══════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════

  return {
    attach(element: HTMLElement) {
      target = element
      // readFromElement(element) — will be built across tasks
      container.style.display = ''
      positionNearElement()
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      container.style.display = 'none'
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },

    destroy() {
      target = null
      toolHeader.destroy()
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      container.remove()
      styleEl.remove()
    },
  }
}
```

Build the display mode icon tabs in this task — the row of icon buttons for flex-row, flex-col, grid, block, plus the overflow dropdown for inline variants. Port the display-switching logic (`setDisplayType`, `applyInlineDisplay`, `readFromElement` for display) from the old layoutTool.

**Step 2: Write the base layoutTool.css**

Start with the container, scrollbar, and display row styles. Port the `.flow-layout` container styles from the old CSS, plus the display tabs and overflow dropdown styles.

**Step 3: Build and verify**

```bash
cd packages/extension && pnpm build
```

Load in Chrome — selecting an element in design mode should show the layout panel with display tabs. Clicking tabs should change the display property.

**Step 4: Commit**

```
feat(layout): scaffold merged layout panel with display tabs

Replaces the old layout-only tool with the merged panel scaffold.
Display mode icon tabs (flex-row, flex-col, grid, block) with
overflow dropdown for inline variants.
```

---

## Task 6: Alignment section + flex/grid controls + gap

**Files:**
- Modify: `packages/extension/src/content/modes/tools/layoutTool.ts`
- Modify: `packages/extension/src/content/modes/tools/layoutTool.css`

**Step 1: Build the alignment 3x3 dot grid**

Port the alignment grid from the old layoutTool: 3 animated bars + 9 clickable dots. The `updateAlignPreview()`, `distributeOnAxis()`, `alignOnCross()`, `updateDotHighlights()` functions transfer directly.

Key change from old behavior: dot click now **moves the active dot position** rather than immediately applying. The visual highlight shows current position. Clicking a dot sets both `justify-content` and `align-items` in one go.

**Step 2: Build X/Y alignment dropdowns**

Port `justifySelect` and `alignSelect` with the `rebuildDropdowns()` logic that swaps semantics based on `isRowDirection()`.

**Step 3: Build flex controls (direction + wrap)**

Direction is now embedded in the display icon tabs (flex-row and flex-col are separate tabs), but keep the wrap dropdown. Port `setWrap()` and wrap dropdown toggle logic.

**Step 4: Build grid controls (cols/rows spinners)**

Port `createSpinner()`, `gridColsInput`, `gridRowsInput`, `commitGrid()`.

**Step 5: Build gap input**

Port gap slider + text input + unit label + lock toggle. When unlocked, show `row-gap` and `column-gap` as two separate inputs.

**Step 6: Add keyboard handler for alignment grid**

New hotkey scheme (replaces old layout keyboard handler entirely):

```ts
function onKeyDown(e: KeyboardEvent) {
  if (!target) return
  if (currentDisplay !== 'flex') return
  if (shouldIgnoreKeyboardShortcut(e)) return

  const isArrow = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)
  if (!isArrow) return

  e.preventDefault()
  e.stopPropagation()

  const isRow = isRowDirection()
  const meta = e.metaKey || e.ctrlKey

  if (meta) {
    // Cmd+↑↓ = toggle flex-direction (row ↔ column)
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      setDirection(currentDirection === 'column' ? 'row' : 'column')
    }
    return
  }

  if (e.shiftKey) {
    // Shift+horizontal = cycle distribute (space-between → around → evenly)
    // Shift+vertical = cycle stretch/baseline
    const isHorizontal = e.key === 'ArrowLeft' || e.key === 'ArrowRight'
    const isMainAxis = isRow ? isHorizontal : !isHorizontal

    if (isMainAxis) {
      // Cycle justify distribute values
      const distributeValues = ['space-between', 'space-around', 'space-evenly']
      const idx = distributeValues.indexOf(currentJustify)
      const next = distributeValues[(idx + 1) % distributeValues.length]
      setJustify(next)
    } else {
      // Cycle cross-axis special values: stretch ↔ baseline
      const crossSpecial = ['stretch', 'baseline']
      const idx = crossSpecial.indexOf(currentAlign)
      const next = crossSpecial[(idx + 1) % crossSpecial.length]
      setAlignItems(next)
    }
    return
  }

  // Plain arrows: navigate the 3x3 positional grid
  // Direction-aware: in row mode ←→ = justify, ↑↓ = align
  //                  in col mode ↑↓ = justify, ←→ = align
  const positional = ['flex-start', 'center', 'flex-end']
  const isHorizontal = e.key === 'ArrowLeft' || e.key === 'ArrowRight'
  const isForward = e.key === 'ArrowRight' || e.key === 'ArrowDown'
  const isMainAxis = isRow ? isHorizontal : !isHorizontal

  if (isMainAxis) {
    const idx = positional.indexOf(currentJustify)
    if (idx === -1) { setJustify('flex-start'); return }
    const next = isForward
      ? positional[Math.min(idx + 1, 2)]
      : positional[Math.max(idx - 1, 0)]
    setJustify(next)
  } else {
    const idx = positional.indexOf(currentAlign)
    if (idx === -1) { setAlignItems('flex-start'); return }
    const next = isForward
      ? positional[Math.min(idx + 1, 2)]
      : positional[Math.max(idx - 1, 0)]
    setAlignItems(next)
  }
}
```

Register on `document` in `attach()`, remove in `detach()`/`destroy()`.

**Step 7: Add CSS for all new sections**

Add styles for the alignment grid, direction row, wrap dropdown, grid spinners, gap row to layoutTool.css. Port relevant classes from the old file, keeping the `.flow-layout-*` prefix.

**Step 8: Build and verify**

```bash
cd packages/extension && pnpm build
```

Test: select an element, switch to flex → verify alignment grid works, arrow keys navigate it, Shift cycles distribute, Cmd toggles direction. Switch to grid → verify spinners work.

**Step 9: Commit**

```
feat(layout): alignment grid, flex/grid controls, gap, direction-aware hotkeys

3x3 dot grid for flex alignment with direction-aware arrow keys.
Shift+arrow cycles distribute/stretch. Cmd+arrow toggles direction.
Grid section with cols/rows spinners. Gap with lock toggle.
```

---

## Task 7: Spacing section (margin/padding inputs)

**Files:**
- Modify: `packages/extension/src/content/modes/tools/layoutTool.ts`
- Modify: `packages/extension/src/content/modes/tools/layoutTool.css`

**Step 1: Build the margin/padding tab switcher**

Two small tab buttons at the top of the spacing section: "Padding" (default) and "Margin". Clicking toggles `activeSpacingType` state variable. All inputs below reflect the active type.

**Step 2: Build 2-input (H/V) mode**

Default view: two inputs side by side.
- Left input: horizontal value (left+right) with horizontal box-model icon
- Right input: vertical value (top+bottom) with vertical box-model icon
- Right-side button: 4-sides expand icon

Each input:
- SVG icon prefix (box-model icon showing which axis)
- Text input for the value
- Scrub label on the icon (drag to adjust via TW scale, Alt+drag for raw px)
- ArrowUp/Down in focused input steps through TW scale

When linked (H/V mode), committing a value applies it to both edges of that axis:
```ts
// Horizontal commit: applies to both left and right
engine.applyStyle(target, {
  [`${activeSpacingType}-left`]: value,
  [`${activeSpacingType}-right`]: value,
})
```

**Step 3: Build 4-input expanded mode**

Clicking the 4-sides icon sets `spacingExpanded = true`. Now show 4 inputs in a 2×2 arrangement:
- Row 1: left input (with left-side icon), right input (with right-side icon)
- Row 2: top input (with top-side icon), bottom input (with bottom-side icon)

Each input has its own scrub label and independent commit. Clicking the 4-sides icon again collapses back to H/V.

**Step 4: Build box-sizing toggle**

Below the inputs: a small row with content-box / border-box toggle buttons, same as old spacingTool.

**Step 5: Wire `readFromElement` for spacing**

Read computed margin/padding values. In H/V mode, show the horizontal value (if left === right, show the value; if different, show "Mixed"). Same for vertical.

**Step 6: Add CSS for spacing section**

New classes:
- `.flow-layout-spacing` — section container
- `.flow-layout-spacing-tabs` — margin/padding tab row
- `.flow-layout-spacing-tab` — individual tab
- `.flow-layout-spacing-row` — H/V input row
- `.flow-layout-spacing-input` — individual input with icon prefix
- `.flow-layout-spacing-expand-btn` — the 4-sides toggle
- `.flow-layout-spacing-grid` — 4-input expanded layout
- `.flow-layout-box-sizing` — box-sizing row

**Step 7: Build and verify**

```bash
cd packages/extension && pnpm build
```

Test: select an element → Layout panel shows margin/padding section at bottom. Tab switches between margin and padding. H/V inputs work. Expand to 4-side works. Values read from element on attach.

**Step 8: Commit**

```
feat(layout): Figma-style spacing inputs (margin/padding H/V + 4-side expand)

Tab switcher for margin vs padding. Default 2-input H/V mode with
box-model icons and scrub labels. Expand to 4-side mode. TW scale
stepping in inputs, Alt+drag for raw px.
```

---

## Task 8: On-element drag handles

Port the overlay drag handles from the old spacingTool into the merged layout panel.

**Files:**
- Modify: `packages/extension/src/content/modes/tools/layoutTool.ts`
- Modify: `packages/extension/src/content/modes/tools/layoutTool.css`

**Step 1: Build the overlay container and 4 handles**

Create the overlay div (full-viewport, `pointer-events: none`) and 4 drag handle divs (one per edge). Initially create them as **padding handles** (green). The handle type switches to **margin** (amber) while Alt is held — controlled by a keydown/keyup listener.

```ts
// Overlay setup
const overlay = document.createElement('div')
overlay.className = 'flow-layout-overlay'
overlay.style.display = 'none'
shadowRoot.appendChild(overlay)

const handles = new Map<Edge, HTMLDivElement>()
for (const edge of EDGES) {
  const handle = document.createElement('div')
  handle.className = 'flow-layout-handle'
  handle.dataset.edge = edge
  handle.dataset.type = 'padding' // default
  const isVertical = edge === 'top' || edge === 'bottom'
  handle.style.cursor = isVertical ? 'ns-resize' : 'ew-resize'
  handles.set(edge, handle)
  overlay.appendChild(handle)
}

// Alt key toggles handle type
let handleType: SpacingType = 'padding'
function onAltKeyDown(e: KeyboardEvent) {
  if (e.key === 'Alt') {
    handleType = 'margin'
    for (const h of handles.values()) h.dataset.type = 'margin'
  }
}
function onAltKeyUp(e: KeyboardEvent) {
  if (e.key === 'Alt') {
    handleType = 'padding'
    for (const h of handles.values()) h.dataset.type = 'padding'
  }
}
```

**Step 2: Port `setupDragHandler` from old spacingTool**

The drag logic is identical to the old spacingTool's `setupDragHandler`. Key behaviors:
- 3px drag threshold before initiating
- During drag: direct DOM manipulation for preview, then `engine.applyStyle()` on mouseup
- Shift modifier during drag = all 4 sides
- Alt modifier during drag = opposing edge pair
- Click-through on non-drag (re-dispatches click to underlying element)

**Step 3: Port handle positioning**

`positionHandles()` reads computed margin/padding from the target and positions each handle. Uses the same `positionMarginHandle` / `positionPaddingHandle` geometry from old spacingTool, but only positions handles for the **active type** (padding or margin based on `handleType`).

**Step 4: Add value label on hover/drag**

Port the floating pill label that shows `padding-top: 8` during drag.

**Step 5: Add overlay CSS**

Port `.flow-sp-overlay`, `.flow-sp-handle`, `.flow-sp-value-label` styles from old spacingTool.css, renaming to `.flow-layout-overlay`, `.flow-layout-handle`, `.flow-layout-value-label`. Keep the amber (margin) and green (padding) color coding.

**Step 6: Wire into attach/detach/destroy**

In `attach()`: show overlay, position handles, add Alt key listeners.
In `detach()`: hide overlay, remove listeners.
In `destroy()`: remove overlay element, remove listeners.

**Step 7: Build and verify**

```bash
cd packages/extension && pnpm build
```

Test: select an element → 4 green handles appear on edges. Drag a handle → padding changes. Hold Alt → handles turn amber → drag adjusts margin. Shift during drag → all sides.

**Step 8: Commit**

```
feat(layout): on-element drag handles for padding (Alt=margin)

4 edge handles shown on selected element. Green=padding (default),
amber=margin (Alt held). Drag modifiers: Shift=all sides,
Alt=opposing pair. Value label pill on hover/drag.
```

---

## Task 9: Polish and integration test

**Files:**
- Modify: `packages/extension/src/content/modes/tools/layoutTool.ts` (minor)
- Modify: `packages/extension/src/content/modes/tools/layoutTool.css` (minor)

**Step 1: Wire full `readFromElement`**

Ensure `readFromElement(el)` reads ALL state:
- Display type + inline flag
- Flex: direction, wrap, justify, align, gap
- Grid: cols, rows, gap
- Spacing: all 8 margin/padding values
- Box-sizing

And updates all UI elements accordingly.

**Step 2: Verify panel re-attaches on element switch**

Click element A → panel shows A's layout. Click element B → panel refreshes to B's values. Switch from flex to grid → correct section shows.

**Step 3: Verify keyboard guards**

Focus a spacing input → press arrow keys → value steps (NOT alignment grid). Blur the input → press arrow keys → alignment grid navigates.

**Step 4: Verify sub-mode header**

Panel header shows "1  Layout". Click chevron → dropdown shows 7 sub-modes, numbered 1–7. Click "2  Color" → switches to color tool.

**Step 5: Final build**

```bash
cd packages/extension && pnpm build
```

**Step 6: Commit**

```
feat(layout): merged layout panel — integration polish

Full readFromElement wiring, keyboard guard verification,
sub-mode header integration.
```

---

## Summary of file changes

| Action | File |
|--------|------|
| Modify | `packages/shared/src/types/modes.ts` — remove `'spacing'`, renumber |
| Modify | `packages/extension/src/content/modes/modeController.ts` — default `'layout'` |
| Modify | `packages/extension/src/entrypoints/content.ts` — remove spacing tool wiring |
| Delete | `packages/extension/src/content/modes/tools/spacingTool.ts` |
| Delete | `packages/extension/src/content/modes/tools/spacingTool.css` |
| Create | `packages/extension/src/content/modes/tools/spacingScale.ts` |
| Create | `packages/extension/src/content/modes/tools/scrubLabel.ts` |
| Rewrite | `packages/extension/src/content/modes/tools/layoutTool.ts` |
| Rewrite | `packages/extension/src/content/modes/tools/layoutTool.css` |
