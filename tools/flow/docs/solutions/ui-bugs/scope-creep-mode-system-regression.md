---
title: Scope Creep During Tool Wiring Caused Mode System Regression
category: ui-bugs
date: 2026-02-07
tags: [scope-creep, regression, mode-system, toolbar, zustand, type-errors, build-cache, wxt, partial-implementation]
---

# Scope Creep During Tool Wiring Caused Mode System Regression

## Symptom

After wiring 4 keyboard tools (position, spacing, flex, move) into `content.ts`, the toolbar regressed to an older UI state: design mode appeared disabled, sub-mode grid did not render, and the mode controller was disconnected from the on-page toolbar. User report: "it basically looks like you reverted it to the UI version from 1-2 days ago."

## Investigation

1. The 4 tool imports and wiring compiled without issues — the tool wiring itself was correct.
2. During `typecheck`, 36 pre-existing errors were visible. Three were "fixed" as part of the same task:
   - Removed `connectToolbarToModeSystem` (didn't exist in toolbar.ts yet — planned but unimplemented)
   - Removed `cleanupToolbarMode()` from the disconnect handler
   - Changed `initMutationMessageHandler(port, unifiedMutationEngine)` to `initMutationMessageHandler(port)` (signature mismatch)
3. Added `export * from './types/modes'` to `@flow/shared` index to resolve 21 type errors — this caused the build to **succeed for the first time** since the mode system was added.
4. The new successful build exposed all remaining broken wiring in the mode system pipeline.

## Root Cause

A chain of three compounding mistakes:

**1. Fixing the shared modes export triggered a new build.**
The build had been failing since the mode system was added (`DESIGN_SUB_MODES` not exported from `@flow/shared`). The user was running an **older cached build** that predated the mode system code. Adding the export made the build succeed, producing a new bundle that included all the partially-wired mode system code.

**2. Removing a planned-but-unimplemented function reference.**
`connectToolbarToModeSystem` was called in `content.ts` but not yet implemented in `toolbar.ts`. Instead of implementing it or leaving it as a known type error, it was deleted — disconnecting the on-page toolbar from the mode controller entirely.

**3. `ModeSlice` was never integrated into the Zustand store.**
The mode slice existed (`modeSlice.ts`) but was missing from:
- `AppState` interface (didn't extend `ModeSlice`)
- `appStore.ts` (didn't include `createModeSlice`)
- `slices/index.ts` (didn't export `createModeSlice`)
- `contentBridge.ts` (didn't export `requestModeChange` / `requestSubModeChange`)

This meant `ModeToolbar.tsx` crashed at runtime accessing `s.mode`, `s.requestModeChange`, `s.requestSubModeChange` — none of which existed on `AppState`.

## Solution

Seven files fixed to complete the mode system wiring:

```typescript
// 1. packages/shared/src/messages.ts — Add message types
export interface PanelSetModeMessage {
  type: 'panel:set-mode';
  payload: { mode: string };
}
export interface PanelSetSubModeMessage {
  type: 'panel:set-sub-mode';
  payload: { subMode: string };
}
// Add both to PanelToBackgroundMessage union

// 2. packages/extension/src/panel/api/contentBridge.ts — Add bridge functions
export function requestModeChange(mode: string): void {
  sendToContent({ type: "panel:set-mode", payload: { mode } });
}
export function requestSubModeChange(subMode: string): void {
  sendToContent({ type: "panel:set-sub-mode", payload: { subMode } });
}

// 3. packages/extension/src/panel/stores/slices/index.ts — Export the slice
export { createModeSlice } from "./modeSlice";
export type { ModeSlice } from "./modeSlice";

// 4. packages/extension/src/panel/stores/types.ts — Add to AppState
import type { ModeSlice } from "./slices/modeSlice";
// Add ModeSlice to AppState extends list

// 5. packages/extension/src/panel/stores/appStore.ts — Add to store composition
import { createModeSlice } from "./slices";
// Add ...createModeSlice(...args) to store creator

// 6. packages/extension/src/content/ui/toolbar.ts — Implement the bridge function
export function connectToolbarToModeSystem(
  _setTopLevel: (mode: TopLevelMode) => void,
  _setDesignSubMode: (subMode: DesignSubMode) => void,
  subscribe: (listener: (state: ModeState) => void) => () => void,
): () => void {
  const modeToButton: Record<string, string> = { /* mapping */ };
  const unsubscribe = subscribe((state) => {
    for (const [id, btn] of buttons) {
      const isActive = modeToButton[state.topLevel] === id;
      btn.classList.toggle('active', isActive);
    }
  });
  return unsubscribe;
}

// 7. packages/extension/src/entrypoints/content.ts — Restore the call
const cleanupToolbarMode = connectToolbarToModeSystem(
  modeController.setTopLevel,
  modeController.setDesignSubMode,
  modeController.subscribe,
);
```

## Prevention

1. **Never fix pre-existing type errors in the same PR as an unrelated feature.** Note them, file them, move on. Fixing them changes build output and can expose latent issues.
2. **Never delete a function call because the function doesn't exist yet.** If a reference is to a planned-but-unimplemented function, implement it or leave it as a known error. Deleting the call silently removes intended behavior.
3. **Check if the build was previously failing before "fixing" it.** If the build was broken, the user is running a cached version. A new successful build may ship incomplete code that was hidden behind the build failure.
4. **Zustand slice integration checklist:** When adding a new slice, verify all 5 integration points:
   - [ ] Slice file exists with `StateCreator` typing
   - [ ] Exported from `slices/index.ts`
   - [ ] Added to `AppState` interface in `types.ts`
   - [ ] Spread into store creator in `appStore.ts`
   - [ ] Bridge functions exist in `contentBridge.ts` (if slice sends messages to content script)

## Related

- `docs/plans/2026-02-06-flow-phase1-visbug-port.md` — The plan being executed when this happened
- `packages/extension/src/panel/stores/slices/modeSlice.ts` — The slice that was missing from the store
- `packages/extension/src/content/modes/modeController.ts` — The content-side mode state machine
