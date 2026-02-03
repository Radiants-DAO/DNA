# Flow 2 — Visual Context Tool for AI-Assisted Web Development

## 1. Overview

Flow is a browser-based tool that maps DOM elements to their exact source locations, enables live visual editing, and compiles structured, unambiguous prompts for LLMs. It consists of three components:

1. **Chrome Extension** — Universal page inspection, live DOM mutations, and visual editing on any page
2. **MCP Sidecar Server** — Standalone Node process providing source resolution, design system analysis, and MCP tool endpoints for LLM clients
3. **Optional Bundler Plugins** — Enhanced integration for Vite, Webpack, and future Turbopack support

Flow performs live DOM mutations for immediate visual feedback. Every mutation is captured as a structured diff and compiled into LLM-ready prompts. The LLM does the file writing.

---

## 2. Core Pipeline

```
DOM element
  → Inspect (computed styles, layout, animations)
  → React fiber (component identity, props)              [if React detected]
  → Source map / _debugSource (file:line:column)          [if sidecar active]
  → Schema + DNA enrichment (tokens, variants, bindings)  [if DNA project]
  → Live mutation (visual editing on page)                [user-driven]
  → Capture diff (before/after for every change)
  → Structured context
  → LLM prompt (clipboard or MCP)
```

Every feature in Flow exists to feed, enrich, or refine this pipeline.

---

## 3. Context: Why This Architecture

### 3.1 Problems With the Previous Architecture (Flow 1 — Tauri)

Flow 1 was a Tauri 2 desktop application (~46K LOC: 40K TypeScript/React + 5K Rust + 731 auto-generated bindings). Three problems drove the rearchitecture:

1. **Iframe bridge limitations.** Flow 1 could only inspect projects that installed `@rdna/bridge` as a dependency. The opt-in requirement killed adoption, and the iframe postMessage sandbox prevented deep DOM inspection, fiber walking, and direct source map resolution.

2. **Rust maintenance burden.** The Rust backend (SWC for TSX parsing, lightningcss for token extraction, notify for file watching, rayon for parallel scanning) duplicated capabilities available in the browser and Node.js ecosystem. 4,600 lines of Rust + 731 lines of auto-generated specta/tauri-specta bindings for what Babel, chokidar, and getComputedStyle can handle natively.

3. **Market positioning.** A browser devtool lives where developers already work. A desktop app is an extra context switch that competes for attention rather than augmenting the existing workflow.

### 3.2 Key Design Decision: Live Mutations + Prompt Output

Flow 1 was clipboard-only ("context engineering" — no direct file writes). This remains true at the file level, but Flow 2 adds **live DOM mutations** as a first-class feature:

- **Live DOM mutations** (inspired by VisBug) — edit styles, move elements, tweak values directly on the page with immediate visual feedback
- **Prompt output** (Flow's core value) — capture those mutations as structured diffs and compile into LLM context

This makes Flow useful in two ways:
1. **Standalone visual editor** — designers and developers can tweak and experiment without touching code
2. **LLM context compiler** — every visual change becomes a precise, source-resolved instruction for Claude, Cursor, or any LLM

The pipeline becomes:
```
DOM element → inspect → mutate → capture diff → compile prompt
```

### 3.3 Key Design Decision: Sidecar Over Embedded Bundler Plugin

The original rearchitecture proposal embedded the MCP server inside a Vite plugin at `/__mcp`. Research revealed this is insufficient:

- **Turbopack has no plugin API** as of February 2026. Plugin API is roadmapped for Q2 2026 but does not exist. Turbopack is the default bundler in Next.js 16+.
- **Unplugin** covers Vite, Webpack, Rspack, Rollup, esbuild — but not Turbopack.
- **Next.js custom server** loses Automatic Static Optimization and serverless functions.

A standalone MCP sidecar server is the only architecture that works universally across all bundlers, including projects with no bundler at all. Bundler plugins become optional enhancers.

### 3.4 VisBug as Reference Implementation

VisBug (GoogleChromeLabs/ProjectVisBug, Apache 2.0) is the closest existing tool to Flow's on-page inspection layer. Research findings:

- ~4-6K lines of vanilla JS + web components. No framework.
- **No DevTools panel.** Entire UI is an in-page `<vis-bug>` custom element rendered via Shadow DOM + Popover API.
- 19 feature modules (margin, padding, font, flex, color, position, etc.) with live DOM mutation.
- Element picker uses `deepElementFromPoint()` for shadow DOM penetration.
- Overlays use SVG rectangles positioned via CSS custom properties in closed shadow roots.
- MV3, minimal permissions (`activeTab`, `contextMenus`, `scripting`, `storage`).
- Maintained by Adam Argyle (Google Chrome team). 5.7K stars. Last release v0.4.9 (Nov 2024).
- Production dependencies: 6 total, very lean. Dev toolchain is dated (Rollup 2, old Babel).

**Two evaluation branches are planned:**
- **Branch A (Inspiration):** Build from scratch using WXT + TypeScript. Study VisBug's patterns but write all new code. Full control, no inherited tech debt.
- **Branch B (Fork):** Fork VisBug repo. Keep its content-script inspection engine (~60% reusable). Replace toolbar UI with Flow's React DevTools panel. Add message passing bridge, fiber walking, source resolution, prompt output.

Both branches will be built to a minimum viable element picker and compared on speed, code quality, and feature completeness before committing to one path.

---

## 4. Modes of Operation

### 4.1 Dev Mode

For inspecting your own project during development. Requires the MCP sidecar server running.

- Full source resolution via `_debugSource` (Babel/SWC transform) + source maps on disk
- Component schema and DNA binding lookups
- Token tier mapping (brand → semantic)
- Violation detection (hardcoded colors, missing tokens, motion violations)
- MCP server auto-configured for Claude, Cursor, Copilot, VS Code
- Live DOM mutations with diff capture

Enhanced with optional bundler plugin:
- Module graph access (file dependency tree)
- HMR channel (bidirectional server ↔ browser communication)
- Auto-injection of inspector script

### 4.2 Extract Mode

For inspecting any website. Extension only, no sidecar required.

- Computed style extraction (colors, typography, spacing, layout, shadows, radii)
- Grid/flex structure inference
- Animation state capture (Web Animations API, GSAP, CSS transitions)
- Live DOM mutations with diff capture
- "Recreate this" prompt generation with extracted values
- Heuristic normalization (e.g., equal pixel values → equal fractions, color clustering)

---

## 5. Architecture

```
Chrome Extension (@flow/extension)
├── Content Script (runs on any page, isolated world)
│   ├── Element picker + highlight overlay (Shadow DOM + Popover API)
│   ├── Style extraction (getComputedStyle)
│   ├── Layout structure inference (grid, flex)
│   ├── Live DOM mutation engine (style editing, move, resize)
│   ├── Mutation diff capture (before/after for every change)
│   ├── Animation state (document.getAnimations(), gsap.globalTimeline)
│   ├── Comment/annotation badge rendering
│   └── Message relay (content ↔ background)
│
├── Agent Script (injected into page context via world: 'MAIN')
│   ├── React fiber tree walking via __REACT_DEVTOOLS_GLOBAL_HOOK__
│   ├── Component map building (name → fiber → source)
│   ├── Computed CSS custom property reading
│   ├── GSAP timeline data extraction (gsap.globalTimeline.getChildren())
│   └── _debugSource extraction from fiber nodes
│
├── DevTools Panel (full React 19 app, Flow's existing UI)
│   ├── Component Canvas (isolated component rendering)
│   ├── Spatial View (file tree visualization)
│   ├── GSAP Timeline Editor (visual scrubber + keyframe handles)
│   ├── Prompt Builder (visual query builder)
│   ├── Designer Panel (9-section CSS inspector)
│   ├── Token/Schema Viewer
│   ├── Comment/Question Manager
│   ├── Text Edit Diff Accumulator
│   ├── Mutation Diff Accumulator
│   └── LLM Context Output (clipboard + MCP)
│
└── Background Service Worker
    ├── Message router (tabId-based)
    ├── Source map fetching + caching
    ├── Sidecar health check + communication
    └── MCP relay (extension ↔ sidecar)


MCP Sidecar Server (@flow/server)
├── HTTP server on known port (default: 3737)
├── Health endpoint: GET /__flow/health
├── MCP endpoint: /__mcp (Streamable HTTP)
│   ├── get_element_context(selector)
│   ├── get_component_tree()
│   ├── get_page_tokens()
│   ├── get_design_audit()
│   ├── get_animation_state(selector?)
│   └── get_extracted_styles(selector?)
├── File watching (chokidar)
│   ├── Source file change detection
│   ├── Schema/DNA file discovery
│   └── Token file parsing
├── Source parsing
│   ├── SWC or Babel AST for component analysis
│   ├── Source map reading from disk
│   └── _debugSource cross-referencing
├── Component schema / DNA resolution
│   ├── .schema.json discovery and parsing
│   ├── .dna.json token binding resolution
│   └── Token tier mapping (brand → semantic)
├── Auto-generates MCP config files
│   ├── .mcp.json (Claude Code)
│   ├── .cursor/mcp.json (Cursor)
│   └── .vscode/mcp.json (VS Code Copilot)
└── WebSocket server for real-time extension communication


Optional Bundler Plugins (@flow/unplugin)
├── Built with unplugin (covers Vite + Webpack + Rspack + Rollup + esbuild)
├── Vite-specific hooks
│   ├── configureServer → middleware, module graph proxy to sidecar
│   ├── transformIndexHtml → auto-inject inspector script
│   └── HMR channel → import.meta.hot.send/on for server queries
├── Webpack-specific hooks
│   ├── devServer.setupMiddlewares → middleware
│   ├── compilation.moduleGraph → module graph proxy to sidecar
│   └── Custom WebSocket for HMR-equivalent
├── Turbopack
│   └── No plugin API available. Manual Babel transform only.
│       Sidecar provides all dev mode features without plugin.
└── Shared capabilities
    ├── Module graph forwarding to sidecar
    ├── /__flow/ route (alternative panel UI in browser tab)
    └── /__flow/health (handshake for extension detection)
```

### 5.1 Communication

**Within extension:**
```
Page (agent.js)  ↔  Content Script  ↔  Service Worker  ↔  DevTools Panel
  window.postMessage   chrome.runtime.connect   port.postMessage
```

The agent script runs in the page's main world (`world: 'MAIN'`) to access React internals, GSAP globals, and the real DOM. The content script runs in an isolated world for security. Communication between them uses `window.postMessage` with origin checking.

**Between extension and sidecar:**
```
Service Worker detects sidecar at http://localhost:3737/__flow/health
  → upgrades to dev mode
  → source resolution via sidecar API
  → MCP tools available to LLM clients via sidecar

DevTools Panel ↔ Sidecar (WebSocket)
  → real-time file change notifications
  → component tree updates on HMR
```

**Between extension and bundler plugin (when present):**
```
Extension detects /__flow/health on current origin (e.g., localhost:5173)
  → enables enhanced features
  → module graph data via /__flow/api/*
  → HMR-driven updates
```

**Sidecar ↔ bundler plugin (when present):**
```
Bundler plugin forwards module graph to sidecar on startup and HMR
  → sidecar enriches source resolution with import graph
  → sidecar serves combined data to extension and MCP clients
```

### 5.2 Data Flow for Element Inspection

1. User hovers element on page
2. Content script detects hover, renders highlight overlay in Shadow DOM
3. Content script posts element reference to agent script via `window.postMessage`
4. Agent script finds React fiber via `__REACT_DEVTOOLS_GLOBAL_HOOK__`
5. Agent extracts: component name, props, `_debugSource` (file, line, column)
6. Agent reads computed custom properties via `getComputedStyle`
7. Data flows: agent → content script → service worker → DevTools panel
8. If sidecar active: panel requests enriched source data (schema, DNA, token bindings)
9. If bundler plugin active: sidecar has module graph for deeper dependency context
10. Panel displays component info, tokens, source location, schema, parent chain

### 5.3 Data Flow for Live Mutation

1. User selects an element and activates a mutation tool (designer, text edit, etc.)
2. Content script captures current computed state as "before" snapshot
3. User makes visual changes (drag handle, type value, pick color)
4. Content script applies changes to live DOM via `element.style`
5. Content script captures "after" state
6. Diff (before → after) accumulated in panel's mutation buffer
7. If sidecar active: diff is enriched with source file references
8. All accumulated diffs compile into the LLM context output

### 5.4 Data Flow for Style Extraction (External Sites)

1. User activates extract mode on any page
2. User selects a region or element
3. Content script reads: `getComputedStyle`, `getBoundingClientRect`, DOM structure
4. For grids: reads `grid-template-*`, infers `repeat()` / `fr` from pixel values
5. For flex: reads `flex-direction`, `gap`, `align-items`, `justify-content`
6. For animations: reads `document.getAnimations()` or `gsap.globalTimeline`
7. Normalizes values: clusters colors into a palette, identifies repeated spacings as tokens
8. Panel presents extracted structure with editable token names
9. Prompt builder composes "recreate this" output with all extracted values

### 5.5 Three-Tier Capability Model

| Tier | Components Active | Capabilities |
|------|------------------|-------------|
| **Extension only** | Chrome extension | Extract mode, live mutations, computed style inspection, animation capture, clipboard prompt output |
| **Extension + Sidecar** | + MCP sidecar server | Dev mode: source resolution, component identity, schema/DNA enrichment, token tier mapping, violation detection, MCP tools for LLM clients |
| **Extension + Sidecar + Plugin** | + bundler plugin | Enhanced: module graph, HMR-driven updates, auto-inject inspector, `/__flow/` browser tab UI |

Each tier is independently useful. The tool degrades gracefully when components are absent.

---

## 6. User Interface

### 6.1 Floating Toolbar (Content Script Overlay)

Renders directly on the inspected page via Shadow DOM + Popover API (top layer).

```
+--------------------+
| > Select           |  <- Click elements to inspect
| @ Comment          |  <- Annotate with notes/questions
| T Text Edit        |  <- Select text, type replacement
| # Prompt           |  <- Visual query builder mode
| * Designer         |  <- CSS property inspector + live editing
| % Extract          |  <- Style extraction mode
+--------------------+
```

Draggable. Collapsible. `pointer-events: none` on container, `auto` on controls. Highlight overlays, comment badges, mutation handles, and selection indicators render in the same Shadow DOM layer.

### 6.2 DevTools Panel

Full React 19 application ported from Flow 1's existing UI (~25K lines). When bundler plugin is active, also available as a browser tab at `/__flow/`.

```
+----------+-------------------------------------------+
|          |                                           |
| Spatial  |  Main Viewport                            |
| View     |  (switches based on active tool)          |
|          |                                           |
| file     |  +-------------------------------------+  |
| tree     |  |                                     |  |
| from     |  |  Component Canvas                   |  |
| source   |  |  --- or ---                         |  |
| map      |  |  GSAP Timeline                      |  |
|          |  |  --- or ---                         |  |
|          |  |  Prompt Builder                     |  |
|          |  |  --- or ---                         |  |
|          |  |  Designer Panel                     |  |
|          |  |                                     |  |
|          |  +-------------------------------------+  |
|          |                                           |
|          |  +-------------------------------------+  |
|          |  | Context Output                      |  |
|          |  | [Copy Prompt] [Send via MCP]        |  |
|          |  +-------------------------------------+  |
+----------+-------------------------------------------+
```

---

## 7. Interaction Modes

### 7.1 Select Mode

Click any element to inspect it. Panel displays:

- Component name and hierarchy (if React detected)
- Source file and line number (if sidecar active)
- Applied CSS custom properties with token tier (brand/semantic)
- Computed styles grouped by category
- Schema-defined props and variants (if `.schema.json` exists)
- DNA token bindings (if `.dna.json` exists)

Hover shows a highlight overlay with component name and source path.

### 7.2 Comment / Question Mode

Click elements to attach annotations. Each annotation includes:

- The target element's resolved identity (component, file:line)
- Free-text note or question
- Visual badge rendered on the page via content script

All annotations compile into the LLM context output. Designed for "change this, fix that" style feedback.

Example output:
```
## Annotations

1. `<HeroSection>` at src/components/Hero.tsx:23
   -> "Padding feels too tight on mobile, should match the card spacing"

2. `<Button variant="primary">` at src/components/Button.tsx:47
   -> "Wrong shade of yellow -- should use --color-brand-sun"
```

### 7.3 Text Edit Mode

Select text on the page. Type a replacement. Flow accumulates a list of before/after diffs. The text changes are applied live on the page AND compiled into the prompt.

Example output:
```
## Text Changes

1. src/components/Hero.tsx:31
   - Before: "Welcome to our platform"
   - After: "Ship faster with Flow"

2. src/components/Nav.tsx:12
   - Before: "Get Started"
   - After: "Try Free"
```

### 7.4 Prompt Mode (Visual Query Builder)

The core differentiator. Constructs multi-step UI instructions by combining element selections with structured actions.

**Interface:** A linear instruction chain with dropdowns and element slots.

```
+---------------------------------------------------------+
|  Step 1:  Change  [Hero Section @]  to  [flex-row v]    |
|  Step 2:  Add  [Logo image @]  to it                    |
|  Step 3:  Put it inside  [Nav container @]               |
|  Step 4:  Apply animations from  [Card entrance @]       |
|                                                          |
|  [+ Add Step]                                            |
|                                                          |
|  Language: [CSS v | Figma v | Tailwind v]                |
+---------------------------------------------------------+
```

- **[@]** slots are filled by clicking elements on the page
- **[v]** dropdowns populated from:
  - Page's computed CSS (active values)
  - Design system tokens (from DNA/schema, if sidecar active)
  - Standard CSS properties
  - Filtered by the active language adapter
- Each selection resolves to a real component with source location

**Language adapters** translate the dropdown vocabulary:

| CSS | Figma | Tailwind |
|-----|-------|----------|
| `display: flex` | Auto layout | `flex` |
| `flex: 1` | Fill container | `flex-1` |
| `width: fit-content` | Hug contents | `w-fit` |
| `gap: 16px` | Item spacing: 16 | `gap-4` |
| `grid-template-columns: repeat(3, 1fr)` | 3-column grid | `grid-cols-3` |

**Output** is a structured, source-resolved prompt:

```
## Instructions

1. Change `<HeroSection>` (src/components/Hero.tsx:23) layout to flex-row
2. Add `<Logo>` (src/components/Logo.tsx:8) as a child
3. Move into `<Nav>` (src/components/Nav.tsx:5)
4. Apply entrance animation from `<Card>` (src/components/Card.tsx:62):
   - opacity: 0 -> 1, 300ms, cubic-bezier(0.34, 1.56, 0.64, 1)
   - translateY: 20px -> 0, 300ms, ease-out
```

### 7.5 Designer Mode

9-section CSS inspector for the selected element. Live visual editing with diff capture for prompt output.

Sections:
1. **Layout** — display, position, flex/grid properties
2. **Spacing** — margin, padding (box model visualization with drag handles)
3. **Size** — width, height, min/max, aspect-ratio
4. **Typography** — font, size, weight, line-height, letter-spacing
5. **Colors** — background, text color, with token name resolution
6. **Borders** — width, style, color, radius
7. **Shadows** — box-shadow, text-shadow
8. **Effects** — opacity, backdrop-filter, mix-blend-mode
9. **Animations** — transitions, keyframes, GSAP timelines

Each section shows:
- Current computed value
- Which CSS custom property / token provides it (if any)
- An interactive control to tweak the value
- **Live preview on the page** (content script applies `element.style` changes immediately)
- Before/after diff accumulated for prompt output

### 7.6 Extract Mode

For external sites. Select elements or regions to extract:

- **Color palette** — all unique colors, clustered into groups, suggested token names
- **Typography scale** — font families, sizes, weights, line heights in use
- **Spacing scale** — unique margin/padding/gap values, normalized to a base unit
- **Layout structure** — grid/flex hierarchy, column counts, gap values
- **Shadows and radii** — all unique values
- **Animations** — keyframes, durations, easings

Output as a "recreate this" prompt:

```
## Extracted Design System

### Palette
- Surface: #FFFFFF, #F8F9FA, #1A1A2E
- Content: #0F0E0C, #6B7280, #FFFFFF
- Accent: #3B82F6, #10B981

### Typography
- Heading: Inter, 700, 48/56px
- Body: Inter, 400, 16/24px

### Spacing
- Base unit: 8px
- Scale: 8, 16, 24, 32, 48, 64

### Layout
- 3-column bento grid, gap: 24px
- Column 1: span 2 rows
- Column 3: 2 equal cards stacked

### Animations
- Card entrance: opacity 0->1, translateY 20->0, 300ms ease-out, staggered 100ms

## Instruction
Recreate this layout using the extracted tokens above.
```

---

## 8. GSAP Timeline Editor

Reads animation state from the inspected page. Provides a visual timeline for scrubbing and tweaking values. Changes are applied live on the page and output as prompt diffs.

### 8.1 Reading Animations

Via agent script in page context:

- **Web Animations API:** `document.getAnimations()` returns all active CSS and WAAPI animations with timing, keyframes, playback state
- **GSAP:** `gsap.globalTimeline.getChildren()` returns all tweens with targets, properties, durations, easing functions. Note: only works when GSAP is on `window`. Bundled ES module GSAP requires the optional bundler plugin to instrument imports at dev time.
- **CSS Transitions:** computed `transition-*` properties on selected elements

### 8.2 Timeline Interface

```
+---------------------------------------------------------+
|  > ||  0.0s --------*---------------- 0.6s   1x v      |
|                                                          |
|  .hero-title                                             |
|  +-- opacity    ------*=============  0->1   300ms      |
|  +-- translateY ----*=========       20->0   250ms      |
|  +-- scale      ----------*=======    0.9->1  350ms     |
|                                                          |
|  .hero-image                                             |
|  +-- opacity    ......------*======    0->1   300ms     |
|  +-- translateX ......----*========    -20->0  300ms    |
|                                                          |
|  Easing: [ease-out v]  Stagger: [100ms]                  |
|                                                          |
|  [Preview on Page]  [Reset]  [Copy to Prompt]            |
+---------------------------------------------------------+
```

- Drag keyframe handles to adjust timing
- Click easing label to open bezier curve editor
- Adjust stagger offset between element groups
- "Preview on Page" applies temporary animations via content script
- "Reset" restores original animation state
- "Copy to Prompt" outputs the delta as structured diff

### 8.3 Output

```
## Animation Changes

Target: `.hero-title` in `<HeroSection>` (src/components/Hero.tsx:23)
- opacity: ease-out 300ms -> cubic-bezier(0.34, 1.56, 0.64, 1) 450ms
- translateY: 20px -> 30px, delay 0ms -> 50ms
- scale: added 0.95 -> 1, 400ms ease-out

Target: `.hero-image` in `<HeroSection>` (src/components/Hero.tsx:38)
- stagger: 100ms -> 150ms
```

---

## 9. Component Canvas

Renders a component in isolation against its DNA token bindings. Available in dev mode when `.schema.json` and `.dna.json` files exist for a component. Requires sidecar for schema resolution.

- Variant switching (from schema-defined variants)
- Token set switching (preview against different themes)
- Prop editing (schema-driven controls)
- Responsive breakpoint preview
- Visual diff between current and modified state

The canvas renders in the DevTools panel or `/__flow/` tab. It does not require an iframe — it renders the component directly using the schema as the prop contract.

---

## 10. Spatial View

File tree visualization. In dev mode, populated from source maps on disk (via sidecar) or the bundler plugin's module graph — every file that contributed to the bundle, laid out as an interactive tree.

- Pan/zoom navigation
- Files colored by type (component, style, config, test)
- Click to view file contents and associated components
- Search/filter by filename or component name
- Shows which files contribute to the currently selected element's component chain

In extract mode, shows the extracted structure hierarchy (DOM tree simplified to semantic sections).

---

## 11. MCP Sidecar Server

Standalone Node.js process. Runs independently of any dev server or bundler.

### 11.1 Startup

```bash
npx @flow/server                    # Auto-detect project root
npx @flow/server --port 3737       # Explicit port
npx @flow/server --root ./my-app   # Explicit project root
```

Or as a dev dependency:
```bash
npm install -D @flow/server
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "flow": "flow-server",
    "dev:flow": "concurrently \"npm run dev\" \"npm run flow\""
  }
}
```

### 11.2 MCP Tools

```typescript
get_element_context(selector: string)
// Returns: component name, file path, line number, column,
//          props, applied tokens (with tier), schema metadata,
//          DNA bindings, parent component chain

get_component_tree()
// Returns: full React component tree with source locations,
//          each node includes component name, file:line,
//          prop summary, child count

get_page_tokens()
// Returns: all CSS custom properties defined in the project,
//          grouped by tier (brand vs semantic),
//          mapped to their DNA definitions,
//          current values per color mode

get_design_audit()
// Returns: DNA violations (hardcoded colors, missing tokens,
//          non-semantic token usage, motion violations),
//          each with file:line and suggested fix

get_animation_state(selector?: string)
// Returns: all active animations (CSS, WAAPI, GSAP),
//          targets, properties, keyframes, timing, easing,
//          playback state, timeline position

get_extracted_styles(selector?: string)
// Returns: clustered color palette, typography scale,
//          spacing scale, layout structure, shadows, radii,
//          normalized and tokenized

get_mutation_diffs()
// Returns: all accumulated visual changes from the current session,
//          each with source file reference, before/after values,
//          structured as actionable instructions
```

### 11.3 Auto-Configuration

On first run, the sidecar generates MCP config files in the project root:

**.mcp.json** (Claude Code):
```json
{
  "mcpServers": {
    "flow": {
      "type": "streamable-http",
      "url": "http://localhost:3737/__mcp"
    }
  }
}
```

**.cursor/mcp.json** (Cursor):
```json
{
  "mcpServers": {
    "flow": {
      "url": "http://localhost:3737/__mcp"
    }
  }
}
```

**.vscode/mcp.json** (VS Code Copilot):
```json
{
  "mcpServers": {
    "flow": {
      "url": "http://localhost:3737/__mcp"
    }
  }
}
```

These files are added to `.gitignore` automatically. Port is configurable.

### 11.4 Source Resolution Strategy

The sidecar resolves source locations without requiring a bundler plugin:

1. **Primary:** `@babel/plugin-transform-react-jsx-source` (or SWC equivalent) injects `_debugSource` into every JSX element at compile time. This works across all bundlers (Vite, Webpack, Turbopack, Parcel, esbuild) because it's a standard Babel/SWC transform, not a bundler plugin.

2. **Source maps on disk:** The sidecar reads `.map` files from the project's build output directory. Uses `@jridgewell/source-map` (WASM-backed) for resolution.

3. **AST fallback:** When `_debugSource` is unavailable (production builds, non-React), the sidecar parses source files with SWC to match component names and prop signatures against the fiber tree.

4. **Enhanced (with bundler plugin):** When a bundler plugin is active, it forwards the live module graph to the sidecar, enabling richer dependency resolution and instant updates on HMR.

### 11.5 Discovery

The extension discovers the sidecar via:

1. On page load, service worker fetches `http://localhost:3737/__flow/health`
2. If found → upgrade to dev mode (source resolution, MCP, schema enrichment)
3. If not found → extension-only mode (extract, mutations, computed styles)
4. Port scanning: tries default port (3737), then reads `.flow.json` in project root if present

When a bundler plugin is also present, the extension detects it via `/__flow/health` on the page's origin (e.g., `localhost:5173`). The plugin and sidecar coordinate — the plugin forwards module graph data to the sidecar, and the sidecar serves as the single MCP endpoint.

---

## 12. LLM Context Output

The final compiled output from all accumulated interactions. Supports two delivery methods:

### 12.1 Clipboard

Structured markdown, copy-ready. Includes:

- All annotations (comments, questions)
- All text edit diffs (before/after)
- All live mutation diffs (before/after with property names)
- All prompt builder instruction chains
- All designer mode value changes
- All animation timeline diffs
- Source file references (file:line) for every element mentioned
- Extracted style tokens (in extract mode)

### 12.2 MCP

Same data, structured as tool responses. The LLM client calls Flow's MCP tools directly via the sidecar. No copy-paste required. The LLM sees:

- Component context with resolved source locations
- Token values with semantic meaning
- Animation state with exact timing values
- The user's structured instructions from the prompt builder
- All accumulated mutation diffs as actionable instructions

---

## 13. Technical Details

### 13.1 Extension Manifest (MV3)

```json
{
  "manifest_version": 3,
  "name": "Flow",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["http://localhost/*", "http://127.0.0.1/*"],
  "optional_host_permissions": ["<all_urls>"],
  "devtools_page": "devtools.html",
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }]
}
```

- `activeTab` + `scripting` for page inspection and agent script injection
- `host_permissions` scoped to localhost by default (minimal Chrome Web Store warning)
- `optional_host_permissions` for extract mode on external sites (user opt-in prompt)
- `devtools_page` bootstraps the DevTools panel (no permission warning)
- Agent script injected via `chrome.scripting.executeScript({ world: 'MAIN' })` for page-context access to React fiber, GSAP globals, and computed CSS custom properties

### 13.2 Build Tooling

**Extension:**
- **WXT** (Vite-based extension framework, file-based content script routing, HMR in dev)
- **React 19** for DevTools panel UI
- **Zustand 5** for state management (21 slices from Flow 1)
- **TypeScript 5.8** throughout
- **Tailwind v4** with @theme blocks for panel styling

**Sidecar:**
- **Node.js** standalone process
- **SWC** (native, not WASM) for source file parsing
- **chokidar** for file watching
- **@jridgewell/source-map** for source map resolution
- **express** or **h3** for HTTP server

**Bundler plugins:**
- **unplugin** for Vite + Webpack + Rspack coverage
- Framework-specific hooks where unplugin's common API is insufficient

### 13.3 React 19 Compatibility

React 19 removed `_debugSource` from fiber nodes. Mitigations:

1. **Babel/SWC transform (primary, works everywhere):** `@babel/plugin-transform-react-jsx-source` injects `_debugSource` in dev mode regardless of React version. `@vitejs/plugin-react-swc` and Next.js both enable this by default. This is a compile-time transform, not a bundler plugin — it works across Vite, Webpack, Turbopack, and all other bundlers.

2. **Component stack traces (fallback):** Parse React 19's `captureOwnerStack()` output and resolve via source maps. This is the same approach React DevTools v5+ uses. Requires calling during render, which the agent script triggers by hooking into the reconciler via `__REACT_DEVTOOLS_GLOBAL_HOOK__`.

3. **AST matching (last resort):** Component name + prop signature matching against source files via SWC in the sidecar. Slower, less precise, but works without any compile-time transforms.

### 13.4 GSAP Detection

`gsap.globalTimeline` only exists when GSAP is loaded on `window`. Bundled ES module GSAP won't expose globals. Detection strategy:

1. **Check `window.gsap`** — works for CDN and global GSAP installations
2. **With bundler plugin:** Instrument GSAP imports at dev time to expose timeline data on a known global (`window.__FLOW_GSAP__`)
3. **Without bundler plugin:** Fall back to Web Animations API (`document.getAnimations()`) which captures CSS animations and WAAPI but not GSAP-specific data
4. **Manual opt-in:** User can add `window.__FLOW_GSAP__ = gsap` in their app's entry point

### 13.5 State Persistence

User session data (comments, text edits, mutation diffs, prompt builder steps) persists via:

- **`chrome.storage.session`** — survives panel close/reopen within the same browser session, cleared on browser restart
- **`chrome.storage.local`** — optional, user-enabled persistence across sessions
- **Export/import** — full session state exportable as JSON for sharing or archival
- **Per-tab isolation** — each tab maintains its own session state, keyed by tabId

### 13.6 Performance Constraints

- Content script: throttle hover events to 60fps, debounce style reads to 16ms
- Agent script: lazy fiber walking — only traverse on explicit selection, not on every React commit
- Panel: virtualized lists for large component trees (1000+ nodes)
- Source maps: cache parsed maps in `chrome.storage.session`, invalidate on page reload
- Sidecar: file watcher uses OS-native events (fsevents on macOS), debounced to 100ms
- Mutation diffs: stored as compact JSON patches, not full DOM snapshots

### 13.7 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | Full |
| Arc, Brave, Edge, Vivaldi | Full (Chromium-based) |
| Firefox | Full except side panel API (use DevTools panel instead) |
| Safari | Deferred (requires Apple Developer Program, $99/yr) |

---

## 14. Packages

```
@flow/extension          Chrome extension (WXT + React 19)
@flow/server             MCP sidecar server (Node.js)
@flow/unplugin           Optional bundler plugins (unplugin)
@flow/shared             Shared types, utilities, token parsing
```

- The **extension** works standalone (extract mode, live mutations, clipboard output).
- The **sidecar** works standalone (MCP tools for LLM clients, file watching, source resolution).
- The **extension + sidecar** together provide full dev mode.
- The **bundler plugin** is optional enhancement for deeper integration.

---

## 15. Distribution

### Extension Only (Zero Config)

Install from Chrome Web Store. Works on any page immediately for extract mode. Live DOM mutations available everywhere. Dev mode features activate automatically when sidecar is detected on localhost.

### Sidecar (npm install)

```bash
npm install -D @flow/server
```

Add to your dev workflow:
```bash
npx flow-server
```

MCP config auto-generated on first run. Works with any framework, any bundler.

### Bundler Plugin (Optional Enhancement)

**Vite:**
```typescript
// vite.config.ts
import flow from '@flow/unplugin/vite'

export default defineConfig({
  plugins: [react(), flow()]
})
```

**Webpack:**
```javascript
// webpack.config.js
const flow = require('@flow/unplugin/webpack')

module.exports = {
  plugins: [flow()]
}
```

**Next.js (webpack mode):**
```javascript
// next.config.js
const flow = require('@flow/unplugin/webpack')

module.exports = {
  webpack: (config, { dev }) => {
    if (dev) config.plugins.push(flow())
    return config
  }
}
```

**Next.js (Turbopack mode):**
No plugin available — Turbopack has no plugin API. The sidecar provides all dev mode features without a plugin. Ensure `@babel/plugin-transform-react-jsx-source` is in your Babel config (Next.js enables this by default in development).

---

## 16. What Flow Does Not Do

- Write files (mutations are live DOM only; diffs compile into prompts for the LLM to apply)
- Modify source code on disk
- Run a desktop application
- Require dependencies in your production bundle
- Require a specific bundler (sidecar works with any or none)
- Lock you to a specific LLM client (clipboard + standard MCP protocol)
- Lock you to a specific framework (extension works anywhere; React fiber integration is progressive enhancement)

---

## 17. Migration from Flow 1 (Tauri)

Current codebase (tools/flow Tauri app): ~46,000 lines.

| Category | Lines | Action |
|----------|-------|--------|
| Pure React components (54+ files) | ~25,000 | Move to extension DevTools panel unchanged |
| Pure Zustand slices (13 of 15) | ~2,682 | Move unchanged |
| Canvas/gesture/physics hooks | ~5,000 | Move unchanged |
| Editor mode logic | ~4,900 | Move unchanged |
| Tauri bindings (auto-generated) | 731 | Delete |
| Tauri-dependent store slices (2) | 1,062 | Refactor to use sidecar API / fetch |
| Tauri-dependent components (4) | ~1,000 | Replace native dialogs with HTML inputs, remove window controls |
| Tauri hooks (file watcher, dev server) | 181 | Replace with sidecar WebSocket / chrome.storage |
| Bridge package | ~2,500 | Replace with content script + agent script |
| Rust backend (32 commands) | 4,600 | Delete. Replaced by sidecar (Node.js) + browser APIs |

**Carries forward unchanged: ~37,582 lines (92.7% of React/TS code)**
**Deleted: ~5,331 lines (Rust backend + auto-generated bindings)**
**Refactored: ~1,243 lines (2 slices + 4 components + 2 hooks)**
**New code:**
- Content script + agent script: ~3,000-5,000 lines (element picker, overlays, mutation engine, fiber walking)
- Service worker: ~300 lines
- MCP sidecar server: ~2,000 lines
- Bundler plugin (unplugin): ~500 lines
- **Total new: ~6,000-8,000 lines**

---

## 18. Evaluation Plan: Branch A vs Branch B

### Branch A: Inspiration Implementation (`feat/flow-rearch-scratch`)

Build a WXT Chrome extension from scratch. Study VisBug's content script patterns but write all new code in TypeScript.

**Build:**
- WXT project scaffold with React 19 DevTools panel
- Content script: element picker, highlight overlay, mutation engine
- Agent script: fiber walking, `_debugSource` extraction
- Service worker: message routing, sidecar health check
- Wire to Flow's existing Zustand slices and React components

**VisBug patterns to adopt:**
- `deepElementFromPoint()` for shadow DOM penetration
- SVG overlays positioned via CSS custom properties
- Closed shadow root for encapsulation
- `requestAnimationFrame` for overlay repositioning
- `MutationObserver` for tracking DOM changes under selection
- Popover API for top-layer rendering (avoids z-index conflicts)

### Branch B: Direct VisBug Fork (`feat/flow-rearch-visbug-fork`)

Fork VisBug repo. Keep its content-script inspection engine. Replace toolbar with Flow's React DevTools panel.

**Build:**
- Fork VisBug, modernize build system (WXT replaces Rollup)
- Keep: 19 feature modules, selection overlay system, utilities
- Replace: `vis-bug.element.js` toolbar with DevTools panel trigger
- Add: `chrome.runtime.connect` bridge (content script ↔ panel)
- Add: agent script for fiber walking (VisBug has no React awareness)
- Wire to Flow's existing Zustand slices and React components

**Key challenge:** VisBug has zero DevTools panel infrastructure. The `chrome.runtime.connect` bridge between content script and panel is net-new code regardless.

### Evaluation Criteria

| Criterion | What to measure |
|-----------|----------------|
| Speed | Time to working inspect-and-highlight loop on an arbitrary page |
| Code quality | TypeScript coverage, separation of concerns, testability |
| Integration | How cleanly Flow's React panels wire to the content script data |
| Mutation capture | How naturally live DOM edits convert to structured diffs |
| Maintainability | Dependency health, build complexity, upgrade path |

### Decision Point

After both branches reach minimum viable element picker (inspect, highlight, select, read computed styles, display in panel), compare and commit to one path.

---

## 19. Bundler Plugin Research Summary

Research conducted February 2, 2026. Findings that shaped this spec:

### Unplugin Coverage Matrix

| Bundler | Unplugin | Module Graph | Dev Middleware | HMR |
|---------|----------|-------------|----------------|-----|
| Vite | Yes | Yes (`server.moduleGraph`) | Yes (`configureServer`) | Yes (`import.meta.hot`) |
| Webpack 5 | Yes | Yes (`compilation.moduleGraph`) | Yes (`setupMiddlewares`) | Custom WebSocket |
| Rspack | Yes | Yes | Yes | Custom WebSocket |
| Turbopack | **No** | **No API** | **No API** | **No API** |
| esbuild | Yes | Limited | No | No |
| Rollup | Yes | Limited | No | No |

### Turbopack Status (February 2026)

- Default bundler in Next.js 16+
- Supports webpack loaders (subset: JS-returning loaders only)
- **No plugin API.** Roadmapped for Q2 2026.
- No custom middleware, no module graph access, no HMR hooks
- Only integration path: standard Babel/SWC transforms (which the sidecar relies on)

### Existing Tool Patterns

| Tool | Architecture | Cross-bundler? |
|------|-------------|----------------|
| click-to-component | Babel transform + runtime fiber access | Yes — works everywhere |
| Nuxt DevTools | Deep Nuxt/Nitro coupling | No — Nuxt only |
| Storybook | Separate builder abstractions (Vite/Webpack) | Partial — no Turbopack |
| TanStack Router DevTools | React component, no bundler plugin | Yes — maximum compat |
| Chrome DevTools MCP | Browser-native MCP integration | Yes — browser API |
| vite-plugin-inspect | Vite-specific, `/__inspect/` route | No — Vite only |

### Conclusion

The sidecar architecture is the only approach that provides full functionality across all bundlers today, including Turbopack. Bundler plugins are valuable optimizations (module graph, HMR, auto-injection) but must never be required for core features.

---

## 20. VisBug Research Summary

Research conducted February 2, 2026. Repository: GoogleChromeLabs/ProjectVisBug (Apache 2.0).

### Architecture

- ~4-6K lines vanilla JavaScript + web components
- No framework, no DevTools panel
- Entire UI rendered as `<vis-bug>` custom element via Shadow DOM + Popover API
- MV3 manifest with minimal permissions
- Background service worker manages injection lifecycle (inject/restore/eject)
- Build: Rollup 2 + PostCSS + Terser (dated but functional)

### Codebase Structure

```
app/
  components/
    vis-bug/vis-bug.element.js     # Main controller (~300 lines)
    selection/
      overlay.element.js           # SVG rectangle overlays
      handles.element.js           # 8 resize handles + box model
      label.element.js             # Element tag/id/class display
    hotkey-map/                    # Keyboard shortcut UI
    metatip/                       # Tooltip components
  features/                        # 19 feature modules:
    selectable.js                  # Element picker (deepElementFromPoint)
    margin.js, padding.js          # Spacing tools
    font.js                        # Typography editing
    flex.js                        # Flexbox inspector
    color.js, hueshift.js          # Color tools
    position.js, move.js           # Position/move tools
    boxshadow.js                   # Shadow editing
    accessibility.js               # A11y inspector
    search.js                      # Element search
    guides.js                      # Alignment guides
    screenshot.js                  # Screenshot capture
    ...
  utilities/                       # 12 utility modules:
    styles.js                      # getComputedStyle wrapper
    contextmenu.js                 # Context menu builder
    ...

extension/
  manifest.json                    # MV3
  visbug.js                        # Service worker
  toolbar/inject.js                # Injection script
```

### Production Dependencies (6 total)

- `blingblingjs` (0.6kb) — jQuery-like DOM utility
- `hotkeys-js` — keyboard shortcuts
- `query-selector-shadow-dom` — shadow DOM traversal
- `@ctrl/tinycolor` + `colorjs.io` — color manipulation
- `construct-style-sheets-polyfill` — constructible stylesheets

### Key Patterns Worth Adopting

1. **`deepElementFromPoint()`** — pierces shadow DOM boundaries for element selection
2. **SVG overlay positioning** — CSS custom properties (`--top`, `--left`, `--width`, `--height`) drive overlay position without imperative updates
3. **Closed shadow root** — all overlay/UI rendering encapsulated from page styles
4. **Popover API** — top-layer rendering avoids z-index conflicts with page content
5. **`MutationObserver`** — keeps overlays synced with DOM changes
6. **`requestAnimationFrame`** — throttled resize recalculation for overlay positioning
7. **Feature module pattern** — each tool (margin, padding, font, etc.) is a self-contained module with activate/deactivate lifecycle

### Maintenance Status

- **Maintainer:** Adam Argyle (Google Chrome team)
- **Stars:** 5.7K | **Forks:** 316 | **Contributors:** 33
- **v0.4.0** (April 2024): Major — ColorJS, MV3 migration, Popover API
- **v0.4.9** (November 2024): Latest — DevMode icon, bug fixes
- **209 open issues** — mostly feature requests, few bugs
- **Dev toolchain** — dated (Rollup 2, old Babel, old Puppeteer); needs modernization for fork

### Fork Assessment

| Category | Lines | Reusable? |
|----------|-------|-----------|
| Feature modules (19) | ~2,500 | Yes — core inspection/mutation logic |
| Selection overlays (3 components) | ~600 | Yes — overlay rendering system |
| Utilities (12 modules) | ~1,200 | Yes — style reading, shadow DOM |
| Toolbar UI (`vis-bug.element.js`) | ~300 | No — replaced by DevTools panel |
| Keyboard map | ~200 | No — replaced by panel keybindings |
| Build system | ~150 | No — replaced by WXT |
| Extension scripts | ~150 | Partial — service worker rewritten |

**Reusable: ~60% (~4,300 lines)**
**Replace: ~40% (~650 lines + build system)**
**Net-new regardless of fork: DevTools panel bridge, fiber walking, source resolution, prompt output, sidecar communication**
