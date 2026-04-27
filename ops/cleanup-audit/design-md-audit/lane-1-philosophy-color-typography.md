# Lane 1: Philosophy + Color + Typography Audit

> Source agent ran read-only and reported findings inline; transcribed verbatim here.

## Summary
- 5 high-severity, 3 medium, 1 low
- Heaviest drift in §3 Typography (scale is mathematically wrong) and §2 Color System (subsections list tokens not defined in `tokens.css`).

## §1 Design Philosophy (lines 84-163)
No drift detected. Prose-only section with no concrete token claims to verify. Spot-checked:
- "sharp pixel-art offsets" (line 144) — consistent with shadow tokens.
- "Three-layer model" (lines 127-134) — matches component architecture.

## §2 Color System (lines 164-353)

### High-severity

1. **Surface tokens incomplete in `tokens.css`** (HIGH) — DESIGN.md §2 lines 205-216 documents `--color-surface-primary/secondary/tertiary/elevated/muted` with Sun Mode + Moon Mode values, but those names are only defined in `dark.css` (lines 17-21), not `tokens.css`. Light mode uses short aliases (`--color-page`, `--color-card`, etc.). Implementers reading DESIGN.md will look for these in `tokens.css` and not find them.

2. **Overlay tokens incomplete in `tokens.css`** (HIGH) — DESIGN.md lines 217-224 documents `--color-hover`, `--color-active`, `--color-surface-overlay-subtle/medium`. `--color-hover-overlay` and `--color-active-overlay` exist in `dark.css` (lines 28-29) only; surface-overlay tokens also only in dark.css.

3. **Edge token value mismatch** (HIGH) — DESIGN.md line 244 says `--color-rule` Sun Mode is `ink (20% opacity)`. `tokens.css:65` defines it as `var(--color-ink)` (solid). Doc claims muted border, code ships solid.

### Medium

4. **Removed-tokens block partially aliased** (MEDIUM) — DESIGN.md lines 184-188 lists deprecated/removed tokens, but `tokens.css:113-118` still defines `--color-accent`, `--color-danger`, `--color-success`, `--color-warning` as aliases to brand primitives. DESIGN.md line 271 also still classifies `--color-link` as a status token while line 237 classifies it as content.

5. **`--color-accent-soft` mode behavior undocumented** (MEDIUM) — Line 255 documents the same `sunset-fuzz` value in both modes (matches `tokens.css:115` and `dark.css:92`), but DESIGN.md doesn't explain why this token doesn't flip when most others do.

### Low

6. **`pure-white` hex example slightly off** (LOW) — DESIGN.md line 196 says `pure-white` ≈ `#FFFCF3`. Actual oklch (`tokens.css:32`) is closer to `#FFF9E6`. Cosmetic.

### Tokens in CSS but absent from DESIGN.md §2 tables

- Content: `--color-content-secondary/inverted/muted/link`
- Edge: `--color-edge-primary/muted/hover`
- Action: `--color-action-secondary/destructive/accent`
- Status: `--color-status-success/warning/error/info`
- Status table lists `--color-link` but doesn't have a formal subsection block.

## §3 Typography (lines 354-418)

### High-severity

7. **Type scale is mathematically wrong** (HIGH) — DESIGN.md §3 lines 372-380 lists a roughly linear scale; the actual generator (`packages/radiants/generated/typography-tokens.css:7-13`) ships a 1.333× modular scale. Specific deltas:
   - `--font-size-xs`: doc 0.5rem (8px) → real 0.625rem (10px). 25% off.
   - `--font-size-lg`: doc 1.25rem → real 1.333rem. ~6.5% off.
   - `--font-size-xl`: doc 1.5rem → real 1.777rem. ~16.5% off.
   - `--font-size-2xl`: doc 1.75rem → real 2.369rem. ~35% off.
   - `--font-size-3xl`: doc 2rem → real 3.157rem. ~56% off.

8. **Extra typography tokens absent from doc** (HIGH) — `generated/typography-tokens.css` also defines `--font-size-4xl` (4.209rem), `--font-size-5xl` (5.61rem), `--font-size-display` (5.61rem), and `--text-xs … --text-display` aliases — none documented.

### Medium

9. **Fluid typography tokens absent** (MEDIUM) — `generated/typography-tokens.css:31-38` defines `--font-size-fluid-sm/base/...`. DESIGN.md doesn't mention they exist.

## Tokens missing from DESIGN.md (rollup)

(See in-section lists above; consolidate during full rollup.)
