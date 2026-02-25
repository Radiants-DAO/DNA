# Monolith App Refactor + Component Library Brainstorm

**Date:** 2026-02-05
**Status:** Decided

## What We're Building

A two-part refactor of `apps/monolith-hackathon`: (1) migrate the app to consume components from the refactored `@rdna/monolith` package instead of local copies, removing ~400 lines of dead BEM CSS and migrating remaining `cal-*` classes to Tailwind, and (2) build out the toolbox into a launcher that opens AppWindow-based tools — starting with a component/design library window using the rad-os DesignSystemTab pattern.

## Why This Approach

- **Package imports** — single source of truth, no drift between theme and app
- **AppWindow for tools** — first real use of AppWindow in the hackathon app, proves the component works in production and gives hackathon participants a concrete example
- **Toolbox as launcher** — scales cleanly as we add more tools (AI tools, brand kit, etc.) without cramming everything into the InfoWindow
- **Migrate cal-* now** — eliminates the last BEM dependency so globals.css is purely page-level layout

## Key Decisions

- Components import from `@rdna/monolith/components` (not local copies)
- Toolbox panel becomes a launcher with brief descriptions + launch buttons
- Component library opens in a draggable/resizable AppWindow
- Library uses DesignSystemTab pattern (accordion sections, variant rows, props display)
- All remaining `cal-*` BEM classes in InfoWindow get migrated to Tailwind inline
- Dead BEM blocks removed from globals.css (~lines 1199–1291, 1365–1535, 2643–2847)

## Architecture

### Toolbox → Launcher Pattern

```
Toolbox Panel (InfoWindow type="tabs")
├── Tab: "Components" → launches ComponentLibraryWindow (AppWindow)
├── Tab: "Brand Kit" → launches BrandKitWindow (future)
├── Tab: "AI Tools" → launches AIToolsWindow (future)
└── Tab: "Resources" → existing links/docs (stays in InfoWindow)
```

### ComponentLibraryWindow

```
AppWindow (draggable, resizable)
├── Accordion: Buttons
│   └── Row: variant="primary" | "secondary" | "outline" | "ghost" | "mono"
├── Accordion: Cards
│   └── Row: variant="default" | "elevated" | "glass"
├── Accordion: Badge
│   └── Row: variant="default" | "success" | "warning" | "error" | "info"
├── Accordion: CrtAccordion
│   └── Row: type="single" | "multiple"
├── Accordion: CrtTabs
│   └── Row: defaultValue examples
├── Accordion: CalendarGrid
│   └── Row: with sample events
├── Accordion: CountdownTimer
│   └── Row: format="numeric" | "text"
├── Accordion: AppWindow
│   └── Row: description + screenshot (can't nest easily)
├── Accordion: OrbitalNav
│   └── Row: description (complex, show props)
└── Accordion: ShaderBackground
    └── Row: preset selector
```

## Refactor Scope

### Part 1: Package Migration

1. **Remove local component copies** from `app/components/` that now exist in `@rdna/monolith`
   - AnimatedSubtitle, OrbitalNav, CrtAccordion, CrtTabs, ShaderBackground, CRTShader
   - Keep InfoWindow local (app-specific content)
2. **Update imports** in page.tsx and InfoWindow.tsx to `@rdna/monolith/components`
3. **Delete dead BEM CSS** from globals.css per REFACTOR_CHANGELOG section 5
4. **Migrate cal-* classes** in InfoWindow to Tailwind inline
5. **Update token references** (hardcoded hex → semantic vars per changelog)

### Part 2: Toolbox Launcher + Component Library

1. **Refactor toolbox content** — replace current link-heavy layout with launcher cards
2. **Create ComponentLibraryWindow** — new component using AppWindow + CrtAccordion
3. **Wire launcher** — toolbox button opens/focuses the component library AppWindow
4. **Add window management** — AppWindow z-index and state via useWindowManager

## Open Questions

- Should the component library include a "copy import" button for each component?
- Do we want a search/filter within the component library accordion?
- How should AppWindow coexist with the door overlay (z-index layering)?

## Research Notes

- REFACTOR_CHANGELOG.md has exact line ranges for CSS deletion
- rad-os DesignSystemTab uses Section/Row/PropsDisplay helper components — good pattern to replicate
- AppWindow uses react-draggable + custom resize handles, zustand for window state
- CRTShader and DitheringShader moved to `components/dev/` in package (not core exports)
- InfoWindow cal-* classes: ~30 classes across lines 2480–2642 that need Tailwind migration
