# Agent 7 — Legacy & Compatibility Shim Removal

Read-only Stage 1 audit. HEAD `d658b2b5`, branch `main`, clean tree.

Classification notes:
- `legacy_path`: referenced-but-obsolete code whose migration target is fully rolled out (or whose feature flag is dead).
- `keep_with_reason`: intentional backward-compat, data migration, planned future target, or protected per guardrails.

The backward-compat alias block in `packages/radiants/tokens.css` (lines 100–107) is explicitly protected by the guardrails and is NOT proposed for removal.

---

## Summary

| Count | Classification |
| --- | --- |
| 6 | legacy_path |
| 6 | keep_with_reason |

No always-on/always-off feature flags were found. The only runtime env branches (`CI`, `VITEST`, `NODE_ENV`, `RDNA_REGISTRY_GUARD_SKIP_PACKAGE`) are all actively meaningful (CI config, CLI-vs-test guard, dev warning, recursion guard). No `if (false)` / `if (true)` unreachable branches were found. The only `TODO` markers live in vendored Dotting code carrying explicit `@ts-nocheck` banners and are out of scope.

---

## Findings, ordered by confidence

### LEGACY-001 — `GoodNewsApp.tsx` re-export shim for `GoodNewsLegacyApp` (legacy_path, 0.93)
**File:** `apps/rad-os/components/apps/GoodNewsApp.tsx:1-7`
Entire file is a 7-line `'use client'` re-export:
```tsx
export {
  GoodNewsLegacyApp as GoodNewsApp,
  GoodNewsLegacyApp as default,
} from './goodnews/GoodNewsLegacyApp';
```
The only importers are the app catalog (`apps/rad-os/lib/apps/catalog.tsx:9`, dynamic `lazy(() => import('@/components/apps/GoodNewsApp'))`) and the rollback test (`apps/rad-os/test/good-news-rollback.test.tsx:3`). The file exists as a rollback trampoline from a broadsheet-wrapper refactor that was reverted; both the catalog import and the test could point at `./goodnews/GoodNewsLegacyApp` directly. Blast radius: low. See also Agent 1/Agent 8 overlap potential.

### LEGACY-002 — Deprecated `AppWindowBody` / `AppWindowSplitView` / `AppWindowPane` exports (legacy_path, 0.88)
**File:** `packages/radiants/components/core/AppWindow/AppWindow.tsx:384-444, 1071-1078`
All three are marked `@deprecated` in favor of `<AppWindow.Content layout=... ><AppWindow.Island>`. Full-repo grep confirms **no runtime consumer in `apps/rad-os/` or any other `packages/*`** imports `AppWindowBody`, `AppWindowSplitView`, `AppWindowPane`, `AppWindow.Body`, `AppWindow.SplitView`, or `AppWindow.Pane`. The only remaining references are the AppWindow test file (`AppWindow.test.tsx`), the generated figma contract (`generated/figma/contracts/app-window.contract.json`), the generated schema (`AppWindow.schema.json`), and the component's own `AppWindow.meta.ts`. Migration is complete. Blast radius: high (package root barrel `components/core/index.ts`, public exports, meta/schema contracts). Escalate to coordinator — removing requires regenerating figma contracts and schema.

### LEGACY-003 — Deprecated `useTabsState` hook export (legacy_path, 0.88)
**File:** `packages/radiants/components/core/Tabs/Tabs.tsx:417-459`, barrel `packages/radiants/components/core/index.ts:17`
Marked `@deprecated Use <Tabs defaultValue={...} mode={...}> directly.` with an explicit `// Backward compat:` banner and a layout-to-position map that only matters for legacy callers. Repo-wide grep shows **only three consumers: the smoke test at `packages/radiants/components/core/__tests__/smoke.test.tsx:11`, the backward-compat test at `Tabs.test.tsx:231-236`, and the docs/archive plan files.** No `apps/rad-os/**` usage; the Tabs refactor documented in `docs/plans/2026-03-30-tabs-coherent-refactor.md` is fully rolled out across RadOS, WindowTabs, BrandAssetsApp, RadiantsStudioApp, and runtime-attachments demos. Blast radius: high (package barrel export, listed in `contract-surface` test). Escalate to coordinator.

### LEGACY-004 — Deprecated `Input.iconName` prop (legacy_path, 0.85)
**File:** `packages/radiants/components/core/Input/Input.tsx:20, 237, 243, 278-284`; meta `packages/radiants/components/core/Input/Input.meta.ts:26`
`iconName` is `@deprecated Use icon prop instead`. Repo-wide grep shows **no runtime caller** passes `iconName=` to `<Input>` anywhere in `apps/rad-os/**`, `packages/**/components/**`, or elsewhere. The prop remains wired through the component (data-icon-slot div for external icon consumer hook) but no consumer uses it; the `icon` prop is used everywhere instead. Blast radius: medium (public prop contract, meta file). The component's internal handling of `iconName` (the `hasIcon = Boolean(icon || iconName)` OR and the `data-icon-slot` placeholder) is legacy and can be collapsed to `icon` only.

### LEGACY-005 — `iconSet` forwarded to `<Icon>` in runtime-attachments demo (legacy_path, 0.86)
**File:** `packages/radiants/registry/runtime-attachments.tsx:359, 363`
The Icon demo still accepts `iconSet` and spreads it onto `<Icon iconSet={...}>`. Per CLAUDE.md and `packages/radiants/eslint/rules/no-arbitrary-icon-size.mjs:30`, `iconSet` was removed: *"The `iconSet` prop has been removed. Size now determines the icon set directly."* `Icon.tsx` (`packages/radiants/icons/Icon.tsx:8-21`) no longer declares `iconSet` in its `IconProps`. The conditional spread at line 363 is therefore dead — nothing in the system produces `iconSet` — and actively inserts an unknown prop if ever called. Blast radius: low.

### LEGACY-006 — Legacy titlebar portal-slot fallback in `AppWindow` (legacy_path, 0.82)
**File:** `packages/radiants/components/core/AppWindow/AppWindow.tsx:378-379`
```tsx
{/* Registered nav content, or portal slot for legacy apps */}
{navContent || <div id={`window-titlebar-slot-${id}`} className="contents" />}
```
The brainstorm `ideas/brainstorms/2026-03-29-appwindow-taskbar-api-brainstorm.md:89` describes this as a temporary shim *"When to remove the raw `window-titlebar-slot-${id}` portal pattern. Probably keep it for a release cycle after migration."* Migration is complete — no code uses `createPortal` targeting the slot, and no `getElementById('window-titlebar-slot-...')` call exists anywhere under `apps/` or `packages/`. Blast radius: low (internal). The branch collapses to `{navContent}`.

### LEGACY-007 — `legacyEnum` cast in `PropControls.getEnumValues` (legacy_path, 0.80)
**File:** `packages/radiants/registry/PropControls.tsx:45-53`
The `PropDef` type in `packages/preview/src/types.ts:13-21` has no `enum` field — only `values` and `options`. No `*.meta.ts` file or generated `.schema.json` in the repo uses `enum:` for prop definitions (verified via ripgrep). The cast `(prop as PropDef & { enum?: Array<string | number> }).enum` is therefore a dead backward-compat branch from before the meta-first generator was authoritative. Blast radius: low (local helper only).

### PRETEXT-LEGACY-008 — `components/apps/pretext/legacy.ts` has no runtime consumer (borderline, 0.70, report-only)
**File:** `apps/rad-os/components/apps/pretext/legacy.ts` (70 lines)
Exports `LegacyScratchpadDraft`, `PretextScratchpadDraft`, `ScratchpadDraft`, and `coerceStoredDoc`. Only importer is `apps/rad-os/test/pretext-serialization.test.ts`. The actual `ScratchpadApp.tsx` uses `./scratchpad/use-scratchpad-docs.ts`, which has its own BlockNote-only migration (`LEGACY_KEY = 'rados-scratchpad'`). This file appears to be pre-staged scaffolding for a pretext→scratchpad migration that has not shipped. Whether this is "legacy" or "future-scaffolding" depends on product direction; report-only and defer to Agent 3 (dead-code) if the pretext-scratchpad fold-in is confirmed not planned.

---

## Keep with reason (explicit callouts)

### KEEP-001 — `packages/radiants/tokens.css:100-107` backward-compat alias block
Explicitly protected by the run's guardrails. Not proposed for removal. Referenced by `tokens.css` utility chain rules and `packages/radiants/test/theme-compat.test.ts`.

### KEEP-002 — `plugin.configs['recommended-strict']` in `packages/radiants/eslint/index.mjs:101-121`
CLAUDE.md and `packages/radiants/eslint/__tests__/plugin-configs.test.mjs:69-73` treat this as a "migration target" that is intentionally *not yet activated*. It is a forward-looking tier, not legacy.

### KEEP-003 — `PatternEntry.legacyName` field in `packages/radiants/patterns/types.ts:21`
Referenced at runtime by `getPatternByName` (`packages/radiants/patterns/index.ts:9`) which allows callers to look up a pattern by its old System-6 name. `Pattern.test.tsx:61-67` verifies `<Pattern pat="checker-32" />` (legacy name) still resolves. Removing this would break the public `<Pattern>` API.

### KEEP-004 — `LEGACY_ALIASES` in `packages/radiants/scripts/pixel-corners.config.mjs:49-55`
Generates the `pixel-rounded-xs/sm/md/lg/xl` classes that are consumed by **40+ components** across `packages/radiants/components/core/**`, `apps/rad-os/components/apps/BrandAssetsApp.tsx`, and `templates/rados-app-prototype/**`. Active, not legacy.

### KEEP-005 — `LEGACY_KEY = 'rados-scratchpad'` migration in `use-scratchpad-docs.ts:12, 71-89` and `store/index.ts:38-42`
Both are active data migrations that read + delete old localStorage keys for live users. Standard versioned migration, not legacy cruft.

### KEEP-006 — `Checkbox.tsx:277` "backwards compat with checked/onChange API" comment
Real standalone mode path used when the component is not inside a `RadioGroup.Root`. Active, not legacy.

---

## Feature flag summary

No effectively-dead feature flags discovered. All env branches found are meaningful:

| Flag | Location | Purpose | Status |
| --- | --- | --- | --- |
| `process.env.CI` | `apps/rad-os/playwright.config.ts:6-23` | Playwright CI tuning | active |
| `process.env.VITEST` | `packages/preview/src/generate-schemas.ts:204` | CLI vs test import-safety | active |
| `process.env.NODE_ENV !== 'production'` | `packages/radiants/components/core/AppWindow/AppWindow.tsx:598` | Dev warning (Content-in-Content) | active |
| `RDNA_REGISTRY_GUARD_SKIP_PACKAGE` | `scripts/registry-guard-lib.mjs:29`, set by `scripts/with-registry-guard.mjs:33` | Recursion guard when the guard script invokes pnpm | active |
