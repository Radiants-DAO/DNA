# Pipeline Refactor: Background Owns WebSocket

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move WebSocket/session ownership from the DevTools panel to the background service worker so the MCP context pipeline works regardless of whether any panel is open.

**Architecture:** Consolidate the current two-WebSocket split (background sends element data, panel sends session data) into a single background-owned connection. The background accumulates session data (comments, mutations, annotations), compiles the prompt, and pushes `session-update` to the sidecar. Agent feedback routes through background to both content script (badges) and panels (UI). FAB auto-sleep with 10min inactivity timeout manages service worker lifecycle.

**Tech Stack:** Chrome Extension MV3, TypeScript, chrome.runtime ports, chrome.alarms, chrome.storage.session

**Brainstorm:** `docs/brainstorms/2026-02-20-fab-first-architecture-brainstorm.md`

---

## Phase 1: Shared Types + Sidecar Client Upgrade

### Task 1.1: Move Feedback type to @flow/shared

The `Feedback` interface lives in `packages/extension/src/panel/stores/types.ts` (line 156). The prompt compiler imports it from there. Background can't import from panel store types. Move it to shared.

**Files:**
- Create: `packages/shared/src/types/feedback.ts`
- Modify: `packages/shared/src/index.ts` — add export
- Modify: `packages/extension/src/panel/stores/types.ts` — replace definitions with re-exports from `@flow/shared`
- Modify: `packages/extension/src/services/promptCompiler.ts` — import from `@flow/shared`
- Modify: `packages/extension/src/services/sessionPersistence.ts` — import from `@flow/shared`

Move these types: `FeedbackType`, `DataSource`, `SourceLocation` (line 50-55), `RichContext`, `Feedback`. Re-export from `types.ts` so existing panel imports don't break.

**Verify:** `npx tsc --noEmit` in both packages. Existing `promptCompiler.test.ts` passes.

**Commit:** "refactor: move Feedback type to @flow/shared for cross-context import"

---

### Task 1.2: Add bidirectional messaging to SidecarClient

Currently `lib/sidecar-client.ts` only sends — no `ws.onmessage` handler. Background needs to receive `agent-feedback`, `agent-resolve`, `agent-thread-reply`, `pong`, `error`, `file-change`.

**Files:**
- Modify: `packages/extension/src/lib/sidecar-client.ts`

**Changes:**
- Add `IncomingSidecarMessageType` union: `'agent-feedback' | 'agent-resolve' | 'agent-thread-reply' | 'file-change' | 'pong' | 'error'`
- Add `onMessage(callback): () => void` to `SidecarClient` interface — same listener pattern as existing `onStatusChange`
- Wire `ws.onmessage` in `connectWebSocket()` to parse JSON and notify listeners
- Expand `SidecarMessageType` to include session types: `'register-tab' | 'session-update' | 'human-thread-reply' | 'close-session' | 'ping'`

**Verify:** Extension loads, existing forwarding still works. Add test for onMessage callback.

**Commit:** "feat(sidecar-client): add bidirectional messaging support"

---

### Task 1.3: Add session management methods to SidecarClient

Port session logic from `services/sidecarSync.ts` (module singleton) into the background's `SidecarClient`.

**Files:**
- Modify: `packages/extension/src/lib/sidecar-client.ts`
- Create: `packages/extension/src/lib/__tests__/sidecar-session.test.ts`

**Add to SidecarClient interface:**
```
registerTab(tabId: number): void
pushSessionUpdate(tabId: number, compiledMarkdown: string, sessionData: object): void
pushHumanReply(tabId: number, feedbackId: string, content: string): void
closeSession(tabId: number): void
getSessionId(tabId: number): string | null
```

Internal state: `Map<number, string>` for tabId→sessionId. Session IDs generated via `crypto.randomUUID()`. Re-send `register-tab` on reconnect (existing `onStatusChange` fires when WS reopens). Queue human replies when disconnected (per-tab, max 100, flush on reconnect).

**Verify:** New tests pass. No behavioral change (methods not called yet).

**Commit:** "feat(sidecar-client): add session management methods"

---

## Phase 2: Background Session Store + Agent Routing

**Critical ordering note:** Agent message routing (Task 2.3) must go live in the same commit as background tab registration (Task 2.4). When background registers a tab, the panel's `sidecarSync` registration will fail silently (SESSION_OWNERSHIP_CONFLICT). The `bg:agent-*` routing ensures the panel still receives agent messages.

### Task 2.1: Create background session accumulator

**Files:**
- Create: `packages/extension/src/lib/backgroundSessionStore.ts`
- Create: `packages/extension/src/lib/__tests__/backgroundSessionStore.test.ts`

Plain `Map<number, TabSession>` store. No Zustand, no React.

```typescript
interface TabSession {
  tabId: number;
  annotations: Annotation[];
  textEdits: TextEdit[];
  mutationDiffs: MutationDiff[];
  animationDiffs: AnimationDiff[];
  promptDraft: PromptDraftNode[];
  promptSteps: PromptStep[];
  comments: Feedback[];
  dirty: boolean;
}
```

Exports: `getOrCreateSession`, `getSession`, `clearSession`, `addComment` (dedupes by id), `updateSessionFromPanelSync` (bulk replace), setters per array. Each mutator sets `dirty = true`.

**Verify:** Tests pass. No behavioral change.

**Commit:** "feat: add background session accumulator"

---

### Task 2.2: Handle comment:submitted in background

Currently only `Panel.tsx` (line 288-312) handles `comment:submitted`. Background just passes it through.

**Files:**
- Modify: `packages/extension/src/entrypoints/background.ts`

In the content script message handler, after `broadcastToTab` and `forwardToSidecar`:

```typescript
if ('type' in msg && msg.type === 'comment:submitted') {
  addComment(tabId, { /* map payload fields to Feedback shape */ });
}
if ('type' in msg && msg.type === 'comment:edited') {
  // update comment in session store
}
```

Import `addComment` from `backgroundSessionStore`. Panel.tsx still handles it too (dual-write during migration).

**Verify:** Add comment on page → background store has it. Panel still displays it.

**Commit:** "feat(background): capture comments in background session store"

---

### Task 2.3: Background handles incoming agent messages from sidecar

**Files:**
- Modify: `packages/extension/src/entrypoints/background.ts`

Wire `sidecar.onMessage()` after `sidecar.startPolling()`:

```typescript
sidecar.onMessage((msg) => {
  if (msg.type === 'agent-feedback' || msg.type === 'agent-resolve' || msg.type === 'agent-thread-reply') {
    const tabId = msg.payload?.tabId;
    if (typeof tabId !== 'number') return;
    // Route to panel ports (prefixed to avoid duplication with panel's own sidecarSync)
    broadcastToTab(tabId, { type: `bg:${msg.type}`, payload: msg.payload });
    // Route to content script for badge rendering
    const contentPort = contentPorts.get(tabId);
    if (contentPort) {
      contentPort.postMessage({
        type: msg.type === 'agent-feedback' ? 'panel:agent-feedback' : 'panel:agent-resolve',
        payload: msg.payload,
      });
    }
  }
});
```

**DO NOT commit alone** — commit together with Task 2.4.

---

### Task 2.4: Background registers tabs, compiles prompt, pushes session-update

**Files:**
- Create: `packages/extension/src/lib/backgroundCompiler.ts`
- Modify: `packages/extension/src/entrypoints/background.ts`
- Modify: `packages/extension/src/entrypoints/panel/Panel.tsx`

**backgroundCompiler.ts:**
- Import `PromptCompiler` from `services/promptCompiler` (portable — only `@flow/shared` types)
- Export `scheduleCompileAndPush(tabId, sidecar)`: 300ms debounce, calls `promptCompiler.compile()` with session data from `backgroundSessionStore`, then `sidecar.pushSessionUpdate()`

**background.ts:**
- On `panel:init`, call `sidecar.registerTab(tabId)` so background owns the session
- Handle new message type `panel:session-data` from panel → `updateSessionFromPanelSync(tabId, payload)` → `scheduleCompileAndPush(tabId)`

**Panel.tsx:**
- In the existing `useAppStore.subscribe()` block, add a `panel:session-data` message alongside the existing `flow:state-sync`:
```typescript
safePortPostMessage(syncPort, {
  type: 'panel:session-data',
  payload: { annotations, textEdits, mutationDiffs, animationDiffs, promptDraft, promptSteps, comments }
});
```

**Panel.tsx** also needs to handle `bg:agent-*` messages (add to `onContentMessage`):
```typescript
if (msg.type === 'bg:agent-feedback') { store.addAgentFeedback(msg.payload); return; }
if (msg.type === 'bg:agent-resolve') { store.resolveByAgent(...); return; }
if (msg.type === 'bg:agent-thread-reply') { store.addThreadReply(...); return; }
```

**Commit Tasks 2.3 + 2.4 together:** "feat(background): register tabs, compile prompt, push session-update, route agent messages"

**Verify:**
- Open panel, make changes → background compiles and pushes to sidecar
- Agent sends feedback → arrives in panel via `bg:agent-*` (panel's own sidecarSync registration now fails silently, which is fine)
- Content script badges still render from agent feedback

---

### Task 2.5: Route human-thread-reply through background

**Files:**
- Modify: `packages/extension/src/panel/stores/slices/commentSlice.ts`
- Modify: `packages/extension/src/entrypoints/background.ts`

**commentSlice.ts** `replyToAgentFeedback`: add `sendToContent({ type: 'panel:human-thread-reply', payload: { tabId, feedbackId, content } })` alongside existing `pushHumanReply` call (dual-write).

**background.ts**: handle `panel:human-thread-reply` → `sidecar.pushHumanReply(tabId, feedbackId, content)`.

**Verify:** Reply in panel → sidecar receives via both paths.

**Commit:** "feat: route human-thread-reply through background (dual-write)"

---

## Phase 3: FAB Auto-Sleep

### Task 3.1: Content script activity tracking

**Files:**
- Modify: `packages/extension/src/entrypoints/content.ts`

Add activity tracking (mousemove, keydown, scroll, click, touchstart). Throttle to one `flow:activity` port message per 30 seconds max.

Add handler for `bg:sleep` message → `setFlowEnabled(false)` (FAB collapses, tools detach).

**Verify:** Move mouse → background receives `flow:activity`. Only 1 ping per 30s despite continuous movement.

**Commit:** "feat(content): track user activity and handle bg:sleep"

---

### Task 3.2: Background keepalive alarm and sleep timeout

**Files:**
- Create: `packages/extension/src/lib/keepalive.ts`
- Create: `packages/extension/src/lib/__tests__/keepalive.test.ts`
- Modify: `packages/extension/src/entrypoints/background.ts`
- Modify: manifest config (add `"alarms"` permission)

**keepalive.ts:**
- `ALARM_NAME = 'flow-keepalive'`, fires every 25s (under MV3's 30s threshold)
- `SLEEP_TIMEOUT_MS = 10 * 60 * 1000`
- `recordTabActivity(tabId)` updates `lastActivityByTab` map
- `handleAlarm()` checks each tab — if idle > 10min, fires `onSleepCallback(tabId)`
- `startKeepalive()` / `stopKeepalive()` manage the alarm
- When no active tabs remain, stops alarm (worker can sleep)

**background.ts:**
- Wire `chrome.alarms.onAlarm.addListener(handleAlarm)`
- `onTabSleep` callback: send `bg:sleep` to content, flush session to `chrome.storage.session`, call `sidecar.closeSession(tabId)`
- Handle `flow:activity` messages → `recordTabActivity(tabId)`
- On content port connect → `recordTabActivity(tabId)` + `startKeepalive()`
- On content port disconnect → `removeTab(tabId)`

**Verify:** Enable Flow → alarm runs. Idle 10min → FAB off, session flushed. Interact → timer resets.

**Commit:** "feat: FAB auto-sleep with keepalive alarm and 10min inactivity timeout"

---

## Phase 4: Panel Delegation (Remove Direct WS)

### Task 4.1: Rewrite useSessionSync as background subscriber

**Files:**
- Modify: `packages/extension/src/panel/hooks/useSessionSync.ts`

Remove all imports from `sidecarSync.ts`. The hook becomes:
- On mount: `chrome.runtime.sendMessage({ type: 'get-sidecar-status' })` → set initial status
- Listen for `sidecar-connected` / `sidecar-disconnected` runtime messages → update status
- Agent messages already handled via `bg:agent-*` in Panel.tsx (Task 2.4)
- Session push already handled by background (Task 2.4)

**Verify:** Panel shows correct sidecar status. Agent feedback displays. Session-update pushed by background only.

**Commit:** "refactor(useSessionSync): delegate to background, remove direct sidecar connection"

---

### Task 4.2: Remove dual-write for human replies

**Files:**
- Modify: `packages/extension/src/panel/stores/slices/commentSlice.ts`

In `replyToAgentFeedback`: remove `pushHumanReply` import/call from `sidecarSync`. Keep only the `sendToContent({ type: 'panel:human-thread-reply' })` path through background.

**Verify:** Reply → arrives at sidecar via background WS only.

**Commit:** "refactor(commentSlice): route human replies exclusively through background"

---

### Task 4.3: Delete sidecarSync.ts

**Files:**
- Delete: `packages/extension/src/services/sidecarSync.ts`

Grep for remaining imports — should be none after Tasks 4.1 and 4.2.

Optionally: remove `bg:` prefix from agent messages in background.ts and Panel.tsx (no longer needed since there's no dual-receive risk). Or keep for clarity.

**Verify:** `npx tsc --noEmit` clean. All tests pass. Full end-to-end:
1. Open page, enable Flow via FAB
2. Select element → inspection flows to sidecar (background WS)
3. Add comment → captured by background → compiled → pushed to sidecar
4. Agent responds → background routes to content (badge) + panel (UI)
5. Close DevTools → background still routes agent messages to content script
6. Reopen DevTools → panel restores from `chrome.storage.session`, shows accumulated feedback
7. Idle 10min → FAB collapses, session flushed, worker sleeps
8. Click FAB → reconnects, session data still in sidecar

**Commit:** "refactor: delete sidecarSync.ts — background owns single WS connection"

---

## Critical Files Reference

| File | Role |
|---|---|
| `packages/extension/src/lib/sidecar-client.ts` | Upgrade: bidirectional + session mgmt |
| `packages/extension/src/lib/backgroundSessionStore.ts` | New: per-tab session accumulator |
| `packages/extension/src/lib/backgroundCompiler.ts` | New: debounced compile + push |
| `packages/extension/src/lib/keepalive.ts` | New: alarm management + sleep timeout |
| `packages/extension/src/entrypoints/background.ts` | Central hub: all routing changes |
| `packages/extension/src/entrypoints/content.ts` | Activity tracking + bg:sleep handler |
| `packages/extension/src/entrypoints/panel/Panel.tsx` | Add session-data push + bg:agent-* handling |
| `packages/extension/src/panel/hooks/useSessionSync.ts` | Rewrite: background subscriber |
| `packages/extension/src/services/sidecarSync.ts` | Delete in final task |
| `packages/extension/src/services/promptCompiler.ts` | Reuse from background (portable) |

## Reusable Code

- `services/promptCompiler.ts` — pure `PromptCompiler` class, no DOM/React deps, already tested
- `lib/sidecar-client.ts` — existing health-poll + reconnect pattern, extend don't replace
- `content.ts` `setFlowEnabled()` — existing FAB toggle function, reuse for sleep
- Panel's `useSessionAutoSave`/`useSessionRestore` — existing `chrome.storage.session` pattern, no changes needed
