# @rdna/ctrl — Developer Handoff

**Date:** 2026-04-14
**Status:** Active development
**Package:** `packages/ctrl/`

---

## What is @rdna/ctrl?

A portable control surface primitive library for creative and developer tools. Knobs, faders, sliders, meters, pickers, panels — the building blocks for any UI where users manipulate parameters. Think Photoshop's panels, Ableton's mixer, Chrome DevTools' property inspector, InDesign's layout controls.

Ctrl exists separately from `@rdna/radiants` (the primary design system) because these components are high-complexity, information-dense, and serve a fundamentally different interaction model. Radiants is for app and content UI — forms, dialogs, navigation. Ctrl is for parameter manipulation in tool panels.

**Rule of thumb:** If it lives inside a control panel and adjusts a value, it's ctrl. If it lives in app chrome or content flow, it's radiants.

## Why it exists

Radiants shouldn't be polluted with 50+ specialized control widgets that only matter in creative tool contexts. At the same time, every tool surface we build (pixel editor, music apps, CSS inspector, dithering tool, animation tuner) needs the same primitives — knobs, faders, color pickers, layer trees, property rows. Without a shared library, each app re-invents these poorly.

Ctrl is the shared vocabulary. Build the primitives once, compose them per-consumer.

### Consumers

| Consumer | What it needs |
|----------|---------------|
| **StudioApp** (RadOS) | Color picker, layer tree, tool palette, brush/opacity controls |
| **Flow** (Chrome extension) | Full CSS inspector — box model, shadow editor, grid template, color picker |
| **dithwather** (sandbox) | Threshold sliders, palette controls, dither pattern selection |
| **RadOS music apps** | Knobs, faders, XY pads, meters, sequencer grids (lower priority) |
| **Future creative tools** | Animation timeline, keyframe editor, shader parameter tuning |

---

## Architecture Rules

These are locked decisions. Don't second-guess them — they were debated.

### 1. Portable library, zero RadOS coupling

Ctrl has no knowledge of RadOS. No AppWindow imports, no window store, no catalog config, no Zustand slices. RadOS consumes ctrl and wires it into its own window system. Ctrl components work in any React app.

### 2. Controlled components only

Every component takes `value` + `onChange`. No built-in store, no state management abstractions. The consumer owns state however they want — `useState`, Zustand, jotai, whatever. If a consumer wants preset management, point them to Zustand (we may provide a skill for this later).

### 3. Extends radiants tokens, doesn't fork them

`ctrl.css` imports `@rdna/radiants/tokens` and builds a thin alias layer on top. Structural tokens (`--color-page`, `--color-main`, `--color-accent`, `--color-line`) always come from radiants so ctrl inherits the host theme's identity.

Ctrl-specific aliases (`--ctrl-fill`, `--ctrl-thumb`, `--ctrl-meter-high`) map to radiants tokens. Don't introduce raw OKLCH values unless absolutely no radiants token covers the use case. When in doubt, use the existing radiants token.

**The Paper mockup colors match the DNA palette** — they're just authored in hex, not OKLCH. Map Paper values to existing RDNA semantic tokens, don't hardcode hex.

### 4. Base UI where useful, hand-roll the rest

Use `@base-ui/react` for discrete selection components where it earns its keep (Toggle, Dropdown, Tooltip — focus management, listbox patterns). Hand-roll everything else. The `useDragControl` hook already provides ARIA bindings, keyboard handling, and pointer capture for all continuous controls.

No WCAG compliance burden — this is a power-user context. Basic keyboard support + ARIA roles (which you already have) is sufficient.

### 5. Rendering: DOM default, canvas for hot data, SVG for arcs

| Approach | When to use |
|----------|-------------|
| **DOM/CSS** | Default for everything. Tailwind classes, CSS vars, standard React. |
| **Canvas** | Real-time data visualization only — waveforms, spectrums, meters, sparklines. Use `useCanvasRenderer` hook. |
| **SVG** | Rotary/arc controls where path math is cleaner than CSS transforms — Knob, ArcRing. |

The existing component split already follows this pattern. Match it.

### 6. Density context drives default sizing

`ControlPanel` provides a `DensityContext` (compact / normal / spacious). Child controls should read this context and use it as their default size. An explicit `size` prop on any individual control overrides the density default.

This means a compact panel automatically renders small controls without passing `size="sm"` to 30 components, but a hero knob can still be `size="lg"`.

### 7. Primitives only — no domain presets

The library ships individual components organized by category. No composed "timeline controls" or "shader panel" modules. Agent skills will handle domain-specific composition later. If a composition pattern stabilizes across 3+ consumers, then consider promoting it to a shipped module.

---

## Current export topology

```
@rdna/ctrl            → everything
@rdna/ctrl/controls   → continuous value (Knob, Fader, Slider, XYPad, NumberScrubber, Ribbon, ArcRing)
@rdna/ctrl/selectors  → discrete selection (SegmentedControl, Stepper, ButtonStrip, Toggle, etc.)
@rdna/ctrl/readouts   → data display (Meter, LEDArray, Sparkline, Waveform, Spectrum)
@rdna/ctrl/layout     → panel composition (ControlPanel, Section, PropertyRow, PanelTitle)
```

---

## What exists today

**27/27 components are fully implemented.** Every component has a real, functional implementation with styling, event handling, and integration with `useDragControl` or Base UI.

### Controls (continuous value) — 9 components
| Component | Lines | Notes |
|-----------|-------|-------|
| ArcRing | 143 | SVG arc with drag control |
| Fader | 103 | Vertical track with positioned thumb |
| Knob | 158 | Rotary SVG, needle indicator, 270° sweep |
| NumberInput | 139 | Wraps @base-ui NumberField with scrub area |
| NumberScrubber | 82 | Inline horizontal drag-to-adjust |
| Ribbon | 150 | Horizontal strip with optional spring-return |
| ScrubSurface | 71 | Vertical scrub wrapper for arbitrary elements |
| Slider | 107 | Horizontal track with thumb |
| XYPad | 129 | 2D surface with crosshair and dot-grid |

### Selectors (discrete selection) — 11 components
| Component | Lines | Notes |
|-----------|-------|-------|
| ButtonStrip | 116 | Cell-based preset bar, radio or multi-select |
| ChipTag | 104 | Pill-shaped selectable tags |
| ColorPicker | 191 | Grid dropdown with swatch selection |
| ColorSwatch | 80 | Color preview rect with label |
| Dropdown | 200+ | Select wrapper with styled popup |
| IconRadioGroup | 81 | Icon-cell radio group with tooltips |
| MatrixGrid | 87 | CSS grid of toggle cells |
| RadialMenu | 121 | SVG pie segments |
| SegmentedControl | 102 | Horizontal tab bar with gold active |
| Stepper | 118 | Decrement/value/increment row |
| Toggle | 88 | Slider-dot binary switch |

### Readouts (data display) — 6 components
| Component | Lines | Notes |
|-----------|-------|-------|
| LEDArray | 67 | Row of colored indicator dots with glow |
| Meter | 135 | VU-style segmented bar |
| Sparkline | 104 | Canvas line/dot chart |
| Spectrum | 79 | Canvas vertical bar analyzer |
| Tooltip | 63 | Wraps @base-ui tooltip |
| Waveform | 77 | Canvas waveform path |

### Layout — 5 components
| Component | Lines | Notes |
|-----------|-------|-------|
| ControlPanel | 61 | Dark panel container with density context |
| LayerTreeRow | 96 | Hierarchical tree row with indent/expand |
| PanelTitle | 45 | Top-level heading with trailing rule |
| PropertyRow | 50 | Cell-based label + control row |
| Section | 84 | Collapsible panel section with ornamental rules |

### Primitives (shared hooks/types)
| File | Purpose |
|------|---------|
| `useDragControl` | Pointer capture, ARIA, keyboard, step snapping for all continuous controls |
| `useCanvasRenderer` | Canvas 2D setup with DPR handling for readout components |
| `types.ts` | Shared interfaces: `ContinuousControlProps`, `ReadoutProps`, `DragControlConfig`, `ControlSize`, `Point2D` |

---

## Priority Tiers

### Tier 1 — MUST: Cross-domain primitives (Paper 1:1)

The primary deliverable. Implement every primitive from the Paper mockups that shows up across multiple tool surfaces. Most of the base components exist — this tier is about achieving visual/behavioral parity with the Paper design spec.

**Focus areas:**
- Stepper with unit dropdown (px, %, em, rem, etc.)
- Number Scrubber variants (basic, scrubbing state, multi-field)
- Color Picker (HSB gradient area + hue/alpha sliders + hex/HSBA inputs) — current impl is a grid dropdown, Paper shows a full picker
- Dropdown (unit picker, blend modes, position types — various enum lists)
- Layer Tree polish (expand/collapse, element type tags, depth indentation)
- Property input row (label + value + unit cells, Fill/Min/Max dropdowns)
- Checkbox and Switch (wider toggle with ON/OFF labels)
- Lamp Button (lit square for on/off state indicators — Solo/Mute but also universal enable/lock/active)
- Section Header/Footer polish (min/max toggle, collapse action, ornamental rules, footer with centered label)
- Label Tab Row (sub-section tabs with trailing pixel icons)

### Tier 2 — SHOULD: Polish existing components

The 27 built components are functional but may need refinement to match Paper precisely. Review each against the mockup frames and tighten:

- Visual fidelity (glow effects, border treatments, active/inactive states)
- Density responsiveness (do they read `DensityContext` and adjust?)
- Consistent value display formatting
- Keyboard interaction completeness
- Gold-as-focus consistency (Paper uses `--color-accent` as universal active indicator)

### Tier 3 — COULD: Compounds and creative-reign

Build these if Tier 1 and 2 are solid. Creative free-reign here — use judgment on what's most useful.

**High value compounds:**
- **Timeline track** — temporal editing primitive (animation, video, audio, keyframe sequencing)
- **Keyframe editor** — property transitions, time-based value changes
- **Curve Editor** — bezier/easing curves for gradients, animation, shaders
- **Spring/Easing visualizer** — DialKit-inspired live curve preview
- **Gradient editor** — multi-stop gradient bar with draggable stops

**CSS inspector compounds (Flow donors):**
- Box Model Visualizer (nested trapezoid inset diagram)
- Shadow Editor (direction grid + X/Y/Blur/Spread + color)
- Grid Template Editor (proportional track visualizer with drag handles)
- Edge Preview Box (live preview of applied border/radius/shadow)

**Layout/editorial primitives (InDesign-class):**
- Ruler / guide bar (measurement strip with snapping)
- Minimap / overview (large canvas navigation)
- Transform handles (rotate/scale/skew)
- Alignment Grid (3x3 dot matrix — exists as MockUp in Paper)

**Other:**
- Histogram (distribution readout)
- Crop / region selector
- Node socket / port (connection point for node editors)
- Form components for admin/dev surfaces (text input, textarea, multi-select)
- State management convenience hook (`useControlPanel`)

### Tier 4 — BACKLOG: Music/domain-specific

Not in scope for this pass. Primitives that only serve one domain:

- 16-Step Sequencer grid
- 808 Pattern Editor (4-row drum grid)
- Channel Strip composition (Knob + Fader + Pan + XY)
- Skeuomorphic music player (textured surfaces, brushed metal)
- Orbiter widget (compact player with CRT effects)
- Pitch Bend (already built as Ribbon — may need spring-return variant)
- Spectrum / Waveform enhancements (already built, may need audio-specific features)

---

## What NOT to build

- **RadOS integration** — no docking, companion windows, catalog wiring, Zustand window store. RadOS adapts ctrl, not the other way around.
- **Domain-specific presets** — no `@rdna/ctrl/timeline` or `@rdna/ctrl/shaders` composed modules. Primitives only.
- **MIDI/audio bridge code** — Web MIDI and Web Audio API bindings are consumer concerns.
- **Built-in state management** — no store, no preset system. Controlled components. (You *may* build a convenience hook if you want — your call.)

---

## Testing

- **Test hook logic** — `useDragControl` value clamping, step snapping, keyboard handling, 2D normalization. `useCanvasRenderer` setup. Pure logic in formatting/normalization utilities.
- **Don't test visual rendering** — mounting a Knob in jsdom to assert SVG paths is low-value. Visual validation happens against the Paper mockups.
- **Framework:** Vitest + @testing-library/react (already in devDeps).

---

## Development Workflow

Two options for previewing components during development:

1. **`@rdna/preview`** — standalone preview page pattern, hot-reloading sandbox
2. **RadOS `/ctrl-preview` route** — see components in the RadOS desktop context

Your call which to use. Paper is the visual spec — build to match it.

---

## Reference Material

| Resource | Location |
|----------|----------|
| **Paper design file** | Currently selected frames in Paper app (12 frames, ~50 component types) |
| **Control surface brainstorm** | `ideas/brainstorms/2026-03-26-control-surface-brainstorm.md` |
| **Control surface primitives plan** | `docs/plans/2026-04-08-control-surface-primitives.md` |
| **Control density modes plan** | `docs/plans/2026-03-28-control-density-modes.md` |
| **Controls library brainstorm** | `ideas/brainstorms/2026-03-27-rdna-controls-library-brainstorm.md` |
| **DialKit (reference, not dependency)** | https://joshpuckett.me/dialkit |
| **Radiants design system** | `packages/radiants/DESIGN.md` |
| **Flow extension (donor UI)** | `/Users/rivermassey/Desktop/dev/sandbox/flow/` |

### DialKit — what to take from it

DialKit is a floating control panel for live-tuning parameters. It has sliders, toggles, color pickers, spring editors, and bezier curve editors with keyboard-centric precision (hold key + scroll to adjust). It's config-driven — control types are inferred from value shapes.

We're forking the **philosophy** (declarative parameter control, real-time feedback, keyboard precision), not the code. Our implementation uses RDNA primitives, our token system, and our visual language.

### Visual language (from Paper)

- **Palette:** Deep black bg, cream text, gold accents — maps to RDNA `--color-page`, `--color-main`, `--color-accent`
- **Active states:** Gold text + gold glow + cream 25% background fill
- **Inactive states:** Dim cream (~50% opacity), no glow
- **Typography:** Joystix monospace at 10–12px for labels/values, Mondwest for panel titles
- **Borders:** 1px cream at ~25% opacity for dividers, gold 1px for active elements
- **Surfaces:** Semi-transparent black for input cell backgrounds
- **Icons:** 16px pixel-art icons, gold when active, cream when inactive
- **Density:** ~321px panel width packs controls tightly — pixel fonts allow legibility at 10px

---

## The big picture (context, not scope)

Ctrl is the first layer of a larger vision. Eventually:

- **Agent skills** will know which ctrl primitives to import and compose for specific domains (animation, shaders, CSS, audio). The "preset" lives in the skill's prompt, not in shipped code.
- **Timeline and keyframe editing** will be the most important compound primitive — every creative tool eventually needs temporal editing.
- **A light mode** will come when there's a consumer for it. The token architecture supports it (radiants tokens flip per mode), it just needs the ctrl alias layer to differentiate `:root` from `.dark`.
- **RadOS ControlSurface** will be a consumer-side integration that docks ctrl panels into AppWindows with detach/re-dock behavior. That's RadOS's job, not ctrl's.

You don't need to build toward any of this. Just know it's where we're headed so you make primitives that compose well.
