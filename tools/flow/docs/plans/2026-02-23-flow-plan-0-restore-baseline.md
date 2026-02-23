# Plan 0: Restore Green Baseline + Cleanup

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all typecheck errors and test failures, delete confirmed dead code, wire the comment composer to the content script, and establish an honest green baseline.

**Architecture:** Targeted fixes and deletions. No new features — only making what exists correct and removing what's confirmed dead.

**Tech Stack:** TypeScript 5.8, Vitest, Zustand 5, WXT

---

## Pre-flight

Before starting, verify current state:

```bash
cd /Users/rivermassey/Desktop/dev/DNA/tools/flow
pnpm typecheck 2>&1 | head -20    # Expect: 3 errors in promptBuilderSlice.test.ts
pnpm --filter @flow/extension test --run 2>&1 | tail -10  # Expect: 1 failed (measurements)
pnpm --filter @flow/server test --run 2>&1 | tail -5       # Expect: all pass
```

---

## Task 0.1: Fix typecheck — promptBuilderSlice.test.ts

**Problem:** `createPromptBuilderSlice` is typed `StateCreator<AppState, [], [], PromptBuilderSlice>` because it internally calls `get().pendingSlot` and `get().updatePromptStep()` (cross-slice reads). The test tries `create<PromptBuilderSlice>()(createPromptBuilderSlice)` which fails because `PromptBuilderSlice` ≠ `AppState`.

**Fix:** Follow the pattern from `commentSlice.test.ts` — create a test store that provides the minimal fields the slice reads from other slices.

**Files:**
- Modify: `packages/extension/src/panel/stores/slices/__tests__/promptBuilderSlice.test.ts`

**Step 1: Write the fix**

Replace the store creation pattern. The slice internally reads `pendingSlot` and calls `updatePromptStep` — both are on `PromptBuilderSlice` itself. The real issue is purely the generic mismatch. Use the same cast-and-spread pattern as `commentSlice.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createPromptBuilderSlice, type PromptBuilderSlice } from '../promptBuilderSlice';

function createTestStore() {
  return create<PromptBuilderSlice>()((set, get, store) => ({
    ...(createPromptBuilderSlice as unknown as (
      setState: typeof set,
      getState: typeof get,
      storeApi: typeof store,
    ) => PromptBuilderSlice)(set, get, store),
  }));
}

describe('promptBuilderSlice', () => {
  it('starts with an empty prompt draft', () => {
    const store = createTestStore();
    expect(store.getState().promptDraft).toEqual([]);
  });

  it('supports text and chip draft CRUD actions', () => {
    const store = createTestStore();
    const api = store.getState();

    api.insertPromptDraftText('Change');
    api.insertPromptDraftChip({
      kind: 'element',
      label: '#hero > h1',
      selector: '#hero > h1',
    });

    const afterInsert = store.getState().promptDraft;
    expect(afterInsert).toHaveLength(2);
    expect(afterInsert[0].type).toBe('text');
    expect(afterInsert[1].type).toBe('chip');

    const textNode = afterInsert.find((node) => node.type === 'text');
    expect(textNode).toBeDefined();
    if (!textNode || textNode.type !== 'text') return;

    store.getState().updatePromptDraftText(textNode.id, 'Update');
    const updated = store.getState().promptDraft.find((node) => node.id === textNode.id);
    expect(updated && updated.type === 'text' ? updated.text : '').toBe('Update');

    const chipNode = store.getState().promptDraft.find((node) => node.type === 'chip');
    expect(chipNode).toBeDefined();
    if (!chipNode || chipNode.type !== 'chip') return;

    store.getState().removePromptDraftNode(chipNode.id);
    expect(store.getState().promptDraft).toHaveLength(1);
    expect(store.getState().promptDraft[0].type).toBe('text');
  });

  it('clears the prompt draft', () => {
    const store = createTestStore();
    store.getState().insertPromptDraftText('Hello');
    expect(store.getState().promptDraft).toHaveLength(1);
    store.getState().clearPromptDraft();
    expect(store.getState().promptDraft).toHaveLength(0);
  });
});
```

**Step 2: Verify typecheck passes**

```bash
pnpm --filter @flow/extension exec tsc --noEmit
```

Expected: 0 errors.

**Step 3: Verify tests still pass**

```bash
pnpm --filter @flow/extension test --run -- src/panel/stores/slices/__tests__/promptBuilderSlice.test.ts
```

Expected: 3 tests pass.

**Step 4: Commit**

```bash
git add packages/extension/src/panel/stores/slices/__tests__/promptBuilderSlice.test.ts
git commit -m "fix: promptBuilderSlice test — use cast-and-spread pattern for StateCreator generic"
```

---

## Task 0.2: Fix test — measurements.test.ts overlapping rects

**Problem:** Test expects `[]` for a containing rect (a = 0,0,20,20 fully wraps b = 5,5,15,15). But `computeMeasurements` intentionally measures partial-overlap AND containment distances. For a containing rect, the implementation returns 4 measurements: left=5, right=5, top=5, bottom=5 (distance from b's edges to a's edges).

**Decision:** The implementation is correct. The inspect ruler uses these measurements to show "5px from edge" distances for nested elements. The test expectation is wrong.

**Files:**
- Modify: `packages/extension/src/content/__tests__/measurements.test.ts:47`

**Step 1: Update the test expectation**

Replace the "returns empty array for overlapping rects" test with a test that verifies containing-rect measurements:

```typescript
  it('returns containment measurements when one rect fully wraps another', () => {
    const m = computeMeasurements(
      { top: 0, left: 0, width: 20, height: 20, right: 20, bottom: 20 } as DOMRect,
      { top: 5, left: 5, width: 10, height: 10, right: 15, bottom: 15 } as DOMRect
    );
    // a fully contains b — should measure distances from b's edges to a's edges
    expect(m.length).toBe(4);
    expect(m.find((x) => x.q === 'left')?.d).toBe(5);
    expect(m.find((x) => x.q === 'right')?.d).toBe(5);
    expect(m.find((x) => x.q === 'top')?.d).toBe(5);
    expect(m.find((x) => x.q === 'bottom')?.d).toBe(5);
  });
```

**Step 2: Run the test**

```bash
pnpm --filter @flow/extension test --run -- src/content/__tests__/measurements.test.ts
```

Expected: 5 tests pass, 0 failures.

**Step 3: Commit**

```bash
git add packages/extension/src/content/__tests__/measurements.test.ts
git commit -m "fix: measurements test — expect containment distances, not empty array"
```

---

## Task 0.3: Delete dead annotation system

**Problem:** Annotate mode (tasks 4.2–4.5) was dropped. Comment/question mode is the shipped system. The annotation files have zero runtime consumers.

**Files:**
- Delete: `packages/extension/src/content/annotationHandler.ts`
- Delete: `packages/extension/src/content/annotationBadges.ts`
- Delete: `packages/extension/src/panel/stores/slices/annotationSlice.ts`
- Delete: `packages/shared/src/types/annotations.ts`
- Modify: `packages/extension/src/panel/stores/slices/index.ts`
- Modify: `packages/extension/src/panel/stores/appStore.ts`
- Modify: `packages/extension/src/panel/stores/types.ts`
- Modify: `packages/shared/src/index.ts` (if it exports annotations)

**Step 1: Check shared/index.ts for annotation exports**

```bash
grep -n "annotation" packages/shared/src/index.ts
```

**Step 2: Delete the 4 files**

```bash
rm packages/extension/src/content/annotationHandler.ts
rm packages/extension/src/content/annotationBadges.ts
rm packages/extension/src/panel/stores/slices/annotationSlice.ts
rm packages/shared/src/types/annotations.ts
```

**Step 3: Remove from slices/index.ts**

In `packages/extension/src/panel/stores/slices/index.ts`, remove:
```typescript
export { createAnnotationSlice } from "./annotationSlice";
export type { AnnotationSlice } from "./annotationSlice";
```

**Step 4: Remove from appStore.ts**

In `packages/extension/src/panel/stores/appStore.ts`, remove:
- The `createAnnotationSlice` import
- The `...createAnnotationSlice(...args),` line in the store creator

**Step 5: Remove from types.ts**

In `packages/extension/src/panel/stores/types.ts`, remove:
- `import type { AnnotationSlice } from "./slices/annotationSlice";`
- `AnnotationSlice,` from the `AppState` interface extends list

**Step 6: Remove from shared/index.ts** (if present)

Remove any `export * from './types/annotations'` or similar line.

**Step 7: Verify**

```bash
pnpm typecheck && pnpm test
```

Expected: 0 typecheck errors, all tests pass.

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: delete dead annotation system — comment/question mode is the shipped system"
```

---

## Task 0.4: Delete dead Tauri compat code

**Problem:** 5 files ported from Flow 0's Tauri architecture have zero runtime consumers in the extension.

**Files:**
- Delete: `packages/extension/src/panel/hooks/useBridgeConnection.ts`
- Delete: `packages/extension/src/panel/hooks/useFileWrite.ts`
- Delete: `packages/extension/src/panel/hooks/useFileWatcher.ts`
- Delete: `packages/extension/src/panel/hooks/useDevServer.ts`
- Delete: `packages/extension/src/panel/components/ModeToolbar.tsx`
- Modify: `packages/extension/src/panel/hooks/index.ts`

**Step 1: Delete the 5 files**

```bash
rm packages/extension/src/panel/hooks/useBridgeConnection.ts
rm packages/extension/src/panel/hooks/useFileWrite.ts
rm packages/extension/src/panel/hooks/useFileWatcher.ts
rm packages/extension/src/panel/hooks/useDevServer.ts
rm packages/extension/src/panel/components/ModeToolbar.tsx
```

**Step 2: Clean up hooks/index.ts**

In `packages/extension/src/panel/hooks/index.ts`, remove ALL lines referencing the 4 deleted hooks:

Remove these sections:
```typescript
// File operations (stubbed for extension)
export { useFileWatcher } from "./useFileWatcher";
export type { FileEvent } from "./useFileWatcher";
export { useDevServer, useDevServerReady } from "./useDevServer";
export type { ServerState, ServerStatus } from "./useDevServer";
export { useFileWrite } from "./useFileWrite";
export type { DiffEntry, DiffPreviewResult, WriteResult } from "./useFileWrite";
```

(`useBridgeConnection` is not exported from index.ts — it was already orphaned.)

**Step 3: Verify**

```bash
pnpm typecheck && pnpm test
```

Expected: 0 typecheck errors, all tests pass.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete dead Tauri compat hooks and unused ModeToolbar"
```

---

## Task 0.5: Remove dead panelRouter handler

**Problem:** `handleGetComponentMap()` in `panelRouter.ts` is self-documented as dead code (TODO at line 440). No panel code sends `panel:get-component-map`.

**Files:**
- Modify: `packages/extension/src/content/panelRouter.ts`

**Step 1: Read the handler and its call site**

Find the `handleGetComponentMap` function and where it's called in the message router switch. Remove both.

**Step 2: Remove the function and its case**

Remove:
- The `handleGetComponentMap()` function definition (~lines 441–470)
- The `case 'panel:get-component-map':` entry in the message router
- Any associated response type (e.g. `ComponentMapResponse`) if only used here — check for other references first

**Step 3: Remove the screenshot stub TODO comment**

While in panelRouter.ts, update the screenshot stub's TODO comment to reference Plan 2 instead of being a bare TODO:
```typescript
// NOTE: Stub — ScreenshotPanel routes here but should use screenshotService.ts (CDP).
// Wiring deferred to Plan 2 (VisBug Final Pass).
```

**Step 4: Verify**

```bash
pnpm typecheck && pnpm test
```

**Step 5: Commit**

```bash
git add packages/extension/src/content/panelRouter.ts
git commit -m "chore: remove dead handleGetComponentMap handler from panelRouter"
```

---

## Task 0.6: Wire comment composer to content script

**Problem:** `commentBadges.ts:openCommentComposer()` is fully built (inline Shadow DOM textarea, Cmd+Enter to submit, Escape to cancel, anchor pulse animation). But it's only reachable via `panelRouter.ts:handleCommentCompose()` which requires DevTools to send a `panel:comment-compose` message. There's no way to create a comment by clicking on the page without DevTools open.

**Files:**
- Modify: `packages/extension/src/entrypoints/content.ts`

**Step 1: Add imports**

At the top of `content.ts`, add:
```typescript
import {
  openCommentComposer,
  setCommentBadgeCallbacks,
  type CommentComposeDraft,
} from '../content/commentBadges';
```

**Step 2: Track comment/question mode**

After the `let flowEnabled = false;` declaration, add:
```typescript
let activeCommentType: 'comment' | 'question' | null = null;
```

**Step 3: Listen for feedback type changes**

In the `handlePortMessages` function, add a handler for `panel:set-feedback-type`:
```typescript
if (anyMsg.type === 'panel:set-feedback-type') {
  const payload = anyMsg.payload as { type: 'comment' | 'question' | null };
  activeCommentType = payload.type;
}
```

**Step 4: Wire badge callbacks**

After `initPanelRouter(port);`, add:
```typescript
setCommentBadgeCallbacks({
  onCreate: (payload) => {
    postToPort({
      type: 'comment:created',
      payload,
    });
  },
  onUpdate: (payload) => {
    postToPort({
      type: 'comment:updated',
      payload,
    });
  },
});
```

**Step 5: Add comment click handling in onClick**

In the `onClick` function, BEFORE the mode-specific logic (before `if (topLevelMode === 'move')`), add:
```typescript
// Comment/question mode: open composer directly on page
if (activeCommentType) {
  const selector = generateSelector(el);
  const tagName = el.tagName.toLowerCase();
  const componentName = el.getAttribute('data-component') || tagName;
  openCommentComposer({
    type: activeCommentType,
    selector,
    componentName,
    x: e.clientX,
    y: e.clientY,
  });
  return;
}
```

**Step 6: Send feedback type from panel**

Check that `commentSlice.ts:setActiveFeedbackType` sends the message to content. It currently calls `set({ editorMode: "comment" })` but does NOT send a message to the content script. Add:

In `packages/extension/src/panel/stores/slices/commentSlice.ts`, in the `setActiveFeedbackType` action, after `set({ editorMode: "comment", activePanel: "feedback" })`, add:
```typescript
sendToContent({
  type: 'panel:set-feedback-type',
  payload: { type },
});
```

And in the `else` (type === null) branch, add:
```typescript
sendToContent({
  type: 'panel:set-feedback-type',
  payload: { type: null },
});
```

**Step 7: Verify**

```bash
pnpm typecheck && pnpm test && pnpm build
```

Manual test: Load extension, open DevTools panel, click Comment button, click an element on the page — composer should appear inline without a panel message round-trip.

**Step 8: Commit**

```bash
git add packages/extension/src/entrypoints/content.ts packages/extension/src/panel/stores/slices/commentSlice.ts
git commit -m "feat: wire comment composer to content script — click-to-comment without DevTools"
```

---

## Task 0.7: Final verification

**Step 1: Run full suite**

```bash
pnpm typecheck        # 0 errors across all packages
pnpm test             # all packages, 0 failures
pnpm build            # builds cleanly
```

**Step 2: Verify nothing was missed**

```bash
# No remaining references to deleted files
grep -r "annotationHandler\|annotationBadges\|annotationSlice\|useBridgeConnection\|useFileWrite\|useFileWatcher\|useDevServer\|ModeToolbar" packages/extension/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__
```

Expected: No matches (or only test mocks / comments).

**Step 3: Summarize changes**

After all tasks pass:
- Typecheck: 0 errors (was 3)
- Tests: 0 failures (was 1)
- Deleted: 10 dead files (~1,100 lines)
- Added: Comment composer content-script trigger (~30 lines)

---

## Summary

| Task | What | Files Changed |
|------|------|---------------|
| 0.1 | Fix typecheck | 1 test file |
| 0.2 | Fix measurements test | 1 test file |
| 0.3 | Delete annotation system | 4 deleted, 4 modified |
| 0.4 | Delete Tauri compat code | 5 deleted, 1 modified |
| 0.5 | Remove dead handler | 1 modified |
| 0.6 | Wire comment composer | 2 modified |
| 0.7 | Final verification | 0 (verify only) |
