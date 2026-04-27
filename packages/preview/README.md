# @rdna/preview

Internal metadata and preview tooling for RDNA component packages.

`@rdna/preview` is a private workspace package. It is used while authoring and
generating component metadata, but it is not intended to be a runtime dependency
of published packages such as `@rdna/radiants`.

## What It Provides

- `ComponentMeta` and related TypeScript contracts for component props, slots,
  registry metadata, forced preview states, accessibility notes, density rules,
  BlockNote integration, and design-system contract fields.
- `defineComponentMeta<TProps>()`, a small typed helper for authoring
  `*.meta.ts` files next to components.
- `generate-schemas.ts`, a generator that scans component metadata files and
  emits component `*.schema.json` files plus optional metadata/schema barrels.
- `PreviewPage`, a minimal Next.js client page that renders components from a
  registry based on the `?name=` search parameter.

## Common Usage

Component packages import the metadata helper:

```ts
import { defineComponentMeta } from "@rdna/preview/define-component-meta";

export const ButtonMeta = defineComponentMeta<ButtonProps>()({
  name: "Button",
  description: "Action trigger.",
  props: {
    disabled: {
      type: "boolean",
      default: false,
      description: "Disable button interactions",
    },
  },
  registry: {
    category: "action",
    exampleProps: { children: "Button" },
    states: [
      { name: "hover", driver: "wrapper" },
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
```

In `@rdna/radiants`, schema generation is run with:

```sh
pnpm --filter @rdna/radiants generate:schemas
```

That command calls this package's generator:

```sh
node --experimental-strip-types ../preview/src/generate-schemas.ts ./components/core ./meta/index.ts ./schemas/index.ts
```

## Generated Output

For each discovered `*.meta.ts` file, the generator writes a same-directory
`*.schema.json` file. Schema output intentionally strips fields that are only
needed by internal tooling or registry generation, including:

- `registry`
- `tokenBindings`
- `sourcePath`
- `replaces`
- `pixelCorners`
- `shadowSystem`
- `styleOwnership`
- `structuralRules`
- `density`
- `wraps`
- `a11y`
- `blockNote`

When barrel output paths are provided, the generator also writes:

- a metadata barrel containing `componentMetaIndex`
- a schema barrel containing `componentData`

## Preview States

Preview states describe UI states that tooling can execute for inspection.
Current supported state names are:

- `hover`
- `pressed`
- `focus`
- `disabled`
- `error`

Use wrapper-driven states for interaction states such as hover, pressed, and
focus. Use prop-driven states for component API states such as disabled or
error. Scenario examples such as long text, placeholder-visible, or no-results
belong in `exampleProps` or `variants`, not `states`.

## Package Exports

```json
{
  ".": "./src/index.ts",
  "./page": "./src/PreviewPage.tsx",
  "./define-component-meta": "./src/define-component-meta.ts"
}
```

The root export exposes the shared types, `PreviewPage`, and
`defineComponentMeta`.
