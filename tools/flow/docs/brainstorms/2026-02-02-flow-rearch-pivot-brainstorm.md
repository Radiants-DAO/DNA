# Flow Rearch Pivot Brainstorm

**Date:** 2026-02-02
**Status:** Open — two-branch evaluation pending

## What We're Deciding

Whether to rearchitect Flow from a Tauri desktop app to a Chrome extension + Vite plugin, and if so, whether to fork VisBug or build the content-script layer from scratch using VisBug as inspiration.

## Why the Pivot

Three converging problems with the current Tauri app:

1. **Iframe bridge limitations.** Flow can only inspect projects that install `@rdna/bridge`. The opt-in requirement kills adoption, and the iframe sandbox prevents deep DOM inspection, fiber walking, and source map resolution.
2. **Rust maintenance burden.** The Rust backend (SWC, lightningcss, file watching) duplicates what Vite already provides. 4,600 lines of Rust + 731 lines of auto-generated bindings for capabilities the browser/Vite can handle natively.
3. **Market positioning.** A browser devtool is where developers already work. A desktop app is an extra context switch.

## Key Insight: Live Mutations + Prompt Output

The rearch doc (`flow-rearch.md`) specifies read-only inspection ("Flow does not write files"). This is too limiting. VisBug proves that live DOM mutations are the killer feature for visual CSS tools. Flow should do both:

- **Live DOM mutations** (VisBug's model) — edit styles, move elements, tweak values directly on the page
- **Prompt output** (Flow's model) — capture those mutations as structured diffs and compile into LLM context

This makes Flow useful standalone (visual editing) AND as an LLM context tool (prompt generation). The pipeline becomes:

```
DOM element → inspect → mutate → capture diff → compile prompt
```

## Two Branches to Evaluate

### Branch A: Inspiration Implementation

Build a WXT Chrome extension from scratch. Study VisBug's content script patterns (element picker, overlay rendering, CSS property grouping, visual handles) but write all new code.

- Content script + agent script: new code (~3-5K lines), informed by VisBug's UX
- DevTools panel: Flow's existing 25K lines of React UI, ported from Tauri
- MCP sidecar server (see architecture revision below)
- Full control over architecture, no inherited tech debt
- Higher initial effort for the on-page inspection layer

### Branch B: Direct VisBug Fork

Fork the VisBug repo. Integrate Flow's React panel UI as the DevTools panel. Add prompt output pipeline on top of VisBug's existing mutation system.

- VisBug handles: element picking, style inspection, live editing, accessibility, grid/flex visualization
- Flow panels handle: component identity, source resolution, prompt assembly, MCP
- Shorter path to a working element picker
- Inherits VisBug's vanilla JS / custom elements codebase (not React)
- VisBug last significant update: April 2024 (v0.4.0), last commit Nov 2024 (v0.4.9)

### Evaluation Criteria

Compare holistically:
- **Speed:** Time to a working inspect-and-highlight loop on an arbitrary page
- **Code quality:** Cleaner, more extensible codebase for Flow's React panel integration
- **Feature completeness:** Proximity to full rearch feature set (inspect + comment + mutations + prompt output)

---

## Research: VisBug Codebase (completed 2026-02-02)

### Architecture

~4-6K lines of vanilla JS + web components. **No framework, no DevTools panel.** Entire UI is an in-page `<vis-bug>` custom element rendered via Shadow DOM + Popover API (top layer). MV3. Apache 2.0.

**Structure:**
```
app/
├── components/
│   ├── vis-bug/vis-bug.element.js   # Main controller (~300 lines)
│   ├── selection/                    # Overlay, handles, labels
│   ├── hotkey-map/                   # Keyboard shortcuts
│   └── metatip/                      # Tooltips
├── features/                         # 19 feature modules (~100-200 each)
└── utilities/                        # 12 utility modules (~50-150 each)

extension/
├── manifest.json                     # MV3
├── visbug.js                         # Service worker (~100 lines)
└── toolbar/inject.js                 # Injection logic (~50 lines)
```

**Injection flow:** Background service worker → injects CSS + bundle as ES module → creates `<vis-bug>` element → attaches to closed shadow root.

**Permissions:** `activeTab`, `contextMenus`, `scripting`, `storage` — minimal.

### Content Script Patterns

- **Element picker** (`features/selectable.js`): `deepElementFromPoint()` for shadow DOM penetration. Shift-click multi-select. Adds `data-selected` attribute.
- **Overlays** (`components/selection/`): SVG rectangles positioned via CSS custom properties. Closed shadow DOM. `requestAnimationFrame` for resize recalc. `MutationObserver` to track DOM changes.
- **Style reading** (`utilities/styles.js`): `getComputedStyle` with shadow DOM boundary handling, color conversions, box/text shadow parsing.
- **Live mutations:** Direct DOM style manipulation per feature module (margin, padding, font, flex, etc.)

### Dependencies

**Production (6 total, very lean):**
- blingblingjs (0.6kb jQuery-like)
- hotkeys-js
- query-selector-shadow-dom
- @ctrl/tinycolor + colorjs.io
- construct-style-sheets-polyfill

**Dev toolchain:** Dated (Rollup 2, old Babel, old Puppeteer). Would need modernization.

### Maintenance

- Maintained by Adam Argyle (Google Chrome team). 5.7K stars, 316 forks.
- v0.4.0 (April 2024): Major — ColorJS, MV3 migration, popover.
- v0.4.9 (Nov 2024): Latest — DevMode icon, bug fixes.
- 209 open issues, mostly feature requests. Stable but not actively evolving.

### Fork Assessment

**Reusable (~60%):** Feature modules (19 tools), selection overlay system, utility modules.
**Replace:** Toolbar UI (`vis-bug.element.js`), keyboard map, build system.
**Add:** DevTools panel (React), message passing layer, fiber walking, source resolution, prompt output.

**Key challenge for Branch B:** VisBug has zero DevTools panel infrastructure. Adding one means building the `chrome.runtime.connect` bridge between content script and panel from scratch regardless. The fork saves the on-page inspection layer but not the communication architecture.

---

## Research: Bundler Plugin Architecture (completed 2026-02-02)

### Critical Finding: Turbopack Has No Plugin API

Turbopack (Next.js default bundler) has **no plugin API as of Feb 2026**. Only webpack loaders (subset) are supported. Plugin API is roadmapped for Q2 2026 but doesn't exist today.

This kills the rearch doc's Vite-only approach AND any unplugin-based approach for Next.js + Turbopack.

### Unplugin Coverage

| Bundler | Supported | Module Graph | Dev Middleware | HMR |
|---------|-----------|-------------|----------------|-----|
| Vite | Yes | Yes | Yes | Yes |
| Webpack | Yes | Yes | Yes | Custom |
| Rspack | Yes | Yes | Yes | Custom |
| Turbopack | **No** | No | No | No |
| esbuild | Yes | Limited | No | No |

### Revised Architecture: Hybrid Sidecar + Optional Plugins

**The MCP server should be a standalone sidecar process, not embedded in a bundler plugin.** This is the only way to support all frameworks including Next.js + Turbopack.

```
Chrome Extension (always present)
├── Content script (element picker, overlays, mutations, fiber walking)
├── Agent script (page-context access)
├── DevTools panel (Flow's React UI)
└── Service worker (message routing)

MCP Sidecar Server (standalone Node process, always present)
├── HTTP endpoint on known port (e.g., 3737)
├── File watching (chokidar)
├── Source parsing (SWC or Babel AST)
├── Component schema / DNA resolution
├── MCP tools: get_element_context, get_component_tree, etc.
└── Auto-generates .mcp.json configs for Claude/Cursor/VS Code

Optional Bundler Plugins (enhanced DX when available)
├── Vite plugin → module graph, HMR channel, auto-inject inspector
├── Webpack plugin → module graph, dev middleware, auto-inject
└── Turbopack → nothing until plugin API lands (Babel transform only)
```

### Why Sidecar Wins

1. **Universal:** Works with Vite, Webpack, Turbopack, Parcel, esbuild, or no bundler at all
2. **Graceful degradation:** Extension always works → sidecar adds source resolution → bundler plugin adds module graph + HMR
3. **Decoupled lifecycle:** Sidecar can start independently of dev server
4. **Precedent:** MCP sidecar pattern is becoming standard in 2026 tooling

### Source Resolution Without Bundler Plugin

`@babel/plugin-transform-react-jsx-source` injects `_debugSource` at compile time. This works across ALL bundlers that run Babel/SWC (which is all of them). The sidecar reads source maps from disk. No bundler plugin required for the core source → file:line mapping.

### Discovery Mechanism

Extension detects sidecar via:
1. Fetch `http://localhost:3737/__flow/health` on page load
2. If found → upgrade to enhanced mode (source resolution, MCP)
3. If not found → extract mode only (computed styles, no source mapping)

Same pattern as the rearch doc's `/__flow/health`, but on the sidecar port instead of the Vite port.

### Existing Tool Patterns Studied

- **click-to-component:** Babel transform + runtime fiber access. Works everywhere. No bundler plugin needed.
- **Nuxt DevTools:** Deep Nuxt coupling, not cross-framework. Server hooks only.
- **Storybook:** Separate builder abstractions for Vite/Webpack. No Turbopack support.
- **TanStack Router DevTools:** No bundler plugin at all — just a React component. Maximum compatibility.
- **Chrome DevTools MCP:** New (2026), shows direction of browser-native MCP integration.

---

## What Carries Forward Regardless

Both branches share:
- Flow's 25K lines of React panel UI (components, Zustand slices, canvas hooks)
- The core pipeline: DOM → fiber → source → schema → prompt
- DNA token system integration (brand → semantic tiers)
- Clipboard-first + MCP dual output
- **Revised: MCP sidecar server instead of Vite-only plugin**

## Updated Open Questions

- ~~Vite-only dev mode excludes Next.js~~ → **Resolved: sidecar approach**
- VisBug's content script is vanilla JS with custom elements. How cleanly does it integrate with a React DevTools panel? (Branch B specific)
- VisBug's dev toolchain (Rollup 2, old Babel) needs modernization. How much work? (Branch B specific)
- The rearch doc estimates 1,500 lines for content script + agent + service worker. Realistic estimate is 3-5K for content script alone with visual editing. Does this change the migration math significantly?
- React 19 removed `_debugSource`. The Babel/SWC transform re-injects it at compile time. Does this work reliably across all React 19 setups?
- State persistence across panel close/reopen — where do accumulated comments, text edits, and prompt builder steps live?
- Sidecar port discovery: should extension scan multiple ports or use a config file?

## Next Steps

1. ~~Research VisBug codebase~~ **Done**
2. ~~Research bundler plugin alternatives~~ **Done**
3. Update `flow-rearch.md` to reflect sidecar architecture
4. Create Branch A: `feat/flow-rearch-scratch`
5. Create Branch B: `feat/flow-rearch-visbug-fork`
6. Build minimum viable element picker on both
7. Compare and decide
