# Bidirectional MCP (Agent Comments) — Implementation Plan

> **Status: COMPLETE** — MCP write tools implemented: `flow_post_feedback`, `flow_resolve_annotation`, `flow_reply_to_thread`, `flow_get_pending_feedback`. Background routes agent messages to panel (`bg:agent-*`) and content script (badges). `FeedbackPanel.tsx` (419 lines) shows agent feedback. Human replies routed through background sidecar.

**Goal:** Enable agents to post structured feedback on UI elements via MCP write tools. Agent feedback flows through the WebSocket to the extension, appears as distinct badges on the page and in the FeedbackPanel, and supports threaded conversations (human replies → agent sees via MCP → agent replies → user sees update).

**Architecture:** MCP server gets write tools (`post_feedback`, `resolve_annotation`, `reply_to_thread`, `get_pending_feedback`). All agent feedback is tab-scoped (`tabId`) in context-store and in broadcast messages. Extension's `sidecarSync.ts` (currently send-only) listens for incoming messages, routes to `commentSlice` with `role: 'agent'`, and to content script for distinct-color badge rendering. FeedbackPanel shows agent comments with purple badge + sparkle icon, with inline reply capability.

**Tech Stack:** Node.js, h3, crossws, @modelcontextprotocol/sdk, Zustand, React 19, Chrome Extension MV3, Tailwind CSS v4

**Depends on:** Sub-Plan 3 (comment mode working), Sub-Plan 5 (MCP server receiving session data, sidecar status wired)

---

## Prior Art & Conventions

- **MCP server:** `packages/server/src/routes/mcp.ts` (~527 lines) — 7 read-only tools with `flow_` prefix, Zod validation, `READ_ONLY_ANNOTATIONS`, `structuredContent` + `outputSchema`, pagination via `paginate()` helper; uses `McpDependencies` with `contextStore`
- **Context store:** `packages/server/src/services/context-store.ts` — `SessionData`, in-memory Maps
- **WebSocket handler:** `packages/server/src/routes/websocket.ts` — `broadcast()` function, `WsMessageType` union
- **Sidecar sync (extension):** `packages/extension/src/services/sidecarSync.ts` — WebSocket client, currently send-only
- **Comment slice:** `packages/extension/src/panel/stores/slices/commentSlice.ts` — `Feedback` type with `role` field (if Sub-Plan 3 is done)
- **Comment badges:** `packages/extension/src/content/` — shadow DOM badge pattern from `annotationBadges.ts`
- **Agentation reference:** `node_modules/agentation/dist/index.d.ts` — `ThreadMessage { id, role, content, timestamp }`, `AnnotationIntent`, `AnnotationSeverity`, `AnnotationStatus`
- **Shared types:** `packages/shared/src/index.ts` — re-exports all types from `types/` directory

---

### Task 1: Define Shared Types for Agent Feedback and Threading

**Files:**
- Create: `packages/shared/src/types/agentFeedback.ts`
- Modify: `packages/shared/src/index.ts` (re-export)

**Step 1: Create the types file**

```typescript
// packages/shared/src/types/agentFeedback.ts

export type FeedbackRole = 'human' | 'agent';
export type FeedbackIntent = 'comment' | 'question' | 'fix' | 'approve';
export type FeedbackSeverity = 'blocking' | 'important' | 'suggestion';
export type FeedbackStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed';

export interface ThreadMessage {
  id: string;
  role: FeedbackRole;
  content: string;
  timestamp: number;
}

export interface AgentFeedback {
  id: string;
  tabId: number;
  role: 'agent';
  intent: FeedbackIntent;
  severity: FeedbackSeverity;
  status: FeedbackStatus;
  selector: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  content: string;
  thread: ThreadMessage[];
  timestamp: number;
  resolvedAt?: number;
  resolvedBy?: FeedbackRole;
}

/**
 * Message sent from server to extension via WebSocket
 * when an agent posts feedback or updates.
 */
export interface AgentFeedbackMessage {
  type: 'agent-feedback';
  payload: AgentFeedback;
}

export interface AgentResolveMessage {
  type: 'agent-resolve';
  payload: {
    tabId: number;
    targetId: string;
    summary: string;
    timestamp: number;
  };
}

export interface AgentThreadReplyMessage {
  type: 'agent-thread-reply';
  payload: {
    tabId: number;
    targetId: string;
    message: ThreadMessage;
  };
}

export type AgentToExtensionMessage =
  | AgentFeedbackMessage
  | AgentResolveMessage
  | AgentThreadReplyMessage;
```

**Step 2: Re-export from shared index**

In `packages/shared/src/index.ts`, add:

```typescript
export * from './types/agentFeedback';
```

**Step 3: Build shared package**

```bash
cd packages/shared && pnpm build
```

**Step 4: Commit**

```bash
git add packages/shared/src/types/agentFeedback.ts packages/shared/src/index.ts
git commit -m "feat: define shared types for agent feedback, threading, and WebSocket messages"
```

---

### Task 2: Add Agent Feedback Store to Context Store

**Files:**
- Modify: `packages/server/src/services/context-store.ts`

**Step 1: Import types and add storage**

```typescript
import type { AgentFeedback } from '@flow/shared';

// Add to ContextStore class:

private agentFeedbackByTab = new Map<number, Map<string, AgentFeedback>>();

private ensureTabBucket(tabId: number): Map<string, AgentFeedback> {
  const existing = this.agentFeedbackByTab.get(tabId);
  if (existing) return existing;
  const created = new Map<string, AgentFeedback>();
  this.agentFeedbackByTab.set(tabId, created);
  return created;
}

addAgentFeedback(tabId: number, feedback: AgentFeedback): void {
  this.ensureTabBucket(tabId).set(feedback.id, feedback);
}

getAgentFeedback(tabId: number, id: string): AgentFeedback | undefined {
  return this.agentFeedbackByTab.get(tabId)?.get(id);
}

getAllAgentFeedback(tabId: number): AgentFeedback[] {
  return Array.from(this.agentFeedbackByTab.get(tabId)?.values() ?? []);
}

getPendingAgentFeedback(tabId: number): AgentFeedback[] {
  return this.getAllAgentFeedback(tabId).filter(
    (f) => f.status === 'pending' || f.status === 'acknowledged',
  );
}

updateAgentFeedback(tabId: number, id: string, updates: Partial<AgentFeedback>): AgentFeedback | undefined {
  const existing = this.getAgentFeedback(tabId, id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  this.ensureTabBucket(tabId).set(id, updated);
  return updated;
}

resolveAgentFeedback(tabId: number, id: string, summary: string): AgentFeedback | undefined {
  return this.updateAgentFeedback(tabId, id, {
    status: 'resolved',
    resolvedAt: Date.now(),
    resolvedBy: 'agent',
    thread: [
      ...(this.getAgentFeedback(tabId, id)?.thread ?? []),
      { id: crypto.randomUUID(), role: 'agent', content: summary, timestamp: Date.now() },
    ],
  });
}

addThreadReply(tabId: number, feedbackId: string, message: { role: 'human' | 'agent'; content: string }): AgentFeedback | undefined {
  const existing = this.getAgentFeedback(tabId, feedbackId);
  if (!existing) return undefined;
  const reply = {
    id: crypto.randomUUID(),
    role: message.role,
    content: message.content,
    timestamp: Date.now(),
  };
  return this.updateAgentFeedback(tabId, feedbackId, {
    thread: [...existing.thread, reply],
  });
}
```

**Step 2: Build**

```bash
cd packages/server && pnpm build
```

**Step 3: Commit**

```bash
git add packages/server/src/services/context-store.ts
git commit -m "feat: add agent feedback storage with threading to context store"
```

---

### Task 3: Add MCP Write Tools

**Files:**
- Modify: `packages/server/src/routes/mcp.ts` (tool registrations + handler cases)

**Step 1: Define Zod input schemas**

Following the existing pattern in `mcp.ts` where all read-only tools use Zod validation, define schemas for the four write tools:

```typescript
import { z } from "zod";

const PostFeedbackInput = z.object({
  tabId: z.number().describe("Browser tab ID for scoping feedback."),
  selector: z.string().min(1).describe("CSS selector of the target element"),
  content: z.string().min(1).describe("Feedback text"),
  intent: z.enum(["comment", "question", "fix", "approve"]).default("comment").describe("Feedback type."),
  severity: z.enum(["blocking", "important", "suggestion"]).default("suggestion").describe("How urgent."),
  componentName: z.string().optional().describe("React component name (if known)"),
  sourceFile: z.string().optional().describe("Source file path (if known)"),
  sourceLine: z.number().optional().describe("Line number in source (if known)"),
});

const ResolveFeedbackInput = z.object({
  tabId: z.number().describe("Browser tab ID for scoping feedback."),
  id: z.string().min(1).describe("The annotation/feedback ID to resolve"),
  summary: z.string().min(1).describe("Brief summary of how the issue was resolved"),
});

const ReplyToThreadInput = z.object({
  tabId: z.number().describe("Browser tab ID for scoping feedback."),
  id: z.string().min(1).describe("The feedback ID to reply to"),
  content: z.string().min(1).describe("Reply text"),
});

const GetPendingFeedbackInput = z.object({
  tabId: z.number().describe("Browser tab ID to scope pending feedback."),
  offset: z.number().int().min(0).default(0).describe("Pagination offset"),
  limit: z.number().int().min(1).max(200).default(50).describe("Max items to return"),
});
```

**Step 2: Define write-specific annotations**

The existing read-only tools use `READ_ONLY_ANNOTATIONS`. Write tools need their own annotation sets:

```typescript
const WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

const RESOLVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,  // resolving twice is safe
  openWorldHint: false,
} as const;
```

**Step 3: Register tool definitions**

Each tool uses `zodToJsonSchema()` for `inputSchema`, the appropriate annotations, and an `outputSchema`. Use `GENERIC_OBJECT_OUTPUT_SCHEMA` for write tools, `PAGINATED_OUTPUT_SCHEMA` for `flow_get_pending_feedback`:

```typescript
{
  name: "flow_post_feedback",
  description:
    "Post structured feedback on a UI element. The feedback appears as a badge on the element in the browser and in the Flow panel. Use intent to classify: 'comment' for general notes, 'question' for clarification needs, 'fix' for issues found, 'approve' for sign-off.",
  inputSchema: zodToJsonSchema(PostFeedbackInput),
  annotations: WRITE_ANNOTATIONS,
  outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
},
{
  name: "flow_resolve_annotation",
  description:
    "Mark an annotation or feedback item as resolved. Provide a summary of how it was addressed.",
  inputSchema: zodToJsonSchema(ResolveFeedbackInput),
  annotations: RESOLVE_ANNOTATIONS,
  outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
},
{
  name: "flow_reply_to_thread",
  description:
    "Reply to an existing feedback thread on a UI element. Creates a threaded conversation between agent and human.",
  inputSchema: zodToJsonSchema(ReplyToThreadInput),
  annotations: WRITE_ANNOTATIONS,
  outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
},
{
  name: "flow_get_pending_feedback",
  description:
    "Get all unresolved feedback items (both human comments/questions and agent feedback) that still need attention.",
  inputSchema: zodToJsonSchema(GetPendingFeedbackInput),
  annotations: READ_ONLY_ANNOTATIONS,
  outputSchema: PAGINATED_OUTPUT_SCHEMA,
},
```

**Step 4: Add handler cases with Zod validation, structuredContent, and actionable errors**

The handler needs access to `broadcast` from the WebSocket handler. Update `McpDependencies` (see Task 4 for the full interface change).

Each handler validates input with `safeParse`, returns `structuredContent` alongside text content, and provides actionable error messages:

```typescript
case "flow_post_feedback": {
  const parsed = PostFeedbackInput.safeParse(args);
  if (!parsed.success) return zodError(parsed.error, "flow_post_feedback");
  const { tabId, selector, content, intent, severity, componentName, sourceFile, sourceLine } = parsed.data;

  const feedback: AgentFeedback = {
    id: crypto.randomUUID(),
    tabId,
    role: 'agent',
    intent,
    severity,
    status: 'pending',
    selector,
    componentName,
    sourceFile,
    sourceLine,
    content,
    thread: [],
    timestamp: Date.now(),
  };

  deps.contextStore.addAgentFeedback(tabId, feedback);

  // Broadcast to extension via WebSocket
  deps.broadcast({ type: 'agent-feedback', payload: feedback });

  const result = { success: true, id: feedback.id, message: "Feedback posted and sent to extension." };
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    structuredContent: result,
  };
}

case "flow_resolve_annotation": {
  const parsed = ResolveFeedbackInput.safeParse(args);
  if (!parsed.success) return zodError(parsed.error, "flow_resolve_annotation");
  const { tabId, id, summary } = parsed.data;

  const resolved = deps.contextStore.resolveAgentFeedback(tabId, id, summary);

  if (!resolved) {
    return {
      content: [{ type: "text", text: `No feedback found with id "${id}" in tab ${tabId}. Use flow_get_pending_feedback to list current feedback items.` }],
      isError: true,
    };
  }

  deps.broadcast({ type: 'agent-resolve', payload: { tabId, targetId: id, summary, timestamp: Date.now() } });

  const result = { success: true, id, status: "resolved" };
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    structuredContent: result,
  };
}

case "flow_reply_to_thread": {
  const parsed = ReplyToThreadInput.safeParse(args);
  if (!parsed.success) return zodError(parsed.error, "flow_reply_to_thread");
  const { tabId, id, content } = parsed.data;

  const updated = deps.contextStore.addThreadReply(tabId, id, { role: 'agent', content });

  if (!updated) {
    return {
      content: [{ type: "text", text: `No feedback found with id "${id}" in tab ${tabId}. Use flow_get_pending_feedback to list current feedback items.` }],
      isError: true,
    };
  }

  const reply = updated.thread[updated.thread.length - 1];
  deps.broadcast({ type: 'agent-thread-reply', payload: { tabId, targetId: id, message: reply } });

  const result = { success: true, id, threadLength: updated.thread.length };
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    structuredContent: result,
  };
}

case "flow_get_pending_feedback": {
  const parsed = GetPendingFeedbackInput.safeParse(args);
  if (!parsed.success) return zodError(parsed.error, "flow_get_pending_feedback");
  const { tabId, offset, limit } = parsed.data;

  // Combine agent feedback with human comments from the same tab
  const agentPending = deps.contextStore.getPendingAgentFeedback(tabId);
  const session = deps.contextStore.getSession(tabId);
  const humanComments = session?.comments ?? [];

  const allPending = [...agentPending, ...humanComments];
  const result = paginate(allPending, offset, limit);

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    structuredContent: result,
  };
}
```

**Step 5: Import types at top of file**

```typescript
import type { AgentFeedback, FeedbackIntent, FeedbackSeverity } from '@flow/shared';
```

**Step 6: Wire `broadcast` into McpDependencies**

Where the MCP handler is created (likely in the server's main setup), pass the WebSocket handler's `broadcast` function into `McpDependencies`. Check the server entry point to find where `createMcpHandler(deps)` is called and add the broadcast reference.

**Step 7: Build**

```bash
cd packages/server && pnpm build
```

**Step 8: Commit**

```bash
git add packages/server/src/routes/mcp.ts
git commit -m "feat: add MCP write tools (flow_post_feedback, flow_resolve_annotation, flow_reply_to_thread, flow_get_pending_feedback) with Zod, annotations, structuredContent"
```

---

### Task 4: Wire `broadcast` Into MCP Dependencies

**Files:**
- Modify: `packages/server/src/routes/mcp.ts` (update `McpDependencies` interface)
- Modify: Server entry point (find where `createMcpHandler` is called)

**Step 1: Update McpDependencies interface**

Make `broadcast` a required field (not optional). The server.ts wiring must always provide it:

```typescript
export interface McpDependencies {
  schemaResolver: SchemaResolver;
  tokenParser: TokenParser;
  sourceMapService: SourceMapService;
  contextStore: ContextStore;
  broadcast: (message: { type: string; payload: unknown }) => void;
}
```

Since `broadcast` is required, all handler code uses `deps.broadcast()` directly instead of `deps.broadcast?.()`. This ensures a compile-time error if the wiring is missing.

**Step 2: Find the server entry point**

Search for `createMcpHandler` usage. It's in `packages/server/src/server.ts`.

**Step 3: Pass broadcast function**

The WebSocket handler's `createWebSocketHandler()` returns an object with a `broadcast` method. Wire it to MCP deps:

```typescript
const wsHandler = createWebSocketHandler(watcher, contextStore);

const mcpDeps: McpDependencies = {
  schemaResolver,
  tokenParser,
  sourceMapService,
  contextStore,
  broadcast: wsHandler.broadcast,
};
```

> **Note:** The `broadcast` field is required. Since `server.ts` currently creates `wsHandler` before `mcpHandler`, the order is correct. If initialization order changes, use a late-binding pattern (e.g., assign to a `let` variable and pass a wrapper that delegates to it).

**Step 4: Build and verify**

```bash
cd packages/server && pnpm build
```

**Step 5: Commit**

```bash
git add packages/server/src/
git commit -m "feat: wire WebSocket broadcast into MCP dependencies for agent→extension messaging"
```

---

### Task 5: Make Extension Sidecar Sync Bidirectional

**Files:**
- Modify: `packages/extension/src/services/sidecarSync.ts`

Currently `sidecarSync.ts` is send-only — it pushes session data to the server but ignores incoming WebSocket messages. Add an `onmessage` handler.

**Step 1: Add incoming message handler**

```typescript
import type { AgentToExtensionMessage } from '@flow/shared';

type IncomingMessageListener = (message: AgentToExtensionMessage) => void;
const incomingListeners = new Set<IncomingMessageListener>();

export function onAgentMessage(listener: IncomingMessageListener): () => void {
  incomingListeners.add(listener);
  return () => incomingListeners.delete(listener);
}
```

**Step 2: Add `ws.onmessage` in `connectToSidecar()`**

Inside the `connectToSidecar()` function, after `ws.onopen`:

```typescript
ws.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'agent-feedback' || msg.type === 'agent-resolve' || msg.type === 'agent-thread-reply') {
      for (const listener of incomingListeners) {
        listener(msg as AgentToExtensionMessage);
      }
    }
  } catch {
    // Ignore malformed messages
  }
};
```

**Step 3: Commit**

```bash
git add packages/extension/src/services/sidecarSync.ts
git commit -m "feat: make sidecar sync bidirectional — listen for agent messages"
```

---

### Task 6: Route Agent Messages to Store and Content Script

**Files:**
- Modify: `packages/extension/src/panel/hooks/useSessionSync.ts` (listen for agent messages)
- Modify: `packages/extension/src/panel/stores/slices/commentSlice.ts` (add agent feedback handling)

**Step 1: Add agent message routing in useSessionSync**

In `useSessionSync.ts`, subscribe to incoming agent messages and route them:

```typescript
import { onAgentMessage } from '../../services/sidecarSync';

// Inside the hook, add:
useEffect(() => {
  const unsub = onAgentMessage((msg) => {
    const store = useAppStore.getState();

    switch (msg.type) {
      case 'agent-feedback':
        store.addAgentFeedback(msg.payload);
        break;
      case 'agent-resolve':
        store.resolveByAgent(msg.payload.tabId, msg.payload.targetId, msg.payload.summary);
        break;
      case 'agent-thread-reply':
        store.addThreadReply(msg.payload.tabId, msg.payload.targetId, msg.payload.message);
        break;
    }
  });
  return unsub;
}, []);
```

**Step 2: Add agent feedback actions to commentSlice**

Extend `commentSlice.ts` with new actions for agent feedback. The exact shape depends on how Sub-Plan 3 implemented the comment/feedback type. Add:

```typescript
// State additions
agentFeedback: AgentFeedback[];

// Actions
addAgentFeedback: (feedback: AgentFeedback) => void;
resolveByAgent: (tabId: number, targetId: string, summary: string) => void;
addThreadReply: (tabId: number, targetId: string, message: ThreadMessage) => void;
replyToAgentFeedback: (tabId: number, feedbackId: string, content: string) => void;
```

Implementation:

```typescript
agentFeedback: [],

addAgentFeedback: (feedback) => {
  set((state) => ({
    agentFeedback: [...state.agentFeedback, feedback],
  }));
  // Also send to content script for badge rendering
  sendToContent({
    type: 'panel:agent-feedback',
    payload: feedback,
  });
},

resolveByAgent: (tabId, targetId, summary) => {
  set((state) => ({
    // Update only the matching feedback in the current tab
    agentFeedback: state.agentFeedback.map((f) =>
      f.id === targetId && f.tabId === tabId
        ? { ...f, status: 'resolved' as const, resolvedAt: Date.now(), resolvedBy: 'agent' as const }
        : f,
    ),
  }));
  sendToContent({
    type: 'panel:agent-resolve',
    payload: { tabId, targetId, summary },
  });
},

addThreadReply: (tabId, targetId, message) => {
  set((state) => ({
    agentFeedback: state.agentFeedback.map((f) =>
      f.id === targetId && f.tabId === tabId
        ? { ...f, thread: [...f.thread, message] }
        : f,
    ),
  }));
},

// Human replies to agent feedback — also pushes to sidecar so agent can read it
replyToAgentFeedback: (tabId, feedbackId, content) => {
  const reply: ThreadMessage = {
    id: crypto.randomUUID(),
    role: 'human',
    content,
    timestamp: Date.now(),
  };
  set((state) => ({
    agentFeedback: state.agentFeedback.map((f) =>
      f.id === feedbackId && f.tabId === tabId
        ? { ...f, thread: [...f.thread, reply] }
        : f,
    ),
  }));
},
```

**Step 3: Commit**

```bash
git add packages/extension/src/panel/hooks/useSessionSync.ts packages/extension/src/panel/stores/slices/commentSlice.ts
git commit -m "feat: route agent messages to store and add agent feedback actions"
```

---

### Task 7: Render Agent Badges on Page (Content Script)

**Files:**
- Modify: `packages/extension/src/content/panelRouter.ts` (add `panel:agent-feedback` and `panel:agent-resolve` handlers)
- Reference: `packages/extension/src/content/annotationBadges.ts` (shadow DOM badge pattern)

**Step 1: Add agent badge rendering**

In `panelRouter.ts`, add handlers for agent feedback messages. These should create badges with a **distinct style** — purple background (vs blue for human), with a small sparkle/AI indicator. Use CSS custom properties with fallback values so themes can override badge colors:

```typescript
// Agent feedback badge map
const agentBadges = new Map<string, HTMLElement>();

function handleAgentFeedback(payload: AgentFeedback) {
  const target = document.querySelector(payload.selector);
  if (!target) return;

  // Reuse the shadow host from annotationBadges
  const shadowHost = ensureShadowHost();
  const shadowRoot = shadowHost.shadowRoot!;

  // Create agent badge — distinct purple color
  const badge = document.createElement('div');
  badge.dataset.agentFeedbackId = payload.id;

  const intentIcon = {
    comment: '💬',
    question: '❓',
    fix: '🔧',
    approve: '✅',
  }[payload.intent] ?? '💬';

  badge.style.cssText = `
    position: absolute;
    z-index: 2147483647;
    background: var(--flow-agent-badge-bg, #7c3aed);
    color: white;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 11px;
    font-family: system-ui, sans-serif;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 2px 8px var(--flow-agent-badge-shadow, rgba(124, 58, 237, 0.4));
    display: flex;
    align-items: center;
    gap: 4px;
    transition: transform 0.15s ease-out;
  `;
  badge.textContent = `${intentIcon} Agent`;

  // Position relative to target element
  const rect = target.getBoundingClientRect();
  badge.style.left = `${rect.right - 60}px`;
  badge.style.top = `${rect.top - 24 + window.scrollY}px`;

  // Hover tooltip with content preview
  badge.title = payload.content;

  // Hover scale
  badge.addEventListener('mouseenter', () => {
    badge.style.transform = 'scale(1.1)';
  });
  badge.addEventListener('mouseleave', () => {
    badge.style.transform = 'scale(1)';
  });

  shadowRoot.appendChild(badge);
  agentBadges.set(payload.id, badge);
}

function handleAgentResolve(payload: { tabId: number; targetId: string; summary: string }) {
  const badge = agentBadges.get(payload.targetId);
  if (badge) {
    // Visual resolve: change color to green, show checkmark
    badge.style.background = 'var(--flow-agent-resolved-bg, #10b981)';
    badge.style.boxShadow = '0 2px 8px var(--flow-agent-resolved-shadow, rgba(16, 185, 129, 0.4))';
    badge.textContent = '✅ Resolved';
    badge.title = payload.summary;

    // Fade out after 3s
    setTimeout(() => {
      badge.style.opacity = '0';
      badge.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        badge.remove();
        agentBadges.delete(payload.targetId);
      }, 300);
    }, 3000);
  }
}
```

**Step 2: Wire into the message router**

In `panelRouter.ts`, add cases to the main message switch:

```typescript
case 'panel:agent-feedback':
  handleAgentFeedback(msg.payload);
  break;

case 'panel:agent-resolve':
  handleAgentResolve(msg.payload);
  break;
```

**Step 3: Commit**

```bash
git add packages/extension/src/content/panelRouter.ts
git commit -m "feat: render distinct purple agent badges on page with hover tooltip"
```

---

### Task 8: Add Agent Feedback to FeedbackPanel

**Files:**
- Modify: `packages/extension/src/panel/components/FeedbackPanel.tsx` (created in Sub-Plan 3)

**Step 1: Show agent feedback alongside human comments**

In FeedbackPanel, add a section for agent feedback. Agent items should have:
- Purple left border (vs blue for human)
- Sparkle icon or "Agent" label next to the component name
- Intent badge (comment/question/fix/approve)
- Severity badge (blocking/important/suggestion)
- Thread view showing conversation history
- Reply input for human to respond

```tsx
// Agent feedback item component
function AgentFeedbackItem({ feedback }: { feedback: AgentFeedback }) {
  const [replyText, setReplyText] = useState('');
  const [showThread, setShowThread] = useState(false);
  const replyToAgentFeedback = useAppStore((s) => s.replyToAgentFeedback);

  const intentColors: Record<string, string> = {
    comment: 'bg-purple-100 text-purple-800',
    question: 'bg-amber-100 text-amber-800',
    fix: 'bg-red-100 text-red-800',
    approve: 'bg-green-100 text-green-800',
  };

  const severityColors: Record<string, string> = {
    blocking: 'text-red-500',
    important: 'text-amber-500',
    suggestion: 'text-content-secondary',
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    replyToAgentFeedback(feedback.tabId, feedback.id, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="border-l-2 border-purple-500 pl-3 py-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-purple-600">Agent</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${intentColors[feedback.intent]}`}>
          {feedback.intent}
        </span>
        <span className={`text-[10px] ${severityColors[feedback.severity]}`}>
          {feedback.severity}
        </span>
        {feedback.status === 'resolved' && (
          <span className="text-[10px] text-green-600">Resolved</span>
        )}
      </div>

      <p className="text-xs text-content-primary mb-1">{feedback.content}</p>

      <div className="flex items-center gap-2 text-[10px] text-content-secondary">
        <span>{feedback.componentName ?? feedback.selector}</span>
        {feedback.thread.length > 0 && (
          <button
            onClick={() => setShowThread(!showThread)}
            className="underline hover:text-content-primary"
          >
            {feedback.thread.length} {feedback.thread.length === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Thread */}
      {showThread && feedback.thread.length > 0 && (
        <div className="mt-2 space-y-1 ml-2">
          {feedback.thread.map((msg) => (
            <div key={msg.id} className="text-xs">
              <span className={msg.role === 'agent' ? 'text-purple-600' : 'text-blue-600'}>
                {msg.role === 'agent' ? 'Agent' : 'You'}:
              </span>{' '}
              <span className="text-content-primary">{msg.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {feedback.status !== 'resolved' && (
        <div className="mt-2 flex gap-1">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
            placeholder="Reply..."
            className="flex-1 text-xs border border-edge-primary rounded px-2 py-1 bg-surface-primary text-content-primary"
          />
          <button
            onClick={handleReply}
            disabled={!replyText.trim()}
            className="text-xs px-2 py-1 rounded bg-purple-600 text-white disabled:opacity-40"
          >
            Reply
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Integrate into FeedbackPanel layout**

In the FeedbackPanel component, after the human comments section, add:

```tsx
{/* Agent Feedback */}
{agentFeedback.length > 0 && (
  <div className="space-y-2">
    <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
      Agent Feedback ({agentFeedback.length})
    </h4>
    {agentFeedback.map((feedback) => (
      <AgentFeedbackItem key={feedback.id} feedback={feedback} />
    ))}
  </div>
)}
```

**Step 3: Commit**

```bash
git add packages/extension/src/panel/components/FeedbackPanel.tsx
git commit -m "feat: show agent feedback in FeedbackPanel with threading and reply"
```

---

### Task 9: Include Agent Feedback in Session Sync

**Files:**
- Modify: `packages/extension/src/panel/hooks/useSessionSync.ts` (add agentFeedback to push payload)
- Modify: `packages/extension/src/services/sidecarSync.ts` (extend payload type if needed)

**Step 1: Add agentFeedback to session push**

In `useSessionSync.ts`, add `agentFeedback` to the `pushSessionToSidecar` call so that human replies to agent threads get synced back to the server:

```typescript
const agentFeedback = useAppStore((s) => s.agentFeedback);

// In the push effect:
pushSessionToSidecar(
  compiledPrompt.metadata.tabId,
  compiledPrompt.markdown,
  {
    annotations: annotations ?? [],
    textEdits: textEdits ?? [],
    mutationDiffs: mutationDiffs ?? [],
    animationDiffs: animationDiffs ?? [],
    promptSteps: promptSteps ?? [],
    comments: comments ?? [],
    agentFeedback: agentFeedback ?? [],
  },
);
```

Note: Agent feedback threads are stored server-side in the `agentFeedback` Map. Human replies via `replyToAgentFeedback` should also push to the server. This can be done by having the reply action also call a dedicated WebSocket message.

> **Note:** Pagination for `flow_get_pending_feedback` is handled by the `GetPendingFeedbackInput` Zod schema (which includes `offset` and `limit` fields with defaults) and the existing `paginate()` helper in `mcp.ts`. No additional pagination logic is needed in the session sync layer.

Human replies push via dedicated WebSocket message:

```typescript
// In sidecarSync.ts, add:
export function pushHumanReply(tabId: number, feedbackId: string, content: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      type: 'human-thread-reply',
      payload: { tabId, feedbackId, content },
    }),
  );
}
```

**Step 2: Handle `human-thread-reply` on the server**

In `websocket.ts`, add a case:

```typescript
case "human-thread-reply": {
  const { tabId, feedbackId, content } = msg.payload as { tabId: number; feedbackId: string; content: string };
  contextStore.addThreadReply(tabId, feedbackId, { role: 'human', content });
  break;
}
```

Add `"human-thread-reply"` to `WsMessageType` union.

**Step 3: Commit**

```bash
git add packages/extension/src/panel/hooks/useSessionSync.ts packages/extension/src/services/sidecarSync.ts packages/server/src/routes/websocket.ts
git commit -m "feat: sync human thread replies back to server for agent reading"
```

---

### Task 10: End-to-End Verification

**Files:** None (verification only)

**Step 1: Start server and extension**

```bash
cd packages/server && pnpm dev
cd packages/extension && pnpm build
```

**Step 2: Test `flow_post_feedback`**

Using an MCP client, call:

```json
{
  "name": "flow_post_feedback",
  "arguments": {
    "tabId": 123,
    "selector": "button.primary",
    "content": "This button's hover state has insufficient contrast. Consider using --color-content-inverted.",
    "intent": "fix",
    "severity": "important"
  }
}
```

Verify:
- Purple badge appears on the `button.primary` element in the browser
- Badge shows "🔧 Agent" text
- Hovering badge shows the feedback content as tooltip
- FeedbackPanel shows the agent feedback with purple left border
- Intent badge shows "fix", severity shows "important"

**Step 3: Test human reply**

1. In FeedbackPanel, type a reply to the agent feedback
2. Click "Reply" or press Enter
3. Verify: Reply appears in the thread view
4. Call `flow_get_pending_feedback` with the same `tabId` via MCP → verify the human reply is in the thread

**Step 4: Test `flow_reply_to_thread`**

Call via MCP:

```json
{
  "name": "flow_reply_to_thread",
  "arguments": {
    "tabId": 123,
    "id": "<feedback-id>",
    "content": "Good point. I've updated the hover state to use var(--color-content-inverted). Can you verify?"
  }
}
```

Verify: Agent reply appears in the FeedbackPanel thread.

**Step 5: Test `flow_resolve_annotation`**

Call via MCP:

```json
{
  "name": "flow_resolve_annotation",
  "arguments": {
    "tabId": 123,
    "id": "<feedback-id>",
    "summary": "Fixed contrast issue by switching to semantic token."
  }
}
```

Verify:
- Badge on page turns green, shows "✅ Resolved"
- Badge fades out after 3s
- FeedbackPanel shows "Resolved" status

**Step 6: Test `flow_get_pending_feedback`**

1. Post 3 agent feedbacks with different intents
2. Resolve 1
3. Call `flow_get_pending_feedback` with the same `tabId`
4. Verify: Only 2 unresolved items returned

---

## Data Flow Summary

```
Agent calls flow_post_feedback via MCP
  → mcp.ts handler validates with Zod, creates AgentFeedback
  → contextStore.addAgentFeedback(tabId, feedback)
  → broadcast({ type: 'agent-feedback', payload: feedback })
  → WebSocket → extension sidecarSync.ts onmessage
  → onAgentMessage listeners fire
  → useSessionSync routes to commentSlice.addAgentFeedback()
    → Zustand state updates → FeedbackPanel re-renders
    → sendToContent({ type: 'panel:agent-feedback' })
      → panelRouter.ts → handleAgentFeedback() → purple badge on page

Human replies in FeedbackPanel
  → commentSlice.replyToAgentFeedback(tabId, id, content)
  → pushHumanReply(tabId, id, content) via WebSocket
  → Server websocket.ts → contextStore.addThreadReply(tabId, ...)
  → Agent calls flow_get_pending_feedback → sees human reply in thread (paginated)
```

## Files Created

| File | Purpose |
|------|---------|
| `shared/types/agentFeedback.ts` | Shared types: AgentFeedback, ThreadMessage, FeedbackIntent/Severity/Status, WebSocket message types |

## Files Modified

| File | Change |
|------|--------|
| `shared/index.ts` | Re-export agentFeedback types |
| `server/services/context-store.ts` | Add tab-scoped `agentFeedback` storage, CRUD methods, thread reply support |
| `server/routes/mcp.ts` | Add 4 write tools with `flow_` prefix (`flow_post_feedback`, `flow_resolve_annotation`, `flow_reply_to_thread`, `flow_get_pending_feedback`), Zod input schemas, write-specific annotations (`WRITE_ANNOTATIONS`, `RESOLVE_ANNOTATIONS`), `structuredContent` + `outputSchema`, `paginate()` for `flow_get_pending_feedback`, actionable error messages |
| `server/routes/websocket.ts` | Add `human-thread-reply` handler, extend WsMessageType |
| Server entry point | Wire `broadcast` from WebSocket handler into MCP dependencies (required field, not optional) |
| `extension/services/sidecarSync.ts` | Add `onAgentMessage()` listener, `ws.onmessage`, `pushHumanReply()` |
| `extension/panel/hooks/useSessionSync.ts` | Subscribe to agent messages, route to store |
| `extension/panel/stores/slices/commentSlice.ts` | Add `agentFeedback[]`, `addAgentFeedback`, `resolveByAgent`, `addThreadReply`, `replyToAgentFeedback` |
| `extension/content/panelRouter.ts` | Add `panel:agent-feedback` and `panel:agent-resolve` handlers, badge rendering with CSS custom properties (`--flow-agent-badge-bg`, `--flow-agent-badge-shadow`, `--flow-agent-resolved-bg`, `--flow-agent-resolved-shadow`) |
| `extension/panel/components/FeedbackPanel.tsx` | Add AgentFeedbackItem component with threading, reply input, intent/severity badges |
