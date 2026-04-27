# RDNA Controls Library Brainstorm

**Date:** 2026-03-27
**Status:** Decided
**Supersedes:** [2026-03-26-control-surface-brainstorm.md](2026-03-26-control-surface-brainstorm.md) (expands scope from RadOS panel to standalone library)

## What We're Building

A standalone control component library (`@rdna/controls`) that ships reusable UI controls — sliders, toggles, selects, color pickers, spacing editors, knobs, folders — as thin wrappers around RDNA primitives. The library is framework-agnostic in spirit but React-first in practice. First consumer is RadOS (dockable/detachable control panels inside app windows). Long-term, the library supports DOM editors, video editors, and any tool surface that needs parameter controls.

## Visual Metaphor

The RadOS control surface follows a **CD player** metaphor:

- **Window** = the player (housing, playback, display)
- **Control Surface** = the CD drive (docked bay where controls live)
- **Control config** (knobs/sliders/panel contents) = the CD (swappable media — different apps load different "discs")
- **Eject** = detach the control surface into a floating companion window (the disc pops out and hovers independently)
- **Re-dock** = slide the disc back into the drive

This gives users a physical intuition: the controls are *media* you slot into a *drive*, not permanent fixtures of the window. Different apps ship different discs. Ejecting lets you arrange your workspace freely.

## Why This Approach

Three existing kits prove the patterns but none fit RDNA's needs:

- **DialKit** — great declared-value store architecture (module singleton, flat paths, presets, useSyncExternalStore) but closed control set, hex-only color, motion-coupled rendering
- **interface-kit** — excellent visual controls (color area, spacing box, typography controls) and clean Controller pattern (mount/destroy/subscribe/getState) but DOM-inspector-scoped, not a parameter GUI
- **agentation** — visual feedback toolbar patterns worth studying for annotation/feedback overlay UX

Rather than wrapping or forking any single kit, we mine all three for control components and architecture patterns, then rebuild each control as a thin RDNA wrapper. The controls look like Radiants but more modern, minimal, and sleek.

## Key Decisions

- **New package**: `packages/controls` (`@rdna/controls`), independent of `@rdna/radiants` (consumes it as a peer dep)
- **DevDeps for reference**: `interface-kit`, `dialkit`, `agentation` installed as devDeps during development
- **P0 control set**: Rebuild full DialKit control types first — Slider, Toggle, Select, Text, Action, Folder — as RDNA wrappers
- **P1 control set**: Mine interface-kit for ColorArea, BoxSpacing, BorderRadius, Shadow, Typography controls
- **P2+**: Token browser, icon picker, gradient editor, spring/easing visualizer — built as apps need them
- **Store architecture**: Decide during prototype. Two candidates:
  - Hybrid (Zustand for lifecycle + standalone useSyncExternalStore for hot values) — from original brainstorm
  - Controller pattern (mount/destroy/subscribe/getState) — from interface-kit
- **Styling**: Radiants foundation but evolved — more modern, minimal, sleek. Controls should feel like professional creative tools
- **Build pattern**: Each control = thin wrapper around existing RDNA component (Input, Switch, Select, Button) + control-specific value formatting and layout

## RadOS Integration

The original control surface brainstorm's RadOS integration plan carries forward:

### Docking & Detaching
- Control surface is a **child of AppWindow**, not a standalone app
- Dock position decided per-app (left/right/bottom) via catalog config
- Detachable into a floating companion AppWindow (linked lifecycle — closing parent closes surface)
- Window store needs a `parentId` field for companion windows

### App Catalog Config
```ts
// Addition to AppCatalogEntry
controlSurface?: {
  enabled: boolean;
  dock: 'left' | 'right' | 'bottom';
  autoOpen?: boolean;
  config: ControlPanelConfig; // @rdna/controls config object
};
```

### Window Chrome
- New title-bar button (sliders/mixer icon) — only appears if app declares `controlSurface`
- Click toggles docked panel; long-press/secondary action detaches
- When detached, button shows "re-dock" state

### First Consumer: Pattern Playground
- Replace current DialKit/DialPanel integration with `@rdna/controls`
- Validates the library against a real, complex use case (presets, custom header/footer, pattern grid)

### Second Consumer: Rad Studio (if applicable)
- Replace existing Rad Studio controls with `@rdna/controls`

## Control Component Pattern

```
packages/controls/
├── package.json
├── src/
│   ├── index.ts              # Public API
│   ├── controls/
│   │   ├── Slider.tsx         # Thin wrapper: RDNA Input[type=range] + value formatting
│   │   ├── Toggle.tsx         # Thin wrapper: RDNA Switch + label
│   │   ├── Select.tsx         # Thin wrapper: RDNA Select + option groups
│   │   ├── TextInput.tsx      # Thin wrapper: RDNA Input + validation
│   │   ├── Action.tsx         # Thin wrapper: RDNA Button + action semantics
│   │   ├── Folder.tsx         # Collapsible group (RDNA Collapsible or custom)
│   │   └── ... (P1+ controls)
│   ├── panel/
│   │   ├── ControlPanel.tsx   # Composable panel that renders controls from config
│   │   └── ControlPanelProvider.tsx
│   ├── store/                 # TBD during prototype
│   └── types.ts
└── test/
```

## Build Order

| Phase | What | Source |
|-------|------|--------|
| P0 | Slider, Toggle, Select, TextInput, Action, Folder | DialKit patterns → RDNA wrappers |
| P0 | ControlPanel (config → rendered controls) | DialKit config parser pattern |
| P0 | useControlPanel hook (declared values → reactive state) | DialKit useDialKit pattern |
| P1 | ColorArea, BoxSpacing, BorderRadius, Shadow | interface-kit visual controls → RDNA rebuild |
| P1 | Typography controls (typeface, size, weight, alignment) | interface-kit typography panel |
| P1 | RadOS docking/detaching integration | Original brainstorm |
| P2 | Token browser, icon picker | New — RDNA-specific |
| P2 | Gradient editor, spring/easing visualizer | New or ported |

## Open Questions

- Should `@rdna/controls` peer-depend on `@rdna/radiants`, or vendor the specific primitives it needs (for true standalone use)?
- Should the ControlPanel support serializable configs (JSON) for agent-driven panel generation, or TypeScript-only configs?
- How does this interact with mobile (MobileAppModal)? Probably a bottom sheet, but needs design.
- Should detached surfaces be independently draggable or constrained near the parent window?
- Preset persistence — localStorage across sessions or session-only?
- Multiple apps with surfaces open simultaneously, or one-at-a-time?

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA`
- Branch: `main` (brainstorm only — implementation on `feat/rdna-controls`)

## Research Notes

- **DialKit** (already in codebase): Wrapped as `DialPanel` in `packages/radiants/components/core/DialPanel/`. Only consumer is PatternPlayground. Module-level singleton store, flat path values, config parsing with type inference, preset snapshots.
- **interface-kit** (v0.1.3, 2026-03-27): Visual DOM style editor by Josh Puckett. Clean Controller pattern. Built-in controls: ColorArea, BoxSpacing, BorderRadius, Shadow, Typography (typeface, size, weight, alignment), Slider (generic), SegmentedControl. Tailwind mode. ~113KB gzip (React). Deps: `motion`, Radix primitives (bundled). GitHub repo private.
- **agentation**: Visual feedback toolbar. MCP integration for annotation workflows. Worth studying for feedback overlay patterns.
- **App catalog** (`apps/rad-os/lib/apps/catalog.tsx`): Already supports `ambient` capability. `controlSurface` would be a parallel catalog-level capability.
- **Window store** (`apps/rad-os/store/slices/windowsSlice.ts`): Manages open/close/focus/fullscreen/widget. Needs `parentId` for companion windows.
