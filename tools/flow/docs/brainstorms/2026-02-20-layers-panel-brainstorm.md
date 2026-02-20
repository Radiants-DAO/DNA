# Layers Panel Brainstorm

**Date:** 2026-02-20
**Status:** Decided
**Depends on:** [Side Panel](2026-02-20-side-panel-brainstorm.md), [Move Mode](../plans/2026-02-20-move-mode.md)
**Reference:** Webflow Navigator panel

## What We're Building

A Webflow Navigator-style DOM tree panel as the default tab in the Chrome Side Panel. Shows the page's element hierarchy with type-specific icons and smart labels, bidirectionally synced with canvas selection. Supports reordering via arrow keys and drag-and-drop (shared `reorderEngine` with Move mode), visibility/pointer-events toggles, and filterable view modes for managing deep DOMs.

## Why This Approach

The layers tree is the structural backbone of any visual editor. Figma, Webflow, and Framer all center their workflow on it. For Flow, it gives users a way to navigate complex DOMs without hunting through nested elements on the canvas, and it doubles as the organizational view for context gathering (V-mode cmd-click on a layer row → chip in Prompt Builder).

## Key Decisions

### Node Labeling (priority order)

1. **React/Vue/Svelte component name** — green text, from fiber walker. "NavBar", "ProductCard"
2. **Rich element label** — tag-specific:
   - `<img>` → filename from src ("hero.png", "logo.svg")
   - `<h1>`–`<h6>`, `<p>`, `<span>`, `<a>`, `<button>`, `<label>` → truncated text content ("Welcome to the...", "Submit")
   - `<svg>` → "vector" or aria-label if present
   - `<input>` → type + name/placeholder ("text: email", "checkbox: terms")
3. **ID** — if present ("page-wrapper", "main-content")
4. **Meaningful class** — skip Tailwind utilities (`flex`, `p-4`, `mt-2`), CSS module hashes (`sc-bqyKva`, `_1f3ab`), and single-letter classes. Use first semantic class ("section-home", "card-grid")
5. **Tag name** — fallback ("div", "section", "aside")

### Node Icons (by HTML element type)

| Element | Icon |
|---|---|
| `<div>`, `<span>`, generic containers | Box (square outline) |
| `<img>` | Image icon |
| `<svg>` | Vector/pen icon |
| `<h1>`–`<h6>` | "H1", "H2" etc. text badge |
| `<p>` | "P" text badge or paragraph icon |
| `<a>` | Link icon |
| `<button>`, `<input>`, `<select>`, `<textarea>` | Form/interactive icon |
| `<ul>`, `<ol>`, `<li>` | List icon |
| `<nav>`, `<header>`, `<footer>`, `<main>`, `<section>`, `<article>`, `<aside>` | Landmark-specific icon or semantic badge |
| React/Vue/Svelte component | Green component icon (hexagon or similar) |

### Tree Behavior

**Default state:** Body's direct children shown, all collapsed. Selecting an element on the canvas auto-expands the tree path down to that element and scrolls it into view.

**Bidirectional selection sync:**
- Click a row in the tree → selects element on canvas (calls `addPersistentSelection`, posts `element:selected`, triggers inspection)
- Click an element on canvas → tree expands to that node, highlights the row, scrolls into view
- Multi-select: Shift+click in tree adds to selection (same as Shift+click on canvas)

**Expand/collapse:**
- Chevron on rows with children
- Click chevron or row to toggle
- Selecting a canvas element auto-expands ancestors but does not collapse anything else

### Filterable View Modes

Toggle in the header (the diamond/filter icon from Webflow screenshots):

- **All elements** (default) — every DOM node gets a row
- **Semantic only** — hides pure wrapper divs (no class, no ID, single child, no component name). Shows elements that have identity: components, IDs, meaningful classes, semantic HTML tags, rich elements (img, svg, headings, text)

### Reordering

Shares `reorderEngine` with Move mode — same primitives, same undo stack.

**Arrow keys (when a layer row is focused):**
- Up/Down arrow → `moveUp()` / `moveDown()` (swap with sibling)
- Left/Right arrow → `promote()` / `demote()` (reparent)
- Shift+Up/Down → `moveToFirst()` / `moveToLast()`
- All operations go through `recordCustomMutation` → appear in Clipboard tab as design changes

**Drag-and-drop:** Deferred until Move mode implementation is complete. Will reuse the same `captureSnapshot`/`restoreSnapshot`/`moveTo()` machinery. Drop indicator line between rows for sibling reorder, drop onto a row for reparenting.

### Row Actions (on hover)

**Visibility toggle (eye icon):**
- Toggles `display: none` on the element via mutation engine
- Undoable (appears in undo stack and Clipboard)
- Dimmed row appearance when hidden
- Already-hidden elements (detected via `getComputedStyle`) show the eye as struck-through on initial load

**Pointer-events toggle (cursor/lock icon):**
- Toggles `pointer-events: none` on the element via mutation engine
- Solves the real problem: some elements with `pointer-events: none` can't be selected on canvas — this toggle re-enables them
- Also useful for "locking" elements you don't want to accidentally click
- Undoable, appears in Clipboard

### Live DOM Sync

`MutationObserver` watching `childList` + `subtree` on `document.body`, debounced at 200-300ms.

- On structural change: rebuild the affected subtree (not the entire tree)
- Preserve expand/collapse state across rebuilds (keyed by selector or element WeakRef)
- Preserve selection state across rebuilds
- SPA navigation (detected via `webNavigation.onCommitted` in background) triggers full tree rebuild

### Filter/Search Bar

Built into the panel header (not a separate tab). Text input that filters the tree:
- Matches against: label text, tag name, ID, class names, component name
- Non-matching rows are hidden; matching rows + their ancestor chain remain visible (ancestors shown dimmed)
- Escape clears the filter

### Data Flow

```
Content Script                          Side Panel
─────────────                          ──────────
MutationObserver fires
  → buildDomTree(body, expandedSet)
  → debounce 200ms
  → port.postMessage({ type: 'dom-tree:snapshot', tree })
                                        ← receives tree snapshot
                                        ← renders React tree component

User clicks row in tree
                                        → port.postMessage({ type: 'layers:select', selector })
  ← content selects element
  ← addPersistentSelection(el)
  ← inspectElement(el)
  → port.postMessage({ type: 'element:selected', ... })
```

Tree serialization happens in the content script (has DOM access). Side Panel receives a serialized `DomLayerNode[]` and renders it. All DOM mutations (reorder, visibility, pointer-events) are sent as commands from Side Panel → background → content script.

## Open Questions

- Meaningful class heuristic — need to define what counts as "utility" vs "semantic" class. Probably: skip classes shorter than 3 chars, skip classes matching common utility patterns (`/^(flex|grid|p-|m-|w-|h-|text-|bg-|border-|rounded-|gap-|space-|items-|justify-)/`), skip classes with hash patterns (`/[a-z]{2,}_[a-zA-Z0-9]{4,}/` for CSS modules)
- Virtual scrolling — needed for DOMs with 1000+ visible rows? Side Panel has limited height. May need virtualization (react-window or similar) for performance. Can defer and add if scroll performance is poor.
- Shadow DOM traversal — should the tree descend into shadow roots? Web components use shadow DOM heavily. Content script can access open shadow roots via `el.shadowRoot`. Closed shadow roots are inaccessible. Probably show open shadow roots with a visual boundary indicator.

## Research Notes

- `reorderEngine.ts` exports `moveUp/Down/ToFirst/ToLast/promote/demote/moveTo` + `captureSnapshot/restoreSnapshot` — all directly usable from layers panel
- `elementRegistry.ts` has `generateSelector(el)` for stable selectors and `WeakRef`-based element tracking
- `fiberWalker.ts` has `buildHierarchy()` for React component name extraction — use for green component labels
- `search.ts` has `TreeWalker` pattern and `getDirectTextContent(el)` — reuse for text node labels
- `content.ts` has `addPersistentSelection`/`clearPersistentSelections` — the selection system layers panel plugs into
- `content.ts` has `findLCA(a, b)` — useful for tree scoping
- `treeHelpers.ts`/`treeLayout.ts` have expand/collapse algorithms for a file tree — algorithmic reference
- No existing DOM tree serialization function — `buildDomTree()` is the first new piece needed
- `Layers` icon already exists in `icons.tsx`
- Chrome Side Panel has its own document context — React tree component renders there, not in the page
