# Driftproof Registry: Shared Controls + Kill Drift Residue

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate the `registry.overrides.tsx` drift copy, surface prop definitions through the canonical metadata builder, and share interactive prop controls between playground and Brand Assets — all without adding a parallel registry layer.

**Architecture:** One metadata builder (`build-registry-metadata.ts`), one runtime builder (`build-registry.ts`), extended with the fields needed for interactive display. Shared `PropControls` + `useShowcaseProps` hook extracted to `packages/radiants/registry/`. Each consumer (playground `ComponentCard`, rad-os `DesignSystemTab`) keeps its own surrounding UI and imports just the shared controls.

**Tech Stack:** React 19, Next.js 16, TypeScript, Vitest, React Testing Library.

---

### Task 1: Extend Canonical Metadata With Display Fields

**Files:**
- Modify: `packages/radiants/registry/types.ts`
- Modify: `packages/radiants/registry/build-registry-metadata.ts`
- Modify: `packages/radiants/registry/index.ts`
- Modify: `packages/radiants/components/core/Select/Select.meta.ts`
- Test: `packages/radiants/registry/__tests__/registry-metadata.test.ts`

**Step 1: Write failing tests for the new fields**

Add assertions to the existing `packages/radiants/registry/__tests__/registry-metadata.test.ts`:

```ts
it("surfaces prop definitions from co-located meta", () => {
  const entries = buildRegistryMetadata();
  const button = entries.find((e) => e.name === "Button");

  expect(button?.props).toBeDefined();
  expect(button?.props?.mode?.type).toBe("enum");
});

it("surfaces tokenBindings from co-located meta", () => {
  const entries = buildRegistryMetadata();
  const button = entries.find((e) => e.name === "Button");

  expect(button?.tokenBindings).toBeDefined();
});

it("derives defaultProps from exampleProps, then first variant, then empty object", () => {
  const entries = buildRegistryMetadata();
  const input = entries.find((e) => e.name === "Input");

  expect(input?.defaultProps).toBeDefined();
  expect(typeof input?.defaultProps).toBe("object");
});

it("does not key metadata by sourcePath — Label and Radio have distinct props", () => {
  const entries = buildRegistryMetadata();
  const label = entries.find((e) => e.name === "Label");
  const radio = entries.find((e) => e.name === "Radio");

  expect(label?.props?.children).toBeDefined();
  expect(radio?.props?.checked).toBeDefined();
});

it("Select declares controlledProps for custom demo forwarding", () => {
  const entries = buildRegistryMetadata();
  const select = entries.find((e) => e.name === "Select");

  expect(select?.controlledProps).toEqual(
    expect.arrayContaining(["value", "disabled", "placeholder", "error", "fullWidth"]),
  );
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry-metadata.test.ts --cache=false
```

Expected: FAIL — `props`, `tokenBindings`, `defaultProps` not on `RegistryMetadataEntry`.

**Step 3: Extend types**

Add a `PropDef` type and extend `RegistryMetadataEntry` in `packages/radiants/registry/types.ts`:

```ts
export interface PropDef {
  type?: string;
  values?: string[];
  default?: unknown;
  description?: string;
  items?: { type?: string };
}

export interface SlotDef {
  description?: string;
}
```

Add these fields to `RegistryMetadataEntry`:

```ts
export interface RegistryMetadataEntry {
  // ... existing fields unchanged ...

  // New display fields
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

Export `PropDef` and `SlotDef` from `packages/radiants/registry/index.ts`.

**Step 4: Populate new fields in `build-registry-metadata.ts`**

Extend the mapping in `buildRegistryMetadata()` to read these from `componentMetaIndex`:

```ts
const name = meta.name ?? fallbackName;
const defaultProps = reg?.exampleProps ?? reg?.variants?.[0]?.props ?? {};

return {
  // ... existing fields ...
  id: name.toLowerCase(),
  label: `${name}.tsx`,
  group: CATEGORY_LABELS[category] ?? category,
  props: (meta.props ?? {}) as Record<string, PropDef>,
  slots: (meta.slots ?? {}) as Record<string, SlotDef>,
  defaultProps,
  tokenBindings: meta.tokenBindings ?? null,
  subcomponents: meta.subcomponents ?? [],
  examples: meta.examples ?? [],
};
```

**Step 5: Backfill `controlledProps` in `Select.meta.ts`**

Add to the `registry` block in `packages/radiants/components/core/Select/Select.meta.ts`:

```ts
controlledProps: ["value", "placeholder", "disabled", "error", "fullWidth"],
```

Audit remaining `renderMode: "custom"` entries and add `controlledProps` where the Demo actually forwards them.

**Step 6: Run tests**

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/registry-metadata.test.ts \
  registry/__tests__/registry.test.ts \
  --cache=false
```

Expected: PASS.

**Step 7: Commit**

```bash
git add \
  packages/radiants/registry/types.ts \
  packages/radiants/registry/build-registry-metadata.ts \
  packages/radiants/registry/index.ts \
  packages/radiants/components/core/Select/Select.meta.ts \
  packages/radiants/registry/__tests__/registry-metadata.test.ts
git commit -m "feat(registry): extend canonical metadata with display fields"
```

---

### Task 2: Extract Shared PropControls And useShowcaseProps

**Files:**
- Create: `packages/radiants/registry/PropControls.tsx`
- Create: `packages/radiants/registry/useShowcaseProps.ts`
- Modify: `packages/radiants/registry/index.ts`
- Test: `packages/radiants/registry/__tests__/PropControls.test.tsx`

**Step 1: Write failing test**

Create `packages/radiants/registry/__tests__/PropControls.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PropControls } from "../PropControls";
import type { PropDef } from "../types";

const testProps: Record<string, PropDef> = {
  variant: { type: "enum", values: ["solid", "outline", "ghost"] },
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

  it("filters to controlledProps when provided", () => {
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

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/PropControls.test.tsx --cache=false
```

Expected: FAIL — `PropControls` does not exist.

**Step 3: Implement shared controls**

Create `packages/radiants/registry/useShowcaseProps.ts`:

```ts
import { useMemo, useState } from "react";
import type { RegistryMetadataEntry } from "./types";

export function useShowcaseProps(
  entry: Pick<RegistryMetadataEntry, "defaultProps" | "variants">,
) {
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});
  const props = { ...entry.defaultProps, ...overrides };

  const remountKey = useMemo(() => {
    const defaults = Object.entries(overrides).filter(([k]) =>
      k.startsWith("default"),
    );
    return defaults.length > 0 ? JSON.stringify(defaults) : "stable";
  }, [overrides]);

  return {
    props,
    overrides,
    remountKey,
    setPropValue: (name: string, value: unknown) =>
      setOverrides((prev) => ({ ...prev, [name]: value })),
    applyPreset: (preset: Record<string, unknown>) => setOverrides(preset),
    resetProps: () => setOverrides({}),
  };
}
```

Create `packages/radiants/registry/PropControls.tsx` — port the control logic from `tools/playground/app/playground/nodes/PropsPanel.tsx` but:

- Accept `props: Record<string, PropDef>` instead of `manifestProps: Record<string, ManifestProp>` (same shape, canonical type)
- Use **semantic tokens** (`text-main`, `text-mute`, `border-line`, `bg-page`) instead of hardcoded playground colors (`#FEF8E2`, `rgba(254,248,226,...)`)
- Keep the same `getControllableProps` filtering, `SKIP_TYPES`, `CONTROLLED_UNCONTROLLED_PAIRS`, and per-type control components (`BooleanControl`, `EnumControl`, `StringControl`, `NumberControl`, `ReactNodeControl`)
- Export `getControllableProps` for consumers that need it

Interface:

```tsx
interface PropControlsProps {
  props: Record<string, PropDef>;
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  onReset: () => void;
  controlledProps?: string[];
  renderMode?: RenderMode;
}
```

Export both from `packages/radiants/registry/index.ts`.

**Step 4: Run tests**

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
git commit -m "feat(registry): extract shared PropControls and useShowcaseProps"
```

---

### Task 3: Rewire Playground To Use Canonical Metadata + Shared Controls

**Files:**
- Modify: `tools/playground/app/playground/registry.tsx`
- Modify: `tools/playground/app/playground/nodes/ComponentCard.tsx`
- Delete: `tools/playground/app/playground/nodes/PropsPanel.tsx`
- Modify: `tools/playground/scripts/generate-registry.ts`
- Modify: `tools/playground/app/playground/__tests__/registry.test.ts`

**Step 1: Write failing regression tests**

Add to `tools/playground/app/playground/__tests__/registry.test.ts`:

```ts
it("Label keeps its own props even though it shares Input.tsx", () => {
  const label = registry.find((e) => e.componentName === "Label");
  expect(label?.manifestProps?.children ?? label?.props?.children).toBeDefined();
});

it("Radio keeps its own props even though it shares Checkbox.tsx", () => {
  const radio = registry.find((e) => e.componentName === "Radio");
  expect(radio?.manifestProps?.checked ?? radio?.props?.checked).toBeDefined();
});
```

**Step 2: Run to verify failure**

```bash
pnpm --filter @rdna/playground exec vitest run \
  app/playground/__tests__/registry.test.ts \
  --cache=false
```

**Step 3: Simplify playground registry mapping**

Update `tools/playground/app/playground/registry.tsx`:

- Import `registry` (the pre-built `RegistryEntry[]`) from `@rdna/radiants/registry`
- Map Radiants entries directly using the new canonical fields (`props`, `defaultProps`, `tokenBindings`, `id`, `label`, `group`) instead of enriching from `getManifestEntryBySourcePath()`
- The playground's `RegistryEntry` type gains a `props` field (the canonical `Record<string, PropDef>`) as the primary prop source; `manifestProps` becomes optional/fallback for non-Radiants packages only

```ts
import { registry as radiantsRegistry } from "@rdna/radiants/registry";

const radiantsEntries: RegistryEntry[] = radiantsRegistry
  .filter((e) => e.renderMode !== "description-only")
  .map((entry) => ({
    id: entry.id,
    componentName: entry.name,
    label: entry.label,
    group: entry.group,
    packageName: entry.packageName,
    Component: entry.Demo ?? entry.component ?? null,
    rawComponent: entry.component ?? null,
    renderMode: entry.renderMode as "inline" | "custom",
    variants: entry.variants,
    defaultProps: entry.defaultProps,
    sourcePath: entry.sourcePath,
    schemaPath: entry.schemaPath,
    tokenBindings: entry.tokenBindings,
    props: entry.props,
    controlledProps: entry.controlledProps,
    states: entry.states,
  }));
```

**Step 4: Replace local PropsPanel with shared PropControls**

In `tools/playground/app/playground/nodes/ComponentCard.tsx`:

- Replace `import { PropsPanel } from "./PropsPanel"` with `import { PropControls, useShowcaseProps } from "@rdna/radiants/registry"`
- Replace local prop override state + remount key logic with `useShowcaseProps(entry)`
- Replace `<PropsPanel manifestProps={...} ... />` with `<PropControls props={entry.props} ... />`
- Keep all playground-only UI (work overlays, annotations, violations, iteration cards) untouched
- The playground may need to apply its own className overrides to `PropControls` for dark-on-dark canvas styling — if so, add an optional `className` prop to `PropControls`

Delete `tools/playground/app/playground/nodes/PropsPanel.tsx`.

**Step 5: Update `generate-registry.ts` to read canonical metadata for Radiants**

In `tools/playground/scripts/generate-registry.ts`:

- Import `buildRegistryMetadata` from `packages/radiants/registry/build-registry-metadata` (direct path, not the barrel, to stay server-safe)
- For Radiants entries, map from the canonical metadata instead of re-scanning `*.meta.ts` files via dynamic `import()`
- Keep the generic `*.schema.json` scanning path for non-Radiants packages

**Step 6: Run playground tests + regenerate**

```bash
pnpm --filter @rdna/playground exec vitest run --cache=false
pnpm --filter @rdna/playground registry:generate
```

Expected: PASS.

**Step 7: Commit**

```bash
git add \
  tools/playground/app/playground/registry.tsx \
  tools/playground/app/playground/nodes/ComponentCard.tsx \
  tools/playground/app/playground/nodes/PropsPanel.tsx \
  tools/playground/scripts/generate-registry.ts \
  tools/playground/app/playground/__tests__/registry.test.ts
git commit -m "refactor(playground): consume canonical registry + shared PropControls"
```

---

### Task 4: Add Interactive Controls To Brand Assets

**Files:**
- Modify: `apps/rad-os/components/ui/DesignSystemTab.tsx`

**Step 1: Verify current state**

```bash
rg -n "PropControls|useShowcaseProps|forcedState" \
  apps/rad-os/components/ui/DesignSystemTab.tsx
```

Expected: no matches.

**Step 2: Add shared controls to `ComponentShowcaseCard`**

In `apps/rad-os/components/ui/DesignSystemTab.tsx`:

- Import `PropControls`, `useShowcaseProps`, and `type ForcedState` from `@rdna/radiants/registry`
- In `ComponentShowcaseCard`, add `useShowcaseProps(entry)` for prop state management
- Add the forced-state strip (the row of `default | hover | focus | disabled | error` buttons) when `entry.states` has entries
- Replace the static render block with a dynamic one that passes `props` from `useShowcaseProps` and applies `data-force-state` to the wrapper
- Add `<PropControls>` alongside the preview when the entry has controllable props
- Keep the existing card chrome (name + category badge header, description) — do not import a shared card wrapper

The `DesignSystemTab` layout is constrained by the rad-os window system, so style PropControls with the same semantic tokens it already uses (`bg-page`, `text-main`, `border-line`, `text-mute`).

**Step 3: Run rad-os verification**

```bash
pnpm --filter rad-os exec tsc --noEmit
```

Expected: PASS.

Then manual smoke test:
1. `pnpm --filter rad-os dev`
2. Open Brand Assets → `04 UI Toolkit`
3. Confirm Label, TextArea, Radio show their own props
4. Toggle a forced state and a prop override

**Step 4: Commit**

```bash
git add apps/rad-os/components/ui/DesignSystemTab.tsx
git commit -m "feat(rad-os): add interactive prop controls to brand assets"
```

---

### Task 5: Delete Drift Residue

**Files:**
- Delete: `packages/radiants/registry/registry.overrides.tsx`
- Modify: `packages/radiants/registry/__tests__/registry-overrides-props.test.ts`
- Modify: `packages/radiants/DESIGN.md`
- Modify: `tools/playground/scripts/check-registry-freshness.mjs`

**Step 1: Verify nothing imports `registry.overrides.tsx`**

```bash
rg "registry.overrides" --type ts --type tsx
```

If any live imports remain, migrate them first.

**Step 2: Rewrite `registry-overrides-props.test.ts`**

Replace the raw source-text assertions with canonical metadata assertions:

```ts
import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "../build-registry-metadata";

describe("custom demo prop forwarding (canonical metadata)", () => {
  it("Select declares forwarded props", () => {
    const select = buildRegistryMetadata().find((e) => e.name === "Select");
    expect(select?.controlledProps).toEqual(
      expect.arrayContaining(["value", "disabled", "placeholder", "error", "fullWidth"]),
    );
  });

  it("Drawer declares forwarded props", () => {
    const drawer = buildRegistryMetadata().find((e) => e.name === "Drawer");
    expect(drawer?.controlledProps).toEqual(
      expect.arrayContaining(["direction", "defaultOpen"]),
    );
  });

  it("Sheet declares forwarded props", () => {
    const sheet = buildRegistryMetadata().find((e) => e.name === "Sheet");
    expect(sheet?.controlledProps).toEqual(
      expect.arrayContaining(["side"]),
    );
  });
});
```

**Step 3: Delete `registry.overrides.tsx`**

```bash
rm packages/radiants/registry/registry.overrides.tsx
```

**Step 4: Update `DESIGN.md`**

Remove references to `registry.overrides.tsx`. Document `runtime-attachments.tsx` as the single runtime source and the extended `RegistryMetadataEntry` as the canonical display type.

**Step 5: Run full verification**

```bash
pnpm --filter @rdna/radiants exec vitest run --cache=false
pnpm --filter @rdna/playground exec vitest run --cache=false
pnpm --filter rad-os exec tsc --noEmit
```

Expected: PASS.

**Step 6: Commit**

```bash
git add \
  packages/radiants/registry/registry.overrides.tsx \
  packages/radiants/registry/__tests__/registry-overrides-props.test.ts \
  packages/radiants/DESIGN.md \
  tools/playground/scripts/check-registry-freshness.mjs
git commit -m "chore(registry): delete registry.overrides.tsx drift copy"
```

---

### Implementation Notes

- Do not create `build-showcase-metadata.ts` or `build-showcase-registry.ts`. The existing builders are the single path.
- Do not create `ShowcasePreviewCard`. Each consumer owns its card layout.
- `PropControls` uses semantic tokens, not hardcoded colors. The playground may apply a `className` override for its dark canvas.
- `useShowcaseProps` is a pure state hook with no rendering — consumers wire it into their own UI.
- `generate-registry.ts` imports `build-registry-metadata` by direct path (not the barrel) to stay server-safe.
- The playground keeps all playground-only features (annotations, violations, work overlays, iteration cards) in `ComponentCard.tsx` — they do not leak into the shared layer.
- `registry.overrides.tsx` (997 lines) is the primary deletion target. `runtime-attachments.tsx` (835 lines) stays as the single runtime source.

### LOC Estimate

| Category | Lines |
|----------|-------|
| New files (`PropControls.tsx`, `useShowcaseProps.ts`, test) | +~230 |
| Type extensions (`types.ts`, `build-registry-metadata.ts`, `index.ts`) | +~35 |
| Consumer modifications (DesignSystemTab, ComponentCard, playground/registry, generate-registry) | +~60 / -~120 |
| Deleted (`registry.overrides.tsx`, `PropsPanel.tsx`) | -1302 |
| Test rewrites (`registry-overrides-props.test.ts`) | +~25 / -~40 |
| **Net** | **~-1110** |
