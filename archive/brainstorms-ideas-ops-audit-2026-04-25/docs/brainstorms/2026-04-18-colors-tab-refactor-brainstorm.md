# Colors Tab Refactor Brainstorm

**Date:** 2026-04-18
**Status:** Decided

## What We're Building

Refactor the `colors` tab in `BrandAssetsApp` from a top-to-bottom scrolling layout (three big sections: Brand Palette / Extended Palette / Semantic Tokens) into an island-based, control-driven explorer that mirrors the Logo Maker's methodology. Primary surface is a tile mosaic (brand tiles big, extended tiles small — 80/20 visual weight). Click any tile → a detail island with consumer info up top and a "dev stuff" accordion below that surfaces the semantic tokens derived from that color.

## Why This Approach

- **Scroll-free by default.** All tiles visible at a glance; drill-down happens in a sibling island, not below the fold.
- **One audience, two layers.** The mosaic + detail pane work for anyone; dev metadata (CSS var, Tailwind class, semantic mappings) lives behind an accordion so it doesn't clutter the view for people who just want "what's Cream?".
- **Semantic tokens surface organically.** Instead of a separate section, each semantic token is shown under the brand primitive it derives from (matched by OKLCH lightness/chroma/hue, ignoring alpha). Cream shows `--color-page`, `--color-depth`, `--color-card`. Ink shows `--color-rule`, `--color-line`, `--color-line-hover`. Etc.
- **Mirrors Logo Maker** without forcing 3 islands when 2 fit. The control-driven ethos is preserved — pick-something-see-detail — but the control is the mosaic itself.

## Key Decisions

- **Layout: 2 islands.** Left: mosaic (picker). Right: detail pane.
  - No top strip — tile weights already encode the tier hierarchy.
- **Tile mosaic**: brand tiles visually dominate (~80%), extended tiles smaller (~20%). Exact grid TBD in plan; could be a flex/grid with two sizes, or a CSS-grid template with big spans.
- **Detail pane**:
  - Top: consumer info — name, role, description, primary color chip, Light/Dark toggle.
  - Accordion (default closed): "Dev" — CSS variable, Tailwind class, OKLCH value, hex fallback, list of semantic tokens mapped to this color (with each semantic's CSS var + Tailwind class + note).
- **Light/Dark toggle** lives in the detail pane. Swaps the preview chip + the derived-semantic values without leaving the tab.
- **Format migration:** Update `SEMANTIC_CATEGORIES` in `BrandAssetsApp.tsx` so its display values match `tokens.css` (which already uses OKLCH — e.g. `oklch(0.1641 0.0044 84.59 / 0.2)`). Stale `rgba(...)` and hex strings in the constants will be replaced with the canonical OKLCH strings. Source of truth = `tokens.css` / `dark.css`.
- **Derivation matching:** parse each semantic's OKLCH; group by `L C H` ignoring alpha; assign to the brand primitive with the same `L C H`. Alpha-variant semantics (rule / line-hover) naturally fall under their base primitive.
- **Keep all current content** — no color or metadata is dropped. Just reorganized + format-normalized.

## Open Questions

- **Worktree/branch**: brainstorm lives in `DNA-logo-maker` on `feat/logo-asset-maker` because that's the active session. Unclear whether the colors refactor should land on the same branch (convenient, but branch name is misleading) or a fresh `feat/colors-tab-refactor` worktree. Decide at `/wf-plan` time.
- **Initial selection**: which tile is the default "selected" on mount? Proposal: first brand primitive (Sun Yellow). Easy to revisit.
- **Copy affordance**: where does "copy CSS var / copy Tailwind class / copy OKLCH" live? Inline next to each field inside the dev accordion, or a single copy-picker like Logo Maker's format selector? Leaning inline per-field, but can validate in plan.
- **Empty-state**: if nothing is selected (e.g., after user "closes" the detail), detail pane shows… what? Probably force a selection at all times and remove the close affordance.
- **Orphan derivations**: expectation is every semantic maps cleanly. If any don't (e.g., a semantic with a unique `L C H` not matching a brand primitive), plan needs to decide whether to (a) show it under an "Uncategorized" detail-pane section, (b) treat it as a new virtual tile, or (c) flag in devtools only. Verify during plan by iterating `SEMANTIC_CATEGORIES` × `BRAND_COLORS` + `EXTENDED_COLORS`.

## Worktree Context

- **Path:** `/Users/rivermassey/Desktop/dev/DNA-logo-maker`
- **Branch:** `feat/logo-asset-maker` (tentative — may split to a dedicated branch at planning time)

## Research Notes

- Current implementation: `apps/rad-os/components/apps/BrandAssetsApp.tsx`
  - `BRAND_COLORS` (3 entries) — line 59
  - `EXTENDED_COLORS` (4 entries) — line 77
  - `SEMANTIC_CATEGORIES` (4+ categories, ~20 tokens total) — line 99
  - Render block — lines 471–519 (`activeTab === 'colors'`)
  - Cards: `BrandColorCard` (~line 160), `ExtendedColorSwatch` (~line 206), `SemanticCategoryCard` (~line 296). These may be reusable in the new detail pane, or get inlined/replaced.
- Token sources: `packages/radiants/tokens.css` (light + brand primitives in OKLCH), `packages/radiants/dark.css` (dark-mode overrides). These are the canonical values.
- Logo Maker reference for island/control methodology: `apps/rad-os/components/apps/brand-assets/LogoMaker.tsx`. Uses `AppWindow.Content layout="three"` (left / center / right). Colors tab likely uses `layout="sidebar"` or `layout="split"` since only two islands are needed.
- `AppWindow.Island` API: `corners="pixel" padding="sm|md" noScroll width="w-[…]"`. Already dog-fooded in Logo Maker; patterns are known.
- Out of scope reminders (matches Logo Maker discipline):
  - Don't add new tokens.
  - Don't migrate extended palette to semantic aliases.
  - Don't rework `dark.css`.
