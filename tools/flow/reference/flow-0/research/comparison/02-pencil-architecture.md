# Pencil Architecture Analysis

> Task: fn-3-46x.2 | Epic: Pencil vs RadFlow Architecture Comparison
> Generated: 2026-01-22

Deep dive into Pencil's architecture based on code analysis of extracted source at `/tmp/pencil-extracted/`.

---

## Executive Summary

Pencil is a **design-first tool** that uses a WASM-based canvas renderer and integrates directly with AI agents (Claude, Codex) via MCP (Model Context Protocol). Unlike RadFlow's "context engineering" approach (clipboard-first, no direct writes), Pencil embraces **direct AI manipulation** of design files through MCP tools.

**Key Architectural Differences from RadFlow:**

| Aspect | Pencil | RadFlow |
|--------|--------|---------|
| Philosophy | "Design becomes code" (translation) | "Design IS code" (no abstraction) |
| AI Integration | MCP tools (direct writes) | Clipboard-first (context bundling) |
| Canvas | WASM renderer (pencil.wasm ~7MB) | CSS scale() + iframe |
| File Format | `.pen` (JSON-based proprietary) | Existing project files |
| Target User | Designers + AI agents | Developers + AI agents |

---

## 1. Streaming Updates Architecture

### 1.1 Real-Time Agent Communication

Pencil implements sophisticated streaming for AI agent interactions via the Claude Agent SDK.

**Core Flow:**

```
User Input → WebSocket → Agent (Claude/Codex) → MCP Server → Canvas
     ↑                                              │
     └──────────────────────────────────────────────┘
                    (tool results)
```

**Key Files:**
- `@ha/agent/src/claude/index.ts` - Claude agent implementation
- `@ha/ipc/src/ipc-device-manager.ts` - Central IPC orchestration
- `@ha/ws-server/src/websocket-server.ts` - WebSocket server

### 1.2 Event Types Emitted During Agent Execution

From `ipc-device-manager.ts`, the following events stream to the frontend:

| Event | Description |
|-------|-------------|
| `chat-session` | Session ID for resume capability |
| `chat-assistant-delta` | Text streaming (delta computation) |
| `chat-tool-use` | Tool invocation notification |
| `chat-tool-use-start` | Tool execution started |
| `chat-tool-result` | Tool execution completed |
| `chat-agent-message` | Full assistant message content |
| `chat-assistant-final` | Completion with final response |
| `chat-error` | Error notification |
| `chat-question-answered` | User answered a clarifying question |

### 1.3 Delta Computation Pattern

Pencil computes text deltas for efficient streaming:

```typescript
// From ipc-device-manager.ts
let accumulatedText = "";
// ...
if (newText.length > accumulatedText.length) {
  const delta = newText.slice(accumulatedText.length);
  accumulatedText = newText;
  ipc.notify("chat-assistant-delta", {
    conversationId,
    textDelta: delta,
  });
}
```

This ensures only new content is sent, reducing bandwidth and enabling smooth UI updates.

### 1.4 Partial JSON Delta for batch_design

**Key Innovation:** Pencil streams partial `batch_design` operations before the full JSON is complete.

From `@ha/agent/src/claude/index.ts`:

```typescript
const batchDesignCalls = new Map<number, {
  filePath?: string;
  operations: string[];
  acc: string;
  id: string;
}>();

// On content_block_delta:
call.acc += message.event.delta.partial_json;
const parsed = completePartialBatchDesign(call.acc);

if (parsed?.operations && parsed.operations.length > call.operations.length) {
  const newOperations = [];
  for (let i = call.operations.length; i < parsed.operations.length; ++i) {
    newOperations.push(parsed.operations[i]);
  }
  // Emit immediately
  this.emit("batch-design", {
    filePath: parsed.filePath,
    operations: newOperations.join("\n"),
    id: call.id,
    partial: true,
  });
}
```

**Result:** The canvas updates incrementally as the agent generates operations, not just when the tool call completes.

### 1.5 Session Resume

Sessions can be resumed via `sessionId`:

```typescript
if (sessionId) {
  options.resume = sessionId;
  logger.info(`Resuming session: ${sessionId}`);
}
```

**RadFlow Opportunity:** Implement session persistence for AI conversations to enable pause/resume of complex refactoring tasks.

---

## 2. Visual Polish & UI/UX Patterns

### 2.1 Editor Architecture

**Tech Stack:**
- Electron desktop app with custom protocol (`pencil://`)
- WASM canvas renderer (`pencil.wasm` - 7.4MB)
- React frontend (bundled as `index.js` - 5.5MB)
- Web workers for async operations (`webworkerAll.js`)

**Window Configuration:**
```typescript
// From app.js
this.mainWindow = new BrowserWindow({
  titleBarStyle: "hiddenInset",  // macOS native look
  frame: process.platform !== "darwin",
  backgroundColor: "#1e1e1e",    // Dark theme default
  trafficLightPosition: { x: 12, y: 12 },
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, "preload.js"),
  },
});
```

### 2.2 Content Security Policy

From `editor/index.html`, the CSP shows integration points:

```
connect-src 'self'
  http://localhost:3001
  http://api.localhost:3001
  https://api.pencil.dev
  https://api.reve.com
  https://*.ingest.us.sentry.io    // Error tracking
  https://*.posthog.com            // Analytics
  https://fonts.gstatic.com
  https://images.unsplash.com      // Stock images
```

**RadFlow Opportunity:** Add error tracking (Sentry) and analytics (PostHog/Amplitude) for understanding user behavior.

### 2.3 File Management Patterns

**Recent Files:**
```typescript
const MAX_RECENT_FILES = 14;
function addRecentFile(filePath) {
  const recentFiles = desktopConfig.get("recentFiles");
  const filtered = recentFiles.filter((f) => f !== filePath);
  const updated = [filePath, ...filtered].slice(0, MAX_RECENT_FILES);
  desktopConfig.set("recentFiles", updated);
}
```

**Dirty State Handling:**
```typescript
mainWindow.on("close", async (event) => {
  if (!this.ignoreDirtyOnClose && isLoggedIn && device.getIsDirty()) {
    event.preventDefault();
    const cancelled = await device.saveResource({ userAction: false });
    if (cancelled) return;
    // ...
  }
});
```

### 2.4 Fullscreen Events

```typescript
mainWindow.on("enter-full-screen", () => {
  mainWindowIPC.notify("fullscreen-change", true);
});
mainWindow.on("leave-full-screen", () => {
  mainWindowIPC.notify("fullscreen-change", false);
});
```

**RadFlow Opportunity:** Add fullscreen mode for distraction-free editing.

---

## 3. Component Display Approach

### 3.1 The `.pen` File Format

From `@ha/schema/pen.schema.json` (955 lines), the format is a tree structure:

**Root:**
```json
{
  "version": "string",
  "fonts": [...],
  "themes": {...},
  "variables": {...},
  "children": [...]
}
```

**Node Types:**
- `frame` - Rectangles with children (flex layout support)
- `group` - Logical grouping
- `rectangle`, `ellipse`, `line`, `polygon`, `path` - Primitives
- `text` - Text content with rich styling
- `ref` - Component instances
- `note`, `prompt`, `context` - Meta nodes
- `icon_font` - Icon rendering

### 3.2 The Reusable + Ref + Descendants Pattern

**Component Definition:**
```json
{
  "id": "button",
  "type": "frame",
  "reusable": true,
  "children": [
    { "id": "label", "type": "text", "content": "Button" }
  ]
}
```

**Component Instance (ref):**
```json
{
  "id": "submit-button",
  "type": "ref",
  "ref": "button",
  "descendants": {
    "label": { "content": "Submit" }
  }
}
```

**Key Points:**
- `reusable: true` marks a node as a component definition
- `ref` creates instances that inherit from the definition
- `descendants` allows property overrides on nested children
- Paths like `"instanceId/childId"` for deep customization

### 3.3 Slot-Based Composition

Frames can declare slots for child injection:

```json
{
  "type": "frame",
  "slot": ["recommended-child-1", "recommended-child-2"],
  "placeholder": true
}
```

**Usage Pattern:**
```typescript
// From batch_design tool documentation
card=I(body, {type: "ref", ref: "CardComp"})
newTitle=R(card+"/headerSlot", {type: "text", content: "Custom Title"})
```

### 3.4 Layout System

Pencil uses a CSS-like flexbox model:

```json
{
  "layout": "horizontal" | "vertical" | "none",
  "gap": 16,
  "padding": [16, 24],  // or single number
  "justifyContent": "start" | "center" | "end" | "space_between" | "space_around",
  "alignItems": "start" | "center" | "end"
}
```

**Sizing:**
```json
{
  "width": 200,                      // Fixed
  "width": "fit_content",            // Auto
  "width": "fill_container",         // Flex grow
  "width": "fill_container(200)"     // With fallback
}
```

### 3.5 Variables and Theming

**Theme Axes:**
```json
{
  "themes": {
    "device": ["phone", "tablet", "desktop"],
    "mode": ["light", "dark"]
  }
}
```

**Variable Definition:**
```json
{
  "variables": {
    "$primary-color": {
      "type": "color",
      "value": [
        { "value": "#007AFF", "theme": { "mode": "light" } },
        { "value": "#0A84FF", "theme": { "mode": "dark" } }
      ]
    }
  }
}
```

**Usage:**
```json
{ "fill": "$primary-color" }
```

**RadFlow Opportunity:** Pencil's theming system is similar to RadFlow's two-tier tokens (public/private). Could adopt the axis-based variant system for responsive design tokens.

---

## 4. MCP Tools Catalog

Pencil exposes 14+ MCP tools for AI agents. From the tool descriptions in the conversation:

### 4.1 Core Design Tools

| Tool | Description |
|------|-------------|
| `batch_design` | Execute insert/copy/update/replace/move/delete operations in batch (max 25 ops) |
| `batch_get` | Retrieve nodes by patterns or IDs with configurable depth |
| `snapshot_layout` | Get layout structure for overlap/clipping detection |

### 4.2 Document Management

| Tool | Description |
|------|-------------|
| `get_editor_state` | Get active canvas, selection, and design info |
| `open_document` | Open new or existing `.pen` file |
| `get_variables` | Get variables and themes |
| `set_variables` | Update variables and themes |

### 4.3 Search and Navigation

| Tool | Description |
|------|-------------|
| `find_empty_space_around_node` | Find available space for new content |

### 4.4 Guidelines and Resources

| Tool | Description |
|------|-------------|
| `get_guidelines` | Get design rules (code, table, tailwind, landing-page, design-system topics) |
| `get_style_guide` | Get visual inspiration by tags |
| `get_style_guide_tags` | List available style guide tags |

### 4.5 Utility Tools

| Tool | Description |
|------|-------------|
| `get_screenshot` | Capture node as image for verification |
| `replace_all_matching_properties` | Bulk property replacement |
| `search_all_unique_properties` | Find unique values for refactoring |

### 4.6 batch_design Operations DSL

The tool uses a custom DSL:

```javascript
// Insert
sidebar=I("parentId", {type: "frame", layout: "vertical"})

// Copy
copy=C("sourceId", "targetParent", {positionDirection: "right"})

// Update
U("nodeId", {content: "New Text"})

// Replace
R("instanceId/slot", {type: "text", content: "Custom"})

// Move
M("nodeId", "newParent", 2)  // Index optional

// Delete
D("nodeId")

// Generate Image
G("frameId", "stock", "mountain landscape")
```

**RadFlow MCP Opportunity:** RadFlow could implement similar tools:
- `get_component_map` - Return discovered components
- `get_token_values` - Return design tokens
- `highlight_element` - Visual selection feedback
- `export_context` - Bundle context for clipboard
- `apply_style` - Direct style application (if adding direct writes)

---

## 5. Architecture Overview

### 5.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Pencil Desktop App                          │
│  (Electron + Custom Protocol)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   main.js    │    │   app.js     │    │   menu.js    │      │
│  │  (Entry)     │───>│ (PencilApp)  │    │ (App Menu)   │      │
│  └──────────────┘    └──────┬───────┘    └──────────────┘      │
│                             │                                    │
│         ┌───────────────────┴───────────────────┐               │
│         │                                        │               │
│         ▼                                        ▼               │
│  ┌──────────────┐                         ┌──────────────┐      │
│  │ IPC Device   │                         │ WebSocket    │      │
│  │ Manager      │◄───────────────────────>│ Server       │      │
│  │ (@ha/ipc)    │                         │ (@ha/ws)     │      │
│  └──────┬───────┘                         └──────┬───────┘      │
│         │                                        │               │
│         │ IPC (postMessage)                      │ WS (JSON)    │
│         ▼                                        ▼               │
│  ┌──────────────┐                         ┌──────────────┐      │
│  │   Editor     │                         │ MCP Server   │      │
│  │ (WASM Canvas)│                         │ (Binary)     │      │
│  │ pencil.wasm  │                         │ --ws-port    │      │
│  └──────────────┘                         └──────────────┘      │
│         │                                        ▲               │
│         │                                        │               │
│         │                                        │               │
└─────────┼────────────────────────────────────────┼───────────────┘
          │                                        │
          │ postMessage                            │ stdio
          ▼                                        │
   ┌──────────────┐                         ┌──────────────┐
   │   Browser    │                         │    Agent     │
   │   Window     │                         │ Claude/Codex │
   └──────────────┘                         └──────────────┘
```

### 5.2 Key Packages

| Package | Size | Purpose |
|---------|------|---------|
| `@ha/agent` | - | Agent abstraction (Claude, Codex) |
| `@ha/ipc` | - | IPC device manager, request router |
| `@ha/mcp` | - | MCP installer for external tools |
| `@ha/schema` | 33KB | `.pen` file JSON Schema |
| `@ha/shared` | - | IPC types, logger |
| `@ha/ws-server` | - | WebSocket server for MCP |

### 5.3 MCP Integration Architecture

Pencil auto-installs to multiple AI tools:

```typescript
const MCP_CONFIG_MAP = {
  claudeCodeCLI: "~/.claude.json",
  codexCLI: "~/.codex/config.toml",
  geminiCLI: "~/.gemini/settings.json",
  windsurfIDE: "~/.codeium/windsurf/mcp_config.json",
  cursorCLI: "~/.cursor/mcp.json",
  antigravityIDE: "~/.gemini/antigravity/mcp_config.json",
};
```

**Auto-Allow Rules:**
```typescript
// Adds mcp__pencil to ~/.claude/settings.json permissions.allow
obj.permissions.allow.push(`mcp__${PENCIL_MCP_NAME}`);
```

**RadFlow Consideration:** If RadFlow adds MCP, it could auto-install similarly. But the "skills" approach (Claude Code skills) may be sufficient for context-provider use cases.

---

## 6. Potential RadFlow Improvements

Based on Pencil analysis, these patterns could enhance RadFlow:

### 6.1 Streaming & UX

| Feature | Pencil Pattern | RadFlow Application |
|---------|---------------|---------------------|
| Delta text streaming | Accumulated text diffing | Stream Comment Mode compilation preview |
| Session resume | sessionId persistence | Resume long AI refactoring tasks |
| Tool use indicators | `chat-tool-use-start/result` | Show "Analyzing component..." status |
| Fullscreen mode | Window event handling | Add distraction-free editing |

### 6.2 Component System

| Feature | Pencil Pattern | RadFlow Application |
|---------|---------------|---------------------|
| Slot-based composition | `slot` property on frames | Component Canvas variant injection |
| Theme axes | Multi-dimensional theming | Responsive token variants |
| Partial updates | `partial: true` batch events | Live preview as user types |

### 6.3 MCP Tools (if adding direct writes)

**Recommended Tool Set:**

```typescript
// Context tools (read-only, matches RadFlow philosophy)
get_component_map     // Return discovered components with props
get_design_tokens     // Return parsed tokens from CSS
get_file_content      // Return file contents for context
get_element_styles    // Computed styles for selected element

// Action tools (if adding direct writes)
highlight_element     // Visual feedback in iframe
export_to_clipboard   // Bundle context for external tools
apply_token_override  // Write inline style to component
```

### 6.4 Developer Experience

| Feature | Pencil Approach | RadFlow Opportunity |
|---------|----------------|---------------------|
| Recent files | MRU list with persistence | Add recent projects panel |
| Auto-save prompts | Dirty state checking | Warn on unsaved Comment Mode sessions |
| Error tracking | Sentry integration | Add crash reporting |
| Analytics | PostHog integration | Track feature usage |

---

## 7. Key Takeaways

### 7.1 Where Pencil Excels

1. **AI-Native Design** - Built from ground up for AI manipulation
2. **Streaming UX** - Delta computation, partial updates, tool progress
3. **Comprehensive Schema** - 955-line JSON Schema for `.pen` format
4. **Multi-Tool Integration** - Auto-installs to Claude, Codex, Cursor, etc.
5. **WASM Performance** - Native-like canvas rendering

### 7.2 Where RadFlow Differentiates

1. **No Abstraction Layer** - Works with actual project files
2. **Clipboard-First** - Context engineering over direct manipulation
3. **React Integration** - Deep fiber introspection, not just rendering
4. **Developer-Oriented** - TSX parsing, file watching, source mapping
5. **Lightweight** - No WASM, CSS scale() approach

### 7.3 Recommended Adoption

**High Value, Low Risk:**
- Delta text streaming pattern
- Session persistence for AI conversations
- Fullscreen mode
- Recent files management

**Medium Value, Medium Risk:**
- MCP tools for read-only context (get_component_map, get_tokens)
- Error tracking integration

**Consider Later:**
- Direct write MCP tools (deviates from clipboard philosophy)
- WASM canvas (significant architecture change)

---

## Appendix A: File Reference

| Purpose | Pencil Location |
|---------|----------------|
| Main entry | `out/main.js` |
| App class | `out/app.js` |
| MCP adapter | `out/desktop-mcp-adapter.js` |
| Agent SDK | `@ha/agent/src/claude/index.ts` |
| IPC manager | `@ha/ipc/src/ipc-device-manager.ts` |
| WebSocket | `@ha/ws-server/src/websocket-server.ts` |
| MCP installer | `@ha/mcp/src/installer.ts` |
| Schema | `@ha/schema/pen.schema.json` |
| WASM canvas | `out/editor/assets/pencil.wasm` |

---

## Appendix B: Streaming Event Sequence

```
User: "Add a blue button"
         │
         ▼
    ┌────────────┐
    │ send-prompt│ (IPC notification)
    └─────┬──────┘
          │
          ▼
    ┌────────────┐
    │ invokeAgent│ (IPCDeviceManager)
    └─────┬──────┘
          │
          ▼
    ┌────────────────────────────────────────┐
    │ Claude Agent SDK (streaming)            │
    │                                         │
    │  ┌─────────────────────────────────┐   │
    │  │ system/init {session_id}        │───┼──> chat-session
    │  └─────────────────────────────────┘   │
    │  ┌─────────────────────────────────┐   │
    │  │ assistant {content: text}       │───┼──> chat-assistant-delta
    │  └─────────────────────────────────┘   │
    │  ┌─────────────────────────────────┐   │
    │  │ stream_event/content_block_start│───┼──> chat-tool-use-start
    │  │ (tool_use: batch_design)        │   │
    │  └─────────────────────────────────┘   │
    │  ┌─────────────────────────────────┐   │
    │  │ stream_event/content_block_delta│───┼──> batch-design (partial)
    │  │ (input_json_delta)              │   │    Canvas updates!
    │  └─────────────────────────────────┘   │
    │  ┌─────────────────────────────────┐   │
    │  │ assistant {content: tool_use}   │───┼──> chat-tool-use
    │  └─────────────────────────────────┘   │
    │  ┌─────────────────────────────────┐   │
    │  │ result {tool_use_id, output}    │───┼──> chat-tool-result
    │  └─────────────────────────────────┘   │
    │  ┌─────────────────────────────────┐   │
    │  │ assistant {content: text}       │───┼──> chat-agent-message
    │  └─────────────────────────────────┘   │
    │                                         │
    └────────────────────────────────────────┘
          │
          ▼
    ┌─────────────┐
    │ completed   │
    └─────┬───────┘
          │
          ▼
    chat-assistant-final
```
