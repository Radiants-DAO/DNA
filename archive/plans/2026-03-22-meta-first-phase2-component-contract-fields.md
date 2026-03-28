# Meta-First Phase 2 Component Contract Fields Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the first real component-owned contract fields to `*.meta.ts`, project them into registry and generated artifacts, remove the hand-authored `componentMap` entries that now belong to component metadata, and keep playground variant rendering sourced only from shared registry/meta data.

**Architecture:** Keep `packages/radiants/contract/system.ts` as the home for system-wide token, motion, and shadow data. Move component-owned facts into `*.meta.ts` and thread them through one shared projection path used by registry metadata, the playground manifest, `eslint-contract.json`, and `ai-contract.json`. Playground-local hand-authored variant presets are intentionally gone; the shared Radiants registry remains the only source for curated variant cards, so Phase 2 must not recreate an app-layer variant override path. `Label.meta.ts` is gone and must not be reintroduced; the pilot set for this phase is `Separator`, `Meter`, `Collapsible`, `Toggle`, and `Card`. If a small component API or markup change makes the contract cleaner, change the component instead of encoding a one-off exception.

**Tech Stack:** Node 22 ESM, TypeScript metadata files, React 19 components, Vitest, JSON generated artifacts, pnpm workspaces

**Relevant skills:** @test-driven-development, @verification-before-completion, @typescript-advanced-types

---

### Prerequisite Gate

Run:

```bash
pnpm --filter @rdna/playground registry:generate
test ! -f packages/radiants/components/core/Input/Label.meta.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
```

Expected:

- `registry:generate` passes on the Phase 1 baseline
- `Label.meta.ts` is absent
- the existing contract builder test suite passes before Phase 2 work starts

If `Label.meta.ts` exists on the branch, stop and reconcile branch drift before starting. Do not recreate it in this phase.

### Task 1: Extend `ComponentMeta` With Phase 2 Contract Fields And Keep Schema Output Clean

**Files:**
- Modify: `packages/preview/src/types.ts`
- Modify: `packages/preview/src/index.ts`
- Modify: `packages/preview/src/__tests__/component-meta.test.ts`
- Modify: `packages/preview/src/generate-schemas.ts`
- Modify: `packages/preview/src/__tests__/generate-schemas.test.ts`

**Step 1: Write the failing tests**

Extend `packages/preview/src/__tests__/component-meta.test.ts` with:

```ts
it("supports phase-2 contract fields alongside preview metadata", () => {
  const meta = defineComponentMeta<Record<string, unknown>>()({
    name: "Card",
    description: "Card",
    props: {},
    replaces: [{ element: "section", import: "@rdna/radiants/components/core" }],
    pixelCorners: true,
    shadowSystem: "pixel",
    wraps: "@base-ui/react/toggle",
    styleOwnership: [
      {
        attribute: "data-variant",
        themeOwned: ["default", "raised"],
        consumerExtensible: ["custom"],
      },
    ],
    a11y: {
      role: "button",
      requiredAttributes: ["aria-pressed"],
      contrastRequirement: "AA",
    },
  });

  expect(meta.replaces?.[0]?.element).toBe("section");
  expect(meta.styleOwnership?.[0]?.attribute).toBe("data-variant");
  expect(meta.a11y?.requiredAttributes).toContain("aria-pressed");
});
```

Update `packages/preview/src/__tests__/generate-schemas.test.ts` so the fixture meta object itself now includes every new field:

```ts
replaces: [{ element: "section", import: "@rdna/radiants/components/core" }],
pixelCorners: true,
shadowSystem: "pixel",
wraps: "@base-ui/react/toggle",
styleOwnership: [{ attribute: "data-variant", themeOwned: ["default"] }],
a11y: { role: "button", requiredAttributes: ["aria-pressed"] },
```

Then add exclusion assertions:

```ts
expect(schema.replaces).toBeUndefined();
expect(schema.pixelCorners).toBeUndefined();
expect(schema.shadowSystem).toBeUndefined();
expect(schema.wraps).toBeUndefined();
expect(schema.styleOwnership).toBeUndefined();
expect(schema.a11y).toBeUndefined();
```

Do not add `structuralRules` yet. It is deferred to Phase 3, when `eslint-contract.json` will start carrying rule-facing component metadata.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/component-meta.test.ts ../preview/src/__tests__/generate-schemas.test.ts --cache=false
```

Expected: FAIL because `ComponentMeta` does not yet accept the new fields and `generate-schemas.ts` does not strip them.

**Step 3: Extend the metadata types and schema stripper**

Update `packages/preview/src/types.ts` with the exact Phase 2 contract types:

```ts
export interface ElementReplacement {
  element: string;
  import?: string;
  note?: string;
  qualifier?: string;
}

export interface StyleOwnership {
  attribute: `data-${string}`;
  themeOwned: string[];
  consumerExtensible?: string[];
}

export interface A11yContract {
  role?: string;
  requiredAttributes?: string[];
  keyboardInteractions?: string[];
  contrastRequirement?: "AA" | "AAA";
}
```

Extend `ComponentMeta<TProps>` with:

```ts
replaces?: ElementReplacement[];
pixelCorners?: boolean;
shadowSystem?: "standard" | "pixel";
styleOwnership?: StyleOwnership[];
wraps?: string;
a11y?: A11yContract;
```

Update `packages/preview/src/index.ts` to export the new types.

Update `packages/preview/src/generate-schemas.ts` so the schema projection strips every contract-only field:

```ts
const {
  tokenBindings: _tokenBindings,
  registry: _registry,
  sourcePath: _sourcePath,
  replaces: _replaces,
  pixelCorners: _pixelCorners,
  shadowSystem: _shadowSystem,
  styleOwnership: _styleOwnership,
  wraps: _wraps,
  a11y: _a11y,
  ...schema
} = meta as ComponentMeta & {
  registry?: unknown;
  sourcePath?: string;
};
```

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/component-meta.test.ts ../preview/src/__tests__/generate-schemas.test.ts --cache=false
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/preview/src/types.ts packages/preview/src/index.ts packages/preview/src/__tests__/component-meta.test.ts packages/preview/src/generate-schemas.ts packages/preview/src/__tests__/generate-schemas.test.ts
git commit -m "feat(preview): add phase-2 component contract fields"
```

### Task 2: Create One Shared Sparse Contract-Field Projection For Registry And Manifest

**Files:**
- Create: `packages/radiants/registry/contract-fields.ts`
- Modify: `packages/radiants/registry/types.ts`
- Modify: `packages/radiants/registry/build-registry-metadata.ts`
- Modify: `packages/radiants/registry/__tests__/registry-metadata.test.ts`
- Modify: `tools/playground/scripts/generate-registry.ts`
- Modify: `tools/playground/app/playground/registry.tsx`
- Modify: `tools/playground/app/playground/__tests__/registry.test.ts`
- Modify: `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`

**Step 1: Write the failing tests**

In `packages/radiants/registry/__tests__/registry-metadata.test.ts`, add a fixture-level test that does not depend on real components:

```ts
it("projects sparse contract fields from fixture metadata", () => {
  const fields = pickContractFields({
    name: "Toggle",
    description: "Toggle",
    props: {},
    wraps: "@base-ui/react/toggle",
    a11y: { role: "button", requiredAttributes: ["aria-pressed"] },
    styleOwnership: [{ attribute: "data-state", themeOwned: ["selected"] }],
  });

  expect(fields).toEqual({
    wraps: "@base-ui/react/toggle",
    a11y: { role: "button", requiredAttributes: ["aria-pressed"] },
    styleOwnership: [{ attribute: "data-state", themeOwned: ["selected"] }],
  });
});
```

In `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`, add a manifest-side fixture test:

```ts
it("reuses the same sparse contract projection for manifest serialization", () => {
  const fixture = {
    name: "Separator",
    description: "Separator",
    props: {},
    replaces: [{ element: "hr", import: "@rdna/radiants/components/core" }],
    wraps: "@base-ui/react/separator",
  };

  expect(buildManifestContractFields(fixture)).toEqual(
    pickContractFields(fixture),
  );
});
```

Add one omission assertion so absent fields stay absent:

```ts
expect(buildManifestContractFields({ name: "Plain", description: "Plain", props: {} })).toEqual({});
```

In `tools/playground/app/playground/__tests__/registry.test.ts`, add a shared-registry regression:

```ts
import { registry as sharedRegistry } from "@rdna/radiants/registry";

it("uses shared registry variants for radiants entries without playground-local presets", () => {
  const sharedButton = sharedRegistry.find((entry) => entry.name === "Button");
  const playgroundButton = registry.find(
    (entry) => entry.packageName === "@rdna/radiants" && entry.componentName === "Button",
  );

  expect(sharedButton?.variants).toBeDefined();
  expect(playgroundButton?.variants).toEqual(sharedButton?.variants);
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/registry.test.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/manifest-radiants-sync.test.ts
```

Expected: FAIL because the shared projection helper does not exist, the registry/manifest builders do not yet serialize the new fields, and the playground registry path is not yet explicitly guarded against reintroducing local variant presets.

**Step 3: Add the shared sparse projection helper**

Create `packages/radiants/registry/contract-fields.ts`:

```ts
export function pickContractFields(meta: ComponentMeta<unknown>) {
  return Object.fromEntries(
    Object.entries({
      replaces: meta.replaces,
      pixelCorners: meta.pixelCorners,
      shadowSystem: meta.shadowSystem,
      styleOwnership: meta.styleOwnership,
      wraps: meta.wraps,
      a11y: meta.a11y,
    }).filter(([, value]) => value !== undefined),
  );
}
```

Update `packages/radiants/registry/types.ts` so `RegistryMetadataEntry` carries the same fields.

Update `packages/radiants/registry/build-registry-metadata.ts` to spread `pickContractFields(data.meta)` into each entry.

Update `tools/playground/scripts/generate-registry.ts` to export:

```ts
export function buildManifestContractFields(meta: ComponentMeta<unknown>) {
  return pickContractFields(meta);
}
```

Then spread `buildManifestContractFields(meta)` into each manifest component.

Update `tools/playground/app/playground/registry.tsx` only if needed so Radiants entries continue to pass through shared `entry.variants` directly. Do not recreate a playground-local variants array, fallback variant preset list, or app-layer merge step for shared Radiants components. If a stale override path still exists on the branch, delete it in this task.

Keep both projections sparse. Do not emit placeholder arrays or empty objects.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/registry.test.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/manifest-radiants-sync.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/registry/contract-fields.ts packages/radiants/registry/types.ts packages/radiants/registry/build-registry-metadata.ts packages/radiants/registry/__tests__/registry-metadata.test.ts tools/playground/scripts/generate-registry.ts tools/playground/app/playground/registry.tsx tools/playground/app/playground/__tests__/registry.test.ts tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts
git commit -m "feat(registry): share sparse component contract field projection"
```

### Task 3: Build Meta-Derived Contract Sections And Add M-5 Validation Guardrails

**Files:**
- Create: `tools/playground/scripts/load-radiants-component-contracts.ts`
- Modify: `tools/playground/scripts/build-radiants-contract.ts`
- Modify: `tools/playground/scripts/generate-registry.ts`
- Modify: `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts`

**Step 1: Write the failing tests**

Extend `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts` with pure fixture-based coverage:

```ts
it("builds componentMap and component sections from meta-derived input", async () => {
  const { eslintContract, aiContract } = await buildRadiantsContractsFromComponents(
    radiantsSystemContract,
    [
      {
        name: "Separator",
        sourcePath: "packages/radiants/components/core/Separator/Separator.tsx",
        replaces: [{ element: "hr", import: "@rdna/radiants/components/core" }],
        wraps: "@base-ui/react/separator",
        a11y: { role: "separator", requiredAttributes: ["aria-orientation"] },
      },
      {
        name: "Card",
        sourcePath: "packages/radiants/components/core/Card/Card.tsx",
        pixelCorners: true,
        shadowSystem: "pixel",
        styleOwnership: [{ attribute: "data-variant", themeOwned: ["default", "raised"] }],
        a11y: { contrastRequirement: "AA" },
      },
    ],
  );

  expect(eslintContract.componentMap.hr.component).toBe("Separator");
  expect(eslintContract.components.Card.pixelCorners).toBe(true);
  expect(eslintContract.components.Separator.a11y?.role).toBe("separator");
  expect(aiContract.components).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "Separator",
        replaces: ["<hr>"],
        a11y: expect.objectContaining({ role: "separator" }),
      }),
    ]),
  );
});
```

Add the M-5 guard tests:

```ts
it("throws when two components claim the same raw element", async () => {
  await expect(
    buildRadiantsContractsFromComponents(radiantsSystemContract, [
      {
        name: "Separator",
        sourcePath: "packages/radiants/components/core/Separator/Separator.tsx",
        replaces: [{ element: "hr" }],
      },
      {
        name: "FancyRule",
        sourcePath: "packages/radiants/components/core/FancyRule/FancyRule.tsx",
        replaces: [{ element: "hr" }],
      },
    ]),
  ).rejects.toThrow(/hr/);
});

it("throws when a component declares replaces without a resolved sourcePath", async () => {
  await expect(
    buildRadiantsContractsFromComponents(radiantsSystemContract, [
      {
        name: "GhostSeparator",
        sourcePath: null,
        replaces: [{ element: "hr" }],
      },
    ]),
  ).rejects.toThrow(/sourcePath/);
});
```

Add one integration test for the public builder so the wiring is specified, not implied:

```ts
it("loads component contracts before building generated artifacts", async () => {
  const loadComponents = vi.fn().mockResolvedValue([
    {
      name: "Separator",
      sourcePath: "packages/radiants/components/core/Separator/Separator.tsx",
      replaces: [{ element: "hr", import: "@rdna/radiants/components/core" }],
    },
  ]);

  const { eslintContract } = await buildRadiantsContracts({
    system: radiantsSystemContract,
    loadComponents,
  });

  expect(loadComponents).toHaveBeenCalledTimes(1);
  expect(eslintContract.componentMap.hr.component).toBe("Separator");
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
```

Expected: FAIL because the builder does not yet accept meta-derived component input, does not project `a11y`, and does not validate ghost or duplicate `replaces` declarations.

**Step 3: Refactor the builder around loaded component contracts**

Create `tools/playground/scripts/load-radiants-component-contracts.ts` with:

```ts
export interface RadiantsContractComponent {
  name: string;
  sourcePath: string | null;
  replaces?: ElementReplacement[];
  pixelCorners?: boolean;
  shadowSystem?: "standard" | "pixel";
  styleOwnership?: StyleOwnership[];
  wraps?: string;
  a11y?: A11yContract;
}
```

Populate it from the same component metadata source the registry builder already walks. Reuse `pickContractFields(meta)` instead of hand-copying field names again.

Update `tools/playground/scripts/build-radiants-contract.ts` to export:

```ts
export async function buildRadiantsContractsFromComponents(
  system: RadiantsSystemContract,
  components: RadiantsContractComponent[],
) {
  // build componentMap, eslintContract.components, aiContract.components, and themeVariants
}
```

Add a public entry point that wires the loader into the existing builder:

```ts
export async function buildRadiantsContracts(options = {}) {
  const system = options.system ?? radiantsSystemContract;
  const loadComponents = options.loadComponents ?? loadRadiantsComponentContracts;
  const components = await loadComponents();
  return buildRadiantsContractsFromComponents(system, components);
}
```

Required validation:

```ts
if (component.replaces?.length && !component.sourcePath) {
  throw new Error(`Component ${component.name} declares replaces but has no resolved sourcePath`);
}
if (seen.has(replacement.element)) {
  throw new Error(
    `Duplicate replaces entry for <${replacement.element}> between ${first.name} and ${component.name}`,
  );
}
```

Projection rules:

- Build `eslintContract.componentMap` only from `replaces`
- Build `eslintContract.components[componentName]` from `pixelCorners`, `shadowSystem`, `styleOwnership`, `wraps`, and `a11y`
- Project `a11y` into `aiContract.components` as well
- Merge `styleOwnership[*].themeOwned` into `eslintContract.themeVariants`

Update `tools/playground/scripts/generate-registry.ts` to reuse `loadRadiantsComponentContracts()` instead of creating a second component-contract scan.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tools/playground/scripts/load-radiants-component-contracts.ts tools/playground/scripts/build-radiants-contract.ts tools/playground/scripts/generate-registry.ts tools/playground/app/playground/__tests__/build-radiants-contract.test.ts
git commit -m "feat(contract): build generated artifacts from component contract metadata"
```

### Task 4: Migrate The Real Pilot Component Set

**Files:**
- Modify: `packages/radiants/components/core/Separator/Separator.meta.ts`
- Modify: `packages/radiants/components/core/Meter/Meter.meta.ts`
- Modify: `packages/radiants/components/core/Collapsible/Collapsible.meta.ts`
- Modify: `packages/radiants/components/core/Toggle/Toggle.meta.ts`
- Modify: `packages/radiants/components/core/Card/Card.meta.ts`
- Modify: `packages/radiants/registry/__tests__/registry-metadata.test.ts`
- Modify: `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts`
- Modify: `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`

**Step 1: Write the failing tests**

Add explicit real-component assertions to `packages/radiants/registry/__tests__/registry-metadata.test.ts`:

```ts
it("projects pilot contract fields from real component meta files", () => {
  const entries = buildRegistryMetadata();
  const separator = entries.find((entry) => entry.name === "Separator");
  const meter = entries.find((entry) => entry.name === "Meter");
  const collapsible = entries.find((entry) => entry.name === "Collapsible");
  const toggle = entries.find((entry) => entry.name === "Toggle");
  const card = entries.find((entry) => entry.name === "Card");

  expect(separator?.replaces?.map((item) => item.element)).toEqual(["hr"]);
  expect(separator?.wraps).toBe("@base-ui/react/separator");
  expect(meter?.replaces?.map((item) => item.element)).toEqual(["meter", "progress"]);
  expect(collapsible?.replaces?.map((item) => item.element)).toEqual(["details", "summary"]);
  expect(toggle?.a11y).toEqual(
    expect.objectContaining({
      role: "button",
      requiredAttributes: ["aria-pressed"],
    }),
  );
  expect(card?.styleOwnership).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        attribute: "data-variant",
        themeOwned: expect.arrayContaining(["default", "inverted", "raised"]),
      }),
    ]),
  );
});
```

Add matching generated-artifact assertions to `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts` and `manifest-radiants-sync.test.ts`.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts app/playground/__tests__/manifest-radiants-sync.test.ts
```

Expected: FAIL because the pilot `*.meta.ts` files do not yet declare the new contract fields.

**Step 3: Add the pilot metadata**

Update `packages/radiants/components/core/Separator/Separator.meta.ts`:

```ts
replaces: [{ element: "hr", import: "@rdna/radiants/components/core" }],
wraps: "@base-ui/react/separator",
a11y: {
  role: "separator",
  requiredAttributes: ["aria-orientation"],
},
```

Update `packages/radiants/components/core/Meter/Meter.meta.ts`:

```ts
replaces: [
  { element: "meter", import: "@rdna/radiants/components/core" },
  { element: "progress", import: "@rdna/radiants/components/core", note: "Use Meter for progress indicators in v1" },
],
wraps: "@base-ui/react/meter",
a11y: {
  role: "meter",
  contrastRequirement: "AA",
},
```

Update `packages/radiants/components/core/Collapsible/Collapsible.meta.ts`:

```ts
replaces: [
  { element: "details", import: "@rdna/radiants/components/core" },
  { element: "summary", import: "@rdna/radiants/components/core", note: "Use Collapsible.Trigger for the summary surface" },
],
wraps: "@base-ui/react/collapsible",
```

Update `packages/radiants/components/core/Toggle/Toggle.meta.ts`:

```ts
wraps: "@base-ui/react/toggle",
a11y: {
  role: "button",
  requiredAttributes: ["aria-pressed"],
  keyboardInteractions: ["Enter", "Space"],
},
```

Update `packages/radiants/components/core/Card/Card.meta.ts`:

```ts
pixelCorners: true,
shadowSystem: "pixel",
styleOwnership: [
  {
    attribute: "data-variant",
    themeOwned: ["default", "inverted", "raised"],
  },
],
a11y: {
  contrastRequirement: "AA",
},
```

If one of these components exposes awkward contract surfaces, simplify the component source now instead of encoding metadata that describes a known bad API.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts app/playground/__tests__/manifest-radiants-sync.test.ts
pnpm --filter @rdna/playground registry:generate
```

Expected: PASS, and the regenerated contract artifacts include the pilot-derived entries.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Separator/Separator.meta.ts packages/radiants/components/core/Meter/Meter.meta.ts packages/radiants/components/core/Collapsible/Collapsible.meta.ts packages/radiants/components/core/Toggle/Toggle.meta.ts packages/radiants/components/core/Card/Card.meta.ts packages/radiants/registry/__tests__/registry-metadata.test.ts tools/playground/app/playground/__tests__/build-radiants-contract.test.ts tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts packages/radiants/generated/eslint-contract.json packages/radiants/generated/ai-contract.json tools/playground/generated/registry.manifest.json
git commit -m "feat(contract): add pilot component contract metadata"
```

### Task 5: Backfill Remaining Replacement Owners And Drain `system.ts` `componentMap`

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.meta.ts`
- Modify: `packages/radiants/components/core/Input/Input.meta.ts`
- Modify: `packages/radiants/components/core/Input/TextArea.meta.ts`
- Modify: `packages/radiants/components/core/Select/Select.meta.ts`
- Modify: `packages/radiants/components/core/Dialog/Dialog.meta.ts`
- Modify: `packages/radiants/contract/system.ts`
- Modify: `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts`
- Modify: `packages/radiants/generated/eslint-contract.json`
- Modify: `packages/radiants/generated/ai-contract.json`
- Modify: `tools/playground/generated/registry.manifest.json`

**Step 1: Write the failing tests**

Extend `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts` with:

```ts
it("no longer relies on hand-authored componentMap entries in system.ts", async () => {
  expect(Object.keys(radiantsSystemContract.componentMap)).toHaveLength(0);

  const { eslintContract } = await buildRadiantsContracts();
  expect(eslintContract.componentMap.button.component).toBe("Button");
  expect(eslintContract.componentMap.input.component).toBe("Input");
  expect(eslintContract.componentMap.textarea.component).toBe("TextArea");
  expect(eslintContract.componentMap.select.component).toBe("Select");
  expect(eslintContract.componentMap.dialog.component).toBe("Dialog");
  expect(eslintContract.componentMap.label).toBeUndefined();
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
```

Expected: FAIL because `radiantsSystemContract.componentMap` is still hand-authored and the remaining replacement owners have not been backfilled into metadata yet.

**Step 3: Backfill the remaining replacement declarations**

Update:

- `packages/radiants/components/core/Button/Button.meta.ts`
- `packages/radiants/components/core/Input/Input.meta.ts`
- `packages/radiants/components/core/Input/TextArea.meta.ts`
- `packages/radiants/components/core/Select/Select.meta.ts`
- `packages/radiants/components/core/Dialog/Dialog.meta.ts`

Use:

```ts
replaces: [{ element: "button", import: "@rdna/radiants/components/core" }]
replaces: [{ element: "input", import: "@rdna/radiants/components/core", note: "Text-like inputs only in v1" }]
replaces: [{ element: "textarea", import: "@rdna/radiants/components/core" }]
replaces: [{ element: "select", import: "@rdna/radiants/components/core" }]
replaces: [{ element: "dialog", import: "@rdna/radiants/components/core" }]
```

Then reduce `packages/radiants/contract/system.ts` to:

```ts
componentMap: {},
```

Do not add a synthetic `<label>` replacement here. `Label` is deleted, and Phase 2 should leave `label` unmapped until there is a real replacement owner worth enforcing.

Leave `structuralRules` out of Phase 2. Phase 3 will introduce it only once `eslint-contract.json` is carrying rule-facing component metadata.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
pnpm --filter @rdna/playground registry:generate
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
```

Expected: PASS, and the generated artifacts stay complete with an empty system-level `componentMap`.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Button/Button.meta.ts packages/radiants/components/core/Input/Input.meta.ts packages/radiants/components/core/Input/TextArea.meta.ts packages/radiants/components/core/Select/Select.meta.ts packages/radiants/components/core/Dialog/Dialog.meta.ts packages/radiants/contract/system.ts tools/playground/app/playground/__tests__/build-radiants-contract.test.ts packages/radiants/generated/eslint-contract.json packages/radiants/generated/ai-contract.json tools/playground/generated/registry.manifest.json
git commit -m "feat(contract): move replacement ownership into component metadata"
```
