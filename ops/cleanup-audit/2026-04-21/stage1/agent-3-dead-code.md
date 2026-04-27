# Lane 3 — Dead Code (2026-04-21)

**Seed:** knip unused-files + depcruise orphans + `query_graph importers_of` spot checks.
**Cap:** 20.
**Total findings:** 8.

| # | ID | File | Line | Severity | Category | Finding | Suggested fix | Effort | Cross-lane |
|---|---|---|---|---|---|---|---|---|---|
| 1 | DEAD-001 | `packages/ctrl/controls/ScrubSurface/ScrubSurface.tsx` | whole file | high | orphan-component | Only importer is `apps/rad-os/app/ctrl-preview/page.tsx:13` via a deep path that bypasses ctrl's package exports. Not in `packages/ctrl/controls/index.ts`. File is an orphan per depcruise. | Either (a) add to `controls/index.ts` exports + switch ctrl-preview to the barrel, or (b) delete if superseded by `ScrubSurface` behavior baked into Knob/NumberScrubber. | S | T2-DEPCRUISE-orphan, T2-DEEP-01 |
| 2 | DEAD-002 | `packages/ctrl/selectors/ColorPicker/ColorPicker.tsx` | whole file | high | orphan-component | Same pattern — only ctrl-preview:16 imports it via a deep path. Not in `selectors/index.ts`. | Same as DEAD-001: expose through barrel or delete. | S | T2-DEPCRUISE-orphan, T2-DEEP-01 |
| 3 | DEAD-003 | `packages/ctrl/controls/**/*.meta.ts` (26 files) | whole files | med | meta-file-orphans | Knip reports 26 `.meta.ts` files as "unused files". These are loaded dynamically at runtime by `@rdna/preview` / registry scanners; **not actually dead**. False positives, but they wrong-foot the audit. | Add `packages/ctrl/**/*.meta.ts` to `knip.json` `ignoreFiles` under the ctrl workspace entry (mirror what radiants has). | XS | T1-KNIP-unused-files |
| 4 | DEAD-004 | `packages/radiants/test/icon-public-types.typecheck.tsx` | whole file | low | orphan-typecheck | Unused — likely residue of a prior `tsc --noEmit` smoke test. | Either wire back into the typecheck command or delete. | XS | T1-KNIP-unused-files |
| 5 | DEAD-005 | `packages/ctrl/package.json` → `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event` | devDeps | high | unused-devDeps | Knip flags three `@testing-library/*` devDeps as unused. `grep`-confirmed: `packages/ctrl/` has zero test files. | Remove all three from `packages/ctrl/package.json`. | S | T1-KNIP-devDeps |
| 6 | DEAD-006 | `packages/radiants/package.json` → `@blocknote/core`, `svgo` | devDeps | high | unused-devDeps | Knip flags both. `@blocknote/core` usage is in `packages/radiants/generated/blocknote-blocks.tsx` (generated) — regenerator consumes it but the dev build may not. `svgo` is not referenced by any source or script in radiants. | Verify generator entrypoint; if `@blocknote/core` is only for regeneration, keep but document; drop `svgo`. | S | T1-KNIP-devDeps |
| 7 | DEAD-007 | `packages/radiants/eslint/contract.mjs` → `packages/radiants/generated/eslint-contract.json` | line 12 | med | cross-workspace-deep | Only depcruise warning standing: `contract.mjs` reads `generated/eslint-contract.json` via deep path. Not dead — ESLint plugin internals. | Keep (intentional internal wiring). Document the intentional cross-surface read in a one-line comment. | XS | T2-DEPCRUISE |
| 8 | DEAD-008 | `knip.json` → `packages/radiants` workspace ignored files list | various | low | stale-knip-ignore | Knip itself reports that most `packages/radiants/**/*.ts` paths in `knip.json` `ignoreFiles` are no longer reachable (22 configuration hints). | Remove stale entries: `contract/system.ts`, `eslint/lib/no-legacy-color-format.mjs`, `patterns/pretext-*.ts`, `scripts/generate-figma-contracts.ts`, etc. See `tools/knip.txt` for full list. | S | T1-KNIP-config-hints |

## Confirmed NOT dead (depcruise false positives)

- `apps/rad-os/hooks/useSafeHover.ts` — used by `StartMenu.tsx`.
- `apps/rad-os/lib/windowSizing.ts` — used by `store/slices/windowsSlice.ts`, `components/Rad_os/AppWindow.tsx`, `lib/apps/catalog.tsx`.
- `apps/rad-os/lib/asset-downloads.ts` — used by `typography-data.ts`.
- `apps/rad-os/lib/mockData/tracks.ts` — used by `Radio.tsx`, `Taskbar.tsx`, `radRadioSlice.ts`.
- `apps/rad-os/app/apple-icon.tsx`, `apps/rad-os/app/icon.tsx` — Next.js magic route files (no static importer by design).
- All `types.ts` barrel files flagged as orphans — re-exported via `../*.ts` namespace exports that depcruise can't trace without tsconfig paths.

## Two routes for DEAD-001/002

If preserved: add to `packages/ctrl/{controls,selectors}/index.ts` barrels + remove deep imports in ctrl-preview. Resolves all 32 `T2-DEEP-01` findings in one stroke.
If removed: confirm ctrl-preview page no longer needs the demo.
