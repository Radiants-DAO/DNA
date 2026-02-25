# Flow 2 — Master Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rearchitect Flow from a Tauri desktop app into a Chrome extension + MCP sidecar server + optional bundler plugins.

**Architecture:** Chrome extension (WXT + React 19) provides on-page inspection, live DOM mutations, and a DevTools panel. A standalone Node.js MCP sidecar server handles source resolution, file watching, and LLM tool endpoints. Optional unplugin-based bundler plugins add module graph and HMR integration for Vite/Webpack.

**Tech Stack:** WXT (Chrome extension framework), React 19, Zustand 5, TypeScript 5.8, Tailwind v4, Node.js (sidecar), SWC, chokidar, unplugin

---

## Plan of Plans

This is a **master plan** that breaks the full rearchitecture into 6 sequential phases. Each phase has its own deliverable and produces a plan document when it's time to execute. Phases are ordered by dependency — each builds on the previous.

### Decision: Branch A (build from scratch)

Per the brainstorm and spec evaluation, Branch A is the path forward. VisBug's reusable code is vanilla JS with dated patterns. The net-new code (DevTools bridge, fiber walking, source resolution, prompt output) is the hard part regardless of fork vs scratch. Branch A gives full control with no inherited tech debt.

---

## Phase 1: Monorepo Scaffold + Extension Shell

**Deliverable:** Working WXT Chrome extension with empty DevTools panel, content script that highlights hovered elements, and message passing between all extension contexts.

**Packages created:**
- `packages/shared` — shared types, constants, message schemas
- `packages/extension` — WXT Chrome extension

**What this proves:** The extension build pipeline works, content script ↔ DevTools panel communication is solid, and we have a foundation to build on.

**Key tasks:**
1. Initialize pnpm workspace at `/tools/flow/` with `packages/` structure
2. Scaffold `packages/shared` with TypeScript — message types, constants
3. Scaffold `packages/extension` with WXT + React 19 + Tailwind v4
4. Content script: element picker with highlight overlay (Shadow DOM + Popover API)
5. Agent script: inject into `world: 'MAIN'`, verify page-context access
6. Service worker: message router (tabId-based)
7. DevTools panel: minimal React app that receives messages from content script
8. Wire full message chain: agent ↔ content ↔ service worker ↔ panel
9. Test on a real page (e.g., localhost React app)

**Estimated new code:** ~2,000 lines
**Depends on:** Nothing — this is the starting point

---

## Phase 2: Inspection Pipeline

**Deliverable:** Click any element on any page → see component name, source location (if React), computed styles, and CSS custom properties in the DevTools panel.

**What this builds:**
- Content script: `getComputedStyle` extraction, layout inference (grid/flex), animation state (`document.getAnimations()`)
- Agent script: React fiber walking via `__REACT_DEVTOOLS_GLOBAL_HOOK__`, `_debugSource` extraction, computed CSS custom property reading
- DevTools panel: inspection results display (component identity, style groups, token values)

**Key tasks:**
1. Agent script: fiber tree walker — find fiber for a DOM element, extract component name + props
2. Agent script: `_debugSource` extraction (with React 19 `captureOwnerStack()` fallback)
3. Content script: computed style extraction grouped by category (layout, spacing, size, typography, colors, borders, shadows, effects)
4. Content script: grid/flex structure inference
5. Content script: animation state capture (`document.getAnimations()`, CSS transitions)
6. Content script: CSS custom property collection from computed styles
7. Panel: inspection display — show all extracted data for selected element
8. Panel: component hierarchy display (parent chain from fiber)
9. Wire: clicking an element in content script → full inspection data in panel

**Estimated new code:** ~3,000 lines
**Depends on:** Phase 1

---

## Phase 3: Port Flow UI + Zustand Store

**Deliverable:** Flow's existing React panel UI running inside the DevTools panel, connected to the new content script data sources instead of Tauri commands.

**What this builds:**
- Migrate 15 Zustand slices (13 unchanged, 2 refactored)
- Migrate ~25K lines of React components
- Replace Tauri `invoke()` calls with message passing / fetch
- Replace native dialogs with HTML equivalents
- Replace file watcher hook with `chrome.storage` / sidecar WebSocket

**Key tasks:**
1. Copy and adapt all 15 Zustand slices into extension panel
2. Refactor `bridgeSlice` — replace WebSocket bridge with content script message channel
3. Refactor `projectSlice` — replace Tauri dev server commands with sidecar API (stub for now)
4. Refactor `watcherSlice` — replace Tauri notify with sidecar WebSocket (stub for now)
5. Delete `bindings.ts` — create new `api.ts` with fetch wrappers for sidecar + message passing helpers
6. Port layout components: `EditorLayout`, `LeftPanel`, `RightPanel`, `SettingsBar`
7. Port canvas systems: `SpatialCanvas`, `ComponentCanvas`, all sub-components
8. Port designer panels: all 9 sections (layout, spacing, size, typography, colors, borders, shadows, effects, animations)
9. Port editor modes: `CommentMode`, `TextEditMode`, `ComponentIdMode`
10. Port remaining panels: `ComponentsPanel`, `ColorsPanel`, `TypographyPanel`, etc.
11. Replace `@tauri-apps/plugin-dialog` with HTML `<input type="file">` / custom modals
12. Replace window drag/resize controls with standard browser behavior
13. Wire inspection data from Phase 2 into the ported UI components
14. Verify all editor modes work end-to-end with content script

**Estimated adapted code:** ~25,000 lines (mostly copy + targeted refactoring)
**Estimated new glue code:** ~1,000 lines
**Depends on:** Phase 2

---

## Phase 4: Live Mutations + Diff Capture

**Deliverable:** Select an element, edit its styles/text/position live on the page, and see structured before/after diffs accumulate in the panel.

**What this builds:**
- Content script: mutation engine (style editing, move, resize via drag handles)
- Content script: before/after snapshot capture for every mutation
- Panel: mutation diff accumulator display
- Panel: text edit mode with live DOM text replacement + diff capture
- Panel: designer mode edits applied live to page via content script

**Key tasks:**
1. Content script: mutation engine — apply `element.style` changes from panel controls
2. Content script: before snapshot on mutation start, after snapshot on mutation end
3. Content script: drag handles for spacing (margin/padding box model)
4. Content script: text selection and replacement on page
5. Panel: mutation diff accumulator (list of all before/after changes)
6. Panel: wire designer panel controls to live DOM mutations via content script
7. Panel: wire text edit mode to content script text replacement
8. Diff format: structured JSON patches with property names, values, selectors
9. Test: make a style change → verify diff is captured → verify page reflects change

**Estimated new code:** ~3,000 lines
**Depends on:** Phase 3

---

## Phase 5: MCP Sidecar Server

**Deliverable:** Standalone Node.js process providing source resolution, schema/DNA enrichment, file watching, and MCP tool endpoints. Extension auto-detects it and upgrades to dev mode.

**Packages created:**
- `packages/server` — MCP sidecar server

**What this builds:**
- HTTP server on port 3737 with health endpoint
- MCP endpoint (`/__mcp`) with Streamable HTTP transport
- File watching (chokidar) for source files, schemas, DNA configs, token files
- Source parsing (SWC) for component analysis
- Source map reading (`@jridgewell/source-map`)
- Schema/DNA file discovery and resolution
- Token tier mapping (brand → semantic)
- Auto-generation of `.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`
- WebSocket server for real-time extension communication
- Extension service worker: sidecar health check + dev mode upgrade

**MCP tools:**
- `get_element_context(selector)` — component identity + source + tokens + schema
- `get_component_tree()` — full React component tree with source locations
- `get_page_tokens()` — all CSS custom properties grouped by tier
- `get_design_audit()` — DNA violations with file:line and suggested fixes
- `get_animation_state(selector?)` — active animations with timing data
- `get_extracted_styles(selector?)` — clustered palette, typography, spacing
- `get_mutation_diffs()` — all accumulated visual changes as actionable instructions

**Key tasks:**
1. Scaffold `packages/server` with TypeScript, h3 (HTTP), chokidar, SWC
2. Health endpoint: `GET /__flow/health`
3. File watcher: watch project root for `.tsx`, `.schema.json`, `.dna.json`, `.css` changes
4. Source map reader: load `.map` files, resolve file:line:column
5. Schema/DNA resolver: discover and parse schema + DNA files in project
6. Token parser: extract CSS custom properties from `@theme` blocks, map tiers
7. MCP endpoint: implement all 7 tools above
8. WebSocket server: push file change notifications to connected extensions
9. Auto-config: generate MCP config files on first run
10. Extension integration: service worker detects sidecar, panel requests enriched data
11. Extension upgrade: when sidecar detected, show source file paths, schema data, token tiers in panel

**Estimated new code:** ~3,000 lines
**Depends on:** Phase 4 (mutations provide diff data for `get_mutation_diffs`)

---

## Phase 6: LLM Context Output + Prompt Builder

**Deliverable:** All accumulated interactions (annotations, text edits, mutations, designer changes, animation tweaks) compile into structured, source-resolved prompts. Clipboard copy and MCP delivery.

**What this builds:**
- Prompt compiler: aggregates all session data into structured markdown
- Prompt builder UI: visual query builder (the core differentiator per §7.4 of spec)
- Comment/annotation mode with source-resolved badges
- Clipboard output with full context
- MCP delivery via sidecar tools
- Session persistence (`chrome.storage.session` + optional `chrome.storage.local`)
- Export/import session state as JSON

**Key tasks:**
1. Prompt compiler: take all accumulated diffs, annotations, text edits → structured markdown
2. Prompt builder UI: step chain with element slots ([@]) and property dropdowns ([v])
3. Language adapters: CSS / Tailwind / Figma vocabulary translation
4. Comment mode: click element → attach annotation → render badge on page → compile into output
5. Clipboard output: copy compiled markdown
6. MCP output: `get_mutation_diffs()` returns compiled context
7. Session persistence: `chrome.storage.session` for in-session, optional `chrome.storage.local`
8. Export/import: full session state as JSON

**Estimated new code:** ~2,500 lines
**Depends on:** Phase 5

---

## Phase Summary

| Phase | Deliverable | New/Adapted Code | Cumulative |
|-------|------------|-------------------|------------|
| 1 | Extension shell + message passing | ~2,000 | 2,000 |
| 2 | Inspection pipeline | ~3,000 | 5,000 |
| 3 | Port Flow UI + Zustand | ~26,000 | 31,000 |
| 4 | Live mutations + diffs | ~3,000 | 34,000 |
| 5 | MCP sidecar server | ~3,000 | 37,000 |
| 6 | Prompt output + builder | ~2,500 | 39,500 |

**Deferred (not in these 6 phases):**
- GSAP timeline editor (§8 of spec) — defer until core pipeline is solid
- Bundler plugins (`@flow/unplugin`) — defer until sidecar is proven
- Extract mode (§4.2) — extension-only mode works without sidecar; flesh out after Phase 6
- Component Canvas schema rendering (§9) — port from Flow 0 but lower priority than inspection + mutations
- Spatial View file tree (§10) — port from Flow 0 but lower priority

---

## Execution Order

Each phase gets its own detailed plan document (`2026-02-XX-flow-2-phase-N-*.md`) when it's time to execute. This master plan is the roadmap; the phase plans contain the exact file paths, code, and test commands.

**Start with Phase 1.** When Phase 1 is complete, write the Phase 2 plan using the actual file structure from Phase 1 as context.

---

## Key Risks

1. **Phase 3 is the largest by far** (~25K lines of ported code). It should be broken into sub-phases when its detailed plan is written: slices first, then layout, then panels, then modes.
2. **Agent script fragility** — React fiber internals change between versions. Build with error boundaries and graceful degradation from day one.
3. **WXT maturity** — WXT is the best option for extension development but verify it handles React 19 DevTools panels without friction early in Phase 1.
4. **Content Security Policy** — some pages block injected scripts. The agent script (`world: 'MAIN'`) may fail on sites with strict CSP. Handle gracefully.
