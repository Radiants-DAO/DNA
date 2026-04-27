# impl-03: Catalog shim inlining

Removed three pass-through app shells and pointed catalog/test at the real modules.

## Shims deleted
- `apps/rad-os/components/apps/ManifestoApp.tsx`
- `apps/rad-os/components/apps/StudioApp.tsx`
- `apps/rad-os/components/apps/GoodNewsApp.tsx`

All three confirmed pure pass-throughs (no logic, no conditional rendering). Manifesto's `AppProps` destructure (`windowId: _windowId`) was discarded — `ManifestoBook` takes no props.

## Consumers rewired
- `apps/rad-os/lib/apps/catalog.tsx` — three `lazy()` imports repointed:
  - `ManifestoApp` → `@/components/apps/manifesto/ManifestoBook` (named export, mapped to `default` in the `.then`).
  - `StudioApp` → `@/components/apps/studio/PixelArtEditor` (has `export default`, no mapping needed).
  - `GoodNewsApp` → `@/components/apps/goodnews/GoodNewsLegacyApp` (named export, mapped to `default`).
- `apps/rad-os/test/good-news-rollback.test.tsx` — import switched to `{ GoodNewsLegacyApp as GoodNewsApp } from '@/components/apps/goodnews/GoodNewsLegacyApp'`.

Lazy loading preserved for all three catalog entries; local const names (`ManifestoApp`, `StudioApp`, `GoodNewsApp`) left intact so the `APP_CATALOG` entries still resolve.

## Skipped
None — no extra consumers, no real logic in any shim. Docs/archive/ops references are historical and left untouched.
