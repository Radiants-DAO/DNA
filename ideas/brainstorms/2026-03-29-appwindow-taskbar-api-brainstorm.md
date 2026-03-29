# AppWindow Taskbar API Brainstorm

**Date:** 2026-03-29
**Status:** Decided

## What We're Building

A compound-component API on AppWindow that gives apps declarative control over two chrome-level zones: **nav** (title bar tabs) and **toolbar** (optional control bar between title bar and content). Replaces the current raw `createPortal` pattern that BrandAssetsApp uses to inject tabs into the window title bar.

Content-level navigation (Manifesto sidebar tabs, BrandAssets sub-tabs, PatternPlayground DialPanel) stays app-managed with the existing `Tabs` component — out of scope.

## Why This Approach

**Problem:** Every app hand-rolls its own taskbar. BrandAssetsApp does a 30-line portal dance (`useState` + `useEffect` + `createPortal`) to inject capsule tabs into the title bar slot. Height accounting is manual. Other apps avoid the pattern entirely because it's too much ceremony.

**Solution:** Compound children on AppWindow (`AppWindow.Nav`, `AppWindow.Toolbar`, `AppWindow.Content`). AppWindow detects these children by type, places them in the correct zone, and handles height accounting automatically.

### Compound API shape:

```tsx
<AppWindow id="brand-assets" title="Brand Assets">
  <AppWindow.Nav
    layout="capsule"
    value={activeTab}
    onChange={setActiveTab}
  >
    <AppWindow.Nav.Item value="logos" icon="image">Logos</AppWindow.Nav.Item>
    <AppWindow.Nav.Item value="color" icon="palette">Color</AppWindow.Nav.Item>
    <AppWindow.Nav.Item value="type" icon="type">Type</AppWindow.Nav.Item>
  </AppWindow.Nav>

  {activeTab === 'components' && (
    <AppWindow.Toolbar>
      <Input placeholder="Search..." />
      <FilterPills categories={cats} />
    </AppWindow.Toolbar>
  )}

  <AppWindow.Content>
    {/* app renders content based on activeTab */}
  </AppWindow.Content>
</AppWindow>
```

### Toolbar-only (no nav):

```tsx
<AppWindow id="search-app" title="Search">
  <AppWindow.Toolbar>
    <Input placeholder="Search everything..." />
  </AppWindow.Toolbar>
  <AppWindow.Content>
    {/* results */}
  </AppWindow.Content>
</AppWindow>
```

## Key Decisions

- **Scope:** Chrome-level nav + optional toolbar zone only. Content-level tabs (sidebar, sub-tabs, filter bars inside content) stay with existing `Tabs`/`WindowTabs` components.
- **API shape:** Compound children (`AppWindow.Nav`, `AppWindow.Toolbar`, `AppWindow.Content`) — not props objects.
- **Content management:** Bar-only. `AppWindow.Nav` fires `onChange`, app conditionally renders content. No built-in panel switching.
- **Toolbar flexibility:** `AppWindow.Toolbar` accepts arbitrary `ReactNode`. AppWindow handles placement + height accounting.
- **Toolbar independence:** `AppWindow.Toolbar` works without `AppWindow.Nav` — apps can have just a toolbar.
- **Tabs reuse:** `AppWindow.Nav` wraps the existing `Tabs` component internally. `layout` maps to Tabs layouts (`capsule`, `pill`, `line`). AppWindow owns chrome-context styling overrides and titlebar placement.
- **Backward compat:** Existing apps that don't use `AppWindow.Nav`/`AppWindow.Toolbar`/`AppWindow.Content` work exactly as before — bare `children` renders in the content area as today.

## Layout Zones

```
┌─────────────────────────────────────┐
│ TITLE BAR   [Nav.Item][Nav.Item]... │ ← AppWindow.Nav (chrome zone)
├─────────────────────────────────────┤
│ [Search...] [Filter] [Filter]       │ ← AppWindow.Toolbar (optional)
├─────────────────────────────────────┤
│                                     │
│            CONTENT AREA             │ ← AppWindow.Content (or bare children)
│                                     │
└─────────────────────────────────────┘
```

Height calculation: `--app-content-max-height` subtracts `TITLE_BAR_HEIGHT` + toolbar height (measured via ref) + `CHROME_PADDING`.

## Open Questions

- **Nav layouts:** Which Tabs layouts to expose? Likely `capsule` and `pill` for v1. `line` maybe later.
- **Toolbar height:** Measured dynamically via ResizeObserver, or fixed constant? Dynamic is safer given variable content.
- **AppWindow.Content vs bare children:** Should `AppWindow.Content` be required when using Nav/Toolbar, or should AppWindow auto-wrap bare children? Auto-wrap is friendlier but implicit.
- **Deprecation path:** When to remove the raw `window-titlebar-slot-${id}` portal pattern. Probably keep it for a release cycle after migration.
- **AppWindowBody/SplitView interaction:** Does `AppWindow.Content` replace or wrap `AppWindowBody`/`AppWindowSplitView`? Likely wraps — Content is the zone, Body/SplitView is the layout inside it.

## Current Pattern Audit

| App | Chrome Nav | Toolbar | Content Tabs | Migration |
|-----|-----------|---------|-------------|-----------|
| BrandAssets | Capsule portal (6 tabs) | Search + filters (components tab), SubTabNav (fonts tab) | None | Full migration — biggest win |
| RadiantsStudio | None | None | Pill tabs (default) | No change |
| Manifesto | None | None | Sidebar tabs | No change |
| PatternPlayground | None | DialPanel header | None | Could use Toolbar |
| RadRadio | None | None | Dropdown menu | No change |
| TypographyPlayground | None | None | Sub-tabs via layouts | No change |
| About/Links/GoodNews | None | None | None | No change |

## Research Notes

- **Portal slot exists:** `window-titlebar-slot-${id}` at AppWindow.tsx:318, `className="contents"`
- **BrandAssetsApp portal pattern:** Lines 474-528 — `useState`/`useEffect`/`createPortal` dance
- **WindowTabs:** `apps/rad-os/components/Rad_os/WindowTabs.tsx` — accounts for `TAB_BAR_OFFSET = 56`
- **Tabs layouts:** 6 variants in `packages/radiants/components/core/Tabs/Tabs.tsx` — `default`, `sidebar`, `dot`, `capsule`, `accordion`, `bottom-tabs`
- **Height constants:** `TITLE_BAR_HEIGHT = 40`, `CHROME_PADDING = 16`, `DEFAULT_BOTTOM_INSET = 48`

## Worktree Context

- Implementation should happen in a dedicated worktree: `feat/appwindow-taskbar-api`
- Primary files to modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`
- Primary migration target: `apps/rad-os/components/apps/BrandAssetsApp.tsx`
