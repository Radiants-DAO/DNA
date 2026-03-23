# Type Playground Brainstorm

**Date:** 2026-03-22
**Status:** Decided

## What We're Building

Replacing the static Typography tab in Brand Assets with an interactive "type playground" — a single-pane experience that merges Pangram Pangram-style live type testing with DNA's brand manual reference data. One font at a time, one square preview canvas, contextual sidebar controls.

## Why This Approach

The current Typography tab is a passive reference (font cards, tables, glyph grids). A playground lets users *feel* the type system — adjust size/leading/spacing in real time, see fonts in realistic layout contexts (social posts, documents), and explore glyphs interactively. Folding the brand manual into the playground eliminates the split between "reference" and "play" — every reference section becomes a live context.

## Key Decisions

- **Single switchable preview** — one fixed-square (1:1) preview area on the right. Context switcher selects what's shown (Sampler, Social Post, Document, Type Scale, Glyphs).
- **One font at a time** — font picker in the top bar (Joystix / Mondwest / PixelCode). Preview and controls adapt to the selected font's available weights.
- **Top bar + sidebar nav layout** — font picker and context switcher live in a horizontal bar above the preview. Sliders and reference sections live in the sidebar nav area (below existing tab triggers).
- **Collapsible contextual sidebar groups** — sidebar sections change based on active context. "Playground" section (sliders, pickers) is always relevant; reference sections (Type Scale, Element Styles, CSS Reference) appear contextually.
- **Controls: PP core + DNA extras** — Size, Leading (line-height), Spacing (letter-spacing) sliders, Weight picker, Alignment (L/C/R), font-size token picker (text-xs → text-3xl), color mode toggle (light/dark preview).
- **Each context has its own defaults** — switching context resets sliders to sensible defaults for that layout. Font choice persists.
- **Always editable** — all text in every context is contenteditable. Users can type custom text anywhere.
- **Fold brand manual into playground** — Type Scale table, Element Styles table, Glyph Specimens, and CSS Reference become preview contexts and sidebar reference sections rather than separate scrollable sections.

## Preview Contexts

| Context | What it shows | Sidebar sections |
|---------|--------------|-----------------|
| **Sampler** | Free-text editable area (like PP's hero). Large display text, user types anything. | Playground controls |
| **Social Post** | Tweet/card mockup within the square. Headline + body in the selected font. | Playground controls |
| **Document** | Page layout — heading, paragraphs, code block, caption. Shows the font in a realistic reading context. | Playground controls |
| **Type Scale** | Live 7-step scale (text-xs → text-3xl) rendered in the selected font. Interactive — sliders still work. | Playground + Scale reference |
| **Glyphs** | Glyph grid (uppercase, lowercase, digits, symbols) + detail viewer with metrics (ascender, cap height, x-height, baseline, descender). | Glyph info, weight picker |

## Layout Anatomy

```
┌─────────┬──────────────────────────────────┐
│ SIDEBAR │ [Joystix ▾]  [Sampler ▾]  ☀/🌙  │  ← top bar
│ NAV     ├──────────────────────────────────┤
│         │                                  │
│ 01 Logo │     ┌────────────────────┐       │
│ 02 Color│     │                    │       │
│ 03 Type*│     │   Fixed square     │       │
│ 04 UI   │     │   preview canvas   │       │
│ 05 Pix  │     │                    │       │
│ 06 AI   │     └────────────────────┘       │
│         │                                  │
│─────────│  Explainer text / context info    │
│PLAYGROUND│                                  │
│ Size    │                                  │
│ Leading │                                  │
│ Spacing │                                  │
│ Weight  │                                  │
│ Align   │                                  │
│─────────│                                  │
│TYPE SCLE▼│                                  │
│ELEM STY ▼│                                  │
│CSS REF  ▼│                                  │
└─────────┴──────────────────────────────────┘
```

## Open Questions

- **Glyph detail viewer:** Should hovering a glyph in the grid show metrics in the sidebar (like PP's sticky right panel), or in a popover/tooltip on the preview canvas itself?
- **Export/copy:** Should there be a "copy CSS" or "copy settings" action that exports the current slider values as CSS custom properties or Tailwind classes?
- **Responsive behavior:** How does this degrade when the Brand Assets window is narrow? Collapse sidebar? Stack vertically?

## Worktree Context

- Path: `.worktrees/type-playground`
- Branch: `feat/type-playground`

## Research Notes

- Current implementation: `apps/rad-os/components/apps/BrandAssetsApp.tsx` — all typography sub-components inline (`FontCard`, `TypeScaleSection`, `ElementStylesSection`, `TypeSpecimen`)
- Data arrays: `FONTS` (3 entries), `TYPE_SCALE` (7 steps), `ELEMENT_STYLES` (9 element mappings)
- Existing control surface pattern: `Tabs.useTabsState` with `Collapsible.Root` for sidebar sections
- CSS tokens: `packages/radiants/tokens.css` (font-size scale), `packages/radiants/typography.css` (element styles)
- Pangram Pangram reference: Alpine.js reactive sliders, container query width units for responsive sizing, contenteditable text, opentype.js for glyph rendering
- DNA fonts: Joystix (1 weight), Mondwest (2 weights), PixelCode (4 weights + italic)
