# Dither Pipeline Brainstorm

**Date:** 2026-04-13
**Status:** Informational — spike candidates identified, no decisions made
**Next:** Team explores options via spikes + tests

## Two Goals

1. **RadOS UI dithering** — dithered shadows, transitions, gradients, scrollbars, selection highlights, loading states. Dithering as a core visual identity for the full chrome package.
2. **OpenCut video FX** — dithering/retro effects in a forked OpenCut for RDNA-flavored video processing.

Both goals may share underlying dithering infrastructure, or may use completely different approaches. That's what the spikes will determine.

---

## Landscape: What Exists

### In the RDNA Ecosystem

| Asset | Location | What It Does | Gaps |
|-------|----------|-------------|------|
| **dithwather sandbox** | `/Users/rivermassey/Desktop/dev/sandbox/dithwather` | Next.js RadOS shell demoing dither algorithms | Gradients only, no image/video input |
| **@rdna/dithwather-core** | npm v0.0.1 | CPU error diffusion (10 algorithms) + Canvas 2D ordered dither | No GPU path, no palette management |
| **@rdna/dithwather-react** | npm v0.0.1 | React bindings for dithwather-core | Tied to Canvas 2D |
| **WebGLSun.tsx** | `apps/rad-os/components/background/` | Live 4x4 Bayer dither shader (WebGL) on desktop bg | Hardcoded to sun animation, not reusable |
| **51 dither patterns** | `packages/radiants/patterns/` | Static pattern assets (6 groups) | No animation, no GPU, pure CSS |
| **Postprocessing pipeline doc** | `ideas/rados-postprocessing-pipeline.md` | Architecture B: DOM capture → Three.js TSL → WebGPU. 10-pass pipeline. Not yet built. | Idea stage only |

### External Tools

#### shader-lab (`@basementstudio/shader-lab` v1.3.4)
- **Repo:** https://github.com/basementstudio/shader-lab
- **Stack:** React + Three.js TSL + WebGPU. No raw GLSL/WGSL — TypeScript node graphs compile to shaders at runtime.
- **Architecture:** Visual editor exports JSON compositions → npm runtime renders them. Layer-based with blend modes, masks, keyframe timeline.
- **Relevant effects (38 total):**
  - Dithering — Bayer 2x2/4x4/8x8, noise patterns, mono/duo-tone/source color modes, chromatic split, animation
  - Color Reduction — Posterize with gamma curves, 2-16 levels
  - CRT — Slot mask, aperture grille, composite TV, phosphor, scanlines, barrel distortion, bloom, flicker
  - Halftone — CMYK dot separation
  - ASCII — Character atlas rendering
  - Pixelation — Block downsampling
  - Edge Detect, Chromatic Aberration, Displacement Map, Pixel Sorting, Smear, etc.
- **Video/image input:** Full support (MediaPass handles both with fit/cover/playback)
- **Custom shaders:** Write in TSL, return a node. Source mode (generate pixels) or effect mode (process input).
- **Consumption:** `npm install @basementstudio/shader-lab three` — peer deps: React 19, Three.js 0.183+
- **Constraint:** WebGPU-only rendering. Client-side only.

#### OpenCut
- **Repo:** https://github.com/opencut-app/opencut
- **Stack:** Next.js 16 + wgpu 29.0.1 + Rust WASM bridge. Zustand, Radix UI, Tailwind.
- **Effect system:** Registry-based. TypeScript `EffectDefinition` → WGSL shader → wgpu pipeline → per-frame application. Only Gaussian Blur shipped so far.
- **How to add effects:** Create TS definition + WGSL shader + register in Rust pipeline + rebuild WASM.
- **Texture format:** `Bgra8Unorm` — correct for dithering.
- **Export:** frame-by-frame via mediabunny (MP4/WebM). Effects apply during export.
- **Constraint:** CONTRIBUTING.md says don't PR effects right now — mid-refactor from DOM preview to binary rendering. Fork-friendly though.
- **Multi-pass:** Supported (blur uses H+V passes). Dithering could be single-pass (ordered) or multi-pass.

#### Retro Diffusion API
- **Endpoint:** `POST https://api.retrodiffusion.ai/v1/inferences`
- **Models:** rd_pro (256x256 max, $0.18), rd_fast (384x384, ~$0.05), rd_plus (192x192, ~$0.08)
- **Relevant features:** `input_palette` (color constraint), `remove_bg` (transparency), `tile_x`/`tile_y` (seamless), `return_spritesheet` (PNG instead of GIF for animations)
- **Output:** Base64-encoded PNG/GIF
- **Animation:** 4-16 frames, walking cycles, idle, attacks, VFX

#### didder (Go CLI)
- **Repo:** https://github.com/makew0rld/didder
- **Algorithms:** 13 error diffusion (Floyd-Steinberg, Atkinson, Stucki, Burkes, Sierra variants, etc.) + 15 ordered dither matrices + random noise
- **Unique value:** Mathematically correct linearization, luminance-weighted channel processing, strength control, recolor-after-dither, MMCQ auto-palette extraction
- **I/O:** JPEG/PNG/GIF/BMP/TIFF in → PNG/GIF out
- **Use case:** Batch CLI processing. Could sit in a build script between RD API output and Aseprite.

#### Aseprite CLI
- **Dithering:** 3 algorithms (none, ordered, old), 3 matrices (bayer2x2/4x4/8x8). Limited.
- **Strengths:** Sprite sheet packing (`--sheet-pack`), palette swaps (`--palette`), frame splitting, scaling, format conversion, tag/layer/slice export.
- **Role in pipeline:** Post-processing and export, not dithering.

---

## Dithering: How It Works (Algorithm Reference)

### GPU-Parallel (real-time on video)

**Ordered dithering (Bayer):** Compare each pixel's intensity against a threshold matrix value. If above, snap to lighter palette color; if below, snap to darker. Each pixel is independent — trivially parallel. ~30 lines of shader code.

**Clustered dot / halftone:** Same principle, different threshold matrix shape. Produces dot-cluster patterns instead of cross-hatch.

**Random noise:** Add random offset before palette snap. Cheapest, least structured.

**Blue noise:** Spatially-distributed noise that avoids visible patterns. Better than white noise for animation (no shimmer). Key technique from @soulegit bookmark.

### CPU-Sequential (export quality, not real-time)

**Error diffusion:** Process pixels left-to-right, top-to-bottom. For each pixel, find nearest palette color, compute the error (difference), distribute that error to neighboring unprocessed pixels using a weight kernel. Each pixel depends on its predecessors — inherently sequential.

| Algorithm | Kernel | Character |
|-----------|--------|-----------|
| Floyd-Steinberg | 2x3 | Standard, balanced |
| Atkinson | 3x3 | Classic Mac look, high contrast, loses detail |
| Stucki | 3x5 | Smoother than F-S, better gradients |
| Sierra | 3x5 | Similar to Stucki, slightly different weights |
| Jarvis-Judice-Ninke | 3x5 | Widest diffusion, smoothest but slowest |
| Burkes | 2x5 | Faster approximation of Stucki |

### Perceptual Correctness

Both dithwather-core and didder do this right:
1. **sRGB → linear conversion** before color math (LUT-based)
2. **Luminance-weighted distance** for nearest-color lookup (Rec. 709: 0.2126 R, 0.7152 G, 0.0722 B)
3. **Linear → sRGB conversion** on output

Most implementations skip this. It matters — wrong color space = wrong nearest-color decisions = visible banding.

---

## RadOS UI Dithering: Option Space

### Option A — CSS Patterns (no GPU)

Use existing 51 dither patterns as `mask-image` or `background-image` on UI elements.

```css
.dithered-shadow {
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
  mask-image: url('/patterns/bayer-4x4.png');
}
```

- Works everywhere, no WebGPU requirement
- Already have the pattern assets
- No animation (static patterns only)
- No per-pixel color control

### Option B — CSS + SVG Filters

SVG `<feTurbulence>` + `<feDisplacementMap>` can simulate dithering. CSS `filter: url(#dither)` applies it.

- Animated via SVG `<animate>` or CSS
- CPU-rendered by the browser
- Limited algorithm control
- Performance varies by browser

### Option C — Canvas 2D per-element

Render dithered effects to offscreen canvases, use as CSS backgrounds via `canvas.toDataURL()` or `element()`.

- This is roughly what dithwather does now
- Full algorithm control
- Per-frame updates are expensive (toDataURL is slow)
- Can't easily apply to arbitrary DOM elements

### Option D — WebGPU shader per-element

Each dithered UI element gets a small WebGPU canvas behind it rendering the dithered effect.

- Full shader control, real-time animation
- Heavy — many small GPU contexts
- Overkill for static shadows

### Option E — Global postprocessing pass

One full-viewport WebGPU canvas. The entire DOM gets dithered as a postprocessing step. Ties into the postprocessing pipeline doc.

- One GPU context for everything
- Can't selectively dither some elements but not others
- Requires DOM capture (`getDisplayMedia`) for full effect
- Phase 1 (overlay-only) could add grain/scanlines without capture

### Option F — shader-lab compositions as textures

Use `useShaderLabTextureSource` to render dithered compositions, apply as CSS `background-image` via canvas-to-blob.

- Gets shader-lab's full effect stack
- Animated via shader-lab's timeline system
- Each element needs a composition instance
- Dependency on Three.js + shader-lab runtime

### Option G — Hybrid

Different techniques for different elements:
- Static shadows/gradients → CSS patterns (Option A)
- Animated transitions → WebGPU shader (Option D or E)
- Loading states → Canvas 2D or shader-lab composition
- Global atmosphere (grain, scanlines) → Postprocessing pass (Option E)

---

## OpenCut Fork: Option Space

### Option A — Port shader-lab shaders to OpenCut's wgpu pipeline

Extract compiled WGSL from shader-lab's TSL passes. Wrap each as an OpenCut `EffectDefinition`. Register in Rust pipeline.

- Gets shader-lab's quality without runtime dependency
- Manual extraction and adaptation work
- Maintains OpenCut's architecture (pure wgpu, no Three.js)

### Option B — Add shader-lab as a dependency to OpenCut

Wire `useShaderLabPostProcessingSource` into OpenCut's export pipeline.

- Gets all 38 effects immediately
- Heavy dependency (Three.js + shader-lab)
- Architecture mismatch (OpenCut uses wgpu directly, not Three.js)

### Option C — Write WGSL shaders from scratch for OpenCut

Implement dithering/CRT/halftone directly in WGSL for OpenCut's pipeline. Use shader-lab, dithwather, and didder as algorithmic references.

- Clean integration with OpenCut's architecture
- Full control over parameters and quality
- More work upfront
- The algorithms are well-documented and simple

### Option D — Shared WGSL shader library

Build a standalone package of `.wgsl` shader files + TypeScript types. Both RadOS (via Three.js TSL import) and OpenCut (via wgpu pipeline) consume the same shaders.

- One source of truth for the math
- Each consumer wraps shaders in their own pipeline
- WGSL is portable across wgpu and WebGPU
- Need to handle uniform buffer layout differences

---

## Pipeline Integration: How the Pieces Could Connect

```
                    ┌─────────────────────────────────────┐
                    │         Generation                   │
                    │  RD API (text → pixel art)           │
                    │  Studio pixel editor (manual)        │
                    └──────────────┬──────────────────────┘
                                   │ PNG / GIF / base64
                                   ▼
                    ┌─────────────────────────────────────┐
                    │         Processing                   │
                    │                                      │
                    │  ┌─── GPU (real-time) ────┐          │
                    │  │ Ordered dither (Bayer)  │          │
                    │  │ Blue noise              │          │
                    │  │ Halftone                │          │
                    │  │ Color reduction         │          │
                    │  │ CRT / scanlines         │          │
                    │  └────────────────────────┘          │
                    │                                      │
                    │  ┌─── CPU (export quality) ┐         │
                    │  │ Error diffusion          │         │
                    │  │ (Atkinson, F-S, etc.)    │         │
                    │  │ Palette snapping         │         │
                    │  │ MMCQ palette extraction  │         │
                    │  └─────────────────────────┘         │
                    │                                      │
                    │  Tools: dithwather-core, didder,     │
                    │         shader-lab, custom WGSL      │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────┼──────────────────────┐
                    │              │                       │
                    ▼              ▼                       ▼
              ┌──────────┐  ┌──────────┐          ┌──────────────┐
              │ RadOS UI │  │ Aseprite │          │ OpenCut fork │
              │ chrome   │  │ CLI      │          │ video FX     │
              │          │  │          │          │              │
              │ shadows  │  │ scale    │          │ timeline     │
              │ fades    │  │ palette  │          │ effects      │
              │ gradients│  │ sheet    │          │ export       │
              │ loading  │  │ pack     │          │ MP4/WebM     │
              └──────────┘  └──────────┘          └──────────────┘
```

---

## Existing Implementation: How dithwather Does It Today

**Ordered dithering** (`lib/dither/ordered.ts`): CPU Canvas 2D. Precomputed Bayer matrices (2x2, 4x4, 8x8). Per-pixel threshold comparison. Luminance-weighted nearest-color lookup in linear RGB. Palette spread calculation to auto-scale strength.

**Error diffusion** (`lib/dither/errorDiffusion.ts`): CPU Canvas 2D. Ring buffer for error rows. Serpentine scanning. Configurable strength. 10 diffusion matrices.

**Color science** (`lib/dither/color.ts`): Pre-computed LUTs for sRGB↔linear (256-entry forward, 4096-entry reverse). Rec. 709 luminance weighting.

**WebGPU** (`BenchmarkApp.tsx`): One compute shader embedded as string literal. Bayer dithering only. Used for performance benchmarking against Canvas 2D, not as a production path. 16x16 workgroups.

**No image/video input.** Demo app only processes procedural gradients. The algorithms work on `ImageData` buffers so they could process any source, but the app doesn't expose that.

**No CSS integration.** Everything renders to canvas elements within the RadOS window system. Nothing produces CSS-consumable output (mask images, backgrounds, etc.).

---

## Curated References (from X Bookmarks)

### Directly Applicable

| Who | What | Link | Relevance |
|-----|------|------|-----------|
| @soulegit | Blue noise under ASCII dither | https://x.com/soulegit/status/2018782189870272703 | Blue noise distribution for animated dither without shimmer |
| @almmaasoglu | WebGPU dither tool, 60fps any resolution | https://x.com/almmaasoglu/status/2013319748226781622 | Performance reference for WebGPU dithering |
| @MaximeHeckel | Edge detection compute shader + crosshatch postprocessing in TSL | https://x.com/MaximeHeckel/status/1944049868248371229 | Exact pattern for RadOS postprocessing pipeline. Demo: https://r3f.maximeheckel.com/webgpu/moebius |
| @Bhushanwtf | TSL Graph: visual node editor for TSL shaders | https://x.com/Bhushanwtf/status/2019326015408132481 | Prototyping tool: https://tsl-graph.xyz/ |
| @npm_i_shaders | HTML-in-canvas with dither, ASCII, glass, ripple effects | https://x.com/npm_i_shaders/status/2042656237876048258 | Validates DOM capture → shader pipeline (Architecture B) |
| @codetaur | VGA 256-palette gradients in CRT shader UI | https://x.com/codetaur/status/2033100234700763175 | VGA palette + CRT for UI chrome — very close to RDNA aesthetic |

### Technique References

| Who | What | Link |
|-----|------|------|
| @uuuuuulala / Paper | CMYK halftone shader blog post | https://paper.design/blog/retro-print-cmyk-halftone-shader |
| @kitasenjudesign | Floyd-Steinberg error diffusion algorithm | https://x.com/kitasenjudesign/status/2018675717215588363 |
| @emilkowalski | Linear's dithered logo (canvas dot field + cursor repulsion) | https://x.com/emilkowalski/status/2036778116748542220 |
| @Nomandsign | funky-shadow: React dithered gradient shadows (`npm install funky-shadow`) | https://x.com/Nomandsign/status/2040196013760422132 |
| @mattrothenberg | Scanline that distorts rendered HTML pixels | https://x.com/mattrothenberg/status/2040416074710102300 |
| @shuding | Bringing shaders to React | https://x.com/shuding/status/2040416459252547588 |
| @k_grajeda | CSS-only bloom + HDR (SVG filter, no shaders) | https://x.com/k_grajeda/status/2019906204852441156 |
| @golok727 | Native window with wgpu pixel rendering + custom React renderer | https://x.com/golok727/status/2036421649239797948 |

### Ecosystem / Tooling

| Who | What | Link |
|-----|------|------|
| @rauchg | TypeGPU: TypeScript WebGPU with `"use gpu"` directive | https://x.com/rauchg/status/1985822294930067925 |
| @NicolasZu | 11 R3F skills for Claude Code (shaders, postprocessing) | https://x.com/NicolasZu/status/2013725848818376955 |
| @Nomandsign | Custom dot shader tool | http://iamnoman.com/dot |
| @codetaur | ASCII fluid in Three.js / TSL / WebGPU | https://x.com/codetaur/status/2039063917742415988 |
| @PurzBeats | Procedural CRT sci-fi HUD generator (Three.js + TS) | https://x.com/PurzBeats/status/2028184344305508549 |

---

## Spike Candidates

### Spike 1: CSS pattern shadows
Can the existing 51 dither patterns produce convincing dithered drop-shadows via `mask-image` or `filter`? How does it look on AppWindow? Test with `funky-shadow` npm package as reference.

### Spike 2: shader-lab in RadOS
Install `@basementstudio/shader-lab` in the dithwather sandbox. Render a dithered composition with RDNA palette colors. Measure bundle size, GPU memory, and rendering overhead. Test as a background texture behind an AppWindow.

### Spike 3: WebGPU ordered dither shader (standalone)
Write a minimal Bayer 8x8 + blue noise WGSL shader. Render to canvas. Test with image input (drag-and-drop). Measure fps at various resolutions. Compare visual quality to dithwather-core's Canvas 2D output.

### Spike 4: OpenCut dithering effect
Fork OpenCut. Add a dithering `EffectDefinition` + WGSL shader. Build WASM. Apply to a video clip. Measure per-frame cost. Document the integration steps.

### Spike 5: Animated dither transitions
Prototype a window open/close animation where the window content dissolves via animated Bayer dithering (threshold sweeps from 0→1). Test both CSS (pattern opacity animation) and GPU (shader with time uniform) approaches.

### Spike 6: didder vs dithwather-core quality comparison
Run the same test image through both tools with matching palettes. Compare Atkinson, Floyd-Steinberg, and Stucki output. Evaluate whether didder's CLI adds value over dithwather-core for batch workflows.

### Spike 7: Global postprocessing overlay (Phase 1)
Implement the postprocessing pipeline Phase 1: transparent WebGPU canvas over RadOS DOM. Film grain + scanlines + vignette only (no DOM capture). Test with shader-lab vs raw TSL.

---

## Open Questions (for spikes to answer)

- Does shader-lab's bundle size / GPU overhead justify the dependency vs writing 200 lines of WGSL?
- Can CSS pattern masking produce shadows that look as good as GPU-rendered dithered shadows?
- Is blue noise dithering worth implementing for animated effects, or does Bayer look fine in motion?
- How does OpenCut's wgpu pipeline perform with a dithering pass on 1080p video?
- Should dithwather-core stay as the CPU error diffusion library, or does didder (Go CLI) replace it for batch processing?
- Can shader-lab compositions be used as CSS background textures without visible performance cost?
- What's the right abstraction boundary — shared WGSL shaders, shared TypeScript library, or separate implementations per consumer?

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA-dither-pipeline`
- Branch: `feat/dither-pipeline`
