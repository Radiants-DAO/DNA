# Meta-First Phase 4 Token Map Removal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove `packages/radiants/eslint/token-map.mjs` entirely and leave `packages/radiants/eslint/contract.mjs` as the only contract-loading surface.

**Architecture:** This app has no shipped compatibility burden, so Phase 4 is a hard cut. By the start of this phase, all active rule consumers should already import `contract.mjs` directly. This phase deletes `token-map.mjs`, deletes bridge-era tests, and adds guardrails that fail if the old module path reappears anywhere in the ESLint package or root config.

**Tech Stack:** Node 22 ESM, Vitest, ripgrep-backed source assertions, JSON generated artifacts, pnpm workspaces

**Relevant skills:** @test-driven-development, @verification-before-completion

---

### Task 1: Add Guardrails That Expect `token-map.mjs` To Be Gone

**Files:**
- Create: `packages/radiants/eslint/__tests__/token-map-removal.test.mjs`

**Step 1: Write the failing test**

Create `packages/radiants/eslint/__tests__/token-map-removal.test.mjs`:

```js
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sourceFiles = [
  "../contract.mjs",
  "../rules/prefer-rdna-components.mjs",
  "../rules/no-hardcoded-colors.mjs",
  "../rules/no-removed-aliases.mjs",
  "../rules/no-clipped-shadow.mjs",
  "../rules/no-pixel-border.mjs",
  "../rules/no-mixed-style-authority.mjs",
  "../rules/no-hardcoded-motion.mjs",
  "../../../../eslint.rdna.config.mjs",
];

describe("token-map removal", () => {
  it("removes token-map.mjs entirely", () => {
    expect(existsSync(new URL("../token-map.mjs", import.meta.url))).toBe(false);
  });

  it("keeps the old import path out of remaining sources", () => {
    for (const path of sourceFiles) {
      const source = readFileSync(new URL(path, import.meta.url), "utf8");
      expect(source).not.toContain("token-map.mjs");
    }
  });
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/token-map-removal.test.mjs
```

Expected: FAIL because `packages/radiants/eslint/token-map.mjs` still exists.

**Step 3: Do not implement yet**

Leave the failure in place until Task 2 deletes the old module and bridge-era test.

**Step 4: Commit**

Do not commit in this task.

### Task 2: Delete `token-map.mjs` And Remove Bridge-Era Tests

**Files:**
- Delete: `packages/radiants/eslint/token-map.mjs`
- Delete: `packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/contract-surface.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs`

**Step 1: Confirm the last remaining references**

Run:

```bash
rg -n "token-map\\.mjs" packages/radiants/eslint eslint.rdna.config.mjs
```

Expected: output should only show:

- `packages/radiants/eslint/token-map.mjs`
- `packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs`
- optionally source-assertion tests that are checking for absence

**Step 2: Delete the old module and bridge test**

Delete:

```text
packages/radiants/eslint/token-map.mjs
packages/radiants/eslint/__tests__/token-map-contract-bridge.test.mjs
```

If `packages/radiants/eslint/__tests__/contract-surface.test.mjs` still mentions the bridge or token-map naming, rename those assertions to direct contract terminology only.

If `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs` still has a too-small file list, extend it so every migrated rule and `eslint.rdna.config.mjs` is covered.

**Step 3: Run the removal guardrail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/token-map-removal.test.mjs eslint/__tests__/contract-surface.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: PASS.

**Step 4: Commit**

```bash
git add packages/radiants/eslint/__tests__/token-map-removal.test.mjs packages/radiants/eslint/__tests__/contract-surface.test.mjs packages/radiants/eslint/__tests__/rule-import-sources.test.mjs
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

Expected: PASS, with generated artifacts refreshed from the contract pipeline.

**Step 2: Run the focused ESLint rule suite**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/contract-surface.test.mjs eslint/__tests__/rule-import-sources.test.mjs eslint/__tests__/token-map-removal.test.mjs eslint/__tests__/prefer-rdna-components.test.mjs eslint/__tests__/no-hardcoded-colors.test.mjs eslint/__tests__/no-removed-aliases.test.mjs eslint/__tests__/no-clipped-shadow.test.mjs eslint/__tests__/no-pixel-border.test.mjs eslint/__tests__/no-mixed-style-authority.test.mjs eslint/__tests__/no-hardcoded-motion.test.mjs eslint/__tests__/root-eslint-config.test.mjs
```

Expected: PASS.

**Step 3: Run the generator/consumer sync checks**

Run:

```bash
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts app/playground/__tests__/manifest-radiants-sync.test.ts app/playground/__tests__/registry-freshness.test.ts
pnpm --filter @rdna/radiants test:components -- registry/__tests__/registry-metadata.test.ts
```

Expected: PASS.

**Step 4: Commit**

```bash
git add packages/radiants/generated/eslint-contract.json packages/radiants/generated/ai-contract.json tools/playground/generated/registry.manifest.json
git commit -m "test(contract): verify post-token-map direct contract pipeline"
```
