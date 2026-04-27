# 11 — Shared UI, Small App Shells, Background

Scope: `apps/rad-os/components/ui/**`, `apps/rad-os/components/apps/*.tsx` top-level (excluding BrandAssetsApp), `apps/rad-os/components/background/**`.

## Findings

### F1: DesignSystemTab outer scroll wrapper holds only padding child — Med
- File: apps/rad-os/components/ui/DesignSystemTab.tsx:181
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div ref={scrollRootRef} className="h-full overflow-auto">
    <div className="flex flex-col gap-4 p-5">
      {...}
    </div>
  </div>
  ```
- Proposal: Collapse into a single scrollable flex container:
  ```tsx
  <div ref={scrollRootRef} className="h-full overflow-auto flex flex-col gap-4 p-5">
    {...}
  </div>
  ```
- Why safe: `overflow-auto` and `flex flex-col gap-4 p-5` compose cleanly on one element; padding is already inside the scroll port in the current layout.

### F2: DesignSystemTab card chrome uses nested div just to inset content — Med
- File: apps/rad-os/components/ui/DesignSystemTab.tsx:74-79
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="pixel-rounded-sm pixel-shadow-resting">
    <div ref={containerRef} className="bg-page p-4 flex flex-col gap-3">
  ```
- Proposal: Single element carrying chrome + padding:
  ```tsx
  <div ref={containerRef} className="pixel-rounded-sm pixel-shadow-resting bg-page p-4 flex flex-col gap-3">
  ```
- Why safe: `pixel-rounded-*` uses `clip-path` + `::after`; no `border-*` / `overflow-hidden` added here. Padding and bg can live on the clipped element without breaking the pixel-corner pseudo-border.

### F3: Grouped columns wrapper + per-card wrapper duplicate layout — Med
- File: apps/rad-os/components/ui/DesignSystemTab.tsx:227-240
- Pattern: duplicate-layout
- Current:
  ```tsx
  <div className="columns-1 @3xl:columns-2 @7xl:columns-3 gap-3">
    {group.entries.map((entry) => (
      <div key={entry.name} id={`component-${entry.name}`} className="break-inside-avoid mb-3">
        <ComponentShowcaseCard ... />
      </div>
    ))}
  </div>
  ```
- Proposal: Move `id`, `break-inside-avoid`, and `mb-3` onto the ShowcaseCard's root (F2 merge) so the column parent has no wrapper layer per card.
- Why safe: CSS columns only need the `break-inside-avoid` on the child; `id` can live on the card root; `mb-3` is a trivial passthrough.

### F4: UILibraryNavigator scroll body wraps each group in an empty div — Low
- File: apps/rad-os/components/ui/UILibrarySidebar.tsx:68-92
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="flex-1 min-h-0 overflow-y-auto">
    {grouped.map((group) => (
      <div key={group.category}>
        <div className="px-3 py-2 border-b border-rule bg-depth">...</div>
        {group.entries.map(...)}
      </div>
    ))}
  ```
- Proposal: Use `<Fragment key=>` or emit header + buttons directly as siblings; the inner `<div key>` carries no styling.
- Why safe: Removes a purely semantic grouping div that adds neither layout nor a11y (navigator is a list of buttons, not a landmark).

### F5: UILibraryCode empty-state div duplicates ComponentCodeOutput's own empty state — Med
- File: apps/rad-os/components/ui/UILibrarySidebar.tsx:108-118
- Pattern: pass-through
- Current:
  ```tsx
  if (!selectedEntry) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-mute text-center">Code output appears here</p>
      </div>
    );
  }
  return <ComponentCodeOutput entry={selectedEntry} propValues={propValues} />;
  ```
  `ComponentCodeOutput` already handles `!entry` with its own centered placeholder (`ComponentCodeOutput.tsx:17-25`).
- Proposal: Delete the `UILibraryCode` wrapper and render `<ComponentCodeOutput entry={selectedEntry} propValues={propValues} />` directly.
- Why safe: The downstream component ships the identical empty state, so the wrapper is dead chrome.

### F6: AboutApp outer max-width wrapper around Island padding — Low
- File: apps/rad-os/components/apps/AboutApp.tsx:37-39, 151-153
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <AppWindow.Content>
    <AppWindow.Island padding="lg">
      <div className="max-w-[42rem] mx-auto space-y-8">
        ...
      </div>
    </AppWindow.Island>
  </AppWindow.Content>
  ```
- Proposal: Push `max-w-[42rem] mx-auto space-y-8` onto `AppWindow.Island` via a `contentClassName`/children container prop (if supported), or collapse into a single readable-width content region. The raw `<div>` is purely a reading-width + vertical-rhythm container.
- Why safe: `space-y-8` and `max-w-[42rem]` can live directly on Island's inner content slot; Tailwind v4 arbitrary value is the correct escape per memory note (avoid `max-w-2xl` trap).

### F7: ManifestoApp is a pure pass-through to ManifestoBook — High
- File: apps/rad-os/components/apps/ManifestoApp.tsx:5-7
- Pattern: pass-through
- Current:
  ```tsx
  export function ManifestoApp({ windowId: _windowId }: AppProps) {
    return <ManifestoBook />;
  }
  ```
- Proposal: Register `ManifestoBook` directly in `lib/apps/catalog.tsx` and delete `ManifestoApp.tsx`. If the `AppProps` surface is needed, accept it on `ManifestoBook` instead.
- Why safe: The shell adds no layout, no context, no error boundary — catalog can reference the real component. (`StudioApp.tsx` and `GoodNewsApp.tsx` are already one-liner re-exports, confirming this as the preferred pattern.)

### F8: StudioApp/GoodNewsApp re-export shells — Low
- File: apps/rad-os/components/apps/StudioApp.tsx:3, apps/rad-os/components/apps/GoodNewsApp.tsx:3-6
- Pattern: pass-through
- Current: Files exist solely to `export { default } from './studio/PixelArtEditor'` and re-alias `GoodNewsLegacyApp`.
- Proposal: Point `lib/apps/catalog.tsx` imports directly at `./studio/PixelArtEditor` and `./goodnews/GoodNewsLegacyApp`; remove the shim files.
- Why safe: These shims exist only because the catalog historically expected an `XxxApp` symbol per file; catalog already owns metadata, so the indirection is vestigial.

### F9: ScratchpadApp outer flex-col wrapper inside Content — Low
- File: apps/rad-os/components/apps/ScratchpadApp.tsx:110-112
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <AppWindow.Content layout="bleed">
    <div className="relative flex h-full flex-col">
      <div className="relative shrink-0">
        <div className="absolute ... rdna-pat rdna-pat--diagonal-dots" />
        <div className="absolute ... rdna-pat rdna-pat--spray-grid" />
      </div>
  ```
- Proposal: Pass `layout="bleed"` + a `className="relative flex h-full flex-col"` or use a dedicated Island variant. Also collapse the zero-height `<div className="relative shrink-0">` that only hosts two absolutely-positioned pattern strips — they can be rendered as siblings directly inside the flex column (they are `absolute` and use `h-1`, they don't need the `shrink-0` parent).
- Why safe: Absolute children don't participate in the flex layout; the `shrink-0` relative host contributes nothing since the absolutes are already pinned to `left-0 right-0 top-0/1`.

### F10: WebGLSun canvas className merge is a single element already, but host usage may over-scope — Low
- File: apps/rad-os/components/background/WebGLSun.tsx:511-521
- Pattern: primitive-has-it
- Current: Component renders a single `<canvas>` — that's already minimal.
- Proposal (for callers): audit callers of `<WebGLSun>`; many background hosts wrap a single `<canvas>` in a positioned `<div>`. If a caller does `<div className="absolute inset-0"><WebGLSun/></div>`, forward `className` (already supported) and drop the div. No change to WebGLSun itself.
- Why safe: `WebGLSun` already accepts `className`; the canvas fills with `w-full h-full` and `object-fit: cover`. Callers can position the canvas directly.

### F11: UI package barrel is empty but still exists — Low
- File: apps/rad-os/components/ui/index.ts:1-7
- Pattern: pass-through
- Current: File only contains a comment pointing imports to `@rdna/radiants/components/core` — no exports.
- Proposal: Delete the file if nothing imports from `@/components/ui`; otherwise leave the note but confirm no `from '@/components/ui'` paths remain in the app. Not a CSS finding per se, but it's a "shared UI that doesn't exist anymore" over-scope signal — the directory should be renamed to reflect it's app-specific browser UI only.
- Why safe: Zero exports means no consumers depend on the barrel. Removing removes a confusing breadcrumb.

## Summary

**High (1)**: F7 — `ManifestoApp.tsx` is a literal pass-through; register `ManifestoBook` directly.
**Med (4)**: F1/F2/F3 stacked wrappers in `DesignSystemTab` (scroll+pad, chrome+padding, column+card), F5 `UILibraryCode` duplicates the downstream empty state.
**Low (6)**: F4 empty group div, F6 reading-width div on top of `Island`, F8 re-export shims (`StudioApp`, `GoodNewsApp`), F9 Scratchpad double flex host, F10 caller-side positioning wrapper around `WebGLSun`, F11 dead `components/ui/index.ts` barrel.

Common pattern: the `components/ui/` directory is now a thin re-wrapper over `@rdna/radiants` — the three remaining files (`DesignSystemTab`, `UILibrarySidebar`, `ComponentCodeOutput`) all stack 2–3 layout divs per card/section where one would suffice, and the app-shell files under `components/apps/*.tsx` mostly pass through to nested implementations already. Biggest wins: F7 (delete the shell) and the F1+F2+F3 card-column cleanup in `DesignSystemTab.tsx`.

Output file: /Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/cleanup-audit/css-overscope/11-shared-ui.md
