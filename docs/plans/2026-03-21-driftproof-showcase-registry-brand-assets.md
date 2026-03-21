# Driftproof Showcase Registry For Brand Assets And Playground Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Brand Assets components tab and the playground consume the same canonical Radiants showcase registry so component previews, props, states, and runtime demo wiring come from one drift-resistant source of truth.

**Architecture:** Keep the existing low-level `@rdna/radiants/registry` runtime export intact for compatibility, but add a new canonical showcase layer inside `packages/radiants/registry` that assembles everything needed to display components directly from co-located `*.meta.ts` plus `runtime-attachments.tsx`. Move reusable interactive controls and preview-state logic into that same package as a shared `PropControls` component and `useShowcaseProps` hook, make the playground consume them for Radiants instead of enriching by `sourcePath`, and make Brand Assets render the same canonical showcase entries instead of its older `DesignSystemTab` contract.

**Tech Stack:** React 19, Next.js 16, TypeScript, Vitest, React Testing Library, workspace package exports, generated `*.meta.ts` / `*.schema.json` / `*.dna.json`.

---

### Task 1: Create Canonical Radiants Showcase Metadata

**Files:**
- Create: `packages/radiants/registry/build-showcase-metadata.ts`
- Modify: `packages/radiants/registry/types.ts`
- Modify: `packages/radiants/registry/index.ts`
- Modify: `packages/radiants/registry/build-registry-metadata.ts`
- Test: `packages/radiants/registry/__tests__/showcase-metadata.test.ts`

**Step 1: Write the failing metadata contract test**

Create `packages/radiants/registry/__tests__/showcase-metadata.test.ts` with focused assertions for the new display contract:

```ts
import { describe, expect, it } from "vitest";
import { buildShowcaseMetadata } from "../build-showcase-metadata";

describe("buildShowcaseMetadata", () => {
  it("exposes canonical props and token bindings from co-located meta", () => {
    const entries = buildShowcaseMetadata();
    const button = entries.find((entry) => entry.name === "Button");

    expect(button?.props.mode.type).toBe("enum");
    expect(button?.tokenBindings?.solid?.background).toBe("accent");
  });

  it("does not key metadata lookup by sourcePath", () => {
    const entries = buildShowcaseMetadata();
    const label = entries.find((entry) => entry.name === "Label");
    const radio = entries.find((entry) => entry.name === "Radio");

    expect(label?.props.children.type).toBe("string");
    expect(radio?.props.checked.type).toBe("boolean");
  });

  it("derives defaultProps from exampleProps, then first variant, then empty object", () => {
    const entries = buildShowcaseMetadata();
    const input = entries.find((entry) => entry.name === "Input");

    expect(input?.defaultProps).toEqual({ placeholder: "Type something..." });
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run registry/__tests__/showcase-metadata.test.ts --cache=false`

Expected: FAIL with `buildShowcaseMetadata` missing and type errors on `props`, `tokenBindings`, or `defaultProps`.

**Step 3: Add the canonical showcase metadata builder**

Create `packages/radiants/registry/build-showcase-metadata.ts` and extend `packages/radiants/registry/types.ts` with a new server-safe display type. Keep the builder assembled from `componentMetaIndex`, not from the playground manifest.

Use this shape:

```ts
import { componentMetaIndex } from "../meta/index";
import type { PropDef, SlotDef } from "@rdna/preview";
import { CATEGORY_LABELS } from "./types";
import type { ShowcaseMetadataEntry } from "./types";

export function buildShowcaseMetadata(): ShowcaseMetadataEntry[] {
  return Object.entries(componentMetaIndex)
    .map(([fallbackName, data]) => {
      const { meta, sourcePath, schemaPath, dnaPath } = data;
      const reg = meta.registry;
      if (reg?.exclude) return null;

      const name = meta.name ?? fallbackName;
      const category = reg?.category ?? "layout";
      const defaultProps = reg?.exampleProps ?? reg?.variants?.[0]?.props ?? {};

      return {
        id: name.toLowerCase(),
        packageName: "@rdna/radiants",
        name,
        label: `${name}.tsx`,
        category,
        group: CATEGORY_LABELS[category] ?? category,
        description: meta.description ?? "",
        sourcePath: sourcePath ?? "",
        schemaPath,
        dnaPath: dnaPath ?? null,
        renderMode: reg?.renderMode ?? "inline",
        tags: reg?.tags ?? [],
        states: reg?.states,
        controlledProps: reg?.controlledProps,
        variants: reg?.variants,
        exampleProps: reg?.exampleProps,
        defaultProps,
        props: (meta.props ?? {}) as Record<string, PropDef>,
        slots: (meta.slots ?? {}) as Record<string, SlotDef>,
        subcomponents: meta.subcomponents ?? [],
        examples: meta.examples ?? [],
        tokenBindings: meta.tokenBindings ?? null,
      };
    })
    .filter((entry): entry is ShowcaseMetadataEntry => entry !== null)
    .sort((a, b) => {
      const catCmp = a.category.localeCompare(b.category);
      return catCmp === 0 ? a.name.localeCompare(b.name) : catCmp;
    });
}
```

Also update `packages/radiants/registry/index.ts` to export `buildShowcaseMetadata` and its types. Refactor `build-registry-metadata.ts` to reuse this new assembler for overlapping fields instead of maintaining a second mapping path.

**Step 4: Run the metadata test and existing registry metadata tests**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/showcase-metadata.test.ts \
  registry/__tests__/registry-metadata.test.ts \
  --cache=false
```

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  packages/radiants/registry/build-showcase-metadata.ts \
  packages/radiants/registry/types.ts \
  packages/radiants/registry/index.ts \
  packages/radiants/registry/build-registry-metadata.ts \
  packages/radiants/registry/__tests__/showcase-metadata.test.ts
git commit -m "feat(registry): add canonical showcase metadata builder"
```

### Task 2: Layer Runtime Wiring Into A Canonical Showcase Registry

**Files:**
- Create: `packages/radiants/registry/build-showcase-registry.ts`
- Modify: `packages/radiants/registry/types.ts`
- Modify: `packages/radiants/registry/index.ts`
- Modify: `packages/radiants/components/core/Select/Select.meta.ts`
- Modify: `packages/radiants/registry/__tests__/runtime-coverage.test.ts`
- Test: `packages/radiants/registry/__tests__/showcase-registry.test.ts`

**Step 1: Write the failing runtime showcase test**

Create `packages/radiants/registry/__tests__/showcase-registry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildShowcaseMetadata, showcaseRegistry } from "../index";

describe("showcaseRegistry", () => {
  it("keeps metadata and renderable showcase cardinality aligned", () => {
    const renderableMetadata = buildShowcaseMetadata().filter(
      (entry) => entry.renderMode !== "description-only",
    );

    expect(showcaseRegistry).toHaveLength(renderableMetadata.length);
  });

  it("exposes renderable Component refs for non-description-only entries", () => {
    for (const entry of showcaseRegistry) {
      expect(entry.Component).toBeTruthy();
      if (entry.renderMode === "inline") {
        expect(entry.rawComponent).toBeTruthy();
      }
    }
  });

  it("keeps duplicate-source-path components distinct by name", () => {
    const label = showcaseRegistry.find((entry) => entry.name === "Label");
    const input = showcaseRegistry.find((entry) => entry.name === "Input");

    expect(label?.props.children).toBeDefined();
    expect(input?.props.iconName).toBeDefined();
  });

  it("surfaces controlledProps from canonical meta for custom demos", () => {
    const select = buildShowcaseMetadata().find((entry) => entry.name === "Select");
    expect(select?.controlledProps).toEqual(
      expect.arrayContaining(["value", "placeholder", "disabled", "error", "fullWidth"]),
    );
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run registry/__tests__/showcase-registry.test.ts --cache=false`

Expected: FAIL because `showcaseRegistry` and `Component` / `rawComponent` fields do not exist yet.

**Step 3: Implement the canonical runtime showcase layer**

Create `packages/radiants/registry/build-showcase-registry.ts`:

```ts
import { buildShowcaseMetadata } from "./build-showcase-metadata";
import { runtimeAttachments } from "./runtime-attachments";
import type { ShowcaseEntry } from "./types";

export function buildShowcaseRegistry(): ShowcaseEntry[] {
  return buildShowcaseMetadata()
    .filter((entry) => entry.renderMode !== "description-only")
    .map((entry) => {
      const attachment = runtimeAttachments[entry.name];
      const Component =
        entry.renderMode === "custom"
          ? (attachment?.Demo ?? null)
          : (attachment?.component ?? null);

      return {
        ...entry,
        Component,
        rawComponent: attachment?.component ?? null,
      };
    })
    .filter((entry): entry is ShowcaseEntry => entry.Component !== null);
}
```

Export `showcaseRegistry` from `packages/radiants/registry/index.ts`. Keep the old `registry` export intact for now so unrelated consumers are not broken mid-migration.

Before exporting `showcaseRegistry`, backfill missing `controlledProps` in canonical meta for custom demos that will expose interactive controls. Start with `packages/radiants/components/core/Select/Select.meta.ts`:

```ts
registry: {
  category: "form",
  tags: ["dropdown", "picker", "choice"],
  renderMode: "custom",
  controlledProps: ["value", "placeholder", "disabled", "error", "fullWidth"],
  states: ["focus", "error", "disabled"],
}
```

Audit the remaining custom demos in the same pass and add `controlledProps` only where the runtime Demo actually forwards the prop.

Update `packages/radiants/registry/__tests__/runtime-coverage.test.ts` so it validates the live file `runtime-attachments.tsx`, not dead assumptions from `registry.overrides.tsx`.

**Step 4: Run the showcase runtime tests**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/showcase-registry.test.ts \
  registry/__tests__/runtime-coverage.test.ts \
  registry/__tests__/registry.test.ts \
  --cache=false
```

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  packages/radiants/registry/build-showcase-registry.ts \
  packages/radiants/registry/types.ts \
  packages/radiants/registry/index.ts \
  packages/radiants/components/core/Select/Select.meta.ts \
  packages/radiants/registry/__tests__/showcase-registry.test.ts \
  packages/radiants/registry/__tests__/runtime-coverage.test.ts
git commit -m "feat(registry): add canonical runtime showcase registry"
```

### Task 3: Extract Reusable Showcase UI From Playground

**Files:**
- Create: `packages/radiants/registry/components/ShowcasePropsPanel.tsx`
- Create: `packages/radiants/registry/components/ShowcasePreviewCard.tsx`
- Create: `packages/radiants/registry/showcase-forced-states.css`
- Modify: `packages/radiants/registry/index.ts`
- Modify: `packages/radiants/vitest.config.ts`
- Test: `packages/radiants/registry/__tests__/ShowcasePreviewCard.test.tsx`

**Step 1: Write the failing shared UI test**

Create `packages/radiants/registry/__tests__/ShowcasePreviewCard.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { showcaseRegistry } from "../index";
import { ShowcasePreviewCard } from "../components/ShowcasePreviewCard";

describe("ShowcasePreviewCard", () => {
  it("renders states and prop controls from canonical showcase metadata", () => {
    const button = showcaseRegistry.find((entry) => entry.name === "Button");
    render(<ShowcasePreviewCard entry={button!} />);

    expect(screen.getByText("States")).toBeInTheDocument();
    expect(screen.getByText("Props")).toBeInTheDocument();
    expect(screen.getByText("default")).toBeInTheDocument();
  });

  it("renders variant rows for inline components", () => {
    const button = showcaseRegistry.find((entry) => entry.name === "Button");
    render(<ShowcasePreviewCard entry={button!} />);

    expect(screen.getByText(/Variants/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run registry/__tests__/ShowcasePreviewCard.test.tsx --cache=false`

Expected: FAIL because the shared showcase UI does not exist and `vitest.config.ts` does not yet include `registry/**/*.test.tsx`.

**Step 3: Move reusable display behavior into `@rdna/radiants/registry`**

Add a shared props panel and preview card that use canonical prop definitions, not playground manifest types. Keep these features shared:

- default render
- variant rows
- forced state strip
- props controls

Keep these features playground-only:

- annotations
- violations badges
- iteration adoption
- work overlays

Skeleton for `packages/radiants/registry/components/ShowcasePreviewCard.tsx`:

```tsx
"use client";

import { Suspense, useMemo, useState } from "react";
import "./../showcase-forced-states.css";
import type { ForcedState, ShowcaseEntry } from "../types";
import { ShowcasePropsPanel } from "./ShowcasePropsPanel";

export function ShowcasePreviewCard({ entry }: { entry: ShowcaseEntry }) {
  const [forcedState, setForcedState] = useState<ForcedState>("default");
  const [propsOverrides, setPropsOverrides] = useState<Record<string, unknown>>({});
  const props = { ...entry.defaultProps, ...propsOverrides };
  const availableStates: ForcedState[] = ["default", ...((entry.states ?? []) as ForcedState[])];
  const stateAttr = forcedState !== "default" ? forcedState : undefined;
  const hasVariants = !!(entry.variants?.length && entry.rawComponent);

  return (
    <div className="flex rounded-xs border border-line bg-page">
      <ShowcasePropsPanel
        entry={entry}
        forcedState={forcedState}
        onForcedStateChange={setForcedState}
        propValues={props}
        onPropChange={(name, value) => setPropsOverrides((prev) => ({ ...prev, [name]: value }))}
        onReset={() => setPropsOverrides({})}
      />
      <div className="flex w-[22rem] flex-col">
        <div className="border-b border-rule px-3 py-2">
          <span className="font-mono text-xs text-main">{entry.label}</span>
        </div>
        <div className="p-2">
          <div className="rounded-sm border border-line bg-page" data-variant-label="default">
            <div data-force-state={stateAttr} className="min-h-32 p-3">
              <Suspense fallback={<span className="text-xs text-mute">Loading...</span>}>
                <entry.Component {...props} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Update `packages/radiants/vitest.config.ts` to include `registry/__tests__/**/*.test.tsx`.

**Step 4: Run the new shared UI test**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/ShowcasePreviewCard.test.tsx \
  registry/__tests__/showcase-registry.test.ts \
  --cache=false
```

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  packages/radiants/registry/components/ShowcasePropsPanel.tsx \
  packages/radiants/registry/components/ShowcasePreviewCard.tsx \
  packages/radiants/registry/showcase-forced-states.css \
  packages/radiants/registry/index.ts \
  packages/radiants/vitest.config.ts \
  packages/radiants/registry/__tests__/ShowcasePreviewCard.test.tsx
git commit -m "feat(registry): extract shared showcase preview UI"
```

### Task 4: Rewire Playground To Use The Canonical Radiants Showcase Layer

**Files:**
- Modify: `tools/playground/app/playground/registry.tsx`
- Modify: `tools/playground/app/playground/types.ts`
- Modify: `tools/playground/scripts/generate-registry.ts`
- Modify: `tools/playground/generated/registry.ts`
- Modify: `tools/playground/app/playground/__tests__/registry.test.ts`
- Modify: `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`

**Step 1: Write failing playground regressions**

Add explicit tests to `tools/playground/app/playground/__tests__/registry.test.ts`:

```ts
it("Label keeps its own props even though it shares Input.tsx", () => {
  const label = registry.find((entry) => entry.componentName === "Label");
  expect(label?.manifestProps?.children ?? label?.props?.children).toBeDefined();
});

it("Radio keeps its own props even though it shares Checkbox.tsx", () => {
  const radio = registry.find((entry) => entry.componentName === "Radio");
  expect(radio?.manifestProps?.checked ?? radio?.props?.checked).toBeDefined();
});
```

Add serialization coverage to `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`:

```ts
it("manifest props match canonical showcase metadata for every Radiants entry", () => {
  for (const entry of buildShowcaseMetadata()) {
    const hit = getManifestEntry("@rdna/radiants", entry.name);
    expect(hit?.props, `${entry.name}: props mismatch`).toEqual(entry.props);
  }
});
```

**Step 2: Run the failing playground tests**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run \
  app/playground/__tests__/registry.test.ts \
  app/playground/__tests__/manifest-radiants-sync.test.ts \
  --cache=false
```

Expected: FAIL on `Label` / `Radio` props or missing `buildShowcaseMetadata`.

**Step 3: Remove the Radiants manifest join and reuse the canonical export**

Update `tools/playground/app/playground/registry.tsx` so the Radiants path imports `showcaseRegistry` from `@rdna/radiants/registry` and maps it directly. Delete the `getManifestEntryBySourcePath(entry.sourcePath)` join for shared Radiants entries.

Use this mapping shape:

```ts
import { showcaseRegistry as sharedShowcaseRegistry } from "@rdna/radiants/registry";

const radiantsEntries: RegistryEntry[] = sharedShowcaseRegistry.map((entry) => ({
  ...entry,
  componentName: entry.name,
  manifestProps: entry.props,
}));
```

Update `tools/playground/scripts/generate-registry.ts` so Radiants manifest generation serializes from `buildShowcaseMetadata()` instead of directly scanning `*.meta.ts` again. Non-Radiants packages can keep the schema-scanning manifest path.

If `tools/playground/generated/registry.ts` still needs `getManifestEntryBySourcePath()` for non-Radiants consumers, keep it, but ensure the Radiants runtime path no longer depends on it.

**Step 4: Run the playground tests**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run \
  app/playground/__tests__/registry.test.ts \
  app/playground/__tests__/manifest-radiants-sync.test.ts \
  app/playground/__tests__/registry-contract.test.ts \
  --cache=false
pnpm --filter @rdna/playground registry:generate
```

Expected: PASS, and `registry.tsx` no longer enriches Radiants entries by `sourcePath`.

**Step 5: Commit**

```bash
git add \
  tools/playground/app/playground/registry.tsx \
  tools/playground/app/playground/types.ts \
  tools/playground/scripts/generate-registry.ts \
  tools/playground/generated/registry.ts \
  tools/playground/app/playground/__tests__/registry.test.ts \
  tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts
git commit -m "refactor(playground): consume canonical radiants showcase registry"
```

### Task 5: Make Brand Assets Consume The Same Showcase Entries And Shared Preview UI

**Files:**
- Modify: `apps/rad-os/components/ui/DesignSystemTab.tsx`
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx`
- Optional Modify: `apps/rad-os/components/ui/index.ts`

**Step 1: Write the integration target as a manual checklist**

There is no rad-os test harness today. Do not add one in this task. Instead, define the expected integration outcomes before coding:

- Brand Assets components tab reads from `showcaseRegistry`, not `registry`.
- The UI renders the same preview behavior as the shared showcase card:
  - default render
  - variants
  - forced states
  - props controls
- Search and category filtering still live in `BrandAssetsApp.tsx`.

**Step 2: Verify the current file does not already meet that contract**

Run:

```bash
rg -n "showcaseRegistry|ShowcasePreviewCard|manifestProps|forcedState" \
  apps/rad-os/components/apps/BrandAssetsApp.tsx \
  apps/rad-os/components/ui/DesignSystemTab.tsx
```

Expected: no matches for `showcaseRegistry` or `ShowcasePreviewCard`.

**Step 3: Rewire `DesignSystemTab` to the shared showcase contract**

Modify `apps/rad-os/components/ui/DesignSystemTab.tsx`:

- import `showcaseRegistry`, `CATEGORIES`, `CATEGORY_LABELS`, and `ShowcasePreviewCard` from `@rdna/radiants/registry`
- replace usage of `entry.component`, `entry.Demo`, `entry.exampleProps`, and the local preview branching with a single `<ShowcasePreviewCard entry={entry} />`
- filter by `entry.name`, `entry.description`, `entry.category`, and `entry.tags`

Minimal shape:

```tsx
import {
  showcaseRegistry,
  CATEGORIES,
  CATEGORY_LABELS,
  ShowcasePreviewCard,
  type ShowcaseEntry,
  type ComponentCategory,
} from "@rdna/radiants/registry";

const filtered = useMemo(() => {
  const q = search.toLowerCase();
  return showcaseRegistry.filter((entry) => {
    if (activeCategory !== "all" && entry.category !== activeCategory) return false;
    if (!q) return true;
    return [entry.name, entry.description, entry.category, ...(entry.tags ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}, [search, activeCategory]);
```

BrandAssets itself should keep only the filter controls and tab wiring. It should not reconstruct preview logic.

**Step 4: Run rad-os verification**

Run:

```bash
pnpm --filter rad-os exec tsc --noEmit
pnpm --filter rad-os lint apps/rad-os/components/apps/BrandAssetsApp.tsx apps/rad-os/components/ui/DesignSystemTab.tsx
```

Expected: PASS.

Then do a manual smoke test:

1. Run `pnpm --filter rad-os dev`
2. Open the Brand Assets app
3. Go to `04 UI Toolkit`
4. Confirm `Label`, `TextArea`, and `Radio` each show their own props and render correctly
5. Toggle at least one forced state and one prop override

**Step 5: Commit**

```bash
git add \
  apps/rad-os/components/ui/DesignSystemTab.tsx \
  apps/rad-os/components/apps/BrandAssetsApp.tsx
git commit -m "feat(rad-os): use canonical showcase registry in brand assets"
```

### Task 6: Remove Remaining Drift Residue And Tighten The Guards

**Files:**
- Modify: `packages/radiants/registry/__tests__/registry-overrides-props.test.ts`
- Modify: `packages/radiants/DESIGN.md`
- Modify: `tools/playground/scripts/check-registry-freshness.mjs`
- Optional Delete: `packages/radiants/registry/registry.overrides.tsx`

**Step 1: Write the failing cleanup test**

Replace the dead-file source assertion in `packages/radiants/registry/__tests__/registry-overrides-props.test.ts` with a live-path assertion against `runtime-attachments.tsx` or against the new `showcaseRegistry` contract:

```ts
import { describe, expect, it } from "vitest";
import { showcaseRegistry } from "../index";

describe("custom showcase prop forwarding", () => {
  it("Select exposes only the props its Demo actually forwards", () => {
    const select = showcaseRegistry.find((entry) => entry.name === "Select");
    expect(select?.controlledProps).toEqual(
      expect.arrayContaining(["value", "disabled", "placeholder", "error", "fullWidth"])
    );
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry-overrides-props.test.ts --cache=false`

Expected: FAIL until the test no longer reads `registry/registry.overrides.tsx`.

**Step 3: Clean up the stale path and strengthen freshness**

- rewrite `registry-overrides-props.test.ts` to validate the live runtime path
- update `packages/radiants/DESIGN.md` so it documents `runtime-attachments.tsx` / `showcaseRegistry`, not `registry.overrides.tsx`
- keep `tools/playground/scripts/check-registry-freshness.mjs` but extend it if needed so the new shared showcase files are covered by the same regeneration guard
- delete `packages/radiants/registry/registry.overrides.tsx` only after no live code, tests, or docs depend on it

**Step 4: Run the full verification set**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run --cache=false
pnpm --filter @rdna/playground exec vitest run --cache=false
pnpm --filter @rdna/playground check:registry-freshness
pnpm --filter rad-os exec tsc --noEmit
```

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  packages/radiants/registry/__tests__/registry-overrides-props.test.ts \
  packages/radiants/DESIGN.md \
  tools/playground/scripts/check-registry-freshness.mjs \
  packages/radiants/registry/registry.overrides.tsx
git commit -m "chore(registry): remove legacy showcase drift paths"
```

### Implementation Notes

- Do not make `apps/rad-os` import from `tools/playground`. The shared contract must live under `packages/radiants`.
- Do not keep the Radiants display path dependent on the generated playground manifest. The manifest may remain for non-Radiants packages only.
- Do not use `sourcePath` as the identity key for Radiants display metadata. `Radio`, `Checkbox`, `Input`, `Label`, and `TextArea` already prove that key is ambiguous.
- Keep the playground-only tooling in the playground. The shared layer should stop at reusable display primitives and canonical showcase entries.
- Prefer `props` from canonical meta over manifest-derived `manifestProps` for Radiants entries. If the playground needs a uniform field name, normalize into its local type at the boundary.

Plan complete and saved to `docs/plans/2026-03-21-driftproof-showcase-registry-brand-assets.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
