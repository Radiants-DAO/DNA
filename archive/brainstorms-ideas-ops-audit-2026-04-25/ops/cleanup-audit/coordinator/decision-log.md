# Coordinator Decision Log — 2026-04-16

**Dispatch snapshot:** HEAD `d658b2b5`, branch `main`, clean tree, knip/madge absent.
**Stage 1 reports:** 9/9 returned (Agent 9 late-added for React practices + useEffect audit). Total raw findings: **117**.

## Finding inventory by agent

| Agent | Domain | Findings | Auto-approvable | Escalated | Report-only / keep |
|---|---|---:|---:|---:|---:|
| 1 | Dedup & DRY | 5 | 2 | 0 | 3 |
| 2 | Type consolidation | 10 | 6 | 1 (TYPE-004 mega) | 3 |
| 3 | Dead code | 8 | 4 | 3 (package.json) | 1 |
| 4 | Cycles | 3 | 0 | 2 (root barrels) | 1 |
| 5 | Weak types | 19 | 17 | 0 | 2 |
| 6 | Defensive | 27 | 1 | 0 | 26 |
| 7 | Legacy | 14 | 4 | 3 (public API) | 7 |
| 8 | Comments | 10 | 5 | 0 | 5 |
| 9 | React practices + useEffect | 21 | 2 | 4 | 15 |
| **Totals** | | **117** | **41** | **13** | **63** |

(Agent 7 count of 14 includes 6 intentional keeps. Total row corrected for overlap-double-count below.)

## Cross-agent overlap analysis

Overlap = two or more agents describing the same file or concept. Used only as a **priority signal**, not as proof.

| Cluster | Agents | Files | Resolution |
|---|---|---|---|
| `packages/radiants/registry/runtime-attachments.tsx` hot zone | 5 (WEAK-005..017), 7 (LEGACY-005) | 1 file, 14 findings | Bundle into Wave 5, single owner. |
| Alert variant pipeline | 2 (TYPE-007), 5 (WEAK-005) | Alert.meta.ts, Alert.tsx, runtime-attachments.tsx | Unified action: move `AlertVariant` to Alert.meta.ts, import from both consumers. Wave 5. |
| AppWindow deprecations | 7 (LEGACY-002, LEGACY-006) | AppWindow.tsx, components/core/index.ts | Same file, sequential edits under one owner. Wave 6. |
| `packages/radiants/components/core/index.ts` public barrel | 7 (LEGACY-002, LEGACY-003) | 1 file | Must serialize: bundle in Wave 6. |
| Input deprecation + validity | 7 (LEGACY-004), 5 (WEAK-003) | Input.tsx | Same file. Wave 7. |
| `packages/ctrl/index.ts` root barrel | 4 (CYCLE-001, CYCLE-002) | 1 file | Bundle in Wave 2, single owner. |
| `apps/rad-os/components/Rad_os/index.ts` | 3 (DEAD-005, DEAD-006) | 1 file | Bundle in Wave 4. |
| `apps/rad-os/components/Rad_os/WindowTitleBar.tsx` | 6 (DEFENSIVE-001) | 1 file | Isolated, Wave 9. |
| Generator supersession | 1 (noted), 3 (DEAD-004) | generate-icons.mjs | Agent 3 owns. Wave 4. |
| PropControls.tsx hotspot | 7 (LEGACY-007), 9 (REACT-019, REACT-020) | 1 file, 3 findings | Bundle all three in Wave 9 (same file, same owner). |
| ctrl a11y / a11y-on-clickable-div pattern | 9 (REACT-015, 016, 017, 018) | 3 ctrl files + GoodNews + ctrl-preview | Bundle as Wave 11. |

## Rejected / deferred findings (not in any Stage 2 wave)

Full reasoning in each item's source JSON:

- **TYPE-004** — Systematic `<Component>Props` duplication across ~25 component folders. Too broad for a single wave; defer to a **dedicated per-component consolidation pass** (each component is its own sub-wave with disjoint scope). Explicitly out of the minimal-approval set.
- **TYPE-009**, **TYPE-010**, **DEDUP-003/004/005** — intentional copies or below dedup threshold. No action.
- **DEAD-008** (`getPatternsByDensity`) — public API on a published package; confidence 0.78 intentionally below auto-approve. Needs consumer survey first.
- **CYCLE-003** — preventive type-only barrel split in rad-os catalog. No live cycle today. High blast. Recommend doing as a preventive type split later but not required now.
- **DEFENSIVE-002**..027 — 26 `keep_with_reason` items (confirmed load-bearing boundary handling), 1 borderline (DEFENSIVE-002 at conf 0.72, below threshold).
- **LEGACY-KEEP-001..006** — explicit keeps protected by guardrails (tokens.css aliases, ESLint strict config shell, PatternEntry.legacyName, pixel-corners LEGACY_ALIASES, localStorage migrations, Checkbox standalone comment).
- **LEGACY-008** (pretext/legacy.ts coerceStoredDoc) — borderline at 0.70; product question about pretext→scratchpad merge plan.
- **WEAK-018, -019** — `keep_with_reason` (vendored Dotting @ts-nocheck and scalar casts).
- **SLOP-003** (conf 0.74), **SLOP-004** (conf 0.88, useWindowManager refactor — has blast-radius implications and borderline confidence; recommend user review), **SLOP-007** (lib/apps barrel — intentional public seam per documented boundary plan), **SLOP-008** (RDNA template banners — stylistic, conf 0.72), **SLOP-009** (thin App wrappers — intentional catalog indirection, conf 0.55), **SLOP-010** (generator banners — conf 0.60).
- **REACT-001** (useHashRouting listener-rebind, conf 0.78 — refs-based fix is subjective), **REACT-013** (NumberInput inline style, conf 0.68), **REACT-018** (ctrl-preview toggle a11y, conf 0.75), **REACT-021** (DesignSystemTab text-[10px] single instance, conf 0.70), **REACT-023** (ctrl-preview bg-black, conf 0.55).
- **REACT-002, -003, -004, -006, -010, -011, -014, -022, -024** — `keep_with_reason`. Notable: `WebGLSun.tsx` uses `useEffectEvent` + `store.subscribe()` correctly and was flagged only to prevent reviewer "fixes"; `useState(defaultOpen)` in Dialog/Sheet/AlertDialog/Drawer/Tabs is the controlled/uncontrolled seed pattern (not derived state — React Doctor false positive).

## Approved waves

Execution order follows the plan's sequencing (types → cycles → dedup → weak → legacy → dead → comments), adjusted for disjoint write scopes.

| Wave | Summary | Findings | Risk | Status |
|---:|---|---|---|---|
| 1 | Component type consolidation (Icon, Switch, Dialog, Popover, Combobox, Avatar, Card, ChipTag) | TYPE-001,002,003,005,006,008 | medium | approved |
| 2 | `@rdna/ctrl` root-barrel sync + Tooltip relocation | CYCLE-001, CYCLE-002 | **high** (package root barrel) | **pending_approval** |
| 3 | Utility dedup (`clamp` helper, pretext `useFontsReady` hook) | DEDUP-001, DEDUP-002 | low | approved |
| 4 | Dead removals (generate-icons.mjs, WindowTabs, WindowSidebar, PatternsTab) | DEAD-004,005,006,007 | medium (app barrel) | approved |
| 5 | `runtime-attachments.tsx` strengthening + Alert variant consolidation | WEAK-001,005-017 + LEGACY-005 + TYPE-007 | medium | approved |
| 6 | Radiants public-API deprecation removal (AppWindow.Body/Split/Pane, useTabsState, portal fallback) | LEGACY-002, 003, 006 | **high** (public barrel + schema regen) | **pending_approval** |
| 7 | Input deprecation (iconName) + Validity type | LEGACY-004, WEAK-003 | medium | approved |
| 8 | package.json dep pruning (motion×2, ts-node) | DEAD-001, 002, 003 | **high** (published package.json + lockfile) | **pending_approval** |
| 9 | Scattered cleanup (WindowTitleBar SSR guard, comment slop, empty barrels, PropControls legacyEnum + derived-state + text-[10px], preview ComponentType) | DEFENSIVE-001, SLOP-001,002,005,006, LEGACY-007, WEAK-002, REACT-019, REACT-020 | low | approved |
| 10 | BlockNote generator + regenerated output | WEAK-004 | medium (regenerated file) | approved |
| 11 | React practices — a11y on clickable non-interactive elements + ctrl-preview inline style hoisting | REACT-015 (approved), REACT-016, REACT-017, REACT-012 (pending) | low | **mixed: 1 approved / 3 pending_approval** |

**Auto-approved (7 full waves + 1 finding in Wave 11):** 1, 3, 4, 5, 7, 9, 10, (+ REACT-015) — 31 findings.
**Pending explicit approval (3 full waves + 3 findings in Wave 11):** 2, 6, 8, (+ REACT-012/016/017) — 12 findings. Waves 2/6/8 touch a package root barrel or published `package.json`. Wave 11 a11y trio is below 0.90 confidence (0.80–0.86) — safe additive edits but worth a quick review.

## Key calls / reasoning

1. **Sequenced serialization.** Waves 2 and 6 each touch a package root barrel (`packages/ctrl/index.ts`, `packages/radiants/components/core/index.ts`). Kept as single-owner waves; not split.
2. **Alert unification.** TYPE-007 and WEAK-005 both propose a home for `AlertVariant`. Choosing the `.meta.ts` location (project convention: meta is authoritative). Wave 5 does both.
3. **`ComponentProps<typeof X>['prop']` trick.** Most runtime-attachments WEAK findings (WEAK-006, 007, 010, 011, 012, 013, 015, 016, 017) resolve without new exports by using `React.ComponentProps` lookup. Keeps blast radius minimal.
4. **Dep-prune split from code waves.** Waves 1-7, 9, 10 can run without `pnpm install`. Wave 8 requires lockfile regen and should run last so code-level typechecks in earlier waves aren't poisoned by `motion` removal.
5. **No dirty-file blocks.** Tree was clean at dispatch; every approved wave can proceed.
6. **TYPE-004 deferred as a class.** 25 components × 2 files each would be ~50 edits in one wave — too broad even with per-component splits. Recommend a dedicated follow-up session using Button/Meter/Input as reference patterns and running as per-component mini-waves with a single owner.
7. **PropControls.tsx triple-hit.** LEGACY-007 (dead legacyEnum branch), REACT-019 (derived-state anti-pattern), and REACT-020 (text-[10px] below 12px floor) all land in `packages/radiants/registry/PropControls.tsx`. Wave 9 already owned it for LEGACY-007; REACT-019 and REACT-020 join under the same owner.
8. **React Doctor false positives filtered.** Agent 9 verified that `useState(defaultOpen)` in Dialog/Sheet/AlertDialog/Drawer/Tabs is the controlled/uncontrolled seed pattern, not derived state — React Doctor's lead was wrong. The only real derived-state anti-pattern in the whole monorepo is REACT-019 (PropControls.NumberControl).
9. **CTRL DAW aesthetic preserved.** Agent 9 flagged `fontSize:10` and `bg-black` in @rdna/ctrl as likely intentional (instrument-panel look). Kept without change; noted as candidates for future semantic tokens.
