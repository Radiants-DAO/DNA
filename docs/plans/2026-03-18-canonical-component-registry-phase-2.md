# Canonical Component Registry Clean-Slate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make co-located `*.meta.ts` files the authored source of truth for Radiants component metadata, then generate every registry and playground projection from that source while keeping runtime component/demo wiring separate.

**Architecture:** This plan assumes the metadata shape is no longer constrained by legacy tooling packages. Radiants metadata is authored once in component-local `*.meta.ts`; `schema.json`, `dna.json`, `schemas/index.ts`, and the playground manifest become generated projections. The runtime registry remains a separate projection that attaches React component refs and custom Demo components to canonical metadata.

**Tech Stack:** TypeScript, React 19, Vitest, Next.js App Router, Node ESM scripts, pnpm workspaces, existing `@rdna/preview` package

**Worktree:** Create with `git worktree add .claude/worktrees/canonical-registry-clean-slate -b feat/canonical-component-registry-clean-slate` from repo root.

---

## Success Criteria

By the end of this plan:

1. Radiants authored component metadata lives in co-located `*.meta.ts` files.
2. `buildRegistryMetadata()` reads canonical metadata from generated meta imports, not from handwritten central registry metadata files.
3. `buildRegistry()` is a pure projection of canonical metadata plus runtime attachments.
4. Playground no longer owns handwritten prop docs, prop overrides, or consumer-side category inference.
5. Playground manifest generation serializes the same canonical Radiants metadata used by the shared registry.
6. `*.schema.json`, `*.dna.json`, and `packages/radiants/schemas/index.ts` are generated artifacts, not authored truth.
7. CI fails if generated artifacts or the playground manifest drift from source.

## Current Problems To Eliminate

- `tools/playground/app/playground/registry.overrides.ts` hand-authors `propsInterface`, which has drifted from real component APIs.
- `packages/radiants/registry/build-registry.ts` and `tools/playground/scripts/generate-registry.mjs` assemble overlapping metadata through separate paths.
- `packages/radiants/registry/component-display-meta.ts` and temporary path glue in `packages/radiants/registry/component-paths.ts` still own metadata facts that should ultimately live next to the components.
- `packages/radiants/components/core/Button/Button.meta.ts` and `packages/radiants/components/core/Card/Card.meta.ts` exist, but they are not yet the canonical authored source and already drift from shipped code.
- `packages/radiants/components/core/**/*.schema.json` and `packages/radiants/components/core/**/*.dna.json` are still effectively hand-maintained files, so they drift from the component implementation.

## Target Model

- one authored source:
  - `packages/radiants/components/core/**/Component.meta.ts`
- generated projections:
  - `Component.schema.json`
  - `Component.dna.json`
  - `packages/radiants/schemas/index.ts`
  - `tools/playground/generated/registry.manifest.json`
- one canonical metadata builder:
  - `buildRegistryMetadata()`
- one runtime attachment layer:
  - component refs
  - custom `Demo` components
- one runtime projection:
  - `buildRegistry() = buildRegistryMetadata() + runtimeAttachments`

Important rule:

- authored metadata belongs in `*.meta.ts`
- generated JSON belongs to scripts
- executable React demo code belongs in runtime attachments
- consumers do not invent categories, prop docs, or defaults

---

## Phase 1: Remove Drift Vectors And Establish Canonical Inputs

### Task 1: Remove handwritten playground prop descriptions and local prop metadata overrides

**Files:**
- Modify: `tools/playground/app/playground/types.ts`
- Modify: `tools/playground/app/playground/registry.tsx`
- Delete: `tools/playground/app/playground/registry.overrides.ts`
- Modify: `tools/playground/app/playground/prompts/iteration.prompt.ts`
- Modify: `tools/playground/app/playground/prompts/__tests__/iteration-prompt.test.ts`
- Create: `tools/playground/app/playground/__tests__/registry-contract.test.ts`

**Step 1: Write the failing test**

Create `tools/playground/app/playground/__tests__/registry-contract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { registry } from "../registry";

describe("registry contract", () => {
  it("does not expose handwritten propsInterface strings", () => {
    for (const entry of registry) {
      expect("propsInterface" in entry).toBe(false);
    }
  });
});
```

Update `tools/playground/app/playground/prompts/__tests__/iteration-prompt.test.ts` to assert the prompt still includes the schema section but no `Props Interface` section.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/registry-contract.test.ts app/playground/prompts/__tests__/iteration-prompt.test.ts --cache=false
```

Expected:
- FAIL because `propsInterface` still exists in the registry types and overrides.

**Step 3: Remove `propsInterface` and delete the override file**

- remove `propsInterface?: string` from `RegistryEntry` in `tools/playground/app/playground/types.ts`
- delete `tools/playground/app/playground/registry.overrides.ts`
- remove all `propsInterface` plumbing from `tools/playground/app/playground/registry.tsx`
- remove `propsInterface` from `IterationPromptOptions` and the prompt template in `tools/playground/app/playground/prompts/iteration.prompt.ts`

The prompt should keep:
- source file
- schema JSON
- design doc
- custom instructions

It should not invent a second prop contract.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/registry-contract.test.ts app/playground/prompts/__tests__/iteration-prompt.test.ts --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add tools/playground/app/playground/types.ts tools/playground/app/playground/registry.tsx tools/playground/app/playground/prompts/iteration.prompt.ts tools/playground/app/playground/prompts/__tests__/iteration-prompt.test.ts tools/playground/app/playground/__tests__/registry-contract.test.ts
git rm tools/playground/app/playground/registry.overrides.ts
git commit -m "refactor(playground): remove handwritten prop metadata overrides"
```

### Task 2: Expand `@rdna/preview` metadata types so `*.meta.ts` can own the full authored truth

**Files:**
- Modify: `packages/preview/src/types.ts`
- Modify: `packages/preview/src/index.ts`
- Create: `packages/preview/src/define-component-meta.ts`
- Create: `packages/preview/src/__tests__/component-meta.test.ts`

**Step 1: Write the failing test**

Create `packages/preview/src/__tests__/component-meta.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { defineComponentMeta } from "../define-component-meta";

describe("defineComponentMeta", () => {
  it("supports registry metadata alongside schema and dna fields", () => {
    const meta = defineComponentMeta<Record<string, unknown>>()({
      name: "Badge",
      description: "Badge",
      props: {},
      registry: { category: "feedback" },
    });

    expect(meta.registry?.category).toBe("feedback");
  });

  it("supports forced state declarations and typed example props", () => {
    const meta = defineComponentMeta<{ mode?: "solid"; disabled?: boolean }>()({
      name: "Button",
      description: "Button",
      props: {},
      registry: {
        category: "action",
        states: ["hover", "pressed", "focus"],
        exampleProps: { mode: "solid", disabled: false },
      },
    });

    expect(meta.registry?.states).toContain("hover");
    expect(meta.registry?.exampleProps?.mode).toBe("solid");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/component-meta.test.ts --cache=false
```

Expected:
- FAIL because the type surface and helper do not exist yet.

**Step 3: Extend the type model**

Update `packages/preview/src/types.ts` so `ComponentMeta` can own:
- schema fields:
  - `name`
  - `description`
  - `props`
  - `slots`
  - `examples`
  - `tokenBindings`
- registry fields:
  - `category`
  - `tags`
  - `renderMode`
  - `exclude`
  - `exampleProps`
  - `variants`
  - `controlledProps`
  - `states`

Recommended shape:

```ts
export type ForcedState = "hover" | "pressed" | "focus" | "disabled" | "error";

export interface RegistryVariant<TProps> {
  label: string;
  props: Partial<TProps>;
}

export interface RegistryMeta<TProps> {
  category: ComponentCategory;
  tags?: string[];
  renderMode?: "inline" | "custom" | "description-only";
  exclude?: boolean;
  exampleProps?: Partial<TProps>;
  variants?: RegistryVariant<TProps>[];
  controlledProps?: Array<keyof TProps & string>;
  states?: ForcedState[];
}

export interface ComponentMeta<TProps = Record<string, unknown>> {
  name: string;
  description: string;
  props: Record<string, PropDef>;
  slots?: Record<string, SlotDef>;
  tokenBindings?: Record<string, Record<string, string>>;
  examples?: Array<{ name: string; code: string }>;
  registry?: RegistryMeta<TProps>;
}
```

Add `packages/preview/src/define-component-meta.ts`:

```ts
import type { ComponentMeta } from "./types";

export function defineComponentMeta<TProps>() {
  return <TMeta extends ComponentMeta<TProps>>(meta: TMeta) => meta;
}
```

Re-export the new types and helper from `packages/preview/src/index.ts`.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/component-meta.test.ts --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/preview/src/types.ts packages/preview/src/index.ts packages/preview/src/define-component-meta.ts packages/preview/src/__tests__/component-meta.test.ts
git commit -m "feat(preview): support canonical component metadata in meta files"
```

### Task 3: Upgrade the generator so `*.meta.ts` produces all metadata projections

**Files:**
- Modify: `packages/preview/src/generate-schemas.ts`
- Create: `packages/preview/src/__tests__/generate-schemas.test.ts`
- Modify: `packages/radiants/package.json`
- Create: `packages/radiants/meta/index.ts`

**Step 1: Write the failing test**

Create `packages/preview/src/__tests__/generate-schemas.test.ts` with a fixture-backed test that asserts the generator:
- finds all `*.meta.ts` files in a component directory
- writes a matching `*.schema.json` file for each
- writes a matching `*.dna.json` file when `tokenBindings` exists
- writes a generated Radiants meta barrel

Minimal test shape:

```ts
import { describe, expect, it } from "vitest";

describe("generate-schemas", () => {
  it("finds all *.meta.ts files and emits every projection", () => {
    expect(true).toBe(true); // replace with fixture-backed assertions
  });
});
```

Use a fixture directory containing:
- `Input.meta.ts`
- `Label.meta.ts`
- `TextArea.meta.ts`

The assertions should verify generation of:
- `Input.schema.json`
- `Label.schema.json`
- `TextArea.schema.json`
- `packages/radiants/meta/index.ts`-style barrel content

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/generate-schemas.test.ts --cache=false
```

Expected:
- FAIL because the current generator only looks for `${dir.name}.meta.ts` and does not emit a generated meta barrel.

**Step 3: Rewrite the generator**

Update `packages/preview/src/generate-schemas.ts` to:
- scan each component directory for all `*.meta.ts` files
- import each meta file
- find the exported `ComponentMeta`
- emit `*.schema.json`
- emit `*.dna.json`
- emit `packages/radiants/meta/index.ts` that imports and re-exports canonical component meta records with:
  - `meta`
  - `sourcePath`
  - `schemaPath`
  - `dnaPath`

Target generated barrel shape:

```ts
import { ButtonMeta } from "../components/core/Button/Button.meta";

export const componentMetaIndex = {
  Button: {
    meta: ButtonMeta,
    sourcePath: "packages/radiants/components/core/Button/Button.tsx",
    schemaPath: "packages/radiants/components/core/Button/Button.schema.json",
    dnaPath: "packages/radiants/components/core/Button/Button.dna.json",
  },
} as const;
```

Keep the script name in `packages/radiants/package.json` as:

```json
{
  "scripts": {
    "generate:schemas": "tsx ../preview/src/generate-schemas.ts ./components/core"
  }
}
```

That script now generates all projections, not just schema JSON.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/generate-schemas.test.ts --cache=false
```

Expected:
- PASS

**Step 5: Run the generator**

Run:

```bash
pnpm --filter @rdna/radiants generate:schemas
```

Expected:
- `packages/radiants/meta/index.ts` is generated
- existing `*.schema.json` / `*.dna.json` files are regenerated where matching `*.meta.ts` exists

**Step 6: Commit**

```bash
git add packages/preview/src/generate-schemas.ts packages/preview/src/__tests__/generate-schemas.test.ts packages/radiants/package.json packages/radiants/meta/index.ts
git commit -m "feat(preview): generate schema, dna, and radiants meta projections"
```

---

## Phase 2: Build The Canonical Registry Around Generated Meta

### Task 4: Introduce `buildRegistryMetadata()` over canonical meta with temporary fallback to existing central metadata

**Files:**
- Create: `packages/radiants/registry/build-registry-metadata.ts`
- Modify: `packages/radiants/registry/types.ts`
- Create: `packages/radiants/registry/__tests__/registry-metadata.test.ts`
- Modify: `packages/radiants/registry/build-registry.ts`

**Step 1: Write the failing test**

Create `packages/radiants/registry/__tests__/registry-metadata.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "../build-registry-metadata";

describe("buildRegistryMetadata", () => {
  it("returns only server-safe metadata", () => {
    const entries = buildRegistryMetadata();
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(entry.name).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.sourcePath).toMatch(/^packages\/radiants\//);
      expect("component" in entry).toBe(false);
      expect("Demo" in entry).toBe(false);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry-metadata.test.ts --cache=false
```

Expected:
- FAIL because `build-registry-metadata.ts` does not exist.

**Step 3: Define the metadata contract**

Update `packages/radiants/registry/types.ts` with an explicit split:

```ts
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
}

export interface RuntimeAttachment {
  component?: ComponentType<any>;
  Demo?: ComponentType;
}

export interface RegistryEntry extends RegistryMetadataEntry, RuntimeAttachment {}
```

**Step 4: Implement `buildRegistryMetadata()`**

Create `packages/radiants/registry/build-registry-metadata.ts` with this precedence:

1. prefer generated entries from `packages/radiants/meta/index.ts`
2. fall back temporarily to existing `component-display-meta.ts` + `component-paths.ts` + JSON-based schema data for unmigrated components

This fallback is temporary rollout glue. Do not create new central metadata files.

The builder should:
- use `meta.registry.category` when available
- use `meta.registry.renderMode` when available
- use `meta.registry.exampleProps`, `variants`, `controlledProps`, `tags`, and `states` when available
- fall back to the existing central files only for components that do not yet have canonical meta

**Step 5: Update `build-registry.ts` to read from canonical metadata**

Change `packages/radiants/registry/build-registry.ts` so it stops assembling metadata itself and becomes a projection over `buildRegistryMetadata()`.

At this stage, it may still attach components through the existing map until runtime attachments are split in the next task.

**Step 6: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry-metadata.test.ts registry/__tests__/registry.test.ts --cache=false
```

Expected:
- PASS

**Step 7: Commit**

```bash
git add packages/radiants/registry/types.ts packages/radiants/registry/build-registry-metadata.ts packages/radiants/registry/build-registry.ts packages/radiants/registry/__tests__/registry-metadata.test.ts packages/radiants/registry/__tests__/registry.test.ts
git commit -m "refactor(registry): add canonical registry metadata builder"
```

### Task 5: Split runtime attachments from canonical metadata

**Files:**
- Create: `packages/radiants/registry/runtime-attachments.tsx`
- Create: `packages/radiants/registry/component-paths.ts`
- Modify: `packages/radiants/registry/build-registry.ts`
- Modify: `packages/radiants/registry/index.ts`
- Modify: `packages/radiants/registry/__tests__/registry.test.ts`
- Create: `packages/radiants/registry/__tests__/runtime-coverage.test.ts`
- Delete: `packages/radiants/registry/component-map.ts`

**Step 1: Write the failing tests**

Extend `packages/radiants/registry/__tests__/registry.test.ts` with:

```ts
import { buildRegistryMetadata } from "../build-registry-metadata";
import { registry } from "../index";

it("runtime registry preserves metadata ordering and identity", () => {
  const metadata = buildRegistryMetadata();
  expect(registry.map((e) => e.name)).toEqual(metadata.map((e) => e.name));
});
```

Create `packages/radiants/registry/__tests__/runtime-coverage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "../build-registry-metadata";
import { runtimeAttachments } from "../runtime-attachments";

describe("runtime coverage", () => {
  it("every metadata entry has runtime wiring or is description-only", () => {
    for (const entry of buildRegistryMetadata()) {
      const attachment = runtimeAttachments[entry.name];
      if (entry.renderMode === "description-only") continue;
      expect(attachment?.component || attachment?.Demo).toBeTruthy();
    }
  });
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry.test.ts registry/__tests__/runtime-coverage.test.ts --cache=false
```

Expected:
- FAIL until `runtime-attachments.tsx` exists and `buildRegistry()` uses it.

**Step 3: Create the runtime attachment file**

Move component refs and custom `Demo` components into `packages/radiants/registry/runtime-attachments.tsx`.

Rules:
- keep executable React showcase code here
- keep only runtime wiring here
- do not move categories, tags, example props, or default metadata into this file

Target shape:

```tsx
import * as core from "../components/core";
import type { RuntimeAttachment } from "./types";

export const runtimeAttachments: Record<string, RuntimeAttachment> = {
  Button: { component: core.Button },
  Badge: { component: core.Badge },
  Dialog: { component: core.Dialog, Demo: DialogDemo },
};
```

Also create `packages/radiants/registry/component-paths.ts` as temporary migration glue.

Rules for `component-paths.ts`:
- path-only data only
- no categories
- no tags
- no render mode
- no example props
- no runtime refs

Target shape:

```ts
export const componentPaths = {
  Button: {
    sourcePath: "packages/radiants/components/core/Button/Button.tsx",
    schemaPath: "packages/radiants/components/core/Button/Button.schema.json",
  },
} as const;
```

This file exists only to bridge unmigrated components until generated canonical meta owns paths for every entry. It must be deleted in the rollout cleanup task.

**Step 4: Rewrite `buildRegistry()`**

Update `packages/radiants/registry/build-registry.ts`:

```ts
import { buildRegistryMetadata } from "./build-registry-metadata";
import { runtimeAttachments } from "./runtime-attachments";

export function buildRegistry(): RegistryEntry[] {
  return buildRegistryMetadata().map((entry) => ({
    ...entry,
    ...runtimeAttachments[entry.name],
  }));
}
```

**Step 5: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry.test.ts registry/__tests__/runtime-coverage.test.ts registry/__tests__/registry-metadata.test.ts --cache=false
```

Expected:
- PASS

**Step 6: Commit**

```bash
git add packages/radiants/registry/runtime-attachments.tsx packages/radiants/registry/component-paths.ts packages/radiants/registry/build-registry.ts packages/radiants/registry/index.ts packages/radiants/registry/__tests__/registry.test.ts packages/radiants/registry/__tests__/runtime-coverage.test.ts
git rm packages/radiants/registry/component-map.ts
git commit -m "refactor(registry): separate runtime attachments from canonical metadata"
```

### Task 6: Make playground manifest generation consume canonical Radiants metadata

**Files:**
- Modify: `tools/playground/scripts/generate-registry.mjs`
- Modify: `tools/playground/generated/registry.ts`
- Modify: `tools/playground/app/playground/registry.server.ts`
- Modify: `tools/playground/app/playground/registry.tsx`
- Modify: `tools/playground/app/playground/__tests__/registry.test.ts`
- Create: `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`

**Step 1: Write the failing tests**

Create `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { registry as radiantsRegistry } from "@rdna/radiants/registry";
import { getManifestEntryBySourcePath } from "../../../generated/registry";

describe("radiants manifest sync", () => {
  it("every shared Radiants entry resolves manifest metadata by sourcePath", () => {
    for (const entry of radiantsRegistry) {
      const hit = getManifestEntryBySourcePath(entry.sourcePath);
      expect(hit?.component.name).toBe(entry.name);
    }
  });
});
```

Update `tools/playground/app/playground/__tests__/registry.test.ts` to stop asserting stale Button `variant` metadata and instead assert:
- `manifestProps.mode` exists
- `manifestProps.tone` exists
- `manifestProps.disabled` is boolean

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/manifest-radiants-sync.test.ts app/playground/__tests__/registry.test.ts --cache=false
```

Expected:
- FAIL until the manifest generator emits canonical Radiants metadata.

**Step 3: Rewrite the manifest generator**

In `tools/playground/scripts/generate-registry.mjs`:
- import `buildRegistryMetadata()` from `@rdna/radiants/registry/build-registry-metadata`
- use it for `@rdna/radiants` instead of rescanning `packages/radiants/components/core`
- emit:
  - `category`
  - `group`
  - `renderMode`
  - `tags`
  - `exampleProps`
  - `controlledProps`
  - `states`
  - schema-derived `props`, `slots`, `examples`
  - dna-derived `tokenBindings`

For now, keep generic scanning only if it is still needed for a non-Radiants package already used by playground. Do not treat generic package scanning as part of the canonical success path.

**Step 4: Simplify the client adapter**

In `tools/playground/app/playground/registry.tsx`:
- delete `inferCategory()`
- stop inventing default props or category labels in the client
- use manifest-driven `group`, `renderMode`, `controlledProps`, `states`, and `exampleProps`
- keep only minimal runtime attachment logic:
  - shared Radiants runtime registry entry attaches `Component`
  - manifest-only entries remain `Component: null`

**Step 5: Update the typed manifest helpers**

Extend `tools/playground/generated/registry.ts` and `tools/playground/app/playground/registry.server.ts` to include:
- `category?: string`
- `group?: string`
- `renderMode?: "inline" | "custom" | "description-only"`
- `tags?: string[]`
- `exampleProps?: Record<string, unknown>`
- `controlledProps?: string[]`
- `states?: string[]`

**Step 6: Regenerate the manifest**

Run:

```bash
pnpm --filter @rdna/playground registry:generate
```

Expected:
- `tools/playground/generated/registry.manifest.json` updates
- Radiants entries reflect canonical metadata from the shared builder

**Step 7: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/manifest-radiants-sync.test.ts app/playground/__tests__/registry.test.ts app/playground/__tests__/registry-contract.test.ts --cache=false
```

Expected:
- PASS

**Step 8: Commit**

```bash
git add tools/playground/scripts/generate-registry.mjs tools/playground/generated/registry.ts tools/playground/generated/registry.manifest.json tools/playground/app/playground/registry.server.ts tools/playground/app/playground/registry.tsx tools/playground/app/playground/__tests__/registry.test.ts tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts
git commit -m "refactor(playground): generate radiants manifest from canonical metadata"
```

---

## Phase 3: Pilot And Roll Out Co-Located Metadata

### Task 7: Pilot migrate `Button` and `Badge` to typed co-located metadata

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.tsx`
- Modify: `packages/radiants/components/core/Button/Button.meta.ts`
- Create: `packages/radiants/components/core/Badge/Badge.meta.ts`
- Modify: `packages/radiants/components/core/Button/Button.schema.json`
- Modify: `packages/radiants/components/core/Button/Button.dna.json`
- Modify: `packages/radiants/components/core/Badge/Badge.schema.json`
- Modify: `packages/radiants/components/core/Badge/Badge.dna.json`
- Modify: `packages/radiants/meta/index.ts`
- Modify: `packages/radiants/registry/build-registry-metadata.ts`
- Create: `packages/radiants/registry/__tests__/meta-pilot.test.ts`

**Step 1: Write the failing test**

Create `packages/radiants/registry/__tests__/meta-pilot.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "../build-registry-metadata";

describe("meta pilot", () => {
  it("reads registry facts for Button and Badge from co-located meta files", () => {
    const entries = buildRegistryMetadata();
    expect(entries.find((e) => e.name === "Button")?.category).toBe("action");
    expect(entries.find((e) => e.name === "Badge")?.category).toBe("feedback");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/meta-pilot.test.ts --cache=false
```

Expected:
- FAIL until the builder prefers canonical meta for the pilot components.

**Step 3: Reconcile and author the pilot meta files**

Important:
- rewrite `Button.meta.ts` to match the shipped Button API exactly
- create `Badge.meta.ts` to match the shipped Badge API exactly
- export reusable enum arrays from `Button.tsx` where that removes duplicated literals from the meta file

For Button specifically:
- export constants such as `BUTTON_MODES`, `BUTTON_TONES`, `BUTTON_SIZES`, `BUTTON_ROUNDED`
- derive the component union types from those constants where practical
- import those constants into `Button.meta.ts`

This keeps the component implementation and meta file on the same literal source.

**Step 4: Teach the metadata builder to prefer pilot meta**

Update `buildRegistryMetadata()` so migrated components read from `packages/radiants/meta/index.ts` first and only fall back to existing central metadata for unmigrated components.

**Step 5: Regenerate artifacts**

Run:

```bash
pnpm --filter @rdna/radiants generate:schemas
pnpm --filter @rdna/playground registry:generate
```

Expected:
- `Button.schema.json`, `Button.dna.json`, `Badge.schema.json`, `Badge.dna.json` regenerate from the pilot meta files
- the playground manifest reflects the canonical pilot metadata

**Step 6: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/meta-pilot.test.ts registry/__tests__/registry-metadata.test.ts registry/__tests__/registry.test.ts --cache=false
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/registry.test.ts app/playground/__tests__/manifest-radiants-sync.test.ts --cache=false
```

Expected:
- PASS

**Step 7: Commit**

```bash
git add packages/radiants/components/core/Button/Button.tsx packages/radiants/components/core/Button/Button.meta.ts packages/radiants/components/core/Badge/Badge.meta.ts packages/radiants/components/core/Button/Button.schema.json packages/radiants/components/core/Button/Button.dna.json packages/radiants/components/core/Badge/Badge.schema.json packages/radiants/components/core/Badge/Badge.dna.json packages/radiants/meta/index.ts packages/radiants/registry/build-registry-metadata.ts packages/radiants/registry/__tests__/meta-pilot.test.ts
git commit -m "feat(registry): pilot canonical co-located metadata for button and badge"
```

### Task 8: Batch-migrate the remaining Radiants components to `*.meta.ts`

**Files:**
- Create/Modify: `packages/radiants/components/core/**/*/*.meta.ts`
- Modify: `packages/radiants/components/core/**/*.schema.json`
- Modify: `packages/radiants/components/core/**/*.dna.json`
- Modify: `packages/radiants/meta/index.ts`
- Modify: `packages/radiants/registry/build-registry-metadata.ts`
- Modify: `packages/radiants/registry/component-paths.ts`
- Create: `packages/radiants/registry/__tests__/meta-rollout.test.ts`

**Batch order:**
- Batch A: `Alert`, `Avatar`, `Breadcrumbs`, `Button`, `Badge`, `Card`, `Divider`, `Pattern`, `Spinner`, `Tooltip`
- Batch B: `Input`, `Label`, `TextArea`, `Checkbox`, `Radio`, `RadioGroup`, `Select`, `Slider`, `Switch`, `Field`, `Fieldset`, `NumberField`, `Combobox`
- Batch C: `Tabs`, `Menubar`, `NavigationMenu`, `ContextMenu`, `DropdownMenu`, `Dialog`, `AlertDialog`, `Drawer`, `Sheet`, `Popover`, `PreviewCard`, `HelpPanel`, `ScrollArea`, `Collapsible`, `CountdownTimer`, `Meter`, `Web3ActionBar`, `Toast`, `Toggle`, `ToggleGroup`, `Toolbar`, `Separator`, `MockStatesPopover`

**Step 1: Write the failing rollout test**

Create `packages/radiants/registry/__tests__/meta-rollout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "../build-registry-metadata";

describe("meta rollout", () => {
  it("does not require central metadata once all components are migrated", () => {
    const entries = buildRegistryMetadata();
    expect(entries.length).toBeGreaterThan(20);
  });
});
```

Also assert:
- every non-excluded component has a `*.meta.ts`
- central fallback files are no longer consulted once rollout is complete
- `component-paths.ts` shrinks monotonically as batches migrate

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/meta-rollout.test.ts --cache=false
```

Expected:
- FAIL until the migration is complete.

**Step 3: Migrate each batch**

For each component:

1. create or update `*.meta.ts`
2. move category, tags, render mode, example props, controlled props, variants, and states into `registry`
3. keep executable `Demo` components in `runtime-attachments.tsx`
4. run `pnpm --filter @rdna/radiants generate:schemas`
5. delete that component's entry from `packages/radiants/registry/component-paths.ts` once canonical meta provides the paths
6. run `pnpm --filter @rdna/playground registry:generate`
7. run targeted tests
8. commit the batch

Batch verification command set:

```bash
pnpm --filter @rdna/radiants generate:schemas
pnpm --filter @rdna/playground registry:generate
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry.test.ts registry/__tests__/registry-metadata.test.ts registry/__tests__/runtime-coverage.test.ts registry/__tests__/meta-rollout.test.ts --cache=false
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/registry.test.ts app/playground/__tests__/manifest-radiants-sync.test.ts --cache=false
```

Expected:
- PASS after each batch

**Step 4: Commit after each batch**

Example:

```bash
git add packages/radiants/components/core packages/radiants/meta/index.ts packages/radiants/registry/build-registry-metadata.ts packages/radiants/registry/component-paths.ts packages/radiants/registry/__tests__/meta-rollout.test.ts
git commit -m "feat(registry): migrate canonical metadata batch a"
```

Repeat for batches B and C.

### Task 9: Remove the old central metadata fallbacks and move forced-state metadata into canonical sources

**Files:**
- Delete: `packages/radiants/registry/component-display-meta.ts`
- Delete: `packages/radiants/registry/component-paths.ts`
- Modify: `packages/radiants/registry/build-registry-metadata.ts`
- Delete: `tools/playground/app/playground/state-sets.ts`
- Modify: `tools/playground/app/playground/nodes/ComponentCard.tsx`
- Modify: `tools/playground/generated/registry.ts`
- Modify: `tools/playground/generated/registry.manifest.json`
- Modify: `packages/radiants/base.css`
- Modify: `tools/playground/app/playground/forced-states.css`

**Step 1: Write the failing tests**

Extend `packages/radiants/registry/__tests__/meta-rollout.test.ts` to assert:
- `component-display-meta.ts` is no longer imported by `build-registry-metadata.ts`
- `component-paths.ts` is no longer imported by `build-registry-metadata.ts`
- every metadata entry gets category, render mode, and example props from canonical meta

Add a playground assertion that forced states come from manifest metadata instead of `state-sets.ts`.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/meta-rollout.test.ts --cache=false
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/registry.test.ts --cache=false
```

Expected:
- FAIL until the fallback files are removed and state data is manifest-driven.

**Step 3: Remove the old central metadata path**

After all batches are migrated:
- delete `packages/radiants/registry/component-display-meta.ts`
- delete `packages/radiants/registry/component-paths.ts`
- update `build-registry-metadata.ts` to source metadata only from generated canonical meta imports

At this point, the old central metadata path should be gone.

Rollout cleanup definition:
- no fallback imports remain in `build-registry-metadata.ts`
- no entries remain in `component-paths.ts`
- `component-paths.ts` is deleted entirely
- generated `packages/radiants/meta/index.ts` is the only path source for migrated components
- `component-display-meta.ts` is deleted entirely

**Step 4: Delete `state-sets.ts` and derive states from manifest**

Once all components have `registry.states` in their meta:
- delete `tools/playground/app/playground/state-sets.ts`
- update `tools/playground/app/playground/nodes/ComponentCard.tsx` to read `entry.states`
- ensure `tools/playground/generated/registry.ts` exposes `states?: string[]`
- ensure the manifest generator serializes `states`

**Step 5: Move button forced-state selectors into the real CSS**

`tools/playground/app/playground/forced-states.css` mirrors real component behavior and will drift.

Extend `packages/radiants/base.css` so interactive selectors also respond to playground-forced state attributes. Example pattern:

```css
[data-slot="button-root"]:not([data-mode="text"]):not([data-mode="pattern"]):not([data-mode="flat"]):hover,
[data-force-state="hover"] [data-slot="button-root"]:not([data-mode="text"]):not([data-mode="pattern"]):not([data-mode="flat"]) {
  transform: translateY(-1px);
}
```

Remove the duplicated button-specific rules from `forced-states.css`. Keep only generic playground-only rules if they still add value.

**Step 6: Regenerate artifacts and run tests**

Run:

```bash
pnpm --filter @rdna/radiants generate:schemas
pnpm --filter @rdna/playground registry:generate
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/meta-rollout.test.ts registry/__tests__/registry.test.ts registry/__tests__/runtime-coverage.test.ts --cache=false
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/registry.test.ts app/playground/__tests__/manifest-radiants-sync.test.ts --cache=false
```

Expected:
- PASS

**Step 7: Commit**

```bash
git add packages/radiants/registry/build-registry-metadata.ts packages/radiants/registry/__tests__/meta-rollout.test.ts packages/radiants/base.css tools/playground/app/playground/nodes/ComponentCard.tsx tools/playground/generated/registry.ts tools/playground/generated/registry.manifest.json tools/playground/app/playground/forced-states.css
git rm packages/radiants/registry/component-display-meta.ts
git rm packages/radiants/registry/component-paths.ts
git rm tools/playground/app/playground/state-sets.ts
git commit -m "refactor(registry): remove central metadata fallbacks and derive states canonically"
```

---

## Phase 4: Enforce Freshness And Decide The Fate Of Generated JSON

### Task 10: Add artifact freshness enforcement and dev-time regeneration

**Files:**
- Modify: `.github/workflows/rdna-design-guard.yml`
- Modify: `tools/playground/package.json`
- Create: `tools/playground/scripts/check-registry-freshness.mjs`
- Create: `tools/playground/scripts/watch-registry.mjs`

**Step 1: Write the failing checks**

Create `tools/playground/scripts/check-registry-freshness.mjs` that:

1. runs `pnpm --filter @rdna/radiants generate:schemas`
2. runs `pnpm --filter @rdna/playground registry:generate`
3. checks for diff on:
   - `packages/radiants/components/core`
   - `packages/radiants/meta/index.ts`
   - `tools/playground/generated/registry.manifest.json`

Use:

```js
import { execSync } from "node:child_process";

execSync("pnpm --filter @rdna/radiants generate:schemas", { stdio: "inherit" });
execSync("pnpm --filter @rdna/playground registry:generate", { stdio: "inherit" });
execSync("git diff --exit-code -- packages/radiants/components/core packages/radiants/meta/index.ts tools/playground/generated/registry.manifest.json", { stdio: "inherit" });
```

**Step 2: Add dev-time watcher**

Create `tools/playground/scripts/watch-registry.mjs` that watches:
- `packages/radiants/components/core/**/*.meta.ts`
- `packages/radiants/components/core/**/*.tsx`

On change, it should run:

```bash
pnpm --filter @rdna/radiants generate:schemas
pnpm --filter @rdna/playground registry:generate
```

Wire it into `tools/playground/package.json` alongside `next dev`.

**Step 3: Wire CI**

Add to `.github/workflows/rdna-design-guard.yml`:

```yaml
      - name: Check registry artifact freshness
        run: pnpm --filter @rdna/playground check:registry-freshness
```

Also run:
- `registry/__tests__/runtime-coverage.test.ts`
- `registry/__tests__/meta-rollout.test.ts`
- `app/playground/__tests__/manifest-radiants-sync.test.ts`

**Step 4: Run full verification**

Run:

```bash
pnpm --filter @rdna/radiants generate:schemas
pnpm --filter @rdna/playground registry:generate
pnpm --filter @rdna/radiants exec vitest run --cache=false
pnpm --filter @rdna/playground exec vitest run --cache=false
pnpm --filter @rdna/radiants exec tsc --noEmit
pnpm --filter @rdna/playground exec tsc --noEmit
pnpm --filter @rdna/playground check:registry-freshness
```

Expected:
- PASS
- no generated artifact diff remains

**Step 5: Commit**

```bash
git add .github/workflows/rdna-design-guard.yml tools/playground/package.json tools/playground/scripts/check-registry-freshness.mjs tools/playground/scripts/watch-registry.mjs
git commit -m "chore(registry): enforce canonical artifact freshness"
```

### Task 11: Decide whether `schema.json` and `dna.json` still earn their keep

**Files:**
- Create: `docs/reports/2026-03-18-canonical-component-registry-phase-2.md`
- Optional Modify/Delete: `packages/radiants/schemas/index.ts`
- Optional Modify: `packages/radiants/package.json`

**Step 1: Write the decision report**

Create `docs/reports/2026-03-18-canonical-component-registry-phase-2.md` with:
- the final canonical flow
- which drift vectors were removed
- whether `*.schema.json` and `*.dna.json` are still consumed by anything meaningful in the clean-slate repo
- the recommendation:
  - keep as generated projections, or
  - delete and migrate remaining consumers to canonical meta/manifest

**Step 2: Make the decision explicitly**

If the JSON artifacts still serve a useful purpose for:
- AI prompting
- public package exports
- simple inspection from non-TS consumers

then keep them as generated projections for now.

If not, open a follow-up cleanup plan to:
- remove `./schemas` export from `packages/radiants/package.json`
- delete generated JSON artifacts
- make all consumers read the canonical meta/manifest layer directly

This decision is intentionally deferred until the canonical pipeline is stable.

**Step 3: Commit**

```bash
git add docs/reports/2026-03-18-canonical-component-registry-phase-2.md
git commit -m "docs(registry): record post-migration artifact decision"
```

---

## Expected End State

After this plan lands:

- Radiants authored metadata is co-located with components in `*.meta.ts`.
- The shared registry has one canonical metadata builder.
- Runtime rendering is a projection over canonical metadata plus runtime attachments.
- Playground manifest generation uses the same canonical metadata for Radiants.
- Playground no longer hand-authors prop docs or infers categories.
- `*.schema.json`, `*.dna.json`, and `packages/radiants/schemas/index.ts` are generated artifacts, not authored truth.
- The repo is free of the transitional central metadata layers that previously caused drift:
  - no `component-display-meta.ts`
  - no `component-paths.ts`
  - no `state-sets.ts`
  - no fallback imports in `build-registry-metadata.ts`

## Non-Goals

- Do not move executable `Demo` code into generated JSON or meta files.
- Do not optimize for generic multi-package component scanning as part of this plan.
- Do not change component runtime APIs except where a stale meta file must be reconciled to shipped behavior.
- Do not delete generated JSON artifacts until the post-migration decision report confirms they are no longer worth keeping.

## Open Risks To Watch

1. `Button.meta.ts` is already stale relative to shipped `Button.tsx`; reconcile it before trusting any pilot results.
2. Multi-export directories such as `Input` and `Checkbox` require the generator rewrite before full rollout.
3. Any `variants` metadata that contains non-serializable React values must stay in `runtime-attachments.tsx`.
4. Adding forced-state selectors to `packages/radiants/base.css` slightly increases selector weight in production CSS. Acceptable if it removes a persistent drift surface, but keep the selectors narrow.

Plan complete and saved to `docs/plans/2026-03-18-canonical-component-registry-phase-2.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
