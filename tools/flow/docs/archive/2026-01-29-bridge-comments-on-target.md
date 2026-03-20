# Bridge Comments on Target Projects — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the comment/question system work on target projects inside the iframe identically to how it works in dogfood mode — with auto-injected bridge (no manual devDep install), merged parsing (bridge + fiber), and comment overlays rendered inside the target iframe.

**Architecture:** RadFlow auto-injects `@rdna/bridge` into the iframe at runtime via script injection — no target project changes needed. Extend the bridge protocol with `ADD_COMMENT`, `REMOVE_COMMENT`, `CLEAR_COMMENTS` message types. Merge bridge componentMap data with fiber introspection for richest possible context. Wire `CommentMode.tsx` to dispatch through the bridge when connected. All other modes (designer, text-edit, CMD-E prompt builder) will follow in subsequent plans using the same bridge infrastructure.

**Tech Stack:** React 19, TypeScript 5.8, postMessage API, @rdna/bridge, Zustand 5, Tauri 2

---

## Scope Decisions (from interview)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Bridge installation | **Auto-inject at runtime** | No devDep needed, bridge always available |
| Parsing strategy | **Merge bridge + fiber** | Richest context for comments |
| Output model | **Clipboard-first** | All modes compile to clipboard (unified + per-mode) |
| Designer panel | Both schema controls + CSS | Follow-up plan |
| Text edit | Inline contentEditable in iframe | Follow-up plan |
| CMD-E | Prompt builder (select → add → select → add) | Follow-up plan |
| Animation | Not scoped yet | Future plan |
| ComponentCanvas | Preview iframes only (not schema cards) | Keep simple |
| This plan scope | **Comments first, robust parsing** | Foundation for all future modes |

---

## Current State

```
CommentMode (local overlay)              Bridge (iframe protocol)
─────────────────────────────           ─────────────────────────
Detects elements via fiber/bridge/DOM    PING/PONG handshake
Stores Feedback[] in Zustand             GET_COMPONENT_MAP
Renders CommentBadge in host             HIGHLIGHT / CLEAR_HIGHLIGHT
Exports markdown to clipboard            INJECT_STYLE / CLEAR_STYLES
                                         SELECTION / HOVER / ERROR
❌ Never sends to iframe
❌ Bridge requires manual devDep install
❌ Parsing uses bridge OR fiber, not both
```

**After this plan:**

```
RadFlow injects bridge script into ANY iframe automatically
  ↓
CommentMode merges bridge + fiber data for rich context
  ↓
addComment() → local store + bridge postMessage
  ↓
Iframe renders comment badges at element positions
```

---

## Task 1: Build Bridge as Injectable Script Bundle

**Files:**
- Modify: `packages/bridge/package.json` — add `"build:inject"` script
- Create: `packages/bridge/src/inject-entry.ts` — self-initializing entry point
- Modify: `packages/bridge/vite.config.ts` (or add) — IIFE bundle output

**What this does:** Builds `@rdna/bridge` as a self-executing IIFE script that RadFlow can inject into any iframe via `<script>` tag. No imports, no module system — just drops into the page and initializes.

**Step 1: Create inject entry point**

```typescript
// packages/bridge/src/inject-entry.ts
// Self-initializing bridge — runs immediately when loaded
import { initMessageBridge } from './message-bridge.js';

// Guard against double-initialization
if (!(window as any).__RADFLOW_BRIDGE_INITIALIZED__) {
  (window as any).__RADFLOW_BRIDGE_INITIALIZED__ = true;
  initMessageBridge();
  console.log('[RadFlow Bridge] Auto-injected and initialized');
}
```

**Step 2: Add IIFE build config**

If using Vite, add/modify `packages/bridge/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/inject-entry.ts'),
      name: 'RadFlowBridge',
      formats: ['iife'],
      fileName: () => 'bridge-inject.js',
    },
    outDir: 'dist',
    emptyDir: false, // Don't clear existing dist
  },
});
```

**Step 3: Add build script to package.json**

```json
{
  "scripts": {
    "build": "tsc",
    "build:inject": "vite build",
    "build:all": "tsc && vite build"
  }
}
```

**Step 4: Build and verify**

Run: `cd packages/bridge && pnpm build:inject`
Expected: `dist/bridge-inject.js` — single IIFE file, no imports.

**Step 5: Commit**

```bash
git add packages/bridge/src/inject-entry.ts packages/bridge/vite.config.ts packages/bridge/package.json
git commit -m "feat(bridge): add IIFE injectable build for auto-injection"
```

---

## Task 2: Auto-Inject Bridge Script into Iframe

**Files:**
- Modify: `tools/flow/app/hooks/useBridgeConnection.ts` — inject script on iframe load
- Modify: `tools/flow/tauri/tauri.conf.json` — bundle bridge-inject.js as asset (or read from disk)

**What this does:** When an iframe loads, RadFlow injects the bridge script into it automatically. No manual `@rdna/bridge` installation in target projects.

**Step 1: Read bridge script at startup**

The bridge IIFE script needs to be available to the host. Two approaches:

**Approach A (Tauri asset):** Bundle `bridge-inject.js` as a Tauri resource, read via Tauri command.

**Approach B (Inline):** Import the built IIFE as a string at build time.

We'll use **Approach B** — simpler, no Tauri changes:

In `tools/flow/app/hooks/useBridgeConnection.ts`, add a function to inject the script:

```typescript
// At module level, import the bridge script as raw text
// This requires the bridge package to be built first
import bridgeScript from "@rdna/bridge/dist/bridge-inject.js?raw";

function injectBridgeScript(iframe: HTMLIFrameElement): boolean {
  try {
    const doc = iframe.contentDocument;
    if (!doc) return false;

    // Check if already injected
    if (doc.getElementById('__radflow-bridge-script')) return true;

    const script = doc.createElement('script');
    script.id = '__radflow-bridge-script';
    script.textContent = bridgeScript;
    doc.head.appendChild(script);
    console.log('[useBridgeConnection] Injected bridge script into iframe');
    return true;
  } catch (err) {
    // Cross-origin iframe — can't inject
    console.warn('[useBridgeConnection] Cannot inject bridge (cross-origin):', err);
    return false;
  }
}
```

**Step 2: Call injection on iframe load**

Modify the existing `handleIframeLoad` callback (~line 214):

```typescript
const handleIframeLoad = useCallback(() => {
  console.log("[useBridgeConnection] Iframe loaded");
  setBridgeDisconnected();

  const iframe = iframeRef.current;
  if (iframe) {
    // Auto-inject bridge script
    injectBridgeScript(iframe);
  }

  // Start handshake after injection + small delay for script to initialize
  setTimeout(startHandshake, 200);
}, [setBridgeDisconnected, startHandshake, iframeRef]);
```

**Step 3: Add @rdna/bridge as devDep of tools/flow**

```bash
cd tools/flow
pnpm add -D @rdna/bridge@workspace:*
```

**Step 4: Verify injection works**

Run: `cd tools/flow && pnpm tauri dev`
Open any target project. Check iframe console for `[RadFlow Bridge] Auto-injected and initialized`.
Expected: Bridge connects without target project having `@rdna/bridge` in its deps.

**Step 5: Commit**

```bash
git add tools/flow/app/hooks/useBridgeConnection.ts tools/flow/package.json pnpm-lock.yaml
git commit -m "feat(flow): auto-inject bridge script into iframe on load"
```

---

## Task 3: Add Comment Message Types to Bridge Protocol

**Files:**
- Modify: `packages/bridge/src/types.ts`

**Step 1: Add BridgeComment type**

After the existing `SerializedComponentEntry` interface (~line 58):

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

**Step 2: Extend HostMessage union**

Replace the existing `HostMessage` type:

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

**Step 3: Export from index**

In `packages/bridge/src/index.ts`:

```typescript
export type { BridgeComment } from './types.js';
```

**Step 4: Commit**

```bash
git add packages/bridge/src/types.ts packages/bridge/src/index.ts
git commit -m "feat(bridge): add comment message types to protocol"
```

---

## Task 4: Implement Comment Overlay Renderer in Bridge

**Files:**
- Create: `packages/bridge/src/comment-overlay.ts`

**What this does:** Renders numbered badge overlays inside the iframe at element positions. Badges reposition on scroll/resize. Hover shows tooltip with comment content.

**Step 1: Create comment-overlay.ts**

```typescript
// packages/bridge/src/comment-overlay.ts
import type { BridgeComment, RadflowId } from './types.js';

const CONTAINER_ID = '__radflow-comment-container';
const badgeElements = new Map<string, HTMLElement>();
let container: HTMLElement | null = null;
let activeComments: BridgeComment[] = [];
let repositionRaf: number | null = null;
let scrollListener: (() => void) | null = null;

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999998;';
  document.body.appendChild(container);
  return container;
}

function findElement(comment: BridgeComment): HTMLElement | null {
  if (comment.radflowId) {
    const el = document.querySelector<HTMLElement>(`[data-radflow-id="${comment.radflowId}"]`);
    if (el) return el;
  }
  if (comment.selector) {
    try {
      return document.querySelector<HTMLElement>(comment.selector);
    } catch { /* invalid selector */ }
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

  // Tooltip
  const tip = document.createElement('div');
  tip.style.cssText = `
    position:absolute;left:32px;top:-4px;background:#1a1a1a;color:#e5e5e5;
    padding:6px 10px;border-radius:6px;font-size:11px;font-family:monospace;
    white-space:nowrap;opacity:0;pointer-events:none;transition:opacity 0.15s ease-out;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);max-width:280px;overflow:hidden;text-overflow:ellipsis;
  `;
  tip.textContent = `#${comment.index} ${comment.componentName}: ${comment.content}`;
  badge.appendChild(tip);

  badge.addEventListener('mouseenter', () => { tip.style.opacity = '1'; badge.style.transform = 'scale(1.15)'; });
  badge.addEventListener('mouseleave', () => { tip.style.opacity = '0'; badge.style.transform = 'scale(1)'; });

  return badge;
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
  startRepositionWatcher();
}

export function removeComment(commentId: string): void {
  const badge = badgeElements.get(commentId);
  if (badge) { badge.remove(); badgeElements.delete(commentId); }
  activeComments = activeComments.filter(c => c.id !== commentId);
}

export function clearComments(): void {
  for (const b of badgeElements.values()) b.remove();
  badgeElements.clear();
  activeComments = [];
}

function repositionAll(): void {
  for (const comment of activeComments) {
    const badge = badgeElements.get(comment.id);
    if (badge) positionBadge(badge, comment);
  }
}

function onScrollOrResize(): void {
  if (repositionRaf) cancelAnimationFrame(repositionRaf);
  repositionRaf = requestAnimationFrame(repositionAll);
}

function startRepositionWatcher(): void {
  if (scrollListener) return;
  scrollListener = onScrollOrResize;
  window.addEventListener('scroll', scrollListener, { passive: true, capture: true });
  window.addEventListener('resize', scrollListener, { passive: true });
}

export function stopRepositionWatcher(): void {
  if (scrollListener) {
    window.removeEventListener('scroll', scrollListener, true);
    window.removeEventListener('resize', scrollListener);
    scrollListener = null;
  }
}
```

**Step 2: Commit**

```bash
git add packages/bridge/src/comment-overlay.ts
git commit -m "feat(bridge): implement comment badge renderer for iframe"
```

---

## Task 5: Wire Comment Messages into Bridge Message Handler

**Files:**
- Modify: `packages/bridge/src/message-bridge.ts`

**Step 1: Add import**

At the top (~line 5):

```typescript
import { addComment, removeComment, clearComments } from './comment-overlay.js';
```

**Step 2: Add cases to message handler switch**

After the `case 'CLEAR_STYLES':` block (~line 105):

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

**Step 3: Rebuild bridge**

```bash
cd packages/bridge && pnpm build:all
```

**Step 4: Commit**

```bash
git add packages/bridge/src/message-bridge.ts
git commit -m "feat(bridge): wire comment messages into handler"
```

---

## Task 6: Add Comment Send Methods to useBridgeConnection

**Files:**
- Modify: `tools/flow/app/hooks/useBridgeConnection.ts`

**Step 1: Update HostMessage type**

Replace the existing type (~line 9):

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

Add import:

```typescript
import type { BridgeComment } from "@rdna/bridge";
```

**Step 2: Add methods to return value**

After `clearStyles` (~line 293):

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

**Step 3: Commit**

```bash
git add tools/flow/app/hooks/useBridgeConnection.ts
git commit -m "feat(flow): add comment send methods to bridge hook"
```

---

## Task 7: Expose bridgeSendMessage via Store

**Files:**
- Modify: `tools/flow/app/stores/slices/bridgeSlice.ts`
- Modify: `tools/flow/app/stores/types.ts`

**What this does:** CommentMode needs to send messages but doesn't own the iframe ref. We expose `sendMessage` through the store so any component can dispatch bridge messages.

**Step 1: Add to BridgeSlice type**

In `types.ts`, add to the BridgeSlice interface:

```typescript
bridgeSendMessage: ((msg: any) => boolean) | null;
setBridgeSendMessage: (fn: ((msg: any) => boolean) | null) => void;
```

**Step 2: Add to bridgeSlice.ts**

In the initial state:

```typescript
bridgeSendMessage: null,
```

In the actions:

```typescript
setBridgeSendMessage: (fn) => {
  set({ bridgeSendMessage: fn });
},
```

**Step 3: Register in useBridgeConnection**

In `useBridgeConnection.ts`, after handshake succeeds (in the `PONG` case):

```typescript
useAppStore.getState().setBridgeSendMessage(sendMessage);
```

In disconnect/cleanup:

```typescript
useAppStore.getState().setBridgeSendMessage(null);
```

**Step 4: Commit**

```bash
git add tools/flow/app/stores/slices/bridgeSlice.ts tools/flow/app/stores/types.ts tools/flow/app/hooks/useBridgeConnection.ts
git commit -m "feat(flow): expose bridge sendMessage via store for cross-component access"
```

---

## Task 8: Merge Bridge + Fiber Parsing in CommentMode

**Files:**
- Modify: `tools/flow/app/components/CommentMode.tsx`

**What this does:** Currently `getElementInfo()` uses bridge OR fiber OR DOM (priority chain). We change it to merge bridge data WITH fiber data for the richest context.

**Step 1: Refactor getElementInfo to merge sources**

Replace the current priority-chain logic (~lines 173-292) with a merge strategy:

```typescript
function getElementInfo(element: HTMLElement): ElementInfo {
  let componentName = '';
  let source: SourceLocation | null = null;
  let selector = '';
  let devflowId: string | null = null;
  let richContext: RichContext | undefined;

  // Source 1: Bridge data (radflow-id → componentMap lookup)
  const radflowId = element.closest('[data-radflow-id]')?.getAttribute('data-radflow-id') ?? null;
  if (radflowId) {
    const bridgeEntry = useAppStore.getState().bridgeComponentLookup.get(radflowId);
    if (bridgeEntry) {
      componentName = bridgeEntry.displayName || bridgeEntry.name;
      source = bridgeEntry.source;
      selector = bridgeEntry.selector;
      richContext = {
        radflowId,
        fiberType: bridgeEntry.fiberType,
        props: bridgeEntry.props as Record<string, unknown>,
        parentChain: resolveParentChain(bridgeEntry, useAppStore.getState().bridgeComponentLookup),
        provenance: 'bridge',
      };
    }
  }

  // Source 2: Fiber introspection (enriches with debug source if bridge didn't have it)
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
        // Enrich richContext with fiber-specific data
        if (richContext) {
          richContext.fiberMethod = detectFiberMethod(fiber);
        } else {
          richContext = {
            fiberType: fiber.type?.name || 'unknown',
            provenance: 'fiber',
            fiberMethod: detectFiberMethod(fiber),
          };
        }
      }
    } catch {
      // Fiber parsing failed — continue with what we have
    }
  }

  // Source 3: DOM fallback (only if nothing above worked)
  if (!componentName) {
    devflowId = findDevflowId(element);
    if (devflowId) {
      componentName = devflowIdToName(devflowId);
    } else {
      componentName = getReadableElementName(element);
    }
  }

  if (!selector) {
    selector = generateSelector(element);
  }

  return { componentName, source, selector, devflowId, richContext };
}
```

**Step 2: Add helper to resolve parent chain from bridge lookup**

```typescript
function resolveParentChain(
  entry: SerializedComponentEntry,
  lookup: Map<RadflowId, SerializedComponentEntry>
): string[] {
  const chain: string[] = [];
  let current = entry;
  let depth = 0;
  while (current.parentId && depth < 4) {
    const parent = lookup.get(current.parentId);
    if (!parent) break;
    chain.push(parent.displayName || parent.name);
    current = parent;
    depth++;
  }
  return chain;
}
```

**Step 3: Commit**

```bash
git add tools/flow/app/components/CommentMode.tsx
git commit -m "feat(flow): merge bridge + fiber parsing for richer comment context"
```

---

## Task 9: Wire Comment Dispatch Through Bridge

**Files:**
- Modify: `tools/flow/app/components/CommentMode.tsx`
- Modify: `tools/flow/app/stores/slices/commentSlice.ts`

**Step 1: Dispatch on addComment**

In `CommentMode.tsx`, modify `handleAddComment` (~line 511). After the existing `addComment(feedback)` call:

```typescript
// NEW: Send to bridge if connected
const sendMessage = useAppStore.getState().bridgeSendMessage;
if (sendMessage) {
  const allComments = useAppStore.getState().comments;
  const newComment = allComments[allComments.length - 1];
  sendMessage({
    type: "ADD_COMMENT",
    comment: {
      id: newComment.id,
      type: newComment.type,
      radflowId: selectedElementInfos[0]?.richContext?.radflowId ?? null,
      selector: newComment.elementSelector,
      componentName: newComment.componentName,
      content: newComment.content,
      index: allComments.length,
    },
  });
}
```

**Step 2: Dispatch on removeComment**

In `commentSlice.ts`, modify `removeComment` (~line 148):

```typescript
removeComment: (id) => {
  set((state) => ({ comments: state.comments.filter((c) => c.id !== id) }));
  const sendMessage = get().bridgeSendMessage;
  if (sendMessage) sendMessage({ type: "REMOVE_COMMENT", commentId: id });
},
```

**Step 3: Dispatch on clearComments**

In `commentSlice.ts`, modify `clearComments` (~line 154):

```typescript
clearComments: () => {
  set({ comments: [] });
  const sendMessage = get().bridgeSendMessage;
  if (sendMessage) sendMessage({ type: "CLEAR_COMMENTS" });
},
```

**Step 4: Commit**

```bash
git add tools/flow/app/components/CommentMode.tsx tools/flow/app/stores/slices/commentSlice.ts
git commit -m "feat(flow): dispatch comments through bridge to iframe"
```

---

## Task 10: Replay Comments on Bridge Reconnect

**Files:**
- Modify: `tools/flow/app/hooks/useBridgeConnection.ts`

**Step 1: Sync comments after PONG handshake**

In the `PONG` case, after `sendMessage({ type: "GET_COMPONENT_MAP" })`:

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

**Step 2: Commit**

```bash
git add tools/flow/app/hooks/useBridgeConnection.ts
git commit -m "feat(flow): replay comments on bridge reconnect"
```

---

## Task 11: Enable Comments on ComponentCanvas Preview Iframes

**Files:**
- Modify: `tools/flow/app/components/CommentMode.tsx`

**Step 1: Extend findElementUnderCursor to check component preview iframes**

After the existing main preview check (~line 333), add:

```typescript
// Check component preview iframes (CanvasComponentPreview)
const previewIframes = document.querySelectorAll<HTMLIFrameElement>(
  'iframe[title^="Preview:"]'
);
for (const iframe of previewIframes) {
  const rect = iframe.getBoundingClientRect();
  if (
    clientX >= rect.left && clientX <= rect.right &&
    clientY >= rect.top && clientY <= rect.bottom
  ) {
    try {
      const doc = iframe.contentDocument;
      if (!doc) continue;
      const el = doc.elementFromPoint(clientX - rect.left, clientY - rect.top) as HTMLElement | null;
      if (el) return el;
    } catch {
      // Cross-origin — skip
    }
  }
}
```

**Step 2: Commit**

```bash
git add tools/flow/app/components/CommentMode.tsx
git commit -m "feat(flow): detect comments on ComponentCanvas preview iframes"
```

---

## Task 12: Build and Test End-to-End

**Step 1: Build bridge**

```bash
cd packages/bridge && pnpm build:all
```

**Step 2: Start RadFlow and target**

```bash
# Terminal 1
cd apps/rad-os && pnpm dev

# Terminal 2
cd tools/flow && pnpm tauri dev
```

**Step 3: Test checklist**

- [ ] Open RadFlow, select a target project
- [ ] Check iframe console: `[RadFlow Bridge] Auto-injected and initialized`
- [ ] Bridge status shows "connected" without `@rdna/bridge` in target's deps
- [ ] Enter comment mode (Ctrl+C)
- [ ] Click element in iframe → popover appears
- [ ] Submit comment → blue badge appears AT the element inside the iframe
- [ ] Hover badge in iframe → tooltip shows comment text
- [ ] Delete comment from host → badge disappears from iframe
- [ ] Clear all comments → all badges removed
- [ ] Navigate iframe to new page → comments re-sync after reconnect
- [ ] Switch to ComponentCanvas → enable preview on a component node
- [ ] Click element in component preview → comment works
- [ ] Verify merged context: comment shows both bridge props AND fiber source info

**Step 4: Commit**

```bash
git commit -m "test(flow): verify end-to-end comment bridge"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | IIFE injectable bridge build | `bridge/src/inject-entry.ts`, build config |
| 2 | Auto-inject bridge into iframe | `useBridgeConnection.ts` |
| 3 | Comment protocol types | `bridge/src/types.ts` |
| 4 | Iframe comment renderer | `bridge/src/comment-overlay.ts` (new) |
| 5 | Wire into bridge handler | `bridge/src/message-bridge.ts` |
| 6 | Host send methods | `useBridgeConnection.ts` |
| 7 | Store-exposed sendMessage | `bridgeSlice.ts`, `types.ts` |
| 8 | Merged bridge+fiber parsing | `CommentMode.tsx` |
| 9 | Comment dispatch through bridge | `CommentMode.tsx`, `commentSlice.ts` |
| 10 | Reconnect replay | `useBridgeConnection.ts` |
| 11 | ComponentCanvas support | `CommentMode.tsx` |
| 12 | Build + e2e test | Build + manual verification |

## Architecture After

```
Iframe loads in PreviewCanvas
  ↓ auto-inject
bridge-inject.js runs, initializes message bridge
  ↓ PING/PONG
Bridge connected (no devDep needed!)
  ↓
User enters comment mode → clicks element
  ↓
getElementInfo() merges:
  • Bridge data (radflowId, props, fiberType, parent chain)
  • Fiber data (debug source, component name)
  • DOM fallback (selector, aria-label)
  ↓
addComment() → Zustand store (local)
           → bridgeSendMessage({ ADD_COMMENT }) → iframe
  ↓
comment-overlay.ts renders badge at element position inside iframe ✓
```

## Follow-Up Plans (Not in This Scope)

1. **Designer panel bridge wiring** — schema-driven prop controls + CSS editor → DOM manipulation via bridge
2. **Text edit mode** — contentEditable injection into iframe elements via bridge
3. **CMD-E prompt builder** — select elements → build prompt → clipboard
4. **Animation mode** — TBD
5. **Unified clipboard panel** — compile all mode outputs (comments + designer + text edits)
