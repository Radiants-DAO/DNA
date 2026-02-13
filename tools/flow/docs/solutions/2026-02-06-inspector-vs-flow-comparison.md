# Competitive Analysis — Inspector, VisBug, Agentation, Subframe vs Flow

**Date:** 2026-02-06
**Tools analyzed:**
- **Inspector.app** v1.13.13 — Sandbox Technologies (Anysphere / Cursor)
- **VisBug** v0.4.9 — Google Chrome Labs (Adam Argyle)
- **Agentation** v2.1.1 — Benji Taylor
- **Subframe** (docs snapshot Feb 2026) — Subframe
- **Flow** (ours) — DNA

---

## Identity

| | Inspector.app | Flow |
|---|---|---|
| **Platform** | Electron desktop app | Chrome DevTools extension |
| **Publisher** | Sandbox Technologies (Anysphere — Cursor) | DNA (internal) |
| **Tech stack** | Electron, React, TypeScript, Tailwind, Framer Motion | WXT, React 19, TypeScript, Tailwind v4, Zustand |
| **State management** | React Context + Conveyor IPC | Zustand (18 slices) |
| **AI integration** | Multi-agent chat (6 providers) | Structured prompt output + MCP sidecar |
| **Repo** | github.com/sandbox-technologies/inspector-official | Internal |
| **URL scheme** | `inspector://` deep links | N/A |
| **Auth** | Auth0 + WorkOS SSO | None |
| **Analytics** | PostHog | None |

---

## Architecture Comparison

| Dimension | Inspector | Flow |
|---|---|---|
| React fiber access | WebView injection (`react-fiber-linker.js`) + React DevTools hook | Content script (`inspector.ts`) + fiber walking |
| Source resolution | Fiber `_debugSource` + source maps + LSP (TS/Tailwind) | `_debugSource` + source maps via MCP sidecar |
| AI backend | Multi-agent: Cursor, Claude Code, Codex, OpenCode, Inspector (Cerebras), Z.AI | Prompt clipboard + MCP tool endpoints |
| Proxy/dev server | Built-in proxy (`@inspector/link`) with Vite plugin, HTML injection | MCP sidecar server (standalone Node process) |
| File editing | Agent writes files directly (shadow git snapshots for undo) | DOM-only mutations, LLM writes files via prompt |
| Git integration | Bundled git binary, shadow git for snapshots/revert, branch management | None (prompt-based, no direct file writes) |
| Bundled tools | Git, Scalar, ripgrep, esbuild, mac-cookies, node-pty | None (Chrome extension) |

---

## Subframe vs Flow Snapshot

| Dimension | Subframe | Flow |
|---|---|---|
| **Primary source of truth** | Design project artifacts (components/pages/themes) | Live runtime page context + mutation history |
| **Handoff model** | Components sync one-way; pages export and are wired in code | In-place inspection/mutation, then structured prompt/context handoff |
| **Runtime inspection** | No arbitrary live-site DOM inspector | Yes (content script + DevTools panel) |
| **Code generation stance** | Deterministic, presentational output by design | Runtime-aware context capture; code changes applied outside extension |
| **AI integration style** | MCP servers + Subframe skills (`setup/design/develop`) | Prompt builder + MCP sidecar |
| **Collaboration anchor** | Design comments pinned to design pages | Comments/questions pinned on live DOM overlays |
| **Dev ergonomics** | Upstream design-system + handoff workflows | Downstream implementation/debug/refinement workflows |
| **Best-fit lifecycle stage** | Design-to-code planning and export | Code-to-production fidelity and runtime correction |

---

## Feature Matrix

### DOM Inspection & Element Selection

| Feature | Inspector | Flow |
|---|---|---|
| Element picker/selector | Yes | Yes |
| React fiber walking | Yes (deep fiber + owner chain) | Yes |
| Computed styles extraction | Yes (50+ properties) | Yes (9 grouped categories) |
| Source file resolution | Yes (_debugSource + source maps + LSP) | Yes (_debugSource + source maps) |
| Component prop serialization | Yes (full prop trace with owner chain) | Yes |
| DOM element context for AI | Yes (full HTML, styles, selector) | Yes (structured context) |
| Parent instantiation context | Yes (JSX snippet where component is used) | Partial |
| Annotation badges | No | Yes |
| Shadow DOM traversal | Yes | Yes (deepElementFromPoint) |

### Visual Editing / Design Panel

| Feature | Inspector | Flow |
|---|---|---|
| Figma-like design panel | Yes (full implementation) | Yes (9 designer sections, less polished) |
| Auto Layout (flex/grid) | Yes (AlignmentGrid, GapInput, MarginInput, ResizingInput) | Yes (LayoutSection) |
| Typography | Yes (FontSizeInput, 60+ bundled fonts) | Yes (TypographySection) |
| Fill/Background | Yes (color pickers, gradient editor) | Yes (BackgroundsSection, GradientEditor) |
| Stroke/Border | Yes (per-side controls, radius) | Yes (BordersSection) |
| Effects | Yes (shadows, filters, backdrop-filter) | Yes (BoxShadowsSection, EffectsSection) |
| Position/Transform | Yes (drag inputs, absolute positioning) | Yes (PositionSection) |
| Appearance | Yes (opacity, overflow, visibility) | Partial |
| Move tool | Yes (drag reorder, resize, snapping, guides, drop targets, multi-reorder) | No |
| Text editing mode | Yes | Yes (TextEditMode) |
| Eyedropper/color picker | Yes (loupe overlay) | No |
| Undo/Redo | Yes (checkpoint-based revert) | Yes (useUndoRedo) |
| Grid settings panel | Yes | No |
| Spacing handles | No visible | Yes (draggable spacing handles) |
| Distance measurements | No visible | Yes |
| Gridlines overlay | No visible | Yes |
| Tailwind integration | Yes (detection, consolidation, presets) | Yes (language adapter: CSS/Tailwind/Figma) |

### AI / Agent Integration

| Feature | Inspector | Flow |
|---|---|---|
| Built-in AI chat | Yes (full chat UI, tabs, history, model selector) | No (prompt clipboard output) |
| Multi-agent adapters | Yes: Cursor, Claude Code, Codex, OpenCode, Inspector, Z.AI | No |
| Agent tool views | Yes: Read, Edit, Write, Grep, Ls, Bash, WebFetch, WebSearch, MCP, Todos, Semantic Search | No |
| Thinking/reasoning view | Yes | No |
| Planning view | Yes | No |
| File tree view | Yes (diff views) | No |
| Code block rendering | Yes (syntax highlighted) | No |
| Context window management | Yes (token counting, summarization, truncation) | No |
| Chat history/sessions | Yes | No |
| Image attachments | Yes (screenshot capture to chat) | No |
| Model/provider selector | Yes (6 providers) | No |
| MCP server integration | Yes (client, gateway, OAuth, package manager) | Yes (MCP sidecar) |
| Skills system | Yes (SKILL.md files) | No |
| Free AI tier | Yes (Cerebras: Llama, Qwen, GLM) | No |
| Design Arena leaderboard | Yes (ELO rankings) | No |
| Structured prompt output | No (chat is the output) | Yes (PromptBuilderPanel, ContextOutputPanel) |
| Language adapters | No | Yes (CSS/Tailwind/Figma translation) |

### Visual Diff & Snapshot System

| Feature | Inspector | Flow |
|---|---|---|
| Shadow git snapshots | Yes (full system in ~/.inspector/data/snapshot/) | No |
| Visual diff engine | Yes (DOMDiffEngine, NodeIdentity, PatchAtomStore, ConflictGraph) | Yes (MutationDiffPanel — simpler) |
| Baseline capture | Yes (BaselineCacheStore, solo DOM capture) | No |
| Conflict detection | Yes (same-slot, structural-delete, structural-insert) | No |
| Diff classification | Yes (hot-safe vs reload-required) | No |
| Agent edit review | Yes (ReviewActionsPanel) | No |
| Session revert | Yes (session-revert-manager, checkpoint undo) | No |
| HMR capture hooks | Yes | No |
| Mutation recording | No (agent writes files) | Yes (mutation engine, snapshot capture) |

### Browser Features

| Feature | Inspector | Flow |
|---|---|---|
| Built-in browser/webview | Yes (Chromium webview) | No (Chrome tab via extension) |
| Address bar + navigation | Yes | No (Chrome native) |
| Find in page | Yes | No (Chrome native) |
| Browser history | Yes | No |
| Dev server auto-detection | Yes (framework + port detection, auto-launch) | Partial (via sidecar) |
| Project detection | Yes (monorepo, package manager) | No |
| Cookie import from Chrome | Yes (bundled mac-cookies binary) | No |
| DevTools panel | Yes (embedded) | Yes (is a DevTools panel) |
| Screenshot capture | Yes (zoom screenshot) | Partial (handler stubbed) |
| Link preview | Yes (hover cards) | No |
| File drag & drop | Yes (open project) | No |
| Zoom controls | Yes (Figma-style) | Yes (usePanZoom) |
| Console log viewer | Yes | No |
| Responsive device picker | Yes | No |

### Collaboration & Comments

| Feature | Inspector | Flow |
|---|---|---|
| Comment system | Yes (pinned on elements, threads) | Yes (CommentMode — simpler) |
| Comment AI integration | Yes (model selector per comment) | No |
| Comment selection overlay | Yes | No |
| Attachments | Yes (AttachmentPill) | No |

### Project & Workspace

| Feature | Inspector | Flow |
|---|---|---|
| Project management | Yes (recent projects, import, switch, create) | No |
| Branch management | Yes (create, switch, picker) | No |
| Git publish | Yes (commit bar) | No |
| GitHub integration | Yes (@octokit/rest, gh CLI) | No |
| Templates | Yes (with preview) | No |
| Auth | Yes (Auth0, WorkOS, per-provider) | No |
| Billing | Yes | No |
| Deep linking | Yes (`inspector://`) | No |
| LSP integration | Yes (TypeScript + Tailwind) | No |

---

## What Flow Has That Inspector Doesn't

| Feature | Description |
|---|---|
| Animation capture & diffs | Web Animations API, CSS transitions, GSAP timeline extraction |
| Spatial canvas layout | File tree visualization with pan/zoom, minimap, connections |
| Component canvas | Isolated component rendering with connections |
| Design token system (DNA) | tokensSlice, DNA config, semantic token tiers |
| Prompt builder panel | Visual query builder with verb/element/value slots |
| Structured prompt output | ContextOutputPanel compiles session into LLM-ready prompts |
| Language adapters | CSS/Tailwind/Figma translation table |
| Variables panel | Design token variable browser |
| Assets panel | Icon, logo, image asset library |
| Theme system | ThemeSelector, ThemeTransition |
| Floating mode bar | Draggable mode switching UI |
| Session export | JSON export/import of session data |
| Canvas physics/gestures | Physics-based canvas interactions |
| Marquee selection | Rectangle selection on canvas |
| Spacing handles | Draggable spacing manipulation on page |
| Distance measurements | Between-element measurements |
| Gridlines overlay | Visual grid/guide system |
| Component ID mode | Display component IDs on page |
| Accessibility audit | WCAG contrast, role/ARIA checks, violation detection |
| Image management | Scan all images, swap sources |
| Search (4 modes) | CSS selector, text content, fuzzy, attribute |
| Zero-install | Chrome extension, no desktop app needed |
| Dogfood mode | Feature gating via DogfoodBoundary |

---

## Recommended Adoptions (All Sources)

### Priority 1 — High Impact (Visual Editing)
| Feature | Source | Rationale |
|---------|--------|-----------|
| **Move tool** | Inspector | Element drag, reorder, resize with snapping guides. Biggest visual editing gap in Flow. |
| **Eyedropper** | Inspector | Color picker from live page with loupe overlay. High-utility, low-effort. |
| **Popover API overlays** | VisBug | Render in browser's top layer — avoids z-index wars. Replace or augment Shadow DOM overlays. |
| **Box model visualization** | VisBug | Pink/purple margin/padding overlay. Flow has spacing handles but no full box model vis. |
| **MCP watch/long-poll tools** | Agentation | `watch_annotations`-style blocking tool on Flow's sidecar. Agent receives mutations/diffs in real-time without clipboard. |

### Priority 2 — Medium Impact (Agent Integration)
| Feature | Source | Rationale |
|---------|--------|-----------|
| **Bidirectional agent threads** | Agentation | Agent replies to comments, human responds. Flow has comments but no agent ↔ human threading. |
| **Output detail levels** | Agentation | Compact → Standard → Detailed → Forensic. Flow's prompt is one-size-fits-all. |
| **Annotation status lifecycle** | Agentation | pending → acknowledged → resolved/dismissed. Track what the agent has acted on. |
| **Component/page ownership contract** | Subframe | Enforce "components sync, pages export" to reduce merge churn and logic drift. |
| **Skill-first workflow verbs** | Subframe | `/setup`, `/design`, `/develop`-style commands reduce prompt ambiguity for agents. |
| **Shadow git snapshots** | Inspector | For undo/revert when Flow adds file writing. |
| **Visual diff conflict detection** | Inspector | Atomic patch system with conflict graphs for multi-edit resolution. |
| **Copy/Paste styles** | VisBug | Cmd+Alt+C copies computed CSS → paste to another element. |
| **Group/Ungroup** | VisBug | Cmd+G wraps in div, Cmd+Shift+G unwraps. Simple but powerful DOM operation. |

### Priority 3 — Polish & Future
| Feature | Source | Rationale |
|---------|--------|-----------|
| **Element keyboard traversal** | VisBug | Tab through siblings, Enter into children. Flow is click-only. |
| **Image drag-and-drop swap** | VisBug | Drag images between elements. Flow scans images but can't swap. |
| **Design panel drag inputs** | Inspector | Scrubable number inputs for CSS values. More tactile than text fields. |
| **HMR capture hooks** | Inspector | Auto-track live reload changes. |
| **SSE event streaming** | Agentation | Simpler than WebSocket for one-way event push. Consider for sidecar. |
| **Animation pause for annotation** | Agentation | Freeze CSS animations to annotate specific frames. |
| **AFS open schema** | Agentation | Standardized JSON schema for UI feedback. Consider for Flow's prompt output format. |
| **Machine-readable docs index (`llms.txt`)** | Subframe | Deterministic docs discovery path for agents before tool calls. |
| **Docs MCP server pairing** | Subframe | Keep product MCP and docs MCP side-by-side for implementation + reference grounding. |
| **Agent adapter pattern** | Inspector | Normalized event schema for multi-agent support. Future consideration. |
| **LSP integration** | Inspector | TypeScript + Tailwind language servers for richer context. |
| **Plugin/command system** | VisBug | `/command` dispatch via search. Extensible tool registration pattern. |

---

## Architecture Insights

### Inspector's "Conveyor" IPC Pattern
Type-safe IPC with 19 API modules. Each handler (agent, git, snapshot, workspace, etc.) registers typed schemas. Worth studying if Flow ever needs main↔renderer IPC.

### Inspector's Agent Adapter Pattern
```
AgentAdapter (interface)
├── CursorAgentAdapter
├── ClaudeCodeAdapter
├── CodexAgentAdapter
└── OpenCodeAgentAdapter

Each adapter:
- canHandle(rawEvent) → boolean
- normalize(rawEvent) → AgentEvent
- meta: { id, name, description }
```
Auto-detection via `AgentAdapterRegistry.detectAdapter()`. Clean plug-and-play design.

### Inspector's Webview Injection Architecture
21 scripts injected into the embedded browser, each handling a specific concern (fiber linking, comment pins, move tool, etc.). Similar to Flow's content script feature modules but more granular.

### Key Identity Note
Inspector rebrands OpenCode responses — when using OpenCode as backend, it injects system instructions to replace all "OpenCode" references with "Inspector" branding.

---

## Strategic Summary

### Where Each Tool Excels

| Tool | Core Strength | Approach |
|------|--------------|----------|
| **Inspector** | Full-stack AI dev environment | Embed agent + browser + editor in one app |
| **VisBug** | Pure visual manipulation | Zero-overhead, keyboard-driven, no AI |
| **Agentation** | Annotation → agent pipeline | Point at problems, agent fixes them via MCP |
| **Subframe** | Deterministic design-to-code handoff | Designers own visual system; developers sync/export into codebase |
| **Flow** | Visual context compiler | Inspect + mutate + compile structured prompts |

### Flow's Unique Position
Flow sits at the intersection of four approaches:
- **VisBug's visual editing** (Flow already has mutations, designer, spacing handles)
- **Inspector's deep inspection** (Flow has fiber walking, source resolution, design tokens)
- **Agentation's agent pipeline** (Flow has MCP sidecar, needs the watch/long-poll pattern)
- **Subframe's deterministic handoff contract** (component/page separation, skills-guided workflows)

No other tool combines all four. The strategic priority is:
1. **Close the visual editing gap** with Inspector/VisBug (move tool, eyedropper, box model vis, popover overlays)
2. **Upgrade the agent pipeline** with Agentation patterns (MCP watch tools, bidirectional threads, status lifecycle)
3. **Adopt handoff discipline patterns** from Subframe (components sync, pages export, skill-led workflows)
4. **Protect differentiators** (design tokens, spatial canvas, component catalog, animation capture, language adapters)

---

## VisBug — Reference Implementation Analysis

**Version:** 0.4.9 | **Author:** Adam Argyle (Google Chrome team) | **License:** Apache 2.0
**Tech:** Vanilla JS + Web Components | **Size:** ~4-5K lines | **Stars:** 5.7K
**Platform:** Chrome Extension (MV3, content script only — no DevTools panel)

### Architecture

- **Injection:** Service worker toggles `<vis-bug>` custom element on/off via `chrome.scripting.executeScript()`
- **Rendering:** All overlays are custom web components using **closed Shadow DOM** + **Popover API** (top layer)
- **Build:** Rollup + PostCSS, single ES module bundle
- **Dependencies:** blingblingjs, hotkeys-js, @ctrl/tinycolor, colorjs.io, query-selector-shadow-dom

### Complete Tool List (13 tools)

| Hotkey | Tool | Description |
|--------|------|-------------|
| `g` | Guides | Cross-hair alignment gridlines, click-to-anchor distance measurements |
| `i` | Inspector | Computed CSS tooltip (~35 curated properties), pin + drag to reposition |
| `x` | Accessibility | WCAG 2.1 contrast ratio, APCA contrast, AA/AAA compliance, ARIA attributes |
| `l` | Position | Drag-to-position (sets `position: relative`), arrow key nudge (1px / 10px) |
| `m` | Margin | Arrow key margin adjustment, box-model visualization overlay (pink/purple) |
| `p` | Padding | Same as margin for padding, box-model vis with border-width accounting |
| `a` | Flex Align | Auto-sets `display: flex`, arrows for justify/align, Cmd for direction/wrap |
| `v` | Move (DOM reorder) | Reorder siblings with arrows, drag-and-drop with grip handles |
| `h` | Hue Shift | Arrow keys for saturation/brightness, Cmd for hue/opacity, toggle fg/bg/border |
| `d` | Box Shadow | Arrow keys for X/Y offset, Alt for blur/spread, Cmd for opacity/inset |
| `f` | Font Styles | Size, text-align, line-height, letter-spacing, font-weight, bold/italic |
| `e` | Edit Text | Sets `contenteditable=true`, double-click to enter, Escape to exit |
| `s` | Search | CSS selector search with aliases, Shadow DOM traversal, plugin dispatch |

### Global Selection Features
- Click to select (`deepElementFromPoint` for Shadow DOM)
- Shift+click multi-select
- Copy/Cut/Paste DOM elements (Cmd+C/X/V as HTML)
- Copy styles (Cmd+Alt+C), Paste styles (Cmd+Alt+V)
- Duplicate (Cmd+D), Delete (Backspace)
- Group/Ungroup (Cmd+G / Cmd+Shift+G wraps/unwraps in `<div>`)
- Expand selection (Cmd+E selects next matching element)
- Keyboard traversal (Tab/Shift+Tab siblings, Enter/Shift+Enter children/parent)
- Image drag-and-drop swap (`<img>`, `<picture>`, CSS `background-image`)
- Color picker (3 inputs: foreground, background, border — SVG-aware)

### Plugins (9 via `/command` in search)
`/blank page`, `/barrel roll`, `/tag debugger`, `/shuffle`, `/zindex`, `/remove css`, `/detect overflows`, `/loop through widths`, `/expand text`

### Key Implementation Patterns

**Overlay rendering:** Custom elements + SVG rects + Popover API (`showPopover()`) → renders in browser's top layer above all z-index contexts. Positions calculated from `getBoundingClientRect()` + scroll offset.

**CSS isolation:** Closed Shadow DOM + constructible stylesheets (`adoptedStyleSheets`). Light/dark theme via swapping stylesheet objects.

**Element exclusion:** `isOffBounds()` check prevents selecting VisBug's own UI elements.

**Mutations:** Direct `el.style[prop] = value`. No virtual DOM, no diffing, no batching.

### What VisBug Does NOT Have
- No undo/redo (all changes permanent)
- No persistence (changes lost on refresh)
- No export/save
- No React/Vue/framework awareness
- No source code resolution
- No design tokens
- No AI/prompt integration
- No DevTools panel
- No collaboration/comments
- No animation editing
- No screenshot (literally `alert('Coming Soon!')`)
- No grid editing (shows info but can't edit)

### VisBug Patterns Worth Adopting

| Pattern | What Flow Should Study |
|---------|----------------------|
| **Popover API overlays** | Renders in browser's top layer — avoids z-index wars entirely. Flow uses Shadow DOM but not popover. |
| **Box model visualization** | Pink/purple margin/padding overlay — Flow has spacing handles but no full box model vis |
| **Copy/Paste styles** | Cmd+Alt+C copies computed CSS → paste to another element. Flow doesn't have this. |
| **Group/Ungroup** | Cmd+G wraps selection in `<div>`, Cmd+Shift+G unwraps. Simple but powerful. |
| **Element keyboard traversal** | Tab through siblings, Enter into children. Flow uses click-only. |
| **Image drag-and-drop swap** | Drag images between elements or from filesystem. |
| **Plugin system** | `/command` dispatch via search — extensible tool registration |
| **Color picker (3 inputs)** | Always-visible fg/bg/border pickers with SVG fill/stroke awareness |

---

## Agentation — Annotation-to-Agent Pipeline

**Version:** 2.1.1 (component) + 1.1.0 (MCP server)
**Author:** Benji Taylor | **License:** PolyForm Shield 1.0.0
**Tech:** React component + Node.js/SQLite MCP server
**Platform:** React component (not an extension — embedded in your app)

### Architecture

Two packages:
1. **`agentation`** — React component (browser toolbar), zero runtime deps beyond React
2. **`agentation-mcp`** — Dual HTTP (port 4747) + MCP (stdio) server with SQLite storage

**Data flow:** `Browser Toolbar → HTTP Server → MCP Server (stdio) → AI Agent`

### Core Features

#### Annotation Modes (5)
| Mode | Description |
|------|-------------|
| Element click | Click any DOM element, auto-identifies name, selector, bbox, styles |
| Text selection | Select text to annotate typos/content |
| Multi-select | Hold modifier + click multiple elements |
| Area selection | Drag to select a region |
| Animation pause | Inject `animation-play-state: paused !important` to freeze frames |

#### Smart Element Identification
- CSS selector paths (`body > main > .hero > button.cta`)
- React component tree via `__reactFiber$` traversal (`App > Dashboard > Header`)
- CSS classes (cleaned of module hashes)
- Computed styles, bounding box, accessibility attributes, nearby text

#### Output Detail Levels (4)
| Level | Content |
|-------|---------|
| **Compact** | Element + feedback only, no React |
| **Standard** | + location, classes, filtered React components, position |
| **Detailed** | + bounding box, nearby text, smart React matching |
| **Forensic** | + computed styles, device info, full DOM paths, all React internals |

All output as structured markdown with `grep` tips for agents.

#### Annotation Data Model
- Intent: `fix | change | question | approve`
- Severity: `blocking | important | suggestion`
- Status lifecycle: `pending → acknowledged → resolved | dismissed`
- Threaded conversations (agent ↔ human)

### MCP Server — 9 Tools

| Tool | Description |
|------|-------------|
| `agentation_list_sessions` | List all active annotation sessions |
| `agentation_get_session` | Get session with all annotations |
| `agentation_get_pending` | Get pending annotations for session |
| `agentation_get_all_pending` | Get pending across ALL sessions |
| `agentation_acknowledge` | Mark annotation as seen (UI updates) |
| `agentation_resolve` | Mark resolved with optional summary (auto-removes marker) |
| `agentation_dismiss` | Dismiss with reason |
| `agentation_reply` | Add threaded reply (bidirectional conversation) |
| `agentation_watch_annotations` | **Blocking long-poll** — waits for new annotations, returns batch |

#### Hands-Free Mode (`watch_annotations`)
The killer feature:
1. Agent calls `watch_annotations` (blocks, configurable timeout up to 300s)
2. User clicks elements and adds annotations in browser
3. After batch window (default 10s, max 60s), tool returns collected annotations
4. Agent processes each: acknowledge → make code changes → resolve
5. Agent calls `watch_annotations` again (loop)
6. Fully autonomous — no clipboard, no manual paste

#### Bidirectional Communication
- Agent replies to annotations ("Should this be 24px or 16px?")
- Human responds in browser thread
- Agent resolves with summaries ("Fixed the padding")
- Status updates reflect in browser UI via SSE

### REST API
Full HTTP API: sessions CRUD, annotations CRUD, pending queries, thread messages, SSE event streams (supports `Last-Event-ID` for reconnection), health/status endpoints.

### Additional Features
- **Annotation Format Schema (AFS v1.0)** — Open JSON schema for portable UI feedback
- **Webhooks** — Push to Slack, GitHub, Discord on annotation events
- **Claude Code skill** — `npx skills add benjitaylor/agentation` → `/agentation` command
- **Multi-tenant** — Organizations, users, API keys, user-scoped stores
- **Local-first** — Works offline, syncs when server available, localStorage persistence (7 days)
- **SSE real-time** — Event streaming for browser ↔ server ↔ agent sync

### What Agentation Does NOT Have
- No design panel / CSS property editing
- No mutation engine / live DOM editing
- No design tokens / theme awareness
- No spatial canvas / component catalog
- No source file resolution
- No file diff tracking (purely annotation-based)
- No undo/redo
- No extension — must embed React component in your app

### Agentation Patterns Worth Adopting

| Pattern | What Flow Should Study |
|---------|----------------------|
| **`watch_annotations` long-poll** | Agent blocks until new context appears. Flow's sidecar could expose similar MCP tools for mutations/diffs. |
| **Bidirectional threaded conversations** | Agent replies to annotations, human responds. Flow has comments but no agent ↔ human threading. |
| **4-level output detail** | Compact → Forensic. Flow's prompt output is one-size-fits-all currently. |
| **Annotation status lifecycle** | pending → acknowledged → resolved/dismissed with agent attribution. Flow has no status tracking. |
| **AFS open schema** | Standardized JSON format for UI feedback. Flow's prompt output is bespoke markdown. |
| **SSE event streaming** | Real-time event bus with reconnection. Flow's sidecar uses WebSocket — SSE is simpler for one-way. |
| **Animation pause for annotation** | Freeze CSS animations to annotate specific frames. Flow captures animations but doesn't pause-to-annotate. |

---

## Subframe — Design-to-Code Pipeline Analysis

**Docs snapshot:** 2026-02  
**Platform:** Hosted web app + CLI (`@subframe/cli`) + MCP servers (`https://mcp.subframe.com/mcp`, `https://docs.subframe.com/mcp`)  
**Positioning:** Deterministic design-to-code handoff for React + Tailwind workflows

### Core Workflow Contract
- **Deterministic output:** generated UI code is deterministic and presentational (no app business logic in generated output).
- **Components are synced:** one-way CLI sync from Subframe to codebase (`npx @subframe/cli@latest sync ...`).
- **Pages are exported:** via copy/paste or MCP (`get_page_info`) and then wired with app logic in-repo.
- **Logic ownership is explicit:** docs recommend wrappers and slots for business logic; local sync exceptions use `// @subframe/sync-disable`.

### Relevant MCP + Skills Surface
- **MCP tools:** `list_components`, `list_pages`, `get_component_info`, `get_page_info`, `get_theme`, `design_page`, `edit_page`, `get_variations`.
- **Agent skills:** `/subframe:setup`, `/subframe:design`, `/subframe:develop`.
- **Installation model:** server config per client (Cursor/Codex/Claude/etc.), OAuth auth for project MCP.

### Collaboration Surface
- **Comments:** pinned comments on design pages, mention notifications, resolve workflow.
- **Scope note:** collaboration is design-artifact-centric; not runtime DOM comments on arbitrary production pages.

### What Subframe Does NOT Have (Relative to Flow)
- No live runtime DOM mutation engine on arbitrary third-party pages.
- No DevTools-native panel for runtime inspection and in-place mutation diffs.
- No built-in long-poll/watch annotation loop pattern like Agentation's `watch_annotations`.

### Subframe Patterns Worth Adopting
| Pattern | What Flow Should Study |
|---------|------------------------|
| **Components-sync / pages-export contract** | Clear ownership boundaries to reduce regressions and merge conflicts in AI-assisted workflows. |
| **Skill-first command verbs** | Stable entrypoints (`setup/design/develop`) improve agent behavior consistency. |
| **Deterministic generation guardrails** | Keep visual output deterministic and isolate business logic to explicit extension layers. |
| **`llms.txt` docs index** | Standard preflight docs discovery improves retrieval quality and lowers hallucination risk. |
| **Dual MCP model (product + docs)** | Split execution tools from documentation tools for cleaner agent grounding. |

---

## Five-Way Feature Matrix

### Visual Editing Capabilities

| Feature | Inspector | VisBug | Agentation | Subframe | Flow |
|---------|-----------|--------|------------|----------|------|
| Element picker | Yes | Yes | Yes (click-to-annotate) | Yes (design canvas) | Yes |
| Full design panel | Yes (Figma-like) | No (keyboard-driven) | No | Yes (primary product surface) | Yes (9 sections) |
| Move/reorder tool | Yes (full) | Yes (arrows + drag) | No | Yes (canvas arrangement) | No |
| Margin/padding editing | Yes (design panel) | Yes (arrow keys + box model vis) | No | Yes | Yes (spacing handles) |
| Typography editing | Yes (design panel) | Yes (arrow keys) | No | Yes | Yes (TypographySection) |
| Color editing | Yes (picker + eyedropper) | Yes (hue shift + 3 pickers) | No | Yes | Yes (ColorPicker) |
| Box shadow editing | Yes (design panel) | Yes (arrow keys) | No | Yes | Yes (BoxShadowsSection) |
| Text editing | Yes | Yes (contenteditable) | No | Yes | Yes (TextEditMode) |
| Eyedropper | Yes | No | No | Partial (not emphasized in dev docs) | No |
| Copy/paste styles | No | Yes (Cmd+Alt+C/V) | No | No | No |
| Group/Ungroup | No | Yes (Cmd+G) | No | Partial (composition workflows, explicit hotkeys not documented) | No |
| Undo/Redo | Yes (checkpoints) | No | No | Yes | Yes |
| Gridlines/guides | No visible | Yes | No | Partial | Yes |
| Distance measurements | No visible | Yes (click-to-measure) | No | No (not documented) | Yes |
| Box model overlay | No visible | Yes (pink/purple vis) | No | No | No |

### AI / Agent Integration

| Feature | Inspector | VisBug | Agentation | Subframe | Flow |
|---------|-----------|--------|------------|----------|------|
| Built-in AI chat | Yes (6 providers) | No | No | Partial (design AI workflows, not dev-agent chat shell) | No |
| Structured prompt output | No | No | Yes (4 levels) | No | Yes (PromptBuilder) |
| MCP server | Yes (client) | No | Yes (9 tools) | Yes (product + docs MCP servers) | Yes (sidecar) |
| Agent watch/long-poll | No | No | Yes | No | No |
| Bidirectional agent threads | No | No | Yes | No | No |
| Annotation → agent pipeline | No | No | Yes (core feature) | Partial (comments + MCP usage, no watch loop) | Partial (comments) |
| Agent file writing | Yes (direct) | No | No (agent's job) | No (delegated to connected assistants) | No (prompt-based) |
| Checkpoint/revert | Yes (shadow git) | No | No | Partial (project version history, not shadow git) | No |

### Framework / Source Awareness

| Feature | Inspector | VisBug | Agentation | Subframe | Flow |
|---------|-----------|--------|------------|----------|------|
| React fiber walking | Yes | No | Yes (component tree) | No | Yes |
| Source file resolution | Yes | No | No | Partial (`get_component_info` / `get_page_info`, not runtime stack resolution) | Yes |
| Design token system | No | No | No | Yes (theme + tokenized generated output) | Yes (DNA) |
| Component prop serialization | Yes | No | No | Partial (component model/props, not runtime owner-chain trace) | Yes |
| LSP integration | Yes (TS + Tailwind) | No | No | No | No |

### Platform & Architecture

| Feature | Inspector | VisBug | Agentation | Subframe | Flow |
|---------|-----------|--------|------------|----------|------|
| Platform | Electron desktop | Chrome extension | React component | Web app + CLI + MCP services | Chrome extension |
| Install friction | Download app | Install extension | `npm install` | Web login + CLI/MCP setup | Install extension |
| Works on any page | Yes (built-in browser) | Yes | No (your app only) | No (operates on Subframe project artifacts) | Yes |
| Framework requirement | None | None | React 18+ | React-oriented output path (editor is framework-agnostic) | None |
| CSS isolation | Webview | Closed Shadow DOM + Popover | React Portal | N/A (hosted editor/canvas) | Shadow DOM |
| Persistence | Yes (git snapshots) | No | Yes (SQLite + localStorage) | Yes (cloud project + version history) | Yes (session export) |
| Offline support | Yes | Yes | Yes (local-first) | Partial (cloud-first) | Yes |

---

## Implementation Context — Flow Internals

Deep-dive findings from source analysis of Flow's content scripts, designer panel, sidecar, and Inspector's move tool. This section provides the architectural context needed to plan feature adoptions.

### Flow Content Script Architecture

#### Shadow DOM Hosts (3)
| Host | Purpose | Z-index |
|------|---------|---------|
| `<flow-overlay>` | Primary overlay (selection rects, spacing handles, guides) | `2147483647` (max) |
| `<flow-overlay-root>` | Core overlay root | `2147483646` |
| Annotation badges | Third host for comment/annotation badges | Varies |

All use **closed Shadow DOM** (`mode: 'closed'`) for CSS isolation.

#### Mutation Pipeline
```
Element lookup by ref → capture computed "before" state
→ apply inline style mutation → capture computed "after" state
→ build diff object → store in mutationSlice
```

**Two parallel mutation systems (not connected):**
1. **`mutationEngine.ts`** — Full engine with `revert()`, diff computation, before/after tracking. Used by spacing handles and text edit mode.
2. **`mutationRecorder.ts`** — Simpler recorder without revert capability. Used by designer panel style injection.

Key gap: These two systems don't share state or coordinate. A mutation from the designer panel won't appear in the mutation engine's diff list.

#### Selection System
- **`deepElementFromPoint`** for Shadow DOM traversal (same pattern as VisBug)
- **Alt+click** gesture for inspection (not plain click)
- **Single-feature constraint**: `featureRegistry` enforces only one active feature at a time (inspector, textEdit, etc.)
- No batch/multi-element mutations

#### Spacing Handles
8 draggable `<div>` elements per selected element:
- 4 margin handles (orange, `#ff8c00`)
- 4 padding handles (green, `#00c853`)
- 6px thickness, positioned absolutely
- **Reset-then-record pattern**: on mouseup, captures "before" → applies accumulated delta → captures "after"

#### Move Tool (Current State)
Exists but minimal — **left/right sibling swap only** via `insertBefore`. No drag, no snapping, no resize, no visual feedback.

### Flow Designer Panel Architecture

#### 9 Designer Sections
| Section | Key Controls | Notable |
|---------|-------------|---------|
| LayoutSection | display, flex-direction, align-items, justify-content, gap, flex-wrap | Grid support |
| SpacingSection | margin, padding (per-side) | 8-field layout |
| SizeSection | width, height, min/max, aspect-ratio, overflow | Auto/fit-content presets |
| PositionSection | position, top/right/bottom/left, z-index | Drag inputs |
| TypographySection | font-family, size, weight, line-height, color, alignment, etc. | 15+ properties |
| ColorsSection | background-color, color, opacity | Token-aware |
| BordersSection | border-width, style, color, radius (per-corner) | Per-side support |
| BoxShadowsSection | box-shadow (add/remove/edit) | **Cannot parse existing shadows** |
| EffectsSection | filter, backdrop-filter, mix-blend-mode, cursor | Blur, brightness, etc. |

#### ColorPicker (1130 lines)
- OKLCH color model internally
- Token-aware: can pick from DNA design token palette
- Gradient editor integrated
- Shadow editor for box-shadow colors

#### Style Injection Pipeline
```
Designer panel change → useStyleInjection hook → CSS rule with [data-radflow-id] selector
→ INJECT_STYLE message → content script → <style> element injection into page
```

Style changes target elements via `data-radflow-id` attribute selectors, not inline styles. This means designer panel mutations and spacing handle mutations (which use inline styles) go through different paths.

#### Undo/Redo (Disconnected)
Two independent systems:
1. **`useUndoRedo` hook** — Component-level, tracks style property changes within designer sections
2. **`editingSlice` store** — Global undo/redo stack in Zustand

These are **not connected** — undoing in the hook doesn't update the store, and vice versa.

#### Sidecar MCP (Push-Only)
- WebSocket at `ws://localhost:3737/__flow/ws`
- **Extension → Sidecar only**: sends context pushes (component data, mutations, DOM state)
- **`onmessage` callback is never set** — sidecar cannot send commands back to extension
- Key gap for adopting Agentation-style patterns: would need bidirectional WebSocket or SSE

### Inspector Move Tool Architecture (Reference for Adoption)

~4,500 lines across 20 files, 20 source modules. The most complex single feature in Inspector. Pure DOM manipulation — **no Electron APIs in the move tool itself**. Event-driven with centralized mutable state singleton (NOT a state machine).

#### File Map (20 modules)
| File | Lines | Responsibility |
|------|-------|---------------|
| `index.ts` | ~1650 | Bootstrap IIFE, overlay creation, mouse/keyboard handlers, element selection, text editing integration, postMessage IPC |
| `text-edit.ts` | ~1479 | Double-click editing, contenteditable, span-based mixed content, pending edit persistence |
| `multi-reorder-drag.ts` | ~807 | Multi-element drag with invisible placeholders, semantic element identification |
| `flow-drag.ts` | ~609 | Flow-mode drag with translate3d preview, insertBefore commit, session position tracking |
| `drop-target.ts` | ~544 | Scored path-based drop target algorithm with dead zones and depth penalties |
| `sibling-indicators.ts` | ~517 | Pink circle reorder UI, hollow/solid/dot states, shift-click multi-select |
| `highlights.ts` | ~448 | Multi-layer visual feedback, lerp animation, escaped child outlines |
| `types.ts` | ~380 | Core type definitions (AnyElement, DragMode, DropOption, DOMOrderChange, etc.) |
| `draggable.ts` | ~369 | `makeDraggable()` factory, mode detection (absolute vs flow), shift-axis locking |
| `resize.ts` | ~358 | 8-handle system, flex/grid isolation, rAF batching |
| `move-context.ts` | ~278 | Layout context capture, React source resolution, absolute move context builder |
| `drop-indicator.ts` | ~267 | Blue bar indicator (#3794ff), CSS transition positioning |
| `reorder-handle.ts` | ~232 | Trapezoidal notch UI with grip icon (currently DISABLED) |
| `snapping.ts` | ~161 | Two-pass snap algorithm, 5px threshold, 9-point pair comparison |
| `layout-info.ts` | ~141 | Flex/grid/inline detection, ancestor transform matrix, delta-to-local conversion |
| `state.ts` | ~111 | Centralized mutable MoveToolState singleton (~25 properties) |
| `selectors.ts` | ~80 | `pickTarget()` via `document.elementsFromPoint()`, SVG bubbling, visual bounds check |
| `constants.ts` | ~60 | Magic numbers: `OVERLAY_Z_INDEX`, `SNAP_THRESHOLD=5`, `HANDLE_SIZE=8`, `HANDLE_HIT_SIZE=20` |
| `styles.ts` | ~56 | Capture/restore inline style snapshots (14 properties + SVG transform attr) |
| `guides.ts` | ~38 | Red 1px fixed divs for snap guide rendering |

#### Overlay & Event Interception
- Full-viewport fixed overlay at `z-index: 2147483647` intercepts ALL mouse events
- `document.elementsFromPoint()` to find underlying elements (skips overlays, handles, SVG internals — bubbles to parent `<svg>`)
- `isGlobalContainer()` skips body-level wrappers
- Visual bounds check prevents selecting elements at their pre-drag original position

#### Three Drag Modes
| Mode | When | Mechanism | Commit Strategy |
|------|------|-----------|----------------|
| **Absolute** | Element has `position: absolute/fixed/sticky` or forced | Sets `style.left` / `style.top` directly. SVG via `transform="translate()"` | Immediate |
| **Flow** | Element is in normal flow | `transform: translate3d()` preview during drag | `insertBefore()` DOM reorder on commit, builds `DOMOrderChange` records |
| **Multi-reorder** | Multiple elements marked via sibling indicators | Invisible placeholder nodes (`visibility: hidden`), elements become `position: fixed` | Batch: placeholders replaced with actual elements at new positions |

- Shift-key axis locking, movement threshold (3px) before drag starts
- Session-level original position tracking via `data-inspector-uid` attributes (persists across multiple drags)

#### Snapping System
- **Candidates**: parent + siblings (via `getSnapCandidates()`)
- **Two-pass algorithm**: (1) find minimum displacement across 9 snap point pairs per axis (left/center/right × left/center/right), (2) generate guide lines for winning snaps
- **Threshold**: 5px
- **Visual**: Red 1px fixed `<div>` lines, cleared and re-rendered each mouse move

#### Drop Target Scoring
```
collectFlowDropPath() walks hit element → body (max 20 depth)
→ builds inside/around options per candidate

Scoring:
  - Original position in dead zone (10px radius) → negative score
  - Sibling reorder → −0.15 bonus (preferred)
  - Depth penalty → +0.1 per level
  - Parent edge penalty → +0.2

Best (lowest) score wins → blue bar indicator rendered at target position
```

#### 8-Handle Resize
- 4 corner handles: 8px visible dots, 20px clickable hit area (outline-based expansion)
- 4 edge handles: invisible 10px strips
- Modifies `style.width` / `style.height`; top/left handles use `transform: translate()` compensation
- Flex/grid isolation: temporarily zeroes flex-grow/shrink/basis during resize
- rAF batching for performance

#### Visual Feedback System
| Element | Style | Notes |
|---------|-------|-------|
| Selection highlight | Blue 1px solid | Lerp animation (factor 0.10) via rAF, currently snaps immediately |
| Hover highlight | Lighter blue 1px solid | |
| Drop indicator | Blue bar (`#3794ff`, 2px) with glow shadow | CSS transition for smooth repositioning |
| Snap guides | Red 1px fixed divs | Cleared + re-rendered each mouse move |
| Sibling indicators | Pink circles (`#ec4899`, 12px visual / 24px hit area) | States: hollow ring (hover) → solid fill (marked) → small dot (minimized) |
| Escaped child outlines | Dashed blue for children outside parent bounds | "Also moves" label on hover |

#### Text Editing
- Double-click to enter; contenteditable for simple elements
- **Span-based editing** for mixed content (icons + text) — wraps text nodes in `<span>`, makes only spans editable
- Input/textarea value + placeholder editing
- **Pending edit persistence** with reapply watcher (survives React re-renders via MutationObserver)
- Keyboard: Escape cancels, Cmd+Enter commits, Enter inserts `<br>`, Space manually inserted
- On Apply: page reload after 500ms (`setTimeout(() => window.location.reload(), 500)`)

#### IPC & Host Integration
- All communication via `window.postMessage()` with named source channels
- Host-side `useMoveToolOrchestrator.ts` hook manages tool state, uses `DesignPanelElementService` for unified undo/redo
- On deactivation: undoes ALL changes (`while service.canUndo()`)
- Apply flow: mark edits → clear selection → `applyUnifiedChanges()` → `onApplyComplete`

#### Portability Assessment
All pure DOM APIs — no Electron-specific code. **Portable to Chrome extension with these adaptations:**
- Shadow DOM isolation for overlays (Inspector uses webview, Flow uses Shadow DOM)
- CSP compliance (Inspector can relax CSP, extension cannot — use `element.style.setProperty()` which is CSP-safe)
- No page reload on apply (Inspector can trigger HMR, extension must commit inline)
- Event delegation through Shadow DOM boundaries
- Replace `window.postMessage()` IPC with Chrome port messaging

### Integration Points & Risk Analysis

#### For Move Tool Adoption

**Where Inspector concepts map to Flow:**
| Inspector Concept | Flow Integration Point | Adaptation |
|-------------------|----------------------|------------|
| Full-viewport overlay | Flow's `<flow-overlay>` Shadow DOM host | Already exists at same z-index. Add move tool UI elements as children. |
| `document.elementsFromPoint()` | Flow's `deepElementFromPoint()` | Flow's version pierces Shadow DOM — **strictly superior**. Use as-is. |
| Centralized mutable state | New `moveToolSlice.ts` in Zustand | Replace Inspector's mutable singleton with a Zustand slice for React integration. |
| `window.postMessage()` IPC | Flow's Chrome port messaging (`mutation:*` channels) | Add `movetool:drag-start`, `movetool:drop`, `movetool:resize` message types. |
| Host-side orchestrator | Flow's `editingSlice` undo/redo | Inspector's `useMoveToolOrchestrator` maps to Flow's existing undo/redo stacks. |
| `DOMOrderChange` records | Flow's `MutationDiff` format | Translate Inspector's change records into Flow's diff schema for session export + MCP. |
| Snap candidates | Content script helper | Pure DOM math — port directly. No framework dependencies. |
| Text editing | Flow's existing `TextEditMode` | Inspector's span-based mixed content editing could enhance Flow's existing implementation. |

**Complexity breakdown:**
| Aspect | Complexity | Risk |
|--------|-----------|------|
| Drag detection + visual feedback | Medium | Low — standard pointer events |
| Snapping engine (`snapping.ts` + `guides.ts`) | Low | Low — pure math, no DOM coupling beyond `getBoundingClientRect()` |
| Drop target scoring | High | Medium — scoring heuristics need tuning per page |
| 8-handle resize | Medium | Low — well-understood pattern |
| Multi-element reorder | High | Medium — placeholder management + semantic identification |
| React re-render recovery during drag | High | **High — element refs invalidated by React reconciliation** |
| Committing moves to mutation system | High | **High — Flow's dual mutation systems need unification first** |
| Undo/redo for moves | High | **High — disconnected undo systems must be resolved** |

#### For Eyedropper Adoption
| Aspect | Complexity | Risk | Notes |
|--------|-----------|------|-------|
| Color sampling | Low | Low | Use `getComputedStyle()` for CSS colors (not canvas pixel sampling — avoids cross-origin tainting) |
| Loupe overlay | Medium | Medium | Magnified pixel view is performance-sensitive; render at reduced resolution, cache nearby rects |
| Color output | Low | Low | Feed sampled color into Flow's existing `ColorPicker` component, including DNA token matching |

#### For Popover API Overlays
| Aspect | Complexity | Risk | Notes |
|--------|-----------|------|-------|
| Feature detection | Low | Low | `showPopover()` has broad support (Chrome 114+, Firefox 125+, Safari 17+) |
| Replace/augment overlay hosts | Medium | Low | Popover renders above all z-index contexts natively. Keep Shadow DOM for style isolation, use Popover for z-ordering. |
| Positioning | Medium | Low | Use `getBoundingClientRect()` placement (anchor positioning still limited) |

#### For Box Model Visualization
| Aspect | Complexity | Risk | Notes |
|--------|-----------|------|-------|
| Colored overlay rects | Low | Low | Purely additive — render inside existing Shadow DOM overlay |
| Computed style extraction | Low | Low | Flow's `extractGroupedStyles()` already reads margin/padding values |

#### For MCP Watch/Long-Poll Tools
| Aspect | Complexity | Risk | Notes |
|--------|-----------|------|-------|
| Add `onmessage` handler to sidecar WS | Low | Low | Currently one-way; need to define command protocol |
| Implement `watch_mutations` long-poll tool | Medium | Low | Block until new diffs, return batch. Well-understood pattern. |
| Reconnection handling | Medium | Medium | Sequence IDs on diffs — agent requests "since sequence N" on reconnect |
| Bidirectional threads on comments | Medium | Medium | UI + store changes for agent ↔ human threading |
| Status lifecycle on annotations | Low | Low | Store field additions: pending → acknowledged → resolved/dismissed |

#### Chrome Extension-Specific Concerns
| Concern | Inspector (Electron) | Flow (Chrome Extension) | Mitigation |
|---------|---------------------|------------------------|------------|
| CSP restrictions | None | Page CSP may block inline styles | Use `element.style.setProperty()` (CSP-safe) — not `setAttribute('style', ...)` |
| Cross-origin iframes | Full access | Blocked by same-origin policy | `all_frames: true` in manifest + `window.postMessage` for cross-frame |
| Performance | Dedicated process | Shared renderer process | Limit rAF callbacks, use `will-change` hints, batch DOM reads/writes |
| Overlay z-index | WebView layer separation | Shares page z-index stack | Already mitigated (max safe integer). Consider Popover API for true top-layer. |
| React fiber access | WebView preload | Content script injection | Flow already handles via `window.postMessage` + agent script bridge |

#### Recommended Implementation Order
```
Phase 1: Snapping + Guides           (low risk, high visual impact, no state complexity)
Phase 2: Resize handles              (medium risk, builds on Phase 1 overlay infrastructure)
Phase 3: Flow drag + reorder         (high risk, core feature, needs React reconciliation strategy)
Phase 4: Eyedropper                  (independent, medium risk)
Phase 5: Box model vis + Popover     (low risk, polish)
Phase 6: MCP watch tools             (independent, medium risk)
```

#### Prerequisite Fixes (Before Feature Work)
1. **Unify mutation systems** — Connect `mutationEngine` and `mutationRecorder` to share state
2. **Connect undo/redo** — Single undo stack that spans designer panel + spacing handles + future move tool
3. **Make sidecar bidirectional** — Set `onmessage` handler, define command protocol
4. **Fix BoxShadowsSection** — Cannot parse existing `box-shadow` values (blocks editing existing shadows)
5. **Add change coalescing** — Currently each property change fires independently; needs batching for multi-property operations like move

---
