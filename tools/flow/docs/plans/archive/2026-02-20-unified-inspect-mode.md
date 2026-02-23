# Unified Inspect Mode Implementation Plan

> **Status: COMPLETE** — Merged via `worktree-unified-inspect-mode` branch (commit 6532c79, 2026-02-23). All 8 tasks implemented.

**Goal:** Replace the dead `inspector` mode and standalone `asset` mode with a single **Inspect mode** (`I` hotkey) that has a VisBug-style hover tooltip, a tabbed click panel (Assets | Styles | A11y), and auto-measurement lines between selected and hovered elements.

**Architecture:** New top-level mode `'inspect'` registered in the shared mode system, replacing both `'inspector'` and `'asset'`. Two overlay components in the content script's shadow DOM: (1) a lightweight hover tooltip (`createInspectTooltip`) that reads computed styles synchronously on mousemove, and (2) the existing asset panel refactored into a three-tab inspect panel (`createInspectPanel`). Ruler measurements use the existing `computeMeasurements` + overlay functions, triggered automatically when a selected element exists and the user hovers another.

**Tech Stack:** TypeScript, Shadow DOM (vanilla JS), CSS `?inline` imports, existing `extractGroupedStyles`, `accessibility.ts` WCAG utils, `computeMeasurements` + `distanceOverlay`.

**Brainstorm:** `docs/brainstorms/2026-02-20-unified-inspect-mode-brainstorm.md`

**Note (session context):** The `assetTool.ts`, `assetScanner.ts`, and `assetTool.css` were built earlier in this session and are fully functional. The asset tool's tab system, keyboard navigation, positioning, copy/download, and rich previews all carry forward. The `extractGroupedStyles` function returns 9 categories of `StyleEntry[]` (property + value). The accessibility utils (`getContrastRatio`, `meetsWcagAA/AAA`) are in `content/features/accessibility.ts`. The measurement functions (`computeMeasurements`, `createDistanceOverlay`, `createMeasurementLine`) are in `content/measurements/`. The content script already handles `panel:accessibility` messages in `panelRouter.ts` — we can reuse that handler's logic directly.

---

## Task 1: Register `'inspect'` Mode, Remove `'inspector'` and `'asset'`

**Files:**
- Modify: `packages/shared/src/types/modes.ts`
- Modify: `packages/extension/src/content/ui/toolbar.ts`
- Modify: `packages/extension/src/entrypoints/content.ts`

**Step 1: Replace `'inspector'` and `'asset'` with `'inspect'` in the type union**

In `packages/shared/src/types/modes.ts`, replace:

```ts
  | 'inspector'   // Hover for computed CSS tooltip
  | 'editText'    // Click to edit text content in-place
  | 'asset'       // Inspect images, SVGs, fonts, CSS variables
```

With:

```ts
  | 'inspect'     // Hover tooltip + click panel (assets, styles, a11y, ruler)
  | 'editText'    // Click to edit text content in-place
```

**Step 2: Replace both `ModeConfig` entries with one `'inspect'` entry**

Remove the `inspector` and `asset` config objects from `TOP_LEVEL_MODES`. Add a single entry (place it where `inspector` was — before `editText`):

```ts
{
  id: 'inspect',
  hotkey: 'i',
  label: 'Inspect',
  interceptsEvents: true,
  showsHoverOverlay: true,
},
```

**Step 3: Replace both toolbar buttons with one**

In `packages/extension/src/content/ui/toolbar.ts`, remove the `inspector` and `asset` entries from `MODES`. Add one entry where `inspector` was:

```ts
{
  id: 'inspect',
  label: 'Inspect',
  shortcut: 'I',
  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
},
```

(Reuses the existing inspector eye icon.)

**Step 4: Update content.ts — remove asset tool wiring, replace `'asset'` references with `'inspect'`**

In `packages/extension/src/entrypoints/content.ts`:

1. Remove the `import { createAssetTool }` line.
2. Remove the `const assetTool = createAssetTool(...)` creation.
3. Remove `let assetToolAttached = false`.
4. In the `modeController.subscribe` callback, remove the `// Asset tool` block (`if (state.topLevel === 'asset' ...)`).
5. In the `onClick` handler, remove the `if (currentState.topLevel === 'asset')` block.
6. In the disconnect cleanup, remove `assetTool.destroy()`.

(We'll wire the new inspect tool in Task 7.)

**Step 5: Fix any remaining `'inspector'` or `'asset'` string references**

Search the codebase for literal strings `'inspector'` and `'asset'` in mode-related contexts and update to `'inspect'`.

**Step 6: Typecheck**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
```

Expected: type errors from removed `'inspector'` | `'asset'` usage — fix any remaining references.

**Step 7: Build and verify**

```bash
pnpm build
```

Reload extension. Press `I` — toolbar should highlight the Inspect button. `A` should no longer activate any mode. The old inspector and asset toolbar buttons should be gone.

**Step 8: Commit**

```
feat: register 'inspect' mode, remove 'inspector' and 'asset'
```

---

## Task 2: Hover Tooltip — CSS + JS

**Files:**
- Create: `packages/extension/src/content/modes/tools/inspectTooltip.css`
- Create: `packages/extension/src/content/modes/tools/inspectTooltip.ts`

**Step 1: Write the tooltip CSS**

```css
.flow-inspect-tip {
  position: fixed;
  min-width: 200px;
  max-width: 320px;
  background: var(--flow-panel-bg, rgba(20, 20, 20, 0.95));
  backdrop-filter: blur(12px);
  border: 1px solid var(--flow-panel-border, rgba(255,255,255,0.1));
  border-radius: 8px;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 11px;
  color: var(--flow-tool-text, #e5e5e5);
  pointer-events: none;
  user-select: none;
  z-index: 9;
  box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  display: none;
}

.flow-inspect-tip-header {
  padding: 6px 10px;
  font-weight: 600;
  font-size: 11px;
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flow-inspect-tip-dims {
  font-weight: 400;
  color: var(--flow-tool-text-dim, #888);
}

.flow-inspect-tip-styles {
  padding: 4px 10px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.flow-inspect-tip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 1px 0;
}

.flow-inspect-tip-prop {
  color: var(--flow-tool-text-dim, #999);
}

.flow-inspect-tip-val {
  font-weight: 500;
  text-align: right;
  display: flex;
  align-items: center;
  gap: 4px;
}

.flow-inspect-tip-swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  flex-shrink: 0;
}

.flow-inspect-tip-footer {
  padding: 4px 10px 6px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 10px;
  color: var(--flow-tool-text-dim, #888);
  display: flex;
  gap: 8px;
  align-items: center;
}

.flow-inspect-tip-badge {
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
}

.flow-inspect-tip-badge.pass {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.flow-inspect-tip-badge.fail {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}
```

**Step 2: Write the tooltip factory**

Create `inspectTooltip.ts`. The tooltip reads computed styles synchronously (no async — hover must be instant). Key properties shown: `display`, `background-color`, `color`, `font-size`, `padding`, `border-radius`. Color values get inline circle swatches. Footer shows WCAG contrast badge and ARIA role if present.

```ts
import { getContrastRatio, meetsWcagAA } from '../../features/accessibility'
import styles from './inspectTooltip.css?inline'

export interface InspectTooltipOptions {
  shadowRoot: ShadowRoot
}

export interface InspectTooltip {
  show: (element: Element, mouseX: number, mouseY: number) => void
  hide: () => void
  destroy: () => void
}

const TIP_PROPS = [
  'display',
  'background-color',
  'color',
  'font-size',
  'padding',
  'border-radius',
]

const COLOR_PROPS = new Set(['background-color', 'color'])

const SKIP_VALUES = new Set([
  'none', 'normal', 'auto', 'visible', '0px', 'static',
  'start', 'baseline', 'stretch', 'row', 'inline', 'block',
])

export function createInspectTooltip({ shadowRoot }: InspectTooltipOptions): InspectTooltip {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  const tip = document.createElement('div')
  tip.className = 'flow-inspect-tip'
  shadowRoot.appendChild(tip)

  function show(element: Element, mouseX: number, mouseY: number): void {
    const rect = element.getBoundingClientRect()
    const computed = getComputedStyle(element)
    const tag = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const cls = element.classList.length > 0 ? `.${element.classList[0]}` : ''
    const w = Math.round(rect.width)
    const h = Math.round(rect.height)

    // ── Header ──
    let html = `<div class="flow-inspect-tip-header">
      <span>${tag}${id}${cls}</span>
      <span class="flow-inspect-tip-dims">${w}×${h}</span>
    </div>`

    // ── Styles ──
    html += '<div class="flow-inspect-tip-styles">'
    for (const prop of TIP_PROPS) {
      const val = computed.getPropertyValue(prop).trim()
      if (!val || SKIP_VALUES.has(val)) continue
      const isColor = COLOR_PROPS.has(prop)
      const swatch = isColor
        ? `<span class="flow-inspect-tip-swatch" style="background:${val}"></span>`
        : ''
      // Shorten property name: strip common prefix
      const label = prop.replace('background-', 'bg-')
      html += `<div class="flow-inspect-tip-row">
        <span class="flow-inspect-tip-prop">${label}</span>
        <span class="flow-inspect-tip-val">${swatch}${val}</span>
      </div>`
    }
    html += '</div>'

    // ── Footer: contrast + ARIA ──
    const fgColor = computed.getPropertyValue('color').trim()
    const bgColor = computed.getPropertyValue('background-color').trim()
    const parts: string[] = []

    if (fgColor && bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      try {
        const ratio = getContrastRatio(fgColor, bgColor)
        const passes = meetsWcagAA(fgColor, bgColor)
        const cls = passes ? 'pass' : 'fail'
        const icon = passes ? '✓' : '✗'
        parts.push(`<span class="flow-inspect-tip-badge ${cls}">AA ${icon} ${ratio.toFixed(1)}:1</span>`)
      } catch { /* non-parseable colors */ }
    }

    const role = element.getAttribute('role')
    if (role) parts.push(`role=${role}`)

    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) parts.push(`"${ariaLabel.slice(0, 20)}"`)

    if (parts.length > 0) {
      html += `<div class="flow-inspect-tip-footer">${parts.join(' · ')}</div>`
    }

    tip.innerHTML = html
    tip.style.display = ''

    // ── Quadrant-aware positioning (VisBug pattern) ──
    const north = mouseY > window.innerHeight / 2
    const west = mouseX > window.innerWidth / 2
    const tipW = tip.offsetWidth
    const tipH = tip.offsetHeight

    tip.style.top = `${north ? mouseY - tipH - 16 : mouseY + 20}px`
    tip.style.left = `${west ? mouseX - tipW + 16 : mouseX - 16}px`
  }

  function hide(): void {
    tip.style.display = 'none'
  }

  function destroy(): void {
    tip.remove()
    styleEl.remove()
  }

  return { show, hide, destroy }
}
```

**Step 3: Typecheck**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
```

Verify the import of `getContrastRatio` and `meetsWcagAA` resolves correctly from `../../features/accessibility`.

**Step 4: Commit**

```
feat: add inspect hover tooltip with styles, contrast, and ARIA
```

---

## Task 3: Refactor Asset Panel → Inspect Panel with Top-Level Tabs

**Files:**
- Rename: `packages/extension/src/content/modes/tools/assetTool.ts` → `inspectPanel.ts`
- Rename: `packages/extension/src/content/modes/tools/assetTool.css` → `inspectPanel.css`
- Keep: `packages/extension/src/content/modes/tools/assetScanner.ts` (unchanged)

**Step 1: Rename files**

```bash
mv packages/extension/src/content/modes/tools/assetTool.ts packages/extension/src/content/modes/tools/inspectPanel.ts
mv packages/extension/src/content/modes/tools/assetTool.css packages/extension/src/content/modes/tools/inspectPanel.css
```

**Step 2: Add top-level tab bar to the panel**

The panel now has two tab levels:
- **Top-level:** Assets | Styles | A11y (three buttons)
- **Sub-level (Assets only):** Images | SVGs | Fonts | Colors | Variables (existing, hidden when empty)

Rename the factory function and types:

```ts
export interface InspectPanelOptions {
  shadowRoot: ShadowRoot
}

export interface InspectPanel {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
}

type TopTab = 'assets' | 'styles' | 'a11y'
```

Add a top-level tab bar DOM element above the existing sub-tab bar. The existing tab system (Images/SVGs/Fonts/Colors/Variables) becomes the `assets` top-tab content. The `styles` and `a11y` top-tabs will be wired in subsequent tasks (render placeholder "Coming soon" for now).

Update CSS import to `inspectPanel.css?inline`. Add CSS for the top-level tab bar:

```css
.flow-inspect-top-tabs {
  display: flex;
  border-bottom: 1px solid var(--flow-tool-border, rgba(255,255,255,0.08));
}

.flow-inspect-top-tab {
  flex: 1;
  padding: 7px 4px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  color: var(--flow-tool-text-dim, #999);
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.flow-inspect-top-tab:hover {
  color: var(--flow-tool-text, #e5e5e5);
}

.flow-inspect-top-tab.active {
  color: var(--flow-tool-accent, #3b82f6);
  border-bottom-color: var(--flow-tool-accent, #3b82f6);
}
```

**Step 3: Wire top-tab switching**

When top-tab is `'assets'` → show the existing sub-tab bar + asset list.
When top-tab is `'styles'` or `'a11y'` → hide sub-tab bar, show placeholder text in the list area.

**Step 4: Typecheck and build**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
pnpm build
```

**Step 5: Commit**

```
refactor: rename assetTool to inspectPanel, add top-level tab bar
```

---

## Task 4: Styles Tab

**Files:**
- Modify: `packages/extension/src/content/modes/tools/inspectPanel.ts`

**Step 1: Import `extractGroupedStyles`**

```ts
import { extractGroupedStyles } from '../../styleExtractor'
```

**Step 2: Implement `renderStyles()` function**

When `topTab === 'styles'` and a target element is set, call `extractGroupedStyles(target)` and render the 9 categories as collapsible sections. Each section header is the category name (Layout, Spacing, Size, Typography, Colors, Borders, Shadows, Effects, Animations). Each entry is a row: property name left, value right. Color values get an inline swatch (reuse `applySwatchStyles` pattern). Click any row to copy `property: value` to clipboard.

Categories with zero entries are hidden (same pattern as asset sub-tabs).

**Step 3: Add CSS for style rows**

```css
.flow-inspect-style-group {
  padding: 2px 0;
}

.flow-inspect-style-group-header {
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 600;
  color: var(--flow-tool-text-dim, #888);
  text-transform: capitalize;
}

.flow-inspect-style-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 10px;
  border-radius: 4px;
  cursor: pointer;
  gap: 12px;
}

.flow-inspect-style-row:hover {
  background: rgba(255,255,255,0.05);
}

.flow-inspect-style-prop {
  font-size: 10px;
  color: var(--flow-tool-text-dim, #999);
}

.flow-inspect-style-val {
  font-size: 10px;
  font-weight: 500;
  text-align: right;
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**Step 4: Typecheck and build**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
pnpm build
```

**Step 5: Commit**

```
feat: add Styles tab with grouped computed CSS
```

---

## Task 5: A11y Tab

**Files:**
- Modify: `packages/extension/src/content/modes/tools/inspectPanel.ts`

**Step 1: Import accessibility utilities**

```ts
import { getContrastRatio, meetsWcagAA, meetsWcagAAA } from '../../features/accessibility'
```

**Step 2: Implement `renderA11y()` function**

Three sections:

**Contrast:** Read `color` and `background-color` from `getComputedStyle(target)`. Compute ratio via `getContrastRatio`. Show fg/bg swatches (reuse `applySwatchStyles`), ratio number, AA/AAA pass/fail badges.

**ARIA:** Read all `aria-*` attributes from the element, plus `role`, `tabindex`, `title`, `alt`. Render as property-value pairs. If element has no ARIA attributes, show "No ARIA attributes".

**Issues:** Run basic checks inline:
- `<img>` without `alt` → error: "Missing alt text"
- `<button>` / `<a>` without accessible name (no text content, no aria-label) → error: "Missing accessible name"
- Contrast ratio below 4.5 → warning: "Contrast ratio below WCAG AA"

Render each issue as a colored row (red for errors, yellow for warnings).

**Step 3: Add CSS for a11y sections**

```css
.flow-inspect-a11y-section {
  padding: 4px 10px;
}

.flow-inspect-a11y-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--flow-tool-text-dim, #888);
  padding: 4px 0 2px;
}

.flow-inspect-a11y-contrast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.flow-inspect-a11y-ratio {
  font-size: 14px;
  font-weight: 700;
}

.flow-inspect-a11y-badge {
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
}

.flow-inspect-a11y-badge.pass {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.flow-inspect-a11y-badge.fail {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.flow-inspect-a11y-issue {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  margin: 2px 0;
}

.flow-inspect-a11y-issue.error {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.flow-inspect-a11y-issue.warning {
  background: rgba(234, 179, 8, 0.1);
  color: #facc15;
}
```

**Step 4: Typecheck and build**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
pnpm build
```

**Step 5: Commit**

```
feat: add A11y tab with contrast, ARIA, and violation checks
```

---

## Task 6: Ruler / Auto-Measurements

**Files:**
- Create: `packages/extension/src/content/modes/tools/inspectRuler.ts`
- Create: `packages/extension/src/content/modes/tools/inspectRuler.css`

**Step 1: Write the ruler module**

The ruler manages distance overlays between a selected (anchored) element and a hovered element. It uses the existing `computeMeasurements` and overlay functions.

```ts
import { computeMeasurements, type Measurement } from '../../measurements/measurements'
import { createDistanceOverlay, createMeasurementLine } from '../../measurements/distanceOverlay'
import styles from './inspectRuler.css?inline'

export interface InspectRulerOptions {
  shadowRoot: ShadowRoot
}

export interface InspectRuler {
  setAnchor: (element: Element) => void
  measureTo: (element: Element) => void
  clear: () => void
  destroy: () => void
}

export function createInspectRuler({ shadowRoot }: InspectRulerOptions): InspectRuler {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  const container = document.createElement('div')
  container.className = 'flow-inspect-ruler'
  shadowRoot.appendChild(container)

  let anchor: Element | null = null
  let overlays: HTMLElement[] = []

  function clearOverlays(): void {
    for (const el of overlays) el.remove()
    overlays = []
  }

  function renderMeasurements(measurements: Measurement[]): void {
    clearOverlays()
    for (const m of measurements) {
      if (m.d <= 0) continue
      const label = createDistanceOverlay(m)
      const line = createMeasurementLine(m)
      container.appendChild(label)
      container.appendChild(line)
      overlays.push(label, line)
    }
  }

  return {
    setAnchor(element: Element) {
      anchor = element
    },

    measureTo(element: Element) {
      if (!anchor || anchor === element) {
        clearOverlays()
        return
      }
      const a = anchor.getBoundingClientRect()
      const b = element.getBoundingClientRect()
      const measurements = computeMeasurements(a, b)
      renderMeasurements(measurements)
    },

    clear() {
      anchor = null
      clearOverlays()
    },

    destroy() {
      clearOverlays()
      container.remove()
      styleEl.remove()
    },
  }
}
```

**Step 2: Write ruler CSS**

```css
.flow-inspect-ruler {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 8;
}
```

The distance overlay and measurement line elements already use inline absolute positioning and `pointer-events: none`.

**Step 3: Typecheck**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
```

**Step 4: Commit**

```
feat: add inspect ruler with auto-measurement between elements
```

---

## Task 7: Wire Everything in Content Script

**Files:**
- Modify: `packages/extension/src/entrypoints/content.ts`

This is the integration task — wires the tooltip, panel, and ruler into the content script's mode system and event handlers.

**Step 1: Import the three new modules**

```ts
import { createInspectTooltip } from '../content/modes/tools/inspectTooltip'
import { createInspectPanel } from '../content/modes/tools/inspectPanel'
import { createInspectRuler } from '../content/modes/tools/inspectRuler'
```

**Step 2: Create instances (alongside other tools)**

```ts
const inspectTooltip = createInspectTooltip({ shadowRoot: overlayRoot })
const inspectPanel = createInspectPanel({ shadowRoot: overlayRoot })
const inspectRuler = createInspectRuler({ shadowRoot: overlayRoot })
let inspectPanelAttached = false
```

**Step 3: Wire tooltip on hover (in `onMouseMove`)**

Inside the existing `onMouseMove` handler, after the overlay update and before the port message, add tooltip logic:

```ts
// Show inspect tooltip on hover in inspect mode
if (modeController.getState().topLevel === 'inspect') {
  inspectTooltip.show(el, e.clientX, e.clientY)

  // Auto-ruler: if an element is selected, measure to hovered element
  if (selectedElement && el !== selectedElement) {
    inspectRuler.measureTo(el)
  }
} else {
  inspectTooltip.hide()
}
```

**Step 4: Hide tooltip on mouse leave**

In the `onMouseLeave` handler, add:

```ts
inspectTooltip.hide()
inspectRuler.clear()
```

Wait — the ruler should keep its anchor. Only clear the dynamic overlays, not the anchor. Actually, `measureTo` already clears when hovering the same element as the anchor. On mouse leave we should just clear the transient overlays:

```ts
inspectTooltip.hide()
// Ruler overlays cleared, but anchor preserved
inspectRuler.measureTo(null as any) // or add a hideLines() method
```

Better approach: add a `hideLines()` method to the ruler. For now, call `clearOverlays` by adding to the public API — or simply don't clear on mouseleave (the overlays will update on next hover). Simplest: just hide the tooltip on mouseleave, ruler will update naturally on next hover.

**Step 5: Wire panel on click**

In the `onClick` handler, after the selection message is sent, add:

```ts
if (currentState.topLevel === 'inspect') {
  inspectTooltip.hide()  // tooltip goes away on click
  if (!(el instanceof HTMLElement)) {
    console.warn('[Flow] Selected node is not an HTMLElement; skipping inspect panel attach.')
  } else {
    try {
      inspectPanel.detach()
      inspectPanel.attach(el)
      inspectPanelAttached = true
      inspectRuler.setAnchor(el)
    } catch (error) {
      console.error('[Flow] Failed to attach inspect panel:', error)
    }
  }
}
```

**Step 6: Wire detach on mode change**

In the `modeController.subscribe` callback, add:

```ts
// Inspect panel + ruler — top-level mode
if (state.topLevel === 'inspect' && selectedElement) {
  if (!inspectPanelAttached) {
    inspectPanel.attach(selectedElement as HTMLElement)
    inspectPanelAttached = true
    inspectRuler.setAnchor(selectedElement)
  }
} else if (inspectPanelAttached) {
  inspectPanel.detach()
  inspectPanelAttached = false
  inspectRuler.clear()
}

// Always hide tooltip when leaving inspect mode
if (state.topLevel !== 'inspect') {
  inspectTooltip.hide()
  inspectRuler.clear()
}
```

**Step 7: Add cleanup on disconnect**

In the disconnect cleanup catch block, add:

```ts
inspectTooltip.destroy()
inspectPanel.destroy()
inspectRuler.destroy()
```

**Step 8: Typecheck, build, and manual test**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
pnpm build
```

Manual test checklist:
- Press `I` → enters Inspect mode, toolbar highlights
- Hover an element → tooltip appears with tag, dims, styles, contrast badge
- Move to different elements → tooltip follows, updates instantly
- Click an element → tooltip disappears, panel appears with Assets tab
- Switch to Styles tab → grouped computed CSS shown
- Switch to A11y tab → contrast ratio, ARIA, issues shown
- With element selected, hover another → pink distance lines between them
- Shift+click another element → multi-select (inherited from existing system)
- Press `D` → leaves Inspect mode, tooltip + panel + ruler disappear
- Press `I` + click → panel reappears
- `A` key does nothing (old asset mode removed)

**Step 9: Commit**

```
feat: wire inspect tooltip, panel, and ruler into content script
```

---

## Task 8: Polish and Cleanup

**Files:**
- Modify: various files for edge cases

**Step 1: Remove stale asset mode references**

Search for any remaining references to the old `'asset'` mode in docs, tests, or comments and update them.

**Step 2: Remove `assetTool.ts` and `assetTool.css` if they still exist**

After the rename in Task 3, verify these files are gone. If the rename left stale imports elsewhere, fix them.

**Step 3: Hide tooltip when scrolling**

Add a passive scroll listener that hides the tooltip (it will reappear on next mousemove):

```ts
window.addEventListener('scroll', () => {
  if (modeController.getState().topLevel === 'inspect') {
    inspectTooltip.hide()
  }
}, { passive: true })
```

**Step 4: Keyboard navigation in the panel**

The existing arrow-key navigation (up/down items, left/right sub-tabs, Enter to copy) should continue working for the Assets tab. Extend left/right to also cycle top-level tabs when at the edges of the sub-tabs.

**Step 5: Build and final test**

```bash
pnpm build
```

**Step 6: Commit**

```
feat: inspect mode polish — cleanup, scroll hide, keyboard nav
```

---

## Files Summary

| File | Action |
|------|--------|
| `shared/src/types/modes.ts` | Replace `'inspector'` + `'asset'` with `'inspect'` |
| `extension/src/content/ui/toolbar.ts` | Replace two buttons with one |
| `extension/src/content/modes/tools/inspectTooltip.css` | **New** — hover tooltip styles |
| `extension/src/content/modes/tools/inspectTooltip.ts` | **New** — hover tooltip factory |
| `extension/src/content/modes/tools/inspectPanel.css` | **Renamed** from assetTool.css, add top-tab + styles + a11y CSS |
| `extension/src/content/modes/tools/inspectPanel.ts` | **Renamed** from assetTool.ts, add top-tabs + Styles + A11y rendering |
| `extension/src/content/modes/tools/inspectRuler.css` | **New** — ruler container |
| `extension/src/content/modes/tools/inspectRuler.ts` | **New** — auto-measurement between elements |
| `extension/src/content/modes/tools/assetScanner.ts` | **Unchanged** — reused by inspectPanel |
| `extension/src/entrypoints/content.ts` | Wire tooltip, panel, ruler; remove old asset/inspector wiring |

No changes needed to: `modeHotkeys.ts`, `eventInterceptor.ts`, panel components, or the measurement/distance modules. The mode system is data-driven for top-level modes.
