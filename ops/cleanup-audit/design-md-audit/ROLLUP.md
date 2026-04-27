# DESIGN.md Audit — Master Rollup

> Five-lane audit of `packages/radiants/DESIGN.md` against current codebase (commit `140336988440`, branch `feat/logo-asset-maker`).
> Premise: codebase is the source of truth; DESIGN.md has drifted.
> Per-lane reports in this directory: `lane-1-…` through `lane-5-…`.

## Headline counts

| Lane | High | Medium | Low |
|---|---|---|---|
| 1 — Philosophy + Color + Typography | 5 | 3 | 1 |
| 2 — Shadow + Motion + Interactive | 3 | 2 | 0 |
| 3 — Components + Spacing + A11y + Enforcement | 2 | 3 | 2 |
| 4 — RadOS Windows + Desktop + Routing | 2 | 3 | 4 |
| 5 — Hard-Won Implementation Rules | 1 | 3 | 2 |
| **Total** | **13** | **14** | **9** |

DESIGN.md is broadly philosophy-correct but heavily drifted on numeric values, shipped patterns, and the ESLint surface. Two areas — typography scale and the AppConfig shape — would actively mislead a developer who copy-pastes from the doc.

---

## High-severity punch list

### Color & tokens

1. **Typography scale is mathematically wrong.** DESIGN.md lists a roughly linear scale; real generator (`packages/radiants/generated/typography-tokens.css:7-13`) ships a 1.333× modular scale. Worst delta: `--font-size-3xl` doc 2rem vs real 3.157rem (~56% off). `--font-size-4xl/5xl/display` and fluid variants are entirely undocumented. *(Lane 1)*

2. **Surface tokens documented but absent from `tokens.css`.** §2 lines 205-216 lists `--color-surface-primary/secondary/tertiary/elevated/muted`. They only exist in `dark.css:17-21`; light mode uses short aliases (`--color-page`, `--color-card`). Implementer reading the doc won't find them. *(Lane 1)*

3. **Overlay tokens same problem.** `--color-hover`, `--color-active`, `--color-surface-overlay-subtle/medium` only defined in `dark.css`. *(Lane 1)*

4. **`--color-rule` value mismatch.** Doc line 244 says ink @ 20% opacity; `tokens.css:65` ships solid ink. *(Lane 1)*

5. **Tokens shipped but not in §2 tables:** `--color-content-secondary/inverted/muted/link`, `--color-edge-primary/muted/hover`, `--color-action-secondary/destructive/accent`, `--color-status-success/warning/error/info`. *(Lane 1)*

### Shadow & motion

6. **Moon-mode shadow values don't match doc.** All seven `--shadow-*` tokens in `dark.css:180-206` add an undocumented border-ring layer and use different blur radii than the doc claims (e.g., `--shadow-lifted` doc says `10px+20px`, real is `8px+16px`). *(Lane 2)*

7. **"One easing curve for the entire system" is false.** `tokens.css:199-202` defines three: `--easing-default` ✓, `--easing-in` (doc explicitly bans ease-in), `--easing-spring` (used for popovers/badges). *(Lane 2)*

8. **Moon-mode `pixel-shadow-*` overrides** in `dark.css:347-361` undocumented. *(Lane 2)*

### Component architecture & enforcement

9. **`@rdna/ctrl` package not mentioned anywhere.** DESIGN.md describes a single-package world. `packages/ctrl/` is governed by the same ESLint rules but ships zero `.schema.json` files (vs 41 in radiants) — either an intentional pattern divergence (no schemas) or an unfinished migration. Either way, undocumented. *(Lane 3)*

10. **`@rdna/pixel` also missing from DESIGN.md.** *(Lane 3)*

11. **6+ shipped ESLint rules absent from §10 table:** `no-pixel-border`, `no-raw-line-height`, `no-raw-font-family`, `no-pattern-color-override`, `no-arbitrary-icon-size`, `no-translucent-bg`, `no-backdrop-blur`. (The latter two were added recently — Apr 19.) *(Lane 3)*

### RadOS

12. **AppWindow title bar buttons section is factually wrong.** Doc claims all use `variant="ghost" size="md"`, lists Help + MockStates buttons. Reality (`AppWindow.tsx:595-750`): close uses `tone="danger"`, copy-link `tone="success"`, fullscreen `tone="accent"`; size is `sm`; Help and MockStates never shipped. *(Lane 4)*

13. **AppConfig shape doesn't match the catalog.** Doc shows `title`/`icon`; real catalog (`apps/rad-os/lib/apps/catalog.tsx:58-184`) uses `windowTitle`/`windowIcon` plus 10+ undocumented fields: `chromeless`, `helpConfig`, `desktopVisible`, `category`, `subtabs`, `ambient`, `minSize`, `aspectRatio`, `launcherTitle`, `launcherIcon`. Doc also says registry lives in `lib/constants.tsx`; actual is `lib/apps/catalog.tsx`. Copy-pasting the doc example does not work. *(Lane 4)*

### Hard-won

14. **Z-index scale leaks repeatedly.** Real code uses `z-[9999]` (ZoomRects), `z-[1000]` (Tooltip, ContextMenu), `z-[950]` (Desktop), `z-[80]` (RadioWidget), `z-[5]` (FibonacciMosaic) — none in the documented bands. *(Lane 5)*

---

## Medium-severity items

- **Typography scale lacks fluid variants.** `--font-size-fluid-sm/base/...` exist (`generated/typography-tokens.css:31-38`) but undocumented. *(Lane 1)*
- **`--color-accent-soft` mode invariance unexplained.** Same value in both modes; doc gives no rationale. *(Lane 1)*
- **Removed-aliases block partially aliased.** `tokens.css:113-118` still aliases `--color-accent`/`-danger`/`-success`/`-warning` to brand primitives despite the "removed" framing. *(Lane 1)*
- **Animation durations hardcoded.** `animations.css:54-68` ships literal `0.15s`/`0.2s` instead of `var(--duration-base|moderate)`. Numerically matches; structurally violates doc claim. *(Lane 2)*
- **Button size scale off by one Tailwind step.** Doc says `md=h-8/32px`, `lg=h-10/40px`; real is `md=h-7/28px`, `lg=h-8/32px` (`Button.tsx:127-131`). *(Lane 2)*
- **Registry generator script reference is wrong.** Doc points at `build-registry-metadata.ts`; real entry is `../preview/src/generate-schemas.ts` (`radiants/package.json:116`). *(Lane 3)*
- **A11y focus ring spec lacks test coverage.** Doc claims `ring-2 ring-focus ring-offset-1`; `Button.test.tsx` doesn't assert these classes. *(Lane 3)*
- **Exception format doesn't define canonical `owner` slugs.** Real exceptions use both `owner:design` and `owner:design-system`. No registry exists. *(Lane 3)*
- **`contentPadding=true` default is misleading.** All 8 shipping apps override to `false` (`catalog.tsx:80-184`). *(Lane 4)*
- **Ambient capability system shipped, undocumented.** `ambient.wallpaper`/`widget`/`controller` (`catalog.tsx:40-44`, `Desktop.tsx:71-160`) — affects z-order + fullscreen. *(Lane 4)*
- **Control surface docks (drawers + inset rails) shipped, undocumented.** `AppWindow.tsx:51-56`. *(Lane 4)*
- **Hardcoded px font-size violation.** `NumberField.tsx` uses `text-[12px]`; should be `text-sm`. *(Lane 5)*
- **Status tokens silently mode-invariant.** `--color-status-*` defined in `tokens.css:106-109` but no `dark.css` overrides and no comment explaining the invariance — DESIGN.md §19 says invariant tokens *should* get explanatory comments. *(Lane 5)*

## Low-severity items

- `pure-white` hex example slightly off (oklch is closer to `#FFF9E6`, doc says `#FFFCF3`). *(Lane 1)*
- Window-limit "toast warning" is actually a `console.warn` (`windowsSlice.ts:316`). *(Lane 4)*
- Radio transport strip in Taskbar undocumented. *(Lane 4)*
- Hash-routing tab syntax (`appId:tabId`) undocumented in §13. *(Lane 4)*
- Window sizing tiers (string shortcuts `'lg'` etc.) undocumented. *(Lane 4)*
- Zoom-animation-on-launch (ZoomRects integration) undocumented. *(Lane 4)*
- Component inventory incomplete (41 components, doc names ~5). *(Lane 3)*
- Reduced-motion implementation unverified by tests. *(Lane 3)*
- User-memory note "H1 should use Mondwest" contradicts current `typography.css:5` (uses Joystix). *(Lane 5)* — memory drift, not doc drift.

---

## Cross-file inconsistencies surfaced

- **App-window prop naming straddles two contracts.** Core AppWindow + RadOS wrapper use `title`/`icon`; catalog uses `windowTitle`/`windowIcon`. Friction at every wrapper boundary.
- **App-registry location:** DESIGN.md §12 says `lib/constants.tsx`; real is `lib/apps/catalog.tsx`.
- **Viewport breakpoint rule:** documented in §10; the linter rule `rdna/no-viewport-breakpoints-in-window-layout` exists in `eslint.rdna.config.mjs` but at `warn`, scoped only to RadOS window content.

---

## Recommended approach for the rewrite

DESIGN.md is the canonical *intent* document, but several sections have become token-tables maintained by hand. Those are exactly the parts that drift. Recommend:

1. **Auto-generate from source where possible.** Token tables in §2-3, easings in §5, ESLint rule list in §10, animation durations in §5 — all already exist as machine-readable artifacts (`tokens.css`, `dark.css`, `generated/typography-tokens.css`, `eslint/index.mjs`). Replace hand-written tables with `<!-- generated -->` blocks driven by a script.

2. **Move RadOS-specific sections into rad-os.** §10-14 (windows, desktop, app registration, routing) are tightly coupled to `apps/rad-os/lib/apps/catalog.tsx` and `AppWindow.tsx`. Either move to `apps/rad-os/SPEC.md` or carry an explicit "snapshot of `catalog.tsx` shape" comment so drift is visible.

3. **Document `@rdna/ctrl` and `@rdna/pixel`.** Either as siblings within DESIGN.md or with a one-paragraph "this package follows the same conventions except…" callout.

4. **Decide on status-token mode invariance and comment it.** Either add the `dark.css` overrides (even if they re-declare the same value) or add a `:root` comment in `tokens.css` documenting the intentional invariance — the doc requires one or the other.

5. **Run a cleanup pass on hardcoded px and arbitrary z-index.** The 14 high-severity findings include real code violations (`text-[12px]`, `z-[9999]`) — those should be linted away, not papered over in the doc.

---

## Suggested next step

Spin up the doc rewrite as its own plan (`docs/plans/2026-04-25-design-md-rewrite.md`). Ordering:

1. Generated-token tables (§2, §3, §10) — biggest accuracy win.
2. RadOS sections (§10-14) — reflect real `AppWindow` button API + `AppCatalogEntry` shape.
3. Hard-won rules (§15) — bring z-index code in line *or* expand the documented scale; don't just doc-patch.
4. ctrl + pixel package addition.
5. Easing/motion section honesty pass.
