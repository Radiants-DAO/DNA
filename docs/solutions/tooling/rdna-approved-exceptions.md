# RDNA Approved Exceptions

This document records intentional RDNA lint exceptions that are design-owned rather than cleanup debt. New entries still require narrow scope, owner metadata, and an expiry date in the inline `eslint-disable-next-line` comment.

## Radio Disc CRT Glass Art Rendering

**Scope:** `apps/rad-os/components/apps/radio/RadioDisc.tsx`, `apps/rad-os/components/apps/radio/Radio.tsx`, `apps/rad-os/components/apps/radio/RadioFrame.tsx`

**Owner:** `rad-os`

**Expires:** `2026-12-31`

The Radio surface is an app-local art renderer, not reusable RDNA chrome. It intentionally renders a convex CRT/glass video viewport and bowl-shaped radio shell that need literal color functions, multi-layer shadows, SVG fisheye displacement, scanlines, vignette, specular highlight, illuminated ticks, a faint reticle, custom shell radii, and local LCD glow.

Approved inline reasons:

- `video-backdrop-true-black`: true black video well behind the circular video.
- `paper-design-bubble-shading`: multi-layer convex bubble shading and glass edge.
- `crt-visual-effect`: scanline overlay.
- `crt-fisheye-vignette`: radial darkening that supports the fisheye illusion.
- `crt-glass-specular`: upper-left glass highlight.
- `paper-design-tick-palette`: local illuminated tick color and glow.
- `paper-design-reticle`: faint reticle crosshair overlay.
- `radio-lcd-bowl-radius`: exact circular LCD bowl clipping for the radio video viewport.
- `radio-lcd-icon-glow`: local LCD phosphor glow on the music note glyph.
- `radio-frame-bowl-radius`: exact outer shell radii from the radio art direction.

Constraints:

- Keep the exceptions inside the Radio renderer files listed above.
- Do not promote these literal colors, shadows, or effects into general RDNA surfaces.
- Do not use this exception URL for normal app chrome, panels, buttons, inputs, or layout surfaces.
- Revisit before expiry and either tokenise a stable primitive, move the renderer behind a dedicated art API, or renew explicitly.

## Brand Icon Rendering

**Scope:** `apps/rad-os/app/icon.tsx`, `apps/rad-os/app/apple-icon.tsx`

**Owner:** `design-system`

**Expires:** `2027-01-01`

The Next.js icon renderers produce static PNG app icons through `ImageResponse`. They intentionally use literal brand colors and exact pixel radii because the output is a raster brand asset, not live RDNA application chrome.

Approved inline reasons:

- `brand-icon-renderer-requires-pixel-perfect-radius`: exact raster icon corner radius for the exported icon size.

Constraints:

- Keep this exception limited to app icon renderers.
- Do not use it for runtime UI, preview panels, or reusable RDNA components.
- Prefer `data-rdna-brand-primitive` for the primitive brand color surface so only the raster-specific radius needs a lint exception.

## GoodNews Print Art Rendering

**Scope:** `apps/rad-os/components/apps/goodnews/GoodNewsLegacyApp.tsx`

**Owner:** `rad-os`

**Expires:** `2027-01-01`

GoodNews contains a small interactive drop-cap renderer that is positioned by the newspaper layout engine and paints local pattern layers inside the glyph box. It intentionally behaves more like a print/art object than a reusable RDNA button.

Approved inline reasons:

- `goodnews-dropcap-art-button`: native button semantics for an absolutely positioned, layout-engine-controlled drop-cap art surface.

Constraints:

- Keep this exception limited to the drop-cap renderer.
- Do not use it for normal app controls, menus, toolbar actions, or settings UI.

## Brand Mosaic Art Buttons

**Scope:** `apps/rad-os/components/apps/brand-assets/colors-tab/FibonacciMosaic.tsx`

**Owner:** `design-system`

**Expires:** `2027-01-01`

The brand color Fibonacci mosaic is an interactive art surface where each tile is both a color sample and the hit target for selecting that primitive. RDNA Button chrome would obscure the mosaic grid, introduce extra focus and spacing treatment, and make the tile no longer read as a direct color sample.

Approved inline reasons:

- `brand-mosaic-tile-art-button`: native button semantics for an art-directed mosaic color tile.

Constraints:

- Keep this exception limited to the Fibonacci mosaic color tiles.
- The tile must remain accessible with `type`, `aria-pressed`, `aria-label`, and visible selection treatment.
- Do not use it for normal swatches, lists, toolbar actions, or settings UI.

## Design System Preview Click Capture

**Scope:** `apps/rad-os/components/ui/DesignSystemTab.tsx`

**Owner:** `design-system`

**Expires:** `2027-01-01`

The design-system browser wraps arbitrary component previews and records interaction with the preview as a whole. The wrapper cannot be an RDNA Button because previews may contain nested controls and compound components. The wrapper is a passive presentation region that captures bubbled interaction for preview telemetry/state, not an independent command surface.

Approved inline reasons:

- `design-system-preview-click-capture`: presentation wrapper that captures preview interaction without adding button semantics.

Constraints:

- Keep this exception limited to the preview wrapper inside `ComponentShowcaseCard`.
- The wrapper must remain `role="presentation"` and must not introduce keyboard-only command behavior.
- Do not use it for standalone clickable cards, menus, toolbar actions, or navigation.

## Invert Mode Blend Overlay

**Scope:** `apps/rad-os/components/Rad_os/InvertOverlay.tsx`

**Owner:** `rad-os`

**Expires:** `2027-01-01`

Invert mode uses `mix-blend-mode: difference`, where a pure white overlay is the actual rendering mechanism for inverting the app underneath. A semantic surface token would make the effect theme-dependent and break the inversion contract.

Approved inline reasons:

- `invert-mode-difference-overlay`: pure white difference layer used as a rendering effect, not a visible app surface.

Constraints:

- Keep this exception limited to the full-screen invert overlay.
- Do not use it for panels, cards, buttons, text, borders, or brand preview surfaces.

## Pixel Rendering Internals

**Scope:** `packages/radiants/components/core/PixelTransition/PixelTransition.tsx`

**Owner:** `design-system`

**Expires:** `2027-01-01`

Pixel rendering internals sometimes need exact CSS pixel sizing to keep a canvas visually aligned with its intrinsic bitmap dimensions. These values are renderer geometry, not page layout.

Approved inline reasons:

- `pixel-transition-canvas-css-size`: CSS canvas dimensions intentionally mirror the computed intrinsic canvas dimensions.

Constraints:

- Keep this exception limited to pixel/canvas renderer internals.
- Do not use it for ordinary component layout, window layout, or app chrome.
