---
name: Control Density Modes (revised from Controls Library)
description: Controls are modes of existing RDNA components via data-density="control", not a separate @rdna/controls package. New compound controls (ColorPicker OKLCH, BoxSpacing, BorderRadius, ShadowEditor) are RDNA core components.
type: project
---

## Decision: Modes Not Library (2026-03-28)

Original plan was a standalone `@rdna/controls` package that would rebuild Slider, Toggle, Select, etc. as thin wrappers. User identified that 6/8 DialKit controls and 6/11 interface-kit controls are just existing RDNA components in a denser layout.

**Revised approach:**
1. Add `data-density="control"` tier to existing CSS density system (joins `compact` and `comfortable`)
2. Each form component gets control-density styles via CSS attribute selectors — no new props needed
3. Only genuinely new compound controls become new RDNA core components: ColorPicker (OKLCH), BoxSpacing, BorderRadiusEditor, ShadowEditor
4. `useControlPanel` + `ControlPanel` are a thin orchestration layer rendering existing RDNA components from declarative config
5. DialKit gets replaced, not wrapped

**Why:** Avoids maintaining a parallel component set. Makes @rdna/radiants stronger. Existing density infrastructure (`--density-scale`, `[data-density]` selectors) was already plumbed but unused by components.

**How to apply:** When building parameter GUIs or control panels, wrap in `<div data-density="control">` rather than using DialKit. New compound controls live in `packages/radiants/components/core/`.

**Plan:** `docs/plans/2026-03-28-control-density-modes.md`
**Brainstorm:** `ideas/brainstorms/2026-03-27-rdna-controls-library-brainstorm.md` (superseded by density approach)
**Branch:** `feat/control-density` (not yet created)
