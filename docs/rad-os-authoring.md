# RadOS Authoring

This document describes the active RadOS authoring surface during the pre-launch replacement. Some adapter exports may still exist while code moves land, but the source of truth is already the new pipeline described below.

## Active Surface

The surface that must stay working throughout the rollout is:

- global corner preference on `<html data-corner-shape="...">`
- chrome tabs as the reference theme-following corner surface
- the pixel playground prompt/export guidance
- the current pattern and icon entry points until each move is complete

If a temporary re-export still exists elsewhere, treat it as an adapter. Author in the new source location and regenerate the materialized artifact.

## Source-Of-Truth Paths

- corners: `packages/pixel/src/corners/registry.ts`
- patterns: `packages/pixel/src/patterns/registry.ts`
- pixel icons: `packages/pixel/src/icons/registry.ts`
- SVG icon manifest: `packages/radiants/icons/manifest.ts`

Radiants is responsible for checked-in artifacts generated from prepared data:

- `packages/radiants/pixel-corners.generated.css`
- `packages/radiants/patterns.css`
- `packages/radiants/pixel-icons/registry.ts`

## Theme-Following Vs Fixed Corners In RadOS

RadOS uses both corner modes and the difference needs to stay explicit.

Theme-following corners:

- follow `<html data-corner-shape="...">`
- are appropriate for shared application chrome
- should be used when a user preference is supposed to restyle the surface

Fixed corners:

- bind to a concrete shape
- are appropriate for authored or art-directed surfaces
- should be used when a surface must not silently change with theme preference

Chrome tabs are the reference theme-following example. They are intentionally top-rounded and bottom-flat, and the upper corners should rematerialize when the global shape preference changes.

DOM reading and subscription live in Radiants. `useCornerShape()` or its successor observes `<html data-corner-shape="...">`; `@rdna/pixel` receives the current live shape as `themeShape` or equivalent materialization input. Theme-bound corner recipes stay symbolic during prepare and are resolved only during materialization.

## Playground Workflow

Use the pixel playground to sketch or edit a raw `PixelGrid`, then copy that result into the planned source-of-truth registry for the current mode.

- Corners: copy the grid into the corner registry or override entry in `packages/pixel/src/corners/registry.ts`.
- Patterns: copy the grid into `packages/pixel/src/patterns/registry.ts`.
- Pixel icons: copy the grid into `packages/pixel/src/icons/registry.ts`.

After authoring, regenerate the relevant Radiants artifact if the mode has a checked-in materialized output.

The playground guidance should point at the authoring registries, not at temporary runtime exports. That remains true even if a package move or thin re-export is still in flight.

The newer `packages/pixel/src/dither/` path is separate from corner authoring. Treat it as `@rdna/pixel/dither`: a prepare pipeline that can reuse mask/path conventions, but does not participate in corner materialization.

## Authoring Rules

- Prefer `corner.map(defaultCorner, overrides)` over raw corner descriptor objects for new corner work.
- Use `binding.source: 'theme'` only when the surface is supposed to track the global preference.
- Use `binding.source: 'fixed'` when the shape must remain stable.
- Treat old positional, `{ mode, radius }`, or duplicate registry surfaces as removed pre-launch shims.
- Delete duplicate pre-launch implementations, legacy aliases, and bridge utilities instead of maintaining them in parallel for compatibility.

## Related Docs

- [Corner Model](./corner-model.md)
- [Corner Generation](../archive/design-docs/pixel-system-iterations/corner-generation.md) (archived precursor)
