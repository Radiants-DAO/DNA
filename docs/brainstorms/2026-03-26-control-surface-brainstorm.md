# Control Surface Brainstorm

**Date:** 2026-03-26
**Status:** Decided

## What We're Building

A **Control Surface** component for RadOS — a detachable control panel that lives inside app windows and provides contextual controls (sliders, pickers, toggles, etc.) for the active app context. Inspired by SuperPaint's System 7 toolbars/palettes and DialKit's store-first architecture.

Each app defines its own control surface config. The surface renders as a docked panel (sidebar, drawer) inside the app window, with a button to detach it into its own floating companion window. Closing the parent app closes the surface.

## Why This Approach

DialKit proved the concept — declarative config produces a control panel with nice UX. But it's not extensible (no custom controls, hex-only color, no arrays, motion hard-coupled). Rather than extending DialKit, we fork its **architecture** (module-level store, config-to-UI inference, flat path values, preset snapshots) and rebuild the component layer with RDNA primitives. Control types are built as-needed, not up front.

## Key Decisions

- **Child of app window** — not a standalone app. Launched via a dedicated button in the window chrome (or per-app trigger). Lifecycle tied to parent window.
- **Detachable** — can pop out into its own floating AppWindow. Detached surface closes when parent closes.
- **Dock position: app decides** — each app chooses where to dock (left, right, bottom) based on its layout. The ControlSurface component supports all positions.
- **Fork DialKit architecture, not code** — use DialKit's store pattern (useSyncExternalStore, flat path values, config parsing, preset system) as inspiration. Rebuild rendering with RDNA components. No motion dependency — CSS-first animations (max 300ms ease-out per RDNA rules).
- **Build control types incrementally** — start with what DialKit has (slider, toggle, select, text, action) rebuilt in RDNA style. Add OKLCH color picker, pattern grid, token browser, etc. as specific apps need them.
- **Custom control registration API** — unlike DialKit's closed system, the fork exposes a `registerControlType(type, renderer)` extension point so apps can contribute their own control UIs.
- **Per-app config via catalog** — apps declare a `controlSurface` config in the app catalog (alongside existing `ambient` capability). Config specifies dock position, default controls, and whether the surface auto-opens.

## Architecture Sketch

```
ControlSurfaceStore (module-level singleton, inspired by DialKit)
├── panels: Map<panelId, PanelConfig>
├── values: Map<panelId, Record<path, value>>
├── presets: Map<panelId, Preset[]>
├── controlRegistry: Map<type, ControlRenderer>  ← extension point
└── subscribe(panelId) → useSyncExternalStore

useControlSurface(name, config) → typed values
  - Registers panel with store
  - Returns reactive values (same pattern as useDialKit)

<ControlSurface dock="right|left|bottom" detachable>
  - Reads panels from store
  - Renders controls using controlRegistry
  - Header/footer slots for app-specific content (pattern grid, presets)
  - Detach button → spawns companion AppWindow with same panel

<ControlSurfaceWindow parentId={windowId}>
  - Floating AppWindow rendering the detached surface
  - Closes when parent window closes
  - Can re-dock via button
```

## Control Types (build order)

| Priority | Type | Source |
|----------|------|--------|
| P0 | Slider, Toggle, Select, Text, Action | Fork from DialKit patterns, rebuild with RDNA Input/Select/Toggle/Button |
| P0 | Folder (collapsible groups) | Fork from DialKit, rebuild with RDNA Collapsible |
| P1 | RDNA Color (OKLCH) | New — lightness/chroma/hue sliders using RDNA token values |
| P1 | Pattern selector | Already built (PatternGridPicker) — register as control type |
| P2 | Token browser | New — browse/pick from semantic tokens |
| P2 | Icon picker | New — browse Lucide icon set |
| P3 | Gradient editor | New — multi-stop gradient builder |
| P3 | Spring/Easing visualizer | Port from DialKit if needed |

## Window Chrome Integration

- New button in AppWindow title bar: "Control Surface" icon (possibly a sliders/mixer icon)
- Button only appears if the app has registered a controlSurface config
- Click toggles the docked panel open/closed
- Long-press or secondary action detaches into floating window
- When detached, button shows "re-dock" state

## Open Questions

- Should detached surfaces be draggable independently or constrained near the parent window?
- Should the preset system persist across sessions (localStorage) or be session-only like current window state?
- Should multiple apps be able to have surfaces open simultaneously, or one-at-a-time?
- How does this interact with mobile (MobileAppModal)? Probably a bottom sheet.

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA`
- Branch: `feat/pattern-playground` (current work)
- Implementation branch: TBD (likely `feat/control-surface`)

## Research Notes

- **DialKit store**: Module-level singleton, `useSyncExternalStore`, flat path values, config parsing with type inference. Good architecture to fork.
- **DialKit limitations**: No custom controls, hex-only color, no arrays, motion hard-coupled, no per-control onChange.
- **RadOS ambient system**: `catalog.tsx` already supports `ambient: { wallpaper, widget, controller }` — ControlSurface would be a similar catalog-level capability.
- **AppWindow**: Already supports resize/drag/fullscreen. Would need a "companion window" concept (linked lifecycle).
- **Window store**: `windowsSlice.ts` manages open/close/focus. Would need `parentId` field for companion windows.
- **SuperPaint reference**: Toolbars docked to canvas edges, tool palettes floating alongside. The detachable model maps exactly to "docked sidebar that can pop out."
