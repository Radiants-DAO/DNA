# Prompt Builder + MCP Watch Pattern — Implementation Plan

> **Status: COMPLETE** — All MCP tools implemented in `routes/mcp.ts`: `flow_get_session_context`, `flow_get_comments`, `flow_get_annotations`, `flow_get_text_edits`, `flow_get_design_changes` + 8 other tools. Background compiler (`backgroundCompiler.ts`) pushes session updates on every change. Sidecar status shown in panel header.

**Goal:** Make the MCP server always serve fresh data by: (1) adding a unified `flow_get_session_context` tool + per-type tools (`flow_get_comments`, `flow_get_annotations`, `flow_get_text_edits`, `flow_get_design_changes`), (2) adding `comments` to server-side storage/routing, (3) showing sidecar connection status in the panel header, (4) verifying the end-to-end flow: extension edit → auto-compile → WebSocket push → MCP tool returns current data.

**Architecture:** Sub-Plan 4 wires `useSessionSync` (auto-push to sidecar on compile). This plan focuses on the **server side** — receiving, storing, and serving that data correctly via MCP tools — and adding a connection status indicator to the panel. The extension→server WebSocket channel already exists (`sidecarSync.ts` → `websocket.ts` → `context-store.ts`), but `SessionData` is missing `comments`, existing MCP tools don't expose per-type data cleanly, and there's no status UI.

**Tech Stack:** Node.js, h3, crossws, @modelcontextprotocol/sdk, Zustand, React 19, Tailwind CSS v4

**Depends on:** Sub-Plan 3 (comments flowing), Sub-Plan 4 (auto-compile + sidecar sync wired)

---

## Prior Art & Conventions

- **MCP server:** `packages/server/src/routes/mcp.ts` (~527 lines) — 7 read-only tools with `flow_` prefixed names, Zod input validation, `READ_ONLY_ANNOTATIONS`, `structuredContent` + `outputSchema`, pagination via `paginate()` helper; uses `McpDependencies` with `contextStore`
- **Context store:** `packages/server/src/services/context-store.ts` (127 lines) — in-memory store, `SessionData` type, `sessions` Map
- **WebSocket handler:** `packages/server/src/routes/websocket.ts` (123 lines) — handles `session-update` message type, stores to `contextStore.setSession()`
- **Sidecar sync (extension):** `packages/extension/src/services/sidecarSync.ts` (59 lines) — `connectToSidecar()`, `pushSessionToSidecar()`, WebSocket client
- **Panel component:** `packages/extension/src/entrypoints/panel/Panel.tsx` (318 lines) — hooks mount here, `EditorLayout` render
- **Existing `get_mutation_diffs`:** Returns `session.compiledMarkdown` (markdown) or full JSON breakdown — reference pattern for new tools

## Current State

1. ~~**`SessionData` missing `comments`**~~ — ✅ Done in commit `6b31907`. `comments: unknown[]` now exists in `SessionData`.
2. ~~**WebSocket `session-update` handler missing `comments`**~~ — ✅ Done in commit `6b31907`. Handler destructures and stores `comments`.
3. **No unified MCP tool** — `flow_get_mutation_diffs` returns everything, but it's named poorly and agents don't know it's the "get all session data" tool
4. **No per-type MCP tools** — no `flow_get_comments`, `flow_get_annotations`, `flow_get_text_edits` etc.
5. **No connection status UI** — panel has no indicator for sidecar/MCP server connectivity
6. **`sidecarSync.ts` has no `onopen` callback** — no way to notify the panel when connection succeeds

---

### Task 1: Add `comments` to Server-Side SessionData and WebSocket Handler

> **✅ ALREADY DONE — SKIP**
> Implemented in commits `6b31907` (add comments to SessionData) and `135cb77` (MCP refactor). `comments` field already exists in `SessionData` interface and WebSocket `session-update` handler.

**Files:**
- Modify: `packages/server/src/services/context-store.ts` (lines 40-48)
- Modify: `packages/server/src/routes/websocket.ts` (lines 86-108)

**Step 1: Add `comments` to `SessionData` interface**

In `context-store.ts`, update the interface:

```typescript
export interface SessionData {
  compiledMarkdown: string;
  annotations: unknown[];
  textEdits: unknown[];
  mutationDiffs: unknown[];
  animationDiffs: unknown[];
  promptSteps: unknown[];
  comments: unknown[];
  lastUpdated: number;
}
```

**Step 2: Update `session-update` handler in `websocket.ts`**

In `websocket.ts`, update the `session-update` case to destructure and store `comments`:

```typescript
case "session-update": {
  const session = msg.payload as {
    tabId: number;
    compiledMarkdown: string;
    annotations: unknown[];
    textEdits: unknown[];
    mutationDiffs: unknown[];
    animationDiffs: unknown[];
    promptSteps: unknown[];
    comments: unknown[];
  };
  contextStore.setSession(session.tabId, {
    compiledMarkdown: session.compiledMarkdown,
    annotations: session.annotations,
    textEdits: session.textEdits,
    mutationDiffs: session.mutationDiffs,
    animationDiffs: session.animationDiffs,
    promptSteps: session.promptSteps,
    comments: session.comments ?? [],
    lastUpdated: Date.now(),
  });
  break;
}
```

**Step 3: Build and verify**

```bash
cd packages/server && pnpm build
```

Expected: Clean build, no TypeScript errors.

**Step 4: Commit**

```bash
git add packages/server/src/services/context-store.ts packages/server/src/routes/websocket.ts
git commit -m "feat: add comments to SessionData and WebSocket handler"
```

---

### Task 2: Add Unified `flow_get_session_context` MCP Tool

**Files:**
- Modify: `packages/server/src/routes/mcp.ts` (tool registration + handler)

**Step 1: Define Zod input schema**

Add near the top of the file with other schemas:

```typescript
const GetSessionContextInput = z.object({
  tabId: z.number().optional().describe("Browser tab ID. Omit for the most recently active tab."),
  format: z.enum(["markdown", "json"]).optional().describe("Output format. Default: markdown."),
});
```

**Step 2: Register the tool**

After the existing `flow_get_mutation_diffs` tool, register:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... existing 7 tools ...
    {
      name: "flow_get_session_context",
      description:
        "Get the full compiled prompt from the current Flow session — includes all design changes, annotations, text edits, comments, and instructions in structured markdown. This is the same output the user sees when they click 'Copy Prompt' in the panel.",
      inputSchema: zodToJsonSchema(GetSessionContextInput),
      annotations: READ_ONLY_ANNOTATIONS,
      outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
    },
  ],
}));
```

**Step 3: Add handler case in switch**

```typescript
case "flow_get_session_context": {
  const parsed = GetSessionContextInput.safeParse(args);
  if (!parsed.success) return zodError(parsed.error, "flow_get_session_context");
  const { tabId, format } = parsed.data;

  const session = deps.contextStore.getSession(tabId ?? undefined);

  if (!session) {
    return {
      content: [{ type: "text", text: "No active Flow session. Open the Flow DevTools panel and make some edits first. Use flow_get_component_tree to verify the extension is connected." }],
      isError: true,
    };
  }

  if (format === "json") {
    const data = {
      annotations: session.annotations,
      textEdits: session.textEdits,
      mutationDiffs: session.mutationDiffs,
      animationDiffs: session.animationDiffs,
      promptSteps: session.promptSteps,
      comments: session.comments,
      lastUpdated: session.lastUpdated,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: session.compiledMarkdown || "Session active but no changes accumulated yet.",
      },
    ],
  };
}
```

**Step 4: Build**

```bash
cd packages/server && pnpm build
```

**Step 5: Commit**

```bash
git add packages/server/src/routes/mcp.ts
git commit -m "feat: add flow_get_session_context MCP tool (unified prompt)"
```

---

### Task 3: Add Per-Type MCP Tools

**Files:**
- Modify: `packages/server/src/routes/mcp.ts` (tool registrations + handler cases)

**Step 1: Define shared Zod input schema for per-type tools**

```typescript
const SessionFieldInput = z.object({
  tabId: z.number().optional().describe("Browser tab ID. Omit for the most recently active tab."),
  offset: z.number().int().min(0).default(0).describe("Pagination offset"),
  limit: z.number().int().min(1).max(200).default(50).describe("Max items to return"),
});
```

**Step 2: Register 4 per-type tools**

All use `READ_ONLY_ANNOTATIONS`, `PAGINATED_OUTPUT_SCHEMA`, and the shared `SessionFieldInput`:

```typescript
{
  name: "flow_get_comments",
  description:
    "Get all comments and questions from the current Flow session. Comments are user feedback attached to specific UI elements.",
  inputSchema: zodToJsonSchema(SessionFieldInput),
  annotations: READ_ONLY_ANNOTATIONS,
  outputSchema: PAGINATED_OUTPUT_SCHEMA,
},
{
  name: "flow_get_annotations",
  description:
    "Get all annotations from the current Flow session. Annotations are notes attached to specific UI elements with component and source file context.",
  inputSchema: zodToJsonSchema(SessionFieldInput),
  annotations: READ_ONLY_ANNOTATIONS,
  outputSchema: PAGINATED_OUTPUT_SCHEMA,
},
{
  name: "flow_get_text_edits",
  description:
    "Get all text edits from the current Flow session, showing before/after text changes on elements.",
  inputSchema: zodToJsonSchema(SessionFieldInput),
  annotations: READ_ONLY_ANNOTATIONS,
  outputSchema: PAGINATED_OUTPUT_SCHEMA,
},
{
  name: "flow_get_design_changes",
  description:
    "Get all style mutations from design tools in the current Flow session.",
  inputSchema: zodToJsonSchema(SessionFieldInput),
  annotations: READ_ONLY_ANNOTATIONS,
  outputSchema: PAGINATED_OUTPUT_SCHEMA,
},
```

**Step 3: Add `sessionFieldResponse` helper with Zod, pagination, structuredContent**

```typescript
function sessionFieldResponse(
  contextStore: ContextStore,
  args: unknown,
  field: keyof SessionData,
  emptyMessage: string,
  toolName: string,
) {
  const parsed = SessionFieldInput.safeParse(args);
  if (!parsed.success) return zodError(parsed.error, toolName);
  const { tabId, offset, limit } = parsed.data;

  const session = contextStore.getSession(tabId ?? undefined);
  if (!session) {
    return {
      content: [{ type: "text", text: `No active Flow session. Use flow_get_component_tree to verify the extension is connected.` }],
      isError: true,
    };
  }
  const data = session[field];
  if (Array.isArray(data) && data.length === 0) {
    const empty = { items: [], total: 0, offset, limit, has_more: false };
    return {
      content: [{ type: "text", text: emptyMessage }],
      structuredContent: empty,
    };
  }
  if (Array.isArray(data)) {
    const result = paginate(data, offset, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
```

**Step 4: Add handler cases** (pass `args` directly — Zod handles parsing):

```typescript
case "flow_get_comments":
  return sessionFieldResponse(deps.contextStore, args, "comments", "No comments in this session.", "flow_get_comments");

case "flow_get_annotations":
  return sessionFieldResponse(deps.contextStore, args, "annotations", "No annotations in this session.", "flow_get_annotations");

case "flow_get_text_edits":
  return sessionFieldResponse(deps.contextStore, args, "textEdits", "No text edits in this session.", "flow_get_text_edits");

case "flow_get_design_changes":
  return sessionFieldResponse(deps.contextStore, args, "mutationDiffs", "No style mutations in this session.", "flow_get_design_changes");
```

**Step 5: Build**

```bash
cd packages/server && pnpm build
```

**Step 6: Commit**

```bash
git add packages/server/src/routes/mcp.ts
git commit -m "feat: add per-type MCP tools (flow_get_comments, flow_get_annotations, flow_get_text_edits, flow_get_design_changes)"
```

---

### Task 4: Add Connection Status to Sidecar Sync

**Files:**
- Modify: `packages/extension/src/services/sidecarSync.ts`

The current `sidecarSync.ts` has no way to notify consumers about connection state. Add a subscriber pattern.

**Step 1: Add status subscriber pattern**

```typescript
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const SIDECAR_WS_URL = 'ws://localhost:3737/__flow/ws';

type SidecarStatus = 'disconnected' | 'connecting' | 'connected';
type StatusListener = (status: SidecarStatus) => void;

let currentStatus: SidecarStatus = 'disconnected';
const listeners = new Set<StatusListener>();

function setStatus(status: SidecarStatus) {
  currentStatus = status;
  for (const listener of listeners) {
    listener(status);
  }
}

export function onSidecarStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  // Immediately fire with current status
  listener(currentStatus);
  return () => listeners.delete(listener);
}

export function getSidecarStatus(): SidecarStatus {
  return currentStatus;
}

export function connectToSidecar(): void {
  if (ws?.readyState === WebSocket.OPEN) return;

  setStatus('connecting');

  try {
    ws = new WebSocket(SIDECAR_WS_URL);

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onclose = () => {
      ws = null;
      setStatus('disconnected');
      // Reconnect after 5s
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectToSidecar, 5000);
    };

    ws.onerror = () => {
      ws?.close();
    };
  } catch {
    setStatus('disconnected');
  }
}

export function pushSessionToSidecar(
  tabId: number,
  compiledMarkdown: string,
  sessionData: {
    annotations: unknown[];
    textEdits: unknown[];
    mutationDiffs: unknown[];
    animationDiffs: unknown[];
    promptSteps: unknown[];
    comments: unknown[];
  },
): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(
    JSON.stringify({
      type: 'session-update',
      payload: {
        tabId,
        compiledMarkdown,
        ...sessionData,
      },
    }),
  );
}

export function disconnectFromSidecar(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
  setStatus('disconnected');
}
```

**Step 2: Commit**

```bash
git add packages/extension/src/services/sidecarSync.ts
git commit -m "feat: add status subscriber pattern to sidecar sync"
```

---

### Task 5: Add Sidecar Status to Zustand Store

**Files:**
- Modify: `packages/extension/src/panel/stores/slices/` — add sidecar status to an existing slice (e.g., create a thin `sidecarSlice.ts` or add to an existing UI slice)

**Step 1: Check where bridge connection status lives**

The store already has `setBridgeConnected` / `setBridgeDisconnected` (used in `Panel.tsx:83-84`). Search for where these are defined to understand the pattern.

Look for `bridgeConnected` or `setBridgeConnected` in the store slices. Add sidecar status following the same pattern.

**Step 2: Add sidecar status state**

Add to the store (either in an existing UI slice or a new thin slice):

```typescript
// In the appropriate slice file
sidecarStatus: 'disconnected' as 'disconnected' | 'connecting' | 'connected',
setSidecarStatus: (status: 'disconnected' | 'connecting' | 'connected') => {
  set({ sidecarStatus: status });
},
```

**Step 3: Wire the subscriber in `useSessionSync`**

In `packages/extension/src/panel/hooks/useSessionSync.ts` (created in Sub-Plan 4 Task 5), add:

```typescript
import { onSidecarStatus } from '../../services/sidecarSync';

// Inside the hook:
useEffect(() => {
  const unsub = onSidecarStatus((status) => {
    useAppStore.getState().setSidecarStatus(status);
  });
  return unsub;
}, []);
```

**Step 4: Commit**

```bash
git add packages/extension/src/panel/stores/slices/ packages/extension/src/panel/hooks/useSessionSync.ts
git commit -m "feat: add sidecar connection status to Zustand store"
```

---

### Task 6: Add Status Indicator to Panel Header

**Files:**
- Modify: `packages/extension/src/panel/components/layout/EditorLayout.tsx` (or the header component)

**Step 1: Find the panel header**

Look at `EditorLayout.tsx` for where the header/title bar is rendered. Add a small status dot next to the Flow title.

**Step 2: Add status indicator component**

Create inline (no separate file needed):

```tsx
function SidecarStatusDot() {
  const status = useAppStore((s) => s.sidecarStatus);

  if (status === 'disconnected') return null; // Don't show when not using sidecar

  const color = status === 'connected'
    ? 'bg-green-500'
    : 'bg-yellow-500 animate-pulse';

  const label = status === 'connected'
    ? 'MCP server connected'
    : 'Connecting to MCP server...';

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color}`}
      title={label}
    />
  );
}
```

**Step 3: Mount in header**

Place `<SidecarStatusDot />` in the header bar, next to the Flow logo or tab bar. Keep it non-intrusive — a 2px dot that only appears when sidecar connection has been attempted.

**Step 4: Commit**

```bash
git add packages/extension/src/panel/components/layout/EditorLayout.tsx
git commit -m "feat: add sidecar connection status indicator to panel header"
```

---

### Task 7: Update `flow_get_mutation_diffs` to Include Comments

> **✅ ALREADY DONE — SKIP**
> Implemented in commit `135cb77` (MCP refactor). The `flow_get_mutation_diffs` tool already includes `comments` in the JSON output.

**Files:**
- Modify: `packages/server/src/routes/mcp.ts` (existing `get_mutation_diffs` handler)

The existing `get_mutation_diffs` tool returns session data but doesn't include `comments` in the JSON format output.

**Step 1: Update the JSON format response**

In the `get_mutation_diffs` handler's `format === "json"` branch, add `comments`:

```typescript
if (format === "json") {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            annotations: session.annotations,
            textEdits: session.textEdits,
            mutationDiffs: session.mutationDiffs,
            animationDiffs: session.animationDiffs,
            promptSteps: session.promptSteps,
            comments: session.comments,
          },
          null,
          2,
        ),
      },
    ],
  };
}
```

**Step 2: Build**

```bash
cd packages/server && pnpm build
```

**Step 3: Commit**

```bash
git add packages/server/src/routes/mcp.ts
git commit -m "feat: include comments in get_mutation_diffs JSON output"
```

---

### Task 8: End-to-End Verification

**Files:** None (verification only)

**Step 1: Start the server**

```bash
cd packages/server && pnpm dev
```

Expected: Server starts on port 3737, WebSocket on `/__flow/ws`, MCP on `/__mcp`.

**Step 2: Build and load the extension**

```bash
cd packages/extension && pnpm build
```

Load the extension in Chrome, open DevTools on any page, open the Flow panel.

**Step 3: Verify connection status**

1. With server running: panel should show a green dot (connected)
2. Stop the server: dot should disappear or turn yellow briefly, then disappear after disconnect
3. Restart the server: dot should reappear green after ~5s reconnect

**Step 4: Verify auto-push**

1. Make a design edit in Flow (change a color)
2. Check server logs for incoming `session-update` WebSocket message
3. Verify `compiledMarkdown` field is non-empty
4. Verify data arrays are populated

**Step 5: Test MCP tools**

Use an MCP client (or `curl` to the `/__mcp` endpoint) to call each tool:

1. `flow_get_session_context` → returns full compiled markdown
2. `flow_get_session_context` with `format: "json"` → returns all arrays including `comments`
3. `flow_get_comments` → returns paginated comments array (empty if none added)
4. `flow_get_annotations` → returns paginated annotations array
5. `flow_get_text_edits` → returns paginated text edits array
6. `flow_get_design_changes` → returns paginated style mutations array
7. `flow_get_mutation_diffs` → still works, returns compiled markdown

**Step 6: Test data freshness**

1. Make a design edit
2. Wait ~1s (300ms debounce + network)
3. Call `flow_get_session_context` → verify the new edit appears
4. Make another edit → call again → verify it updates

**Step 7: Test with comments (requires Sub-Plan 3)**

1. Activate comment mode
2. Alt+click an element, type "Fix this alignment"
3. Call `flow_get_comments` → verify the comment appears
4. Call `flow_get_session_context` → verify "Comments & Feedback" section in markdown

---

## Data Flow Summary

```
Extension (panel)
  → usePromptAutoCompile: detects data change (300ms debounce)
    → promptOutputSlice.compilePrompt()
      → promptCompiler.compile({ ...allSlices, comments })
      → compiledPrompt stored in Zustand
  → useSessionSync: detects compiledPrompt change
    → pushSessionToSidecar(tabId, markdown, sessionData)
    → WebSocket send { type: "session-update", payload: {...} }

Server (sidecar)
  → websocket.ts receives "session-update"
    → contextStore.setSession(tabId, { ...data, comments, lastUpdated })
  → MCP tool called by agent
    → flow_get_session_context → contextStore.getSession() → compiledMarkdown or JSON (structuredContent)
    → flow_get_comments → contextStore.getSession() → paginate(session.comments) (structuredContent)
    → flow_get_annotations → paginate(session.annotations) (structuredContent)
    → flow_get_text_edits → paginate(session.textEdits) (structuredContent)
    → flow_get_design_changes → paginate(session.mutationDiffs) (structuredContent)
```

## Files Modified

| File | Change |
|------|--------|
| `server/services/context-store.ts` | Add `comments: unknown[]` to `SessionData` |
| `server/routes/websocket.ts` | Destructure and store `comments` in `session-update` handler |
| `server/routes/mcp.ts` | Add `flow_get_session_context`, `flow_get_comments`, `flow_get_annotations`, `flow_get_text_edits`, `flow_get_design_changes` tools with Zod schemas, `READ_ONLY_ANNOTATIONS`, `structuredContent`, `outputSchema`, pagination via `paginate()` helper; add `sessionFieldResponse` helper |
| `extension/services/sidecarSync.ts` | Add status subscriber pattern (`onSidecarStatus`, `getSidecarStatus`, `onopen` handler) |
| `extension/panel/hooks/useSessionSync.ts` | Wire sidecar status to store |
| `extension/panel/stores/slices/` | Add `sidecarStatus` + `setSidecarStatus` to store |
| `extension/panel/components/layout/EditorLayout.tsx` | Add `SidecarStatusDot` indicator in header |
