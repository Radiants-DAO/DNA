# Panel Wiring — Phase Plan

> **Status: COMPLETE** — All phases implemented. Branch `feat/flow-wiring-tool-modes` merged to main.

**Date:** 2026-02-08
**Branch:** `feat/flow-wiring-tool-modes`

---

## Phase 1: Universal Component Detection

**Goal:** Detect and list project components from any webpage. Localhost provides richer data via sidecar.

### Approach: Tiered Scanner in Agent Script

The agent script runs in the MAIN world (has access to `window`, framework globals, fiber trees). This is where scanning must happen. The content script can't access React internals.

#### Tier 1 — Framework-specific (highest fidelity)

**React** (already mostly built):
- `fiberWalker.ts` already has `findFiberForElement()`, `getComponentName()`, `extractSource()`, `buildHierarchy()`
- Currently only inspects ONE element at a time (on Alt+click)
- **New:** Add `scanAllReactComponents()` — walk all fiber roots via `__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots()`, traverse the tree, collect every component fiber with its DOM node, name, and source location
- Dedup by component name, count instances (e.g. "Button (12 instances)")
- Source locations available via `_debugSource` (dev builds) or React 19 `captureOwnerStack`

**Vue:**
- Detect via `__VUE__` or `__VUE_DEVTOOLS_GLOBAL_HOOK__`
- Walk component tree via `el.__vue__` (Vue 2) or `el.__vueParentComponent` (Vue 3)
- Extract component name from `$options.name` or `type.name`

**Svelte:**
- Detect via `__svelte_meta` on elements
- Extract component name from the meta object

**Angular:**
- Detect via `ng` global or `getAllAngularRootElements()`
- `ng.getComponent(el)` returns the component instance

#### Tier 2 — Web Standards (always available)

- **Custom Elements:** `document.querySelectorAll('*')` filtered by `el.localName.includes('-')` + `customElements.get(el.localName)` — catches all registered Web Components
- **Shadow DOM hosts:** `el.shadowRoot !== null` — indicates encapsulated component
- **Semantic landmarks:** `header, nav, main, section, article, aside, footer, form, dialog` — structural components on any page

#### Tier 3 — Heuristic (convention-based)

- `[data-testid]`, `[data-component]`, `[data-cy]` — common testing/component attributes
- Class-name patterns: BEM root blocks (`block__element`), CSS module hashes
- Elements with many children + specific structure (card-like, list-like patterns)

### Message Flow

```
ComponentsPanel mounts
  → sendToContent({ type: "panel:scan-components" })
  → content.ts forwards to agent via window.postMessage("flow:content:scan-components")
  → agent/componentScanner.ts runs tiered scan:
      1. Detect framework (React/Vue/Svelte/Angular/none)
      2. Framework-specific tree walk
      3. Custom elements + shadow DOM
      4. Semantic landmarks
      5. Convention-based heuristics
  → agent posts "flow:agent:component-scan-result" back to content.ts
  → content.ts forwards to panel via port
  → ComponentsPanel receives, renders component tree
```

### Localhost Enrichment (Sidecar)

When sidecar is connected (`http://localhost:3737`):
- **Source file paths:** Sidecar has file system access, can resolve source maps to actual file:line:column
- **Component file list:** Sidecar can scan `/src/components/` (or similar) to show components that exist but aren't rendered on the current page
- **Props schema:** If `.schema.json` files exist (DNA pattern), sidecar can provide prop types
- **Import graph:** Which components import which — show dependency relationships

### Data Shape

```ts
interface ScannedComponent {
  name: string;                          // "Button", "NavBar", "header"
  framework: 'react' | 'vue' | 'svelte' | 'angular' | 'web-component' | 'html';
  instances: number;                     // how many times it appears on the page
  selector: string;                      // CSS selector for first instance
  source?: SourceLocation;               // file:line:col (dev builds or sidecar)
  props?: Record<string, unknown>;       // serialized props (React fiber)
  hierarchy?: string[];                  // parent component chain
  children?: string[];                   // child component names
}
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `agent/componentScanner.ts` | **NEW** — tiered scanner (React fiber walk, Vue, custom elements, landmarks) |
| `agent/index.ts` | Add handler for `flow:content:scan-components` |
| `content/panelRouter.ts` | Add `panel:scan-components` → forward to agent, relay response back |
| `shared/messages.ts` | Add message types |
| `ComponentsPanel.tsx` | Replace `panel:get-component-map` with `panel:scan-components`, update rendering for richer data |
| `componentsSlice.ts` | Evaluate: use or delete. Current `DisplayComponent` type is too simple for this. |

### Priority
Start with React (most common, infrastructure exists) + Custom Elements + Semantic Landmarks. Add Vue/Svelte/Angular as follow-ups.

---

## Phase 2: Universal Asset Scanner

**Goal:** Show all fonts, images, icons, SVGs, and media on any page. On localhost, show all project assets.

### Asset Categories

#### Fonts
- **API:** `document.fonts` (FontFaceSet) — iterates all loaded FontFace objects
- **Stylesheet scan:** Parse `@font-face` rules from all stylesheets for `font-family`, `src`, `font-weight`, `font-style`
- **Computed usage:** Sample visible elements, collect unique `font-family` values from computed styles
- **Data:** family name, weight variants, source URL, format (woff2/woff/ttf), usage count

#### Images
- **Already built:** `handleScanImages()` in `panelRouter.ts:283-307` scans all `<img>` elements
- **Extend with:**
  - `<picture>` / `<source>` elements (responsive images)
  - CSS `background-image` values from computed styles (sample visible elements)
  - `<canvas>` elements (flag as canvas, can't extract source)
  - `<video poster="...">` poster images
  - Favicon / OG images from `<link>` and `<meta>` tags
- **Data:** src URL, actual render size vs natural size, alt text, format, loading state

#### Icons
- **Inline SVGs:** `document.querySelectorAll('svg')` — extract `viewBox`, size, whether it's small enough to be an icon (< 64px)
- **Icon fonts:** Detect common patterns — FontAwesome (`fa-*` classes), Material Icons (`material-icons` class), custom icon fonts (elements with `::before`/`::after` content from icon font-family)
- **SVG sprites:** `<use href="#icon-name">` references — find the sprite `<svg>` with `<symbol>` definitions
- **Favicon + app icons:** `<link rel="icon">`, `<link rel="apple-touch-icon">`
- **Data:** name/id, SVG source or class name, size, type (inline/sprite/font/external)

#### Video/Media
- `<video>` elements with src, poster, dimensions, duration
- `<audio>` elements

### Message Flow

```
AssetsPanel mounts or user clicks "Scan"
  → sendToContent({ type: "panel:scan-assets" })
  → panelRouter.ts handles in content script (no agent needed — DOM access is sufficient):
      1. Fonts: document.fonts + @font-face rules
      2. Images: <img> + background-image + <picture> + favicons
      3. Icons: <svg> + icon fonts + sprites
      4. Video: <video> + <audio>
  → Returns comprehensive AssetScanResult
  → AssetsPanel receives, populates sub-tabs
```

### Localhost Enrichment (Sidecar)

When sidecar is connected:
- **Project asset directories:** Scan `public/`, `src/assets/`, `static/` for all available assets (not just ones on current page)
- **Unused asset detection:** Compare project assets vs page assets, flag unused ones
- **Font file details:** Read actual font files for full weight/style variant info
- **SVG source:** Provide raw SVG markup for icons (for copy-to-clipboard)

### Data Shape

```ts
interface AssetScanResult {
  fonts: FontAsset[];
  images: ImageAsset[];
  icons: IconAsset[];
  media: MediaAsset[];
}

interface FontAsset {
  family: string;
  weights: string[];            // ["400", "700"]
  styles: string[];             // ["normal", "italic"]
  source?: string;              // URL or local
  format?: string;              // woff2, woff, ttf
  usageCount: number;           // how many elements use this font
}

interface ImageAsset {
  src: string;
  alt: string;
  selector: string;
  renderSize: { width: number; height: number };
  naturalSize: { width: number; height: number };
  format: string;               // jpg, png, webp, avif, svg
  type: 'img' | 'background' | 'picture' | 'favicon' | 'og';
}

interface IconAsset {
  name: string;                 // id, class, or inferred name
  type: 'inline-svg' | 'sprite' | 'icon-font' | 'external-svg';
  svgSource?: string;           // raw SVG markup for inline/sprite
  selector: string;
  size: { width: number; height: number };
  className?: string;           // for icon fonts
}

interface MediaAsset {
  type: 'video' | 'audio';
  src: string;
  selector: string;
  poster?: string;
  dimensions?: { width: number; height: number };
}
```

### Sub-Tab Mapping

| Sub-Tab | Sources |
|---------|---------|
| **Fonts** | `document.fonts` + `@font-face` rules + computed `font-family` usage |
| **Images** | `<img>` + CSS backgrounds + `<picture>` + favicons + OG images |
| **Icons** | Inline SVGs + SVG sprites + icon fonts + app icons |
| **Media** | `<video>` + `<audio>` (optional, add if useful) |

### Files to Create/Modify

| File | Action |
|------|--------|
| `content/scanners/fontScanner.ts` | **NEW** — `document.fonts` + `@font-face` parsing |
| `content/scanners/imageScanner.ts` | **NEW** — extend existing `handleScanImages`, add background images, favicons |
| `content/scanners/iconScanner.ts` | **NEW** — SVG detection, icon font detection, sprite parsing |
| `content/panelRouter.ts` | Add `panel:scan-assets` handler that calls all scanners |
| `shared/messages.ts` | Add `AssetScanResult` types |
| `AssetsPanel.tsx` | Rewrite sub-tabs to render real scanned data, add Fonts tab |
| `assetsSlice.ts` | Evaluate: connect or simplify |

---

## Phase 3: Variables / Design Tokens (Critical Path)

**Goal:** Scan ALL CSS custom properties from the inspected page. This is the foundation — the color tool, spacing tool, typography tool, and future mode tools will all consume discovered variables.

### Why This Is Critical

The on-page tools already have variable consumption logic:
- `colorTool.ts` → `extractBrandColors()` from `colorTokens.ts` → shows color tokens in picker
- `spacingTool.ts` → would benefit from spacing token presets
- `typographyTool.ts` → would benefit from font token presets

But these all do their own ad-hoc scanning. The VariablesPanel should be the **single source of truth** — scan once, store in Zustand, and let all tools read from the store.

### Approach: Two-Layer Scan

#### Layer 1 — Page Scan (any page)

Runs in content script (or agent for framework-specific tokens):

1. **Stylesheet walk:** `collectAllCustomPropertyNames()` already exists in `colorTokens.ts:79` — handles `@layer`, `@property`, `CSSMediaRule`, `CSSSupportsRule`
2. **Computed values:** `getComputedStyle(document.documentElement).getPropertyValue(name)` for each discovered property
3. **Inline styles:** Check `document.documentElement.style` for runtime-set properties
4. **Tier classification:** Already built in `customProperties.ts:29-41` — classifies as `brand`, `semantic`, or `unknown`
5. **Category inference:** Parse property name prefix — `--color-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--font-*`, `--motion-*`, `--size-*`

#### Layer 2 — Dark/Light Mode Awareness

This is key for the theme toggle:
- Scan properties under `:root` (default mode)
- Scan properties under `@media (prefers-color-scheme: dark)` and `.dark` / `[data-theme="dark"]` selectors
- Identify which tokens change between modes (these are the theme-aware tokens)
- Store both light and dark values so the mode toggle can preview what changes

#### Layer 3 — Localhost Enrichment (Sidecar)

When sidecar is connected:
- **Token source files:** Read `tokens.css`, `dark.css` from the project
- **Full token manifest:** Parse all `@theme` blocks (Tailwind v4) to get the complete token set including `@theme inline` tokens that are compiled away at build time
- **Token metadata:** If `dna.config.json` exists, read token categories, descriptions, tier mappings

### Data Shape

```ts
interface TokenScanResult {
  tokens: ScannedToken[];
  framework?: string;           // "tailwind-v4", "css-modules", "vanilla", etc.
  colorScheme: 'light' | 'dark' | 'both';
}

interface ScannedToken {
  name: string;                 // "--color-page"
  value: string;                // "oklch(0.95 0.01 240)"
  resolvedValue: string;        // "#f0f0ff" (browser-resolved)
  darkValue?: string;           // value in dark mode, if different
  category: 'color' | 'spacing' | 'radius' | 'shadow' | 'font' | 'motion' | 'size' | 'other';
  tier: 'brand' | 'semantic' | 'unknown';
  usageCount?: number;          // how many elements reference this token
}
```

### Store Integration

```
panel:scan-tokens
  → content script scans all stylesheets + computed values
  → Returns TokenScanResult
  → VariablesPanel calls setTokensFromBridge() (already exists, zero callers today)
  → Store populated with real tokens
  → Color tool reads from store instead of doing its own scan
  → Spacing/typography tools read presets from store
  → Theme toggle reads light/dark token pairs from store
```

### Consumer Integration (downstream)

Once VariablesPanel populates the store, these tools should read from it:

| Consumer | Currently Does | Should Do |
|----------|---------------|-----------|
| `colorTool.ts` | Calls `extractBrandColors()` on every activation | Read `tokens.filter(t => t.category === 'color')` from store |
| `spacingTool.ts` | Hardcoded spacing presets | Read `tokens.filter(t => t.category === 'spacing')` from store |
| `typographyTool.ts` | Hardcoded font options | Read `tokens.filter(t => t.category === 'font')` from store |
| Theme toggle (SettingsBar) | Sends `panel:set-theme` to content script | Also preview token value changes in panel |

### Files to Create/Modify

| File | Action |
|------|--------|
| `content/scanners/tokenScanner.ts` | **NEW** — consolidate `collectAllCustomPropertyNames()` + computed value resolution + dark mode scanning |
| `content/panelRouter.ts` | Add `panel:scan-tokens` handler |
| `shared/messages.ts` | Add `TokenScanResult` types |
| `VariablesPanel.tsx` | Remove mock data, send `panel:scan-tokens` on mount, read from store |
| `tokensSlice.ts` | Adapt `setTokensFromBridge()` for new `ScannedToken[]` shape |
| `colorTokens.ts` | Refactor to read from store instead of scanning directly (follow-up) |

---

## Phase 4: Suggested Tab — Accessibility

**Rationale:** You already have 80% of the infrastructure built but it's buried in a context panel (`AccessibilityPanel.tsx`) that isn't in the main tab bar.

### What Already Exists

| Component | Status |
|-----------|--------|
| `AccessibilityPanel.tsx` | Full component — ARIA info, contrast checker, violations, suggested fixes |
| `panelRouter.ts:handleAccessibility()` | Content-side handler — computes ARIA roles, contrast ratios, violations |
| `features/accessibility.ts` | Contrast ratio calculation, WCAG AA/AAA checking |
| `panel:accessibility` message | Defined and handled |
| `isAccessibilityResponse` type guard | Defined in shared messages |

### What's Missing

It's a **per-element** tool (requires a selected element). To make it a full tab, extend to:

1. **Page-wide audit:** Scan all visible elements for common violations (missing alt text, low contrast, missing labels, no focus indicators) — similar to Lighthouse accessibility but live and interactive
2. **Violation summary:** Group violations by type, show counts, click to highlight the offending element
3. **Color contrast map:** Visual overview of all text/background contrast ratios on the page
4. **ARIA tree view:** Show the accessibility tree structure (landmark roles, heading hierarchy)
5. **Interactive testing:** Tab order visualization, focus trap detection

### Why This Tab

- Infrastructure is 80% built — lowest effort for a new full tab
- Highly valuable for designers (contrast, color accessibility)
- Complements the designer tab (you inspect styles, then check accessibility)
- Natural consumer of the Variables/tokens data (token colors → contrast checking)
- Differentiated — most design tools don't have live accessibility auditing

### Alternative Candidates Considered

| Tab | Pros | Cons |
|-----|------|------|
| **Layers (DOM tree)** | Familiar from Figma/design tools | Duplicates Chrome DevTools Elements panel |
| **Responsive/Breakpoints** | Useful for responsive design | Chrome already has device toolbar |
| **Performance** | Useful | Duplicates Lighthouse/Performance panel |
| **Accessibility** | Already 80% built, unique value, complements designer | Needs page-wide audit extension |

---

## Implementation Order

```
Phase 3 (Variables)  ←← START HERE — foundation for tool integration
  ↓
Phase 1 (Components) — highest user-facing value
  ↓
Phase 2 (Assets)     — comprehensive but less critical
  ↓
Phase 4 (Accessibility tab) — polish, leverages variables data
```

**Rationale for starting with Variables:** It's the critical path. The color tool, spacing tool, and typography tool all need token data. Once the store is populated, downstream integration is straightforward. Components and Assets are independent and can be parallelized after Variables is solid.
