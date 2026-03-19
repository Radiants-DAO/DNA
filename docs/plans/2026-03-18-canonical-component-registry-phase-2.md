# Canonical Component Registry Phase 1-2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish one canonical component-registry assembly pipeline for Radiants and the playground, then migrate Radiants authored metadata to co-located `*.meta.ts` files so schema, DNA, and display metadata are generated from component-local source.

**Architecture:** Phase 1 keeps existing `*.schema.json` and `*.dna.json` files as the authored API source, but centralizes assembly into one server-safe metadata builder plus one runtime attachment layer. Phase 2 migrates authored metadata out of split central files into co-located `*.meta.ts` modules, generates JSON artifacts and registry metadata from those modules, and leaves only executable demo wiring in a separate runtime layer.

**Tech Stack:** TypeScript, React 19, Vitest, Next.js App Router, Node ESM scripts, pnpm workspaces, existing `@rdna/preview` metadata types

**Worktree:** Create with `git worktree add .claude/worktrees/canonical-registry -b feat/canonical-component-registry` from repo root.

---

## Success Criteria

By the end of Phase 2:

1. Radiants has one canonical registry metadata builder.
2. RadOS BrandAssets consumes the runtime projection of that builder.
3. Playground manifest generation serializes the same canonical metadata for Radiants instead of rescanning or reinterpreting it.
4. Playground no longer owns handwritten prop docs or category inference.
5. Radiants authored metadata lives in co-located `*.meta.ts` files; `*.schema.json` and `*.dna.json` are generated artifacts.
6. CI fails if the generated playground manifest or generated JSON artifacts drift from source.

## Current Problems To Eliminate

- `packages/radiants/registry/build-registry.ts` builds one runtime registry while `tools/playground/scripts/generate-registry.mjs` separately rebuilds overlapping metadata.
- `tools/playground/app/playground/registry.overrides.ts` hand-authors `propsInterface`, which has already drifted from real component APIs.
- `tools/playground/app/playground/registry.tsx` still infers categories for manifest-only packages, so the consumer invents facts instead of reading them.
- Manual registry facts are split across `component-map.ts`, `component-display-meta.ts`, `registry.overrides.tsx`, and playground-only overrides.
- `packages/radiants/components/core/Button/Button.meta.ts` exists as a prior experiment but is not the repo-wide source of truth and is already ahead of the shipped implementation. Treat it as a prototype to reconcile, not as trusted source.

## Target Model

### Phase 1 Target

- `schema.json` + `dna.json` own API facts:
  - `name`
  - `description`
  - `props`
  - `slots`
  - `examples`
  - `tokenBindings`
- one manual metadata layer owns only non-derivable facts:
  - `category`
  - `renderMode`
  - `tags`
  - `exclude`
  - `exampleProps`
  - `controlledProps`
  - curated `variants`
- one runtime attachment layer owns only executable wiring:
  - component refs
  - `Demo` components

Everything else becomes a projection:

- `buildRegistryMetadata()` returns pure server-safe metadata
- `buildRuntimeRegistry()` = metadata + runtime attachments
- `writeRegistryManifest()` serializes the same metadata for the playground

### Phase 2 Target

- each Radiants component owns its authored metadata in a co-located `*.meta.ts`
- generated `*.schema.json` and `*.dna.json` are artifacts, not authored truth
- central manual metadata files disappear or become generated barrels
- runtime attachments remain separate from metadata

---

## Phase 1: Canonical Builder Unification

### Task 1: Remove handwritten playground prop descriptions

**Files:**
- Modify: `tools/playground/app/playground/types.ts`
- Modify: `tools/playground/app/playground/registry.tsx`
- Delete: `tools/playground/app/playground/registry.overrides.ts`
- Modify: `tools/playground/app/playground/prompts/iteration.prompt.ts`
- Modify: `tools/playground/app/playground/prompts/__tests__/iteration-prompt.test.ts`
- Create: `tools/playground/app/playground/__tests__/registry-contract.test.ts`

**Step 1: Write the failing tests**

Add a new test file that asserts the playground registry contract no longer exposes `propsInterface`:

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

Update the prompt tests to remove the `propsInterface` path and assert that prompts still contain the schema section but no `Props Interface` section.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/registry-contract.test.ts app/playground/prompts/__tests__/iteration-prompt.test.ts --cache=false
```

Expected:
- FAIL because `propsInterface` still exists in the registry types and overrides.

**Step 3: Remove `propsInterface` from the playground**

- remove `propsInterface?: string` from `RegistryEntry` in `tools/playground/app/playground/types.ts`
- delete `tools/playground/app/playground/registry.overrides.ts`
- remove all `propsInterface` plumbing from `tools/playground/app/playground/registry.tsx`
- remove `propsInterface` from `IterationPromptOptions` and the prompt template in `tools/playground/app/playground/prompts/iteration.prompt.ts`

The prompt should keep:
- source file
- schema JSON
- design doc
- custom instructions

It should not invent a second handwritten prop contract.

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
git commit -m "refactor(playground): remove handwritten props interface metadata"
```

### Task 2: Introduce canonical server-safe registry metadata

**Files:**
- Create: `packages/radiants/registry/component-locations.ts`
- Create: `packages/radiants/registry/component-manual-meta.ts`
- Create: `packages/radiants/registry/build-registry-metadata.ts`
- Modify: `packages/radiants/registry/types.ts`
- Create: `packages/radiants/registry/__tests__/registry-metadata.test.ts`
- Delete: `packages/radiants/registry/component-display-meta.ts`

**Step 1: Write the failing tests**

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

Update `packages/radiants/registry/types.ts` with two explicit layers:

```ts
export interface RegistryMetadataEntry {
  packageName: "@rdna/radiants";
  name: string;
  category: ComponentCategory;
  description: string;
  sourcePath: string;
  schemaPath: string;
  renderMode: RenderMode;
  exampleProps?: Record<string, unknown>;
  variants?: VariantDemo[];
  controlledProps?: string[];
  tags?: string[];
}

export interface RuntimeAttachment {
  component?: ComponentType<any>;
  Demo?: ComponentType;
}

export interface RegistryEntry extends RegistryMetadataEntry, RuntimeAttachment {}
```

**Step 4: Add server-safe inputs**

Create `component-locations.ts` with only path data:

```ts
export const componentLocations = {
  Button: {
    sourcePath: "packages/radiants/components/core/Button/Button.tsx",
    schemaPath: "packages/radiants/components/core/Button/Button.schema.json",
  },
} as const;
```

Create `component-manual-meta.ts` by moving and expanding the existing `component-display-meta.ts` values:

```ts
export const componentManualMeta = {
  Button: {
    category: "action",
    tags: ["cta", "action", "click"],
    renderMode: "inline",
    exampleProps: { children: "Button" },
  },
} as const;
```

This file must own only:
- `category`
- `renderMode`
- `tags`
- `exclude`
- `exampleProps`
- `controlledProps`
- curated `variants`

**Step 5: Implement `buildRegistryMetadata()`**

Create `build-registry-metadata.ts`:

```ts
import { componentData } from "../schemas";
import { componentLocations } from "./component-locations";
import { componentManualMeta } from "./component-manual-meta";
import type { RegistryMetadataEntry } from "./types";

export function buildRegistryMetadata(): RegistryMetadataEntry[] {
  return Object.entries(componentData)
    .flatMap(([name, data]) => {
      const location = componentLocations[name as keyof typeof componentLocations];
      const manual = componentManualMeta[name as keyof typeof componentManualMeta];
      if (!location || manual?.exclude) return [];
      return [{
        packageName: "@rdna/radiants",
        name: data.schema.name ?? name,
        category: manual?.category ?? "layout",
        description: data.schema.description ?? "",
        sourcePath: location.sourcePath,
        schemaPath: location.schemaPath,
        renderMode: manual?.renderMode ?? "inline",
        exampleProps: manual?.exampleProps,
        variants: manual?.variants,
        controlledProps: manual?.controlledProps,
        tags: manual?.tags ?? [],
      }];
    })
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
```

**Step 6: Run test to verify it passes**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry-metadata.test.ts --cache=false
```

Expected:
- PASS

**Step 7: Commit**

```bash
git add packages/radiants/registry/types.ts packages/radiants/registry/component-locations.ts packages/radiants/registry/component-manual-meta.ts packages/radiants/registry/build-registry-metadata.ts packages/radiants/registry/__tests__/registry-metadata.test.ts
git rm packages/radiants/registry/component-display-meta.ts
git commit -m "refactor(registry): add canonical server-safe metadata builder"
```

### Task 3: Split runtime attachments from metadata

**Files:**
- Create: `packages/radiants/registry/runtime-attachments.tsx`
- Modify: `packages/radiants/registry/build-registry.ts`
- Modify: `packages/radiants/registry/index.ts`
- Modify: `packages/radiants/registry/__tests__/registry.test.ts`
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

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry.test.ts --cache=false
```

Expected:
- FAIL once the metadata builder exists but the runtime builder still uses the old map directly.

**Step 3: Create the runtime attachment file**

Move component refs and `Demo` components into `runtime-attachments.tsx`:

```tsx
import * as core from "../components/core";
import type { RuntimeAttachment } from "./types";

export const runtimeAttachments: Record<string, RuntimeAttachment> = {
  Button: { component: core.Button },
  Badge: { component: core.Badge },
  Dialog: { component: core.Dialog, Demo: DialogDemo },
};
```

Keep executable showcase code here. Do not move categories, tags, or default props into this file.

**Step 4: Rewrite the runtime builder**

Update `build-registry.ts` to become a projection over canonical metadata:

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

`index.ts` should continue exporting `registry = buildRegistry()`.

**Step 5: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry.test.ts registry/__tests__/registry-metadata.test.ts --cache=false
```

Expected:
- PASS

**Step 6: Commit**

```bash
git add packages/radiants/registry/runtime-attachments.tsx packages/radiants/registry/build-registry.ts packages/radiants/registry/index.ts packages/radiants/registry/__tests__/registry.test.ts
git rm packages/radiants/registry/component-map.ts
git commit -m "refactor(registry): separate runtime attachments from metadata"
```

### Task 4: Make playground manifest generation consume canonical metadata

**Files:**
- Modify: `tools/playground/scripts/generate-registry.mjs`
- Modify: `tools/playground/generated/registry.ts`
- Modify: `tools/playground/app/playground/registry.server.ts`
- Modify: `tools/playground/app/playground/__tests__/registry.test.ts`
- Create: `tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts`

**Step 1: Write the failing tests**

Create `manifest-radiants-sync.test.ts`:

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

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/manifest-radiants-sync.test.ts --cache=false
```

Expected:
- FAIL or expose missing fields until the generator emits canonical Radiants metadata.

**Step 3: Rewrite the manifest generator**

In `tools/playground/scripts/generate-registry.mjs`:

- import `buildRegistryMetadata()` from `@rdna/radiants/registry/build-registry-metadata`
- use that for the `@rdna/radiants` package instead of rescanning `packages/radiants/components/core`
- keep filesystem scanning for packages without a shared builder
- move category inference into the generator for non-shared packages
- emit `category` and `group` into `registry.manifest.json`

For the emitted Radiants package shape, serialize:

```json
{
  "packageName": "@rdna/radiants",
  "name": "Button",
  "category": "action",
  "group": "Actions",
  "renderMode": "inline",
  "sourcePath": "...",
  "schemaPath": "...",
  "props": { "...": "..." },
  "tokenBindings": { "...": "..." },
  "tags": ["cta"],
  "exampleProps": { "children": "Button" },
  "controlledProps": ["size"]
}
```

**Step 4: Update typed manifest accessors**

Extend `tools/playground/generated/registry.ts` interfaces to include:
- `category?: string`
- `group?: string`
- `renderMode?: "inline" | "custom" | "description-only"`
- `tags?: string[]`
- `exampleProps?: Record<string, unknown>`
- `controlledProps?: string[]`

Update `registry.server.ts` to retain emitted `category`/`group` metadata rather than re-deriving later.

**Step 5: Regenerate the manifest**

Run:

```bash
pnpm --filter @rdna/playground registry:generate
```

Expected:
- `tools/playground/generated/registry.manifest.json` updates
- Radiants entries reflect canonical metadata instead of scanner-only output

**Step 6: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/manifest-radiants-sync.test.ts app/playground/__tests__/registry.test.ts --cache=false
```

Expected:
- PASS

**Step 7: Commit**

```bash
git add tools/playground/scripts/generate-registry.mjs tools/playground/generated/registry.ts tools/playground/generated/registry.manifest.json tools/playground/app/playground/registry.server.ts tools/playground/app/playground/__tests__/registry.test.ts tools/playground/app/playground/__tests__/manifest-radiants-sync.test.ts
git commit -m "refactor(playground): generate Radiants manifest from canonical registry metadata"
```

### Task 5: Remove category inference and consumer-side reinterpretation from playground

**Files:**
- Modify: `tools/playground/app/playground/registry.tsx`
- Modify: `tools/playground/app/playground/__tests__/registry.test.ts`

**Step 1: Write the failing tests**

Add assertions that manifest-only entries read `group` from the manifest instead of local inference:

```ts
it("does not infer category labels in the client registry", () => {
  const monolith = registry.find((e) => e.packageName === "@rdna/monolith");
  expect(monolith?.group).toBeTruthy();
});
```

Also add a structural assertion that `inferCategory` is gone by deleting any tests that depend on it and replacing them with manifest-driven expectations.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/registry.test.ts --cache=false
```

Expected:
- FAIL until the consumer stops inferring categories.

**Step 3: Simplify the client registry adapter**

In `tools/playground/app/playground/registry.tsx`:

- delete `inferCategory()`
- stop importing any deleted playground override file
- use canonical metadata fields from the manifest for `group`, `renderMode`, `tags`, `defaultProps`/`exampleProps`, and `controlledProps`
- keep only the minimal runtime attachment logic:
  - shared Radiants runtime registry entry → attach `Component`
  - manifest-only packages → `Component: null`

The client adapter should not invent:
- categories
- prop docs
- default props

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/registry.test.ts app/playground/__tests__/registry-contract.test.ts --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add tools/playground/app/playground/registry.tsx tools/playground/app/playground/__tests__/registry.test.ts
git commit -m "refactor(playground): stop inferring registry metadata in the client"
```

### Task 6: Add enforcement for freshness and explicit exclusions

**Files:**
- Modify: `.github/workflows/rdna-design-guard.yml`
- Modify: `package.json`
- Modify: `tools/playground/package.json`
- Create: `tools/playground/scripts/check-registry-freshness.mjs`
- Create: `packages/radiants/registry/__tests__/runtime-coverage.test.ts`

**Step 1: Write the failing tests**

Create `runtime-coverage.test.ts`:

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

**Step 2: Run tests to verify they fail if coverage is missing**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/runtime-coverage.test.ts --cache=false
```

Expected:
- PASS only after all current components are wired explicitly.

**Step 3: Add manifest freshness check**

Create `tools/playground/scripts/check-registry-freshness.mjs` that:

1. runs the generator
2. checks for diff on `tools/playground/generated/registry.manifest.json`
3. exits non-zero if the file changed

Use:

```js
import { execSync } from "node:child_process";

execSync("pnpm --filter @rdna/playground registry:generate", { stdio: "inherit" });
execSync("git diff --exit-code -- tools/playground/generated/registry.manifest.json", { stdio: "inherit" });
```

Add scripts:

```json
{
  "scripts": {
    "check:registry-freshness": "node scripts/check-registry-freshness.mjs"
  }
}
```

**Step 4: Wire CI**

Add to `.github/workflows/rdna-design-guard.yml`:

```yaml
      - name: Check playground registry freshness
        run: pnpm --filter @rdna/playground check:registry-freshness
```

Also run the new registry coverage tests under the existing design-system lint job.

**Step 5: Run full verification**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry.test.ts registry/__tests__/registry-metadata.test.ts registry/__tests__/runtime-coverage.test.ts --cache=false
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/registry.test.ts app/playground/__tests__/manifest-radiants-sync.test.ts app/playground/__tests__/registry-contract.test.ts --cache=false
pnpm --filter @rdna/playground check:registry-freshness
```

Expected:
- PASS

**Step 6: Commit**

```bash
git add .github/workflows/rdna-design-guard.yml package.json tools/playground/package.json tools/playground/scripts/check-registry-freshness.mjs packages/radiants/registry/__tests__/runtime-coverage.test.ts
git commit -m "chore(registry): enforce manifest freshness and runtime coverage"
```

---

## Phase 2: Co-Located `*.meta.ts` Migration

### Task 7: Expand `@rdna/preview` metadata types for component-local authored truth

**Files:**
- Modify: `packages/preview/src/types.ts`
- Modify: `packages/preview/src/index.ts`
- Create: `packages/preview/src/define-component-meta.ts`
- Create: `packages/preview/src/__tests__/component-meta.test.ts`

**Step 1: Write the failing tests**

Create a test for the expanded type surface:

```ts
import { describe, expect, it } from "vitest";
import type { ComponentMeta } from "../types";

describe("ComponentMeta", () => {
  it("supports registry metadata alongside schema and dna fields", () => {
    const meta: ComponentMeta = {
      name: "Badge",
      description: "Badge",
      props: {},
      registry: { category: "feedback" },
    };
    expect(meta.registry?.category).toBe("feedback");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/component-meta.test.ts --cache=false
```

Expected:
- FAIL because `registry` metadata is not part of `ComponentMeta`.

**Step 3: Extend the type model**

Update `packages/preview/src/types.ts`:

```ts
export interface RegistryMeta {
  category: ComponentCategory;
  tags?: string[];
  renderMode?: "inline" | "custom" | "description-only";
  exampleProps?: Record<string, unknown>;
  variants?: Array<{ label: string; props: Record<string, unknown> }>;
  controlledProps?: string[];
  exclude?: boolean;
}

export interface ComponentMeta {
  name: string;
  description: string;
  props: Record<string, PropDef>;
  slots?: Record<string, SlotDef>;
  tokenBindings?: Record<string, Record<string, string>>;
  examples?: Array<{ name: string; code: string }>;
  registry?: RegistryMeta;
}
```

Add a lightweight helper:

```ts
export function defineComponentMeta<T extends ComponentMeta>(meta: T): T {
  return meta;
}
```

This keeps authored meta files concise and typed.

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
git commit -m "feat(preview): support registry metadata in ComponentMeta"
```

### Task 8: Teach schema generation to scan all `*.meta.ts` files

**Files:**
- Modify: `packages/preview/src/generate-schemas.ts`
- Create: `packages/preview/src/__tests__/generate-schemas.test.ts`
- Modify: `packages/radiants/package.json`

**Step 1: Write the failing test**

Add coverage for multi-meta directories:

```ts
import { describe, expect, it } from "vitest";

describe("generate-schemas", () => {
  it("finds all *.meta.ts files in a component directory, not just DirectoryName.meta.ts", () => {
    expect(true).toBe(true); // replace with fixture-backed test
  });
});
```

Use a fixture directory containing:
- `Input.meta.ts`
- `Label.meta.ts`
- `TextArea.meta.ts`

The test should assert all three generate their own JSON files.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/generate-schemas.test.ts --cache=false
```

Expected:
- FAIL because the current generator only looks for `${dir.name}.meta.ts`.

**Step 3: Rewrite the generator**

Update `generate-schemas.ts` to:

- scan each component directory for all `*.meta.ts` files
- import each file
- find the exported `ComponentMeta`
- emit `*.schema.json`
- emit `*.dna.json`

Pseudo-shape:

```ts
const metaFiles = files.filter((f) => f.endsWith(".meta.ts"));
for (const metaFile of metaFiles) {
  const mod = await import(pathToFileURL(join(componentDir, metaFile)).href);
  const meta = Object.values(mod).find((v) => v?.name && v?.props);
  const baseName = metaFile.replace(".meta.ts", "");
  writeFileSync(join(componentDir, `${baseName}.schema.json`), ...);
}
```

Add a Radiants package script if needed:

```json
{
  "scripts": {
    "generate:schemas": "tsx ../preview/src/generate-schemas.ts ./components/core"
  }
}
```

Keep the existing script name so downstream tooling does not change.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/generate-schemas.test.ts --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/preview/src/generate-schemas.ts packages/preview/src/__tests__/generate-schemas.test.ts packages/radiants/package.json
git commit -m "feat(preview): generate schemas from all co-located meta files"
```

### Task 9: Pilot migrate `Button` and `Badge` to co-located metadata

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.meta.ts`
- Create: `packages/radiants/components/core/Badge/Badge.meta.ts`
- Modify: `packages/radiants/components/core/Button/Button.schema.json`
- Modify: `packages/radiants/components/core/Button/Button.dna.json`
- Modify: `packages/radiants/components/core/Badge/Badge.schema.json`
- Modify: `packages/radiants/components/core/Badge/Badge.dna.json`
- Modify: `packages/radiants/registry/build-registry-metadata.ts`
- Create: `packages/radiants/registry/__tests__/meta-pilot.test.ts`

**Step 1: Write the failing test**

Create `meta-pilot.test.ts`:

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
- FAIL until the builder can read co-located meta files.

**Step 3: Reconcile and author the pilot meta files**

Important:
- rewrite `Button.meta.ts` to match the shipped Button API, not the aspirational API in the current prototype
- create `Badge.meta.ts` to match the shipped Badge API exactly

Each meta file should look like:

```ts
import { defineComponentMeta } from "@rdna/preview";

export const BadgeMeta = defineComponentMeta({
  name: "Badge",
  description: "Status indicator and label component with semantic color variants.",
  props: {
    variant: { type: "enum", values: ["default", "success", "warning", "error", "info"], default: "default" },
    size: { type: "enum", values: ["sm", "md"], default: "md" },
  },
  slots: {
    children: { description: "Badge label text or content" },
  },
  tokenBindings: {
    base: { text: "main", border: "line" },
  },
  registry: {
    category: "feedback",
    tags: ["label", "status", "pill"],
    renderMode: "inline",
    exampleProps: { children: "Badge" },
  },
});
```

**Step 4: Update the metadata builder for pilot precedence**

Teach `buildRegistryMetadata()` to prefer co-located `*.meta.ts` values for migrated components, falling back to JSON + central manual metadata for unmigrated components.

Do not attempt the full migration in this task.

**Step 5: Regenerate JSON artifacts**

Run:

```bash
pnpm --filter @rdna/radiants generate:schemas
```

Expected:
- `Button.schema.json`, `Button.dna.json`, `Badge.schema.json`, `Badge.dna.json` regenerate from the pilot meta files

**Step 6: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/meta-pilot.test.ts registry/__tests__/registry-metadata.test.ts --cache=false
```

Expected:
- PASS

**Step 7: Commit**

```bash
git add packages/radiants/components/core/Button/Button.meta.ts packages/radiants/components/core/Badge/Badge.meta.ts packages/radiants/components/core/Button/Button.schema.json packages/radiants/components/core/Button/Button.dna.json packages/radiants/components/core/Badge/Badge.schema.json packages/radiants/components/core/Badge/Badge.dna.json packages/radiants/registry/build-registry-metadata.ts packages/radiants/registry/__tests__/meta-pilot.test.ts
git commit -m "feat(registry): pilot co-located metadata for button and badge"
```

### Task 10: Batch-migrate the remaining Radiants components to `*.meta.ts`

**Files:**
- Create/Modify: `packages/radiants/components/core/**/*/*.meta.ts`
- Modify: `packages/radiants/components/core/**/*.schema.json`
- Modify: `packages/radiants/components/core/**/*.dna.json`
- Modify: `packages/radiants/registry/build-registry-metadata.ts`
- Delete: `packages/radiants/registry/component-manual-meta.ts`
- Delete: `packages/radiants/registry/component-locations.ts`
- Create: `packages/radiants/registry/__tests__/meta-rollout.test.ts`

**Batch order:**
- Batch A: `Alert`, `Avatar`, `Breadcrumbs`, `Button`, `Badge`, `Card`, `Divider`, `Spinner`, `Tooltip`
- Batch B: `Input`, `Label`, `TextArea`, `Checkbox`, `Radio`, `RadioGroup`, `Select`, `Slider`, `Switch`, `Field`, `Fieldset`, `NumberField`, `Combobox`
- Batch C: `Tabs`, `Menubar`, `NavigationMenu`, `ContextMenu`, `DropdownMenu`, `Dialog`, `AlertDialog`, `Drawer`, `Sheet`, `Popover`, `PreviewCard`, `HelpPanel`, `ScrollArea`, `Collapsible`, `CountdownTimer`, `Meter`, `Web3ActionBar`, `Toast`, `Toggle`, `ToggleGroup`, `Toolbar`, `Separator`, `MockStatesPopover`

**Step 1: Write the failing rollout test**

Create `meta-rollout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "../build-registry-metadata";

describe("meta rollout", () => {
  it("does not require central manual metadata once all components are migrated", () => {
    const entries = buildRegistryMetadata();
    expect(entries.length).toBeGreaterThan(20);
  });
});
```

Also assert:
- every non-excluded component has a `*.meta.ts`
- central manual metadata files are no longer imported by the builder

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
2. move category/tags/renderMode/exampleProps/controlledProps/variants into `registry`
3. keep executable `Demo` components in `runtime-attachments.tsx`
4. run `pnpm --filter @rdna/radiants generate:schemas`
5. run targeted registry tests
6. commit batch

Example batch command set:

```bash
pnpm --filter @rdna/radiants generate:schemas
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry.test.ts registry/__tests__/registry-metadata.test.ts registry/__tests__/runtime-coverage.test.ts registry/__tests__/meta-rollout.test.ts --cache=false
```

Expected:
- PASS after each batch

**Step 4: Remove the central manual metadata inputs**

After Batch C passes:

- delete `packages/radiants/registry/component-manual-meta.ts`
- delete `packages/radiants/registry/component-locations.ts`
- update `build-registry-metadata.ts` to source everything from imported `*.meta.ts` modules plus generated JSON fallback only if absolutely needed during the final cleanup

**Step 5: Commit final rollout**

Use one commit per batch plus one cleanup commit:

```bash
git add packages/radiants/components/core packages/radiants/registry/build-registry-metadata.ts packages/radiants/registry/__tests__/meta-rollout.test.ts
git commit -m "feat(registry): migrate registry metadata batch a to co-located meta files"
```

Repeat for batches B and C, then:

```bash
git add packages/radiants/registry/build-registry-metadata.ts packages/radiants/registry/__tests__/meta-rollout.test.ts
git rm packages/radiants/registry/component-manual-meta.ts packages/radiants/registry/component-locations.ts
git commit -m "refactor(registry): remove central metadata files after meta rollout"
```

### Task 11: Final Phase 2 verification and docs cleanup

**Files:**
- Modify: `.github/workflows/rdna-design-guard.yml`
- Modify: `packages/radiants/package.json`
- Modify: `tools/playground/package.json`
- Modify: `tools/playground/scripts/check-registry-freshness.mjs`
- Create: `docs/reports/2026-03-18-canonical-component-registry-phase-2.md`

**Step 1: Update CI to check generated artifacts**

Add a Radiants artifact freshness check:

```bash
pnpm --filter @rdna/radiants generate:schemas
git diff --exit-code -- packages/radiants/components/core
```

Keep the existing playground manifest freshness check from Phase 1.

**Step 2: Run full verification**

Run:

```bash
pnpm --filter @rdna/radiants generate:schemas
pnpm --filter @rdna/playground registry:generate
pnpm --filter @rdna/radiants exec vitest run --cache=false
pnpm --filter @rdna/playground exec vitest run --cache=false
pnpm --filter @rdna/radiants exec tsc --noEmit
pnpm --filter @rdna/playground exec tsc --noEmit
git diff --exit-code -- packages/radiants/components/core tools/playground/generated/registry.manifest.json
```

Expected:
- PASS
- no generated artifact diff remains

**Step 3: Write the completion report**

Create `docs/reports/2026-03-18-canonical-component-registry-phase-2.md` summarizing:
- deleted drift vectors
- final canonical flow
- remaining follow-up items, if any

**Step 4: Commit**

```bash
git add .github/workflows/rdna-design-guard.yml packages/radiants/package.json tools/playground/package.json tools/playground/scripts/check-registry-freshness.mjs docs/reports/2026-03-18-canonical-component-registry-phase-2.md
git commit -m "chore(registry): enforce generated artifact freshness after phase 2"
```

---

## Expected End State

After this plan lands:

- Radiants registry metadata is assembled once.
- Runtime rendering is a projection over canonical metadata plus runtime attachments.
- Playground manifest generation uses the same canonical metadata for Radiants.
- Playground no longer hand-authors prop docs or infers categories.
- Radiants authored metadata is co-located with components in `*.meta.ts`.
- `*.schema.json` and `*.dna.json` remain available as generated compatibility artifacts.

## Non-Goals

- Do not move executable `Demo` code into generated JSON.
- Do not force monolith or other packages into the same `*.meta.ts` migration in this plan.
- Do not change component runtime APIs as part of the registry cleanup unless a pilot meta file is already stale and must be reconciled to shipped behavior.

## Open Risks To Watch

1. `Button.meta.ts` is already ahead of shipped `Button.tsx`; reconcile it before using it as truth.
2. Multi-export directories (`Input`, `Checkbox`, `Tabs`) require the Phase 2 generator update before full rollout.
3. Any `variants` metadata that contains non-serializable React values must stay in runtime attachments instead of `*.meta.ts`.

Plan complete and saved to `docs/plans/2026-03-18-canonical-component-registry-phase-2.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
