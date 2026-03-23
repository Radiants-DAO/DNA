# Meta-First Phase 4 Token Map Removal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete `packages/radiants/eslint/token-map.mjs` and leave `packages/radiants/eslint/contract.mjs` as the only contract-loading surface.

**Architecture:** This app has no shipped compatibility burden, so Phase 4 is a hard cut. Every active rule and config import should already point at `contract.mjs` by the time this phase begins. This phase adds a guardrail test that fails if `token-map.mjs` still exists or if the old import path reappears in rule/config sources, then deletes the module and the bridge-era test. Tasks 1 and 2 must run in one uninterrupted slice because Task 1 intentionally leaves an uncommitted failing test behind.

**Tech Stack:** Node 22 ESM, Vitest, `node:fs` path scanning, ripgrep-backed verification, JSON generated artifacts, pnpm workspaces

**Relevant skills:** @test-driven-development, @verification-before-completion

---

### Prerequisite Gate

Run:

```bash
rg -l "token-map\\.mjs" packages/radiants/eslint eslint.rdna.config.mjs
```

Expected:

- `packages/radiants/eslint/token-map.mjs`
- `packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs`

No other file should appear. If `eslint.rdna.config.mjs`, `packages/radiants/eslint/index.mjs`, or any rule file still shows up here, Phase 3 is incomplete and Phase 4 must not start.

Rollback note if Phase 4 fails after deletion: restore `packages/radiants/eslint/token-map.mjs` and `packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs` from git history, then revert import changes back to `token-map.mjs`.

### Task 1: Add A Dynamic Guardrail Test That Expects `token-map.mjs` To Be Gone

**Files:**
- Create: `packages/radiants/eslint/__tests__/token-map-removal.test.mjs`

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

- every current and future `packages/radiants/eslint/rules/*.mjs`
- every current and future top-level `packages/radiants/eslint/*.mjs`, including `index.mjs`
- `packages/radiants/eslint/__tests__/root-eslint-config.test.mjs`
- `eslint.rdna.config.mjs`

It does not scan other tests, because some source-assertion tests intentionally mention the old path as a negative assertion.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/token-map-removal.test.mjs
```

Expected: FAIL because `packages/radiants/eslint/token-map.mjs` still exists.

**Step 3: Do not implement yet**

Leave this failure in place until Task 2 deletes the old module and bridge-era test.

**Step 4: Commit**

Do not commit in this task.

### Task 2: Delete `token-map.mjs` And The Bridge Test

**Files:**
- Delete: `packages/radiants/eslint/token-map.mjs`
- Delete: `packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/contract-surface.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/root-eslint-config.test.mjs`

**Step 1: Re-run the Phase 3 completion gate**

Run:

```bash
rg -l "token-map\\.mjs" packages/radiants/eslint eslint.rdna.config.mjs
```

Expected: only the old module and the bridge test remain. If any rule, `index.mjs`, or config file still appears, stop and finish Phase 3 first.

**Step 2: Delete the old module and clean any stale bridge-era naming**

Delete:

```text
packages/radiants/eslint/token-map.mjs
packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs
```

Then clean any leftover bridge-era terminology:

- if `contract-surface.test.mjs` still uses `tokenMap`-bridge wording, rename it to direct contract wording
- if `rule-import-sources.test.mjs` still has a too-small file list, expand it before continuing
- if `root-eslint-config.test.mjs` still imports the old path, remove it now

**Step 3: Run the removal guardrail and focused contract tests**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/token-map-removal.test.mjs eslint/__tests__/contract-surface.test.mjs eslint/__tests__/rule-import-sources.test.mjs eslint/__tests__/root-eslint-config.test.mjs
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
- Modify: `packages/radiants/generated/eslint-contract.json`
- Modify: `packages/radiants/generated/ai-contract.json`
- Modify: `tools/playground/generated/registry.manifest.json`

**Step 1: Regenerate artifacts**

Run:

```bash
pnpm --filter @rdna/playground registry:generate
```

Expected: PASS, with generated artifacts refreshed from the direct contract pipeline.

**Step 2: Run the full Radiants component test suite**

Run:

```bash
pnpm --filter @rdna/radiants test:components
```

Expected: PASS. This replaces any hand-maintained file list and catches transitive breakage across the ESLint package.

**Step 3: Run the generator and consumer sync checks**

Run:

```bash
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts app/playground/__tests__/manifest-radiants-sync.test.ts app/playground/__tests__/registry-freshness.test.ts
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
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
