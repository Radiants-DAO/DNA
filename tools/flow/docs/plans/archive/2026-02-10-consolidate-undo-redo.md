# Consolidate Undo/Redo — Implementation Plan

> **Status: COMPLETE** — Single undo/redo stack lives in `unifiedMutationEngine`. `designerChangesSlice` references folded into `mutationSlice`. Content-side undo/redo wired via `mutationMessageHandler.ts`.

**Goal:** Kill three disconnected undo/redo systems, fold `designerChangesSlice` into `mutationSlice`, and wire Cmd+Z / Cmd+Shift+Z to the unified engine for both panel and design mode on the inspected page.

**Architecture:** After Sub-Plan 1, the content-side `unifiedMutationEngine` owns the single undo/redo stack and broadcasts `mutation:state` events. This plan deletes three dead systems (`editingSlice`, `useUndoRedo`, `designerChangesSlice`), wires keyboard shortcuts (panel + content script in design/annotate modes), and updates all consumers that referenced `designerChanges` to use `mutationDiffs` instead.

**Tech Stack:** TypeScript, Zustand, Chrome Extension MV3 (content script keyboard interception), Vitest

**Depends On:** Sub-Plan 1 (Unify Mutation Engine) must be completed first.

---

## Prior Art & Conventions

- **Dead code audit:** `editingSlice.ts` has zero external callers (verified via grep)
- **`useUndoRedo.ts`** has zero external callers — exported from `hooks/index.ts` but never imported elsewhere
- **`DesignerChange`** type: `packages/shared/src/types/designer.ts` — has `section` field not present in `MutationDiff`
- **`designerChanges` consumers:** `promptCompiler.ts`, `promptOutputSlice.ts`, `usePromptAutoCompile.ts`, `useSessionAutoSave.ts`, `ContextOutputPanel.tsx`, `sidecarSync.ts`, `sessionPersistence.ts`

## Key Structural Difference: `DesignerChange` vs `MutationDiff`

```typescript
// DesignerChange (being killed)
{ id, componentName, sourceFile, sourceLine, selector, section, changes: PropertyMutation[], timestamp: number }

// MutationDiff (keeper)
{ id, element: { selector, componentName?, sourceFile?, sourceLine? }, type, changes: PropertyMutation[], timestamp: string }
```

Both use `PropertyMutation[]` for changes. `DesignerChange.section` maps directly to `MutationDiff.type` — we just expand the union.

---

### Task 1: Delete `editingSlice.ts` (Zero Callers)

**Files:**
- Delete: `packages/extension/src/panel/stores/slices/editingSlice.ts`
- Modify: `packages/extension/src/panel/stores/slices/index.ts` (lines 12, 31)
- Modify: `packages/extension/src/panel/stores/types.ts` (lines 435, 457, 477, 488)
- Modify: `packages/extension/src/panel/stores/appStore.ts` (lines 17, 44, 87)

**Step 1: Verify zero callers one more time**

Run: `grep -r "pendingStyleEdits\|activeRadflowId\|selectedComponentEntry\|pushStyleChange\|undoStyleChange\|redoStyleChange\|canUndoStyle\|canRedoStyle\|addStyleEdit\|getEditsForComponent\|selectById\|addToMultiSelect\|removeFromMultiSelect\|toggleMultiSelect\|clearMultiSelect\|setMultiSelectEnabled\|getSelectedSource\|getSelectedFallbackSelectors\|isSelected" packages/extension/src/panel --include="*.tsx" --include="*.ts" | grep -v editingSlice | grep -v types.ts | grep -v index.ts | grep -v appStore.ts`

Expected: Zero results

**Step 2: Remove from `slices/index.ts`**

Delete line 12: `export { createEditingSlice } from "./editingSlice";`
Delete line 31: `export type { EditingSlice, StyleEdit } from "./editingSlice";`

**Step 3: Remove from `types.ts`**

Delete line 435: `import type { EditingSlice, StyleEdit } from "./slices/editingSlice";`
Remove `EditingSlice` from the `AppState extends` list (line 457).
Remove `EditingSlice` and `StyleEdit` from the re-export block (lines 477, 488).

**Step 4: Remove from `appStore.ts`**

Delete line 17: `createEditingSlice,` from imports.
Delete line 44: `...createEditingSlice(...args),` from store creation.
Delete line 87: `EditingSlice,` from type re-exports.
Delete line 118: `StyleEdit,` from type re-exports.

**Step 5: Delete the file**

```bash
rm packages/extension/src/panel/stores/slices/editingSlice.ts
```

**Step 6: Build to verify**

Run: `cd packages/extension && pnpm build`

Expected: Clean build (zero errors)

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: delete editingSlice — zero external callers, all dead Flow 0 code

Removes 325 lines of disconnected undo/redo stacks, style edit accumulation,
and component selection state that was never consumed by any panel component."
```

---

### Task 2: Delete `useUndoRedo.ts` (Zero Callers)

**Files:**
- Delete: `packages/extension/src/panel/hooks/useUndoRedo.ts`
- Modify: `packages/extension/src/panel/hooks/index.ts` (lines 40-41)

**Step 1: Remove from `hooks/index.ts`**

Delete lines 40-41:
```typescript
// DELETE: export { useUndoRedo } from "./useUndoRedo";
// DELETE: export type { StyleChange, UseUndoRedoOptions } from "./useUndoRedo";
```

Note: `StyleChange` is also defined in `types.ts` (it's a shared type used by `editingSlice` which is now gone). Verify no remaining references:

Run: `grep -r "StyleChange" packages/extension/src --include="*.ts" --include="*.tsx" | grep -v useUndoRedo | grep -v editingSlice | grep -v node_modules`

If references remain in `types.ts`, remove them too.

**Step 2: Delete the file**

```bash
rm packages/extension/src/panel/hooks/useUndoRedo.ts
```

**Step 3: Build to verify**

Run: `cd packages/extension && pnpm build`

Expected: Clean build

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete useUndoRedo hook — 191 lines of disconnected panel-side undo/redo

Replaced by unified engine undo/redo via mutation:undo/mutation:redo messages."
```

---

### Task 3: Fold `designerChangesSlice` into `mutationSlice`

**Files:**
- Delete: `packages/extension/src/panel/stores/slices/designerChangesSlice.ts`
- Modify: `packages/extension/src/panel/stores/slices/index.ts` (remove exports)
- Modify: `packages/extension/src/panel/stores/types.ts` (remove from AppState)
- Modify: `packages/extension/src/panel/stores/appStore.ts` (remove from store creation)
- Modify: `packages/extension/src/panel/hooks/usePromptAutoCompile.ts` (remove designerChanges)
- Modify: `packages/extension/src/panel/hooks/useSessionAutoSave.ts` (remove designerChanges)
- Modify: `packages/extension/src/panel/components/ContextOutputPanel.tsx` (remove designerChanges count)
- Modify: `packages/extension/src/panel/stores/slices/promptOutputSlice.ts` (remove designerChanges gathering)
- Modify: `packages/extension/src/services/promptCompiler.ts` (merge designer changes into mutations section)
- Modify: `packages/extension/src/services/sidecarSync.ts` (remove designerChanges from payload)
- Modify: `packages/extension/src/services/sessionPersistence.ts` (remove designerChanges)
- Modify: `packages/extension/src/panel/hooks/useSessionRestore.ts` (remove designerChanges)

This is the biggest task — many consumers reference `designerChanges`. The key insight: after Sub-Plan 1, ALL design tool mutations already flow through the unified engine → `mutationSlice.mutationDiffs`. The `designerChanges` accumulator is a redundant parallel.

**Step 1: Remove `designerChangesSlice` from store wiring**

In `slices/index.ts`, delete:
```typescript
// DELETE: export { createDesignerChangesSlice } from "./designerChangesSlice";
// DELETE: export type { DesignerChangesSlice } from "./designerChangesSlice";
```

In `types.ts`, delete:
```typescript
// DELETE: import type { DesignerChangesSlice } from "./slices/designerChangesSlice";
```
Remove `DesignerChangesSlice` from `AppState extends` list and re-exports.

In `appStore.ts`, delete:
```typescript
// DELETE: createDesignerChangesSlice,  (import)
// DELETE: ...createDesignerChangesSlice(...args),  (store creation)
// DELETE: DesignerChangesSlice,  (type re-export)
```

**Step 2: Update `promptCompiler.ts` — merge into mutations section**

Remove `designerChanges` from `CompilerInput`:
```typescript
export interface CompilerInput {
  annotations: Annotation[];
  textEdits: TextEdit[];
  mutationDiffs: MutationDiff[];
  // REMOVED: designerChanges: DesignerChange[];
  animationDiffs: AnimationDiff[];
  promptSteps: PromptStep[];
}
```

Remove the `compileDesignerChanges` method and its call in `compile()`.
Remove `DesignerChange` import.
Remove designer changes from the source file counting loop.

The unified engine's net diffs already contain everything designer changes had.

**Step 3: Update `promptOutputSlice.ts`**

Remove `designerChanges` from the state gathering in `compilePrompt()`:
```typescript
// Before:
designerChanges: state.designerChanges ?? [],
// After: remove this line entirely
```

**Step 4: Update `usePromptAutoCompile.ts`**

Remove:
```typescript
// DELETE: const designerChanges = useAppStore((s) => s.designerChanges);
```
Remove from `totalItems` calculation and `useEffect` deps array.

**Step 5: Update `useSessionAutoSave.ts`**

Remove:
```typescript
// DELETE: const designerChanges = useAppStore((s) => s.designerChanges);
```
Remove `designerChanges` from the saved payload and deps array.

**Step 6: Update `ContextOutputPanel.tsx`**

Remove:
```typescript
// DELETE: const designerChanges = useAppStore((s) => s.designerChanges?.length ?? 0);
```
Remove from `totalItems` calculation.

**Step 7: Update `sidecarSync.ts`**

Remove `designerChanges` from the session payload type and the `pushSessionToSidecar` function.

**Step 8: Update `sessionPersistence.ts`**

Remove `designerChanges` from `SessionSnapshot` type.

**Step 9: Update `useSessionRestore.ts`**

Remove `designerChanges` from restore logic.

**Step 10: Update test files**

In `packages/extension/src/services/__tests__/promptCompiler.test.ts`, remove `designerChanges: []` from all test inputs.
In `packages/extension/src/services/__tests__/sessionExport.test.ts`, remove `designerChanges: []`.

**Step 11: Delete the file**

```bash
rm packages/extension/src/panel/stores/slices/designerChangesSlice.ts
```

**Step 12: Build and run tests**

Run: `cd packages/extension && pnpm build && npx vitest run`

Expected: Clean build, all tests pass

**Step 13: Commit**

```bash
git add -A
git commit -m "refactor: fold designerChangesSlice into mutationSlice

All design tool mutations now flow through unifiedMutationEngine → mutationSlice.
Removes redundant parallel accumulator. Updates promptCompiler, sidecarSync,
session persistence, and all panel hooks that referenced designerChanges."
```

---

### Task 4: Wire Cmd+Z / Cmd+Shift+Z in Panel

**Files:**
- Modify: `packages/extension/src/entrypoints/panel/Panel.tsx`

**Step 1: Add keyboard shortcut handler**

Add a `useEffect` in `Panel.tsx` that listens for Cmd+Z / Cmd+Shift+Z:

```typescript
// In Panel.tsx, after existing hooks
const selectedSelector = useAppStore((s) => s.selectedElement?.selector ?? null);
const activeTabId = useAppStore((s) => s.activeTabId);
const { undo, redo } = useMutationBridge({
  selector: selectedSelector,
  tabId: activeTabId,
});

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't intercept when typing in inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [undo, redo]);
```

Note: keep one explicit owner for undo/redo in `Panel.tsx` (the `useMutationBridge` return value). Do not read `s.undo` / `s.redo` from Zustand unless those actions are explicitly defined in store types and wired in store creation.

**Step 2: Verify undo/redo is exposed from the bridge**

Confirm that `useMutationBridge` (updated in Sub-Plan 1) exposes `undo()` and `redo()`, then use those closures directly in the keydown effect. If another component needs these actions, pass them down explicitly rather than relying on implicit store fields.

**Step 3: Build and verify**

Run: `cd packages/extension && pnpm build`

**Step 4: Commit**

```bash
git add packages/extension/src/entrypoints/panel/Panel.tsx
git commit -m "feat: wire Cmd+Z / Cmd+Shift+Z to unified engine in panel

Keyboard shortcuts send mutation:undo/mutation:redo to content script.
Skips interception when focus is in input/textarea/contentEditable."
```

---

### Task 5: Wire Cmd+Z in Content Script (Design/Annotate Modes)

**Files:**
- Modify: `packages/extension/src/entrypoints/content.ts`

**Step 1: Add keyboard listener for undo/redo in design/annotate modes**

In `content.ts`, after the mode system initialization (~line 157), add a keyboard listener that intercepts Cmd+Z when in design or annotate mode:

```typescript
// Undo/redo keyboard shortcuts in design/annotate modes
const handleUndoRedoKeydown = (e: KeyboardEvent) => {
  const currentMode = modeController.getState().topLevel;
  if (currentMode !== 'design' && currentMode !== 'annotate') return;

  // Don't intercept when typing in contentEditable (text edit mode)
  const target = e.target as HTMLElement;
  if (target.isContentEditable) return;

  const isMeta = e.metaKey || e.ctrlKey;
  if (isMeta && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey) {
      unifiedMutationEngine.redo();
    } else {
      unifiedMutationEngine.undo();
    }
    // State broadcast handled by engine.subscribe → debounced mutation:state
  }
};

document.addEventListener('keydown', handleUndoRedoKeydown, true);
```

The `true` capture phase ensures we get the event before the page's own Cmd+Z handler.

**Step 2: Build and verify**

Run: `cd packages/extension && pnpm build`

**Step 3: Manual test**

1. Open extension → enter design mode (press `d`)
2. Select element → change color
3. Press Cmd+Z on the page → color reverts
4. Press Cmd+Shift+Z → color re-applies
5. Exit design mode (press `Escape`) → Cmd+Z should NOT be intercepted (normal browser undo)

**Step 4: Commit**

```bash
git add packages/extension/src/entrypoints/content.ts
git commit -m "feat: wire Cmd+Z / Cmd+Shift+Z on inspected page in design/annotate modes

Content script intercepts undo/redo shortcuts in capture phase when
design or annotate mode is active. Falls through to normal behavior otherwise."
```

---

### Task 6: Final Verification

**Step 1: Build everything**

```bash
cd packages/extension && pnpm build
```

**Step 2: Run all tests**

```bash
cd packages/extension && npx vitest run
```

**Step 3: Verify no remaining references to deleted code**

```bash
grep -r "editingSlice\|useUndoRedo\|designerChangesSlice\|DesignerChangesSlice\|createEditingSlice\|createDesignerChangesSlice" packages/extension/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__
```

Expected: Zero results (or only comments in `unifiedMutationEngine.ts` audit notes)

**Step 4: Count lines removed**

```bash
# Should be ~548 lines removed (325 + 191 + 32)
```

**Step 5: Commit**

```bash
git add -A
git commit -m "test: verify consolidated undo/redo end-to-end

Deleted 548 lines of dead code across 3 files.
Single undo/redo source of truth: content-side unifiedMutationEngine."
```

---

## Summary of Changes

| Action | File | Lines |
|--------|------|-------|
| **Deleted** | `editingSlice.ts` | -325 |
| **Deleted** | `useUndoRedo.ts` | -191 |
| **Deleted** | `designerChangesSlice.ts` | -32 |
| **Modified** | `slices/index.ts` | remove 4 export lines |
| **Modified** | `types.ts` | remove from AppState + re-exports |
| **Modified** | `appStore.ts` | remove from store creation + re-exports |
| **Modified** | `promptCompiler.ts` | remove designerChanges section |
| **Modified** | `promptOutputSlice.ts` | remove designerChanges gathering |
| **Modified** | `usePromptAutoCompile.ts` | remove designerChanges subscription |
| **Modified** | `useSessionAutoSave.ts` | remove designerChanges from save |
| **Modified** | `ContextOutputPanel.tsx` | remove designerChanges count |
| **Modified** | `sidecarSync.ts` | remove from payload |
| **Modified** | `sessionPersistence.ts` | remove from type |
| **Modified** | `useSessionRestore.ts` | remove from restore |
| **Modified** | `Panel.tsx` | add Cmd+Z handler |
| **Modified** | `content.ts` | add Cmd+Z interception in design/annotate modes |
| **Modified** | test files | remove designerChanges from test inputs |
