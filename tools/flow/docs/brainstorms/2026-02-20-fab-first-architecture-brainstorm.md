# FAB-First Architecture Refactor — Brainstorm

**Date:** 2026-02-20
**Status:** Decided (core architecture) — follow-up brainstorms needed

## What We're Building

Refactoring the extension from DevTools-panel-as-centerpiece to FAB-first, background-owns-pipeline architecture. The content script + FAB is the primary product surface. A Chrome Side Panel replaces the DevTools panel for pipeline/LLM features. The DevTools panel is repurposed as a designer/LLM-friendly lens on Chrome's developer tools data.

## Why This Approach

The current architecture gates the entire MCP context pipeline on the DevTools panel being open. The FAB creates a dangerous UX where users design without context reaching the LLM. A designer shouldn't need to know what DevTools is to use Flow.

## Key Decisions

### 1. Three-surface architecture

| Surface | Role | Requires |
|---|---|---|
| **FAB + content script** | The product. Select, mutate, design, comment. Always on. | Nothing — always available |
| **Chrome Side Panel** (right) | Context gathering + organization hub. Rail tabs: Layers (default), Components, Assets, Variables, Designer. Bottom dock: Clipboard (auto-accumulated mutations/comments/questions) + Prompt Builder (V-mode chip accumulator). See [Side Panel brainstorm](2026-02-20-side-panel-brainstorm.md). | Extension icon click |
| **DevTools panel** | Designer/LLM-friendly lens on Chrome's dev data. CDP-exclusive features only. | DevTools open |

### 2. Background service worker owns the pipeline

- Background maintains the WebSocket to the sidecar MCP server (consolidating the current two-WS split)
- `session-update`, `register-tab`, and agent feedback routing all move from the panel to the background
- Content script events (mutations, selections, comments) flow through background to sidecar regardless of any panel state
- Agent feedback flows back through background to content script (badge rendering) regardless of panel state
- Side Panel and DevTools panel, when open, subscribe to the background's event stream — neither owns the pipeline

### 3. FAB auto-sleep with activity timeout

- `chrome.alarms` keepalive runs while FAB is toggled on (keeps worker awake, WS alive)
- After ~10 minutes of page inactivity (mousemove, keydown, scroll), FAB auto-toggles off
- Worker sleeps naturally when FAB is off — alarm stops, WS drops
- Background flushes session state to `chrome.storage.session` before sleep
- On FAB re-toggle: worker wakes, WS reconnects, sidecar has durable session data
- Activity tracking is page-level (not tab-visibility), so tabbing away to read docs doesn't trigger timeout

### 4. DevTools panel = "Chrome DevTools for designers and LLMs"

The DevTools panel is not a debug view — it's a curated, beautiful, copy-friendly interface for data that Chrome's built-in panels surface in dev-hostile formats. It holds **only CDP-exclusive features:**

- CSS cascade breakdown (`CSS.getMatchedStylesForNode`)
- Full accessibility tree + Accessibility Audit (`Accessibility.getFullAXTree`)
- Cross-origin stylesheet reading (`CSS.getMatchedStylesForNode`)
- Forced pseudo-states (`CSS.forcePseudoState`)
- **Goal:** Surface necessary information for front-end devs in a pretty, copyable, and meaningful manner

**Note:** Components, Assets, and Variables scanners moved to Side Panel (they don't need CDP). Only Accessibility Audit stays here because it depends on the CDP AX tree.

### 5. V-mode + Cmd+K sunset

- New **V-mode** on the FAB toolbar — cmd-clicking elements/variables/assets adds chips to the Side Panel's Prompt Builder
- **Cmd+K spotlight** (`spotlight.ts` + `PromptPalette.tsx`) is sunset — replaced by V-mode + the Side Panel's bottom-dock Prompt Builder
- See [Side Panel brainstorm](2026-02-20-side-panel-brainstorm.md) for details

### 6. Content-script overlay is independent

The FAB's hover/selection overlay (shadow DOM divs) works without CDP. The CDP `Overlay.highlightNode` in `highlightService.ts` is a panel-side convenience, not a dependency. Design mode's box model visualization is fully content-script-owned.

## What Doesn't Need DevTools (confirmed)

All three in-progress feature plans are content-script-only, zero DevTools dependency:

- **Merged Layout Panel** — pure DOM APIs (`getComputedStyle`, `element.style`, event listeners)
- **Asset Mode** — deliberately avoids `inspectedWindow.eval`, uses `querySelectorAll` + `getComputedStyle`
- **Move Mode** — pure DOM manipulation (`insertBefore`, `appendChild`, `getBoundingClientRect`)

## Pipeline Refactor Detail

Current two-WebSocket problem:

| Connection | Owner | Status after refactor |
|---|---|---|
| WS #1 (background) | Background worker | **Becomes the single connection** — takes over session-update, register-tab, agent feedback |
| WS #2 (panel) | DevTools panel | **Eliminated** — panel subscribes to background's state via port messaging |

What moves from panel to background:
- `session-update` messages (compiled prompt, annotations, text edits, comments)
- `register-tab` / `close-session` session lifecycle
- Agent feedback reception (`agent-feedback`, `agent-resolve`, `agent-thread-reply`)
- `tabSessionId` ownership
- Comment state handling (currently only `Panel.tsx` handles `comment:submitted`)

## Open Questions

### Scoped to this brainstorm
- Exact activity-timeout duration (10 min is a starting point, may need user testing)
- Whether `chrome.storage.session` is sufficient for state persistence or if `chrome.storage.local` is needed for cross-restart survival

### Requiring follow-up brainstorms

1. ~~**Side Panel design**~~ — **RESOLVED:** See [Side Panel brainstorm](2026-02-20-side-panel-brainstorm.md). Rail tabs + bottom dock architecture decided. Cmd+K sunset, V-mode replaces it.

2. **Layers panel** — Decided it lives in the Side Panel as the default rail tab. Still needs brainstorm for: tree rendering approach, virtual scroll for deep DOMs, expand/collapse behavior, sync with FAB selection, filter/search bar.

3. **DevTools panel redesign** — Detailed UX for the "Chrome DevTools for designers" concept. Now scoped to CDP-only features: cascade, AX tree, cross-origin CSS, pseudo-states. How to present this data in a designer-friendly, copy-friendly, LLM-consumable format.

4. ~~**Side Panel ↔ FAB coordination**~~ — **RESOLVED:** Side Panel connects to background via chrome.runtime port. Background relays content script events to all surfaces. V-mode on FAB adds chips to Side Panel's Prompt Builder. Selection on page updates active tab context in Side Panel.

## Research Notes

- `chrome.sidePanel` API supports one panel, right-side only
- `chrome.debugger` works from background without DevTools open (shows yellow infobar)
- MV3 service workers sleep after ~30s inactivity; `chrome.alarms` minimum interval is 1 minute (but can use shorter intervals with workarounds)
- Existing `setupDisconnectHandler` in sidecar client already handles reconnection
- `chrome.storage.session` survives worker restarts but not browser restarts; `.local` survives both
- All `chrome.devtools.*` APIs have viable non-panel alternatives (documented in prior analysis)
