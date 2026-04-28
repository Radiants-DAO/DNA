# @rdna/pixel

Core 1-bit pixel utilities for masks, renderers, transitions, dither, icons,
patterns, and pixel corners.

## Public API

`@rdna/pixel` publishes built TypeScript/ESM subpaths from `dist/`:

| Subpath | Provides |
| --- | --- |
| `@rdna/pixel` | Main barrel: core grid helpers, renderers, masks, transitions, corner helpers, dither helpers, patterns, icons, and public types. |
| `@rdna/pixel/core` | Grid parsing, validation, mirroring, hex conversion, and bit diff helpers. |
| `@rdna/pixel/renderer` | Canvas rendering helpers: `paintGrid`, `paintTiledGrid`, and `createGridCanvas`. |
| `@rdna/pixel/import` | SVG-to-grid import helpers and import report types. |
| `@rdna/pixel/transition` | Transition frame interpolation and flip ordering helpers. |
| `@rdna/pixel/corners` | Corner authoring, preparation, runtime materialization, shape registration, and concave helpers. |
| `@rdna/pixel/dither` | Bayer matrix helpers, dither ramps, prepared dither bands, and `DitherRampOptions`. |
| `@rdna/pixel/patterns` | Pattern registry access and pattern preparation helpers. |
| `@rdna/pixel/icons` | Bitmap icon registry, icon lookup, SVG conversion, and React `BitmapIcon`. |

Public root types include `PixelGrid`, corner recipe/materialization types,
`MaskAsset`, `MaskHostStyle`, dither types such as `BayerMatrixSize`,
`DitherDirection`, and `DitherRampOptions`, pattern types, and pixel icon types.

## Pixel Corners

The current corner model is `normalize -> prepare -> materialize`.

- `prepareCornerProfile(shape, radiusPx)` builds reusable cover and border mask assets.
- `prepareCornerRecipe(recipe)` normalizes per-corner authoring data and prepares fixed-shape corners.
- `materializeCornerRecipe(prepared, { themeShape })` returns CSS custom properties for the `.pixel-corner` runtime host.
- Radiants uses the same prepared profile path to generate static CSS utilities.

Corner helpers are exported from `@rdna/pixel`:

```ts
import { corner, px } from '@rdna/pixel';
```

### Runtime Corners

Use `px()` when corners are dynamic, per-corner, mixed-shape, or theme-driven.
`px()` accepts the canonical object config only and returns `{ className, style }`.

```tsx
<div {...px({
  corners: corner.map(corner.themed(8)),
})}>
  Theme-shaped corners
</div>
```

Per-corner overrides are explicit:

```tsx
<div {...px({
  corners: corner.map(corner.themed(5), {
    tl: corner.fixed('chamfer', 5),
    tr: corner.fixed('circle', 5),
    br: corner.flat,
  }),
  themeShape: 'scallop',
})}>
  Mixed corners
</div>
```

In that example:

- `tl` is always chamfered.
- `tr` is always rounded.
- `br` is flat.
- `bl` follows the live theme shape, materialized with `themeShape: 'scallop'`.

Supported built-in shapes are `circle`, `chamfer`, and `scallop`. Custom shapes can
be registered with `registerCornerDefinition()`.

### Runtime Concave Corners

Use `concave()` for inverse/inner corner patches. It generates the used radius at
runtime from the same prepared corner profile as `px()`.

```tsx
import { concave } from '@rdna/pixel';

const patch = concave({
  corner: 'br',
  radiusPx: 11,
  themeShape: 'chamfer',
});

<div className={`${patch.className} absolute right-0 bottom-0 bg-page`} style={patch.style} />;
```

Omit `shape` for theme-bound output, or pass `shape` for a fixed override:

```tsx
concave({ corner: 'tl', radiusPx: 11, themeShape: 'scallop' });
concave({ corner: 'tl', radiusPx: 11, shape: 'circle' });
```

Radiants also exports `useConcaveCorner()`, which reads the live
`<html data-corner-shape>` value and passes it as `themeShape`.

### Static CSS Utilities

Radiants generates static corner utilities from `@rdna/pixel/corners`.

```tsx
<div className="pixel-rounded-8 bg-surface-primary">
  Static rounded corner
</div>
```

Current generated classes are numeric:

```txt
pixel-rounded-2
pixel-rounded-4
pixel-rounded-6
pixel-rounded-8
pixel-rounded-12
pixel-rounded-16
pixel-rounded-20
pixel-rounded-24
pixel-rounded-32
pixel-rounded-40
pixel-rounded-48
pixel-rounded-64
pixel-rounded-full
```

There are no `pixel-rounded-xs/sm/md/lg/xl` aliases.

### Cache Behavior

Prepared corner profiles are cached for `radiusPx <= 32`. Larger radii bypass the
profile cache so editor sessions can explore large values without unbounded cache
growth.

### Dither

Dither lives under `@rdna/pixel/dither` and stays separate from the corner
prepare/materialize contract. It has its own prepared outputs for threshold and band
generation rather than CSS corner masks.
