---
type: note
---

# Logo Asset Maker Brainstorm

**Date:** 2026-04-18
**Status:** Decided — ready for `/wf-plan`

## What We're Building

Refactor the `Logos` tab inside `BrandAssetsApp` from a static 9-card preset grid into a live **logo asset maker**: a two-pane tool where the user configures a logo (variant, bg, logo color, pattern, ratio, format) on the left and sees a single live canvas on the right. Copy and download buttons stay pinned to the top-right of the canvas and export a composed asset (bg + logo baked in).

The existing 9-card preset grid is replaced entirely — the new tab is one configurable canvas.

## Chosen Approach

**Client-side SVG composition + canvas-based PNG rasterization.**

- Build the composed SVG in-memory on every control change: `<svg viewBox>` → bg layer (solid or inline `<pattern>` from `@rdna/pixel` `PATTERN_REGISTRY`) → logo glyph (recolored via `currentColor`/`color` prop).
- Preview renders the composed SVG inline in the right island.
- **SVG export** = copy/download that same in-memory string.
- **PNG export** = serialize SVG → `<img>` → draw to offscreen `<canvas>` at preset's export dimensions → `toBlob`.
- Ratios reshape the `<svg viewBox>`; logo centers via flex/grid and scales to fit.
- Patterns use `@rdna/pixel` bit-grids emitted as inline SVG `<pattern>` with two color cells.

**Why this over alternatives:**
- Pre-baked files: combinatorial explosion (variants × bg × logo color × pattern × pattern colors × ratio) — not viable once patterns are in scope.
- Server-side render (satori/resvg): adds a Next.js route + latency for a tool that doesn't need it.

## Layout

```
AppWindow.Content layout="sidebar"
├── AppWindow.Island width="w-[16rem]" corners="pixel" padding="sm"   ← controls
│     Logo variant   (segmented: Mark / Wordmark / RadSun)
│     Bg             (Transparent / Cream / Ink / Yellow / Pattern)
│        └─ Pattern picker (scrollable grid, PATTERN_REGISTRY) — only when bg=Pattern
│        └─ Pattern fg color (Cream / Ink / Yellow)                   — only when bg=Pattern
│        └─ Pattern bg color (Cream / Ink / Yellow)                   — only when bg=Pattern
│     Logo color     (Cream / Ink / Yellow)
│     Ratio          (Square / 16:9 / OG 1200×630 / Favicon / Story 9:16 — final list TBD in plan)
│     Format         (PNG / SVG toggle)
└── AppWindow.Island corners="pixel" padding="md"                     ← canvas
      <composed SVG centered>
      top-right overlay: [Copy] [Download]
```

## Key Decisions

- **Export scope:** composed canvas (bg + logo baked in). Transparent bg = no `<rect>` in SVG / alpha in PNG.
- **Bg options:** Transparent, Cream, Ink, Yellow, Pattern.
- **Patterns:** sourced from `@rdna/pixel` `PATTERN_REGISTRY` (50 named 8×8 grids). **Not** from `PatternPlayground`.
- **Color palette:** Cream / Ink / Yellow only — for logo color, pattern fg, pattern bg. Keeps the tool tight and on-brand.
- **Logo variants:** keep existing three (Mark, Wordmark, RadSun).
- **Ratio:** preset picker reshapes the canvas; logo centers and scales to fit.
- **Existing 9-card grid:** removed. Tab collapses to a single live canvas.
- **Format toggle:** moves from tab-level into the controls island; applies to the single canvas.
- **Island primitives:** reuse `AppWindow.Content layout="sidebar"` with two `AppWindow.Island` children — no new primitive.

## Open Questions (for `/wf-plan`)

- **Exact ratio presets** — which dimensions ship in v1? (Proposed: 1:1 512, 16:9 1920×1080, OG 1200×630, Favicon 32/128, Story 9:16 1080×1920.)
- **Pattern gallery UX** — scrollable thumbnail grid vs. categorized tabs (structural / diagonal / figurative / scatter / fill)? 50 patterns is a lot.
- **Wordmark font in PNG export** — `WordmarkLogo` may use a custom font; when serializing SVG to `<img>` for canvas rasterization, fonts don't always resolve. Verify whether the wordmark SVG uses paths or text; if text, convert to outlines at build time or inline the font subset.
- **Persistence** — should the user's last config persist across sessions (via `preferences` slice)?
- **Pattern bg = "transparent"** — disallowed per user ("only ink/cream/yellow"); confirm no edge case where a transparent-bg pattern is desired.
- **Copy behavior for patterned SVG** — confirm pasted SVG with inline `<pattern>` renders correctly in Figma / Slack / browsers.
- **Mobile fallback** — BrandAssetsApp has a mobile modal variant; sidebar layout collapses how?

## Worktree Context

- **Current:** `/Users/rivermassey/Desktop/dev/DNA` on `cleanup/2026-04-16-monorepo-pass` (primary checkout, cleanup branch).
- **Recommended before `/wf-plan`:** spin up a dedicated worktree so this feature doesn't land on the cleanup branch.
  ```bash
  git worktree add ../DNA-logo-maker -b feat/logo-asset-maker
  ```
- **Handoff path + branch** to record once created: `../DNA-logo-maker` on `feat/logo-asset-maker`.

## Research Notes

- **Current Logos tab:** `apps/rad-os/components/apps/BrandAssetsApp.tsx:479-556` — `LOGOS` preset array + `LogoCard` component.
- **Logo primitives:** `WordmarkLogo`, `RadMarkIcon`, `RadSunLogo` from `@rdna/radiants/icons/runtime`. All accept a `color` prop (`'cream' | 'black' | 'yellow'`). `radsun` fetches from `/assets/logos/radsun-{cream|black|yellow}.svg`; others render inline SVG.
- **Pre-baked download helper:** `getBrandLogoDownloadHref(logo.id, format)` in `@/lib/asset-downloads` — will need a client-side replacement (blob URL) for composed exports.
- **AppWindow islands:** `packages/radiants/components/core/AppWindow/AppWindow.tsx:114` — `ContentLayout = 'single' | 'split' | 'sidebar' | 'bleed'`. Example in `AppWindow.meta.ts:95-108`.
- **Pattern source:** `packages/pixel/src/patterns.ts` — `PATTERN_REGISTRY` (50 × 8×8 1-bit grids) + `getPattern(name)`. Already the canonical pixel-engine pattern set.
- **Existing tab-level PNG/SVG toggle:** `BrandAssetsApp.tsx:547-551` — gets folded into the controls island.
