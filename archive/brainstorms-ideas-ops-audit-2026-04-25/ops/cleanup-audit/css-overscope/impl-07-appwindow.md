# Impl 07 — AppWindow Refactor

## LOC delta
- `AppWindow.tsx`: **1188 → 1135** (−53 LOC, −4.5%)
- `appwindow.css`: 82 → 75 (−7)

## Sub-components

| Name | Change |
|---|---|
| `AppWindow.Banner` | **Deleted** (F3). No consumer files in apps/; only tests referenced it. |
| `AppWindowContent` | Flattened (F4, F14). Single/bleed layouts now render children directly under `[data-aw="stage"]`; only `split`/`sidebar`/`three` emit the inner `[data-aw="layout"]` row. |
| `AppWindowIsland` | Unified (F5–F8). One branch: always emits `data-aw="island"` + `data-corners` + `data-scroll` + `data-pad`. `min-h-0` removed from JSX, CSS-owned. `island-pad` div only emitted when a padding class is set. |
| `AppWindowTitleBar` | F1/F2. Dropped `className="relative"` outer wrapper. Button group kept as a single `data-aw="titlebar-controls"` child (needs `gap-1`, titlebar gap is `gap-3`). Nav slot uses `data-aw="titlebar-nav"` when present; fallback portal stays as a `display: contents` shim so it contributes no box. |
| `ToolbarNode` | **New** shared component (F9). Used by both the in-chrome render and the no-context test render. |
| `ResizeHandles` | **New** — 8 handles driven by a `RESIZE_HANDLES` array (F10). |

## Consumer files updated
**Zero app consumers of `AppWindow.Banner`** — grep across `apps/**` returned no matches outside the core package's own tests. Only the core test file (`AppWindow.test.tsx`) used it. Everyone else (`LabApp`, `BrandApp`, `AboutApp`, `PixelPlayground`, `PixelArtEditor`, `ScratchpadApp`, `GoodNewsLegacyApp`, `LogoMaker`, `ColorsTab`) uses `Content` / `Island` only — those APIs are unchanged in shape.

## DOM nodes saved per window render

Baseline (single-layout, one island, standard chrome, focused, resizable):
- Titlebar: −1 (collapsed `<div className="relative">` + inner controls wrapper into a single `data-aw="titlebar-controls"` wrapper; outer relative killed. Net −1.)
- Titlebar: −1 (when no nav, the fallback `flex-1 min-w-0` wrapper around the `contents` slot is gone. Net −1.)
- Content: −1 (single layout no longer emits inner `[data-aw="layout"]`).
- Island (standard, scroll): 0 net (`island-pad` kept, still needed for padding); −1 when `padding="none"` (pad div elided).

**Typical window: −3 DOM nodes.** With `padding="none"` island: −4.

No changes when `AppWindow.Banner` was present — that sub-component wasn't rendered in prod anyway (no consumers).

## Deferred findings

- **F11 (inactive-dim pattern overlay → `::before`)**: deferred. The existing test pins the exact `.rdna-pat.rdna-pat--diagonal-dots` class strings on a real element + checks the `--pat-color` inline style. Converting to `::before` would require rewriting the test to query computed style on the parent, which is flaky in JSDOM. Low-priority finding per the brief; cost/risk not worth it.
- **F12 (chromeless + standard shell DRY)**: partially done. One shared `<div data-aw="window">` now owns both cases; the interior is an inline `isChromelessWindow ? … : …` branch. Still two distinct children subtrees (chromeless passes children through the context provider directly; standard emits titlebar + toolbar + children + resize handles). Going further would smuggle presentational concerns into shared helpers for no real saving.
- **F13 (RadOS wrapper prop sprawl)**: out of scope — the audit note itself marked it as a nit with no DOM impact.

## Verification

- `pnpm --filter @rdna/radiants generate:schemas` — regenerated all 41 schemas cleanly. `AppWindow.schema.json` no longer lists `AppWindow.Banner`.
- `pnpm exec vitest run components/core/AppWindow` — **PASS (26 tests, 0 failures)**. Test updates: removed `Banner` describe block, flipped `single layout` + `default layout is single` assertions to confirm the inner `[data-aw="layout"]` no longer exists for single, and switched the Island `min-h-0` inline-class check to a `data-aw` presence check (CSS owns `min-h-0`).
- `npx tsc --noEmit -p packages/radiants` — **clean, no errors**.
- `npx tsc --noEmit -p apps/rad-os` — only 9 pre-existing errors in `lib/icon-conversion-review.ts` (unrelated to this refactor); no AppWindow-related breakage.

## Data-aw attribute contract (preserved + extended)

Preserved: `window`, `titlebar`, `toolbar`, `stage`, `layout`, `island`, `island-scroll`, `island-pad`.

**Added** (new hooks for the consolidated JSX):
- `titlebar-controls` — button group, CSS owns tight `gap-1`.
- `titlebar-nav` — rendered nav container with `flex-1 min-w-0`.
- `data-corners` / `data-scroll` / `data-pad` on `[data-aw="island"]` — expose island configuration to CSS for future styling drift containment.

**Removed**: `banner` (sub-component deleted).
