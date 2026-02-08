---
title: Closed Shadow DOM Event Interception and elementFromPoint
category: integration-issues
date: 2026-02-06
tags: [shadow-dom, closed-shadow, pointer-events, elementFromPoint, event-interception, z-index, chrome-extension, content-script, panel, cross-package-types, visbug]
---

# Closed Shadow DOM Event Interception and elementFromPoint

## Symptom

Three related issues discovered during mode system implementation (Wave 3):

1. **TypeScript error**: `Cannot find module '../../content/modes/types'` — panel store slice importing types from the content script directory, which the panel's tsconfig can't resolve.

2. **z-index collision**: Event interceptor overlay (z-index 2147483647) placed in a *different* shadow DOM host (z-index 2147483646) than the highlight overlay (z-index 2147483647), causing unpredictable stacking.

3. **Event black hole**: `deepElementFromPoint()` returned Flow's own overlay host instead of the page element underneath, because the interceptor's `pointer-events: auto` inside a closed shadow DOM makes `document.elementFromPoint()` return the shadow host.

## Investigation

1. **Cross-package import**: Panel code at `src/panel/stores/slices/modeSlice.ts` imported from `../../content/modes/types`. Panel and content directories have separate module resolution — panel can't reach content paths via relative imports.

2. **z-index**: Two separate shadow DOM hosts:
   - `flow-overlay` (z-index 2147483647) — highlight + label
   - `flow-overlay-root` (z-index 2147483646) — interceptor via `ensureOverlayRoot()`

   The interceptor rendered *behind* the highlight host. Hit-testing returned the wrong shadow host.

3. **elementFromPoint in closed shadow DOM**: `document.elementFromPoint(x, y)` considers hit-testing from the rendered composited tree, including elements inside closed shadows. But it *returns* the shadow host (not the internal element) because closed shadows hide their internals from the DOM API. So when the interceptor has `pointer-events: auto`, `elementFromPoint` returns the shadow host, which the existing `isFlowElement` check filters out — resulting in a no-op click handler.

## Root Cause

Three design mistakes:

1. **Types in wrong package**: Mode types defined only in `src/content/modes/types.ts`. Both panel and content need these types, but they exist in different compilation contexts within the extension.

2. **Interceptor in wrong shadow root**: Using `ensureOverlayRoot()` placed the interceptor in a separate shadow host with a lower z-index than the highlight overlay's host.

3. **No peek-through for elementFromPoint**: `elementFromPoint` can't "see through" a closed shadow's `pointer-events: auto` child. The interceptor blocked all point queries even though it was meant to be transparent to selection logic.

## Solution

### Fix 1: Move shared types to @flow/shared

Create `packages/shared/src/types/modes.ts` with all mode types, configs, and utility functions. Re-export from the content script location for backward compatibility:

```typescript
// packages/extension/src/content/modes/types.ts
export {
  type TopLevelMode,
  type DesignSubMode,
  type ModeState,
  type ModeConfig,
  type DesignSubModeConfig,
  TOP_LEVEL_MODES,
  DESIGN_SUB_MODES,
  interceptsEvents,
  showsHoverOverlay,
  getModeByHotkey,
  getDesignSubModeByKey,
} from '@flow/shared';
```

Panel imports from `@flow/shared` directly:

```typescript
// packages/extension/src/panel/stores/slices/modeSlice.ts
import type { TopLevelMode, DesignSubMode, ModeState } from '@flow/shared';
```

### Fix 2: Interceptor in same shadow root

Refactor `enableEventInterception()` to accept a `ShadowRoot` parameter:

```typescript
export function enableEventInterception(shadowRoot: ShadowRoot): void {
  if (interceptorElement) return;
  interceptorElement = document.createElement('div');
  interceptorElement.style.cssText = `
    position: fixed;
    inset: 0;
    cursor: crosshair;
    pointer-events: auto;
  `;
  // No z-index needed — host z-index controls stacking
  shadowRoot.appendChild(interceptorElement);
}
```

In content.ts, pass the same `shadow` root used for the highlight:

```typescript
enableEventInterception(shadow); // same shadow root as highlight overlay
```

### Fix 3: Peek-through pattern for elementFromPoint

Temporarily disable the interceptor's pointer-events before calling `elementFromPoint`, then restore:

```typescript
function deepElementFromPoint(x: number, y: number): Element | null {
  const interceptor = getInterceptorElement();
  if (interceptor) interceptor.style.pointerEvents = 'none';

  let el = document.elementFromPoint(x, y);

  if (interceptor) interceptor.style.pointerEvents = 'auto';

  if (!el) return null;
  while (el?.shadowRoot) {
    const deeper = el.shadowRoot.elementFromPoint(x, y);
    if (!deeper || deeper === el) break;
    el = deeper;
  }
  return el;
}
```

This works because:
- We hold a direct JS reference to the interceptor element (from `getInterceptorElement()`)
- Even inside a closed shadow DOM, direct references can still set style properties
- With `pointer-events: none` on the interceptor, plus the host's own `pointer-events: none`, the entire overlay becomes transparent to hit-testing
- `document.elementFromPoint` then returns the actual page element underneath

## Prevention

1. **Rule: Types shared between panel and content script must live in `@flow/shared`**. The panel and content script are separate compilation/execution contexts in a Chrome extension. Use a re-export proxy in the content script directory for ergonomic imports.

2. **Rule: All Flow overlay elements must share a single shadow DOM host** (or document the z-index ordering). Multiple shadow hosts with different z-indices create stacking ambiguity.

3. **Rule: Any full-viewport overlay with `pointer-events: auto` must implement the peek-through pattern** — temporarily disable pointer-events before `elementFromPoint`, restore after. This is the standard VisBug approach for tool overlays that need to intercept events but still query elements beneath them.

4. **Pattern: `isFlowElement()` helper** — centralize overlay exclusion checks. Cover both tag names (`flow-overlay`, `flow-overlay-root`) and direct host reference checks.

## Related

- `docs/solutions/integration-issues/chrome-extension-panel-content-message-routing.md` — related panel/content boundary issue
- `packages/shared/src/types/modes.ts` — canonical mode type definitions
- `packages/extension/src/content/modes/eventInterceptor.ts` — interceptor implementation
- `packages/extension/src/entrypoints/content.ts` — deepElementFromPoint with peek-through
