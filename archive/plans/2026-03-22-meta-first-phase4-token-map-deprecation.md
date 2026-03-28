---
type: "note"
---
# Meta-First Phase 4 Token Map Removal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete `packages/radiants/eslint/token-map.mjs` and leave `packages/radiants/eslint/contract.mjs` as the only contract-loading surface.

**Architecture:** This app has no shipped compatibility burden, so Phase 4 is a hard cut. Every active rule and config import already points at `contract.mjs`; the remaining `token-map.mjs` file is dead bridge code plus one bridge-era test, while several contract-source tests still mention the old path only as a negative assertion. This phase adds a guardrail test that fails if `token-map.mjs` still exists or if the old import path reappears in live rule/config sources, then deletes the module and the bridge test. Tasks 1 and 2 must run in one uninterrupted slice because Task 1 intentionally leaves an uncommitted failing test behind.

**Tech Stack:** Node 22 ESM, Vitest, `node:fs` path scanning, ripgrep-backed verification, JSON generated artifacts, pnpm workspaces

**Relevant skills:** @test-driven-development, @verification-before-completion

***

### Prerequisite Gate

Run the live-source import gate:

```bash
rg -l "token-map\\.mjs" packages/radiants/eslint/rules packages/radiants/eslint/index.mjs eslint.rdna.config.mjs
```

Expected: no output.

Then confirm the two deletion targets still exist:

```bash
test -f packages/radiants/eslint/token-map.mjs
test -f packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs
```

Note: do not use a broad `rg -l "token-map\\.mjs" packages/radiants/eslint` gate here. Several Phase 3 tests intentionally contain `"token-map.mjs"` as a negative assertion, and those hits are expected before and after Phase 4.

Rollback note if Phase 4 fails after deletion: restore `packages/radiants/eslint/token-map.mjs` and `packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs` from git history, then rerun the focused contract tests. No live rule or config source should need to point back at `token-map.mjs`.

### Task 1: Add A Dynamic Guardrail Test That Expects `token-map.mjs` To Be Gone

**Files:**

* Create: `packages/radiants/eslint/__tests__/token-map-removal.test.mjs`

**Step 1: Write the failing test**

Create `packages/radiants/eslint/__tests__/token-map-removal.test.mjs`:

```js
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const eslintRoot = dirname(testDir);
const rulesDir = join(eslintRoot, "rules");

const topLevelSourceFiles = readdirSync(eslintRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".mjs"))
  .map((entry) => join(eslintRoot, entry.name))
  .filter((path) => !path.endsWith("token-map.mjs"));

const ruleFiles = readdirSync(rulesDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".mjs"))
  .map((entry) => join(rulesDir, entry.name));

const sourceFiles = [
  ...topLevelSourceFiles,
  ...ruleFiles,
  fileURLToPath(new URL("./root-eslint-config.test.mjs", import.meta.url)),
  fileURLToPath(new URL("../../../../eslint.rdna.config.mjs", import.meta.url)),
];

describe("token-map removal", () => {
  it("removes token-map.mjs entirely", () => {
    expect(existsSync(new URL("../token-map.mjs", import.meta.url))).toBe(false);
  });

  it("keeps the old import path out of remaining rule/config sources", () => {
    for (const path of sourceFiles) {
      const source = readFileSync(path, "utf8");
      expect(source).not.toContain("token-map.mjs");
    }
  });
});
```

This intentionally covers:

* every current and future `packages/radiants/eslint/rules/*.mjs`

* every current and future top-level `packages/radiants/eslint/*.mjs`, including `index.mjs`

* `packages/radiants/eslint/__tests__/root-eslint-config.test.mjs`

* `eslint.rdna.config.mjs`

It does not scan other tests, because some source-assertion tests intentionally mention the old path as a negative assertion.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run eslint/__tests__/token-map-removal.test.mjs --cache=false
```

Expected: FAIL because `packages/radiants/eslint/token-map.mjs` still exists.

**Step 3: Do not implement yet**

Leave this failure in place until Task 2 deletes the old module and bridge-era test.

**Step 4: Commit**

Do not commit in this task.

### Task 2: Delete `token-map.mjs` And The Bridge Test

**Files:**

* Delete: `packages/radiants/eslint/token-map.mjs`

* Delete: `packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs`

* Modify: `packages/radiants/eslint/__tests__/contract-surface.test.mjs`

* Modify: `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs`

* Modify: `packages/radiants/eslint/__tests__/root-eslint-config.test.mjs`

**Step 1: Re-run the Phase 3 completion gate**

Run the live-source gate again:

```bash
rg -l "token-map\\.mjs" packages/radiants/eslint/rules packages/radiants/eslint/index.mjs eslint.rdna.config.mjs
```

Expected: no output. If any rule, `index.mjs`, or config file appears, stop and finish Phase 3 first.

**Step 2: Delete the old module and clean any stale bridge-era naming**

Delete:

```text
packages/radiants/eslint/token-map.mjs
packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs
```

Then clean any leftover bridge-era terminology or source assertions:

* if `contract-surface.test.mjs` still uses `tokenMap`-bridge wording, rename it to direct contract wording

* if `rule-import-sources.test.mjs` still has a too-small file list, expand it before continuing

* if `root-eslint-config.test.mjs` still imports the old path, remove it now

* do not delete the existing negative-assertion tests that mention `"token-map.mjs"` as a forbidden string; they remain valid after the bridge file is gone

**Step 3: Run the removal guardrail and focused contract tests**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run eslint/__tests__/token-map-removal.test.mjs eslint/__tests__/contract-surface.test.mjs eslint/__tests__/rule-import-sources.test.mjs eslint/__tests__/root-eslint-config.test.mjs --cache=false
```

Expected: PASS.

**Step 4: Commit**

```bash
git add packages/radiants/eslint/__tests__/token-map-removal.test.mjs packages/radiants/eslint/__tests__/contract-surface.test.mjs packages/radiants/eslint/__tests__/rule-import-sources.test.mjs packages/radiants/eslint/__tests__/root-eslint-config.test.mjs
git rm packages/radiants/eslint/token-map.mjs packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs
git commit -m "refactor(eslint): remove token-map module"
```

### Task 3: Run The Post-Removal Verification Sweep

**Files:**

* Modify: `packages/radiants/generated/eslint-contract.json`

* Modify: `packages/radiants/generated/ai-contract.json`

* Modify: `tools/playground/generated/registry.manifest.json`

**Step 1: Regenerate artifacts**

Run:

```bash
pnpm --filter @rdna/playground registry:generate
```

Expected: PASS, with generated artifacts refreshed from the direct contract pipeline.

**Step 2: Run the full Radiants component test suite**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run --cache=false
```

Expected: if the repo-wide Radiants baseline is green, PASS. If unrelated component, icon, or registry suites are still red outside the Phase 4 token-map surface, treat this as a non-blocking baseline check: record the failing areas explicitly, then rely on the focused ESLint removal tests plus the generator/registry sync checks as the actual Phase 4 acceptance gate.

**Step 3: Run the generator and consumer sync checks**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run app/playground/__tests__/build-radiants-contract.test.ts app/playground/__tests__/manifest-radiants-sync.test.ts app/playground/__tests__/registry-freshness.test.ts --cache=false
pnpm --filter @rdna/radiants exec vitest run registry/__tests__/registry-metadata.test.ts --cache=false
```

Expected: PASS.

**Step 4: Commit only if regeneration changed tracked artifacts**

Run:

```bash
git diff --quiet -- packages/radiants/generated/eslint-contract.json packages/radiants/generated/ai-contract.json tools/playground/generated/registry.manifest.json
```

If that command exits `0`, there is no generated diff. Skip the commit and note that the verification sweep was a no-op.

If it exits non-zero, commit:

```bash
git add packages/radiants/generated/eslint-contract.json packages/radiants/generated/ai-contract.json tools/playground/generated/registry.manifest.json
git commit -m "test(contract): verify post-token-map contract pipeline"
```

⠀