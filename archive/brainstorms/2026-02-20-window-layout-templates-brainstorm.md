# Window Layout Templates Brainstorm

**Date:** 2026-02-20
**Status:** Decided

## What We're Building

A set of composable layout primitive components for RadOS window content areas. These replace the current ad-hoc patterns (5+ apps hand-rolling identical CSS, AppWindowContent barely used) with consistent, reusable building blocks that handle scroll, overflow, tabs, sidebars, and Web3 chrome.

## Why This Approach

**Layout Primitives** — small composable React components that apps import and assemble freely. Not templates-as-config or a single polymorphic component. Each primitive does one thing well and composes naturally with others.

This was chosen over Template Components (higher-level but less flexible) and Single Polymorphic (too rigid for novel layouts). The primitives approach matches the existing DNA component philosophy of small composable pieces.

## Key Decisions

- **React components, not docs** — Single source of truth for layout CSS. Global updates without drift.
- **Web3 as composable layer** — `Web3Shell` wraps any base mode (tabbed + Web3, scroll + Web3, etc.) rather than being its own standalone mode.
- **Bottom tabs only** — All horizontal tabs pin to bottom. Consistent with RadOS desktop metaphor.
- **Fixed sidebar width** — No collapse/resize for docs mode. Simple `w-48` sidebar. Can add collapse later if needed.
- **Custom apps opt out** — Seeker, RadRadio don't use templates. Just `<div className="h-full">` and own their layout entirely.

## Component Inventory

### `WindowContent`
Scroll container replacing hand-rolled CSS in 5+ apps. Handles `max-h-[var(--app-content-max-height)]`, overflow, padding, border, rounded corners.
- Replaces: `AppWindowContent` (used by 2 apps) + identical hand-rolled CSS (used by 4 apps)
- Props: `padding`, `bordered`, `bgClassName`, `noScroll`

### `WindowTabs`
Compound component wrapping DNA `Tabs` with bottom-pinned tab bar + flex content area. Handles the `flex-1 min-h-0 overflow-auto` pattern automatically.
- Compound API: `WindowTabs`, `WindowTabs.Content`, `WindowTabs.List`, `WindowTabs.Trigger`
- Replaces: BrandAssets/Components/RadiantsStudio tab boilerplate

### `WindowSidebar`
Fixed-width sidebar + scrolling content area. Side-by-side flex layout.
- Props: `nav` (ReactNode), `width` (default 192px)
- Replaces: Manifesto's hand-rolled sidebar layout

### `Web3Shell`
Composable wrapper adding wallet connect slot and pinned action bar footer.
- Props: `actionBar` (ReactNode), `walletSlot` (ReactNode for title bar area)
- Wraps any child layout (WindowContent, WindowTabs, WindowSidebar)

### `WindowFooter`
Generic pinned footer bar (shrink-0, border-top). Used internally by WindowTabs and Web3Shell, also available standalone.
- Visually identical structure shared by Tabs.List and Web3ActionBar today

## Composition Examples

```tsx
// Default (Settings, About, Links, Calendar, Events)
<WindowContent>
  <h1>Settings</h1>
  ...
</WindowContent>

// Tabbed (BrandAssets, Components, RadiantsStudio)
<WindowTabs defaultValue="tab1">
  <WindowTabs.Content value="tab1">...</WindowTabs.Content>
  <WindowTabs.Content value="tab2">...</WindowTabs.Content>
  <WindowTabs.List>
    <WindowTabs.Trigger value="tab1">Tab 1</WindowTabs.Trigger>
    <WindowTabs.Trigger value="tab2">Tab 2</WindowTabs.Trigger>
  </WindowTabs.List>
</WindowTabs>

// Docs (Manifesto, future Radiants Docs)
<WindowSidebar nav={<SideNav items={sections} />}>
  <WindowContent>{currentSection}</WindowContent>
</WindowSidebar>

// Web3 + Tabbed (Auctions)
<Web3Shell actionBar={<Web3ActionBar ... />}>
  <WindowTabs defaultValue="overview">
    ...
  </WindowTabs>
</Web3Shell>

// Custom (Seeker, RadRadio) — no template
<div className="h-full">...</div>
```

## Bug Fixes Required

- **`--app-content-max-height` phantom 48px** — AppWindow always subtracts TAB_BAR_HEIGHT (48px) even when no tab bar exists. WindowContent should calculate this correctly based on whether tabs/footer are present.
- **AppWindowContent deprecation** — Replace usages with WindowContent, then remove the old component.

## Open Questions

- Should WindowTabs accept the existing DNA `useTabsState` or manage its own internal state?
- Should we move these to the DNA package (`@rdna/radiants`) or keep them RadOS-specific in `components/Rad_os/`?

## Research Notes

- **AppWindow.tsx** — Renders children in `flex-1 min-h-0` div with `--app-content-max-height` CSS var
- **AppWindowContent.tsx** — Only used by BrandAssetsApp and RadiantsStudioApp. Props: `bordered`, `bgClassName`, `noScroll`, `scrollClassName`
- **5 apps hand-roll identical CSS:** `mx-2 h-full overflow-auto bg-white p-6 border border-black rounded-sm max-h-[var(--app-content-max-height)]`
- **Tabs.List and Web3ActionBar** share identical visual structure (flex, border-top, bg, shrink-0)
- **`--app-content-max-height`** always subtracts 48px for TAB_BAR_HEIGHT even when no tabs exist
