# Lane T1 — knip 6.0.6 (2026-04-21)

**Raw:** `tools/knip.json` (36 KB), `tools/knip.txt`.
**Cap:** 40.
**Total findings:** 16 (many are systemic, one-line actions).

## Summary counts

| Category | Count | Notes |
|---|---|---|
| Unused files | 26 | 24 are `.meta.ts` dynamic-load false positives; 2 are real. |
| Files with unused exports | 48 | Dominated by `default export` duplicates of named exports. |
| Files with unused types | 22 | AppWindow.tsx (11) + Tabs.tsx (5) + ModalShell.tsx (5) drive this. |
| Files with duplicate exports | 41 | Systemic `export { X } + export default X` pattern. |
| Packages with unused devDependencies | 2 | `@rdna/ctrl` (3 @testing-library/*), `@rdna/radiants` (@blocknote/core, svgo). |
| Unused enum members | 0 | — |
| Unresolved imports | 0 | — |
| Unlisted dependencies | 0 | — (note: depcruise caught `react-draggable` below, knip missed because radiants exposes it). |
| Duplicate dep types | 0 | — |
| Configuration hints | 22 | Stale `ignoreFiles` / `ignoreWorkspaces` in `knip.json`. |

## Findings

| # | ID | Scope | Severity | Category | Finding | Suggested fix | Effort | Cross-lane |
|---|---|---|---|---|---|---|---|---|
| 1 | T1-KNIP-001 | `packages/ctrl/**/*.meta.ts` (24 files) | low | false-positive-config | 24 `.meta.ts` files flagged as unused. They're loaded dynamically by `@rdna/preview` scanner + registry. | Add `packages/ctrl/**/*.meta.ts` to `knip.json` under the `packages/ctrl` workspace entry as `ignoreFiles` (mirror the radiants block). | XS | DEAD-003 |
| 2 | T1-KNIP-002 | `packages/ctrl/controls/ScrubSurface/ScrubSurface.tsx` | high | real-orphan | Real orphan: no importer except deep-path from ctrl-preview. | Expose via `controls/index.ts` or delete. | S | DEAD-001 |
| 3 | T1-KNIP-003 | `packages/ctrl/selectors/ColorPicker/ColorPicker.tsx` | high | real-orphan | Real orphan: same pattern. | Expose via `selectors/index.ts` or delete. | S | DEAD-002 |
| 4 | T1-KNIP-004 | `packages/radiants/test/icon-public-types.typecheck.tsx` | low | stale-typecheck | File unused. | Delete or wire back into typecheck script. | XS | DEAD-004 |
| 5 | T1-KNIP-005 | 41 components in `packages/radiants/components/core/**` | med | duplicate-exports | Each exports `{ Name }` AND `default Name`. Default is unused everywhere — consumers always use the named export via barrel. | Bulk-remove `export default X` from all 41 components. Single regex pass. | M | TYPE-005 |
| 6 | T1-KNIP-006 | `packages/radiants/components/core/AppWindow/AppWindow.tsx` | med | unused-types | 11 exported types unused (see lane 2). | Remove / downgrade to internal. | M | TYPE-001, LEGACY-001 |
| 7 | T1-KNIP-007 | `packages/radiants/components/core/Tabs/Tabs.tsx` | low | unused-types | 5 type aliases unused. | Verify consumers, remove. | S | TYPE-002 |
| 8 | T1-KNIP-008 | `packages/radiants/components/core/_shared/{ModalShell,SegmentGroup,PatternBackdrop}.tsx` | low | unused-types | 7+ interfaces exported on shared-only shells. | Drop `export` on internal-only types. | S | TYPE-003 |
| 9 | T1-KNIP-009 | `packages/ctrl/package.json` | high | unused-devDeps | `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event` — package has zero test files. | Remove from devDependencies. | S | DEAD-005 |
| 10 | T1-KNIP-010 | `packages/radiants/package.json` | med | unused-devDeps | `@blocknote/core`, `svgo`. `@blocknote/core` probably used by generator — verify. `svgo` unreferenced. | Drop `svgo`; confirm `@blocknote/core` on generator before touching. | S | DEAD-006 |
| 11 | T1-KNIP-011 | `packages/radiants/icons/manifest.ts` | low | unused-exports | 3 unused exports + 1 unused type in a 5315-LOC generated manifest. | Regenerator owns this — no manual edit. Consider pruning generator output. | S | |
| 12 | T1-KNIP-012 | `packages/radiants/eslint/utils.mjs` | low | unused-exports | 3 unused helper exports. | Verify no external import (knip only sees workspace); if confirmed, drop. | S | |
| 13 | T1-KNIP-013 | `packages/radiants/pixel-icons/source.ts` | low | unused-types | 3 type aliases unused. | Drop. | XS | |
| 14 | T1-KNIP-014 | `knip.json` | low | stale-ignores | 22 configuration hints: `ignoreFiles` / `ignoreWorkspaces` / `ignoreDependencies` entries no longer point at valid paths (e.g. removed `contract/system.ts`, `lib/no-legacy-color-format.mjs`, `patterns/pretext-*.ts`, `tools/*`, `templates/*`, `@chenglou/pretext` ignoreDep). | Trim `knip.json` per `tools/knip.txt` suggestions. | S | DEAD-008 |
| 15 | T1-KNIP-015 | `packages/ctrl` workspace entry in `knip.json` | low | missing-entry | knip warns: "Add `entry` and/or refine `project` files in workspaces[packages/ctrl]". Package has no explicit entry — knip uses default. | Add `"entry": ["index.ts", "{controls,selectors,readouts,layout}/index.ts", "**/*.meta.ts"]`. | S | T1-KNIP-001 |
| 16 | T1-KNIP-016 | `packages/ctrl/selectors/TransportButton/TransportButton.meta.ts` + 25 others | low | meta-false-positive-documentation | Flagged because knip doesn't know about the registry's dynamic import pattern. | (Resolved by T1-KNIP-001 fix.) | — | |

## Cross-lane clusters

- `AppWindow.tsx` appears in T1-KNIP-005/006 + TYPE-001 + LEGACY-001 + COMMENT-002 + DEFENSIVE-001 + REACT-006 = **6 lanes**. Single hot zone deserving a dedicated refactor pass.
- `ctrl-preview/page.tsx` appears in T2-DEEP-01 + REACT-001 + DEDUP-001 + RDNA-002/004/009 = **6 lanes**.
- The 41-file duplicate-export pattern (T1-KNIP-005) is a one-regex sweep that knocks out the largest finding bucket.
