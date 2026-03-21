# Canonical Registry Contract + Playground Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the registry and playground onto one canonical metadata contract so prop panels, generated manifest data, and authored `*.meta.ts` files stop drifting apart.

**Architecture:** `@rdna/preview` remains the canonical owner of authored metadata shapes (`PropDef`, `SlotDef`, `ForcedState`). `@rdna/radiants/registry` imports and re-exports those types, adds only showcase/runtime fields, and `buildRegistryMetadata()` becomes the single source for display metadata. The playground consumes canonical `props` directly from the shared registry and shared `PropControls`, while the manifest generator reuses `buildRegistryMetadata()` instead of dynamic `*.meta.ts` scanning for Radiants.

**Tech Stack:** TypeScript, React 19, Next.js 16, Vitest, React Testing Library.

**Relevant skills:** `@typescript-advanced-types`

---

### Task 1: Align The Canonical Preview Contract

**Files:**
- Modify: `packages/preview/src/types.ts`
- Modify: `packages/preview/src/index.ts`
- Modify: `packages/radiants/registry/types.ts`
- Modify: `packages/radiants/registry/index.ts`
- Modify: `packages/radiants/registry/build-registry-metadata.ts`
- Test: `packages/radiants/registry/__tests__/registry-metadata.test.ts`

**Step 1: Write the failing metadata tests**

Extend `packages/radiants/registry/__tests__/registry-metadata.test.ts` with assertions for canonical display fields:

```ts
it("surfaces canonical props, slots, and display labels", () => {
  const button = buildRegistryMetadata().find((entry) => entry.name === "Button");

  expect(button?.id).toBe("button");
  expect(button?.label).toBe("Button.tsx");
  expect(button?.group).toBe("Actions");
  expect(button?.props?.mode?.type).toBe("enum");
  expect(button?.slots).toEqual(expect.any(Object));
});

it("surfaces defaultProps and tokenBindings from canonical metadata", () => {
  const input = buildRegistryMetadata().find((entry) => entry.name === "Input");
  const button = buildRegistryMetadata().find((entry) => entry.name === "Button");

  expect(input?.defaultProps).toEqual(expect.any(Object));
  expect(button?.tokenBindings).toEqual(expect.any(Object));
});

it("keeps co-authored components distinct even when they share a source file", () => {
  const entries = buildRegistryMetadata();
  const label = entries.find((entry) => entry.name === "Label");
  const radio = entries.find((entry) => entry.name === "Radio");

  expect(label?.props?.children).toBeDefined();
  expect(radio?.props?.checked).toBeDefined();
});

it("accepts enum metadata authored with options or values", () => {
  const drawer = buildRegistryMetadata().find((entry) => entry.name === "Drawer");

  expect(drawer?.props?.direction?.options ?? drawer?.props?.direction?.values).toEqual(
    ["bottom", "top", "left", "right"],
  );
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/registry-metadata.test.ts \
  --cache=false
```

Expected: FAIL because `RegistryMetadataEntry` does not yet expose canonical display fields and preview types do not model the authored enum shape cleanly.

**Step 3: Write the minimal implementation**

Update `packages/preview/src/types.ts` so authored metadata matches real usage:

```ts
export type PropEnumValue = string | number;

export interface PropDef {
  type: "string" | "number" | "boolean" | "enum";
  values?: PropEnumValue[];
  options?: PropEnumValue[];
  default?: unknown;
  required?: boolean;
  description?: string;
  items?: { type?: string };
}

export interface SlotDef {
  description?: string;
}
```

Update `packages/radiants/registry/types.ts` to import canonical types instead of redefining them:

```ts
import type {
  ComponentCategory,
  ForcedState,
  PropDef,
  SlotDef,
} from "@rdna/preview";

export interface RegistryMetadataEntry {
  packageName: "@rdna/radiants";
  name: string;
  category: ComponentCategory;
  description: string;
  sourcePath: string;
  schemaPath: string;
  dnaPath?: string | null;
  renderMode: RenderMode;
  exampleProps?: Record<string, unknown>;
  variants?: VariantDemo[];
  controlledProps?: string[];
  tags?: string[];
  states?: ForcedState[];
  id: string;
  label: string;
  group: string;
  props: Record<string, PropDef>;
  slots: Record<string, SlotDef>;
  defaultProps: Record<string, unknown>;
  tokenBindings: Record<string, Record<string, string>> | null;
  subcomponents: string[];
  examples: Array<{ name: string; code: string }>;
}
```

Update `packages/radiants/registry/index.ts` to re-export the canonical preview types:

```ts
export type { PropDef, SlotDef } from "@rdna/preview";
```

Update `packages/radiants/registry/build-registry-metadata.ts` so display fields are derived in one place:

```ts
const componentName = meta.name ?? name;
const category = reg?.category ?? "layout";
const defaultProps = reg?.exampleProps ?? reg?.variants?.[0]?.props ?? {};

entries.push({
  packageName: "@rdna/radiants",
  name: componentName,
  category,
  description: meta.description ?? "",
  sourcePath: sourcePath ?? "",
  schemaPath,
  dnaPath: dnaPath ?? null,
  renderMode: reg?.renderMode ?? "inline",
  exampleProps: reg?.exampleProps,
  variants: reg?.variants,
  controlledProps: reg?.controlledProps,
  tags: reg?.tags ?? [],
  states: reg?.states,
  id: componentName.toLowerCase(),
  label: `${componentName}.tsx`,
  group: CATEGORY_LABELS[category] ?? category,
  props: meta.props ?? {},
  slots: meta.slots ?? {},
  defaultProps,
  tokenBindings: meta.tokenBindings ?? null,
  subcomponents: meta.subcomponents ?? [],
  examples: meta.examples ?? [],
});
```

**Step 4: Run the metadata tests again**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/registry-metadata.test.ts \
  registry/__tests__/registry.test.ts \
  --cache=false
```

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  packages/preview/src/types.ts \
  packages/preview/src/index.ts \
  packages/radiants/registry/types.ts \
  packages/radiants/registry/index.ts \
  packages/radiants/registry/build-registry-metadata.ts \
  packages/radiants/registry/__tests__/registry-metadata.test.ts
git commit -m "feat(registry): align canonical preview metadata contract"
```

---

### Task 2: Backfill Controlled Props For The Custom Demos We Intentionally Expose

**Files:**
- Modify: `packages/radiants/components/core/Select/Select.meta.ts`
- Modify: `packages/radiants/components/core/Drawer/Drawer.meta.ts`
- Modify: `packages/radiants/components/core/Sheet/Sheet.meta.ts`
- Modify: `packages/radiants/components/core/Popover/Popover.meta.ts`
- Test: `packages/radiants/registry/__tests__/registry-metadata.test.ts`

**Step 1: Write the failing controlled-props assertions**

Add explicit assertions to `packages/radiants/registry/__tests__/registry-metadata.test.ts`:

```ts
it("declares only the custom-demo props we intentionally expose in panels", () => {
  const entries = buildRegistryMetadata();

  expect(entries.find((entry) => entry.name === "Select")?.controlledProps).toEqual([
    "value",
    "placeholder",
    "disabled",
    "error",
    "fullWidth",
  ]);

  expect(entries.find((entry) => entry.name === "Drawer")?.controlledProps).toEqual([
    "direction",
    "defaultOpen",
  ]);

  expect(entries.find((entry) => entry.name === "Sheet")?.controlledProps).toEqual(["side"]);
  expect(entries.find((entry) => entry.name === "Popover")?.controlledProps).toEqual(["position"]);
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/registry-metadata.test.ts \
  --cache=false
```

Expected: FAIL because those `registry.controlledProps` arrays are not authored yet.

**Step 3: Write the minimal metadata updates**

Add only the props that the shared panels should expose safely right now:

```ts
registry: {
  category: "form",
  tags: ["dropdown", "picker", "choice"],
  renderMode: "custom",
  states: ["focus", "error", "disabled"],
  controlledProps: ["value", "placeholder", "disabled", "error", "fullWidth"],
}
```

Use the same pattern for the overlay demos:

```ts
// Drawer.meta.ts
controlledProps: ["direction", "defaultOpen"],

// Sheet.meta.ts
controlledProps: ["side"],

// Popover.meta.ts
controlledProps: ["position"],
```

Do **not** mass-backfill every `renderMode: "custom"` component in this task. Keep the scope to the demos the panels need immediately.

**Step 4: Run the tests again**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/registry-metadata.test.ts \
  registry/__tests__/runtime-coverage.test.ts \
  --cache=false
```

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  packages/radiants/components/core/Select/Select.meta.ts \
  packages/radiants/components/core/Drawer/Drawer.meta.ts \
  packages/radiants/components/core/Sheet/Sheet.meta.ts \
  packages/radiants/components/core/Popover/Popover.meta.ts \
  packages/radiants/registry/__tests__/registry-metadata.test.ts
git commit -m "feat(registry): declare controlled props for shared custom demos"
```

---

### Task 3: Extract Shared PropControls And useShowcaseProps

**Files:**
- Create: `packages/radiants/registry/PropControls.tsx`
- Create: `packages/radiants/registry/useShowcaseProps.ts`
- Modify: `packages/radiants/registry/index.ts`
- Test: `packages/radiants/registry/__tests__/PropControls.test.tsx`

**Step 1: Write the failing shared-controls test**

Create `packages/radiants/registry/__tests__/PropControls.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PropControls } from "../PropControls";
import type { PropDef } from "@rdna/preview";

const testProps: Record<string, PropDef> = {
  variant: { type: "enum", options: ["solid", "outline", "ghost"] },
  disabled: { type: "boolean" },
  label: { type: "string" },
};

describe("PropControls", () => {
  it("renders controls for each non-skipped prop", () => {
    render(
      <PropControls
        props={testProps}
        values={{ variant: "solid", disabled: false, label: "Click" }}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );

    expect(screen.getByText("variant")).toBeInTheDocument();
    expect(screen.getByText("disabled")).toBeInTheDocument();
    expect(screen.getByText("label")).toBeInTheDocument();
  });

  it("honors controlledProps for custom demos", () => {
    render(
      <PropControls
        props={testProps}
        values={{ variant: "solid" }}
        onChange={() => {}}
        onReset={() => {}}
        controlledProps={["variant"]}
        renderMode="custom"
      />,
    );

    expect(screen.getByText("variant")).toBeInTheDocument();
    expect(screen.queryByText("disabled")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/PropControls.test.tsx \
  --cache=false
```

Expected: FAIL because the shared controls do not exist yet.

**Step 3: Write the minimal shared implementation**

Create `packages/radiants/registry/useShowcaseProps.ts`:

```ts
import { useMemo, useState } from "react";

export function useShowcaseProps(
  entry: Pick<RegistryMetadataEntry, "defaultProps">,
) {
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});
  const props = { ...entry.defaultProps, ...overrides };

  const remountKey = useMemo(() => {
    const defaultEntries = Object.entries(overrides).filter(([name]) =>
      name.startsWith("default"),
    );
    return defaultEntries.length > 0 ? JSON.stringify(defaultEntries) : "stable";
  }, [overrides]);

  return {
    props,
    overrides,
    remountKey,
    setPropValue: (name: string, value: unknown) =>
      setOverrides((current) => ({ ...current, [name]: value })),
    resetProps: () => setOverrides({}),
  };
}
```

Create `packages/radiants/registry/PropControls.tsx` by porting the existing playground control logic with these rules:

```tsx
function getEnumValues(prop: PropDef): Array<string | number> | undefined {
  if (prop.options?.length) return prop.options;
  if (prop.values?.length) return prop.values;
  return undefined;
}

export function getControllableProps({
  props,
  controlledProps,
  renderMode,
}: Pick<PropControlsProps, "props" | "controlledProps" | "renderMode">) {
  return Object.entries(props).filter(([name, prop]) => {
    if (shouldSkipProp(prop)) return false;
    if (
      renderMode === "custom" &&
      controlledProps &&
      !controlledProps.includes(name)
    ) {
      return false;
    }
    return true;
  });
}
```

Keep the rest of the control behavior from `PropsPanel.tsx`, but switch styling to semantic tokens and add an optional `className?: string` prop so playground and `rad-os` can skin the wrapper differently.

Export all three from `packages/radiants/registry/index.ts`:

```ts
export { PropControls, getControllableProps } from "./PropControls";
export { useShowcaseProps } from "./useShowcaseProps";
```

**Step 4: Run the shared-controls tests**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/PropControls.test.tsx \
  --cache=false
```

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  packages/radiants/registry/PropControls.tsx \
  packages/radiants/registry/useShowcaseProps.ts \
  packages/radiants/registry/index.ts \
  packages/radiants/registry/__tests__/PropControls.test.tsx
git commit -m "feat(registry): extract shared prop controls"
```

---

### Task 4: Migrate The Playground To Canonical Props

**Files:**
- Modify: `tools/playground/generated/registry.ts`
- Modify: `tools/playground/app/playground/types.ts`
- Modify: `tools/playground/app/playground/registry.tsx`
- Modify: `tools/playground/app/playground/nodes/ComponentCard.tsx`
- Modify: `tools/playground/app/playground/__tests__/registry.test.ts`
- Modify: `tools/playground/app/playground/__tests__/props-panel.test.ts`
- Delete: `tools/playground/app/playground/nodes/PropsPanel.tsx`

**Step 1: Write the failing playground regression tests**

Update `tools/playground/app/playground/__tests__/registry.test.ts`:

```ts
it("Label keeps its own props even though it shares Input.tsx", () => {
  const label = registry.find((entry) => entry.componentName === "Label");
  expect(label?.props?.children).toBeDefined();
});

it("Radio keeps its own props even though it shares Checkbox.tsx", () => {
  const radio = registry.find((entry) => entry.componentName === "Radio");
  expect(radio?.props?.checked).toBeDefined();
});
```

Update `tools/playground/app/playground/__tests__/props-panel.test.ts` so it imports the shared helper instead of the file you are deleting:

```ts
import { getControllableProps } from "@rdna/radiants/registry";
```

Use canonical `props` in the test input:

```ts
const controllable = getControllableProps({
  props: {
    defaultValue: { type: "string[]" },
    onValueChange: { type: "(value: string[]) => void" },
    options: { type: "array" },
    label: { type: "string" },
  },
});
```

**Step 2: Run the playground tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run \
  app/playground/__tests__/registry.test.ts \
  app/playground/__tests__/props-panel.test.ts \
  --cache=false
```

Expected: FAIL because the playground still depends on `manifestProps` and the deleted `PropsPanel.tsx`.

**Step 3: Write the minimal playground migration**

Make `tools/playground/generated/registry.ts` share the canonical prop/slot types:

```ts
import type { PropDef, SlotDef } from "@rdna/preview";

export type ManifestProp = PropDef;
export type ManifestSlot = SlotDef;
```

Update `tools/playground/app/playground/types.ts` so `RegistryEntry` has a canonical prop map:

```ts
import type { PropDef } from "@rdna/preview";

export interface RegistryEntry {
  id: string;
  componentName: string;
  label: string;
  group: string;
  packageName: string;
  Component: ComponentType<Record<string, unknown>> | null;
  rawComponent: ComponentType<Record<string, unknown>> | null;
  renderMode: "inline" | "custom";
  variants?: VariantDemo[];
  defaultProps: Record<string, unknown>;
  props: Record<string, PropDef>;
  sourcePath: string;
  schemaPath?: string;
  tokenBindings?: Record<string, Record<string, string>> | null;
  controlledProps?: string[];
  states?: string[];
}
```

Update `tools/playground/app/playground/registry.tsx` so Radiants entries use canonical registry metadata directly:

```ts
const radiantsEntries: RegistryEntry[] = sharedRegistry
  .filter((entry) => entry.renderMode !== "description-only")
  .map((entry) => ({
    id: entry.id,
    componentName: entry.name,
    label: entry.label,
    group: entry.group,
    packageName: entry.packageName,
    Component: entry.renderMode === "custom" ? entry.Demo ?? null : entry.component ?? null,
    rawComponent: entry.component ?? null,
    renderMode: entry.renderMode === "custom" ? "custom" : "inline",
    variants: entry.variants,
    defaultProps: entry.defaultProps,
    props: entry.props,
    sourcePath: entry.sourcePath,
    schemaPath: entry.schemaPath,
    tokenBindings: entry.tokenBindings,
    controlledProps: entry.controlledProps,
    states: entry.states,
  }))
  .filter((entry) => entry.Component !== null);
```

Map non-Radiants manifest entries onto the same `props` field instead of a separate `manifestProps`.

Update `tools/playground/app/playground/nodes/ComponentCard.tsx` to consume the shared layer:

```tsx
import {
  PropControls,
  useShowcaseProps,
} from "@rdna/radiants/registry";

const { props, remountKey, setPropValue, resetProps } = useShowcaseProps(entry);

const hasControllableProps =
  Object.keys(entry.props).length > 0 &&
  !(entry.renderMode === "custom" && entry.controlledProps?.length === 0);

<PropControls
  props={entry.props}
  values={props}
  onChange={setPropValue}
  onReset={resetProps}
  controlledProps={entry.controlledProps}
  renderMode={entry.renderMode}
  className="bg-[#0F0E0C] text-[#FEF8E2]"
/>;
```

Delete `tools/playground/app/playground/nodes/PropsPanel.tsx`.

**Step 4: Run the playground tests again**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run \
  app/playground/__tests__/registry.test.ts \
  app/playground/__tests__/props-panel.test.ts \
  --cache=false
```

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  tools/playground/generated/registry.ts \
  tools/playground/app/playground/types.ts \
  tools/playground/app/playground/registry.tsx \
  tools/playground/app/playground/nodes/ComponentCard.tsx \
  tools/playground/app/playground/__tests__/registry.test.ts \
  tools/playground/app/playground/__tests__/props-panel.test.ts \
  tools/playground/app/playground/nodes/PropsPanel.tsx
git commit -m "refactor(playground): consume canonical registry props"
```

---

### Task 5: Generate The Radiants Manifest From Canonical Metadata And Verify Freshness

**Files:**
- Modify: `tools/playground/scripts/generate-registry.ts`
- Modify: `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`

**Step 1: Write the failing manifest sync assertions**

Extend `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`:

```ts
it("manifest props match canonical registry props for Radiants entries", () => {
  for (const entry of buildRegistryMetadata()) {
    const hit = getManifestEntry("@rdna/radiants", entry.name);
    expect(hit?.props, `${entry.name}: props mismatch`).toEqual(entry.props);
  }
});

it("manifest defaultProps and tokenBindings match canonical metadata", () => {
  for (const entry of buildRegistryMetadata()) {
    const hit = getManifestEntry("@rdna/radiants", entry.name);
    expect(hit?.exampleProps ?? {}, `${entry.name}: default props mismatch`).toEqual(
      entry.defaultProps,
    );
    expect(hit?.tokenBindings ?? null, `${entry.name}: token bindings mismatch`).toEqual(
      entry.tokenBindings ?? null,
    );
  }
});
```

**Step 2: Run the sync test to verify it fails**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run \
  app/playground/__tests__/manifest-radiants-sync.test.ts \
  --cache=false
```

Expected: FAIL because `generate-registry.ts` still re-scans Radiants `*.meta.ts` files independently.

**Step 3: Write the minimal generator change**

Update `tools/playground/scripts/generate-registry.ts` so Radiants entries come from `buildRegistryMetadata()`:

```ts
import { buildRegistryMetadata } from "../../../packages/radiants/registry/build-registry-metadata.ts";

async function buildRadiantsManifest(): Promise<ManifestComponent[]> {
  return buildRegistryMetadata()
    .map((entry) => ({
      name: entry.name,
      description: entry.description,
      sourcePath: entry.sourcePath,
      schemaPath: entry.schemaPath,
      dnaPath: entry.dnaPath ?? null,
      category: entry.category,
      group: entry.group,
      renderMode: entry.renderMode,
      tags: entry.tags,
      exampleProps: entry.defaultProps,
      controlledProps: entry.controlledProps,
      states: entry.states,
      props: entry.props,
      slots: entry.slots,
      subcomponents: entry.subcomponents,
      examples: entry.examples,
      tokenBindings: entry.tokenBindings,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
```

Keep the generic schema-scanning path for non-Radiants packages.

**Step 4: Regenerate and verify the whole path**

Run:

```bash
pnpm --filter @rdna/playground registry:generate
pnpm --filter @rdna/playground exec vitest run \
  app/playground/__tests__/manifest-radiants-sync.test.ts \
  app/playground/__tests__/registry.test.ts \
  --cache=false
pnpm --filter @rdna/playground check:registry-freshness
```

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  tools/playground/scripts/generate-registry.ts \
  tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts \
  tools/playground/generated/registry.manifest.json
git commit -m "refactor(playground): generate radiants manifest from canonical metadata"
```

---

### Implementation Notes

- Do not create a second `PropDef` or `SlotDef` contract anywhere under `packages/radiants/registry`.
- Keep preview canonical even if that means broadening `PropDef` to accept both `values` and `options`.
- Keep `registry.overrides.tsx` untouched in this plan. Its deletion belongs to the cleanup/adoption plan after the canonical path is in use.
- Prefer one `props` field in playground data structures instead of keeping `manifestProps` alive as a second source of truth.
- If a custom demo is not intentionally exposed in the shared panels yet, leave it alone instead of backfilling speculative `controlledProps`.
