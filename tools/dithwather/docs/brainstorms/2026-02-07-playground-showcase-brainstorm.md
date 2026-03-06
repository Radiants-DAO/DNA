# Playground Showcase Redesign Brainstorm

**Date:** 2026-02-07
**Status:** Decided

## What We're Building

A major playground redesign that reorganizes demos into 4 sections (Real UI Patterns, Interactive Toys, Visual Gallery, Copy-Paste Recipes) with 12-16 new demos. Target audience is both developers (practical patterns) and designers (visual inspiration). The existing 8 demos will be restructured into this taxonomy.

## Why This Approach

The current playground is organized by feature (gradient types, mask mode, glitch, etc.) which is useful for API docs but doesn't answer "what can I build with this?" Reorganizing by use case makes the library's value immediately obvious and gives visitors copy-paste starting points. The 4-category structure mirrors how people actually discover and adopt UI libraries.

## Key Decisions

- Reorganize into 4 sections: UI Patterns, Interactive, Gallery, Recipes
- Existing demos absorbed into new structure (not deleted, reclassified)
- Each demo should be visually stunning AND practically useful
- Interactive toys should use browser APIs (cursor, scroll, possibly audio)
- Gallery section should showcase curated color palettes, not just black/white
- All demos use the radiants design system already in place

## Demo Inventory

### Section 1: Real UI Patterns

| Demo | What it shows | DitherBox features used |
|------|--------------|------------------------|
| Hero Section | Full-width gradient behind headline, threshold shifts on scroll | gradient, threshold, mode=background |
| Card Hover Effects | Row of cards, dither shifts on hover | animate (idle/hover), colors |
| Navigation Bar | Dithered gradient underline follows active link | gradient, mode=mask, threshold |
| Loading Skeleton | Pulsing dither placeholder while content loads | animate, threshold oscillation |
| Dark/Light Mode Toggle | Dither mask wipes between themes | mode=mask, threshold animation |

### Section 2: Interactive Toys

| Demo | What it shows | DitherBox features used |
|------|--------------|------------------------|
| Mouse Follower | Radial gradient center tracks cursor | gradient.center (dynamic), type=radial |
| Audio Visualizer | Threshold pulses to mic/music input | threshold (dynamic via Web Audio API) |
| Scroll-Driven Reveal | Content reveals via dither mask on scroll | mode=mask, threshold (scroll-linked) |
| Paint/Draw | Click-drag to paint dither patterns | Custom canvas + renderGradientDither |

### Section 3: Visual Gallery

| Demo | What it shows | DitherBox features used |
|------|--------------|------------------------|
| Palette Grid | 12-16 preset color combos in tight grid | colors (curated palettes) |
| Pixel Scale Explorer | Same gradient at scales 1/2/4/8/16 | pixelScale comparison |
| Algorithm Comparison | Bayer 2x2 vs 4x4 vs 8x8, large format | algorithm comparison |
| Gradient Type Showcase | All 5 types with beautiful palettes | type (linear/radial/conic/diamond/reflected) |

### Section 4: Copy-Paste Recipes

| Demo | What it shows | Code snippet focus |
|------|--------------|-------------------|
| Image Reveal on Hover | Photo revealed through dither mask | mode=mask + animate |
| Animated Background | Looping threshold animation for hero | animate + threshold cycling |
| Dithered Border | Mask mode creates dithered frame | mode=mask, creative gradient stops |
| Text Mask | Heading text visible through dither | mode=mask, typography |

## Existing Demos Reclassification

| Current Demo | New Location |
|---|---|
| Bayer Gradient Pipeline | Gallery > Algorithm Comparison (merged) |
| Gradient Types | Gallery > Gradient Type Showcase (upgraded) |
| Multi-Stop Gradients | Gallery > Palette Grid (absorbed) |
| Mask Reveal | UI Patterns > Card Hover Effects (evolved) |
| Animation States | Recipes > Animated Background (evolved) |
| Glitch Mode | Stays as standalone feature demo |
| Buttons | UI Patterns > Card Hover Effects (integrated) |
| Control Panel | Stays as interactive sandbox |

## Open Questions

- Should each recipe include a "copy code" button?
- Audio visualizer: require user mic permission or provide audio file?
- Mouse follower: update gradient center per-frame or throttled?
- Should glitch mode stay standalone or fold into Interactive section?

## Research Notes

- Existing playground: 8 demos in `apps/playground/src/App.tsx` (~1300 lines)
- Design tokens: radiants theme in `styles.css` (Joystix, Mondwest, PixelCode fonts)
- 5 gradient types available: linear, radial, conic, diamond, reflected
- DitherBox supports: gradient/colors/angle shorthand, 3 modes, animate config, pixelScale, glitch
- `@dithwather/editor` was removed — control panel is the sole interactive sandbox
- CSS already has prefers-reduced-motion support
