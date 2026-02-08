# Window Manager & Toolbox Launcher Brainstorm

**Date:** 2026-02-07
**Status:** Decided

## What We're Building

A full draggable/resizable window manager that replaces the current fixed InfoWindow modal. The door animation stays identical — it opens, content settles — then the window becomes draggable and resizable. Multiple windows can be open simultaneously. The toolbox becomes a launcher that spawns tool windows instead of switching tabs internally.

## Why This Approach

**AppWindow as universal container** — Restyle and extend AppWindow to match InfoWindow's CRT aesthetic, then use it as the single window system for everything. InfoWindow's content rendering becomes pure content components with no positioning logic. This avoids two parallel window systems and gives us multi-window for free via the existing Zustand store.

## Key Decisions

- **Door animation**: Identical to current. Plays once for the first window open. Door stays expanded as a "portal" while any windows are open. Retracts only when ALL windows are closed. Subsequent windows spawn centered/cascaded without replaying the door animation.
- **Multi-window**: All panels (hackathon, rules, prizes, judges, toolbox, faq, calendar, legal) become independent AppWindows. Multiple can be open simultaneously with z-index management.
- **AppWindow restyling**: Current teal glassmorphic look → InfoWindow's dark CRT aesthetic (beveled borders, panel-accent colors, dark background). Add: CTA button area at bottom, optional left sidebar, same title bar style.
- **Toolbox as launcher**: Toolbox opens as a window. Instead of internal tabs (DEV DOCS, ASSETS, AI), each category launches a new window with that content. Toolbox stays open after launching.
- **No taskbar yet**: Only a handful of windows expected. Orbital nav is sufficient for window discovery (icons glow when their panel is open, click to focus).
- **Mobile**: Keeps current full-screen modal UX with swipe navigation. Desktop-only feature.
- **Orbital nav behavior change**: No longer toggles (open/close same panel). Instead: click opens window if not open, focuses it if already open. Separate close button on each window.

## Architecture

### Component Hierarchy (After)

```
page.tsx
├── ShaderBackground
├── CRTShader
├── Door animation (portal container)
│   └── background layers + door image
├── AppWindow (per open panel)
│   ├── WindowTitleBar (drag handle, close, CTA)
│   ├── Optional LeftSidebar (for tabbed panels like toolbox, rules)
│   └── ContentArea (scrollable)
│       └── <PanelContent id={panelId} /> (pure content components)
├── OrbitalNav (opens/focuses windows)
└── Hero text (hidden when any window open)
```

### State Changes

- `page.tsx`: Remove `activeWindow` single-panel state → use `useWindowManager` for all window tracking
- `useWindowManager`: Already supports multi-window. Add: door-open tracking (is any window open?), window-from-door flag (first window triggers door animation)
- New: `isDoorOpen` derived state — true when any window is open
- New: orbital nav reads open windows from store, highlights active icons

### AppWindow Restyling Needs

Current → Target:
- Background: teal glassmorphic gradient → dark surface with `var(--color-surface-body)` or similar
- Border: `border-edge-primary` → beveled borders (`--bevel-hi` top/left, `--bevel-lo` bottom/right)
- Title bar: plain text → InfoWindow-style with icon, scramble text, decorative line, close button
- Add: Bottom action bar (optional, for CTAs like "REGISTER" on hackathon)
- Add: Left sidebar slot (optional, for tab-like navigation within a window — rules, legal, toolbox)
- Panel-accent vars: Scoped per-window (each panel could have its own accent color)
- Hover glow: Inset `--panel-accent` glow instead of teal

### Content Extraction

InfoWindow currently has:
- `CONTENT` object (8 panel definitions with types: entries, sections, tabs, accordion, judges, prizes, hackathon, calendar)
- Render functions: `renderEntries()`, `renderSections()`, `renderTabs()`, etc.
- Sequential reveal animation via `useSequentialReveal()`

These become standalone content components:
- `PanelContent` — dispatcher that renders the right content for a panel ID
- Individual renderers stay as functions or become components
- `useSequentialReveal` stays as a hook used by content components

### Door → Window Handoff

1. User clicks orbital nav item
2. If no windows open: trigger door-expanded class, wait 750ms for door-settled
3. Spawn AppWindow at door position (centered in door-wrapper area)
4. Window is now draggable — user can move it off the door
5. If windows already open (door already expanded): spawn AppWindow centered/cascaded, no door animation
6. When last window closes: reverse door animation (retract)

### Toolbox Launcher

Current toolbox has 3 tabs: DEV DOCS, ASSETS, AI. Transform into:
- Toolbox window shows a grid/list of launchable tools
- Each item has an icon, title, description
- Click → `openWindow('tool-dev-docs', { width: 600, height: 500 })` (or similar)
- Tool windows contain the content that was previously in tabs
- Component Library link already exists as a featured item — becomes another launchable tool

## Open Questions

- Should per-window accent colors be a thing? (e.g., hackathon = orange, toolbox = purple, calendar = blue) Or keep unified purple accent?
- What's the door retraction animation? Reverse of the expansion (content fades, door image returns, height shrinks)?
- Should windows remember their position/size across page reloads? (localStorage persistence)
- What content goes in the ASSETS and AI tool windows? (currently "coming soon")

## Research Notes

- `app/components/AppWindow.tsx` — draggable/resizable window using react-draggable + Zustand
- `app/components/InfoWindow.tsx` — content system with 8 panel types, ~600 lines of content + ~200 lines of rendering
- `app/hooks/useWindowManager.ts` — Zustand store with openWindow, closeWindow, focusWindow, position/size tracking, cascade positioning
- `app/page.tsx` — orchestrates door animation state, orbital nav, single-panel exclusive logic
- `app/globals.css` lines 1776-1892 — door animation CSS (door-expanded, door-settled, door-anticipate keyframes, overlay-in)
- Door aspect ratio: 132/288 (portrait), constrained by `.door-wrapper`
- Easing tokens: `--ease-drift`, `--ease-dock`, `--ease-launch`, `--ease-photon`
- Bevel tokens: `--bevel-hi`, `--bevel-lo`
