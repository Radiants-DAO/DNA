# Bridge Context & Comments — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the bridge protocol to render comment badges inside the target iframe and enrich comment context by merging bridge + fiber data. The bridge is the primary context engine — this plan extends it, not replaces it.

**User story:** A designer clicks an element in the preview iframe, types feedback, and sees a numbered badge at that element *inside* the iframe. The comment captures rich context: component name, props, source file:line, parent chain (from bridge) and debug source (from fiber). Agents receive this context when the designer copies to clipboard.

**Architecture:** Add `ADD_COMMENT`, `REMOVE_COMMENT`, `CLEAR_COMMENTS` message types to the bridge protocol. Add a comment-overlay renderer module to the bridge that renders badges inside the iframe via postMessage (no contentDocument needed). Wire CommentMode to dispatch through the bridge. Merge bridge + fiber data for richest possible context. Comments replay on bridge reconnect (HMR).

**Tech Stack:** React 19, TypeScript 5.8, postMessage API, @rdna/bridge, Zustand 5, Tauri 2

**Depends on:** `2026-01-30-same-origin-proxy.md` — same-origin is needed for `elementFromPoint()` (element picking in CommentMode) and `shouldTryFiberParsing()` (fiber enrichment). The bridge comment rendering itself works cross-origin via postMessage.

---

## Context for the Implementing Engineer

### Architecture principle

The bridge (`@rdna/bridge`) is the **context engine**. It runs inside the target iframe, intercepts React fiber commits, and provides component data via postMessage. Same-origin proxy enables two host-side capabilities (elementFromPoint, event interception) — but the bridge owns all context collection and all rendering inside the iframe.

Comment badges are rendered **inside the iframe by the bridge**, not by host-side DOM manipulation. The host sends `ADD_COMMENT` via postMessage → bridge's `comment-overlay.ts` creates badge elements → badges live in the iframe's DOM. This works regardless of same-origin status.

### Key files

| File | Role |
|------|------|
| `packages/bridge/src/types.ts` | Protocol types (HostMessage, BridgeMessage) |
| `packages/bridge/src/message-bridge.ts` | postMessage handler inside iframe |
| `packages/bridge/src/dom-annotator.ts` | `findElementById()` — finds elements by radflowId |
| `tools/flow/app/hooks/useBridgeConnection.ts` | Host-side bridge hook |
| `tools/flow/app/components/CommentMode.tsx` | Click-to-comment flow |
| `tools/flow/app/stores/slices/commentSlice.ts` | Comment state |
| `tools/flow/app/stores/slices/bridgeSlice.ts` | Bridge connection state |
| `tools/flow/app/stores/types.ts` | Shared types (Feedback, RichContext) |
| `tools/flow/app/components/layout/PreviewCanvas.tsx` | Registers bridge methods in store |

### What exists today

- Bridge protocol has: `PING/PONG`, `GET_COMPONENT_MAP`, `HIGHLIGHT`, `CLEAR_HIGHLIGHT`, `INJECT_STYLE`, `CLEAR_STYLES`
- CommentMode stores comments in Zustand, renders badges as host overlays
- Comments never sent to iframe — badges float in host, not anchored to iframe elements
- `getElementInfo()` uses bridge OR fiber OR DOM (priority chain, not merge)

---

## Task 1: Add Comment Types to Bridge Protocol

**Files:**
- Modify: `packages/bridge/src/types.ts` (lines 58, 73-79)

**Step 1: Add BridgeComment interface**

After `SerializedComponentEntry` (line 58):

```typescript
/** Comment/question badge rendered inside the iframe by the bridge */
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

**Step 3: Build**

Run: `cd packages/bridge && pnpm build`
Expected: No errors.

**Step 4: Commit**

```bash
git add packages/bridge/src/types.ts
git commit -m "feat(bridge): add comment message types to protocol"
```

**Acceptance criteria:**
- `BridgeComment` exported from `@rdna/bridge`
- `HostMessage` includes three new comment message types
- `pnpm build` passes

---

## Task 2: Implement Comment Overlay Renderer

**Files:**
- Create: `packages/bridge/src/comment-overlay.ts`

**What:** Renders numbered badges inside the iframe at element positions. Uses `findElementById` from dom-annotator (existing) to locate elements by radflowId. Falls back to CSS selector. Badges reposition on scroll/resize.

**Step 1: Create comment-overlay.ts**

```typescript
import type { BridgeComment } from './types.js';
import { findElementById } from './dom-annotator.js';

const CONTAINER_ID = '__radflow-comment-container';
const badges = new Map<string, HTMLElement>();
let container: HTMLElement | null = null;
let comments: BridgeComment[] = [];
let rafId: number | null = null;
let watching = false;

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999998;';
  document.body.appendChild(container);
  return container;
}

function findElement(c: BridgeComment): HTMLElement | null {
  if (c.radflowId) {
    const el = findElementById(c.radflowId);
    if (el) return el;
  }
  if (c.selector) {
    try { return document.querySelector<HTMLElement>(c.selector); }
    catch { /* invalid selector */ }
  }
  return null;
}

function positionBadge(badge: HTMLElement, c: BridgeComment): void {
  const el = findElement(c);
  if (!el) { badge.style.display = 'none'; return; }
  const r = el.getBoundingClientRect();
  badge.style.display = 'flex';
  badge.style.top = `${r.top - 8}px`;
  badge.style.left = `${r.right - 8}px`;
}

function createBadge(c: BridgeComment): HTMLElement {
  const isQ = c.type === 'question';
  const color = isQ ? '#FCC383' : '#95BAD2';

  const badge = document.createElement('div');
  badge.dataset.commentId = c.id;
  badge.style.cssText = `
    position:fixed;pointer-events:auto;width:24px;height:24px;border-radius:50%;
    background:${color};color:#0F0E0C;font-size:12px;font-weight:700;font-family:monospace;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:default;
    transition:transform 0.15s ease-out;z-index:999999;
  `;
  badge.textContent = isQ ? '?' : String(c.index);

  const tip = document.createElement('div');
  tip.style.cssText = `
    position:absolute;left:32px;top:-4px;background:#1a1a1a;color:#e5e5e5;
    padding:6px 10px;border-radius:6px;font-size:11px;font-family:monospace;
    white-space:nowrap;opacity:0;pointer-events:none;transition:opacity 0.15s ease-out;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);max-width:280px;overflow:hidden;text-overflow:ellipsis;
  `;
  tip.textContent = `#${c.index} ${c.componentName}: ${c.content}`;
  badge.appendChild(tip);

  badge.addEventListener('mouseenter', () => { tip.style.opacity = '1'; badge.style.transform = 'scale(1.15)'; });
  badge.addEventListener('mouseleave', () => { tip.style.opacity = '0'; badge.style.transform = 'scale(1)'; });

  return badge;
}

function repositionAll(): void {
  for (const c of comments) {
    const b = badges.get(c.id);
    if (b) positionBadge(b, c);
  }
}

function onScrollOrResize(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(repositionAll);
}

function startWatcher(): void {
  if (watching) return;
  watching = true;
  window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
}

function stopWatcher(): void {
  if (!watching) return;
  watching = false;
  window.removeEventListener('scroll', onScrollOrResize, true);
  window.removeEventListener('resize', onScrollOrResize);
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
}

export function addComment(c: BridgeComment): void {
  removeComment(c.id);
  const parent = ensureContainer();
  const badge = createBadge(c);
  positionBadge(badge, c);
  parent.appendChild(badge);
  badges.set(c.id, badge);
  comments.push(c);
  startWatcher();
}

export function removeComment(id: string): void {
  const b = badges.get(id);
  if (b) { b.remove(); badges.delete(id); }
  comments = comments.filter(c => c.id !== id);
  if (comments.length === 0) stopWatcher();
}

export function clearComments(): void {
  for (const b of badges.values()) b.remove();
  badges.clear();
  comments = [];
  stopWatcher();
}
```

**Step 2: Build**

Run: `cd packages/bridge && pnpm build`

**Step 3: Commit**

```bash
git add packages/bridge/src/comment-overlay.ts
git commit -m "feat(bridge): implement comment badge overlay renderer"
```

**Acceptance criteria:**
- Badges position at element's top-right corner
- Tooltip on hover
- Scroll/resize repositioning via rAF
- Watcher stops when no comments (no leaked listeners)

---

## Task 3: Wire Comment Messages into Bridge Handler

**Files:**
- Modify: `packages/bridge/src/message-bridge.ts` (lines 10, 106)

**Step 1: Add import**

After line 12:

```typescript
import { addComment, removeComment, clearComments } from './comment-overlay.js';
```

**Step 2: Add cases**

After the `CLEAR_STYLES` case (line 104-105), before `default:` (line 107):

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

**Step 3: Build**

Run: `cd packages/bridge && pnpm build`

**Step 4: Commit**

```bash
git add packages/bridge/src/message-bridge.ts
git commit -m "feat(bridge): wire comment messages into handler"
```

**Acceptance criteria:**
- Bridge handles all three comment message types
- Unknown messages still log warning

---

## Task 4: Add radflowId to RichContext

**Files:**
- Modify: `tools/flow/app/stores/types.ts` (lines 313-320)
- Modify: `tools/flow/app/components/CommentMode.tsx` (~line 176-201)

**What:** `RichContext` has no `radflowId` field. Comments need it to replay badges at the correct element. Without it, bridge comment badges fall back to fragile CSS selectors.

**Step 1: Add field to RichContext**

In `types.ts`, add to the `RichContext` interface (line 313-320):

```typescript
export interface RichContext {
  provenance: DataSource;
  provenanceDetail?: string;
  radflowId?: string;           // ← ADD
  props?: Record<string, unknown>;
  parentChain?: string[];
  fiberType?: "function" | "class" | "forward_ref" | "memo";
  fallbackSelectors?: string[];
}
```

**Step 2: Populate in CommentMode bridge path**

In `CommentMode.tsx`, find the bridge path of `getElementInfo` (~line 176-201). Where `RichContext` is built, add `radflowId`:

Find the line where `richContext` is assigned in the bridge path. Add the `radflowId` field from the `data-radflow-id` attribute value that was already extracted.

**Step 3: Verify**

Run: `cd tools/flow && pnpm typecheck`

**Step 4: Commit**

```bash
git add tools/flow/app/stores/types.ts tools/flow/app/components/CommentMode.tsx
git commit -m "feat(flow): add radflowId to RichContext for bridge comment dispatch"
```

**Acceptance criteria:**
- `RichContext.radflowId` populated when element has `data-radflow-id`
- `pnpm typecheck` passes

---

## Task 5: Extend useBridgeConnection with Comment Methods

**Files:**
- Modify: `tools/flow/app/hooks/useBridgeConnection.ts` (lines 9-15, 22, 113, 296)

**Step 1: Update HostMessage mirror**

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

**Step 2: Add BridgeComment mirror**

After `BridgeMessage` (line 22):

```typescript
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

**Step 3: Add comment replay on reconnect**

In `handleMessage`, inside the `PONG` case, after line 113 (`sendMessage({ type: "GET_COMPONENT_MAP" })`):

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
          }
```

**Step 4: Add methods to return value**

After `clearStyles` (~line 296):

```typescript
    sendComment: useCallback(
      (comment: BridgeComment) => sendMessage({ type: "ADD_COMMENT", comment }),
      [sendMessage]
    ),
    removeComment: useCallback(
      (commentId: string) => sendMessage({ type: "REMOVE_COMMENT", commentId }),
      [sendMessage]
    ),
    clearComments: useCallback(
      () => sendMessage({ type: "CLEAR_COMMENTS" }),
      [sendMessage]
    ),
```

**Step 5: Verify**

Run: `cd tools/flow && pnpm typecheck`

**Step 6: Commit**

```bash
git add tools/flow/app/hooks/useBridgeConnection.ts
git commit -m "feat(flow): add comment methods and reconnect replay to bridge hook"
```

**Acceptance criteria:**
- Hook returns `sendComment`, `removeComment`, `clearComments`
- On PONG, existing comments replayed to bridge
- `pnpm typecheck` passes

---

## Task 6: Register Bridge Comment Methods in Store

**Files:**
- Modify: `tools/flow/app/stores/types.ts` (add BridgeComment type)
- Modify: `tools/flow/app/stores/slices/bridgeSlice.ts`
- Modify: `tools/flow/app/components/layout/PreviewCanvas.tsx` (lines 90-117)

**What:** CommentMode needs to send comments to the bridge but doesn't own the iframe ref. PreviewCanvas registers typed comment methods in the store when bridge connects.

**Step 1: Add BridgeComment to store types**

In `types.ts`, add (if not already there from other plans):

```typescript
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

Add to the BridgeSlice interface (or wherever it's defined):

```typescript
bridgeSendComment: ((comment: BridgeComment) => boolean) | null;
bridgeRemoveComment: ((commentId: string) => boolean) | null;
bridgeClearComments: (() => boolean) | null;
setBridgeCommentMethods: (methods: {
  sendComment: ((comment: BridgeComment) => boolean) | null;
  removeComment: ((commentId: string) => boolean) | null;
  clearComments: (() => boolean) | null;
}) => void;
```

**Step 2: Implement in bridgeSlice.ts**

Add initial state and action. Also null these in `setBridgeDisconnected`.

**Step 3: Update PreviewCanvas registration**

In `PreviewCanvas.tsx`, the bridge comment methods are already destructured and registered (lines 90-117 in the current file). Verify this matches the new method names. The existing code already does:

```typescript
  const {
    highlightComponent,
    clearHighlight,
    sendComment,
    removeComment: bridgeRemoveComment,
    clearComments: bridgeClearComments,
    status,
  } = useBridgeConnection(iframeRef, targetOrigin);
```

And registers them in a `useEffect`. If this code already exists (from a prior session), verify it works. If not, add it — but **preserve existing `highlightComponent` and `clearHighlight` destructuring**.

**Step 4: Verify**

Run: `cd tools/flow && pnpm typecheck`

**Step 5: Commit**

```bash
git add tools/flow/app/stores/types.ts tools/flow/app/stores/slices/bridgeSlice.ts tools/flow/app/components/layout/PreviewCanvas.tsx
git commit -m "feat(flow): expose bridge comment methods via store"
```

**Acceptance criteria:**
- Store exposes `bridgeSendComment`, `bridgeRemoveComment`, `bridgeClearComments`
- Methods are set when bridge connects, null'd on disconnect
- Existing highlight methods preserved
- `pnpm typecheck` passes

---

## Task 7: Wire CommentMode to Dispatch Through Bridge

**Files:**
- Modify: `tools/flow/app/components/CommentMode.tsx` (~line 511)
- Modify: `tools/flow/app/stores/slices/commentSlice.ts` (~lines 148, 154)

**Step 1: Dispatch on addComment**

In `CommentMode.tsx`, after the `addComment(feedback)` call in `handleAddComment`:

```typescript
// Dispatch to bridge — use feedback object directly (not store re-read)
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

**Step 2: Dispatch on removeComment**

In `commentSlice.ts`, modify `removeComment` (~line 148):

```typescript
removeComment: (id) => {
  set((state) => ({ comments: state.comments.filter((c) => c.id !== id) }));
  const bridgeRemove = get().bridgeRemoveComment;
  if (bridgeRemove) bridgeRemove(id);
},
```

**Step 3: Dispatch on clearComments**

Modify `clearComments` (~line 154):

```typescript
clearComments: () => {
  set({ comments: [] });
  const bridgeClear = get().bridgeClearComments;
  if (bridgeClear) bridgeClear();
},
```

**Step 4: Verify**

Run: `cd tools/flow && pnpm typecheck`

**Step 5: Commit**

```bash
git add tools/flow/app/components/CommentMode.tsx tools/flow/app/stores/slices/commentSlice.ts
git commit -m "feat(flow): dispatch comments through bridge to iframe"
```

**Acceptance criteria:**
- Adding comment sends `ADD_COMMENT` to bridge
- Removing sends `REMOVE_COMMENT`
- Clearing sends `CLEAR_COMMENTS`
- All no-ops when bridge disconnected

---

## Task 8: Enrich with Merged Bridge + Fiber Data

**Files:**
- Modify: `tools/flow/app/components/CommentMode.tsx` (~line 173-292)

**What:** `getElementInfo` currently uses bridge OR fiber OR DOM as a priority chain with early returns. Change to: bridge first, then fiber fills gaps, then DOM fallback. Track provenance as `"bridge+fiber"` when both contribute.

**Step 1: Refactor getElementInfo**

The function has three blocks with early returns (bridge at ~200, fiber at ~251, DOM at ~291). Restructure:

1. Remove the `return` at the end of the bridge path (~line 200). Let it fall through.
2. In the fiber path, only fill fields that the bridge path didn't set:
   - If `source` is null and fiber has `_debugSource`, use it
   - If `componentName` is empty and fiber has a name, use it
   - If `richContext.provenance` is `"bridge"`, change to `"bridge+fiber"`
3. DOM fallback remains as last resort (only if both bridge and fiber produced nothing).

The exact line numbers may have shifted. Read the function, understand the three blocks, and restructure. Key principle: **bridge data first, fiber fills gaps, DOM is last resort**.

**Step 2: Verify**

Run: `cd tools/flow && pnpm typecheck`

**Step 3: Commit**

```bash
git add tools/flow/app/components/CommentMode.tsx
git commit -m "feat(flow): merge bridge + fiber data for richer comment context"
```

**Acceptance criteria:**
- Bridge + fiber: `provenance: "bridge+fiber"`
- Bridge only: `provenance: "bridge"`
- Fiber only: `provenance: "fiber"`
- DOM only: `provenance: "dom"`
- No functional regression

---

## Task 9: End-to-End Verification

**Depends on:** Same-origin proxy plan completed (for `elementFromPoint` to work).

**Step 1: Build bridge**

```bash
cd packages/bridge && pnpm build
```

**Step 2: Start**

```bash
cd apps/rad-os && pnpm dev  # Terminal 1
cd tools/flow && pnpm tauri dev         # Terminal 2
```

**Step 3: Test checklist**

- [ ] Bridge connected
- [ ] Enter comment mode (C key)
- [ ] Click element in iframe → popover appears (requires same-origin for `elementFromPoint`)
- [ ] Popover shows component name + source file (bridge data)
- [ ] Submit comment → numbered badge appears AT the element inside the iframe
- [ ] Hover badge → tooltip shows comment text
- [ ] Submit question → yellow "?" badge
- [ ] Delete comment → badge disappears from iframe
- [ ] Clear all → all badges removed
- [ ] Scroll in iframe → badges reposition
- [ ] Trigger HMR → bridge reconnects → badges re-appear (replay)
- [ ] Check compiled markdown: `provenance: "bridge+fiber"` when both available
- [ ] Check compiled markdown: `radflowId` field present

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Comment protocol types | `bridge/src/types.ts` |
| 2 | Iframe badge renderer | `bridge/src/comment-overlay.ts` (new) |
| 3 | Wire into bridge handler | `bridge/src/message-bridge.ts` |
| 4 | Add radflowId to RichContext | `types.ts`, `CommentMode.tsx` |
| 5 | Host comment methods + replay | `useBridgeConnection.ts` |
| 6 | Store-exposed methods | `bridgeSlice.ts`, `types.ts`, `PreviewCanvas.tsx` |
| 7 | Comment dispatch through bridge | `CommentMode.tsx`, `commentSlice.ts` |
| 8 | Merged bridge+fiber parsing | `CommentMode.tsx` |
| 9 | E2E verification | Build + test |

## Follow-Up Plans (Not in Scope)

1. **Bridge protocol: `GET_COMPUTED_STYLES`** — New message type. Host sends radflowId, bridge responds with resolved CSS values. This is the context agents need: "what color is this button, what font, what spacing?"
2. **Bridge protocol: `GET_ELEMENT_TEXT`** — Text content of elements for text-edit context.
3. **Bridge protocol: `GET_ACCESSIBILITY_INFO`** — ARIA roles, labels, tab order for accessible code generation.
4. **Designer panel** — Schema-driven prop controls + CSS editor, applied via bridge style injection.
5. **Text edit mode** — `contentEditable` on iframe elements (requires same-origin).
6. **CMD-E prompt builder** — Select elements → build rich context prompt → clipboard.
