# Panel Data Pipeline Audit

**Date:** 2026-02-08
**Branch:** `feat/flow-wiring-tool-modes`
**Status:** All 4 tab panels audited by parallel agents

---

## Executive Summary

The tab UI shell (LeftTabBar, EditorLayout routing, panel components) is fully wired and renders correctly. However, **3 of 4 panels display only mock/hardcoded data** and never load real data from the inspected page. The Designer tab is the only one with a functional end-to-end pipeline.

| Panel | Data Source | Status |
|-------|-----------|--------|
| **Designer** | Real inspection data via `useInspection()` context | Working end-to-end |
| **Components** | Content bridge `panel:get-component-map` | Pipeline is wired but returns empty on non-DNA pages (scans for `[data-radflow-id]` only) |
| **Variables** | Hardcoded mock tokens in component | Completely disconnected — store, message types, and scanner all missing |
| **Assets** | Hardcoded mock data in 3 sub-components | Completely disconnected — store exists but panel ignores it; `panel:scan-images` handler exists but panel never calls it |

---

## 1. Designer Tab — WORKING

**Files:** `RightPanel.tsx:210-332`, `Panel.tsx:50-56`, `inspector.ts`, `panelRouter.ts`, `styleExtractor.ts`

### Data Flow (end-to-end, verified working)

```
User Alt+clicks element on page
  → content.ts onClick handler fires (content.ts:422-521)
  → deepElementFromPoint() pierces shadow DOM (content.ts:320-337)
  → Phase 1: Sends `element:selected` immediately via port (quick metadata)
  → Panel.tsx receives, sets selectedElement, clears inspectionResult (line 203-205)
  → Phase 2: content.ts calls inspectElement(el) async (inspector.ts:66-88)
    → Promise.all runs 4 extractors in parallel:
      1. requestFiberData(element) — agent script, 500ms timeout
      2. extractGroupedStyles(element) — getComputedStyle, 9 categories
      3. inferLayoutStructure(element) — grid/flex/block detection
      4. captureAnimations(element) — CSS animations, transitions, GSAP
  → Sends `flow:content:inspection-result` with full InspectionResult
  → Background broadcastToTab() relays to all panel ports (background.ts:259)
  → Panel.tsx receives (line 210), sets inspectionResult state
  → DesignerContent reads via useInspection() context
  → sectionStyles memo maps 9 sections via SECTION_TO_STYLE_CATEGORY
  → styleEntriesToRecord() converts kebab-case to camelCase
  → Each section component renders with real initialStyles
```

### Write Path (mutations)
```
User changes style value in section component
  → onStyleChange(property, StyleValue) fires
  → handleStyleChange converts via styleValueToCss()
  → applyStyle({ property: cssValue }) from useInspection context
  → useMutationBridge sends via SEPARATE mutation port (FLOW_MUTATION_PORT_NAME)
  → Content script mutationEngine applies the change
  → MutationDiff sent back, stored in Zustand mutationDiffs
```

### Notes
- Two-phase arrival: `element:selected` (instant) then `flow:content:inspection-result` (async) — UI shows "Loading styles..." briefly between them
- Inspection state lives in React `useState` (not Zustand) and flows via `InspectionContext`
- Agent fiber request adds 500ms latency on non-React pages (times out)
- No auto-re-inspection after mutations — user must re-click to see updated computed styles

---

## 2. Components Tab — WIRED BUT EMPTY ON MOST PAGES

**Files:** `ComponentsPanel.tsx:246-355`, `panelRouter.ts:378-400`, `contentBridge.ts`, `background.ts:207-276`

### Data Flow (fully wired)

```
ComponentsPanel mounts
  → useEffect calls scanComponents() on mount (line 265-267)
  → sendToContent({ type: "panel:get-component-map" }) (line 271-273)
  → contentBridge.ts forwards via port (line 57-63)
  → background.ts routes panel→content (line 231-233)
  → panelRouter.ts handles "panel:get-component-map" (line 652)
  → handleGetComponentMap() scans DOM for [data-radflow-id] elements (line 378-400)
  → Returns ComponentMapResponse via port.postMessage (line 684-686)
  → background.ts broadcasts content→panel (line 259)
  → Panel receives via onContentMessage (ComponentsPanel.tsx:253-259)
  → isComponentMapResponse type guard validates response (lines 227-244)
  → Updates components state, renders list
```

### Verdict: Pipeline Is Complete But Data-Dependent

The components auditor confirmed: **the message routing is fully wired and correct.** Background script forwards `panel:get-component-map` from panel→content and broadcasts `component-map:result` from content→panel. No routing bug.

**The real issue:** `handleGetComponentMap()` at `panelRouter.ts:380` does `querySelectorAll('[data-radflow-id]')`. Most pages have zero elements with this attribute, so the scan always returns an empty array. The panel shows "No components found" correctly — it's just that there's nothing to find.

### Dead Code: componentsSlice
The `componentsSlice.ts` store has a richer `ComponentInfo` model (with `file`, `line`, `column`, `props`) and `setComponentsFromBridge()` — but **ComponentsPanel never imports or uses it**. The panel uses only local `useState` with the simpler `DisplayComponent` type.

### Fix Required
1. **Expand scanner** — scan for meaningful DOM elements beyond `[data-radflow-id]`: semantic landmarks (`<nav>`, `<header>`, `<main>`), elements with `data-component`, `data-testid`, React fiber component names, or custom element tags
2. **Add loading timeout** — currently spins forever if no response arrives
3. **Consider using componentsSlice** — or delete it if the simpler local state approach is preferred
4. The docstring claiming "Uses fiber walker data" (line 9) is **misleading** — no fiber walker exists, it's just a `querySelectorAll`

---

## 3. Variables Tab — COMPLETELY DISCONNECTED

**Files:** `VariablesPanel.tsx:231-285`, `tokensSlice.ts`, `agent/customProperties.ts`, `content/modes/tools/colorTokens.ts`

### Current State

```
VariablesPanel reads useAppStore(s => s.tokens) (line 232)
  → tokens is ALWAYS null (never populated by anything)
  → useMemo at line 247 uses [tokens] as dependency but IGNORES IT
  → Falls through to hardcoded mockTokens object (lines 252-265)
  → Renders static list of 12 fake tokens
```

### What Exists (all disconnected)

| Layer | File | Status |
|-------|------|--------|
| **Store slice** | `tokensSlice.ts` | Complete — `ThemeTokens` type, `setTokensFromBridge()` (line 219), token map builder, category resolver |
| **Store setter** | `tokensSlice.ts:219-226` | `setTokensFromBridge()` has **ZERO callers** anywhere in the codebase |
| **Store loaders** | `tokensSlice.ts:116-135` | `loadTokens()` / `loadThemeTokens()` are stubs — immediately set error messages (were Tauri methods, never ported) |
| **Message type** | `messages.ts` | **MISSING** — no `panel:scan-tokens` or equivalent exists |
| **Content handler** | `panelRouter.ts`, `content.ts` | **MISSING** — no handler for token scanning |
| **Per-element extraction** | `agent/customProperties.ts:50` | EXISTS — `extractCustomProperties(element)` walks stylesheets for `--*` properties, but only wired to per-element inspection |
| **Page-wide collection** | `content/modes/tools/colorTokens.ts:79` | EXISTS — `collectAllCustomPropertyNames()` scans all stylesheets including `@property` rules, but only wired to the on-page color tool UI |

### Fix Required (4 steps)
1. **Content-side scanner:** Add `panel:scan-tokens` handler in `panelRouter.ts` — reuse `collectAllCustomPropertyNames()` from `colorTokens.ts` or `extractCustomProperties(document.documentElement)` from the agent
2. **Message types:** Add `panel:scan-tokens` to `PanelToBackgroundMessage` union and add a `tokens:result` response type in `messages.ts`
3. **Panel-side trigger:** In VariablesPanel, send `sendToContent({ type: "panel:scan-tokens" })` on mount, listen via `onContentMessage()` for response, call `setTokensFromBridge()` to populate store
4. **Remove mock data:** Delete the `mockTokens` object (lines 252-265) and make `useMemo` actually read from `tokens` store value

---

## 4. Assets Tab — COMPLETELY DISCONNECTED

**Files:** `AssetsPanel.tsx:219-326`, `assetsSlice.ts`, `panelRouter.ts:283-307`

### Current State

```
AssetsPanel renders
  → IconsContent: hardcoded mockIcons (10 entries, lines 219-230)
  → LogosContent: hardcoded mockLogos (2 entries, lines 270-273)
  → ImagesContent: hardcoded mockImages (2 entries, lines 323-326)
  → useAppStore imported (line 2) but NEVER USED — dead import
  → No content bridge messages sent
  → No real asset content rendered (all show generic SVG placeholder icons)
```

### What Exists (all disconnected)

| Layer | File | Status |
|-------|------|--------|
| **Store slice** | `assetsSlice.ts` | Complete — `AssetLibrary` type, `getMergedIcons()`, `getMergedLogos()`, `getMergedImages()` getters, `setThemeAssetsFromBridge()` / `setProjectAssetsFromBridge()` setters |
| **Store integration** | `appStore.ts:47` | Wired into combined store |
| **Image scanner** | `panelRouter.ts:283-307` | EXISTS and WORKS — `handleScanImages()` queries all `<img>` elements, returns src/alt/dimensions |
| **Image scan message** | `panelRouter.ts:635` | `panel:scan-images` HANDLED — routes to `handleScanImages()` |
| **Image scan types** | `messages.ts:168-171, 377-382` | DEFINED — `panel:scan-images` request, `images:list` response, `isImagesResponse` type guard (line 432) |
| **Working reference** | `ImageSwapPanel.tsx:328-331` | EXISTS — correctly sends `panel:scan-images`, listens for `images:list`, renders real images |
| **Icon/logo scanner** | N/A | **MISSING** — no SVG or logo scanning logic exists anywhere |

### Fix Required
1. **Images sub-tab (low effort):** Follow the `ImageSwapPanel.tsx` pattern — send `panel:scan-images` on mount, listen for `images:list` response, render real `<img>` thumbnails with src/alt/dimensions
2. **Icons sub-tab (medium effort):** Add content-side scanner for inline `<svg>` elements and icon font glyphs
3. **Logos sub-tab (medium effort):** Heuristic scanner — `<img>` in header/nav, elements with "logo" in class/alt/aria-label
4. **Store integration:** Call `setProjectAssetsFromBridge()` when scan results arrive, then read from store getters — or simplify to local state if the store is overkill
5. **Remove mock data and dead import**

---

## Architecture Reference

### Message Flow
```
Panel (DevTools)                    Background                   Content Script
     │                                  │                              │
     │──sendToContent(msg)──────────────│──contentPorts.get(tabId)────│
     │                                  │     .postMessage(msg)        │
     │                                  │                              │
     │                                  │                    panelRouter.ts
     │                                  │                    routeMessage(msg)
     │                                  │                              │
     │──onContentMessage(callback)──────│──broadcastToTab(tabId,msg)──│
     │                                  │                              │
```

Single-port architecture (Panel.tsx:124-130): both directions travel on `flow-content` port through background. Mutation traffic uses a separate `flow-mutation` port.

### Existing Infrastructure That Can Be Reused

| Infrastructure | Location | Can Power |
|---------------|----------|-----------|
| `inspectElement()` | `inspector.ts:66-88` | Designer (already using) |
| `extractGroupedStyles()` | `styleExtractor.ts` | Designer (already using) |
| `handleScanImages()` | `panelRouter.ts:283-307` | Assets/Images tab (just needs to be called) |
| `handleGetComponentMap()` | `panelRouter.ts:378-400` | Components tab (works, needs broader scanner) |
| `collectAllCustomPropertyNames()` | `colorTokens.ts:79` | Variables tab (page-wide CSS custom property scan) |
| `extractCustomProperties()` | `agent/customProperties.ts:50` | Variables tab (per-element extraction) |
| `setTokensFromBridge()` | `tokensSlice.ts:219` | Variables tab (store setter, zero callers) |
| `setProjectAssetsFromBridge()` | `assetsSlice.ts:126` | Assets tab (store setter, zero callers) |
| `getMergedIcons/Logos/Images()` | `assetsSlice.ts:137-175` | Assets tab (store getters, unused) |
| `ImageSwapPanel.tsx:328-331` | `context/ImageSwapPanel.tsx` | Assets/Images tab (working reference pattern) |
| `elementRegistry` | `elementRegistry.ts` | All panels (element tracking) |

### Dead Code Identified

| Code | Location | Notes |
|------|----------|-------|
| `componentsSlice.ts` | `stores/slices/` | Rich ComponentInfo model, never used by ComponentsPanel (uses local useState instead) |
| `useAppStore` import | `AssetsPanel.tsx:2` | Imported but never called |
| `tokens` dependency | `VariablesPanel.tsx:285` | In useMemo deps array but value is never read in the memo body |
| `loadTokens()` / `loadThemeTokens()` | `tokensSlice.ts:116-135` | Tauri stubs, immediately return error strings |

### Priority Order for Wiring

1. **Assets/Images** — Lowest effort. Scanner exists (`handleScanImages`), message types defined, working reference in `ImageSwapPanel.tsx`. Just wire AssetsPanel to call it.
2. **Components** — Low effort for fix, medium for usefulness. Pipeline works but scanner needs to find more than `[data-radflow-id]` elements.
3. **Variables** — Medium effort. Store setter exists, reusable scanner in `colorTokens.ts`, but needs new message type and panel-side wiring.
4. **Assets/Icons+Logos** — Higher effort. Need new content-side DOM scanners.
