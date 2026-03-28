# OKLCH Migration Brainstorm

**Date:** 2026-03-10
**Status:** Decided

## What We're Building

Migrate all color values in the radiants theme layer from hex/rgba to OKLCH. Keep the semantic token API (`--color-surface-primary`, etc.) stable — only the underlying values change. Add enforcement to prevent regression to legacy color formats in token CSS files.

## Why OKLCH

OKLCH is perceptually uniform — equal numeric changes produce equal visual changes. This gives us:
- Predictable alpha blending (the rgba opacity ladder in dark.css becomes more intuitive)
- Consistent perceived lightness across hues (cream, sun-yellow, sky-blue all "feel" the same brightness at the same L value)
- Better interpolation for future gradient/animation work
- Industry direction: CSS Color Level 4, native browser support

## Key Decisions

- **Token API is stable.** No renames. `--color-surface-primary` stays `--color-surface-primary`. Only the assigned value changes from `#FEF8E2` to `oklch(...)`.
- **Extract glow tokens.** The repeated `rgba(254, 248, 226, 0.3)` and `rgba(254, 248, 226, 0.4)` across ~28 dark.css box-shadow lines become `--glow-cream-hover` and `--glow-cream-active` tokens. Convert once, reference everywhere.
- **Update ESLint autofix maps.** The `hexToSemantic` and `brandPalette` maps in `token-map.mjs` get oklch equivalents so autofix can suggest the right semantic token for both hex and oklch inline literals.
- **New lint rule for CSS token files.** A rule (or stylelint-equivalent) that scans `tokens.css` and `dark.css` for non-oklch color literals. Catches regressions at CI time.
- **Component code stays untouched** unless it has inline fallback color strings (only `MockStatesPopover.tsx` qualifies — 11 var fallback values).
- **apps/rad-os hardcoded colors are out of scope.** Canvas/WebGL/SVG/display-data hex values are not CSS token consumers.

## Migration Surface

| File | Hex | rgba | Notes |
|------|-----|------|-------|
| `tokens.css` | 10 brand tokens | 9 alpha variants | Primary target |
| `dark.css` | 1 (`#3D2E1A`) | ~46 (18 decls + 28 box-shadow) | Extract glow tokens first |
| `MockStatesPopover.tsx` | 5 fallbacks | 6 fallbacks | Last-mile cleanup |
| `DESIGN.md` | ~12 | ~6 | Documentation updates |
| `theme-spec.md` | examples | — | Documentation updates |
| `eslint/token-map.mjs` | autofix maps | — | Add oklch equivalents |

## Phasing

1. **Brand primitives** — Convert the 10 hex brand tokens in `tokens.css` to oklch. Everything downstream that uses `var(--color-cream)` etc. gets oklch for free.
2. **Alpha semantics** — Convert the 9 rgba values in `tokens.css` to `oklch(... / alpha)`.
3. **Dark mode glow extraction** — Add `--glow-cream-hover` and `--glow-cream-active`, convert `dark.css` token declarations and the lone `#3D2E1A` to oklch, replace 28 repeated rgba literals with token references.
4. **MockStatesPopover fallbacks** — Update 11 inline `var(--token, fallback)` values.
5. **ESLint autofix maps** — Add oklch values to `token-map.mjs`.
6. **Enforcement rule** — New lint rule banning hex/rgba in token CSS files.
7. **Documentation** — Update DESIGN.md brand palette table, dark mode table, and theme-spec.md examples.

## Open Questions

- **Conversion precision:** Use maximum precision oklch values or round to 3-4 decimal places? (Suggest 4 decimals for L/C, integer degrees for H.)
- **`#000000` and `#FFFFFF`:** These are achromatic. `oklch(0 0 0)` and `oklch(1 0 0)` — or keep as `black`/`white` keywords since they're lossless?
- **Tailwind v4 `@theme` compatibility:** Verify that Tailwind v4's `@theme` block correctly resolves oklch values for utility class generation. (Low risk — oklch is standard CSS, but worth a smoke test.)

## Worktree Context

- Path: `/private/tmp/claude/dna-oklch`
- Branch: `feat/oklch-migration`

## Research Notes

- `packages/radiants/eslint/rules/no-hardcoded-colors.mjs` already bans `oklch()` in component code via `COLOR_FUNCTION_RE` — correct behavior, no change needed
- `packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs` line 118 confirms oklch is tested as invalid
- `docs/theme-spec.md` has no normative color format requirement — examples use hex but nothing mandates it
- All `@theme` tokens live in one block (per the token chaining rule in MEMORY.md) — migration is a single-file atomic change for each CSS file
- The dark.css box-shadow pattern `0 0 4px rgba(254, 248, 226, 0.3), 0 0 10px var(--glow-sun-yellow-subtle)` appears identically on: primary button, ghost button, secondary button, outline button, accordion, switch, select, tabs, scrollbar — 9 component contexts
