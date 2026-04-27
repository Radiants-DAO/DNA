# Lane 10 — RDNA Drift (2026-04-21)

**Rules cross-referenced:** CLAUDE.md styling rules + MEMORY.md (Tailwind v4 max-w trap, token chain, text-xs=10px, pure-white remap, pixel-corner constraints) + `eslint-plugin-rdna/*`.
**Cap:** 25.
**Total findings:** 9.

| # | ID | File | Line | Severity | Category | Finding | Suggested fix | Effort | Cross-lane |
|---|---|---|---|---|---|---|---|---|---|
| 1 | RDNA-001 | `apps/rad-os/app/icon-conversion-review/IconConversionReviewClient.tsx` | 312, 319, 324 | high | tailwind-v4-maxw-trap | Three `max-w-{T-shirt-size}` classes (`max-w-4xl`, `max-w-6xl`, `max-w-3xl`). In Tailwind v4 these resolve to tiny spacing values (4xl=32px etc.) — NOT content widths. Project memory explicitly calls out this trap. | Replace with `max-w-[56rem]` (≈4xl old), `max-w-[72rem]` (≈6xl old), `max-w-[48rem]` (≈3xl old). | S | |
| 2 | RDNA-002 | `apps/rad-os/app/ctrl-preview/page.tsx` | 1011, 1036, 1063, 1106, 1132 (and ~5 more) | high | hardcoded-hex-style | `style={{ backgroundColor: '#0A0A08', … }}` and `boxShadow: 'inset 0 2px 3px #00000033'`. Bypasses RDNA token system entirely in a file that's 1180 LOC. | Define DAW-aesthetic semantic tokens in `@rdna/ctrl`: `--ctrl-box-bg`, `--ctrl-box-shadow-inner`. The file already has RDNA lint disables suggesting this was punted. | M | REACT-001, LEGACY-003 |
| 3 | RDNA-003 | `packages/radiants/dark.css` | 37, 70, 447, 448, 449, 450 | med | pure-white-leakage | `var(--color-pure-white)` used 6+ times in dark.css. MEMORY notes "pure-white remap" as a deprecated pattern to eliminate where possible. Some of these are legitimate dark-mode active-state fills; others (e.g. heading color) could bind to `--color-main`. | Audit each site; line 37 + 70 look like candidates for `--color-inv`. Keep the `::after` alpha fills (they're the active-state contract). | M | LEGACY-003 |
| 4 | RDNA-004 | `apps/rad-os/app/ctrl-preview/page.tsx` + `packages/ctrl/layout/ControlPanel/ControlPanel.tsx:50` + `packages/ctrl/selectors/{Dropdown,IconRadioGroup,TransportPill}.tsx` | various | med | bg-black-hardcoded | 6 `bg-black` class usages in ctrl-preview page + ctrl library. Black is the DAW-aesthetic surface but it should be behind a semantic token. | Introduce `--color-ctrl-surface: oklch(0.18 0 0)` (near-black) and migrate all six sites. | M | REACT-001, LEGACY-003 |
| 5 | RDNA-005 | `apps/rad-os/components/apps/brand-assets/colors-tab/ColorCards.tsx` (12 disables) + `FibonacciMosaic.tsx` (8 disables) | various | med | blanket-exceptions | 20 `rdna/*` disables in two brand-showcase files all citing `DNA-001` (placeholder issue) and never-expires (`2027-01-01`). Pattern avoids the rule rather than solving it. | Either treat the whole color-tab as "escape hatch" and mark with `/* eslint-disable rdna/no-hardcoded-colors */` at file top (one line), OR refactor to show brand primitives via `<ColorChip primitive="sun-yellow" />` component that accepts the raw hex from a data source. | M | LEGACY-004, LEGACY-005 |
| 6 | RDNA-006 | `apps/rad-os/components/apps/radio/RadioDisc.tsx` | 90, 92, 178, 190, 201, 220, 254 | low | crt-effect-exceptions | 7 `rdna/no-hardcoded-colors` disables under `DNA-999` for CRT/vignette visual effects. Effects are genuine art — can't use tokens. | Keep; rename `DNA-999` → a real tracking issue so "no owner remembers why" doesn't happen in 6 months. Add a file-top HEADER comment explaining "CRT visual effect — escape hatch intentional". | S | LEGACY-006 |
| 7 | RDNA-007 | `packages/radiants/dark.css` | whole file (93 `!important`) | med | important-density | dark.css uses `!important` 93 times. Dark mode overrides in Tailwind v4 legitimately need this for `.dark { }` scopes, but 93 is an outlier. | Audit each. Where the override IS a cascade conflict (Tailwind's `@theme` writes to `:root`), keep. Where it's a plain mode-flip, drop `!important` and rely on the `.dark` class specificity. | L | |
| 8 | RDNA-008 | `apps/rad-os/components/apps/brand-assets/colors-tab/FibonacciMosaic.tsx` | 162 | low | raw-color-constant | `const INK_LINE_OVERRIDE = 'var(--color-pure-white)'` — a module constant wrapping a banned token. | Replace with `--color-main` (semantic) or delete the constant if unused. | XS | LEGACY-003 |
| 9 | RDNA-009 | `apps/rad-os/app/ctrl-preview/page.tsx` | 413 | low | banned-token-in-list | `{ value: 'var(--color-pure-white)', label: '#FFFFFF' }` — inside a static color options array. | Replace with `--color-main` (dark) or decide whether this array should remain raw-primitives for a color-picker demo. | XS | LEGACY-003 |

## Confirmed healthy areas

- **No `bg-white` / `text-white` in source components.** The only source matches were in CSS token definitions and a comment.
- **No viewport breakpoint misuse inside window contents** (`sm:`, `md:`, …). Prior audit's WindowLayout rule (`rdna/no-viewport-breakpoints-in-window-layout`) is holding the line — the only 2 active exceptions are in `Desktop.tsx` (intentional, watermark).
- **Pixel-corner rules:** searching for `pixel-rounded` + `shadow-` or explicit `border-` turned up zero violations of `rdna/no-clipped-shadow` / `rdna/no-pixel-border`. The 3 Input/Select hits using `pixel-border-danger` are the intended `::after` pseudo-border token.
- **22 sites use `max-w-[Xrem]` explicitly** — the documented v4 workaround is in broad use; only 3 offenders remain (RDNA-001).
- **No token chain bugs** found via grep of `@theme` blocks. Prior MEMORY note on "token chain max 1 depth" was fixed in radiants/tokens.css.
- **No `--color-brand-blue` / `--color-black`** references outside the ESLint plugin's own banned list (`no-removed-aliases`).

## Recommendations outside this audit's scope

- Convert `@rdna/ctrl` from a 1000-LOC playground page into a dogfooded demo app window in rad-os. The ctrl-preview route sprawl drives most of this lane's findings.
