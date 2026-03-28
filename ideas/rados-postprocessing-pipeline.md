# RadOS Postprocessing Pipeline

**Status:** Idea / Future Feature
**Author:** KEMO (Radiants)
**Date:** March 2026
**Depends on:** Three.js r183+, WebGPU renderer, Three Shading Language (TSL)

---

## 1. Vision

Full cinematic postprocessing for RadOS — the same quality ceiling as shader.se, applied to a DOM-based desktop OS. Every pixel on screen passes through a GPU pipeline before reaching the user's eyes.

---

## 2. Reference: shader.se Pipeline Analysis

shader.se uses Three.js r183 with the WebGPU renderer. All shaders are authored in TSL (Three Shading Language) — a node-based shader system in JavaScript that generates WGSL at runtime. No hand-written `.glsl` or `.wgsl` files.

### 10-Pass Render Pipeline

| # | Pass | Description |
|---|------|-------------|
| 1 | **3D Scene Render** | Base render target |
| 2 | **Motion Blur** | Temporal frame accumulation (ping-pong render targets, blend factor decays on delta time) |
| 3 | **Bloom** | Multi-level mip-map blur (7 levels), Kawase/dual-filter approach. Configurable threshold, radius, smoothing, luminance |
| 4 | **Chromatic Aberration + Lens Distortion** | Barrel distortion UV warp (`1 + r² * (strength + border * sqrt(r))`), then per-channel UV offset for R/G/B split. Anti-aliased with smoothstep sub-pixel blending |
| 5 | **Sepia / Color Grading** | 3x3 matrix multiply with standard sepia coefficients `(.393,.769,.189 / .349,.686,.168 / .272,.534,.131)`, mixed by intensity |
| 6 | **Brightness / Contrast / Pow** | `(color - 0.5) * contrast + 0.5`, `color * brightness`, `pow(color, gamma)` |
| 7 | **Vignette** | SDF rounded-rect distance field + smoothstep edge falloff, combined with radial distance vignette |
| 8 | **UI Overlay** | Separate texture with its own lens distortion, crossfades light/dark variants |
| 9 | **Film Grain** | Classic hash noise: `fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453)`, time-animated, applied proportional to dark areas |
| 10 | **Output** | Final composite |

### Key Implementation Details

**Lens Distortion (DR/DM functions):**
- Centers UV, computes radial distance `r = x² + y²`
- Warps via `1 + r * (strength + border * sqrt(r))` — polynomial barrel distortion
- Wrapper applies scale+offset to prevent black edges

**Chromatic Aberration (ChromaticAberrationNode2):**
- Applies lens distortion first for base UV warp
- Samples R/G/B at radially offset UVs (red inward, blue outward)
- Boundary check: if UV exits [0,1], halves the aberration amount
- Sub-pixel AA: horizontal/vertical offsets of 0.005 with smoothstep blending

**Bloom (MipMapBlurNode):**
- 7-level mip-map pyramid (downsample → blur → upsample)
- Configurable: intensity, threshold, radius, smoothing, luminance threshold/smoothing

**Motion Blur:**
- Two render targets, ping-pong
- Blends current frame with previous at `motionBlurStrength`
- Decay threshold at ~0.00833s (120fps base)

**Film Grain:**
- `fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + time * velocity)`
- Applied as `noise * intensity * (1 - color.rgb)` — heavier in shadows

---

## 3. Architecture: DOM-to-GPU Pipeline

The core challenge: RadOS is DOM. shader.se's content is already GPU textures. We need to bridge that gap.

### Architecture B — DOM Capture + WebGPU Postprocessing (Recommended)

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐    ┌────────┐
│  RadOS DOM   │ →  │ getDisplay   │ →  │ Three.js WebGPU     │ →  │ Screen │
│  (hidden)    │    │ Media capture│    │ TSL postprocessing   │    │        │
└─────────────┘    └──────────────┘    └─────────────────────┘    └────────┘
       ↑                                                               │
       └──── pointer events pass through canvas ───────────────────────┘
```

1. **Capture:** `getDisplayMedia` ("share this tab") provides real-time VideoFrame → GPU texture at 60fps
2. **Process:** Full 10-pass TSL postprocessing pipeline
3. **Display:** Fullscreen canvas overlays the DOM
4. **Interact:** The DOM remains underneath, pointer events pass through the canvas

**Trade-off:** One-time user permission prompt to "share this tab." Acceptable for an opt-in "effects mode" in a desktop OS.

### Alternative Architectures (Rejected)

| Architecture | Why rejected |
|-------------|-------------|
| **A. Overlay-only** (grain/vignette without DOM capture) | Only ~40% of the visual punch — user wants 100% |
| **C. Canvas-native UI** (render all UI via react-three-fiber) | Kills accessibility, SSR, standard DOM tooling. Massive rewrite for marginal gain |
| **html2canvas → texture** | ~10-15fps capture, too slow for interactive use |
| **CSS `element()` function** | Firefox-only, dead end |

---

## 4. Phased Rollout

### Phase 1 — Overlay Effects (No Capture)

Transparent WebGPU canvas over the DOM. Effects that don't need frame content:
- Film grain (hash noise, time-animated)
- Vignette (SDF rounded-rect + radial)
- Scanlines (optional retro toggle)
- Color grading overlay

**Ships:** Fast, zero permission prompts, sets up the Three.js/TSL infrastructure.

### Phase 2 — Full Capture Pipeline

`getDisplayMedia` capture → complete postprocessing:
- Lens distortion (barrel UV warp)
- Chromatic aberration (per-channel UV split)
- Bloom (7-level mip-map)
- Brightness / contrast / gamma
- Sepia

**Ships:** The "effects mode" toggle in RadOS settings.

### Phase 3 — Advanced + Per-Window

- Motion blur (temporal accumulation)
- Per-window effects (bloom halo on focused window)
- Cinematic boot sequence (full pipeline on startup animation)
- Transition effects (lens distortion pulse on window open/close)

---

## 5. Tech Stack

| Layer | Choice |
|-------|--------|
| Renderer | Three.js WebGPU renderer |
| Shader authoring | TSL (Three Shading Language) — JS node graphs → WGSL |
| DOM capture | `getDisplayMedia` → `MediaStreamTrackProcessor` → `VideoFrame` → GPU texture |
| Integration | React component wrapping the Three.js canvas, mounted at desktop root |
| Configuration | RDNA tokens for effect intensity, exposed via RadOS "Display Settings" app |

---

## 6. Open Questions

- **Fallback for WebGL-only browsers?** Three.js TSL can target both WebGPU and WebGL2. Pipeline works on both, just slower on WebGL2.
- **Mobile performance?** May need reduced pass count or lower resolution capture on mobile. Could skip bloom + motion blur.
- **Tab capture alternatives?** `MediaStreamTrackProcessor` with `RestrictionTarget` (Chrome 124+) can capture just a DOM element without the permission prompt. Worth investigating.
- **Effect presets?** "CRT," "Film," "Clean," "Cinematic" — user-selectable combinations of the 10 passes with curated intensity values.
