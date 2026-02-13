# Unify Mutation Engine — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Collapse two parallel mutation pipelines into a single `unifiedMutationEngine`, delete the legacy `mutationEngine.ts`, and deliver debounced net diffs + undo/redo state to the panel.

**Architecture:** The unified engine (content-side closure) becomes the single source of truth for all DOM mutations. Panel sends commands (`mutation:apply`, `mutation:undo`, `mutation:redo`) via FLOW_MUTATION_PORT. Engine broadcasts debounced `mutation:state` events carrying net diffs + undo/redo status back to panel. Element lookup is always by CSS selector — the ref-based `elementRefMap` is removed.

**Tech Stack:** TypeScript, Chrome Extension MV3 (runtime.Port messaging), Zustand, Vitest

---

## Prior Art & Conventions

- **Existing tests:** `packages/extension/src/content/__tests__/unifiedMutationEngine.test.ts` (75 tests, Vitest + jsdom)
- **Solution doc:** `docs/solutions/integration-issues/chrome-extension-panel-content-message-routing.md`
- **Port names:** `packages/shared/src/constants.ts` — `FLOW_MUTATION_PORT_NAME = 'flow-mutation'`
- **Message union:** `packages/shared/src/types/mutation.ts` — `MutationMessage` union type

## Callers of Old Engine (must migrate)

| File | What it uses | Migration |
|------|-------------|-----------|
| `mutationMessageHandler.ts:78-83` | `applyStyleMutation(ref, changes)` | Route to unified `applyStyle(el, changes)` via selector lookup |
| `mutationMessageHandler.ts:87-91` | `applyTextMutation(ref, text)` | Route to unified `applyText(el, text)` via selector lookup |
| `mutationMessageHandler.ts:94-103` | `revertMutation(id)` | Replace with unified `undo()` |
| `mutationMessageHandler.ts:105-113` | `clearDiffs()` | Replace with unified `clearAll()` |
| `textEditMode.ts:9` | `registerElement`, `unregisterElement`, `applyTextMutation` | Direct DOM ref + unified `applyText()` |
| `spacingHandles.ts:11-14` | `applyStyleMutation`, `registerElement`, `unregisterElement` | Pass unified engine instance, use `applyStyle()` |
| `content.ts:20,439,478,711` | `registerMutationElement('selected', el)` | Remove — engine uses selector lookup |
| `panelRouter.ts:31,160` | `registerMutationElement('selected', el)` | Remove — engine uses selector lookup |

---

### Task 1: Add New Message Types to `@flow/shared`

**Files:**
- Modify: `packages/shared/src/types/mutation.ts`

**Step 1: Add the new message types**

Add these types after the existing `MutationRevertedEvent` (line 108):

```typescript
/**
 * Command to undo the last mutation (or batch) via the unified engine.
 */
export interface MutationUndoCommand {
  kind: 'mutation:undo';
}

/**
 * Command to redo the last undone mutation via the unified engine.
 */
export interface MutationRedoCommand {
  kind: 'mutation:redo';
}

/**
 * Engine state broadcast — debounced net diffs + undo/redo status.
 * Sent from content → panel whenever engine state changes.
 */
export interface MutationStateEvent {
  kind: 'mutation:state';
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  /** Net diffs: one per element+property, first oldValue → last newValue */
  netDiffs: MutationDiff[];
}
```

**Step 2: Update `MutationApplyCommand` to use selector instead of ref**

Replace the existing `MutationApplyCommand` (lines 39-45):

```typescript
export interface MutationApplyCommand {
  kind: 'mutation:apply';
  /** CSS selector for the target element */
  selector: string;
  /** Properties to set on element.style */
  styleChanges: Record<string, string>;
}
```

**Step 3: Update `MutationTextCommand` similarly**

```typescript
export interface MutationTextCommand {
  kind: 'mutation:text';
  /** CSS selector for the target element */
  selector: string;
  newText: string;
}
```

**Step 4: Update `MutationMessage` union**

Add the new types to the union (line 113-122):

```typescript
export type MutationMessage =
  | MutationApplyCommand
  | MutationTextCommand
  | TextEditActivateCommand
  | TextEditDeactivateCommand
  | MutationUndoCommand
  | MutationRedoCommand
  | MutationRevertCommand   // Keep for backwards compat during migration
  | MutationClearCommand
  | MutationDiffEvent
  | MutationClearedEvent
  | MutationRevertedEvent
  | MutationStateEvent;
```

**Step 5: Commit**

```bash
git add packages/shared/src/types/mutation.ts
git commit -m "feat(shared): add mutation:undo, mutation:redo, mutation:state message types

Replace elementRef with selector in MutationApplyCommand/MutationTextCommand.
Add MutationStateEvent for debounced net diff + undo/redo state broadcast."
```

---

### Task 2: Rewrite `mutationMessageHandler.ts` to Use Unified Engine

**Files:**
- Modify: `packages/extension/src/content/mutations/mutationMessageHandler.ts`

**Step 1: Write the failing test**

Create `packages/extension/src/content/mutations/__tests__/mutationMessageHandler.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MutationMessage } from '@flow/shared';
import { createUnifiedMutationEngine } from '../unifiedMutationEngine';
import { initMutationMessageHandler } from '../mutationMessageHandler';

type MessageListener = (message: MutationMessage) => void;

function createMockPort() {
  let listener: MessageListener | null = null;
  const posted: unknown[] = [];

  const port = {
    onMessage: {
      addListener: (cb: MessageListener) => {
        listener = cb;
      },
    },
    postMessage: (message: unknown) => {
      posted.push(message);
    },
  } as unknown as chrome.runtime.Port;

  return {
    port,
    emit: (message: MutationMessage) => listener?.(message),
    posted,
  };
}

describe('mutationMessageHandler (unified)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  it('routes mutation:apply by selector and broadcasts debounced mutation:state', () => {
    const mock = createMockPort();
    const engine = createUnifiedMutationEngine();
    initMutationMessageHandler(mock.port, engine);

    const el = document.createElement('div');
    el.id = 'test-apply';
    document.body.appendChild(el);

    mock.emit({
      kind: 'mutation:apply',
      selector: '#test-apply',
      styleChanges: { color: 'blue' },
    });

    expect(el.style.color).toBe('blue');

    // Debounced state broadcast
    vi.advanceTimersByTime(200);
    expect(mock.posted.some((m) => (m as { kind?: string }).kind === 'mutation:state')).toBe(true);
  });

  it('handles mutation:undo and mutation:redo with immediate state feedback', () => {
    const mock = createMockPort();
    const engine = createUnifiedMutationEngine();
    initMutationMessageHandler(mock.port, engine);

    const el = document.createElement('div');
    el.id = 'test-undo-redo';
    el.style.color = 'red';
    document.body.appendChild(el);

    mock.emit({
      kind: 'mutation:apply',
      selector: '#test-undo-redo',
      styleChanges: { color: 'blue' },
    });
    vi.advanceTimersByTime(200);
    mock.posted.length = 0;

    mock.emit({ kind: 'mutation:undo' });
    expect(el.style.color).toBe('red');
    expect(mock.posted.at(-1)).toMatchObject({ kind: 'mutation:state', canRedo: true });

    mock.emit({ kind: 'mutation:redo' });
    expect(el.style.color).toBe('blue');
    expect(mock.posted.at(-1)).toMatchObject({ kind: 'mutation:state', canUndo: true });
  });

  it('maps legacy mutation:revert to undo/clear behavior', () => {
    const mock = createMockPort();
    const engine = createUnifiedMutationEngine();
    initMutationMessageHandler(mock.port, engine);

    const el = document.createElement('div');
    el.id = 'test-legacy';
    el.style.color = 'red';
    document.body.appendChild(el);

    mock.emit({
      kind: 'mutation:apply',
      selector: '#test-legacy',
      styleChanges: { color: 'blue' },
    });
    mock.emit({ kind: 'mutation:revert', mutationId: 'legacy-id' });
    expect(el.style.color).toBe('red');

    mock.emit({ kind: 'mutation:revert', mutationId: 'all' });
    expect(mock.posted.at(-1)).toMatchObject({ kind: 'mutation:state' });
  });
});
```

**Step 2: Run tests to verify they fail before the rewrite**

Run: `cd packages/extension && npx vitest run src/content/mutations/__tests__/mutationMessageHandler.test.ts`

Expected: FAIL (handler routing/debounce behavior is not fully implemented yet)

**Step 3: Rewrite `mutationMessageHandler.ts`**

Replace the entire file:

```typescript
import type {
  MutationMessage,
  MutationApplyCommand,
  MutationTextCommand,
  MutationStateEvent,
} from '@flow/shared';
import type { UnifiedMutationEngine } from './unifiedMutationEngine';

let port: chrome.runtime.Port | null = null;
let engine: UnifiedMutationEngine | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 200;

/** Text edit mode handlers — set via setTextEditHandlers */
let textEditActivate: ((onDiff: (diff: MutationStateEvent['netDiffs'][0]) => void) => void) | null = null;
let textEditDeactivate: (() => void) | null = null;

export function setTextEditHandlers(handlers: {
  activate: (onDiff: (diff: MutationStateEvent['netDiffs'][0]) => void) => void;
  deactivate: () => void;
}): void {
  textEditActivate = handlers.activate;
  textEditDeactivate = handlers.deactivate;
}

/**
 * Initialize the mutation message handler with the unified engine.
 */
export function initMutationMessageHandler(
  swPort: chrome.runtime.Port,
  unifiedEngine: UnifiedMutationEngine,
): void {
  port = swPort;
  engine = unifiedEngine;

  // Subscribe to engine state changes → debounced broadcast
  engine.subscribe(() => {
    scheduleBroadcast();
  });

  swPort.onMessage.addListener((message: MutationMessage) => {
    switch (message.kind) {
      case 'mutation:apply':
        handleApply(message);
        break;
      case 'mutation:text':
        handleText(message);
        break;
      case 'mutation:undo':
        engine!.undo();
        broadcastStateNow(); // Immediate feedback for undo
        break;
      case 'mutation:redo':
        engine!.redo();
        broadcastStateNow();
        break;
      case 'mutation:clear':
        engine!.clearAll();
        broadcastStateNow();
        break;
      case 'textEdit:activate':
        if (textEditActivate) {
          textEditActivate(() => {
            scheduleBroadcast();
          });
        }
        break;
      case 'textEdit:deactivate':
        if (textEditDeactivate) {
          textEditDeactivate();
        }
        break;
      // Legacy revert — map to undo
      case 'mutation:revert':
        if (message.mutationId === 'all') {
          engine!.clearAll();
        } else {
          engine!.undo();
        }
        broadcastStateNow();
        break;
    }
  });
}

function handleApply(cmd: MutationApplyCommand): void {
  if (!engine) return;
  const el = document.querySelector(cmd.selector) as HTMLElement | null;
  if (!el) return;
  engine.applyStyle(el, cmd.styleChanges);
  // State broadcast handled by engine.subscribe → scheduleBroadcast
}

function handleText(cmd: MutationTextCommand): void {
  if (!engine) return;
  const el = document.querySelector(cmd.selector) as HTMLElement | null;
  if (!el) return;
  engine.applyText(el, cmd.newText);
}

function scheduleBroadcast(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(broadcastStateNow, DEBOUNCE_MS);
}

function broadcastStateNow(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = null;
  if (!port || !engine) return;

  const event: MutationStateEvent = {
    kind: 'mutation:state',
    canUndo: engine.canUndo,
    canRedo: engine.canRedo,
    undoCount: engine.undoCount,
    redoCount: engine.redoCount,
    netDiffs: engine.getNetDiffs(),
  };
  port.postMessage(event);
}

/**
 * Broadcast state immediately (called by design tool onUpdate callbacks).
 */
export function broadcastMutationState(): void {
  broadcastStateNow();
}
```

**Step 4: Run tests**

Run: `cd packages/extension && npx vitest run src/content/mutations/__tests__/mutationMessageHandler.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/extension/src/content/mutations/mutationMessageHandler.ts packages/extension/src/content/mutations/__tests__/mutationMessageHandler.test.ts
git commit -m "refactor: rewrite mutationMessageHandler to use unified engine

Route mutation:apply via selector lookup instead of elementRef.
Add mutation:undo, mutation:redo, mutation:clear handlers.
Debounced mutation:state broadcast with net diffs."
```

---

### Task 3: Wire Unified Engine into `content.ts`

**Files:**
- Modify: `packages/extension/src/entrypoints/content.ts` (lines 20, 122-124, 172-219, 439, 478, 711)

**Step 1: Remove old engine imports**

Replace line 20:
```typescript
// DELETE: import { registerElement as registerMutationElement, unregisterElement as unregisterMutationElement } from '../content/mutations/mutationEngine';
```

**Step 2: Update `initMutationMessageHandler` call to pass engine**

Replace lines 123-124:
```typescript
const unifiedMutationEngine = createUnifiedMutationEngine();
initMutationMessageHandler(port, unifiedMutationEngine);
```

(The signature changed in Task 2 — now takes the engine as second arg.)

**Step 3: Replace `onUpdate` callbacks in design tools**

Replace the `onUpdate` in each tool (lines 175-178, 184-186, etc.) from:
```typescript
onUpdate: () => {
  port.postMessage({ type: 'mutation:updated', payload: null });
}
```
To:
```typescript
onUpdate: () => {
  broadcastMutationState();
}
```

Import `broadcastMutationState` from the rewritten handler.

**Step 4: Remove all `registerMutationElement` / `unregisterMutationElement` calls**

- Delete line 439: `unregisterMutationElement('selected');`
- Delete line 478: `registerMutationElement('selected', el as HTMLElement);`
- Delete line 711: `unregisterMutationElement('selected');`

These are no longer needed — the unified engine resolves by selector.

**Step 5: Run the extension build to verify no compile errors**

Run: `cd packages/extension && pnpm build`

Expected: Clean build (zero TS errors)

**Step 6: Commit**

```bash
git add packages/extension/src/entrypoints/content.ts
git commit -m "refactor: wire content.ts to unified engine, remove element ref registration

Pass unified engine to mutationMessageHandler.
Replace onUpdate callbacks with broadcastMutationState.
Remove all registerMutationElement/unregisterMutationElement calls."
```

---

### Task 4: Migrate `textEditMode.ts` Off Old Engine

**Files:**
- Modify: `packages/extension/src/content/mutations/textEditMode.ts`

**Step 1: Replace old engine imports with unified engine**

The key change: `textEditMode` currently calls `registerElement(ref, el)` then `applyTextMutation(ref, newText)`. The unified engine takes `(el, newText)` directly — no ref needed.

Replace the entire import + usage:

```typescript
import type { MutationDiff } from '@flow/shared';
import type { UnifiedMutationEngine } from './unifiedMutationEngine';
import { setTextEditHandlers } from './mutationMessageHandler';

// ... (keep existing interface and constants)

let engine: UnifiedMutationEngine | null = null;

export function initTextEditMode(unifiedEngine: UnifiedMutationEngine): void {
  engine = unifiedEngine;
  setTextEditHandlers({
    activate: (onDiff) => activateTextEditMode({ onDiff }),
    deactivate: deactivateTextEditMode,
  });
}
```

In `commitEdit`, replace lines 122-129:
```typescript
if (!reverted && options && engine) {
  const newText = el.textContent ?? '';
  if (newText !== originalText) {
    const diff = engine.applyText(el, newText);
    if (diff) {
      options.onDiff(diff);
    }
  }
}
// Remove: unregisterElement(activeRef)
```

In `handleClick`, remove `registerElement(activeRef, target)` (line 77).

**Step 2: Update `content.ts` to pass engine to `initTextEditMode`**

Line 125 changes from `initTextEditMode()` to `initTextEditMode(unifiedMutationEngine)`.

**Step 3: Build and verify**

Run: `cd packages/extension && pnpm build`

Expected: Clean build

**Step 4: Commit**

```bash
git add packages/extension/src/content/mutations/textEditMode.ts packages/extension/src/entrypoints/content.ts
git commit -m "refactor: migrate textEditMode to unified engine

Remove registerElement/unregisterElement calls.
Use engine.applyText(el, text) directly instead of ref-based lookup."
```

---

### Task 5: Migrate `spacingHandles.ts` Off Old Engine

**Files:**
- Modify: `packages/extension/src/content/overlays/spacingHandles.ts`

**Step 1: Replace old engine imports**

Change the import from:
```typescript
import { applyStyleMutation, registerElement, unregisterElement } from '../mutations/mutationEngine';
```
To accept engine via options:
```typescript
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine';
```

**Step 2: Add engine to `SpacingHandlesOptions`**

```typescript
export interface SpacingHandlesOptions {
  shadowRoot: ShadowRoot;
  engine: UnifiedMutationEngine;
  onDiff: (diff: MutationDiff) => void;
}
```

**Step 3: Replace all `applyStyleMutation(ref, changes)` calls with `engine.applyStyle(el, changes)`**

And remove `registerElement` / `unregisterElement` calls.

**Step 4: Update the caller in `content.ts` to pass engine**

**Step 5: Build and verify**

Run: `cd packages/extension && pnpm build`

**Step 6: Commit**

```bash
git add packages/extension/src/content/overlays/spacingHandles.ts packages/extension/src/entrypoints/content.ts
git commit -m "refactor: migrate spacingHandles to unified engine"
```

---

### Task 6: Migrate `panelRouter.ts` Off Old Engine

**Files:**
- Modify: `packages/extension/src/content/panelRouter.ts` (lines 31, 160)

**Step 1: Remove old engine import**

Delete line 31:
```typescript
// DELETE: import { registerElement as registerMutationElement } from './mutations/mutationEngine';
```

**Step 2: Remove `registerMutationElement` call**

Delete line 160:
```typescript
// DELETE: registerMutationElement('selected', element as HTMLElement);
```

The panel router only registered elements for the old engine's ref-based lookup. The unified engine resolves by selector, so this is no longer needed.

**Step 3: Build and verify**

Run: `cd packages/extension && pnpm build`

**Step 4: Commit**

```bash
git add packages/extension/src/content/panelRouter.ts
git commit -m "refactor: remove old engine registration from panelRouter"
```

---

### Task 7: Delete Old Engine + Dead Code

**Files:**
- Delete: `packages/extension/src/content/mutations/mutationEngine.ts`
- Delete: `packages/extension/src/content/mutations/mutationRecorder.ts`
- Delete: `packages/extension/src/content/mutations/__tests__/mutationEngine.test.ts`

**Step 1: Verify no remaining imports**

Run: `grep -r "mutationEngine" packages/extension/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__`

Expected: Zero results (all callers migrated in Tasks 2-6)

**Step 2: Delete the files**

```bash
rm packages/extension/src/content/mutations/mutationEngine.ts
rm packages/extension/src/content/mutations/mutationRecorder.ts
rm packages/extension/src/content/mutations/__tests__/mutationEngine.test.ts
rm packages/extension/src/__tests__/integration/mutationFlow.test.ts
```

**Step 3: Build and run all tests**

Run: `cd packages/extension && pnpm build && npx vitest run`

Expected: Clean build, all remaining tests pass

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete legacy mutationEngine, mutationRecorder, and their tests

All mutation operations now route through unifiedMutationEngine."
```

---

### Task 8: Update Panel-Side `useMutationBridge` + `mutationSlice`

**Files:**
- Modify: `packages/extension/src/panel/hooks/useMutationBridge.ts`
- Modify: `packages/extension/src/panel/stores/slices/mutationSlice.ts`

**Step 1: Update `mutationSlice` to hold engine state**

```typescript
export interface MutationSlice {
  /** Net diffs from engine — one per element+property, first oldValue → last newValue */
  mutationDiffs: MutationDiff[];
  /** Engine undo/redo state */
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;

  /** Replace all diffs with net diffs from engine state broadcast */
  setMutationState: (state: {
    netDiffs: MutationDiff[];
    canUndo: boolean;
    canRedo: boolean;
    undoCount: number;
    redoCount: number;
  }) => void;

  /** Clear all diffs */
  clearMutationDiffs: () => void;

  /** Get diffs grouped by element selector */
  getMutationsByElement: () => Map<string, MutationDiff[]>;
}

export const createMutationSlice: StateCreator<
  MutationSlice,
  [],
  [],
  MutationSlice
> = (set, get) => ({
  mutationDiffs: [],
  canUndo: false,
  canRedo: false,
  undoCount: 0,
  redoCount: 0,

  setMutationState: ({ netDiffs, canUndo, canRedo, undoCount, redoCount }) =>
    set({
      mutationDiffs: netDiffs,
      canUndo,
      canRedo,
      undoCount,
      redoCount,
    }),

  clearMutationDiffs: () => set({ mutationDiffs: [], canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 }),

  getMutationsByElement: () => {
    const grouped = new Map<string, MutationDiff[]>();
    for (const diff of get().mutationDiffs) {
      const key = diff.element.selector;
      const existing = grouped.get(key) ?? [];
      existing.push(diff);
      grouped.set(key, existing);
    }
    return grouped;
  },
});
```

**Step 2: Update `useMutationBridge` to send selector + listen for `mutation:state`**

Key changes:
- `applyStyle` sends `selector` instead of `elementRef`
- Listener handles `mutation:state` → calls `store.setMutationState()`
- Add `undo()` and `redo()` methods
- Remove `onDiff` / `onReverted` callbacks (replaced by `mutation:state`)

```typescript
import { useEffect, useCallback, useRef } from 'react';
import {
  FLOW_MUTATION_PORT_NAME,
  type MutationApplyCommand,
  type MutationMessage,
  type MutationStateEvent,
} from '@flow/shared';
import { useAppStore } from '../stores/appStore';

interface UseMutationBridgeOptions {
  selector: string | null;
  tabId: number;
}

export function useMutationBridge({ selector, tabId }: UseMutationBridgeOptions) {
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const setMutationState = useAppStore((s) => s.setMutationState);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: FLOW_MUTATION_PORT_NAME });
    portRef.current = port;

    port.postMessage({ type: 'panel:init', payload: { tabId } });

    const handleMessage = (message: unknown) => {
      if (!message || typeof message !== 'object' || !('kind' in message)) return;
      const msg = message as MutationMessage;
      if (msg.kind === 'mutation:state') {
        const stateEvt = msg as MutationStateEvent;
        setMutationState({
          netDiffs: stateEvt.netDiffs,
          canUndo: stateEvt.canUndo,
          canRedo: stateEvt.canRedo,
          undoCount: stateEvt.undoCount,
          redoCount: stateEvt.redoCount,
        });
      }
    };

    port.onMessage.addListener(handleMessage);
    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, [tabId, setMutationState]);

  const applyStyle = useCallback(
    (styleChanges: Record<string, string>) => {
      if (!selector || !portRef.current) return;
      const cmd: MutationApplyCommand = {
        kind: 'mutation:apply',
        selector,
        styleChanges,
      };
      portRef.current.postMessage(cmd);
    },
    [selector],
  );

  const undo = useCallback(() => {
    portRef.current?.postMessage({ kind: 'mutation:undo' });
  }, []);

  const redo = useCallback(() => {
    portRef.current?.postMessage({ kind: 'mutation:redo' });
  }, []);

  const clearAll = useCallback(() => {
    portRef.current?.postMessage({ kind: 'mutation:clear' });
  }, []);

  return { applyStyle, undo, redo, clearAll };
}
```

**Step 3: Update callers of `useMutationBridge` in `Panel.tsx`**

The hook signature changed: `elementRef` → `selector`, and callbacks `onDiff`/`onReverted` are removed. Find all callers and update.

**Step 4: Build and verify**

Run: `cd packages/extension && pnpm build`

**Step 5: Commit**

```bash
git add packages/extension/src/panel/hooks/useMutationBridge.ts packages/extension/src/panel/stores/slices/mutationSlice.ts
git commit -m "feat: update panel mutation bridge for unified engine

mutationSlice now holds canUndo/canRedo/netDiffs from engine state events.
useMutationBridge sends selector-based commands, exposes undo/redo/clearAll.
Removes onDiff/onReverted callbacks — replaced by mutation:state listener."
```

---

### Task 9: End-to-End Verification

**Step 1: Build everything**

```bash
cd packages/extension && pnpm build
cd ../server && pnpm build
```

**Step 2: Run all tests**

```bash
cd packages/extension && npx vitest run
```

Expected: All tests pass. Old engine tests are gone, new handler tests pass, unified engine tests (75) still pass.

**Step 3: Manual verification in browser**

1. Load extension in Chrome → open DevTools panel
2. Enter design mode (press `d`) → select color sub-mode (press `4`)
3. Click an element → change its color → verify diff appears in panel's mutation tab
4. Change the same element's color 5 more times → verify panel shows ONE net diff with first-old → last-new
5. Press Cmd+Z → verify undo works (element reverts)
6. Press Cmd+Shift+Z → verify redo works
7. Open panel designer → change a property → verify it also flows through unified engine
8. Verify "Clear All" resets everything

**Step 4: Final commit**

```bash
git add -A
git commit -m "test: verify unified mutation engine end-to-end"
```

---

## Summary of Changes

| Action | File |
|--------|------|
| **Modified** | `packages/shared/src/types/mutation.ts` |
| **Rewritten** | `packages/extension/src/content/mutations/mutationMessageHandler.ts` |
| **Modified** | `packages/extension/src/entrypoints/content.ts` |
| **Modified** | `packages/extension/src/content/mutations/textEditMode.ts` |
| **Modified** | `packages/extension/src/content/overlays/spacingHandles.ts` |
| **Modified** | `packages/extension/src/content/panelRouter.ts` |
| **Deleted** | `packages/extension/src/content/mutations/mutationEngine.ts` |
| **Deleted** | `packages/extension/src/content/mutations/mutationRecorder.ts` |
| **Deleted** | `packages/extension/src/content/mutations/__tests__/mutationEngine.test.ts` |
| **Deleted** | `packages/extension/src/__tests__/integration/mutationFlow.test.ts` |
| **Modified** | `packages/extension/src/panel/hooks/useMutationBridge.ts` |
| **Modified** | `packages/extension/src/panel/stores/slices/mutationSlice.ts` |
| **Created** | `packages/extension/src/content/mutations/__tests__/mutationMessageHandler.test.ts` |
