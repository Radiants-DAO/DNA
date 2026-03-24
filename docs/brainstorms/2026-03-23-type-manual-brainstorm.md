# Type Manual Brainstorm

**Date:** 2026-03-23
**Status:** Decided

## What We're Building

A "newspaper skeuomorphism" typography manual for the BrandAssets app — three distinct layout variants (Broadsheet, Magazine, Specimen) with a switcher, plus a Usage Guide and a Type Styles code viewer. Replaces the current consolidated Type Manual and removes the font-switcher paradigm in favor of showing all three fonts together, each in their designated role.

The playground is being extracted to a general-purpose graphic compositor elsewhere.

## The Font Philosophy

All three fonts share one unifying trait: **pixel construction**. Every element in RDNA is built from pixels — borders, corners, icons, dithering patterns. The type system completes this vocabulary.

### Joystix — The Shout
- **Role:** Display, headings, labels, buttons
- **Personality:** Arcade nostalgia, maximum punch, irreverence, excitement, play
- **Why:** The loudest, most unapologetic bitmap font. Inner-child energy. Unmistakable at any size.
- **Weights:** 400 only

### Mondwest — The Voice
- **Role:** Body text, paragraphs, descriptions, long-form
- **Personality:** Wisdom, alchemy, gentle authority. Editorial seriousness, artistic sensitivity
- **Why:** Warm and readable without being generic. Pixel-meets-serif elegance from Pangram Pangram. The regal counterpoint to Joystix's loudness.
- **Weights:** 400, 700

### PixelCode — The Precision
- **Role:** Code, monospace, technical data, functional UI information
- **Personality:** Utility, clarity, quick-scan information
- **Why:** A non-pixelated monospace would break the aesthetic unity. 4 weights + italic gives real typographic range for code syntax (light comments, bold keywords).
- **Weights:** 300, 400, 500, 700 + italic

## Sub-Tab Structure

Under **03 Typography** in BrandAssets:

| Sub-tab | Purpose | Controls (accordion settings) |
|---------|---------|-------------------------------|
| **Type Manual** | Visual type manual — 3 layout variants | Layout switcher (Broadsheet / Magazine / Specimen) |
| **Usage Guide** | Do/don'ts, pairing rules, hierarchy guidance | (none) |
| **Type Styles** | CSS code viewer — tokens.css, typography.css | (none) |

## Three Layout Variants

### 1. Broadsheet — "The Daily Glyph"
- **Editorial angle:** Dense reference — all the type info at a glance
- **Feel:** Full newspaper pastiche — masthead ("THE DAILY GLYPH"), dateline, multi-column layout, rules between sections, Vol. 1 No. 1 flourish
- **Color:** Newsprint warmth (slightly aged paper tint)
- **Content:** Font stack with role badges, type scale, element styles table, weight specimens — all packed into newspaper columns
- **Full bleed** — no sidebar, the layout owns the entire canvas

### 2. Magazine — "Specimen Spread"
- **Editorial angle:** Story then showcase — opens with a design statement about the pixel type philosophy, flows into large specimens and contextual examples
- **Feel:** Open, editorial — generous whitespace, large hero type, print-on-paper warmth
- **Color:** Accent color hero moments (sun-yellow as editorial highlight)
- **Content:** Rationale narrative → font personality descriptions → large specimens → contextual "in use" vignettes
- **Full bleed**

### 3. Specimen — "Brand System Sheet"
- **Editorial angle:** Brand system demonstration — showing OUR usage, not a type foundry catalog
- **Feel:** Stark, systematic — black-on-white, clean grid, functional beauty
- **Color:** Stark contrast (more clinical than the other two)
- **Content:** Used weights only, glyph specimens, size waterfall, element mapping — focused on what the brand actually uses
- **Full bleed**

## Usage Guide Content

**Tone:** Opinionated headers with precise rules underneath. Editorial personality in the intros, technical precision in the specifics.

### Do/Don't Categories

1. **Font role violations**
   - DON'T: Joystix for body text / paragraphs
   - DON'T: Mondwest in code blocks
   - DON'T: PixelCode for marketing headlines
   - DO: Each font in its designated role

2. **Weight misuse**
   - DON'T: Mondwest Bold for body text (reserve for emphasis)
   - DON'T: Joystix at tiny sizes where it becomes illegible
   - DO: Use the weight that matches the context

3. **Hardcoded values**
   - DON'T: `font-size: 14px` or `color: #333`
   - DO: Use semantic tokens (`text-sm`, `text-main`)

4. **Spacing/tracking mistakes**
   - DON'T: Skip tracking on uppercase Joystix
   - DON'T: Use tight leading on Mondwest body text
   - DO: Follow the spacing tokens

5. **Pixel aesthetic violations**
   - DON'T: Pair pixel fonts with smooth/anti-aliased elements
   - DON'T: Use rounded corners, non-pixel icons alongside the type
   - DO: Maintain pixel cohesion across all elements

6. **Mixing fonts within elements**
   - DON'T: Two fonts in the same heading or paragraph
   - DO: One font per text block, hierarchy through size/weight

### Rendered examples
Each do/don't will be a visual rendered comparison — showing the actual incorrect rendering next to the correct one, not just text descriptions.

## Type Styles Sub-tab

Code viewer showing the actual CSS source files with syntax highlighting:
- `tokens.css` — font-size scale, font-family definitions
- `typography.css` — element styles, base type rules

Developers see the source of truth directly. No intermediary tables.

## Key Decisions

- **No font switcher** — all three fonts shown together in their roles, not one-at-a-time
- **Self-referential design** — the manual uses the type system it documents (Joystix headers, Mondwest prose, PixelCode technical values), with flexibility where clarity demands it
- **Full bleed layouts** — no persistent sidebar; CSS reference moved to its own sub-tab
- **Respects dark mode** — content adapts when user is in Moon mode, consistent with rest of rad-os
- **Separate copy file** — editorial text (rationale, do/don'ts, usage notes) lives in a dedicated data file, separate from code
- **Brand system, not foundry** — specimen shows what we USE, not everything available

## Open Questions

- Exact column layout for the broadsheet — 3-column or 4-column? (Depends on window width)
- Whether the magazine variant should include contextual "in use" mockups (UI screenshots) or keep it purely typographic
- How the code viewer in Type Styles should handle syntax highlighting (existing component or new?)

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA` (main checkout)
- Branch: `main`

## Research Notes

- Three research agents surveyed professional brand manuals (Apple, IBM, Google, Atlassian, Spotify), type specimen patterns (Polaris, Primer, Geist, Radix), and usage guideline formats
- Key insight: the best type pages follow Story → Scale → Rules → Proof → Play
- Material Design uses 5 roles × 3 sizes = 15 tokens; IBM Carbon uses Productive vs Expressive tracks
- Do/don'ts work best as rendered visual examples with one-line rationale (Shopify Polaris pattern)
- Previous brainstorm: `docs/brainstorms/2026-03-22-type-playground-brainstorm.md` (playground-focused, now being separated)
- Current implementation: `apps/rad-os/components/apps/typography-playground/TypeManual.tsx` (will be rebuilt)
- Font data: `typography-data.ts` — FONTS (3), TYPE_SCALE (7 steps), ELEMENT_STYLES (9 elements)
- CSS source: `packages/radiants/tokens.css`, `packages/radiants/typography.css`
