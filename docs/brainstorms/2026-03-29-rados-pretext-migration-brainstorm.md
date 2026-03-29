# RadOS-Wide Pretext Migration Brainstorm

**Date:** 2026-03-29
**Status:** Decided

## What We're Building

Migrate all RadOS apps to use `@chenglou/pretext` for text layout and reflow. `pretext-type-scale.ts` becomes the single source of truth for all typography — root clamp, static font-size tokens, fluid tiers, spacing scale, and line-height ratios. CSS font-size tokens are *generated* from it via a new `tokens:generate` pipeline. `typography.css` is deleted entirely.

## Why This Approach

Pretext solves the fundamental tension in RadOS: apps live in resizable windows, but CSS typography assumes viewport-based or static sizing. Today this is patched with `@container` + `cqi` container queries and `clamp()` — three layers of indirection that can silently diverge from the JS-side `pretext-type-scale.ts` definitions.

By making pretext the single authority:
- **Window reflow is native** — no container queries, no breakpoint hacks, no `ResizeObserver` plumbing per-app
- **Accordion/card height is known before paint** — pretext measures text height pre-render, eliminating layout shift
- **Multi-column layout is trivial** — GoodNews already proves 3-column + obstacle wrapping
- **The `no-viewport-breakpoints-in-window-layout` ESLint rule becomes unnecessary** — there are no breakpoints to misuse
- **One source of truth** — `pretext-type-scale.ts` generates CSS tokens, so the CSS and JS scales can never diverge

## Key Decisions

- **Scope: all apps, no exceptions.** Even light apps (About, Links, RadiantsStudio) use pretext. Maximum consistency; `typography.css` dies completely.
- **Pretext is authority, CSS is derived.** Flowing/body content uses pretext reflow directly. UI chrome (buttons, badges, tabs) uses Tailwind utilities (`text-sm`, `text-base`) backed by CSS tokens *generated from* pretext-type-scale.ts.
- **Root clamp derived from pretext.** The `html { font-size: clamp() }` gets generated from a `rootScale` entry in pretext-type-scale.ts. Zero CSS-authored font sizes.
- **Separate `tokens:generate` command.** Not bolted onto the registry generator (different concern). Lives in turbo pipeline alongside `registry:generate`. Output: `packages/radiants/generated/typography-tokens.css`.
- **Typography playground gutted.** Delete Editorial, Broadsheet, Magazine layouts. Migrate Specimen only to a pretext reflow demo.
- **Bottom-Up migration.** Foundation first (extend scale, build generator, delete typography.css), then migrate apps one-by-one starting with text-heaviest.

## Migration Order

### Phase 1 — Foundation
1. Extend `pretext-type-scale.ts` with root clamp definition, static tier exports (for CSS generation), line-height ratios, letter-spacing mappings
2. Build `tokens:generate` script → reads pretext-type-scale.ts → outputs `generated/typography-tokens.css`
3. Wire into turbo pipeline (`pnpm tokens:generate`, runs on `pnpm build`)
4. Replace hand-authored font-size block in `tokens.css` with `@import` of generated file
5. Delete `typography.css` — element sizing/leading/tracking moves to pretext; color/decoration stays in component styles

### Phase 2 — App Migration (by text complexity)
1. **ManifestoApp** — long-form paragraphs, multi-tab, good second case after GoodNews
2. **BrandAssetsApp** — metadata, truncation, accordion patterns, `@container` removal
3. **RadRadioApp** — track metadata, truncation, ResizeObserver replacement
4. **TypographyPlayground** — gut to Specimen only, rebuild as pretext reflow demo
5. **RadiantsStudioApp** — light text, simple migration
6. **AboutApp** — minimal text
7. **LinksApp** — minimal text

### Phase 3 — Cleanup
1. Remove `@container` class from AppWindow content wrapper (no longer needed for typography)
2. Remove fluid token block from tokens.css (now generated)
3. Remove `cqi` usage across codebase
4. Evaluate whether `no-viewport-breakpoints-in-window-layout` ESLint rule can be deleted
5. Update DESIGN.md §3 (Typography) and §8 (Container Queries) to reflect pretext architecture

## What CSS Survives

| File | Stays | Dies |
|------|-------|------|
| `tokens.css` | Colors, shadows, radius, motion, accessibility, spacing | Font-size scale (static + fluid) — replaced by generated import |
| `base.css` | Scrollbar styling, button tones, density vars, box-sizing reset | `html { font-size: clamp() }`, `body { font-family }` — generated |
| `fonts.css` | Font-family `@theme` variables (still needed for Tailwind `font-sans` etc.) | Nothing — stays but values originate from pretext config |
| `fonts-core.css` | All `@font-face` declarations (browser needs them) | Nothing |
| `fonts-editorial.css` | All `@font-face` declarations | Nothing |
| `typography.css` | — | **Entire file deleted** |
| `animations.css` | All motion (orthogonal to text layout) | Nothing |
| `dark.css` | Color mode flips | Nothing |

## What Pretext Replaces

| Current CSS | Pretext Equivalent |
|-------------|-------------------|
| `--font-size-fluid-*` with `clamp()`/`cqi` | `resolveFluid(tier, containerWidth)` |
| `--font-size-xs` through `--font-size-5xl` | Generated from `fluidType` tier definitions |
| `html { font-size: clamp() }` | Generated from `rootScale` in pretext-type-scale.ts |
| `@container` on AppWindow for text sizing | Pretext receives containerWidth directly |
| `ResizeObserver` per-app for container width | Shared hook, one ResizeObserver pattern |
| `leading-snug`, `leading-none`, `tracking-tight` on elements | Pretext line-height/tracking per layout call |
| Accordion height calculation | `prepareWithSegments` → known height before render |
| CSS container queries for responsive text | `resolveFluid()` with actual container px width |

## Open Questions

- **Shared hook pattern:** Should there be a single `usePretextLayout(ref)` hook that all apps use, or does each app compose lower-level pretext primitives? GoodNews is complex (obstacles, multi-column); About is trivial. One-size-fits-all hook may over-abstract.
- **Font loading orchestration:** Currently `fonts-core.css` loads eagerly, `fonts-editorial.css` lazily on app open. Does pretext need to coordinate with `document.fonts.ready` at a framework level, or does each app handle it (as GoodNews does today)?
- **@container for non-text uses:** AppWindow's `@container` may still be useful for non-typography responsive behavior (hiding sidebars, layout shifts). Evaluate before removing.
- **Transition period:** During migration, some apps will use pretext while others still use CSS fluid tokens. The generated tokens ensure both work, but is there a lint rule to track migration progress?

## Reference Implementation

**GoodNewsApp.tsx** (`apps/rad-os/components/apps/GoodNewsApp.tsx`) — 815 lines demonstrating:
- `prepareWithSegments` + `layoutNextLine` for per-line control
- `resolveFluid()` / `resolveFluidRaw()` from pretext-type-scale.ts
- ResizeObserver → containerWidth state → reflow on resize
- Polygon hull obstacle wrapping via `@chenglou/pretext/demos/wrap-geometry`
- Drop cap with custom font measurement
- 3-column layout with column rules
- `document.fonts.ready` coordination

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA-pretext-migration`
- Branch: `feat/pretext-migration`

## Research Notes

- `pretext-type-scale.ts` already has 7 fluid tiers + spacing scale — needs rootScale, static exports, line-height/tracking additions
- CSS fluid tokens in `tokens.css:284-293` use `cqi` units that parallel pretext's formula exactly
- Root clamp `clamp(14px, 0.25vw + 12px, 18px)` shares min/max bounds with pretext base tier (14/18)
- Typography playground has 9 files; only `SpecimenLayout.tsx` survives
- `@container` class set on AppWindow content wrapper — evaluate non-typography uses before removing
- Existing `pretext-layout-editor-brainstorm.md` (2026-03-28) covers inspector tooling, not this migration — complementary work
