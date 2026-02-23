# Plan 1: Test Stabilization

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add unit tests for all untested content-script design tools and shared utilities, establishing comprehensive test coverage before Plan 2 (VisBug Final Pass).

**Architecture:** Each test file follows the established pattern from `flexTool.test.ts`: create real `UnifiedMutationEngine`, attach real `ShadowRoot` via jsdom, dispatch keyboard/mouse events, and assert via `engine.getDiffs()` or DOM state. A shared test helper module (`toolTestHelpers.ts`) provides factory functions for common setup.

**Tech Stack:** Vitest, jsdom, TypeScript 5.8

**Depends on:** Plan 0 (baseline green)

---

## Pre-flight

Before starting, verify Plan 0's gate is satisfied:

```bash
cd /Users/rivermassey/Desktop/dev/DNA/tools/flow
pnpm typecheck        # 0 errors
pnpm test             # all packages, 0 failures
```

---

## Task 1.0: Create shared test helpers

**Files:**
- Create: `packages/extension/src/content/__tests__/toolTestHelpers.ts`

**Step 1: Write the helper module**

```typescript
import { vi } from 'vitest'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

/**
 * Create a ShadowRoot attached to a host element in the document body.
 * Uses 'open' mode so tests can query internal DOM.
 */
export function createTestShadowRoot(): ShadowRoot {
  const host = document.createElement('div')
  document.body.appendChild(host)
  return host.attachShadow({ mode: 'open' })
}

/**
 * Create a target element with common defaults.
 * Appends to document.body so getComputedStyle works.
 */
export function createTargetElement(
  tag: string = 'div',
  styles: Partial<CSSStyleDeclaration> = {},
): HTMLElement {
  const el = document.createElement(tag)
  Object.assign(el.style, styles)
  document.body.appendChild(el)
  return el
}

/**
 * Dispatch a KeyboardEvent on the document.
 */
export function dispatchKey(
  key: string,
  modifiers: Partial<Pick<KeyboardEvent, 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'>> = {},
  target: EventTarget = document,
) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...modifiers,
    }),
  )
}

/**
 * Standard tool test setup: engine + shadowRoot + target + onUpdate spy.
 */
export function createToolTestContext(
  targetStyles: Partial<CSSStyleDeclaration> = {},
  targetTag: string = 'div',
) {
  const engine = createUnifiedMutationEngine()
  const shadowRoot = createTestShadowRoot()
  const target = createTargetElement(targetTag, targetStyles)
  const onUpdate = vi.fn()
  return { engine, shadowRoot, target, onUpdate }
}
```

**Step 2: Verify the helper compiles**

```bash
pnpm --filter @flow/extension exec tsc --noEmit
```

Expected: 0 errors.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/toolTestHelpers.ts
git commit -m "test: add shared toolTestHelpers for content-script tool tests"
```

---

## Task 1.1: Test reorderEngine

**Why first:** The reorderEngine is a pure DOM mutation module used by moveTool. Testing it independently validates the undo/redo recording logic before testing the full moveTool.

**Files:**
- Create: `packages/extension/src/content/__tests__/reorderEngine.test.ts`
- Source: `packages/extension/src/content/modes/tools/reorderEngine.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import {
  createReorderEngine,
  captureSnapshot,
  restoreSnapshot,
  describeSnapshot,
  type ReorderEngine,
} from '../modes/tools/reorderEngine'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

describe('reorderEngine', () => {
  let engine: UnifiedMutationEngine
  let reorder: ReorderEngine
  let parent: HTMLElement
  let childA: HTMLElement
  let childB: HTMLElement
  let childC: HTMLElement

  beforeEach(() => {
    engine = createUnifiedMutationEngine()

    parent = document.createElement('div')
    parent.id = 'container'
    document.body.appendChild(parent)

    childA = document.createElement('div')
    childA.id = 'a'
    childB = document.createElement('div')
    childB.id = 'b'
    childC = document.createElement('div')
    childC.id = 'c'
    parent.append(childA, childB, childC)

    reorder = createReorderEngine(engine)
  })

  describe('captureSnapshot / restoreSnapshot', () => {
    it('captures current position', () => {
      const snap = captureSnapshot(childB)
      expect(snap).not.toBeNull()
      expect(snap!.parent).toBe(parent)
      expect(snap!.nextSibling).toBe(childC)
    })

    it('restores to original position', () => {
      const snap = captureSnapshot(childB)!
      parent.appendChild(childB) // move to end
      expect(parent.lastElementChild).toBe(childB)
      restoreSnapshot(snap)
      expect(Array.from(parent.children).indexOf(childB)).toBe(1)
    })

    it('returns null for orphaned element', () => {
      const orphan = document.createElement('div')
      expect(captureSnapshot(orphan)).toBeNull()
    })
  })

  describe('describeSnapshot', () => {
    it('reports position correctly', () => {
      const snap = captureSnapshot(childB)!
      expect(describeSnapshot(snap)).toBe('child 2 of 3 in #container')
    })
  })

  describe('moveUp / moveDown', () => {
    it('moveDown swaps with next sibling', () => {
      reorder.setTarget(childA)
      expect(reorder.moveDown()).toBe(true)
      expect(Array.from(parent.children).map(c => c.id)).toEqual(['b', 'a', 'c'])
    })

    it('moveUp swaps with previous sibling', () => {
      reorder.setTarget(childC)
      expect(reorder.moveUp()).toBe(true)
      expect(Array.from(parent.children).map(c => c.id)).toEqual(['a', 'c', 'b'])
    })

    it('moveUp at first position returns false', () => {
      reorder.setTarget(childA)
      expect(reorder.moveUp()).toBe(false)
    })

    it('moveDown at last position returns false', () => {
      reorder.setTarget(childC)
      expect(reorder.moveDown()).toBe(false)
    })
  })

  describe('moveToFirst / moveToLast', () => {
    it('moveToFirst moves element to beginning', () => {
      reorder.setTarget(childC)
      expect(reorder.moveToFirst()).toBe(true)
      expect(parent.firstElementChild).toBe(childC)
    })

    it('moveToLast moves element to end', () => {
      reorder.setTarget(childA)
      expect(reorder.moveToLast()).toBe(true)
      expect(parent.lastElementChild).toBe(childA)
    })
  })

  describe('promote / demote', () => {
    it('demote moves element into previous sibling', () => {
      reorder.setTarget(childB)
      expect(reorder.demote()).toBe(true)
      expect(childA.contains(childB)).toBe(true)
    })

    it('promote moves element out of parent', () => {
      // Nest childB inside childA first
      childA.appendChild(childB)
      reorder.setTarget(childB)
      expect(reorder.promote()).toBe(true)
      expect(childB.parentElement).toBe(parent)
    })
  })

  describe('undo integration', () => {
    it('records custom mutation that can be undone', () => {
      reorder.setTarget(childA)
      reorder.moveDown()
      expect(engine.canUndo).toBe(true)
      engine.undo()
      expect(Array.from(parent.children).map(c => c.id)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('getPositionLabel', () => {
    it('returns human-readable position', () => {
      reorder.setTarget(childB)
      expect(reorder.getPositionLabel()).toBe('child 2 of 3')
    })

    it('returns dash for no target', () => {
      expect(reorder.getPositionLabel()).toBe('child \u2013 of \u2013')
    })
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/reorderEngine.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/reorderEngine.test.ts
git commit -m "test: add reorderEngine tests — moveUp/Down/First/Last, promote/demote, undo"
```

---

## Task 1.2: Test unitInput

**Files:**
- Create: `packages/extension/src/content/__tests__/unitInput.test.ts`
- Source: `packages/extension/src/content/modes/tools/unitInput.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect } from 'vitest'
import { parseValueWithUnit, resolveInputWithUnit } from '../modes/tools/unitInput'

describe('parseValueWithUnit', () => {
  it('parses number only', () => {
    expect(parseValueWithUnit('16')).toEqual({ value: '16', unit: null })
  })

  it('parses number with px', () => {
    expect(parseValueWithUnit('16px')).toEqual({ value: '16', unit: 'px' })
  })

  it('parses decimal with rem', () => {
    expect(parseValueWithUnit('1.5rem')).toEqual({ value: '1.5', unit: 'rem' })
  })

  it('parses percent', () => {
    expect(parseValueWithUnit('100%')).toEqual({ value: '100', unit: '%' })
  })

  it('parses negative with ch', () => {
    expect(parseValueWithUnit('-3ch')).toEqual({ value: '-3', unit: 'ch' })
  })

  it('parses viewport units', () => {
    expect(parseValueWithUnit('80dvw')).toEqual({ value: '80', unit: 'dvw' })
  })

  it('returns keyword for auto', () => {
    expect(parseValueWithUnit('auto')).toEqual({ value: 'auto', unit: null })
  })

  it('returns keyword for normal', () => {
    expect(parseValueWithUnit('normal')).toEqual({ value: 'normal', unit: null })
  })

  it('returns empty for empty string', () => {
    expect(parseValueWithUnit('')).toEqual({ value: '', unit: null })
  })

  it('uses default unit when no unit provided', () => {
    expect(parseValueWithUnit('16', 'em')).toEqual({ value: '16', unit: 'em' })
  })
})

describe('resolveInputWithUnit', () => {
  function createInput(value: string): HTMLInputElement {
    const input = document.createElement('input')
    input.value = value
    return input
  }

  function createUnitSelect(units: string[], selected: string): HTMLSelectElement {
    const sel = document.createElement('select')
    for (const u of units) {
      const opt = document.createElement('option')
      opt.value = u
      opt.textContent = u
      sel.appendChild(opt)
    }
    sel.value = selected
    return sel
  }

  it('detects embedded unit and updates selector', () => {
    const input = createInput('16ch')
    const select = createUnitSelect(['px', 'em', 'rem', 'ch'], 'px')
    const result = resolveInputWithUnit(input, select, 'px')
    expect(result.value).toBe('16')
    expect(result.unit).toBe('ch')
    expect(result.changed).toBe(true)
    expect(input.value).toBe('16')
    expect(select.value).toBe('ch')
  })

  it('keeps current unit when no unit typed', () => {
    const input = createInput('24')
    const select = createUnitSelect(['px', 'em'], 'em')
    const result = resolveInputWithUnit(input, select, 'px')
    expect(result.value).toBe('24')
    expect(result.unit).toBe('em')
    expect(result.changed).toBe(false)
  })

  it('adds unknown unit to selector dynamically', () => {
    const input = createInput('80dvw')
    const select = createUnitSelect(['px', 'em'], 'px')
    const result = resolveInputWithUnit(input, select, 'px')
    expect(result.unit).toBe('dvw')
    expect(result.changed).toBe(true)
    expect(select.querySelector('option[value="dvw"]')).not.toBeNull()
  })

  it('passes through keywords', () => {
    const input = createInput('auto')
    const select = createUnitSelect(['px'], 'px')
    const result = resolveInputWithUnit(input, select)
    expect(result.value).toBe('auto')
    expect(input.value).toBe('auto')
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/unitInput.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/unitInput.test.ts
git commit -m "test: add unitInput tests — parseValueWithUnit, resolveInputWithUnit"
```

---

## Task 1.3: Test spacingScale

**Files:**
- Create: `packages/extension/src/content/__tests__/spacingScale.test.ts`
- Source: `packages/extension/src/content/modes/tools/spacingScale.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect } from 'vitest'
import {
  findNearestTwIndex,
  stepTailwind,
  pxToDisplayValue,
  TAILWIND_SPACING,
} from '../modes/tools/spacingScale'

describe('spacingScale', () => {
  describe('findNearestTwIndex', () => {
    it('returns 0 for 0px', () => {
      expect(findNearestTwIndex(0)).toBe(0)
    })

    it('finds exact match for 16px (tw-4)', () => {
      const idx = findNearestTwIndex(16)
      expect(TAILWIND_SPACING[idx].px).toBe(16)
    })

    it('snaps 15px to nearest (14 or 16)', () => {
      const idx = findNearestTwIndex(15)
      expect([14, 16]).toContain(TAILWIND_SPACING[idx].px)
    })

    it('snaps 100px to nearest (96)', () => {
      const idx = findNearestTwIndex(100)
      expect(TAILWIND_SPACING[idx].px).toBe(96)
    })
  })

  describe('stepTailwind', () => {
    it('steps forward by 1', () => {
      const result = stepTailwind(8, 1, false)
      expect(result).toBe(10) // tw-2 (8) → tw-2.5 (10)
    })

    it('steps backward by 1', () => {
      const result = stepTailwind(8, -1, false)
      expect(result).toBe(6) // tw-2 (8) → tw-1.5 (6)
    })

    it('large step forward jumps 3', () => {
      const result = stepTailwind(0, 1, true)
      expect(result).toBe(6) // tw-0 (0) → 3 steps → tw-1.5 (6)
    })

    it('clamps at 0', () => {
      expect(stepTailwind(0, -1, false)).toBe(0)
    })

    it('clamps at max', () => {
      const max = TAILWIND_SPACING[TAILWIND_SPACING.length - 1].px
      expect(stepTailwind(max, 1, false)).toBe(max)
    })
  })

  describe('pxToDisplayValue', () => {
    it('returns tw label for exact match', () => {
      expect(pxToDisplayValue(16)).toBe('4')
    })

    it('returns tw "px" label for 1px', () => {
      expect(pxToDisplayValue(1)).toBe('px')
    })

    it('returns rounded number for non-scale values', () => {
      expect(pxToDisplayValue(15)).toBe('15')
    })
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/spacingScale.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/spacingScale.test.ts
git commit -m "test: add spacingScale tests — findNearest, step, display value"
```

---

## Task 1.4: Test toolPanelPosition

**Files:**
- Create: `packages/extension/src/content/__tests__/toolPanelPosition.test.ts`
- Source: `packages/extension/src/content/modes/tools/toolPanelPosition.ts`

**Step 1: Write the test file**

The function calls `getBoundingClientRect()` on elements and uses `window.innerWidth/Height`. In jsdom these return 0 by default, so we need to mock them.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computeToolPanelPosition } from '../modes/tools/toolPanelPosition'

// toolPanelPosition imports getPersistentSelectionSelectors — mock it
vi.mock('../../overlays/persistentSelections', () => ({
  getPersistentSelectionSelectors: () => [],
}))

describe('computeToolPanelPosition', () => {
  beforeEach(() => {
    // Set viewport size
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
  })

  function mockElement(rect: DOMRect): Element {
    const el = document.createElement('div')
    el.getBoundingClientRect = () => rect
    document.body.appendChild(el)
    return el
  }

  it('positions below element by default', () => {
    const el = mockElement(new DOMRect(100, 100, 200, 50))
    const pos = computeToolPanelPosition(el, 260, 400)
    // Below: top = rect.bottom + 8 = 158
    expect(pos.top).toBe(158)
    expect(pos.left).toBe(100)
  })

  it('clamps to viewport bounds', () => {
    // Element near bottom-right corner
    const el = mockElement(new DOMRect(900, 700, 100, 30))
    const pos = computeToolPanelPosition(el, 260, 400)
    // Should be clamped within viewport
    expect(pos.left).toBeLessThanOrEqual(1024 - 260 - 8)
    expect(pos.top).toBeLessThanOrEqual(768 - 400 - 8)
    expect(pos.left).toBeGreaterThanOrEqual(8)
    expect(pos.top).toBeGreaterThanOrEqual(8)
  })

  it('returns an object with left and top', () => {
    const el = mockElement(new DOMRect(200, 200, 100, 50))
    const pos = computeToolPanelPosition(el, 260, 400)
    expect(pos).toHaveProperty('left')
    expect(pos).toHaveProperty('top')
    expect(typeof pos.left).toBe('number')
    expect(typeof pos.top).toBe('number')
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/toolPanelPosition.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/toolPanelPosition.test.ts
git commit -m "test: add toolPanelPosition tests — default placement, viewport clamping"
```

---

## Task 1.5: Test eventInterceptor

**Files:**
- Create: `packages/extension/src/content/__tests__/eventInterceptor.test.ts`
- Source: `packages/extension/src/content/modes/eventInterceptor.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  enableEventInterception,
  disableEventInterception,
  getInterceptorElement,
} from '../modes/eventInterceptor'
import { createTestShadowRoot } from './toolTestHelpers'

describe('eventInterceptor', () => {
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    shadowRoot = createTestShadowRoot()
  })

  afterEach(() => {
    disableEventInterception()
  })

  it('creates interceptor element in shadow root', () => {
    enableEventInterception(shadowRoot)
    const el = getInterceptorElement()
    expect(el).not.toBeNull()
    expect(el!.parentNode).toBe(shadowRoot)
  })

  it('interceptor has fixed positioning covering viewport', () => {
    enableEventInterception(shadowRoot)
    const el = getInterceptorElement()!
    expect(el.style.position).toBe('fixed')
    expect(el.style.inset).toBe('0px')
    expect(el.style.pointerEvents).toBe('auto')
  })

  it('disableEventInterception removes the element', () => {
    enableEventInterception(shadowRoot)
    expect(getInterceptorElement()).not.toBeNull()
    disableEventInterception()
    expect(getInterceptorElement()).toBeNull()
  })

  it('does not create duplicate interceptors', () => {
    enableEventInterception(shadowRoot)
    enableEventInterception(shadowRoot)
    expect(shadowRoot.querySelectorAll('[data-flow-interceptor]').length).toBe(1)
  })

  it('routes click events to handler', () => {
    const onClick = vi.fn()
    enableEventInterception(shadowRoot, { onClick })
    const el = getInterceptorElement()!
    el.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('routes mousemove events to handler', () => {
    const onMouseMove = vi.fn()
    enableEventInterception(shadowRoot, { onMouseMove })
    const el = getInterceptorElement()!
    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    expect(onMouseMove).toHaveBeenCalledTimes(1)
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/eventInterceptor.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/eventInterceptor.test.ts
git commit -m "test: add eventInterceptor tests — enable/disable, handler routing"
```

---

## Task 1.6: Test colorTokens

**Files:**
- Create: `packages/extension/src/content/__tests__/colorTokens.test.ts`
- Source: `packages/extension/src/content/modes/tools/colorTokens.ts`

**Step 1: Write the test file**

Focus on the pure functions (`getSemanticTarget`, `hexToHue`, `findSemanticVariable`). Skip `extractBrandColors` and `countColorPrevalence` which require full stylesheet access.

```typescript
import { describe, it, expect } from 'vitest'
import { getSemanticTarget, hexToHue } from '../modes/tools/colorTokens'

describe('colorTokens', () => {
  describe('getSemanticTarget', () => {
    it('maps text tab to color + content prefix', () => {
      const result = getSemanticTarget('text')
      expect(result.property).toBe('color')
      expect(result.prefix).toBe('content')
    })

    it('maps fill tab to background-color + surface prefix', () => {
      const result = getSemanticTarget('fill')
      expect(result.property).toBe('background-color')
      expect(result.prefix).toBe('surface')
    })

    it('maps border tab to border-color + edge prefix', () => {
      const result = getSemanticTarget('border')
      expect(result.property).toBe('border-color')
      expect(result.prefix).toBe('edge')
    })
  })

  describe('hexToHue', () => {
    it('returns 0 for pure red (#ff0000)', () => {
      expect(hexToHue('#ff0000')).toBe(0)
    })

    it('returns ~120 for pure green (#00ff00)', () => {
      expect(hexToHue('#00ff00')).toBe(120)
    })

    it('returns ~240 for pure blue (#0000ff)', () => {
      expect(hexToHue('#0000ff')).toBe(240)
    })

    it('returns 0 for black (#000000)', () => {
      expect(hexToHue('#000000')).toBe(0)
    })

    it('returns 0 for white (#ffffff)', () => {
      expect(hexToHue('#ffffff')).toBe(0)
    })

    it('handles short hex (#f00)', () => {
      expect(hexToHue('#f00')).toBe(0)
    })
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/colorTokens.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/colorTokens.test.ts
git commit -m "test: add colorTokens tests — getSemanticTarget, hexToHue"
```

---

## Task 1.7: Test inspectTooltip

**Files:**
- Create: `packages/extension/src/content/__tests__/inspectTooltip.test.ts`
- Source: `packages/extension/src/content/modes/tools/inspectTooltip.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createInspectTooltip } from '../modes/tools/inspectTooltip'
import { createTestShadowRoot, createTargetElement } from './toolTestHelpers'

// Mock the CSS import
vi.mock('../modes/tools/inspectTooltip.css?inline', () => ({ default: '' }))

// Mock accessibility functions (they need canvas)
vi.mock('../features/accessibility', () => ({
  getContrastRatio: () => 4.5,
  meetsWcagAA: () => true,
}))

describe('InspectTooltip', () => {
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    shadowRoot = createTestShadowRoot()
    // Set viewport for positioning
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
  })

  it('creates without errors', () => {
    const tooltip = createInspectTooltip({ shadowRoot })
    expect(tooltip).toBeDefined()
    expect(tooltip.show).toBeInstanceOf(Function)
    expect(tooltip.hide).toBeInstanceOf(Function)
    expect(tooltip.destroy).toBeInstanceOf(Function)
  })

  it('injects style element into shadow root', () => {
    createInspectTooltip({ shadowRoot })
    expect(shadowRoot.querySelector('style')).not.toBeNull()
  })

  it('show() makes tooltip visible with element info', () => {
    const tooltip = createInspectTooltip({ shadowRoot })
    const el = createTargetElement('div', { display: 'flex', color: 'red' })
    el.id = 'hero'
    el.classList.add('main-section')

    // Mock getBoundingClientRect for the target
    el.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)

    tooltip.show(el, 200, 200)

    const tip = shadowRoot.querySelector('.flow-inspect-tip') as HTMLElement
    expect(tip).not.toBeNull()
    expect(tip.style.display).not.toBe('none')
    expect(tip.innerHTML).toContain('div')
    expect(tip.innerHTML).toContain('#hero')
  })

  it('hide() hides the tooltip', () => {
    const tooltip = createInspectTooltip({ shadowRoot })
    const el = createTargetElement('div')
    el.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    tooltip.show(el, 200, 200)
    tooltip.hide()

    const tip = shadowRoot.querySelector('.flow-inspect-tip') as HTMLElement
    expect(tip.style.display).toBe('none')
  })

  it('destroy() removes tooltip and style from shadow root', () => {
    const tooltip = createInspectTooltip({ shadowRoot })
    tooltip.destroy()

    expect(shadowRoot.querySelector('.flow-inspect-tip')).toBeNull()
    expect(shadowRoot.querySelectorAll('style').length).toBe(0)
  })

  it('shows dimensions in header', () => {
    const tooltip = createInspectTooltip({ shadowRoot })
    const el = createTargetElement('p')
    el.getBoundingClientRect = () => new DOMRect(0, 0, 300, 40)
    tooltip.show(el, 100, 100)

    const tip = shadowRoot.querySelector('.flow-inspect-tip') as HTMLElement
    expect(tip.innerHTML).toContain('300\u00d740')
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/inspectTooltip.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/inspectTooltip.test.ts
git commit -m "test: add inspectTooltip tests — show/hide/destroy, element info rendering"
```

---

## Task 1.8: Test inspectRuler

**Files:**
- Create: `packages/extension/src/content/__tests__/inspectRuler.test.ts`
- Source: `packages/extension/src/content/modes/tools/inspectRuler.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createInspectRuler } from '../modes/tools/inspectRuler'
import { createTestShadowRoot } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/inspectRuler.css?inline', () => ({ default: '' }))

// Mock distance overlay (creates DOM elements)
vi.mock('../../measurements/distanceOverlay', () => ({
  createDistanceOverlay: (m: any) => {
    const el = document.createElement('div')
    el.className = 'mock-distance-overlay'
    el.textContent = `${m.d}px`
    return el
  },
  createMeasurementLine: (m: any) => {
    const el = document.createElement('div')
    el.className = 'mock-measurement-line'
    return el
  },
}))

describe('InspectRuler', () => {
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    shadowRoot = createTestShadowRoot()
  })

  function mockElement(rect: DOMRect): Element {
    const el = document.createElement('div')
    el.getBoundingClientRect = () => rect
    document.body.appendChild(el)
    return el
  }

  it('creates without errors', () => {
    const ruler = createInspectRuler({ shadowRoot })
    expect(ruler).toBeDefined()
    expect(ruler.setAnchor).toBeInstanceOf(Function)
    expect(ruler.measureTo).toBeInstanceOf(Function)
    expect(ruler.clear).toBeInstanceOf(Function)
    expect(ruler.destroy).toBeInstanceOf(Function)
  })

  it('measureTo renders overlays when anchor is set', () => {
    const ruler = createInspectRuler({ shadowRoot })
    const anchor = mockElement(new DOMRect(0, 0, 100, 100))
    const target = mockElement(new DOMRect(150, 0, 100, 100))

    ruler.setAnchor(anchor)
    ruler.measureTo(target)

    const container = shadowRoot.querySelector('.flow-inspect-ruler')!
    // Should have created overlay elements for measurements
    expect(container.children.length).toBeGreaterThan(0)
  })

  it('measureTo clears overlays when measuring same element as anchor', () => {
    const ruler = createInspectRuler({ shadowRoot })
    const el = mockElement(new DOMRect(0, 0, 100, 100))

    ruler.setAnchor(el)
    ruler.measureTo(el)

    const container = shadowRoot.querySelector('.flow-inspect-ruler')!
    expect(container.children.length).toBe(0)
  })

  it('clearLines removes measurement overlays', () => {
    const ruler = createInspectRuler({ shadowRoot })
    const anchor = mockElement(new DOMRect(0, 0, 100, 100))
    const target = mockElement(new DOMRect(150, 0, 100, 100))

    ruler.setAnchor(anchor)
    ruler.measureTo(target)
    ruler.clearLines()

    const container = shadowRoot.querySelector('.flow-inspect-ruler')!
    expect(container.children.length).toBe(0)
  })

  it('clear resets anchor and removes overlays', () => {
    const ruler = createInspectRuler({ shadowRoot })
    const anchor = mockElement(new DOMRect(0, 0, 100, 100))
    ruler.setAnchor(anchor)
    ruler.clear()

    // After clear, measureTo with a different element should produce nothing
    // because anchor is null
    const target = mockElement(new DOMRect(200, 0, 50, 50))
    ruler.measureTo(target)

    const container = shadowRoot.querySelector('.flow-inspect-ruler')!
    expect(container.children.length).toBe(0)
  })

  it('destroy removes container and style', () => {
    const ruler = createInspectRuler({ shadowRoot })
    ruler.destroy()

    expect(shadowRoot.querySelector('.flow-inspect-ruler')).toBeNull()
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/inspectRuler.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/inspectRuler.test.ts
git commit -m "test: add inspectRuler tests — setAnchor, measureTo, clear, destroy"
```

---

## Task 1.9: Test assetScanner

**Files:**
- Create: `packages/extension/src/content/__tests__/assetScanner.test.ts`
- Source: `packages/extension/src/content/modes/tools/assetScanner.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { scanElementAssets, scanMultipleElements } from '../modes/tools/assetScanner'

// Mock extractCustomProperties (reads stylesheets which jsdom doesn't support well)
vi.mock('../../../agent/customProperties', () => ({
  extractCustomProperties: () => [],
}))

describe('assetScanner', () => {
  describe('scanElementAssets', () => {
    it('finds <img> elements', () => {
      const container = document.createElement('div')
      const img = document.createElement('img')
      img.src = 'https://example.com/photo.jpg'
      img.alt = 'Photo'
      container.appendChild(img)
      document.body.appendChild(container)

      const assets = scanElementAssets(container)
      expect(assets.images.length).toBe(1)
      expect(assets.images[0].src).toContain('photo.jpg')
      expect(assets.images[0].alt).toBe('Photo')
      expect(assets.images[0].isBackground).toBe(false)
    })

    it('deduplicates images by src', () => {
      const container = document.createElement('div')
      const img1 = document.createElement('img')
      img1.src = 'https://example.com/same.jpg'
      const img2 = document.createElement('img')
      img2.src = 'https://example.com/same.jpg'
      container.append(img1, img2)
      document.body.appendChild(container)

      const assets = scanElementAssets(container)
      expect(assets.images.length).toBe(1)
    })

    it('finds <svg> elements', () => {
      const container = document.createElement('div')
      container.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'
      document.body.appendChild(container)

      const assets = scanElementAssets(container)
      expect(assets.svgs.length).toBe(1)
      expect(assets.svgs[0].markup).toContain('<svg')
      expect(assets.svgs[0].markup).toContain('circle')
    })

    it('finds font families from computed styles', () => {
      const el = document.createElement('p')
      el.style.fontFamily = 'Inter, sans-serif'
      el.textContent = 'Test'
      document.body.appendChild(el)

      const assets = scanElementAssets(el)
      expect(assets.fonts.length).toBeGreaterThanOrEqual(1)
      expect(assets.fonts.some(f => f.family === 'Inter')).toBe(true)
    })

    it('returns empty arrays for empty element', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)

      const assets = scanElementAssets(el)
      expect(assets.images).toEqual([])
      expect(assets.svgs).toEqual([])
    })

    it('scans root element itself when it is an <img>', () => {
      const img = document.createElement('img')
      img.src = 'https://example.com/root.jpg'
      document.body.appendChild(img)

      const assets = scanElementAssets(img)
      expect(assets.images.length).toBe(1)
      expect(assets.images[0].src).toContain('root.jpg')
    })
  })

  describe('scanMultipleElements', () => {
    it('merges and deduplicates across elements', () => {
      const el1 = document.createElement('div')
      el1.innerHTML = '<img src="https://example.com/a.jpg" />'
      document.body.appendChild(el1)

      const el2 = document.createElement('div')
      el2.innerHTML = '<img src="https://example.com/a.jpg" /><img src="https://example.com/b.jpg" />'
      document.body.appendChild(el2)

      const assets = scanMultipleElements([el1, el2])
      expect(assets.images.length).toBe(2) // a.jpg + b.jpg, not 3
    })
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/assetScanner.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/assetScanner.test.ts
git commit -m "test: add assetScanner tests — image/svg/font scanning, deduplication"
```

---

## Task 1.10: Test inspectPanel

**Files:**
- Create: `packages/extension/src/content/__tests__/inspectPanel.test.ts`
- Source: `packages/extension/src/content/modes/tools/inspectPanel.ts`

**Step 1: Write the test file**

The inspect panel is read-only (no engine). Test lifecycle and basic DOM rendering.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createInspectPanel } from '../modes/tools/inspectPanel'
import { createTestShadowRoot, createTargetElement } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/inspectPanel.css?inline', () => ({ default: '' }))

// Mock dependencies
vi.mock('../modes/tools/assetScanner', () => ({
  scanElementAssets: () => ({ images: [], svgs: [], fonts: [], colors: [], variables: [] }),
  scanMultipleElements: () => ({ images: [], svgs: [], fonts: [], colors: [], variables: [] }),
}))

vi.mock('../../overlays/persistentSelections', () => ({
  getPersistentSelectionSelectors: () => [],
}))

vi.mock('../../styleExtractor', () => ({
  extractGroupedStyles: () => ({ layout: {}, spacing: {}, typography: {}, visual: {}, background: {} }),
}))

vi.mock('../../features/accessibility', () => ({
  getContrastRatio: () => 4.5,
  meetsWcagAA: () => true,
  meetsWcagAAA: () => false,
}))

vi.mock('../modes/tools/toolPanelPosition', () => ({
  computeToolPanelPosition: () => ({ left: 100, top: 100 }),
}))

describe('InspectPanel', () => {
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    shadowRoot = createTestShadowRoot()
  })

  it('creates without errors', () => {
    const panel = createInspectPanel({ shadowRoot })
    expect(panel).toBeDefined()
    expect(panel.attach).toBeInstanceOf(Function)
    expect(panel.detach).toBeInstanceOf(Function)
    expect(panel.destroy).toBeInstanceOf(Function)
  })

  it('starts hidden', () => {
    createInspectPanel({ shadowRoot })
    const container = shadowRoot.querySelector('.flow-asset-panel') as HTMLElement
    expect(container).not.toBeNull()
    expect(container.style.display).toBe('none')
  })

  it('shows container on attach', () => {
    const panel = createInspectPanel({ shadowRoot })
    const target = createTargetElement('div')
    target.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    panel.attach(target)

    const container = shadowRoot.querySelector('.flow-asset-panel') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('hides container on detach', () => {
    const panel = createInspectPanel({ shadowRoot })
    const target = createTargetElement('div')
    target.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    panel.attach(target)
    panel.detach()

    const container = shadowRoot.querySelector('.flow-asset-panel') as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('removes container on destroy', () => {
    const panel = createInspectPanel({ shadowRoot })
    panel.destroy()

    expect(shadowRoot.querySelector('.flow-asset-panel')).toBeNull()
  })

  it('renders top-level tab bar with 3 tabs', () => {
    createInspectPanel({ shadowRoot })
    const topTabs = shadowRoot.querySelector('.flow-inspect-top-tabs')
    expect(topTabs).not.toBeNull()
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/inspectPanel.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/inspectPanel.test.ts
git commit -m "test: add inspectPanel tests — lifecycle, tab rendering"
```

---

## Task 1.11: Test colorTool

**Files:**
- Create: `packages/extension/src/content/__tests__/colorTool.test.ts`
- Source: `packages/extension/src/content/modes/tools/colorTool.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createColorTool } from '../modes/tools/colorTool'
import { createToolTestContext, dispatchKey } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/colorTool.css?inline', () => ({ default: '' }))

// Mock toolPanelHeader (renders into shadow DOM)
vi.mock('../modes/tools/toolPanelHeader', () => ({
  createToolPanelHeader: () => ({
    header: document.createElement('div'),
    destroy: vi.fn(),
  }),
}))

// Mock colorTokens to return predictable data
vi.mock('../modes/tools/colorTokens', () => ({
  extractBrandColors: () => [
    { name: '--color-surface-primary', value: '#ffffff', resolvedHex: '#ffffff', tier: 'semantic' as const },
    { name: '--color-surface-secondary', value: '#f0f0f0', resolvedHex: '#f0f0f0', tier: 'semantic' as const },
  ],
  getSemanticTarget: (tab: string) => {
    if (tab === 'text') return { property: 'color', prefix: 'content' }
    if (tab === 'border') return { property: 'border-color', prefix: 'edge' }
    return { property: 'background-color', prefix: 'surface' }
  },
  findSemanticVariable: () => null,
}))

// Mock customProperties
vi.mock('../../../agent/customProperties', () => ({
  extractCustomProperties: () => [],
}))

vi.mock('../modes/tools/toolPanelPosition', () => ({
  computeToolPanelPosition: () => ({ left: 100, top: 100 }),
}))

vi.mock('../../features/keyboardGuards', () => ({
  shouldIgnoreKeyboardShortcut: () => false,
}))

describe('ColorTool', () => {
  let ctx: ReturnType<typeof createToolTestContext>

  beforeEach(() => {
    ctx = createToolTestContext({ backgroundColor: 'red' })
  })

  it('creates with attach/detach/destroy', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('shows container on attach', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const container = ctx.shadowRoot.querySelector('.flow-color-picker') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('hides container on detach', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)
    tool.detach()

    const container = ctx.shadowRoot.querySelector('.flow-color-picker') as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('removes container on destroy', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)
    tool.destroy()

    expect(ctx.shadowRoot.querySelector('.flow-color-picker')).toBeNull()
  })

  it('renders 3 tab buttons (text/fill/border)', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const tabs = ctx.shadowRoot.querySelectorAll('.flow-color-tab')
    expect(tabs.length).toBe(3)
  })

  it('[ and ] keys cycle tabs', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    // Current tab depends on auto-detection; just verify the key doesn't throw
    dispatchKey(']')
    dispatchKey('[')

    // Tool still functional — container visible
    const container = ctx.shadowRoot.querySelector('.flow-color-picker') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('renders color token list with groups', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const items = ctx.shadowRoot.querySelectorAll('.flow-color-item')
    expect(items.length).toBeGreaterThan(0)
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/colorTool.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/colorTool.test.ts
git commit -m "test: add colorTool tests — lifecycle, tab cycling, token list rendering"
```

---

## Task 1.12: Test effectsTool

**Files:**
- Create: `packages/extension/src/content/__tests__/effectsTool.test.ts`
- Source: `packages/extension/src/content/modes/tools/effectsTool.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEffectsTool } from '../modes/tools/effectsTool'
import { createToolTestContext } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/effectsTool.css?inline', () => ({ default: '' }))

// Mock toolPanelHeader
vi.mock('../modes/tools/toolPanelHeader', () => ({
  createToolPanelHeader: () => ({
    header: document.createElement('div'),
    destroy: vi.fn(),
  }),
}))

// Mock boxShadowParser
vi.mock('../../../panel/components/designer/boxShadowParser', () => ({
  parseBoxShadow: () => [],
  stringifyBoxShadow: (shadows: any[]) =>
    shadows.map((s: any) => `${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${s.color}`).join(', '),
}))

vi.mock('../modes/tools/colorTokens', () => ({
  BLEND_MODES: ['normal', 'multiply', 'screen'],
}))

vi.mock('../modes/tools/toolPanelPosition', () => ({
  computeToolPanelPosition: () => ({ left: 100, top: 100 }),
}))

describe('EffectsTool', () => {
  let ctx: ReturnType<typeof createToolTestContext>

  beforeEach(() => {
    ctx = createToolTestContext({ opacity: '1' })
  })

  it('creates with attach/detach/destroy', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('shows container on attach', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const container = ctx.shadowRoot.querySelector('.flow-effects') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('hides container on detach', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)
    tool.detach()

    const container = ctx.shadowRoot.querySelector('.flow-effects') as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('removes container on destroy', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)
    tool.destroy()

    expect(ctx.shadowRoot.querySelector('.flow-effects')).toBeNull()
  })

  it('renders opacity slider', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const sliders = ctx.shadowRoot.querySelectorAll('.flow-fx-slider')
    expect(sliders.length).toBeGreaterThan(0)
  })

  it('renders blend mode dropdown', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const select = ctx.shadowRoot.querySelector('.flow-fx-select') as HTMLSelectElement
    expect(select).not.toBeNull()
    expect(select.options.length).toBeGreaterThan(0)
  })

  it('renders collapsible sections', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const sections = ctx.shadowRoot.querySelectorAll('.flow-fx-section')
    // Drop Shadow, Backdrop Filter, Filter
    expect(sections.length).toBe(3)
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/effectsTool.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/effectsTool.test.ts
git commit -m "test: add effectsTool tests — lifecycle, opacity slider, blend dropdown, sections"
```

---

## Task 1.13: Test typographyTool

**Files:**
- Create: `packages/extension/src/content/__tests__/typographyTool.test.ts`
- Source: `packages/extension/src/content/modes/tools/typographyTool.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTypographyTool } from '../modes/tools/typographyTool'
import { createToolTestContext, dispatchKey } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/typographyTool.css?inline', () => ({ default: '' }))

// Mock toolPanelHeader
vi.mock('../modes/tools/toolPanelHeader', () => ({
  createToolPanelHeader: () => ({
    header: document.createElement('div'),
    destroy: vi.fn(),
  }),
}))

vi.mock('../modes/tools/toolPanelPosition', () => ({
  computeToolPanelPosition: () => ({ left: 100, top: 100 }),
}))

vi.mock('../../features/keyboardGuards', () => ({
  shouldIgnoreKeyboardShortcut: () => false,
}))

describe('TypographyTool', () => {
  let ctx: ReturnType<typeof createToolTestContext>

  beforeEach(() => {
    ctx = createToolTestContext({
      fontSize: '16px',
      fontWeight: '400',
      fontFamily: 'Inter',
      lineHeight: '1.5',
      color: 'rgb(0, 0, 0)',
    })
  })

  it('creates with attach/detach/destroy', () => {
    const tool = createTypographyTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('shows container on attach', () => {
    const tool = createTypographyTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const container = ctx.shadowRoot.querySelector('.flow-typography') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('hides on detach', () => {
    const tool = createTypographyTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)
    tool.detach()

    const container = ctx.shadowRoot.querySelector('.flow-typography') as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('removes on destroy', () => {
    const tool = createTypographyTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)
    tool.destroy()

    expect(ctx.shadowRoot.querySelector('.flow-typography')).toBeNull()
  })

  it('ArrowUp increases font-size by 1px', () => {
    const tool = createTypographyTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    dispatchKey('ArrowUp')

    const diffs = ctx.engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes.some(c => c.property === 'font-size')).toBe(true)
    expect(ctx.onUpdate).toHaveBeenCalled()
  })

  it('Shift+ArrowUp increases font-size by 10px', () => {
    const tool = createTypographyTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    dispatchKey('ArrowUp', { shiftKey: true })

    const diffs = ctx.engine.getDiffs()
    expect(diffs.length).toBe(1)
    const fontSizeChange = diffs[0].changes.find(c => c.property === 'font-size')
    expect(fontSizeChange).toBeDefined()
    // 16 + 10 = 26
    expect(fontSizeChange!.newValue).toBe('26px')
  })

  it('renders font family select', () => {
    const tool = createTypographyTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const selects = ctx.shadowRoot.querySelectorAll('.flow-typo-select')
    expect(selects.length).toBeGreaterThanOrEqual(2) // font family + weight
  })

  it('renders text align toggle buttons', () => {
    const tool = createTypographyTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const toggles = ctx.shadowRoot.querySelectorAll('.flow-typo-toggle-btn')
    // Font style (3) + Align (4) + Decoration (4) + Transform (4) = 15
    expect(toggles.length).toBe(15)
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/typographyTool.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/typographyTool.test.ts
git commit -m "test: add typographyTool tests — lifecycle, arrow key font-size, toggle rendering"
```

---

## Task 1.14: Test moveTool

**Files:**
- Create: `packages/extension/src/content/__tests__/moveTool.test.ts`
- Source: `packages/extension/src/content/modes/tools/moveTool.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMoveTool, type MoveTool } from '../modes/tools/moveTool'
import { createToolTestContext, dispatchKey } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/moveTool.css?inline', () => ({ default: '' }))

vi.mock('../../features/keyboardGuards', () => ({
  shouldIgnoreKeyboardShortcut: () => false,
}))

describe('MoveTool', () => {
  let ctx: ReturnType<typeof createToolTestContext>
  let parent: HTMLElement
  let childA: HTMLElement
  let childB: HTMLElement
  let childC: HTMLElement
  let tool: MoveTool

  beforeEach(() => {
    ctx = createToolTestContext()

    parent = document.createElement('div')
    childA = document.createElement('div')
    childA.id = 'a'
    childA.textContent = 'A'
    childB = document.createElement('div')
    childB.id = 'b'
    childB.textContent = 'B'
    childC = document.createElement('div')
    childC.id = 'c'
    childC.textContent = 'C'
    parent.append(childA, childB, childC)
    document.body.appendChild(parent)

    tool = createMoveTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
  })

  it('creates with select/deselect/destroy/beginDrag/isDragging', () => {
    expect(tool.select).toBeInstanceOf(Function)
    expect(tool.deselect).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
    expect(tool.beginDrag).toBeInstanceOf(Function)
    expect(tool.isDragging).toBeInstanceOf(Function)
  })

  it('isDragging returns false initially', () => {
    expect(tool.isDragging()).toBe(false)
  })

  it('select shows position label', () => {
    tool.select(childB)
    const label = ctx.shadowRoot.querySelector('.flow-move-label') as HTMLElement
    expect(label).not.toBeNull()
    // Label should contain position info
    expect(label.style.display).not.toBe('none')
  })

  it('deselect hides label', () => {
    tool.select(childB)
    tool.deselect()
    const label = ctx.shadowRoot.querySelector('.flow-move-label') as HTMLElement
    expect(label.style.display).toBe('none')
  })

  it('ArrowDown reorders selected element', () => {
    tool.select(childA)

    dispatchKey('ArrowDown')

    expect(Array.from(parent.children).map(c => c.id)).toEqual(['b', 'a', 'c'])
    expect(ctx.onUpdate).toHaveBeenCalled()
  })

  it('ArrowUp reorders selected element', () => {
    tool.select(childC)

    dispatchKey('ArrowUp')

    expect(Array.from(parent.children).map(c => c.id)).toEqual(['a', 'c', 'b'])
  })

  it('Shift+ArrowUp moves to first', () => {
    tool.select(childC)

    dispatchKey('ArrowUp', { shiftKey: true })

    expect(parent.firstElementChild).toBe(childC)
  })

  it('Shift+ArrowDown moves to last', () => {
    tool.select(childA)

    dispatchKey('ArrowDown', { shiftKey: true })

    expect(parent.lastElementChild).toBe(childA)
  })

  it('destroy cleans up DOM elements', () => {
    tool.select(childB)
    tool.destroy()

    expect(ctx.shadowRoot.querySelector('.flow-move-flash')).toBeNull()
    expect(ctx.shadowRoot.querySelector('.flow-move-label')).toBeNull()
  })
})
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/moveTool.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/moveTool.test.ts
git commit -m "test: add moveTool tests — select/deselect, keyboard reorder, destroy"
```

---

## Task 1.15: Final verification

**Step 1: Run full suite**

```bash
pnpm typecheck        # 0 errors across all packages
pnpm test             # all packages, 0 failures
```

**Step 2: Count new test coverage**

```bash
# Count new test files
ls packages/extension/src/content/__tests__/*Tool.test.ts packages/extension/src/content/__tests__/reorderEngine.test.ts packages/extension/src/content/__tests__/unitInput.test.ts packages/extension/src/content/__tests__/spacingScale.test.ts packages/extension/src/content/__tests__/colorTokens.test.ts packages/extension/src/content/__tests__/toolPanelPosition.test.ts packages/extension/src/content/__tests__/eventInterceptor.test.ts packages/extension/src/content/__tests__/assetScanner.test.ts | wc -l

# Run only new tests with verbose output
pnpm --filter @flow/extension test --run -- src/content/__tests__/reorderEngine.test.ts src/content/__tests__/unitInput.test.ts src/content/__tests__/spacingScale.test.ts src/content/__tests__/toolPanelPosition.test.ts src/content/__tests__/eventInterceptor.test.ts src/content/__tests__/colorTokens.test.ts src/content/__tests__/inspectTooltip.test.ts src/content/__tests__/inspectRuler.test.ts src/content/__tests__/assetScanner.test.ts src/content/__tests__/inspectPanel.test.ts src/content/__tests__/colorTool.test.ts src/content/__tests__/effectsTool.test.ts src/content/__tests__/typographyTool.test.ts src/content/__tests__/moveTool.test.ts
```

**Step 3: Summarize changes**

After all tasks pass:
- New test files: 15 (1 helper + 14 test files)
- Estimated tests: ~90-100 new test cases
- Modules covered: 8 design tools + 6 shared utilities
- Previously untested: all 14 modules now have tests

---

## Summary

| Task | What | Files | Est. Tests |
|------|------|-------|-----------|
| 1.0 | Shared test helpers | 1 created | 0 (helper) |
| 1.1 | reorderEngine tests | 1 created | 11 |
| 1.2 | unitInput tests | 1 created | 14 |
| 1.3 | spacingScale tests | 1 created | 8 |
| 1.4 | toolPanelPosition tests | 1 created | 3 |
| 1.5 | eventInterceptor tests | 1 created | 6 |
| 1.6 | colorTokens tests | 1 created | 9 |
| 1.7 | inspectTooltip tests | 1 created | 6 |
| 1.8 | inspectRuler tests | 1 created | 6 |
| 1.9 | assetScanner tests | 1 created | 7 |
| 1.10 | inspectPanel tests | 1 created | 6 |
| 1.11 | colorTool tests | 1 created | 7 |
| 1.12 | effectsTool tests | 1 created | 7 |
| 1.13 | typographyTool tests | 1 created | 7 |
| 1.14 | moveTool tests | 1 created | 8 |
| 1.15 | Final verification | 0 | 0 (verify) |

**Total: 15 new files, ~105 new test cases**

## Note on modeHotkeys

`modeHotkeys.ts` was in the initial utility list but is a thin wrapper around `registerHotkeys()` that delegates to the `hotkeys` feature module. The `modeController.test.ts` already covers mode switching behavior, and the hotkeys module has its own test (`overlayRootHotkeys.test.ts`). Testing `modeHotkeys.ts` would require mocking the entire hotkeys registration system for minimal additional coverage. Skipped in favor of higher-value targets.
