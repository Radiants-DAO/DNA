# Plan 2: VisBug Final Pass

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the remaining high-value VisBug features and wire existing stubs to real implementations, completing the content-script tool surface before the Side Panel migration (Plan 3).

**Architecture:** New features plug into the existing mode system (`modeController` + `modeHotkeys` + event interceptor). Copy/paste and keyboard traversal are global shortcuts registered alongside undo/redo in `content.ts`. The guides tool is a new design sub-mode (key `6`). Screenshot wiring routes through the background service worker to `screenshotService.ts` (CDP). BoxShadow hydration connects the existing parser to the existing section via `parseBoxShadow()`.

**Tech Stack:** TypeScript 5.8, Vitest, jsdom, WXT, Chrome Extension APIs (CDP)

**Depends on:** Plan 0 (baseline green). Can overlap Plan 1 (different files).

---

## Pre-flight

Verify baseline is green:

```bash
cd /Users/rivermassey/Desktop/dev/DNA/tools/flow
pnpm typecheck                              # 0 errors
pnpm --filter @flow/extension test --run    # 0 failures
pnpm --filter @flow/server test --run       # 0 failures
```

---

## Task 2.0: Copy/Paste Styles (Cmd+Alt+C / Cmd+Alt+V)

**Why:** Universally useful — copy computed styles from one element, paste to another. VisBug's most-used global shortcut.

**Files:**
- Create: `packages/extension/src/content/features/styleCopyPaste.ts`
- Create: `packages/extension/src/content/__tests__/styleCopyPaste.test.ts`
- Modify: `packages/extension/src/entrypoints/content.ts` (~10 lines)

### Step 1: Write the failing test

```typescript
// packages/extension/src/content/__tests__/styleCopyPaste.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { copyStyles, pasteStyles, getClipboardStyles } from '../features/styleCopyPaste'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

describe('styleCopyPaste', () => {
  let engine: UnifiedMutationEngine

  beforeEach(() => {
    engine = createUnifiedMutationEngine()
  })

  describe('copyStyles', () => {
    it('captures computed styles from element', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      el.style.backgroundColor = 'blue'
      el.style.fontSize = '16px'
      document.body.appendChild(el)

      copyStyles(el)
      const styles = getClipboardStyles()
      expect(styles).not.toBeNull()
      expect(styles!.length).toBeGreaterThan(0)
    })

    it('filters out default/empty values', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      document.body.appendChild(el)

      copyStyles(el)
      const styles = getClipboardStyles()!
      // Should not include props with empty or default values
      const emptyProps = styles.filter(s => !s.value || s.value === '')
      expect(emptyProps.length).toBe(0)
    })
  })

  describe('pasteStyles', () => {
    it('applies copied styles to target element via engine', () => {
      const source = document.createElement('div')
      source.style.color = 'red'
      source.style.fontSize = '20px'
      document.body.appendChild(source)

      const target = document.createElement('div')
      document.body.appendChild(target)

      copyStyles(source)
      pasteStyles(target, engine)

      const diffs = engine.getDiffs()
      expect(diffs.length).toBe(1)
      expect(diffs[0].changes.length).toBeGreaterThan(0)
    })

    it('does nothing when clipboard is empty', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      pasteStyles(target, engine)
      expect(engine.getDiffs().length).toBe(0)
    })
  })
})
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @flow/extension exec vitest run src/content/__tests__/styleCopyPaste.test.ts
```

Expected: FAIL — module `../features/styleCopyPaste` not found.

### Step 3: Write the implementation

```typescript
// packages/extension/src/content/features/styleCopyPaste.ts
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

export interface CopiedStyle {
  property: string
  value: string
}

/**
 * Properties worth copying. Excludes inherited/layout properties
 * that would break the target element's structure.
 */
const COPY_PROPERTIES = [
  'color', 'background-color', 'background-image', 'background',
  'font-family', 'font-size', 'font-weight', 'font-style',
  'line-height', 'letter-spacing', 'text-align', 'text-decoration',
  'text-transform', 'opacity', 'mix-blend-mode',
  'border', 'border-radius', 'border-color', 'border-width', 'border-style',
  'box-shadow', 'text-shadow',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'filter', 'backdrop-filter',
]

let clipboard: CopiedStyle[] | null = null

/**
 * Copy computed styles from an element into the internal clipboard.
 * Also writes CSS text to the system clipboard for external use.
 */
export function copyStyles(el: Element): void {
  const computed = getComputedStyle(el)
  const styles: CopiedStyle[] = []

  for (const prop of COPY_PROPERTIES) {
    const val = computed.getPropertyValue(prop).trim()
    if (!val || val === 'none' || val === 'normal' || val === '0px' || val === 'auto') continue
    styles.push({ property: prop, value: val })
  }

  clipboard = styles

  // Also copy to system clipboard as CSS text
  const cssText = styles.map(s => `${s.property}: ${s.value};`).join('\n')
  navigator.clipboard.writeText(cssText).catch(() => {})
}

/**
 * Paste copied styles onto a target element, recording through the mutation engine.
 */
export function pasteStyles(el: Element, engine: UnifiedMutationEngine): void {
  if (!clipboard || clipboard.length === 0) return

  for (const { property, value } of clipboard) {
    engine.applyStyle(el, property, value)
  }
}

/**
 * Get the current internal clipboard (for testing).
 */
export function getClipboardStyles(): CopiedStyle[] | null {
  return clipboard
}
```

### Step 4: Run test to verify it passes

```bash
pnpm --filter @flow/extension exec vitest run src/content/__tests__/styleCopyPaste.test.ts
```

Expected: All tests pass.

### Step 5: Wire into content.ts

Add to `content.ts` after the `handleUndoRedoKeydown` listener (around line 288):

```typescript
// In imports:
import { copyStyles, pasteStyles } from '../content/features/styleCopyPaste';

// After the undo/redo keydown handler:
const handleCopyPasteKeydown = (e: KeyboardEvent) => {
  if (!flowEnabled || !selectedElement) return;
  if (shouldIgnoreKeyboardShortcut(e)) return;
  const isMeta = e.metaKey || e.ctrlKey;
  if (!isMeta || !e.altKey) return;

  if (e.key.toLowerCase() === 'c') {
    e.preventDefault();
    e.stopPropagation();
    copyStyles(selectedElement);
  } else if (e.key.toLowerCase() === 'v') {
    e.preventDefault();
    e.stopPropagation();
    pasteStyles(selectedElement, unifiedMutationEngine);
    broadcastMutationState();
  }
};
document.addEventListener('keydown', handleCopyPasteKeydown, true);
```

Add cleanup in the `cleanup` function:

```typescript
document.removeEventListener('keydown', handleCopyPasteKeydown, true);
```

### Step 6: Verify typecheck

```bash
pnpm --filter @flow/extension typecheck
```

Expected: 0 errors.

### Step 7: Commit

```bash
git add packages/extension/src/content/features/styleCopyPaste.ts \
       packages/extension/src/content/__tests__/styleCopyPaste.test.ts \
       packages/extension/src/entrypoints/content.ts
git commit -m "feat: add copy/paste styles (Cmd+Alt+C/V) — content-script global shortcut"
```

---

## Task 2.1: Keyboard Element Traversal (Tab / Enter / Shift+Enter)

**Why:** Big UX win — navigate DOM siblings with Tab, enter children with Enter, go to parent with Shift+Enter. Currently click-only.

**Files:**
- Create: `packages/extension/src/content/features/keyboardTraversal.ts`
- Create: `packages/extension/src/content/__tests__/keyboardTraversal.test.ts`
- Modify: `packages/extension/src/entrypoints/content.ts` (~15 lines)

### Step 1: Write the failing test

```typescript
// packages/extension/src/content/__tests__/keyboardTraversal.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getNextSibling,
  getPrevSibling,
  getFirstChild,
  getParent,
} from '../features/keyboardTraversal'

describe('keyboardTraversal', () => {
  let parent: HTMLElement
  let childA: HTMLElement
  let childB: HTMLElement
  let childC: HTMLElement
  let grandchild: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
    parent = document.createElement('div')
    parent.id = 'parent'
    childA = document.createElement('div')
    childA.id = 'a'
    childB = document.createElement('div')
    childB.id = 'b'
    childC = document.createElement('div')
    childC.id = 'c'
    grandchild = document.createElement('span')
    grandchild.id = 'gc'
    childB.appendChild(grandchild)
    parent.append(childA, childB, childC)
    document.body.appendChild(parent)
  })

  describe('getNextSibling', () => {
    it('returns next element sibling', () => {
      expect(getNextSibling(childA)).toBe(childB)
    })

    it('wraps to first sibling at end', () => {
      expect(getNextSibling(childC)).toBe(childA)
    })

    it('returns null for only child', () => {
      expect(getNextSibling(grandchild)).toBeNull()
    })
  })

  describe('getPrevSibling', () => {
    it('returns previous element sibling', () => {
      expect(getPrevSibling(childC)).toBe(childB)
    })

    it('wraps to last sibling at start', () => {
      expect(getPrevSibling(childA)).toBe(childC)
    })
  })

  describe('getFirstChild', () => {
    it('returns first element child', () => {
      expect(getFirstChild(childB)).toBe(grandchild)
    })

    it('returns null for leaf element', () => {
      expect(getFirstChild(childA)).toBeNull()
    })
  })

  describe('getParent', () => {
    it('returns parent element', () => {
      expect(getParent(childA)).toBe(parent)
    })

    it('returns null at body', () => {
      expect(getParent(document.body)).toBeNull()
    })

    it('returns null at html', () => {
      expect(getParent(document.documentElement)).toBeNull()
    })
  })
})
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @flow/extension exec vitest run src/content/__tests__/keyboardTraversal.test.ts
```

Expected: FAIL — module not found.

### Step 3: Write the implementation

```typescript
// packages/extension/src/content/features/keyboardTraversal.ts

/**
 * Keyboard element traversal — Tab/Shift+Tab through siblings,
 * Enter into children, Shift+Enter to parent.
 *
 * Following VisBug's traversal pattern from selectable.js.
 */

/** Next element sibling, wrapping to first at end. */
export function getNextSibling(el: Element): Element | null {
  const parent = el.parentElement
  if (!parent) return null
  const siblings = Array.from(parent.children)
  if (siblings.length <= 1) return null
  const idx = siblings.indexOf(el)
  return siblings[(idx + 1) % siblings.length]
}

/** Previous element sibling, wrapping to last at start. */
export function getPrevSibling(el: Element): Element | null {
  const parent = el.parentElement
  if (!parent) return null
  const siblings = Array.from(parent.children)
  if (siblings.length <= 1) return null
  const idx = siblings.indexOf(el)
  return siblings[(idx - 1 + siblings.length) % siblings.length]
}

/** First element child, or null for leaf elements. */
export function getFirstChild(el: Element): Element | null {
  return el.firstElementChild
}

/** Parent element, or null at body/html. */
export function getParent(el: Element): Element | null {
  const parent = el.parentElement
  if (!parent || parent === document.documentElement || parent === document.body) return null
  return parent
}
```

### Step 4: Run test to verify it passes

```bash
pnpm --filter @flow/extension exec vitest run src/content/__tests__/keyboardTraversal.test.ts
```

Expected: All tests pass.

### Step 5: Wire into content.ts

Add to `content.ts` alongside the copy/paste handler:

```typescript
// In imports:
import {
  getNextSibling,
  getPrevSibling,
  getFirstChild,
  getParent,
} from '../content/features/keyboardTraversal';

// After handleCopyPasteKeydown:
const handleTraversalKeydown = (e: KeyboardEvent) => {
  if (!flowEnabled || !selectedElement) return;
  if (shouldIgnoreKeyboardShortcut(e)) return;
  const mode = modeController.getState().topLevel;
  // Traversal only in modes with hover overlay (design, inspect, select, move)
  if (!showsHoverOverlay(mode)) return;
  // Don't conflict with move tool arrow keys
  if (mode === 'move') return;

  let next: Element | null = null;

  if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    next = getNextSibling(selectedElement);
  } else if (e.key === 'Tab' && e.shiftKey) {
    e.preventDefault();
    next = getPrevSibling(selectedElement);
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    next = getFirstChild(selectedElement);
  } else if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault();
    next = getParent(selectedElement);
  }

  if (next) {
    // Re-use the existing selection logic
    selectedElement = next;
    currentElement = next;
    updateOverlay(next);
    handleElementSelected(next);
  }
};
document.addEventListener('keydown', handleTraversalKeydown, true);
```

> **Note:** `handleElementSelected` is the existing helper in `content.ts` that dispatches `element:selected` and attaches tools. If it doesn't exist as a named function, extract the click handler's selection logic into a named `handleElementSelected(el: Element)` function first.

Add cleanup:

```typescript
document.removeEventListener('keydown', handleTraversalKeydown, true);
```

### Step 6: Verify typecheck

```bash
pnpm --filter @flow/extension typecheck
```

Expected: 0 errors.

### Step 7: Commit

```bash
git add packages/extension/src/content/features/keyboardTraversal.ts \
       packages/extension/src/content/__tests__/keyboardTraversal.test.ts \
       packages/extension/src/entrypoints/content.ts
git commit -m "feat: add keyboard element traversal — Tab/Enter/Shift+Enter for DOM navigation"
```

---

## Task 2.2: Guides Tool (Design Sub-Mode 6)

**Why:** Wraps existing measurement code (`inspectRuler`) as a proper design tool. Click to anchor, hover to measure distances. VisBug's most requested feature.

**Files:**
- Create: `packages/extension/src/content/modes/tools/guidesTool.ts`
- Create: `packages/extension/src/content/modes/tools/guidesTool.css`
- Create: `packages/extension/src/content/__tests__/guidesTool.test.ts`
- Modify: `packages/extension/src/entrypoints/content.ts` (~25 lines)

### Step 1: Write the failing test

```typescript
// packages/extension/src/content/__tests__/guidesTool.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createGuidesTool } from '../modes/tools/guidesTool'
import { createTestShadowRoot, createTargetElement } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/guidesTool.css?inline', () => ({ default: '' }))

// Mock inspectRuler
vi.mock('../modes/tools/inspectRuler', () => ({
  createInspectRuler: () => ({
    setAnchor: vi.fn(),
    measureTo: vi.fn(),
    clearLines: vi.fn(),
    clear: vi.fn(),
    destroy: vi.fn(),
  }),
}))

// Mock inspectRuler CSS
vi.mock('../modes/tools/inspectRuler.css?inline', () => ({ default: '' }))

// Mock distanceOverlay
vi.mock('../measurements/distanceOverlay', () => ({
  createDistanceOverlay: () => document.createElement('div'),
  createMeasurementLine: () => document.createElement('div'),
}))

describe('GuidesTool', () => {
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    shadowRoot = createTestShadowRoot()
  })

  it('creates with activate/deactivate/destroy', () => {
    const tool = createGuidesTool({ shadowRoot })
    expect(tool.activate).toBeInstanceOf(Function)
    expect(tool.deactivate).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('activate enables the tool', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.activate()
    // Should not throw
    expect(true).toBe(true)
  })

  it('onHover measures distance from anchor to hovered element', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.activate()

    const anchor = createTargetElement('div')
    anchor.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100)
    tool.onSelect(anchor)

    const target = createTargetElement('div')
    target.getBoundingClientRect = () => new DOMRect(200, 0, 100, 100)
    tool.onHover(target)

    // Tool is functional — doesn't throw
    expect(true).toBe(true)
  })

  it('onSelect with second element renders crosshair guides', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.activate()

    const el = createTargetElement('div')
    el.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    tool.onSelect(el)

    // Check for crosshair elements
    const guides = shadowRoot.querySelectorAll('.flow-guide-line')
    expect(guides.length).toBe(4) // top, right, bottom, left
  })

  it('deactivate clears all overlays', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.activate()

    const el = createTargetElement('div')
    el.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    tool.onSelect(el)
    tool.deactivate()

    const guides = shadowRoot.querySelectorAll('.flow-guide-line')
    expect(guides.length).toBe(0)
  })

  it('destroy removes all DOM elements', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.destroy()
    // No crash
    expect(true).toBe(true)
  })
})
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @flow/extension exec vitest run src/content/__tests__/guidesTool.test.ts
```

Expected: FAIL — module not found.

### Step 3: Write the CSS

```css
/* packages/extension/src/content/modes/tools/guidesTool.css */
.flow-guide-line {
  position: fixed;
  pointer-events: none;
  z-index: 2147483643;
}

.flow-guide-line--horizontal {
  height: 1px;
  width: 100vw;
  left: 0;
  background: hsla(330, 100%, 71%, 0.7);
}

.flow-guide-line--vertical {
  width: 1px;
  height: 100vh;
  top: 0;
  background: hsla(330, 100%, 71%, 0.7);
}

.flow-guide-anchor-badge {
  position: fixed;
  background: hsla(330, 100%, 71%, 0.9);
  color: white;
  font: 10px/1.4 ui-monospace, monospace;
  padding: 1px 4px;
  border-radius: 2px;
  pointer-events: none;
  z-index: 2147483644;
}
```

### Step 4: Write the implementation

```typescript
// packages/extension/src/content/modes/tools/guidesTool.ts
import { createInspectRuler, type InspectRuler } from './inspectRuler'
import styles from './guidesTool.css?inline'

export interface GuidesToolOptions {
  shadowRoot: ShadowRoot
}

export interface GuidesTool {
  activate: () => void
  deactivate: () => void
  onHover: (element: Element) => void
  onSelect: (element: Element) => void
  destroy: () => void
}

export function createGuidesTool({ shadowRoot }: GuidesToolOptions): GuidesTool {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  const container = document.createElement('div')
  container.className = 'flow-guides-container'
  shadowRoot.appendChild(container)

  const ruler: InspectRuler = createInspectRuler({ shadowRoot })
  let anchor: Element | null = null
  let guideEls: HTMLElement[] = []
  let badgeEl: HTMLElement | null = null

  function clearGuides(): void {
    for (const el of guideEls) el.remove()
    guideEls = []
    badgeEl?.remove()
    badgeEl = null
  }

  function renderCrosshairGuides(el: Element): void {
    clearGuides()
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    // Top edge
    const top = document.createElement('div')
    top.className = 'flow-guide-line flow-guide-line--horizontal'
    top.style.top = `${rect.top}px`
    shadowRoot.appendChild(top)
    guideEls.push(top)

    // Bottom edge
    const bottom = document.createElement('div')
    bottom.className = 'flow-guide-line flow-guide-line--horizontal'
    bottom.style.top = `${rect.bottom}px`
    shadowRoot.appendChild(bottom)
    guideEls.push(bottom)

    // Left edge
    const left = document.createElement('div')
    left.className = 'flow-guide-line flow-guide-line--vertical'
    left.style.left = `${rect.left}px`
    shadowRoot.appendChild(left)
    guideEls.push(left)

    // Right edge
    const right = document.createElement('div')
    right.className = 'flow-guide-line flow-guide-line--vertical'
    right.style.left = `${rect.right}px`
    shadowRoot.appendChild(right)
    guideEls.push(right)

    // Anchor badge
    badgeEl = document.createElement('div')
    badgeEl.className = 'flow-guide-anchor-badge'
    badgeEl.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)}`
    badgeEl.style.left = `${rect.right + 4}px`
    badgeEl.style.top = `${rect.top}px`
    shadowRoot.appendChild(badgeEl)
  }

  return {
    activate() {
      // Nothing to do on activate — tool is passive until selection
    },

    deactivate() {
      anchor = null
      clearGuides()
      ruler.clear()
    },

    onHover(element: Element) {
      if (!anchor || anchor === element) return
      ruler.measureTo(element)
    },

    onSelect(element: Element) {
      anchor = element
      ruler.setAnchor(element)
      renderCrosshairGuides(element)
    },

    destroy() {
      clearGuides()
      ruler.destroy()
      container.remove()
      styleEl.remove()
    },
  }
}
```

### Step 5: Run test to verify it passes

```bash
pnpm --filter @flow/extension exec vitest run src/content/__tests__/guidesTool.test.ts
```

Expected: All tests pass.

### Step 6: Wire into content.ts

Add the guides tool alongside the other tools:

```typescript
// In imports:
import { createGuidesTool } from '../content/modes/tools/guidesTool';

// After inspectRuler creation (~line 357):
const guidesTool = createGuidesTool({ shadowRoot: overlayRoot });
let guidesToolActive = false;

// In the modeController.subscribe callback, add after the Typography block:
// Guides tool — design sub-mode 6
if (state.topLevel === 'design' && state.designSubMode === 'guides') {
  if (!guidesToolActive) {
    guidesTool.activate();
    guidesToolActive = true;
  }
} else if (guidesToolActive) {
  guidesTool.deactivate();
  guidesToolActive = false;
}

// In onMouseMove (inspect section), add parallel guides handling:
if (modeController.getState().topLevel === 'design' &&
    modeController.getState().designSubMode === 'guides' &&
    guidesToolActive) {
  guidesTool.onHover(el);
}

// In onClick handler, add guides selection:
if (modeController.getState().topLevel === 'design' &&
    modeController.getState().designSubMode === 'guides') {
  guidesTool.onSelect(el);
}
```

### Step 7: Verify typecheck

```bash
pnpm --filter @flow/extension typecheck
```

Expected: 0 errors.

### Step 8: Commit

```bash
git add packages/extension/src/content/modes/tools/guidesTool.ts \
       packages/extension/src/content/modes/tools/guidesTool.css \
       packages/extension/src/content/__tests__/guidesTool.test.ts \
       packages/extension/src/entrypoints/content.ts
git commit -m "feat: add guides tool (D→6) — crosshair guides, click-to-anchor distance measurements"
```

---

## Task 2.3: Verify Text Edit Mode End-to-End

**Why:** Text edit mode exists but needs verification that the full chain works: hotkey (T) → mode switch → contenteditable activation → mutation recording → undo.

**Files:**
- Modify: (none expected — this is a verification task)
- Inspect: `packages/extension/src/content/mutations/textEditMode.ts`
- Inspect: `packages/extension/src/entrypoints/content.ts` (editText mode handling)

### Step 1: Read current text edit mode implementation

```bash
pnpm --filter @flow/extension exec vitest run src/content/__tests__/textEditMode.test.ts 2>/dev/null || echo "No existing test"
```

Read these files and verify the chain:
1. `modeHotkeys.ts` registers `t` → `setTopLevel('editText')`
2. `modes/types.ts` — `editText` has `interceptsEvents: false` (correct — direct page clicks)
3. `textEditMode.ts` — `initTextEditMode()` listens for `text:start-edit` messages
4. `content.ts` — When `editText` mode is active, clicks should trigger text editing

### Step 2: Trace the wiring

Verify these connections exist:

1. **T hotkey** → `modeController.setTopLevel('editText')` — should work via `modeHotkeys.ts`
2. **Click in editText mode** → `content.ts` should handle this. Check if there's an `editText`-specific click path.
3. **contenteditable activation** → `textEditMode.ts` should set `contentEditable = 'true'` on the clicked element.
4. **Escape exits** → Should revert contenteditable and record the text change.

### Step 3: Document findings

If the chain is complete and functional:
```bash
echo "Text edit mode verified: T → click → edit → Escape → mutation recorded"
```

If there are gaps, create a fix. Common issues:
- Click handler doesn't dispatch to text edit when mode is `editText`
- No visual feedback when entering text edit mode
- Text changes not recorded through `unifiedMutationEngine`

### Step 4: Commit (if changes needed)

```bash
# Only if fixes were required:
git add -A
git commit -m "fix: wire text edit mode end-to-end — T hotkey → click → contenteditable → undo"
```

---

## Task 2.4: Wire Screenshot to CDP Service

**Why:** `ScreenshotPanel.tsx` sends `panel:screenshot` but `panelRouter.ts:handleScreenshot` is a stub returning `{ success: false }`. The real `screenshotService.ts` (88 lines) has a working CDP implementation via `Page.captureScreenshot`.

**Files:**
- Modify: `packages/extension/src/content/panelRouter.ts` (~15 lines)
- Modify: `packages/extension/src/entrypoints/background.ts` (~20 lines for CDP relay)
- Read-only: `packages/extension/src/panel/api/screenshotService.ts`
- Read-only: `packages/extension/src/panel/api/cdpBridge.ts`

### Step 1: Understand the current routing problem

The screenshot flow has two paths, and the wrong one is active:

**Current (broken):** `ScreenshotPanel → panel:screenshot → content script → handleScreenshot() stub → { success: false }`

**Should be:** `ScreenshotPanel → screenshotService.ts → cdpBridge.ts → background.ts → chrome.debugger → Page.captureScreenshot`

The fix: `ScreenshotPanel` should call `screenshotService.ts` directly from the panel, NOT route through the content script. The screenshot service already uses `cdpBridge.ts` which sends `cdp:command` messages to the background.

### Step 2: Check if background handles CDP commands

Read `packages/extension/src/entrypoints/background.ts` and search for `cdp:command` handling. If the background already relays CDP commands via `chrome.debugger`, the only fix is making `ScreenshotPanel` call `screenshotService` instead of posting a message.

```bash
# Verify background CDP relay exists
pnpm --filter @flow/extension exec vitest run 2>/dev/null; echo "Check background for cdp:command handler"
```

### Step 3: Fix ScreenshotPanel to use screenshotService directly

In `packages/extension/src/panel/components/context/ScreenshotPanel.tsx`, find the `panel:screenshot` message dispatch and replace it with a direct call to `captureScreenshot()` or `captureSelectedElement()`.

**Before (around line 313):**
```typescript
// Sends panel:screenshot to content script (hits stub)
port.postMessage({
  type: "panel:screenshot",
  payload: { mode, selector },
});
```

**After:**
```typescript
import { captureScreenshot, captureSelectedElement } from '../../api/screenshotService';

// In the capture handler:
try {
  const dataUrl = mode === 'element'
    ? await captureSelectedElement({ format: 'png' })
    : await captureScreenshot({ format: 'png' });

  if (dataUrl) {
    setScreenshotData(dataUrl);
    setError(null);
  } else {
    setError('Failed to capture screenshot');
  }
} catch (err) {
  setError(err instanceof Error ? err.message : 'Screenshot failed');
}
```

### Step 4: Verify background CDP relay exists

If the background doesn't handle `cdp:command`, add a handler:

```typescript
// In background.ts message listener:
if (message.type === 'cdp:command') {
  const { method, params } = message.payload;
  try {
    await chrome.debugger.attach({ tabId: message.tabId }, '1.3');
    const result = await chrome.debugger.sendCommand(
      { tabId: message.tabId },
      method,
      params
    );
    return { result };
  } catch (error) {
    return { error: String(error) };
  }
}
```

### Step 5: Remove the panelRouter stub

In `packages/extension/src/content/panelRouter.ts`, either:
- Remove `handleScreenshot` entirely and the `case 'panel:screenshot'` switch entry, OR
- Leave it with a comment that screenshot now uses CDP directly from the panel

### Step 6: Verify typecheck + existing tests

```bash
pnpm --filter @flow/extension typecheck
pnpm --filter @flow/extension test --run
```

Expected: 0 errors, 0 failures.

### Step 7: Commit

```bash
git add packages/extension/src/panel/components/context/ScreenshotPanel.tsx \
       packages/extension/src/content/panelRouter.ts \
       packages/extension/src/entrypoints/background.ts
git commit -m "feat: wire screenshot to CDP service — replace content-script stub with direct panel→CDP path"
```

---

## Task 2.5: Wire BoxShadowsSection to boxShadowParser

**Why:** `BoxShadowsSection.tsx` has a `TODO: Parse boxShadow string to LayersValue` comment. The parser (`boxShadowParser.ts`) exists with 15 passing tests. Just need to connect them.

**Files:**
- Modify: `packages/extension/src/panel/components/designer/sections/BoxShadowsSection.tsx` (~20 lines)
- Read-only: `packages/extension/src/panel/components/designer/boxShadowParser.ts`
- Read-only: `packages/extension/src/panel/components/designer/__tests__/boxShadowParser.test.ts`

### Step 1: Read the parser and section

Read `boxShadowParser.ts` to understand the `ParsedBoxShadow` interface:
```typescript
interface ParsedBoxShadow {
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  color: string
  inset: boolean
}
```

Read `BoxShadowsSection.tsx` to understand the `LayersValue` type it expects.

Read the `ShadowEditor` component to understand what `LayersValue` shape it needs.

### Step 2: Map ParsedBoxShadow → LayersValue

The `ShadowEditor` uses `LayersValue` from `types/styleValue.ts`. Find the mapping between `ParsedBoxShadow` and a `LayerValue` entry.

Write a conversion function:

```typescript
import { parseBoxShadow, type ParsedBoxShadow } from '../boxShadowParser'
import type { LayersValue, LayerValue } from '../../../types/styleValue'

function parsedShadowToLayer(shadow: ParsedBoxShadow, index: number): LayerValue {
  return {
    id: `shadow-${index}`,
    visible: true,
    values: {
      offsetX: { value: shadow.offsetX, unit: 'px' },
      offsetY: { value: shadow.offsetY, unit: 'px' },
      blur: { value: shadow.blur, unit: 'px' },
      spread: { value: shadow.spread, unit: 'px' },
      color: shadow.color,
      inset: shadow.inset,
    },
  }
}
```

> **Note:** The exact `LayerValue` shape depends on `types/styleValue.ts`. Read it before implementing. The above is a sketch — adjust field names and structure to match.

### Step 3: Replace the TODO with real hydration

In `BoxShadowsSection.tsx`, replace:

```typescript
// TODO: Parse boxShadow string to LayersValue
// For now, keep existing state
```

With:

```typescript
import { parseBoxShadow } from '../boxShadowParser'

// In the useEffect:
if (initialStyles?.boxShadow && typeof initialStyles.boxShadow === 'string') {
  const parsed = parseBoxShadow(initialStyles.boxShadow)
  if (parsed.length > 0) {
    const layers = parsed.map((shadow, i) => parsedShadowToLayer(shadow, i))
    setShadowLayers({ layers })
  }
}
```

### Step 4: Verify typecheck + parser tests still pass

```bash
pnpm --filter @flow/extension typecheck
pnpm --filter @flow/extension exec vitest run src/panel/components/designer/__tests__/boxShadowParser.test.ts
```

Expected: 0 errors, all parser tests pass.

### Step 5: Commit

```bash
git add packages/extension/src/panel/components/designer/sections/BoxShadowsSection.tsx
git commit -m "feat: hydrate BoxShadowsSection from existing box-shadow values via boxShadowParser"
```

---

## Task 2.6: Panel Message Wiring Audit

**Why:** Verify all design tools properly broadcast state changes to the panel. Some tools may render in the content script but not update the DevTools panel's designer sections.

**Files:**
- Inspect: `packages/extension/src/content/mutations/mutationMessageHandler.ts`
- Inspect: `packages/extension/src/entrypoints/content.ts` (broadcastMutationState calls)
- Modify: (as needed)

### Step 1: Audit current wiring

Check that every tool's `onUpdate` callback calls `broadcastMutationState()`:

```
colorTool     → onUpdate: () => broadcastMutationState()     ✓ (content.ts:311)
effectsTool   → onUpdate: () => broadcastMutationState()     ✓ (content.ts:318)
positionTool  → onUpdate: () => broadcastMutationState()     ✓ (content.ts:326)
layoutTool    → onUpdate: () => broadcastMutationState()     ✓ (content.ts:334)
typographyTool → onUpdate: () => broadcastMutationState()    ✓ (content.ts:342)
moveTool      → onUpdate: () => broadcastMutationState()     ✓ (content.ts:350)
```

### Step 2: Verify panel receives mutation:state messages

Read `mutationMessageHandler.ts` to confirm `broadcastMutationState()` posts a `mutation:state` message on the port. The panel should receive this and update its designer sections.

### Step 3: Check the new features added in this plan

Verify:
- **Copy/paste styles** (Task 2.0) calls `broadcastMutationState()` after paste — check the wiring added in Step 5.
- **Keyboard traversal** (Task 2.1) triggers element selection which should re-inspect the new element.

### Step 4: Fix any gaps found

If tools are missing the `broadcastMutationState()` call or the panel doesn't refresh on `mutation:state`, fix it.

### Step 5: Commit (if changes needed)

```bash
git add -A
git commit -m "fix: ensure all tools broadcast mutation state to panel after changes"
```

---

## Task 2.7: Final Verification

### Step 1: Run full suite

```bash
pnpm typecheck                              # 0 errors across all packages
pnpm --filter @flow/extension test --run    # 0 failures
pnpm --filter @flow/server test --run       # 0 failures
```

### Step 2: Count new files

```bash
# New files created in Plan 2
ls packages/extension/src/content/features/styleCopyPaste.ts \
   packages/extension/src/content/features/keyboardTraversal.ts \
   packages/extension/src/content/modes/tools/guidesTool.ts \
   packages/extension/src/content/modes/tools/guidesTool.css \
   packages/extension/src/content/__tests__/styleCopyPaste.test.ts \
   packages/extension/src/content/__tests__/keyboardTraversal.test.ts \
   packages/extension/src/content/__tests__/guidesTool.test.ts | wc -l
# Expected: 7
```

### Step 3: Run only new tests

```bash
pnpm --filter @flow/extension exec vitest run \
  src/content/__tests__/styleCopyPaste.test.ts \
  src/content/__tests__/keyboardTraversal.test.ts \
  src/content/__tests__/guidesTool.test.ts
```

### Step 4: Summarize changes

After all tasks pass:
- New files: 7 (3 implementations + 1 CSS + 3 test files)
- Modified files: ~4 (content.ts, panelRouter.ts, ScreenshotPanel.tsx, BoxShadowsSection.tsx)
- New features: Copy/paste styles, keyboard traversal, guides tool
- Wiring fixes: Screenshot → CDP, BoxShadow hydration, panel message audit
- Estimated new tests: ~20

---

## Summary

| Task | What | New Files | Modified |
|------|------|-----------|----------|
| 2.0 | Copy/paste styles (Cmd+Alt+C/V) | 2 (impl + test) | content.ts |
| 2.1 | Keyboard element traversal | 2 (impl + test) | content.ts |
| 2.2 | Guides tool (D→6) | 3 (impl + CSS + test) | content.ts |
| 2.3 | Text edit mode verification | 0 | maybe content.ts |
| 2.4 | Screenshot → CDP wiring | 0 | ScreenshotPanel, panelRouter, background |
| 2.5 | BoxShadow hydration | 0 | BoxShadowsSection.tsx |
| 2.6 | Panel message wiring audit | 0 | as needed |
| 2.7 | Final verification | 0 | 0 |

**Total: 7 new files, ~4 modified files, ~20 new tests**
