# Corner Model

This is the launch model for pixel corners. Treat it as a pre-launch replacement, not a compatibility layer: authored corner definitions live in `@rdna/pixel`, preparation happens once from normalized inputs, and runtime or generated CSS only materializes that prepared output.

## Source Of Truth

- Author corner definitions in `packages/pixel/src/corners/registry.ts`.
- Normalize public input into one recipe shape before preparing or materializing it.
- Generate checked-in Radiants artifacts from prepared corner data instead of maintaining duplicate registries by hand.
- Keep legacy shorthands or re-exports only while the active RadOS surface still needs them.

## Canonical Data Model

```ts
type CornerShapeName = 'circle' | 'chamfer' | 'scallop';

type EdgeFlags = [0 | 1, 0 | 1, 0 | 1, 0 | 1];

type CornerShapeBinding =
  | { source: 'theme' }
  | { source: 'fixed'; shape: CornerShapeName };

type CornerValue =
  | 0
  | {
      radiusPx: number;
      binding: CornerShapeBinding;
    };

interface CornerMap {
  tl?: CornerValue;
  tr?: CornerValue;
  br?: CornerValue;
  bl?: CornerValue;
}

interface CornerRecipeDefinition {
  readonly name: string;
  readonly corners: Required<CornerMap>;
  readonly edges?: EdgeFlags;
}

interface PreparedCornerProfile {
  readonly key: string;
  readonly shape: CornerShapeName;
  readonly radiusPx: number;
  readonly gridSize: number;
}

type PreparedCornerEntry =
  | { readonly kind: 'flat' }
  | { readonly kind: 'theme'; readonly radiusPx: number }
  | {
      readonly kind: 'fixed';
      readonly radiusPx: number;
      readonly profile: PreparedCornerProfile;
    };

interface PreparedCornerRecipe {
  readonly key: string;
  readonly entries: {
    readonly tl: PreparedCornerEntry;
    readonly tr: PreparedCornerEntry;
    readonly br: PreparedCornerEntry;
    readonly bl: PreparedCornerEntry;
  };
  readonly edges: EdgeFlags;
}
```

Normalization rules:

- `radiusPx` is the only public size unit.
- `0` means a flat corner.
- Omitted corners normalize to `0`.
- `edges` defaults to `[1, 1, 1, 1]`.
- `gridSize` remains an internal preparation detail, not a public authoring input.

## Theme Vs Fixed

Two consumption modes must stay explicit:

- `binding.source: 'theme'` means that corner follows the active global shape from `<html data-corner-shape="...">`.
- `binding.source: 'fixed'` means that corner stays on the specified shape regardless of the global preference.

Use theme-bound corners for shared chrome and user-preference surfaces. Chrome tabs are the reference case: their top corners follow the current theme shape while the lower edge stays flat.

Use fixed corners for authored or art-directed surfaces that must not silently change when the user changes the global corner preference.

## Radius Semantics

The public model is radius-first. Authors choose how much rounding they want in pixels, then bind that radius either to the active theme shape or to a fixed shape. The runtime or generators derive whatever grid size is needed from that radius.

That keeps authoring close to CSS:

- ask for a radius in pixels
- choose which corners get that radius
- decide whether each corner follows theme or overrides it
- decide which edges are enabled

## Helper-Based Asymmetric Authoring

Asymmetric work should use the canonical object form or the small helper layer that produces it. `corner.map(defaultCorner, overrides)` is the preferred "default plus overrides" authoring path.

Examples:

```ts
import { corner, px } from '@rdna/pixel';

px({
  corners: corner.map(corner.flat, {
    tl: corner.fixed('chamfer', 8),
    tr: corner.fixed('chamfer', 8),
  }),
  edges: [1, 1, 0, 1],
});

px({
  corners: corner.map(corner.flat, {
    tl: corner.themed(6),
    tr: corner.themed(6),
  }),
  edges: [1, 1, 0, 1],
});

px({
  corners: corner.map(corner.themed(5), {
    tl: corner.fixed('chamfer', 5),
    tr: corner.fixed('circle', 5),
    br: corner.flat,
  }),
  themeShape: 'scallop',
});
```

The old positional and `{ mode, radius }` shorthands are not part of the launch API. They were removed so all runtime inputs collapse through one `CornerRecipeDefinition` shape.

## Normalized Recipes

Every public corner input should collapse into one normalized recipe before preparation:

1. Parse shorthands or named recipes.
2. Fill in missing corners as `0`.
3. Apply edge defaults.
4. Preserve `theme` bindings as symbolic references.
5. Preserve `fixed` bindings as immutable shape overrides.

After that point, runtime helpers, generators, and authored recipes should all be operating on the same normalized contract. `prepareCornerRecipe()` returns a `PreparedCornerRecipe`: flat corners stay `kind: 'flat'`, theme-bound corners stay symbolic as `kind: 'theme'`, and fixed corners point at a concrete prepared profile.

Theme-bound entries must not read the DOM or freeze to the current global shape during prepare. Radiants owns reading/subscribing to `<html data-corner-shape="...">` through `useCornerShape()` or its successor, then passes the live shape into `@rdna/pixel` as `themeShape` or equivalent materialization input.

## Launch Guidance

- No corner should depend on the global theme unless `source: 'theme'` was chosen explicitly.
- Named recipes such as chrome tabs should compile down to the same normalized contract.
- The goal is CSS-like authoring control, not full elliptical `border-radius` parity.
- Duplicate pre-launch registries, parser branches, aliases, and bridge exports should be deleted once the active RadOS surface no longer depends on them.
