# @rdna/monolith

MONOLITH theme package for RadOS campaign skins.

This MVP package provides theme-scoped CSS token overrides and lightweight
CRT/glow utilities. Follow-up work should port licensed fonts, campaign assets,
icons, and reusable components from
`/Users/rivermassey/Desktop/dev/clients/solana-mobile/apps/monolith-hackathon`.

Internal workspace package: `"@rdna/monolith": "workspace:*"`.

Load it after Radiants so its theme-scoped tokens can override the base
semantic values:

```css
@import '@rdna/radiants';
@import '@rdna/monolith';
```

## Usage

```html
<html data-theme="monolith">
  <body>...</body>
</html>
```

The CSS also contains current `[data-theme='skr']` selectors for the SKR
campaign surface used by RadOS. The package has no React entrypoints.

## Public API

| Subpath | Provides |
| --- | --- |
| `@rdna/monolith` | Theme entrypoint that imports tokens and effects. |
| `@rdna/monolith/tokens` | MONOLITH semantic token overrides, including light-mode overrides. |
| `@rdna/monolith/fonts` | Placeholder font layer; the package currently inherits Radiants font tokens. |
| `@rdna/monolith/effects` | Theme-scoped wallpaper, portal, door, logo, and CRT/glow effects. |

## Architecture

`tokens.css` scopes semantic values to `[data-theme='monolith']` and
`[data-theme='monolith'].light`. `effects.css` contains the theme-specific
wallpaper and visual-effect selectors for MONOLITH and SKR campaign states.
`index.css` imports the token and effects layers.

MONOLITH should be treated as a current campaign theme implementation, not as a
permanent one-off package shape. The future theme contract may move it under a
theme family layout such as `packages/themes/monolith`, rename it into an
`@rdna/theme-*` package family, or fold it into an `@rdna/themes` package with
theme subpath exports. Radiants should be one theme in that family, not the only
theme namespace.

## Development

This package has no build or test script because it is currently a private CSS
surface. Validate changes through the root gate:

```sh
pnpm build
```

There are no source imports of `@rdna/monolith` in `apps/` or `packages/` at
cleanup time; `apps/rad-os/package.json` still declares the workspace
dependency. Deleting the package is deferred as a product/package strategy
decision and should account for future themes beyond MONOLITH.
