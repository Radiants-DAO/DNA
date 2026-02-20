# Asset Mode Brainstorm

**Date:** 2026-02-20
**Status:** Decided

## What We're Building

A new top-level mode ("A" key) that lets users click any element to see a scrollable on-page popover listing all assets within it — images, SVGs, fonts, and CSS custom properties. Each asset has copy-to-clipboard and download actions. Works with multi-select: shift-clicking or marquee-selecting multiple elements produces a single merged, deduplicated asset list.

## Why This Approach

**Per-element extraction, not page-wide.** The existing `AssetsPanel` scans the entire page. Asset mode scans only the clicked element and its descendants, which is faster and more relevant — users want assets for the thing they're looking at.

**On-page popover, not panel tab.** Follows the design tool pattern (colorTool, spacingTool, etc.) — a floating shadow DOM panel anchored near the element. Users stay in context without switching to DevTools.

**Merged list for multi-select.** When multiple elements are selected, assets are combined into one deduplicated list. Simpler than grouped views and matches how multi-select works for design tools (one panel, all elements affected).

## Key Decisions

- **Scope: element + descendants only.** No inherited context from ancestors. If you click a card, you see the card's assets, not the page's global tokens.
- **All custom properties.** Not filtered to colors-only. Every `--*` property resolved on the element is shown (colors, spacing, radius, shadows, fonts).
- **Copy + Download for all asset types.** Images: copy src URL + download file. SVGs: copy markup + download .svg. Fonts: copy `@font-face` block + download font file (when URL available). Variables: copy `--name: value` + download as .css snippet.
- **Hotkey: "A"** on the bottom mode toolbar, new `TopLevelMode: 'assets'`.
- **Follows tool factory pattern.** `createAssetTool({ shadowRoot, engine, onUpdate })` returning `{ attach, detach, destroy }`.

## Asset Categories (Tabs in Popover)

| Tab | What's Extracted | Copy Action | Download Action |
|-----|-----------------|-------------|-----------------|
| Images | `<img>`, CSS `background-image` within element | Copy src URL | Download image file |
| SVGs | `<svg>` elements within element | Copy SVG markup | Download .svg file |
| Fonts | Font families used by element + descendants (via computed styles) | Copy `@font-face` rule | Download font file (if URL available) |
| Variables | All `--*` custom properties resolved on the element | Copy `--name: value` | Download .css snippet |

## Popover UI

- Header: element tag/id + asset count badge
- Tab bar: Images | SVGs | Fonts | Variables (with counts)
- Scrollable list (max-height ~300px)
- Each item: preview (thumbnail/swatch/icon) + name + actions (copy, download)
- Copy feedback: brief "Copied!" toast on the item
- Positioned via `computeToolPanelPosition` (avoids other selections)

## Multi-Select Behavior

- Assets from all selected elements are merged into one list
- Deduplicated by: images by src, SVGs by outerHTML hash, fonts by family name, variables by name
- Header shows "N elements selected" instead of single element tag

## Integration Points

- **New top-level mode** in `shared/src/types/modes.ts` (`'assets'`)
- **Toolbar button** in `content/ui/toolbar.ts` (`{ id: 'assets', shortcut: 'A' }`)
- **Hotkey** in `content/modes/modeHotkeys.ts`
- **Tool factory** at `content/modes/tools/assetTool.ts`
- **Wired in** `entrypoints/content.ts` (same pattern as colorTool et al)
- **Reuses** `customProperties.ts` for CSS variable extraction
- **New** per-element image/SVG/font scanner (content-side, no `eval()` needed)

## Open Questions

- Should the download action for fonts work when the font URL is cross-origin (CORS)? May need to open in new tab instead.
- Should variables show the computed value (resolved RGB) or the token reference chain (`var(--color-primary)` → `var(--blue-500)` → `#3b82f6`)?
- Should there be a "Copy All" bulk action per tab?

## Research Notes

- `panel/scanners/assetScanner.ts` — page-wide scanner, runs via `inspectedWindow.eval()`. We won't reuse this; the new scanner runs content-side per-element.
- `agent/customProperties.ts` — `extractCustomProperties(element)` already exists and does exactly what we need for the Variables tab. Walks stylesheets, reads computed values, classifies tiers.
- `content/modes/tools/colorTool.ts` — reference pattern for shadow DOM popover construction, scrollable list, positioning.
- `content/modes/tools/toolPanelPosition.ts` — shared positioning utility, already avoids other selection rects.
- `shared/src/messages.ts` — `ScannedImage`, `ScannedFont` types exist but are page-wide. Per-element extraction will use simpler types scoped to the element.
- No `ScannedSVG` type exists yet — SVGs are currently treated as images.
