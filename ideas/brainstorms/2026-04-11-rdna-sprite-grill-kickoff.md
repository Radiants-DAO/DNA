# @rdna/sprite — Grill Session Kickoff Brief

**Date:** 2026-04-11
**Status:** Pre-brainstorm. This doc seeds the grill session that produces the `@rdna/sprite` brainstorm.
**Branch context:** Produced on `feat/pixel-art-system` worktree, but `@rdna/sprite` itself does not exist yet and will likely live on its own branch when implementation starts.

## How to use this doc

Open a fresh Claude Code session in `/Users/rivermassey/Desktop/dev/DNA-pixel-art`. Paste:

> Read `ideas/brainstorms/2026-04-11-rdna-sprite-grill-kickoff.md` and the memory file `project_pixel_sprite_split.md`. Then grill me on `@rdna/sprite` per the agenda. One question at a time, with your recommended answer. Start with the biggest fork first.

The previous grill session resolved the `@rdna/pixel` vs `@rdna/sprite` split and is now context-full. This brief carries the decisions forward and lists the questions that still need grilling.

## What already happened (don't re-grill)

A prior grill session pressure-tested the "unified pixel engine" idea from `docs/brainstorms/2026-03-31-radiants-pixel-art-system-brainstorm.md` and rejected it. The split is locked in memory (`project_pixel_sprite_split.md`):

- **`@rdna/pixel`** — 1-bit only. Patterns, pixel corners, `PixelBorder`, icons, 1-bit shape masks. Already exists on `feat/pixel-art-system` branch, mid-consumer-migration (`ops/pixel-corners-migration-fixes.md` has 9 open fix items). **Icons live here** and use skill/structured generation — not diffusion.
- **`@rdna/sprite`** — palette-indexed multi-color art. Dithered sprites, Aseprite ingest, model generation. **Does not exist yet.** This session designs it.

The two packages grow alongside each other with clean separation. Shared primitives (`parseBits`, `mirrorH/V`, `diffBits`) live in `@rdna/pixel/core` and can be imported by `@rdna/sprite` for bitplane operations if useful.

**Do not re-grill:**
- The pixel/sprite split itself.
- Whether icons go in `@rdna/sprite` (they don't).
- The 1-bit primitive decision.
- The in-flight pixel-corners consumer migration (unrelated to this session).

## Hard constraints on `@rdna/sprite` (locked by the user)

- **One engine for multi-color pixel art**, not per-domain silos.
- **Local model, not a cloud API.**
- **Aseprite library is the primary training corpus** (~2 years of existing art, palette-indexed, dithered).
- **Palette is ~8 max colors, 3 dominant.** Shading happens through **Bayer-style ordered dither**, not color blending. Every pixel decision is palette-constrained. "Good output" = "reads as authored in the exact Radiants palette with intentional dither patterns" — not "pretty pixel art."

## Provisionally decided (grill hard if the math changes)

- **Training a custom model.** Commercial/general LoRAs may not be tight enough for 16px/24px where every pixel matters. **But** if palette-locked post-processing gets us 80%+ of the way, this decision may be wrong and training is premature.

## Grill agenda

### Fork 1 — Training pipeline (start here; biggest risk of eating months)

**1a. The palette-lock-as-shortcut hypothesis** — the single most important test in this whole session.

Does the pipeline `[any decent pixel model at 256px] → pixeldetector downscale → didder (Bayer 4×4 @ 64% strength + locked Radiants 8-color palette) → cleanup` hit 80–90% quality and obviate custom training entirely? Where does this pipeline specifically **fail**? If the answer is "it's fine for icons but bad for sprites," that's a scoping win, not a reason to train. If there's no specific failure mode the user can name, training is premature.

**1b. What does owning the stack actually buy us?**

Retro Diffusion (Astropulse) already supports:
- Custom palette upload at generation time (not post-hoc)
- Aseprite-native workflow (ships as an Aseprite extension with a "Palettize" feature that remaps existing art to a target palette)
- RD Plus / RD Fast / RD Tile / RD Animation variants
- Bundled pixeldetector ("Repair pixel art")

Be specific: what output do we need that RD + didder post-processing can't produce? Hand-wavy answer = training is premature.

**1c. Base model candidates.**
- FLUX.2-klein + Limbicnation sprite LoRA — 2026 SOTA for character sprites
- FLUX.1-dev + pixel-art LoRA (UmeAiRT modern, prithivMLmods retro, civitai 683579) — strong prompt adherence
- SDXL + nerijs/pixel-art-xl — reference workhorse; known-good recipe is 8 steps, CFG 1.5, LoRA strength 1.2, 8× nearest-neighbor downscale
- Training a smaller model from scratch

Does the base model even matter if post-processing is the quality-determining step? If yes, which one and why? If no, this choice is a sideshow.

**1d. Training harness.** Is Karpathy's autoresearch the right harness, or a distraction?

**1e. Dataset.** Does ~2 years of Aseprite output = enough training data? How do you augment without polluting style?

**1f. The small-grid question.** At 16×16 / 24×24, does generate-then-downscale even work, or do icons and small sprites need a fundamentally different pipeline (direct sprite-space model, retrieval, skill library)? Reminder that **icons are already off the table** for this package — they belong to `@rdna/pixel`.

**1g. Skill-library / retrieval alternative.** Worth prototyping **before** committing to training? Or dead end? Interacts with 1a — if palette-lock-as-shortcut works, retrieval becomes the entire pipeline.

### Fork 2 — Engine architecture

**2a. Palette definition.** Stored where? Options:
- Named global Radiants palette + sprite-local palette indices
- Per-sprite embedded palette
- Layered palettes (base + tint)

Where does it live relative to the Radiants theme tokens? How does a sprite know its palette is in sync with theme state (e.g., dark mode)?

**2b. Sprite data format.** Palette-indexed `Uint8Array`? Packed bitstring + palette? What about frames and animation metadata? JSON-rendered pixel art (json-render.dev) — real serialization, or sideshow?

**2c. Dither as authored data vs render-time post-process.** Two paradigms:
- **Dither baked into data** — each pixel has a palette index that includes the dither pattern. Authoring sees dither, generation outputs dither.
- **Smooth shading authored, dither at render** — author in a smooth palette, runtime applies Bayer dither + palette-lock on the way out.

Which? Interacts heavily with 1a (post-processor location) and 2d.

**2d. Palette-lock post-processor location.** Engine core (every render goes through it), authoring-only (CLI/Studio button), or both? If it's engine core, runtime cost. If it's authoring-only, sprites have to be "burned in" before they reach consumers.

**2e. Architecture seams.**
- Runtime engine for RDNA consumers (sprites rendered on a page) vs authoring tools in Studio — where's the seam?
- Does `@rdna/sprite` emit React components, canvas calls, or raw image data?
- SSR story for sprites — required, or client-only?

### Fork 3 — Integration with what exists

**3a. Studio authoring surface.** Reality check: the "pixel art editor" in `apps/rad-os/components/apps/RadiantsStudioApp.tsx` is a hand-rolled 32×32 canvas over three hardcoded colors (`cream`, `yellow`, `ink`). **`dotting`/`hunkim98` is not installed anywhere in the repo** — it's a brainstorm idea, not current state. Does the sprite authoring surface:
- Evolve the RadiantsStudioApp canvas in place?
- Land in a new Studio tab?
- Become a new RadOS app entirely?
- Import `dotting` finally, or stay hand-rolled?

**3b. Aseprite ingest.** What's the read path? `.ase` binary parser, or "export Aseprite layers to PNG, then ingest PNG + palette"? How does the corpus get labeled for training (if training happens)?

**3c. JSON serialization.** Real format for the engine, or sideshow?

### Fork 4 — First shippable milestone

**Constraint:** no hard ship date, but no 6-month research project with zero shippable artifact. Must eventually serve production RDNA consumers.

What's the **first 2-4 week milestone** that produces a visible, merged artifact? Options on the table:
- **Palette-lock CLI** — no model, just a didder-style palette quantizer wrapped in a Studio button. Proves 1a end-to-end.
- **`@rdna/sprite` skeleton + Aseprite ingest** — data model, palette types, read a single `.ase`, render one sprite in a RadOS app. No generation.
- **Retro Diffusion integration** — no custom training, just prove RD + didder works against the Radiants palette. If yes, training gets deprioritized.
- **Something else.**

## Codebase state (verified, not hearsay)

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-pixel-art` on `feat/pixel-art-system`.

**Exists and relevant:**
- `packages/pixel/` — sibling 1-bit package. **Do not modify from the sprite session.** Reference only for the "registry as TypeScript module" pattern and shared utilities.
- `packages/pixel/src/patterns.ts` — 51 1-bit tile patterns, useful pattern-registry exemplar.
- `packages/pixel/src/core.ts` — `parseBits`, `mirrorH/V`, `diffBits`, `gridFromHex`. Shared primitive surface.
- `packages/radiants/assets/icons/` — existing 24px (662) and 16px (155) SVGs. Plan notes "65 sub-pixel" icons need redrawing on-grid and the Phase 5 16px migration was killed. Informs whether icons are generatable vs need hand-correction.
- `apps/rad-os/components/apps/RadiantsStudioApp.tsx` — current "editor" lives here, inline in `PixelArtCreation` component. 32×32, 3 hardcoded colors (`cream`, `yellow`, `ink`), state in `ColorKey[][]`, not wired to `@rdna/pixel`.

**Does not exist:**
- `packages/sprite/` — this session designs it.
- `apps/rad-os/components/apps/studio/PixelArtEditor.tsx` — the original grill brief claimed this existed; it doesn't. The editor is inline in `RadiantsStudioApp.tsx`.
- Any Aseprite, `.ase`, palette, dither, or model-training code anywhere on the branch.
- `hunkim98/dotting` is not a dependency.

**Historical artifacts (superseded — do not treat as current plans):**
- `docs/brainstorms/2026-03-31-radiants-pixel-art-system-brainstorm.md` — the "unified 1-bit engine" proposal that was forked out.
- `docs/plans/2026-03-31-pixel-art-engine.md` — `@rdna/pixel` implementation plan, mostly landed. Phase 5 (16px icons) removed. **Do not use as a template for `@rdna/sprite`** — different data model.

## Reference repos (cloned locally)

`/Users/rivermassey/Desktop/dev/references/pixel-art-references/`
- `aseprite/aseprite` — source-available, primary authoring tool
- `hunkim98/dotting` — React canvas editor, not currently a dependency
- `jvalen/pixel-art-react` — reference React editor
- `pablodelucca/pixel-agents` — possible future fork

## Source links (from the user's original grill brief)

**Generation landscape:**
- https://huggingface.co/Limbicnation/pixel-art-lora — FLUX.2-klein sprite LoRA
- https://huggingface.co/UmeAiRT/FLUX.1-dev-LoRA-Modern_Pixel_art
- https://huggingface.co/prithivMLmods/Retro-Pixel-Flux-LoRA
- https://civitai.com/models/683579/pixel-art-illustrations-flux
- https://huggingface.co/nerijs/pixel-art-xl
- https://civitai.com/models/120096/pixel-art-xl
- https://retrodiffusion.ai/
- https://astropulse.itch.io/retrodiffusion
- https://runware.ai/blog/retro-diffusion-creating-authentic-pixel-art-with-ai-at-scale
- https://help.scenario.com/en/articles/retro-diffusion-models-the-essentials/ — RD custom palette upload

**Downscale + palette-lock + dither:**
- https://github.com/Astropulse/pixeldetector
- https://github.com/dimtoneff/ComfyUI-PixelArt-Detector
- https://github.com/makew0rld/didder — palette-constrained dithering CLI; docs recommend Bayer 4×4 @ 64% strength (100% distorts)
- https://github.com/makeworld-the-better-one/didder/blob/main/MANPAGE.md
- https://github.com/ImageMagick/ImageMagick/discussions/6619 — why ImageMagick is inadequate for arbitrary-palette dither

## Suggested opening question for the new session

The palette-lock-as-shortcut hypothesis (Fork 1a). It's the decision most likely to collapse the entire training sub-tree, and everything downstream depends on its outcome. If it holds, the whole session shifts from "design a training pipeline" to "design `@rdna/sprite` + a thin generation adapter" — a much smaller and more shippable scope.
