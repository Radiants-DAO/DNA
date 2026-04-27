# Coordinator Decision Log — 2026-04-21

**Branch:** `feat/logo-asset-maker` (HEAD committed state; ignoring uncommitted in-flight edits listed below).
**In-flight files to ignore:**
- `apps/rad-os/app/globals.css`
- `apps/rad-os/app/unused-review/page.tsx` (deleted)
- `apps/rad-os/components/apps/pattern-playground/*` (deleted — working directory cleanup)
- `packages/radiants/components/core/AppWindow/{AppWindow.test.tsx,AppWindow.tsx,appwindow.css}`
- `packages/radiants/{dark.css,pattern-shadows.css}`

**Graph freshness:** code-review-graph reports 226 files / 1228 nodes / 10540 edges, last updated 2026-04-21T20:29 — fresh.

## Scope (committed state)
All workspaces:
- `apps/rad-os/`
- `packages/{radiants,ctrl,pixel,preview,create}/`
- root `scripts/` and tooling

Excluded (intentional parking lots): `archive/`, `ops/`, `references/`, `fonts/`, `docs/`, `ideas/`, `templates/`.

## Tool lanes (ran before fan-out)

### knip 6.0.6 — `reporter=json`
- **26 unused files**, **0 unresolvable**, **multiple unused exports / dependencies / devDependencies / unlisted deps / binaries / duplicates**.
- Raw: `tools/knip.json` (36 KB), `tools/knip.txt` (symbols report).
- knip.json issues sampled show `.meta.ts` files marked unused — likely false positives because meta files are loaded dynamically by `registry/runtime-attachments.tsx` (not via static import). Lane `tools-knip` subagent must distinguish genuine unused-file vs. meta dynamic-load.

### dependency-cruiser 17.3.10 (local install, pnpm)
- Config: `tools/depcruise.config.cjs` (forbid cycles/orphans/dev-dep leakage/unresolvable/deep-into-package, warn on cross-package deep imports).
- **0 circular dependencies** across 786 modules / 1206 deps — cycle lane is effectively empty for depcruise.
- 701 `deep-import-into-package` warnings — 576 are same-package Next.js `@/` alias (false positive, my rule treated them as deep cross-package), **125 are real cross-package deep imports** (mostly `apps/rad-os/app/ctrl-preview/page.tsx` reaching into `@rdna/ctrl/controls/…` deep paths). See `tools/depcruise-cross-pkg-deep.json`.
- 123 `not-to-unresolvable` — 89 `@/…` aliases (tsconfig-paths not resolved; false positive), **32 `@rdna/*` unresolved** (real: deep paths not in package exports — same as the 125 above), 1 `react-draggable` (missing dep), 1 `server-only` (Next.js virtual).
- 25 orphan modules — most are `types.ts` re-export barrels (may be re-exported dynamically); real orphans: `lib/dotting/utils/stack.ts`, `ScrubSurface.tsx`, `lib/windowSizing.ts`, `lib/asset-downloads.ts`. See `tools/depcruise-orphans.json`.
- Raw: `tools/depcruise.json` (1.2 MB), `tools/depcruise-validate.txt`, `tools/depcruise-metrics.txt`.
- No graphviz on host — SVG dot graph skipped. If needed later: `brew install graphviz` + `--output-type dot | dot -Tsvg`.

## Lane partition (12 lanes, fan-out in parallel)

| Lane | Scope | Key rules |
|---|---|---|
| 1 dedup | Monorepo-wide | Duplicate utilities, near-duplicate components (seed: `find_large_functions_tool` > 300 LOC). |
| 2 types | Monorepo-wide | Missing/loose TS, `any` in hot zones. Cross-reference weak-types. |
| 3 dead-code | Cross-ref knip + depcruise orphans | Dedupe against knip/depcruise; verify with `query_graph importers_of`. |
| 4 cycles | depcruise output | **Zero cycles found by depcruise** — this lane's job: spot-check for dynamic-import cycles knip/depcruise can't see (barrel + circular React hooks). Cap at 5 findings. |
| 5 weak-types | Monorepo | `any`, `unknown`, over-broad generics, widening casts. |
| 6 defensive | Monorepo | Unnecessary null-checks, try/catch around pure functions, validation for impossible states. CLAUDE.md rule: "don't add error handling for scenarios that can't happen". |
| 7 legacy | Monorepo | Deprecated patterns, pre-refactor remnants. Cross-check MEMORY.md legacy list (text-xs semantics, pure-white remap, cream-vs-accent, banned tokens). |
| 8 comments | Monorepo | Stale/WHAT/task-reference comments to delete. CLAUDE.md: "default to writing no comments". |
| 9 react-practices | Monorepo (tsx only) | Hook misuse, keys, memoization, effect-as-state. Respect `@base-ui/react` wrapping via `rdna/prefer-rdna-components`. |
| 10 rdna-drift | Monorepo (CSS + tsx) | Hardcoded colors, Tailwind v4 max-w traps, token chain bugs, icon source violations, border on pixel corners, shadow-* clipped on pixel corners, missing dark.css overrides, viewport breakpoints inside windows. |
| T1 tools-knip | knip output | Categorize 26 unused files (real vs meta dynamic-load false positives), unused exports, unused deps, unlisted deps, duplicates, enum/class members. Cap 40 findings (tool-driven allows more than nine). |
| T2 tools-depcruise | depcruise output | Orphan modules (real vs types.ts barrels), 125 cross-pkg deep imports, 32 `@rdna/*` unresolved deep imports, dev-dep leakage. Cap 30 findings. |

Additionally: flag **expired lint-disable exceptions** (`expires:` < 2026-04-21) as a bonus check in lane 7 (legacy).

## Output structure

```
ops/cleanup-audit/2026-04-21/
├── coordinator/
│   ├── decision-log.md                 (this file)
│   └── execution-manifest.json
├── tools/
│   ├── knip.json                       (raw)
│   ├── knip.txt                        (human)
│   ├── depcruise.json                  (raw)
│   ├── depcruise-validate.txt          (human)
│   ├── depcruise-metrics.txt           (folder/module coupling)
│   ├── depcruise-cross-pkg-deep.json   (parsed, 125 entries)
│   ├── depcruise-unresolved.json       (parsed, 123 entries)
│   ├── depcruise-orphans.json          (parsed, 25 entries)
│   └── depcruise.config.cjs            (audit-only config)
├── stage1/                             (9 canonical lanes)
│   └── agent-N-<lane>.{md,json}
├── rdna-drift/
│   └── agent-10-rdna-drift.{md,json}
├── tools/stage1/                       (tool lanes T1, T2)
│   └── agent-T<n>-<lane>.{md,json}
└── ROLLUP.md
```

## Fix rules

- **Report-only this pass.** No agent may apply fixes.
- Each finding MUST include: file, line, severity (crit/high/med/low), proposed fix, estimated effort (XS/S/M/L).
- Cross-reference other-lane findings; call out clusters (same file flagged by >= 2 lanes).
- Cap per-lane finding count: 9 canonical lanes = 20 each, rdna-drift = 25, T1 = 40, T2 = 30.
