# 06 — Brand Assets CSS Over-scope Audit

Scope: LogoMaker, BrandAssetsApp, colors-tab (FibonacciMosaic, ColorCards, ColorsTab, SemanticView, ColorDetail).

## Findings

### F1: `BrandColorCard` double-wraps the card chrome — High
- File: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorCards.tsx:12-14`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="pixel-rounded-sm pixel-shadow-raised h-full">
    <div className="h-full flex flex-col">
      {/* Swatch */}
      <div ... />
  ```
- Proposal: Merge the two wrappers into a single `<div className="pixel-rounded-sm pixel-shadow-raised h-full flex flex-col">`.
- Why safe: No background/overflow on the outer div; the inner `h-full flex flex-col` has no styling conflicts with the pixel-rounded shell.

### F2: `ExtendedColorSwatch` has a no-op inner `<div>` — High
- File: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorCards.tsx:58-60`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="pixel-rounded-sm pixel-shadow-raised">
    <div>
      {/* Swatch */}
      ...
  ```
- Proposal: Delete the empty `<div>` — children go straight into the pixel-rounded shell.
- Why safe: Inner div has zero classes/styles; it exists only as a JSX grouping parent.

### F3: `SemanticCategoryCard` has a no-op inner `<div>` — High
- File: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorCards.tsx:150-152`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="pixel-rounded-sm">
    <div>
      {/* Header */} ...
  ```
- Proposal: Remove inner `<div>`; header/column-headers/rows become direct children of the pixel-rounded shell.
- Why safe: Inner `<div>` has no layout role (no flex/grid/padding).

### F4: `SrefCard` extra `pixel-rounded-sm` shell around a bare `<div>` — Med
- File: `apps/rad-os/components/apps/BrandAssetsApp.tsx:78-80`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="pixel-rounded-sm">
    <div className="bg-page p-2">
      <Button ...>
  ```
- Proposal: Single wrapper `<div className="pixel-rounded-sm bg-page p-2">`.
- Why safe: `pixel-rounded-*` uses `clip-path` + `::after`; adding `bg-page` + `p-2` to the same element is the standard pattern (no border/overflow-hidden present).

### F5: `SrefCard` image tile triple-wraps a single `<img>` — Med
- File: `apps/rad-os/components/apps/BrandAssetsApp.tsx:86-90`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div key={i} className="pixel-rounded-sm aspect-square">
    <div className="bg-rule relative w-full h-full">
      <img ... className="absolute inset-0 w-full h-full object-cover" />
    </div>
  </div>
  ```
- Proposal: Collapse to one `<div className="pixel-rounded-sm aspect-square bg-rule relative">` with the `<img>` inside.
- Why safe: Outer sets ratio/corners, inner only adds `bg-rule` + positioning context — both belong on the same element; `<img>` already absolute-positions itself.

### F6: `LogoMaker` center island has redundant flex-col shell — Med
- File: `apps/rad-os/components/apps/brand-assets/LogoMaker.tsx:213-222`
- Pattern: pass-through / duplicate-layout
- Current:
  ```tsx
  <AppWindow.Island corners="pixel" padding="md" noScroll className="flex-1">
    <div className="flex flex-col h-full gap-3">
      <div className="shrink-0 flex justify-center">
        <VariantPicker ... />
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center" dangerouslySetInnerHTML={...} />
    </div>
  </AppWindow.Island>
  ```
- Proposal: Pass `className="flex-1 flex flex-col gap-3"` to the Island (noScroll already sets `h-full` on the inner pad div — see AppWindow.tsx:555), dropping the wrapper `<div>`.
- Why safe: `AppWindow.Island` in `noScroll` mode renders `<div className="h-full {padding}">{children}</div>` (AppWindow.tsx:555), so children already get a full-height host; adding flex on the Island's outer class is the exposed hook.

### F7: `LogoMaker` left + right islands wrap controls in a single flex-col — Low
- File: `apps/rad-os/components/apps/brand-assets/LogoMaker.tsx:146-209, 227-302`
- Pattern: wrapper-collapse
- Current: `<AppWindow.Island ...><div className="flex flex-col gap-4">...</div></AppWindow.Island>` (twice).
- Proposal: Allow passing `className` with `flex flex-col gap-4` onto the Island (already supported), dropping the inner wrapper.
- Why safe: Island's padding class is already applied inside; Tailwind composes `flex flex-col gap-4` alongside `p-*` without conflict. Requires one-line check that Island `padding` class stays outside (it is — see AppWindow.tsx:566/579).

### F8: `ColorsTab` palette variant has redundant `relative/absolute-inset-0` frame — Med
- File: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorsTab.tsx:41-49`
- Pattern: duplicate-layout
- Current:
  ```tsx
  <div className="relative flex-1 min-h-0 overflow-hidden">
    <div className="absolute inset-0">
      <FibonacciMosaic ... />
    </div>
  </div>
  ```
- Proposal: Collapse to `<div className="flex-1 min-h-0"><FibonacciMosaic ... /></div>`; mosaic already sizes to `w-full h-full`.
- Why safe: FibonacciMosaic's root is `grid w-full h-full` (FibonacciMosaic.tsx:182-188); the absolute-inset trick is only needed when children don't fill. `overflow-hidden` is also forbidden on pixel-cornered parents and unnecessary here.

### F9: `ColorsTab` two render branches duplicate toolbar shell — Med
- File: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorsTab.tsx:16-51`
- Pattern: duplicate-layout
- Current: Semantic branch renders `AppWindow.Content > AppWindow.Island > toolbar + SemanticView`; Palette branch re-implements almost the same `AppWindow.Content > AppWindow.Island > toolbar + body` with extra Switch.
- Proposal: Single return — toolbar always renders, body is `subTab === 'semantic' ? <SemanticView/> : <FibonacciMosaic.../>`; the Light/Dark switch becomes conditional inside the toolbar.
- Why safe: Both branches use identical Island props (`corners="pixel" padding="none" @container`); only body and trailing switch differ. Eliminates ~15 LOC of mirrored markup.

### F10: `ColorDetail` is a pure switch — unused helper — Low
- File: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorDetail.tsx:11-19`
- Pattern: pass-through
- Current: Component picks between `BrandColorCard` and `ExtendedColorSwatch` based on origin.
- Proposal: Inline at call site (there's no current consumer after grep) or delete — file is orphaned (`ColorsTab` doesn't import it; `index.ts` doesn't re-export).
- Why safe: No references in `ColorsTab.tsx`, `BrandAssetsApp.tsx`, or the tab's `index.ts`; pure dead code.

### F11: `SemanticView` section header wraps `<h2> + <p>` in extra `<div>` — Low
- File: `apps/rad-os/components/apps/brand-assets/colors-tab/SemanticView.tsx:10-17`
- Pattern: wrapper-collapse
- Current: `<div className="flex items-end justify-between..."><div><h2/><p/></div><span/></div>` — the inner title `<div>` has no classes.
- Proposal: Remove bare `<div>`; `<h2>` + `<p>` sit directly in the flex container (use `flex-col grow` on the title group via a named className if needed).
- Why safe: Outer flex is `items-end justify-between`; letting the two text elements participate directly (or adding a `<div className="min-w-0">`) reads identically.

### F12: Export-actions button column — Low
- File: `apps/rad-os/components/apps/brand-assets/LogoMaker.tsx:287-301`
- Pattern: primitive-has-it
- Current:
  ```tsx
  <div className="flex flex-col gap-2 pt-2">
    <Tooltip content={...}><Button .../></Tooltip>
    <Button .../>
  </div>
  ```
- Proposal: Same group can live inside the outer island `flex flex-col gap-4` (F7) by promoting the two buttons + tooltip into a `<ControlGroup>`-less fragment. Alternative: keep the wrapper but drop `pt-2` (the parent `gap-4` already spaces it).
- Why safe: `pt-2` is additive on top of `gap-4` — removing it leaves natural gap spacing and matches other control groups.

### F13: `ColorsSubNav` toolbar shell repeats in each tab — Low
- File: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorsTab.tsx:20, 33` and `apps/rad-os/components/apps/BrandAssetsApp.tsx:173-177`
- Pattern: duplicate-layout
- Current: `<div className="shrink-0 px-3 py-2 border-b border-line bg-card ...">` appears 3× across ColorsTab + BrandAssetsApp fonts toolbar.
- Proposal: Hoist into a shared `<TabToolbar>` primitive (or inside `AppWindow.Toolbar`-style compound, which AppWindow already exposes per AppWindow.tsx:507). The fonts toolbar uses `border-ink` instead of `border-line` — that is an inconsistency worth normalizing.
- Why safe: Markup is mechanically identical; consolidation removes drift risk (note the `border-ink` vs `border-line` fork).

## Summary

Thirteen collapse opportunities — three high-value (F1/F2/F3 on ColorCards are pure no-op inner `<div>`s left over from an earlier abstraction), plus two structural duplications in ColorsTab (F8 absolute-inset frame around a self-sizing grid; F9 two near-identical `AppWindow.Content` branches) that can be unified. LogoMaker itself is mostly tight — the wins are promoting its three island-local `flex flex-col` wrappers (F6/F7/F12) onto the Island's own `className`, which `AppWindow.Island` already forwards (AppWindow.tsx:566, 591).

Cross-cutting: the toolbar strip pattern (`shrink-0 px-3 py-2 border-b border-line bg-card`) is open-coded 3× across BrandAssets (F13) and drifts between `border-line` and `border-ink`. Hoisting to a shared primitive would eliminate both duplication and drift. `ColorDetail.tsx` is orphaned dead code (F10).

Path: `/Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/cleanup-audit/css-overscope/06-brand-assets.md`
