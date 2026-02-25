# Bridge Comments on Target Projects — Implementation Plan (v2)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render comment/question badges inside the target project's iframe, dispatched from the host via the existing bridge postMessage protocol, so reviewers see annotations anchored to actual elements.

**User story:** A designer using RadFlow enters comment mode, clicks an element in the target project iframe, types feedback, and sees a numbered badge appear at that element *inside* the iframe — not floating in the host overlay. Badges survive HMR reloads, reposition on scroll, and clear when comments are deleted.

**Architecture:** Extend the existing bridge protocol with `ADD_COMMENT`, `REMOVE_COMMENT`, `CLEAR_COMMENTS` message types. Add a comment-overlay renderer module to the bridge package that renders badges inside the iframe. The host dispatches comments via `postMessage` (no `contentDocument` injection needed — the bridge is already installed via `withRadflow()` in target projects). Wire `CommentMode.tsx` to dispatch through the bridge when connected. Merge bridge + fiber data into a richer `ElementInfo` where both are available.

**Tech Stack:** React 19, TypeScript 5.8, postMessage API, @rdna/bridge, Zustand 5, Tauri 2

**Constraint:** The bridge must be installed in target projects via `withRadflow()` (Next.js config wrapper) because the fiber hook requires initialization BEFORE React boots. Auto-injection of the full bridge as an IIFE is not feasible — `installFiberHook` must intercept `onCommitFiberRoot` before the first render. This plan uses the existing installation path and only extends the protocol.

---

## Scope Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Bridge installation | **Existing `withRadflow()`** | Fiber hook timing requires pre-React init; no IIFE injection |
| Comment rendering | **Inside iframe via bridge postMessage** | Bridge already runs in iframe, just add overlay module |
| Parsing strategy | **Merge bridge + fiber** | Richest context; bridge provides radflowId/props, fiber provides debug source |
| Output model | **Clipboard-first** | Unchanged from current |
| ComponentCanvas | **Out of scope** | Preview iframes have `pointerEvents: none` and no bridge connection |
| Designer/text-edit/CMD-E | **Out of scope** | Separate follow-up plans |

---

## Current State

```
CommentMode (host overlay)                Bridge (iframe protocol)
─────────────────────────────             ─────────────────────────
Detects elements via bridge/fiber/DOM     PING/PONG handshake
Stores Feedback[] in Zustand              GET_COMPONENT_MAP
Renders CommentBadge in host              HIGHLIGHT / CLEAR_HIGHLIGHT
Exports markdown to clipboard             INJECT_STYLE / CLEAR_STYLES
                                          SELECTION / HOVER / ERROR
❌ Never sends comments to iframe
❌ Parsing uses bridge OR fiber, not both
```

**After this plan:**

```
User clicks element → CommentMode → addComment() → Zustand store
                                                  → bridgeSendComment() → postMessage
                                                                        → iframe bridge
                                                                        → comment-overlay.ts
                                                                        → badge at element ✓
```

---

## Task 1: Add Comment Types to Bridge Protocol

**Files:**
- Modify: `packages/bridge/src/types.ts`

**What:** Define the `BridgeComment` type and extend `HostMessage` with three new message types.

**Step 1: Add BridgeComment interface**

After `SerializedComponentEntry` (line 58), add:

```typescript
/** Comment/question to render as badge overlay in the iframe */
export interface BridgeComment {
  id: string;
  type: "comment" | "question";
  radflowId: RadflowId | null;
  selector: string;
  componentName: string;
  content: string;
  index: number;
}
```

**Step 2: Extend HostMessage**

Replace lines 73-79:

```typescript
export type HostMessage =
  | { type: 'PING' }
  | { type: 'GET_COMPONENT_MAP' }
  | { type: 'HIGHLIGHT'; radflowId: RadflowId }
  | { type: 'CLEAR_HIGHLIGHT' }
  | { type: 'INJECT_STYLE'; css: string }
  | { type: 'CLEAR_STYLES' }
  | { type: 'ADD_COMMENT'; comment: BridgeComment }
  | { type: 'REMOVE_COMMENT'; commentId: string }
  | { type: 'CLEAR_COMMENTS' };
```

**Step 3: Export BridgeComment from index**

In `packages/bridge/src/index.ts`, verify that `export * from './types.js'` already covers `BridgeComment`. It does — no change needed.

**Step 4: Build and verify**

Run: `cd packages/bridge && pnpm build`
Expected: No type errors.

**Step 5: Commit**

```bash
git add packages/bridge/src/types.ts
git commit -m "feat(bridge): add comment message types to protocol"
```

**Acceptance criteria:**
- `BridgeComment` type is exported from `@rdna/bridge`
- `HostMessage` includes `ADD_COMMENT`, `REMOVE_COMMENT`, `CLEAR_COMMENTS`
- `pnpm build` succeeds with no errors

---

## Task 2: Implement Comment Overlay Renderer

**Files:**
- Create: `packages/bridge/src/comment-overlay.ts`

**What:** Renders numbered badge overlays inside the iframe at element positions. Badges reposition on scroll/resize. Hover shows tooltip with content.

**Step 1: Create comment-overlay.ts**

```typescript
// packages/bridge/src/comment-overlay.ts
import type { BridgeComment, RadflowId } from './types.js';
import { findElementById } from './dom-annotator.js';

const CONTAINER_ID = '__radflow-comment-container';
const badgeElements = new Map<string, HTMLElement>();
let container: HTMLElement | null = null;
let activeComments: BridgeComment[] = [];
let repositionRaf: number | null = null;
let watcherActive = false;

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999998;';
  document.body.appendChild(container);
  return container;
}

function findElement(comment: BridgeComment): HTMLElement | null {
  // Prefer radflowId (stable across renders)
  if (comment.radflowId) {
    const el = findElementById(comment.radflowId);
    if (el) return el;
  }
  // Fallback to CSS selector
  if (comment.selector) {
    try {
      return document.querySelector<HTMLElement>(comment.selector);
    } catch {
      // Invalid selector — skip
    }
  }
  return null;
}

function positionBadge(badge: HTMLElement, comment: BridgeComment): void {
  const el = findElement(comment);
  if (!el) {
    badge.style.display = 'none';
    return;
  }
  const rect = el.getBoundingClientRect();
  badge.style.display = 'flex';
  badge.style.top = `${rect.top - 8}px`;
  badge.style.left = `${rect.right - 8}px`;
}

function createBadge(comment: BridgeComment): HTMLElement {
  const isQ = comment.type === 'question';
  const color = isQ ? '#FCC383' : '#95BAD2';

  const badge = document.createElement('div');
  badge.dataset.commentId = comment.id;
  badge.style.cssText = `
    position:fixed;pointer-events:auto;width:24px;height:24px;border-radius:50%;
    background:${color};color:#0F0E0C;font-size:12px;font-weight:700;font-family:monospace;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:default;
    transition:transform 0.15s ease-out;z-index:999999;
  `;
  badge.textContent = isQ ? '?' : String(comment.index);

  // Tooltip on hover
  const tip = document.createElement('div');
  tip.style.cssText = `
    position:absolute;left:32px;top:-4px;background:#1a1a1a;color:#e5e5e5;
    padding:6px 10px;border-radius:6px;font-size:11px;font-family:monospace;
    white-space:nowrap;opacity:0;pointer-events:none;transition:opacity 0.15s ease-out;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);max-width:280px;overflow:hidden;text-overflow:ellipsis;
  `;
  tip.textContent = `#${comment.index} ${comment.componentName}: ${comment.content}`;
  badge.appendChild(tip);

  badge.addEventListener('mouseenter', () => {
    tip.style.opacity = '1';
    badge.style.transform = 'scale(1.15)';
  });
  badge.addEventListener('mouseleave', () => {
    tip.style.opacity = '0';
    badge.style.transform = 'scale(1)';
  });

  return badge;
}

function repositionAll(): void {
  for (const comment of activeComments) {
    const badge = badgeElements.get(comment.id);
    if (badge) positionBadge(badge, comment);
  }
}

function onScrollOrResize(): void {
  if (repositionRaf !== null) cancelAnimationFrame(repositionRaf);
  repositionRaf = requestAnimationFrame(repositionAll);
}

function startWatcher(): void {
  if (watcherActive) return;
  watcherActive = true;
  window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
}

function stopWatcher(): void {
  if (!watcherActive) return;
  watcherActive = false;
  window.removeEventListener('scroll', onScrollOrResize, true);
  window.removeEventListener('resize', onScrollOrResize);
  if (repositionRaf !== null) {
    cancelAnimationFrame(repositionRaf);
    repositionRaf = null;
  }
}

export function addComment(comment: BridgeComment): void {
  const parent = ensureContainer();
  removeComment(comment.id); // Deduplicate

  const badge = createBadge(comment);
  positionBadge(badge, comment);
  parent.appendChild(badge);
  badgeElements.set(comment.id, badge);

  activeComments = activeComments.filter(c => c.id !== comment.id);
  activeComments.push(comment);
  startWatcher();
}

export function removeComment(commentId: string): void {
  const badge = badgeElements.get(commentId);
  if (badge) {
    badge.remove();
    badgeElements.delete(commentId);
  }
  activeComments = activeComments.filter(c => c.id !== commentId);
  if (activeComments.length === 0) stopWatcher();
}

export function clearComments(): void {
  for (const b of badgeElements.values()) b.remove();
  badgeElements.clear();
  activeComments = [];
  stopWatcher();
}
```

**Step 2: Build and verify**

Run: `cd packages/bridge && pnpm build`
Expected: No errors. `dist/comment-overlay.js` + `.d.ts` emitted.

**Step 3: Commit**

```bash
git add packages/bridge/src/comment-overlay.ts
git commit -m "feat(bridge): implement comment badge overlay renderer"
```

**Acceptance criteria:**
- `addComment()` creates a positioned badge with tooltip
- `removeComment()` removes badge and cleans up
- `clearComments()` removes all badges and stops scroll watcher
- Badges reposition on scroll/resize via rAF batching
- Watcher auto-stops when no active comments (no leaked listeners)

---

## Task 3: Wire Comment Messages into Bridge Handler

**Files:**
- Modify: `packages/bridge/src/message-bridge.ts`

**Step 1: Add import**

After line 12:

```typescript
import { addComment, removeComment, clearComments } from './comment-overlay.js';
```

**Step 2: Add cases to handleMessage switch**

After the `case 'CLEAR_STYLES':` block (line 104), before `default:`:

```typescript
    case 'ADD_COMMENT':
      addComment(message.comment);
      break;

    case 'REMOVE_COMMENT':
      removeComment(message.commentId);
      break;

    case 'CLEAR_COMMENTS':
      clearComments();
      break;
```

**Step 3: Build and verify**

Run: `cd packages/bridge && pnpm build`
Expected: No errors.

**Step 4: Commit**

```bash
git add packages/bridge/src/message-bridge.ts
git commit -m "feat(bridge): wire comment messages into handler"
```

**Acceptance criteria:**
- Bridge handles all three comment message types
- Unknown messages still log warning (existing `default` case)

---

## Task 4: Extend useBridgeConnection with Comment Methods

**Files:**
- Modify: `tools/flow/app/hooks/useBridgeConnection.ts`

**What:** Add `sendComment`, `removeComment`, `clearComments` methods to the hook's return value. Also update the local `HostMessage` mirror to include the new types.

**Step 1: Update HostMessage type mirror**

Replace lines 9-15:

```typescript
type HostMessage =
  | { type: "PING" }
  | { type: "GET_COMPONENT_MAP" }
  | { type: "HIGHLIGHT"; radflowId: RadflowId }
  | { type: "CLEAR_HIGHLIGHT" }
  | { type: "INJECT_STYLE"; css: string }
  | { type: "CLEAR_STYLES" }
  | { type: "ADD_COMMENT"; comment: BridgeComment }
  | { type: "REMOVE_COMMENT"; commentId: string }
  | { type: "CLEAR_COMMENTS" };
```

**Step 2: Add BridgeComment type**

After the `BridgeMessage` type (line 22), add:

```typescript
/** Comment data sent to bridge for rendering in iframe */
interface BridgeComment {
  id: string;
  type: "comment" | "question";
  radflowId: RadflowId | null;
  selector: string;
  componentName: string;
  content: string;
  index: number;
}
```

Note: We mirror the type locally rather than importing from `@rdna/bridge` to match the existing pattern in this file (lines 9-22 already mirror `HostMessage`/`BridgeMessage`).

**Step 3: Add methods to return value**

After `clearStyles` (line 296), add:

```typescript
    /** Send a comment to render in the iframe */
    sendComment: useCallback(
      (comment: BridgeComment) =>
        sendMessage({ type: "ADD_COMMENT", comment }),
      [sendMessage]
    ),

    /** Remove a comment badge from the iframe */
    removeComment: useCallback(
      (commentId: string) =>
        sendMessage({ type: "REMOVE_COMMENT", commentId }),
      [sendMessage]
    ),

    /** Clear all comment badges from the iframe */
    clearComments: useCallback(
      () => sendMessage({ type: "CLEAR_COMMENTS" }),
      [sendMessage]
    ),
```

**Step 4: Add comment replay on reconnect**

In `handleMessage`, inside the `PONG` case (after line 113 `sendMessage({ type: "GET_COMPONENT_MAP" })`), add:

```typescript
          // Replay existing comments to newly connected bridge
          const { comments } = useAppStore.getState();
          if (comments.length > 0) {
            sendMessage({ type: "CLEAR_COMMENTS" });
            comments.forEach((c, i) => {
              sendMessage({
                type: "ADD_COMMENT",
                comment: {
                  id: c.id,
                  type: c.type,
                  radflowId: c.richContext?.radflowId ?? null,
                  selector: c.elementSelector,
                  componentName: c.componentName,
                  content: c.content,
                  index: i + 1,
                },
              });
            });
            console.log(
              `[useBridgeConnection] Replayed ${comments.length} comments to bridge`
            );
          }
```

**Step 5: Verify typecheck**

Run: `cd tools/flow && pnpm typecheck`
Expected: No errors.

**Step 6: Commit**

```bash
git add tools/flow/app/hooks/useBridgeConnection.ts
git commit -m "feat(flow): add comment methods and reconnect replay to bridge hook"
```

**Acceptance criteria:**
- Hook returns `sendComment`, `removeComment`, `clearComments` methods
- On PONG handshake, existing comments in store are replayed to the bridge
- Type mirror stays consistent with bridge package types
- `pnpm typecheck` passes

---

## Task 5: Add `radflowId` to RichContext and Feedback Path

**Files:**
- Modify: `tools/flow/app/stores/types.ts`
- Modify: `tools/flow/app/components/CommentMode.tsx`

**What:** `RichContext` currently has no `radflowId` field. Tasks 6 and 4 need `radflowId` from stored comments to replay/dispatch to the bridge. Without this, comment badges in the iframe would never find their target element via `radflowId` — they'd fall back to fragile CSS selectors only.

**Step 1: Add radflowId to RichContext**

In `tools/flow/app/stores/types.ts`, add to `RichContext` (line 313-320):

```typescript
export interface RichContext {
  provenance: DataSource;
  provenanceDetail?: string;
  radflowId?: string;           // ← ADD THIS
  props?: Record<string, unknown>;
  parentChain?: string[];
  fiberType?: "function" | "class" | "forward_ref" | "memo";
  fallbackSelectors?: string[];
}
```

**Step 2: Populate radflowId in CommentMode getElementInfo bridge path**

In `CommentMode.tsx`, find the bridge path of `getElementInfo` (~line 176). Where it builds the `RichContext` object, add `radflowId`:

```typescript
richContext = {
  radflowId,              // ← ADD THIS (the data-radflow-id value)
  provenance: 'bridge',
  // ... existing fields
};
```

**Step 3: Typecheck**

Run: `cd tools/flow && pnpm typecheck`

**Step 4: Commit**

```bash
git add tools/flow/app/stores/types.ts tools/flow/app/components/CommentMode.tsx
git commit -m "feat(flow): add radflowId to RichContext for bridge comment dispatch"
```

**Acceptance criteria:**
- `RichContext.radflowId` is populated when element has `data-radflow-id`
- `pnpm typecheck` passes

---

## Task 6: Expose Bridge Comment Methods via Store

> Note: This was Task 5 in the original numbering. Task 5 (radflowId) was inserted.

**Files:**
- Modify: `tools/flow/app/stores/types.ts`
- Modify: `tools/flow/app/stores/slices/bridgeSlice.ts`
- Modify: `tools/flow/app/components/layout/PreviewCanvas.tsx`

**What:** CommentMode needs to send comment messages but doesn't own the iframe ref. We expose the comment-specific methods (not raw `sendMessage`) through the store. PreviewCanvas registers them after bridge connection.

**Step 1: Add to store types**

In `tools/flow/app/stores/types.ts`, add to the `BridgeSlice` interface (find where it's defined or re-exported from `bridgeSlice.ts`):

```typescript
// Bridge comment dispatch (set by PreviewCanvas when bridge connects)
bridgeSendComment: ((comment: BridgeComment) => boolean) | null;
bridgeRemoveComment: ((commentId: string) => boolean) | null;
bridgeClearComments: (() => boolean) | null;
setBridgeCommentMethods: (methods: {
  sendComment: ((comment: BridgeComment) => boolean) | null;
  removeComment: ((commentId: string) => boolean) | null;
  clearComments: (() => boolean) | null;
}) => void;
```

Also add or import `BridgeComment` type in types.ts:

```typescript
/** Comment data sent to bridge for rendering in iframe */
export interface BridgeComment {
  id: string;
  type: "comment" | "question";
  radflowId: RadflowId | null;
  selector: string;
  componentName: string;
  content: string;
  index: number;
}
```

**Step 2: Implement in bridgeSlice.ts**

Add initial state:

```typescript
bridgeSendComment: null,
bridgeRemoveComment: null,
bridgeClearComments: null,
```

Add action:

```typescript
setBridgeCommentMethods: ({ sendComment, removeComment, clearComments }) => {
  set({
    bridgeSendComment: sendComment,
    bridgeRemoveComment: removeComment,
    bridgeClearComments: clearComments,
  });
},
```

In `setBridgeDisconnected`, also clear these:

```typescript
bridgeSendComment: null,
bridgeRemoveComment: null,
bridgeClearComments: null,
```

**Step 3: Register methods from PreviewCanvas**

In `PreviewCanvas.tsx`, the `useBridgeConnection` call (~line 90) already returns methods. After destructuring, add an effect to register:

```typescript
// IMPORTANT: Preserve existing destructured props (highlightComponent, clearHighlight)
// which are used in the highlight effect (~lines 100-106). Extend, don't replace.
const {
  highlightComponent,
  clearHighlight,
  sendComment,
  removeComment: bridgeRemoveComment,
  clearComments: bridgeClearComments,
  status,
} = useBridgeConnection(iframeRef, targetOrigin);

const setBridgeCommentMethods = useAppStore((s) => s.setBridgeCommentMethods);

useEffect(() => {
  if (status === "connected") {
    setBridgeCommentMethods({
      sendComment,
      removeComment: bridgeRemoveComment,
      clearComments: bridgeClearComments,
    });
  }
  return () => {
    setBridgeCommentMethods({
      sendComment: null,
      removeComment: null,
      clearComments: null,
    });
  };
}, [status, sendComment, bridgeRemoveComment, bridgeClearComments, setBridgeCommentMethods]);
```

**Step 4: Typecheck**

Run: `cd tools/flow && pnpm typecheck`

**Step 5: Commit**

```bash
git add tools/flow/app/stores/types.ts tools/flow/app/stores/slices/bridgeSlice.ts tools/flow/app/components/layout/PreviewCanvas.tsx
git commit -m "feat(flow): expose bridge comment methods via store"
```

**Acceptance criteria:**
- Store exposes `bridgeSendComment`, `bridgeRemoveComment`, `bridgeClearComments`
- Methods are set when bridge is connected, null'd on disconnect
- No stale closures — methods are re-registered on status change
- `pnpm typecheck` passes

---

## Task 7: Wire CommentMode to Dispatch Through Bridge

**Files:**
- Modify: `tools/flow/app/components/CommentMode.tsx`
- Modify: `tools/flow/app/stores/slices/commentSlice.ts`

**What:** When a comment is added, removed, or cleared, also dispatch to the bridge if connected.

**Step 1: Dispatch on addComment in CommentMode**

In `CommentMode.tsx`, find `handleAddComment` (~line 511). After the `addComment(feedback)` call, add:

```typescript
// Dispatch to bridge for iframe rendering
// NOTE: Use the feedback object directly — do NOT re-read from store (race condition).
const bridgeSend = useAppStore.getState().bridgeSendComment;
if (bridgeSend) {
  const commentCount = useAppStore.getState().comments.length;
  bridgeSend({
    id: feedback.id,
    type: feedback.type,
    radflowId: feedback.richContext?.radflowId ?? null,
    selector: feedback.elementSelector,
    componentName: feedback.componentName,
    content: feedback.content,
    index: commentCount,
  });
}
```

**Step 2: Dispatch on removeComment in commentSlice**

In `commentSlice.ts`, modify `removeComment` (~line 148):

```typescript
removeComment: (id) => {
  set((state) => ({ comments: state.comments.filter((c) => c.id !== id) }));
  const bridgeRemove = get().bridgeRemoveComment;
  if (bridgeRemove) bridgeRemove(id);
},
```

**Step 3: Dispatch on clearComments in commentSlice**

Modify `clearComments` (~line 154):

```typescript
clearComments: () => {
  set({ comments: [] });
  const bridgeClear = get().bridgeClearComments;
  if (bridgeClear) bridgeClear();
},
```

Note: `get()` accesses the full `AppState` which includes `BridgeSlice`, so `bridgeRemoveComment` and `bridgeClearComments` are available.

**Step 4: Typecheck**

Run: `cd tools/flow && pnpm typecheck`

**Step 5: Commit**

```bash
git add tools/flow/app/components/CommentMode.tsx tools/flow/app/stores/slices/commentSlice.ts
git commit -m "feat(flow): dispatch comments through bridge to iframe"
```

**Acceptance criteria:**
- Adding a comment sends `ADD_COMMENT` to bridge if connected
- Removing sends `REMOVE_COMMENT`
- Clearing sends `CLEAR_COMMENTS`
- All operations are no-ops when bridge is disconnected (methods are null)
- No errors when bridge is not connected

---

## Task 8: Enrich CommentMode with Merged Bridge + Fiber Data

**Files:**
- Modify: `tools/flow/app/components/CommentMode.tsx`

**What:** Currently `getElementInfo` uses bridge OR fiber OR DOM as a priority chain — first match wins. Change to merge: start with bridge data, then enrich with fiber data where bridge is missing fields.

**Step 1: Refactor getElementInfo merge logic**

Find the existing `getElementInfo` function (~line 173). Replace the priority-chain logic with a merge strategy. The key change is: after the bridge path (lines 176-201), also run the fiber path (lines 206-258) and merge fields that the bridge path didn't fill:

```typescript
// After bridge path sets componentName, source, selector, richContext:

// Source 2: Fiber introspection (enriches bridge data)
if (shouldTryFiberParsing(element)) {
  try {
    const fiber = getFiberFromElement(element);
    if (fiber) {
      const fiberSource = extractFiberSource(fiber);
      // Merge: fiber source wins if bridge didn't have it
      if (!source && fiberSource) {
        source = fiberSource;
      }
      // Merge: fiber component name as fallback
      if (!componentName) {
        componentName = getFiberComponentName(fiber) || '';
      }
      // Enrich richContext with fiber provenance
      if (richContext && richContext.provenance === 'bridge') {
        richContext.provenance = 'bridge+fiber';
      } else if (!richContext) {
        richContext = {
          provenance: 'fiber',
          fiberType: typeof fiber.type === 'function' ? fiber.type.name || 'anonymous' : 'unknown',
        } as RichContext;
      }
    }
  } catch {
    // Fiber parsing failed — continue with what we have
  }
}
```

The exact implementation depends on the existing helper functions (`getFiberFromElement`, `extractFiberSource`, `getFiberComponentName`). Check what's available and use them. The key principle: **bridge data first, fiber data fills gaps, DOM is last resort**.

**Step 2: Typecheck**

Run: `cd tools/flow && pnpm typecheck`

**Step 3: Commit**

```bash
git add tools/flow/app/components/CommentMode.tsx
git commit -m "feat(flow): merge bridge + fiber parsing for richer comment context"
```

**Acceptance criteria:**
- When both bridge and fiber data are available, `richContext.provenance` is `"bridge+fiber"`
- When only bridge data: `"bridge"`
- When only fiber data: `"fiber"`
- When neither: `"dom"` (existing fallback)
- No functional regression — commenting still works on all element types

---

## Task 9: Manual End-to-End Verification

**Step 1: Build bridge**

```bash
cd packages/bridge && pnpm build
```

**Step 2: Start target + RadFlow**

```bash
# Terminal 1: target project (must have withRadflow() configured)
cd apps/monolith-hackathon && pnpm dev

# Terminal 2: RadFlow
cd tools/flow && pnpm tauri dev
```

**Step 3: Test checklist**

- [ ] Open RadFlow, select target project
- [ ] Bridge status shows "connected"
- [ ] Enter comment mode (C key)
- [ ] Click element in iframe → popover appears
- [ ] Submit comment → numbered badge appears AT the element inside the iframe
- [ ] Hover badge in iframe → tooltip shows comment text
- [ ] Submit question → yellow "?" badge appears
- [ ] Delete comment from host → badge disappears from iframe
- [ ] Clear all comments → all badges removed from iframe
- [ ] Scroll in iframe → badges reposition smoothly
- [ ] Trigger HMR (edit a file in target) → after reload, badges re-appear at elements
- [ ] Check richContext provenance in compiled markdown: should show "bridge+fiber" when both available

**Step 4: Commit**

Only if test results require fixes. Otherwise, no commit for this task.

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Comment protocol types | `bridge/src/types.ts` |
| 2 | Iframe comment renderer | `bridge/src/comment-overlay.ts` (new) |
| 3 | Wire into bridge handler | `bridge/src/message-bridge.ts` |
| 4 | Host comment methods + reconnect replay | `useBridgeConnection.ts` |
| 5 | Add radflowId to RichContext | `types.ts`, `CommentMode.tsx` |
| 6 | Store-exposed methods | `bridgeSlice.ts`, `types.ts`, `PreviewCanvas.tsx` |
| 7 | Comment dispatch through bridge | `CommentMode.tsx`, `commentSlice.ts` |
| 8 | Merged bridge+fiber parsing | `CommentMode.tsx` |
| 9 | Manual e2e verification | Build + test |

## Architecture After

```
Target project (has withRadflow() in next.config)
  ↓ bridge initializes before React
  ↓ fiber hook captures component tree
  ↓ PING/PONG handshake with host
  ↓
User enters comment mode → clicks element in iframe
  ↓
getElementInfo() merges:
  • Bridge data (radflowId, props, fiberType, parent chain)
  • Fiber data (debug source, component name)
  • DOM fallback (selector, aria-label)
  ↓
addComment() → Zustand store (local)
           → bridgeSendComment() → postMessage → iframe
  ↓
comment-overlay.ts renders badge at element position inside iframe ✓
  ↓
On HMR reload → bridge reconnects → PONG → replay all comments ✓
```

## Key Differences from v1

| v1 (original) | v2 (this plan) |
|----------------|----------------|
| Auto-inject bridge as IIFE into iframe | Use existing `withRadflow()` install path |
| Store raw `sendMessage` function in Zustand | Store typed comment methods, registered by PreviewCanvas |
| 12 tasks | 9 tasks (removed IIFE build, auto-inject, ComponentCanvas; added radflowId fix) |
| Single e2e test at end | Build checkpoint after Task 3, typecheck after Tasks 4-7 |
| Unaddressed iframe security model | Explicit constraint: target must have bridge installed |
| ComponentCanvas in scope | Out of scope (no bridge connection, pointerEvents:none) |

## Follow-Up Plans (Not in Scope)

1. **Auto-inject lightweight overlay (no fiber)** — For projects without `withRadflow()`, inject a comment-overlay-only script. Badges work, but no rich component context.
2. **ComponentCanvas comments** — Requires per-iframe bridge connections and enabling pointer events.
3. **Designer panel** — Schema-driven prop controls + CSS editor via bridge.
4. **Text edit mode** — contentEditable injection via bridge.
5. **CMD-E prompt builder** — Select elements → build prompt → clipboard.
