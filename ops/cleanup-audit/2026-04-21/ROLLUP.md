# Cleanup Audit Rollup — 2026-04-21

**Branch:** `feat/logo-asset-maker` (committed state only).
**Graph freshness:** 2026-04-21T20:29 — fresh.
**Tools:** knip 6.0.6 (workspace-aware), dependency-cruiser 17.3.10 (786 modules / 1206 deps, 0 cycles), code-review-graph MCP.
**Lanes dispatched:** 12 (9 canonical + rdna-drift + knip + depcruise).

## Headline counts per lane

| Lane | File | Findings | crit | high | med | low | Real orphans / dead |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 dedup | `stage1/agent-1-dedup.md` | 6 | 0 | 2 | 1 | 3 | — |
| 2 types | `stage1/agent-2-types.md` | 5 | 0 | 0 | 3 | 2 | — |
| 3 dead-code | `stage1/agent-3-dead-code.md` | 8 | 0 | 4 | 3 | 1 | 2 |
| 4 cycles | `stage1/agent-4-cycles.md` | 0 | — | — | — | — | — |
| 5 weak-types | `stage1/agent-5-weak-types.md` | 2 | 0 | 0 | 0 | 2 | — |
| 6 defensive | `stage1/agent-6-defensive.md` | 3 | 0 | 0 | 0 | 3 | — |
| 7 legacy | `stage1/agent-7-legacy.md` | 9 | 0 | 1 | 5 | 3 | — |
| 8 comments | `stage1/agent-8-comments.md` | 5 | 0 | 0 | 0 | 5 | — |
| 9 react-practices | `stage1/agent-9-react-practices.md` | 6 | 0 | 0 | 2 | 4 | — |
| 10 rdna-drift | `rdna-drift/agent-10-rdna-drift.md` | 9 | 0 | 2 | 5 | 2 | — |
| T1 knip | `tools/stage1/agent-T1-knip.md` | 16 | 0 | 3 | 5 | 8 | 2 |
| T2 depcruise | `tools/stage1/agent-T2-depcruise.md` | 10 | 1 | 4 | 3 | 2 | 2 |
| **Totals** | | **79** | **1** | **16** | **27** | **35** | **4** |

## Top-20 actionable items across the whole audit

Ranked by `severity × impact_radius × fixability`. Each row cites the lane's ID.

| # | Severity | Area | Item | Effort | Lane IDs |
|---:|---|---|---|---|---|
| 1 | **crit** | `@rdna/ctrl` package hygiene | Route all 32 `ctrl-preview` imports through ctrl's barrel exports; add `ScrubSurface` + `ColorPicker` to barrels. Fixes deep-bypass + two "orphan" modules in one pass. | M | T2-DEEP-01, DEAD-001, DEAD-002, T1-KNIP-002/003 |
| 2 | high | `AppWindow.tsx` hot zone | Complete wave-6 public-API deprecation removal: drop 11 unused types + default export + 2 redundant SSR guards + 2 stale comments. | M | LEGACY-001, TYPE-001, T1-KNIP-006, COMMENT-002, DEFENSIVE-001, REACT-006 |
| 3 | high | `package.json` hygiene | Drop `@rdna/ctrl` 3 unused `@testing-library/*` devDeps + `@rdna/radiants` `svgo` devDep. Confirm `@blocknote/core` before touching. | S | DEAD-005, DEAD-006, T1-KNIP-009/010 |
| 4 | high | Unlisted dep | Add `react-draggable` to `apps/rad-os/package.json`. | XS | T2-DEEP-02, DEDUP-002 |
| 5 | high | Tailwind v4 trap | Replace `max-w-{3xl,4xl,6xl}` in `IconConversionReviewClient.tsx` with `max-w-[48rem]`/`[56rem]`/`[72rem]`. | S | RDNA-001 |
| 6 | high | Default-export sweep | Delete `export default X` from 41 `packages/radiants/components/core/**/*.tsx`. One regex pass. | M | T1-KNIP-005, TYPE-005 |
| 7 | high | `ctrl-preview/page.tsx` DAW tokens | Introduce `--color-ctrl-surface` (near-black) + `--ctrl-box-bg`/`shadow-inner`; migrate the 6 `bg-black` + 5 hex-constant sites. | M | RDNA-002, RDNA-004, REACT-001 |
| 8 | high | `@rdna/preview` exports | Re-export `defineComponentMeta` from `@rdna/preview/src/index.ts`; migrate 65 meta files off the deep path. | M | T2-DEEP-04/05 |
| 9 | med | Tabs + ModalShell type cleanup | Remove 5 unused Tabs type exports + 7 unused ModalShell internal types. Include in TYPE-004 per-component sweep. | S | TYPE-002, TYPE-003, T1-KNIP-007/008 |
| 10 | med | `dark.css` pure-white audit | Replace pure-white bindings for non-mode-flip purposes (line 37, 70) with `--color-main` or `--color-inv`. | M | RDNA-003, LEGACY-003, RDNA-008, RDNA-009 |
| 11 | med | Brand-showcase blanket exceptions | `ColorCards.tsx` + `FibonacciMosaic.tsx` — pick one path (file-top escape hatch OR `<ColorChip>` primitive). | M | LEGACY-004/005, RDNA-005, REACT-002, LEGACY-008 |
| 12 | med | `knip.json` hygiene | Add `packages/ctrl/**/*.meta.ts` to ignoreFiles + trim 22 stale config entries. | S | T1-KNIP-001/014/015, DEAD-003, DEAD-008 |
| 13 | med | Slider math dedup | Extract common drag-math hook from `@rdna/ctrl/Slider` + `@rdna/radiants/Slider`. Product-aware. | L | DEDUP-003 |
| 14 | med | `dark.css` `!important` audit | 93 usages — triage each. | L | RDNA-007 |
| 15 | med | SSR-guard drops inside effects | `AppWindow.tsx`, `ManifestoBook` pages, `useHashRouting.ts`. 7 tiny deletions. | XS | DEFENSIVE-001/002/003, REACT-004/005/006 |
| 16 | low | RadioDisc CRT issue IDs | Rename `DNA-999` exception issue IDs to real tracking issues + top-of-file explainer. | S | LEGACY-006, RDNA-006 |
| 17 | low | `icon-public-types.typecheck.tsx` | Wire back into typecheck command or delete. | XS | DEAD-004, T1-KNIP-004 |
| 18 | low | WHAT-comment sweep | Delete 5 render-state comments across `CountdownTimer`, `AppWindow`, `Drawer`, `WindowTitleBar`, `InvertModeProvider`. | XS | COMMENT-001/002/003/004/005 |
| 19 | low | Orphan LogoMaker-tile exceptions | Add file-top comment explaining the 3 raw-button exceptions. | XS | LEGACY-007, REACT-003 |
| 20 | low | `ScrubSurface` local alias in ctrl-preview | Remove the dead `const ScrubTrap = ScrubSurface` alias. | XS | DEDUP-001 |

## Cross-lane clusters (same file flagged by multiple lanes)

| File | Lanes | Count | Treatment |
|---|---|---:|---|
| `apps/rad-os/app/ctrl-preview/page.tsx` | T2, REACT, DEDUP, RDNA, LEGACY | **6** | Dedicated "ctrl-preview refactor" work item; bundles #1 + #7 + most of #20 above. |
| `packages/radiants/components/core/AppWindow/AppWindow.tsx` | TYPE, LEGACY, T1-KNIP, COMMENT, DEFENSIVE, REACT | **6** | Dedicated "AppWindow public API deprecation" sweep; item #2 above. |
| `ColorCards.tsx` + `FibonacciMosaic.tsx` | LEGACY, RDNA, REACT | **3 each** | Single "brand-showcase escape-hatch" pattern. Item #11. |
| `RadioDisc.tsx` | LEGACY, RDNA | **2** | Rename placeholder `DNA-999` issue IDs. Item #16. |
| All 41 core components | T1-KNIP, TYPE | **2** | One regex pass to drop `export default`. Item #6. |
| `ScrubSurface.tsx` + `ColorPicker.tsx` | DEAD, T1-KNIP, T2 | **3 each** | Resolved by item #1. |

## Fix-order sequence (recommended)

**Phase A — tooling hygiene (no code changes, all XS/S):**
1. Item #12 (`knip.json` hygiene).
2. Item #17 (icon-public-types.typecheck — wire or delete).

**Phase B — mechanical sweeps (low risk, mostly regex):**
3. Item #18 (WHAT-comment sweep, 5 sites).
4. Item #6 (default-export sweep, 41 components).
5. Item #20 (`ScrubSurface` alias deletion).
6. Item #19 (LogoMaker file-top comment).

**Phase C — public-API tightening (touches published pkg shapes):**
7. Item #3 (unused devDeps — touch 2 `package.json`s, regen lockfile at end).
8. Item #4 (add `react-draggable` to rad-os deps — same lockfile run).
9. Item #1 (ctrl package exports — adds `ScrubSurface`/`ColorPicker` to barrels, switches ctrl-preview imports).
10. Item #8 (preview `defineComponentMeta` re-export + migrate 65 meta files).

**Phase D — refactors requiring product judgement:**
11. Item #2 (AppWindow wave-6 completion — bundled with in-flight branch edits).
12. Item #9 (Tabs/ModalShell type cleanup).
13. Item #7 (ctrl-preview DAW token introduction).
14. Item #5 (Tailwind v4 maxw-trap trio).
15. Item #10 + #14 (dark.css audits — pure-white + !important).

**Phase E — long-running / ticketed:**
16. Item #11 (brand-showcase pattern).
17. Item #13 (Slider math dedup).
18. Item #15 (effect SSR-guard drops — can piggyback on #11 AppWindow sweep).
19. Item #16 (RadioDisc issue ID rename).
20. (Out of scope) Editor.tsx decomposition (DEDUP-006).

## Findings that require user judgement before fix

- **Item #1** (ctrl barrels): add `ScrubSurface`/`ColorPicker` to barrels (preserves API surface) vs. delete them (reduces surface). Product call on whether those components are kept.
- **Item #8** (preview re-export): mechanical but touches 65 meta files — schedule when other meta-file edits aren't in-flight.
- **Item #10** (`dark.css` pure-white): some sites are intentional dark-mode fills. Needs per-site visual QA pass.
- **Item #11** (brand-showcase): `<ColorChip>` primitive vs. file-top escape-hatch — user taste on how escape hatches are styled.
- **Item #13** (Slider dedup): the ctrl Slider and radiants Slider serve different audiences (DAW vs. general). Dedup may dilute one.
- **Item #16** (RadioDisc exception IDs): user needs to decide issue tracker destination (Linear? GitHub?). `DNA-001`/`DNA-999` are placeholders.

## Notes

- **Zero cycles**, **zero `any` outside vendored Dotting code**, **zero TODO/FIXME in source**, **zero missing `key=` in hand-audited samples**. The codebase is unusually clean. Findings skew toward *hygiene* (dead types, unused devDeps, stale config) and *package-boundary discipline* (ctrl-preview deep imports), not quality issues.
- No expired `rdna/*` exceptions in source as of 2026-04-21.
- Prior audit (2026-04-16) waves 1, 3, 4, 5, 7, 9, 10 are landed — findings are net-new. Waves 2, 6, 8, 11 were still pending-approval; items #1, #2, #3, #11 here are the follow-throughs.
