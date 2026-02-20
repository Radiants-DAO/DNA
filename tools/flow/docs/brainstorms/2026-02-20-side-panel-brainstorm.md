# Side Panel Brainstorm

**Date:** 2026-02-20
**Status:** Decided
**Depends on:** [FAB-First Architecture Refactor](2026-02-20-fab-first-architecture-brainstorm.md)

## What We're Building

A Chrome Side Panel that serves as the context-gathering and organization hub for Flow. It replaces the DevTools panel as the primary "power UI" surface. Contextual like Figma's side panel, built for accumulating LLM-ready context. The current Cmd+K prompt builder is sunset; its functionality is absorbed into a persistent prompt builder within the Side Panel.

## Why This Approach

The Side Panel opens with one click from the extension icon — no DevTools knowledge required. It gives designers a dedicated workspace for organizing context (layers, assets, variables, components) alongside a persistent clipboard and prompt builder. Chat with LLM comes later once the MCP bidirectional path is solid.

## Layout Architecture

```
┌──────────────────────────────────────────┐
│  [Layers] [Components] [Assets] [Vars] [Designer]  ← Rail tabs (icon strip)
├──────────────────────────────────────────┤
│                                          │
│           Active Tab Content             │
│                                          │
│  Layers (default): DOM tree + filter bar │
│  Components: React/Vue/Svelte scanner    │
│  Assets: Images/Fonts/CSS/JS sub-tabs    │
│  Variables: CSS custom properties        │
│  Designer: Style editor (ported)         │
│                                          │
├──────────────────────────────────────────┤
│  [Clipboard] [Prompt Builder]  ← Bottom dock tabs  │
│  ┌────────────────────────────────────┐  │
│  │  Clipboard: auto-accumulated       │  │
│  │  mutations + comments + questions  │  │
│  │  with filtered sections            │  │
│  │  "Copy all as .md" bulk export     │  │
│  │                                    │  │
│  │  — or —                            │  │
│  │                                    │  │
│  │  Prompt Builder: text box + chips  │  │
│  │  manual via V-mode cmd-clicks      │  │
│  │  surgical context building         │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Key Decisions

### Rail Tabs (5 tabs, left-to-right)

1. **Layers** (default) — DOM element tree, Figma-style. Filter/search bar built into the header (no separate Search tab). `ReorderEngine` already exists as the backbone. Will need its own brainstorm for tree rendering, expand/collapse, and interaction with FAB selection.

2. **Components** — Framework component scanner (React fibers, Vue, Svelte, Web Components, HTML landmarks). Ported from DevTools `ComponentsPanel.tsx`. No CDP dependency — runs via content script in MAIN world (same technique as `agent.ts` fiber parsing).

3. **Assets** — Page asset scanner (Images, Fonts, CSS, JS sub-tabs). Ported from DevTools `AssetsPanel.tsx`. No CDP dependency — uses `querySelectorAll`, `getComputedStyle`, `document.styleSheets`. Grid/List view for images, copy-on-click pattern.

4. **Variables** — CSS custom properties scanner. Ported from DevTools `VariablesPanel.tsx`. No CDP dependency for same-origin stylesheets (CDP adds cross-origin coverage as an upgrade path in DevTools). Category-grouped with type-specific renderers (color swatches, spacing bars, radius previews).

5. **Designer** — Style editor ported from DevTools `DesignerContent`. 9 collapsible sections (Layout, Spacing, Size, Position, Typography, Colors, Borders, Box Shadows, Effects). Temporary home — will eventually be replaced as on-page overlay tools mature, but has better UI patterns (proper controlled inputs, collapsible accordion sections) worth preserving during transition.

### Bottom Dock (2 tabs, persistent across all rail tabs)

**Clipboard tab:**
- Auto-accumulates three types of content with filtered sections:
  - Design changes (mutation diffs)
  - Comments
  - Questions
- Each section is togglable/filterable
- Undo/redo controls for mutations
- "Copy all as .md" button for bulk export to LLM
- This is the quick workflow: make changes → copy everything → paste into LLM

**Prompt Builder tab:**
- Text box with chip support
- Chips added via V-mode: cmd-click elements on page, cmd-click variables in Variables tab, cmd-click assets, etc.
- Persistent across ALL rail tabs — V-mode can add chips from any tab or anywhere on the page
- This is the surgical workflow: carefully curate specific context → copy/send to LLM
- Replaces Cmd+K functionality (Cmd+K spotlight is sunset)

### V Mode (new FAB mode)

- New top-level mode on the FAB toolbar (key: V)
- When active, cmd-clicking any element on the page adds its chip to the Prompt Builder
- Cmd-clicking items in Side Panel tabs (variables, assets, components) also adds chips
- The prompt builder is the accumulation target regardless of which tab is active

### Data Flow

```
Content Script → chrome.runtime.Port → Background Worker → Port relay → Side Panel
                                           ↓
                                    Sidecar WebSocket
```

- Side Panel opens a `chrome.runtime` port to background
- Background relays content script events (selections, mutations, scan results) to all connected surfaces (Side Panel, DevTools panel if open)
- Scanners (Components, Assets, Variables) are triggered from Side Panel via message to background, which uses `chrome.scripting.executeScript({ world: 'MAIN' })` to run them in the page context and returns results
- No direct content-script-to-side-panel communication

### What's Sunset

- **Cmd+K Spotlight** (`spotlight.ts` + `commandPalette/PromptPalette.tsx`) — replaced by V-mode + bottom-dock Prompt Builder
- **Panel-owned WebSocket** (`sidecarSync.ts`) — background owns the connection now
- **Panel-owned session sync** (`useSessionSync.ts`) — moves to background
- **`inspectedWindow.eval()` scanner calls** — replaced by `chrome.scripting.executeScript` from background

### What's NOT in Side Panel

- CSS cascade breakdown (CDP-only → DevTools)
- Full accessibility tree (CDP-only → DevTools)
- Cross-origin stylesheet reading (CDP-only → DevTools)
- Forced pseudo-states (CDP-only → DevTools)
- Accessibility Audit panel (uses CDP AX tree → DevTools)
- LLM chat (deferred until MCP bidirectional path works)

## Open Questions

- Layers panel tree rendering approach — needs its own brainstorm (virtual scroll for deep DOMs? lazy expand? sync with FAB selection?)
- V-mode chip types — what metadata does each chip carry? Element chips need selector + component name; variable chips need name + value; asset chips need type + path
- Bottom dock default height / expand behavior — how tall is it collapsed vs expanded? Does it auto-expand when first chip is added?
- Designer tab sunset timeline — when do overlay tools reach parity with the React-based designer sections?

## Research Notes

- Chrome Side Panel API: one panel, right-side only, `chrome.sidePanel` permission required
- No existing side panel infrastructure in the codebase (no permission, no entrypoint, no HTML)
- WXT framework supports side panel entrypoints natively
- Current panels use shared UI primitives: `CollapsibleSection`, `SearchInput`, copy toast, empty states, dark neutral palette — all portable to Side Panel React app
- Zustand store slices (`MutationSlice`, `CommentSlice`) can be shared between Side Panel and DevTools panel contexts
- `ReorderEngine` in `reorderEngine.ts` already provides DOM reorder operations for layers DnD
- `cmdk` library currently used for Cmd+K — can be removed once spotlight is sunset
