# Lane 2 — Missing / Loose TypeScript (2026-04-21)

**Seed:** knip unused-types + grep for `any` in source.
**Cap:** 20.
**Total findings:** 5.

| # | ID | File | Line | Severity | Category | Finding | Suggested fix | Effort | Cross-lane |
|---|---|---|---|---|---|---|---|---|---|
| 1 | TYPE-001 | `packages/radiants/components/core/AppWindow/AppWindow.tsx` | 12, 20, 25, 38, 82, 93, 101, 109, 114, 120, 122 | med | dead-type-exports | Eleven exported types (`SnapRegion`, `AppWindowPosition`, `AppWindowSize`, `AppWindowProps`, `AppWindowBodyProps`, `AppWindowNavProps`, `AppWindowNavItemProps`, `AppWindowToolbarProps`, `AppWindowContentProps`, `ContentLayout`, `AppWindowIslandProps`) are unused outside the file. `AppWindow.Body/Split/Pane` were deprecated in the 2026-04-16 audit (wave 6, `LEGACY-002/003/006`). These are the vestigial types. | Remove or downgrade to `type`-only internal. Must land with the wave-6 public-API removal. | M | LEGACY-001, T1-KNIP-unused-types |
| 2 | TYPE-002 | `packages/radiants/components/core/Tabs/Tabs.tsx` | 15, 16, 17, 18, 19 | med | dead-type-exports | `TabsMode`/`TabsPosition`/`TabsTone`/`TabsSize`/`TabsAlign` exported but never imported outside Tabs.tsx. Some may be consumed via `Tabs.meta.ts`. | Verify consumers (`grep "TabsMode" -r`) then remove. | S | T1-KNIP-unused-types |
| 3 | TYPE-003 | `packages/radiants/components/core/_shared/ModalShell.tsx` | 50, 68, 89, 114, 128 | low | dead-internal-types | Five `Shell*Props` interfaces exported but shell is consumed via `ModalShell.*` compound only — internal prop types. | Mark `interface ShellHeaderProps` etc. as internal (drop `export`). | S | T1-KNIP-unused-types |
| 4 | TYPE-004 | `apps/rad-os/lib/dotting/utils/eventDispatcher.ts` | 2 | med | weak-callback-type | `type EventCallback = (...args: any[]) => void` — only real `any` in source (vendored Dotting code). | Vendored code — keep, or type as `(...args: unknown[]) => void` if downstream consumers allow. Flag to owner. | S | WEAK-001 |
| 5 | TYPE-005 | `packages/radiants/components/core/AppWindow/AppWindow.tsx` | 1182 | low | default-export-unused | `export default AppWindow` — default export unused (consumers use named `{ AppWindow }`). Systemic across 40+ components (see T1-KNIP). | Drop default exports monorepo-wide in a single sweep. | S | T1-KNIP-duplicates |

## Observations

- Source code has **0** `any` usages outside `lib/dotting/utils/eventDispatcher.ts` (vendored) and generated `.next/` output. This is unusually clean — the weak-types lane has near-nothing left to catch.
- No `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` in non-vendored source.
- `react-draggable` imports in `AppWindow.tsx` and `TemplatePreview.tsx` use implicit module types (no explicit type imports) — fine, types come with the package.
