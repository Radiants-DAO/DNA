# Agent 2 — Type Consolidation (Stage 1)

**Dispatched:** 2026-04-16
**HEAD:** d658b2b568bdb0ff4921f83c4ada8bcedd76df55
**Scope:** TypeScript types, interfaces, and enums across `apps/rad-os`, `packages/radiants`, `packages/ctrl`, `packages/pixel`, `packages/preview`, `packages/create`. Excluded: `templates/*` (scaffold source), `packages/create/templates/*` (synced copy), `packages/radiants/generated/*` (generated), `archive/*`, `docs/*`.

## Verdict

The repo already concentrates its cross-package contracts in `@rdna/preview` (one canonical copy of `ComponentMeta`, `PropDef`, `PreviewState`, `ComponentCategory`, etc.) and in `@rdna/pixel` (canonical `PixelGrid`, `PixelCornerSet`, `TransitionMode`). Those boundaries are healthy.

The systemic drift is **inside component folders**, where the `.meta.ts` and `.tsx` both redeclare a local `<Component>Props` interface describing the same public contract. The `.meta.ts` copy exists only to generic-constrain `defineComponentMeta<TProps>()`; there is no static link back to the `.tsx` implementation. Several are already drifting (Switch: meta omits `name`, `required`, `readOnly`, `className`; Dialog: `onOpenChange` typed as `"string"` in meta; Popover: `onOpenChange` typed as `"string"`).

The cleanest fix is the pattern that Button/Meter/Input already use: export the authored enum types (or the full prop shape via a `.types.ts`) from a single file and have the sibling import it. The `.meta.ts` is the authoritative source per the dispatch guardrail, so the `TProps` generic should resolve to a type that the runtime `.tsx` also imports — either from `.meta.ts` directly (Button, Meter) or from a shared `.types.ts` (Input).

This is a low-blast-radius, high-clarity refactor per file. It stays within one package per move (no copy-on-import boundaries crossed).

## Findings (severity × confidence, high → low)

1. **TYPE-001** — Cross-module `IconProps` name collision inside radiants (3 distinct shapes sharing one identifier). (high, 0.95)
2. **TYPE-002** — `.meta.ts` generic type drifted from `.tsx` public contract for Switch (missing 4 props). (medium, 0.95)
3. **TYPE-003** — `.meta.ts` generic uses `"string"` where runtime uses `(open) => void` for Dialog/Popover/Combobox `onOpenChange`. (medium, 0.92)
4. **TYPE-004** — Duplicated `<Component>Props` interface pattern across ~25 meta/tsx pairs (consolidation candidate, same-package). (medium, 0.90)
5. **TYPE-005** — `Avatar` enum aliases (`AvatarSize`, `AvatarShape`) authored in `.tsx` but redeclared inline in `.meta.ts`; Button/Meter already solve this. (medium, 0.88)
6. **TYPE-006** — `Card` enum aliases (`CardVariant`, `CardRounded`) authored in `.tsx` but redeclared inline in `.meta.ts`. (medium, 0.88)
7. **TYPE-007** — `Alert` enum alias (`AlertVariant`) authored in `.tsx` and redeclared inline in `.meta.ts`. (medium, 0.88)
8. **TYPE-008** — `ChipTag` prop type duplicated verbatim between `.meta.ts` and `.tsx` (cross-package, ctrl). (medium, 0.92)
9. **TYPE-009** — `SwitchSize` (Switch.tsx) shadows `InputSize` / `ControlSize` — three identical `'sm'|'md'|'lg'` aliases across sibling components. (low, 0.70; report-only)
10. **TYPE-010** — `EditorialSettings`/`BroadsheetSettings`/`BookSettings` live in `apps/rad-os/components/apps/pretext/types.ts`; likely authoritative, but flagged because pretext primitives have their own layout files that may re-stamp these fields inline (verification required). (low, 0.70; report-only)

## Key Constraints Applied

- `.meta.ts` is authoritative (dispatch rule) — every proposed action **exports a shared type** (or imports from `.meta.ts`) rather than deleting `.meta.ts`.
- Copy-on-import boundary preserved — `apps/rad-os/components/Rad_os/AppWindow.tsx` and `packages/radiants/components/core/AppWindow/AppWindow.tsx` are intentional copies; no consolidation proposed across that boundary. The app wrapper's `AppWindowProps` is a narrowing app-local prop shape over the package component — correct by design.
- `templates/rados-app-prototype/` and `packages/create/templates/` contain type duplicates (`WindowState`, `WindowsSlice`, `WindowSize`, `AppProps`, `StartMenuSection`) that are intentional scaffold sources. Not flagged.
- `packages/radiants/generated/figma/tokens.d.ts` contains auto-generated types; not flagged.
- Blocks and archives (`docs/**`, `archive/**`) contain type echoes of repo code in plan documents; not flagged.

## Rejected / Non-findings

- **AppWindowProps duplication** (apps/rad-os vs packages/radiants) — intentional copy-on-import.
- **Badge/Card/Avatar extending `VariantProps<typeof *Variants>`** — the `.tsx` side derives from CVA while `.meta.ts` has a narrower authored shape for registry metadata; derivations don't make a consolidation target, only the plain enum aliases do (see TYPE-005/006/007).
- **`Tooltip` in `@rdna/ctrl` vs `@rdna/radiants`** — different packages, different shapes; non-issue.
- **`Point2D` (ctrl) vs `Point` (chenglou-pretext)** — different domains; module-augmentation declaration owned by third-party; non-issue.
- **`MeterProps` in `ctrl/primitives/types.ts` vs `packages/radiants/components/core/Meter/Meter.meta.ts`** — different components in different packages (hardware meter vs HTML meter); non-issue.

## Ownership Table

| Concept | Canonical owner | Notes |
|---|---|---|
| Component contract types (`PropDef`, `ComponentMeta`, etc.) | `packages/preview` | Already the owner. |
| Pixel primitives (`PixelGrid`, `PixelCornerSet`, `TransitionMode`, `CornerPosition`) | `packages/pixel` | Already the owner. `pixel-icons/types.ts` correctly re-exports. |
| Icon SVG component contract (`IconProps` = SVGProps extension) | `packages/radiants/icons/types.ts` | Already the owner. |
| Icon dynamic-loader component contract (`IconProps` in `Icon.tsx`) | `packages/radiants/components/core/Icon/Icon.meta.ts` | Needs rename (`DynamicIconProps`) and cross-file import to remove the collision with `icons/types.ts`'s `IconProps`. |
| Control size preset (`'sm'|'md'|'lg'`) | `packages/ctrl/primitives/types.ts` → `ControlSize` | Shared across Radiants Switch / Input if the three packages cross-depended; they don't, so report-only. |
| Window state shape | `apps/rad-os/store/slices/windowsSlice.ts` | `useWindowManager.ts` already re-exports; correct. |

## Verification Plan (common across findings)

- `pnpm turbo typecheck --filter=@rdna/radiants --filter=@rdna/ctrl --filter=rad-os`
- `pnpm lint:design-system` for any component edits
- `pnpm --filter @rdna/radiants registry:generate` after prop-type changes so `.schema.json` outputs stay consistent

## Blocked / Dirty-file Conflicts

None — working tree is clean per the dispatch snapshot.
