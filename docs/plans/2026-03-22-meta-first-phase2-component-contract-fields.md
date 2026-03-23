# Meta-First Phase 2 Component Contract Fields Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend authored `*.meta.ts` files so component-level contract data lives with the components, then project those fields into registry and generated contract artifacts with a pilot-first rollout.

**Architecture:** Keep `packages/radiants/contract/system.ts` as the system-level baseline for cross-cutting token and motion data, but move component-owned contract facts into `*.meta.ts`. Phase 2 should be allowed to make small component adjustments when that removes awkward metadata one-offs; do not preserve a clumsy component surface just to avoid touching source. The generated outputs should consume the same meta-derived fields for registry, manifest, ESLint contract, and AI contract.

**Tech Stack:** Node 22 ESM, TypeScript metadata files, React 19 components, Vitest, JSON generated artifacts, pnpm workspaces

**Relevant skills:** @test-driven-development, @verification-before-completion, @typescript-advanced-types

---

### Task 1: Extend `ComponentMeta` With Contract V2 Fields And Keep Schema Output Clean

**Files:**
- Modify: `packages/preview/src/types.ts`
- Modify: `packages/preview/src/index.ts`
- Modify: `packages/preview/src/__tests__/component-meta.test.ts`
- Modify: `packages/preview/src/generate-schemas.ts`
- Modify: `packages/preview/src/__tests__/generate-schemas.test.ts`

**Step 1: Write the failing tests**

Extend `packages/preview/src/__tests__/component-meta.test.ts` with:

```ts
it("supports design-contract fields alongside registry metadata", () => {
  const meta = defineComponentMeta<Record<string, unknown>>()({
    name: "Card",
    description: "Card",
    props: {},
    replaces: [{ element: "section", import: "@rdna/radiants/components/core" }],
    pixelCorners: true,
    shadowSystem: "pixel",
    wraps: "@base-ui/react/button",
    styleOwnership: [
      { attribute: "data-variant", themeOwned: ["default", "raised"] },
    ],
    a11y: { contrastRequirement: "AA" },
    structuralRules: [
      { ruleId: "rdna/no-pixel-border", reason: "pixel corners own the border layer" },
    ],
  });

  expect(meta.replaces?.[0]?.element).toBe("section");
  expect(meta.styleOwnership?.[0]?.attribute).toBe("data-variant");
  expect(meta.shadowSystem).toBe("pixel");
});
```

Extend `packages/preview/src/__tests__/generate-schemas.test.ts` so `schema.json` also excludes:

```ts
expect(schema.replaces).toBeUndefined();
expect(schema.pixelCorners).toBeUndefined();
expect(schema.shadowSystem).toBeUndefined();
expect(schema.styleOwnership).toBeUndefined();
expect(schema.wraps).toBeUndefined();
expect(schema.a11y).toBeUndefined();
expect(schema.structuralRules).toBeUndefined();
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/component-meta.test.ts ../preview/src/__tests__/generate-schemas.test.ts --cache=false
```

Expected: FAIL because `ComponentMeta` does not yet accept the new fields and `generate-schemas.ts` does not strip them.

**Step 3: Extend the metadata types and schema stripper**

Update `packages/preview/src/types.ts` with the exact contract types Phase 2 will use:

```ts
export interface ElementReplacement {
  element: string;
  import?: string;
  note?: string;
  qualifier?: string;
}

export interface StructuralRule {
  ruleId: string;
  reason: string;
  mechanism?: string;
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

Then extend `ComponentMeta<TProps>` with:

```ts
replaces?: ElementReplacement[];
pixelCorners?: boolean;
shadowSystem?: "standard" | "pixel";
styleOwnership?: StyleOwnership[];
wraps?: string;
a11y?: A11yContract;
structuralRules?: StructuralRule[];
```

Update `packages/preview/src/index.ts` to export the new types.

Update `packages/preview/src/generate-schemas.ts` so the schema projection drops all contract-only fields:

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
  structuralRules: _structuralRules,
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
git commit -m "feat(preview): add component contract metadata fields"
```

### Task 2: Surface Contract Fields Through Registry Metadata And The Playground Manifest

**Files:**
- Modify: `packages/radiants/registry/types.ts`
- Modify: `packages/radiants/registry/build-registry-metadata.ts`
- Modify: `packages/radiants/registry/__tests__/registry-metadata.test.ts`
- Modify: `tools/playground/scripts/generate-registry.ts`
- Modify: `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`

**Step 1: Write the failing tests**

Extend `packages/radiants/registry/__tests__/registry-metadata.test.ts` with:

```ts
it("surfaces contract metadata when components declare it", () => {
  const entries = buildRegistryMetadata();
  const label = entries.find((entry) => entry.name === "Label");
  const card = entries.find((entry) => entry.name === "Card");

  expect(label?.replaces).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ element: "label" }),
    ]),
  );
  expect(card?.styleOwnership).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        attribute: "data-variant",
        themeOwned: expect.arrayContaining(["default", "raised"]),
      }),
    ]),
  );
});
```

Extend `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts` with:

```ts
it("manifest contract fields match registry metadata for every entry that declares them", () => {
  for (const entry of buildRegistryMetadata()) {
    const hit = getManifestEntry("@rdna/radiants", entry.name);
    if (entry.replaces) expect(hit?.replaces, `${entry.name}: replaces mismatch`).toEqual(entry.replaces);
    if (entry.styleOwnership) expect(hit?.styleOwnership, `${entry.name}: styleOwnership mismatch`).toEqual(entry.styleOwnership);
    if (entry.wraps) expect(hit?.wraps, `${entry.name}: wraps mismatch`).toBe(entry.wraps);
  }
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/manifest-radiants-sync.test.ts
```

Expected: FAIL because registry metadata and the manifest do not yet serialize the new contract fields.

**Step 3: Extend the registry and manifest projections**

Update `packages/radiants/registry/types.ts` so `RegistryMetadataEntry` carries:

```ts
replaces?: ElementReplacement[];
pixelCorners?: boolean;
shadowSystem?: "standard" | "pixel";
styleOwnership?: StyleOwnership[];
wraps?: string;
a11y?: A11yContract;
structuralRules?: StructuralRule[];
```

Update `packages/radiants/registry/build-registry-metadata.ts` to pass those fields through from `data.meta`.

Update `tools/playground/scripts/generate-registry.ts` so `ManifestComponent` includes the same contract fields and `buildRadiantsManifest()` serializes them from `meta`:

```ts
replaces: meta.replaces as ElementReplacement[] | undefined,
pixelCorners: meta.pixelCorners as boolean | undefined,
shadowSystem: meta.shadowSystem as "standard" | "pixel" | undefined,
styleOwnership: meta.styleOwnership as StyleOwnership[] | undefined,
wraps: meta.wraps as string | undefined,
a11y: meta.a11y as A11yContract | undefined,
structuralRules: meta.structuralRules as StructuralRule[] | undefined,
```

Keep the manifest sparse for components that do not declare any of these fields yet; omit absent contract fields instead of inventing placeholders.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/manifest-radiants-sync.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/registry/types.ts packages/radiants/registry/build-registry-metadata.ts packages/radiants/registry/__tests__/registry-metadata.test.ts tools/playground/scripts/generate-registry.ts tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts
git commit -m "feat(registry): project component contract fields"
```

### Task 3: Build Meta-Derived Contract Sections And Add Validation Guardrails

**Files:**
- Create: `tools/playground/scripts/load-radiants-component-contracts.ts`
- Modify: `tools/playground/scripts/build-radiants-contract.ts`
- Modify: `tools/playground/scripts/generate-registry.ts`
- Modify: `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts`

**Step 1: Write the failing tests**

Extend `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts` with:

```ts
import { radiantsSystemContract } from "../../../../../packages/radiants/contract/system.ts";
import { buildRadiantsContractsFromComponents } from "../../../scripts/build-radiants-contract.ts";

it("builds componentMap and component contract entries from meta-derived input", async () => {
  const { eslintContract, aiContract } = await buildRadiantsContractsFromComponents([
    {
      name: "Label",
      sourcePath: "packages/radiants/components/core/Input/Input.tsx",
      replaces: [{ element: "label", import: "@rdna/radiants/components/core" }],
    },
    {
      name: "Card",
      sourcePath: "packages/radiants/components/core/Card/Card.tsx",
      pixelCorners: true,
      shadowSystem: "pixel",
      styleOwnership: [{ attribute: "data-variant", themeOwned: ["default", "raised"] }],
    },
  ]);

  expect(eslintContract.componentMap.label.component).toBe("Label");
  expect(eslintContract.components.Card.pixelCorners).toBe(true);
  expect(eslintContract.themeVariants).toEqual(expect.arrayContaining(["default", "raised"]));
  expect(aiContract.components).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "Label", replaces: ["<label>"] }),
    ]),
  );
});

it("throws when two components claim the same raw element", async () => {
  await expect(
    buildRadiantsContractsFromComponents([
      {
        name: "Label",
        sourcePath: "packages/radiants/components/core/Input/Input.tsx",
        replaces: [{ element: "label", import: "@rdna/radiants/components/core" }],
      },
      {
        name: "FieldLabel",
        sourcePath: "packages/radiants/components/core/Field/Field.tsx",
        replaces: [{ element: "label", import: "@rdna/radiants/components/core" }],
      },
    ]),
  ).rejects.toThrow(/label/);
});

it("throws when a component declares replaces without a resolved sourcePath", async () => {
  await expect(
    buildRadiantsContractsFromComponents([
      {
        name: "GhostLabel",
        sourcePath: null,
        replaces: [{ element: "label", import: "@rdna/radiants/components/core" }],
      },
    ]),
  ).rejects.toThrow(/sourcePath/);
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
```

Expected: FAIL because the builder does not yet accept meta-derived component contract input or validate duplicates and missing source paths.

**Step 3: Refactor the builder around meta-derived component sources**

Create `tools/playground/scripts/load-radiants-component-contracts.ts` that scans the Radiants `*.meta.ts` files once and returns:

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
  structuralRules?: StructuralRule[];
}
```

Update `tools/playground/scripts/build-radiants-contract.ts` to expose a pure helper:

```ts
export async function buildRadiantsContractsFromComponents(
  components: RadiantsContractComponent[],
) {
  // merge meta-derived data into componentMap, components, ai components, and themeVariants
}
```

Add `eslintContract.components` keyed by component name:

```ts
components: {
  Card: {
    pixelCorners: true,
    shadowSystem: "pixel",
    styleOwnership: [{ attribute: "data-variant", themeOwned: ["default", "raised"] }],
  },
}
```

Build `componentMap` from `replaces` declarations, not from hand-maintained component-specific literals.

Aggregate `themeVariants` as:

```ts
const themeVariants = Array.from(
  new Set([
    ...system.themeVariants,
    ...components.flatMap((component) =>
      component.styleOwnership?.flatMap((owner) => owner.themeOwned) ?? [],
    ),
  ]),
);
```

Validation rules:

```ts
if (component.replaces?.length && !component.sourcePath) {
  throw new Error(`Component ${component.name} declares replaces but has no resolved sourcePath`);
}
if (seen.has(replacement.element)) {
  throw new Error(`Duplicate replaces entry for <${replacement.element}> between ${first.name} and ${component.name}`);
}
```

Update `generate-registry.ts` to reuse the new loader instead of re-implementing a second scan.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tools/playground/scripts/load-radiants-component-contracts.ts tools/playground/scripts/build-radiants-contract.ts tools/playground/scripts/generate-registry.ts tools/playground/app/playground/__tests__/build-radiants-contract.test.ts
git commit -m "feat(contract): build component sections from meta fields"
```

### Task 4: Migrate The Pilot Component Set And Allow Small Component Simplifications

**Files:**
- Modify: `packages/radiants/components/core/Input/Label.meta.ts`
- Modify: `packages/radiants/components/core/Separator/Separator.meta.ts`
- Modify: `packages/radiants/components/core/Meter/Meter.meta.ts`
- Modify: `packages/radiants/components/core/Collapsible/Collapsible.meta.ts`
- Modify: `packages/radiants/components/core/Card/Card.meta.ts`
- Modify: `packages/radiants/registry/__tests__/registry-metadata.test.ts`
- Modify: `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts`

**Step 1: Write the failing tests**

Add explicit pilot assertions to `packages/radiants/registry/__tests__/registry-metadata.test.ts`:

```ts
it("projects pilot contract fields from real component meta files", () => {
  const entries = buildRegistryMetadata();
  const label = entries.find((entry) => entry.name === "Label");
  const separator = entries.find((entry) => entry.name === "Separator");
  const meter = entries.find((entry) => entry.name === "Meter");
  const collapsible = entries.find((entry) => entry.name === "Collapsible");
  const card = entries.find((entry) => entry.name === "Card");

  expect(label?.replaces?.map((item) => item.element)).toEqual(["label"]);
  expect(separator?.wraps).toBe("@base-ui/react/separator");
  expect(meter?.replaces?.map((item) => item.element)).toEqual(["meter", "progress"]);
  expect(collapsible?.replaces?.map((item) => item.element)).toEqual(["details", "summary"]);
  expect(card?.styleOwnership).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ attribute: "data-variant" }),
    ]),
  );
});
```

Add corresponding generated-contract assertions to `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts`.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
```

Expected: FAIL because the pilot meta files do not yet declare the new contract fields.

**Step 3: Add the pilot contract metadata**

Update `packages/radiants/components/core/Input/Label.meta.ts`:

```ts
replaces: [{ element: "label", import: "@rdna/radiants/components/core" }],
a11y: {
  contrastRequirement: "AA",
},
```

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
  { element: "progress", import: "@rdna/radiants/components/core", note: "Use Meter for progress indicators" },
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
  { element: "summary", import: "@rdna/radiants/components/core", note: "Use Collapsible.Trigger" },
],
wraps: "@base-ui/react/collapsible",
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

If a pilot component still exposes an attribute surface that makes the metadata obviously awkward, simplify the component now instead of encoding a one-off contract exception.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
pnpm --filter @rdna/playground registry:generate
```

Expected: PASS, and the regenerated contract artifacts include pilot-derived entries.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Input/Label.meta.ts packages/radiants/components/core/Separator/Separator.meta.ts packages/radiants/components/core/Meter/Meter.meta.ts packages/radiants/components/core/Collapsible/Collapsible.meta.ts packages/radiants/components/core/Card/Card.meta.ts packages/radiants/registry/__tests__/registry-metadata.test.ts tools/playground/app/playground/__tests__/build-radiants-contract.test.ts packages/radiants/generated/eslint-contract.json packages/radiants/generated/ai-contract.json tools/playground/generated/registry.manifest.json
git commit -m "feat(contract): add pilot component contract metadata"
```

### Task 5: Backfill Legacy Replacement Components And Drain `system.ts` `componentMap`

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

**Step 1: Write the failing tests**

Extend `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts` with:

```ts
it("no longer relies on hand-authored componentMap entries in system.ts", async () => {
  expect(Object.keys(radiantsSystemContract.componentMap)).toHaveLength(0);

  const { eslintContract } = await buildRadiantsContracts();
  expect(eslintContract.componentMap.button.component).toBe("Button");
  expect(eslintContract.componentMap.input.component).toBe("Input");
  expect(eslintContract.componentMap.select.component).toBe("Select");
  expect(eslintContract.componentMap.textarea.component).toBe("Input");
  expect(eslintContract.componentMap.dialog.component).toBe("Dialog");
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
```

Expected: FAIL because `radiantsSystemContract.componentMap` is still hand-authored and the remaining meta files do not yet declare `replaces`.

**Step 3: Backfill the remaining replacement owners**

Update:

- `packages/radiants/components/core/Button/Button.meta.ts`
- `packages/radiants/components/core/Input/Input.meta.ts`
- `packages/radiants/components/core/Input/TextArea.meta.ts`
- `packages/radiants/components/core/Select/Select.meta.ts`
- `packages/radiants/components/core/Dialog/Dialog.meta.ts`

Use:

```ts
replaces: [{ element: "button", import: "@rdna/radiants/components/core" }]
replaces: [{ element: "input", import: "@rdna/radiants/components/core", note: "Only enforce for text-like input types in v1" }]
replaces: [{ element: "textarea", import: "@rdna/radiants/components/core", note: "Use Input with multiline" }]
replaces: [{ element: "select", import: "@rdna/radiants/components/core" }]
replaces: [{ element: "dialog", import: "@rdna/radiants/components/core" }]
```

Then reduce `packages/radiants/contract/system.ts` to:

```ts
componentMap: {},
```

Do not drain `themeVariants` yet. Phase 2 only removes component-owned replacement data from `system.ts`; theme variant cleanup waits for broader `styleOwnership` coverage.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
pnpm --filter @rdna/playground registry:generate
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
```

Expected: PASS, and the generated contract artifacts stay complete with an empty system-level `componentMap`.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Button/Button.meta.ts packages/radiants/components/core/Input/Input.meta.ts packages/radiants/components/core/Input/TextArea.meta.ts packages/radiants/components/core/Select/Select.meta.ts packages/radiants/components/core/Dialog/Dialog.meta.ts packages/radiants/contract/system.ts tools/playground/app/playground/__tests__/build-radiants-contract.test.ts packages/radiants/generated/eslint-contract.json packages/radiants/generated/ai-contract.json tools/playground/generated/registry.manifest.json
git commit -m "feat(contract): move replacement map ownership into component meta"
```
