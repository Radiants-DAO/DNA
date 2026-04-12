# @rdna/sprite — Grill Output

**Date:** 2026-04-11
**Status:** Grill complete. All forks resolved. Ready for planning.
**Precursor:** `ideas/brainstorms/2026-04-11-rdna-sprite-grill-kickoff.md`

## Resolved Decisions

### Fork 1 — Generation Pipeline

- **RD + palette correction is the v1 pipeline.** Empirically validated: Retro Diffusion + Aseprite palette remap produces usable Radiants-palette assets.
- **No custom model training for v1.** Training deferred to future — motivated by resolution (beyond RD's 256px cap), not style.
- **RD TOS prohibits training on outputs.** Future training uses the ~2-year Aseprite corpus.
- **Aseprite CLI handles recolor + dither — not a custom TS script.** One command:
  ```
  aseprite -b raw.png \
    --palette radiants-palette.png \
    --dithering-algorithm ordered \
    --dithering-matrix bayer4x4 \
    --color-mode indexed \
    --save-as sprite.ase
  ```

### Fork 2 — Engine Architecture

- **Palette source of truth:** JSON at `packages/radiants/assets/palettes/radiants.json`. Generated outputs: `.gpl`/`.ase` palette for Aseprite, TS constants for runtime. Decoupled from Radiants theme tokens (different concerns — theme tokens are semantic + mode-flipping; sprite palette is just "these 8 oklch values").
- **Master format:** `.ase` files at `packages/radiants/assets/sprites/`. Committed alongside generated PNG + SVG + JSON metadata.
- **Static sprites → SVG (rect-union, palette as CSS vars).** Themeable, crisp at all DPR/zoom (no fractional-zoom smoothing issue), SSR-native. Rect-union ~80 lines TS.
- **Animated sprites → sprite-sheet PNG + CSS `steps()` + `image-rendering: pixelated`.** Simple, cross-browser, GPU-painted. Fractional-zoom softness accepted on transient animations.
- **No runtime tilemap shipped by default.** Build-time derivable from `.ase` if a future consumer needs pixel manipulation.
- **Aseprite CLI as dev-machine toolchain.** Generated TS/PNG/SVG committed to git. No Aseprite in CI. Pre-commit hook enforces sync.
- **Dither baked at creation time** (Aseprite `--dithering-matrix bayer4x4`), not render time.
- **SVG union-by-color** for clean output. Rect-union v1; path-tracing upgrade later if needed.

### Fork 3 — Integration

- **Studio = RDNA Creation Hub** with tabbed creation surfaces:
  - **v1 tabs:** Patterns, Icons, Transition Animations
  - **Later:** Video Openreel editor, Dither image editor
  - **Long-term:** Replace Aseprite entirely, integrate custom generation model
- **Aseprite ingest:** via CLI (collapsed by toolchain decision).
- **JSON serialization:** palette as JSON, sprite metadata as Aseprite `--data` JSON export.

### Fork 4 — First Milestone

Sequential, two checkpoints:

1. **`@rdna/pixel` upgrades** — rect-union in `svg.ts` + icon-to-icon pixel-dissolve transitions (using existing `diffBits` + `TransitionMode`) + Studio Icons/Patterns tabs. Folded into existing `feat/pixel-art-system` work.
2. **`@rdna/sprite` skeleton** — new package, JSON palette, Aseprite CLI wrapper, first `.ase` → committed PNG + SVG, `<Sprite>` component. Runs concurrently.

## Package Responsibilities

| | `@rdna/pixel` | `@rdna/sprite` |
|---|---|---|
| Data model | 1-bit bitstring | Palette-indexed (8 colors) |
| Renders as | SVG (rect-union, single fill) | Static: SVG (rect-union, CSS var palette). Animated: sprite-sheet PNG + CSS `steps()` |
| Animation | Pixel-dissolve via `diffBits` + `TransitionMode` + CSS `steps()` | Aseprite frame export → sprite sheets |
| Theming | Single fill color (ink/accent/etc) | Full palette per-color via CSS vars |
| Toolchain | Hand-authored + `svgToGrid` import | Aseprite CLI + RD API |
| Generation | Skill/structured (future, separate grill) | RD + palette-lock (v1), trained model (future) |

## Pipeline

```
RD API → PNG
  ↓
aseprite -b --palette radiants-palette.png --dithering-matrix bayer4x4 --color-mode indexed
  ↓
.ase (master) → packages/radiants/assets/sprites/
  ↓
pre-commit codegen (shells to aseprite -b --save-as --data)
  ↓
sprite.png + sprite.svg + sprite.json + sprite.ts (opt-in tilemap)
  ↓
<Sprite name="hero" /> → SVG (static) or PNG sheet (animated)
```

## Studio Architecture

```
RadiantsStudioApp.tsx
├── Patterns tab — existing 32×32 canvas evolved for 1-bit tile pattern design
├── Icons tab — icon registry browser + IconTransition previewer
├── Transitions tab — pixel-dissolve transition tester (TransitionMode selector)
├── Sprites tab (milestone 2) — browse committed sprites, test CSS var palette theming
└── (future) Dither editor, Video Openreel, Generation model integration
```

## What NOT to Re-Grill

- The pixel/sprite package split (locked in memory: `project_pixel_sprite_split.md`)
- Whether icons go in `@rdna/sprite` (they don't — `@rdna/pixel`)
- Whether to train a model for v1 (no — RD + palette correction)
- Whether Aseprite is the v1 editor (yes — CLI for build, MCP for edit)
- Studio's identity (RDNA Creation Hub, not pixel editor)
- The 1-bit primitive decision for `@rdna/pixel`
- The in-flight pixel-corners consumer migration (unrelated)
