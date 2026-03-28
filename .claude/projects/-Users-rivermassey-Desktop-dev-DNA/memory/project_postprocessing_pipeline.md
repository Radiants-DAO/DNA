---
name: RadOS Postprocessing Pipeline
description: Full WebGPU postprocessing pipeline is an important future feature for RadOS — user wants 100% visual punch, not CSS approximations
type: project
---

Full Three.js WebGPU postprocessing pipeline planned for RadOS. User explicitly wants 100% of the visual quality — no CSS-only shortcuts.

**Why:** RadOS's desktop-OS aesthetic benefits from cinematic postprocessing (lens distortion, chromatic aberration, bloom, film grain, vignette, motion blur, color grading). Reference implementation: shader.se (Three.js r183 + TSL + WebGPU).

**How to apply:** Architecture B (DOM-to-texture via `getDisplayMedia` capture → WebGPU postprocessing → fullscreen canvas output) is the recommended path. Phased rollout:
- Phase 1: Overlay-only effects (grain, vignette, color grading) — no DOM capture needed
- Phase 2: Full capture pipeline + lens distortion, chromatic aberration, bloom
- Phase 3: Motion blur, per-window effects, cinematic boot sequence

Tech: Three.js TSL node graphs → WGSL compilation at runtime. Same approach as shader.se.

Reference analysis of shader.se's 10-pass pipeline is in the conversation that created this memory (2026-03-27).
