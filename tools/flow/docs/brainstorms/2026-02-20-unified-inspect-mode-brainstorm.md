# Unified Inspect Mode Brainstorm

**Date:** 2026-02-20
**Status:** Decided

## What We're Building

A single **Inspect mode** (`I` hotkey) that replaces the current dead `inspector` mode and absorbs `asset` mode. Two interaction layers: a VisBug-style **hover tooltip** showing key computed styles, dimensions, and accessibility summary; and a **click panel** with three top-level tabs (Assets, Styles, A11y) for deep inspection. Auto-measurement lines appear between the selected element and hovered elements, with Shift+click to pin multi-element measurements.

## Why This Approach

Both inspector and asset modes are read-only "tell me about this element" tools — splitting them across two modes creates dead UI and forces unnecessary mode switches. Merging them into a single mode with hover (quick glance) + click (deep dive) gives the inspector an on-page UI it currently lacks, preserves all asset functionality, and adds accessibility + measurement features that were previously panel-only or disconnected.

## Key Decisions

- **Mode:** `'inspect'` replaces both `'inspector'` and `'asset'`. Hotkey `I`. Remove both old modes from the union.
- **Hover tooltip:** VisBug metatip-style — tag + dimensions + ~8 key computed styles with color swatches + contrast ratio badge + ARIA role. Follows cursor, quadrant-aware positioning.
- **Click panel tabs:** Assets (first) | Styles | A11y — Assets tab is default so asset browsing stays quick. Sub-tabs within Assets: Images, SVGs, Fonts, Colors, Variables (hidden when empty, same as current).
- **Ruler:** Auto on hover — when an element is selected and you hover another, pink distance lines appear between them. Shift+click pins measurement pairs.
- **Tooltip → panel transition:** Hover shows tooltip; click opens the full panel and dismisses the tooltip.

## Hover Tooltip Spec

```
div.hero  480×320
─────────────────────────
display:        flex
background:  ● #fef8e2
color:       ● #0f0e0c
font-size:      16px
padding:        24px
border-radius:  12px
─────────────────────────
AA ✓ 4.8:1  ·  role=banner
```

**Properties shown:** display, background-color, color, font-size, padding (shorthand), border-radius. Color values get inline swatches. Only non-default/non-inherited values shown.

**Positioning:** Quadrant-aware — tooltip flips to stay in viewport. Positioned near the element, not at cursor.

## Click Panel Spec

Three top-level tabs with counts:

### Assets (default tab)
Sub-tabs (hidden when empty): Images | SVGs | Fonts | Colors | Variables
- Identical to current assetTool behavior — copy, download, rich previews
- Multi-select merge via shift-click

### Styles
Grouped computed CSS from `inspectElement()`:
- Layout (display, flex/grid props, gap)
- Spacing (margin, padding)
- Size (width, height, overflow)
- Typography (font-family, size, weight, line-height, letter-spacing)
- Colors (color, background, border-color)
- Borders (border-width, border-style, border-radius)
- Shadows (box-shadow, text-shadow)
- Effects (opacity, filter, backdrop-filter, mix-blend-mode)
- Animations (active animations with keyframes)

Each property: name on left, value on right, color swatches inline. Click to copy.

### A11y
- Contrast: fg/bg swatches, ratio, AA/AAA badges
- ARIA: role, aria-label, tabindex, all aria-* attributes
- Issues: violations from accessibility scanner with severity

## Ruler Spec

- **Auto-measure:** Selected element + hovered element → pink distance lines with px labels
- **Shift+click:** Pin a measurement pair (persists until cleared)
- **Implementation:** Reuse existing `computeMeasurements()` + `createDistanceOverlay()` + `createMeasurementLine()`. Enhance with VisBug's 10-case overlap handling.
- **Gridlines:** Show element bounding box gridlines on hover (reuse `gridlinesOverlay.ts`)

## Modes to Remove

- `'inspector'` — replaced by `'inspect'`
- `'asset'` — absorbed into `'inspect'`
- `'accessibility'` design sub-mode (key 7) — absorbed into Inspect A11y tab

## Existing Code to Reuse

| Piece | Source | Status |
|-------|--------|--------|
| Asset scanner | `content/modes/tools/assetScanner.ts` | Keep as-is |
| Asset tool UI | `content/modes/tools/assetTool.ts` + CSS | Refactor into panel tab |
| Style extraction | `content/inspector.ts` → `extractGroupedStyles` | Already works |
| Fiber/component data | `content/inspector.ts` → `requestFiberData` | Already works |
| WCAG contrast | `content/features/accessibility.ts` | Already works |
| ARIA extraction | Panel sends `panel:accessibility` message | Needs content-side equivalent |
| Distance measurement | `content/measurements/measurements.ts` | Needs VisBug overlap cases |
| Distance overlay | `content/measurements/distanceOverlay.ts` | Keep as-is |
| Gridlines overlay | `content/guides/gridlinesOverlay.ts` | Keep as-is |

## Open Questions

- Should the hover tooltip show React component name when fiber data is available? (adds ~500ms latency from agent roundtrip)
- Should ruler measurements persist across element selections or clear on new click?
