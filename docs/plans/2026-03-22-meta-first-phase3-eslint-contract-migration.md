# Meta-First Phase 3 ESLint Contract Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the remaining contract-aware ESLint rules and root config off `token-map.mjs` and onto one generated-contract loader, while keeping the plugin resilient if generated JSON is missing or invalid.

**Architecture:** This app has never shipped, so the end state is direct rule imports from `packages/radiants/eslint/contract.mjs`, not another compatibility bridge. That is an intentional deviation from the earlier research recommendation to re-export through `token-map.mjs`: Phase 4 deletes `token-map.mjs` entirely, and there is no compatibility burden to preserve. The one place Phase 3 must stay conservative is loader failure handling. `eslint/index.mjs` eagerly registers all 14 rules, so `contract.mjs` must catch only `MODULE_NOT_FOUND` and `SyntaxError`, return an empty contract for those cases, and rethrow everything else. Rollback before Phase 4 is straightforward: revert rule/config imports from `contract.mjs` back to `token-map.mjs`.

**Tech Stack:** ESLint flat config, Node 22 ESM, `createRequire`, Vitest, JSON generated artifacts, pnpm workspaces

**Relevant skills:** @test-driven-development, @verification-before-completion

---

### Prerequisite Gate

Run:

```bash
pnpm --filter @rdna/playground registry:generate
node -e 'const c=require("./packages/radiants/generated/eslint-contract.json"); const required=["surface-primary","content-primary","edge-primary","status-success"]; if(!required.every((v)=>c.tokenMap.semanticColorSuffixes.includes(v))) process.exit(1); const forbidden=["primary","secondary","outline","ghost","destructive"]; if(forbidden.some((v)=>c.themeVariants.includes(v))) process.exit(2);'
```

Expected:

- the generated contract exists
- `semanticColorSuffixes` includes the expanded suffixes used by the migrated rules
- `themeVariants` does not regress to the stale legacy values

If this gate fails, stop and fix Phase 2 generation first. Do not move rule imports to `contract.mjs` until the generated JSON is correct.

### Task 1: Create The Guarded Contract Loader And Migrate Priority Batch 1-3

**Files:**
- Create: `packages/radiants/eslint/contract.mjs`
- Create: `packages/radiants/eslint/__tests__/contract-surface.test.mjs`
- Create: `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs`
- Modify: `packages/radiants/eslint/rules/prefer-rdna-components.mjs`
- Modify: `packages/radiants/eslint/rules/no-hardcoded-colors.mjs`
- Modify: `packages/radiants/eslint/rules/no-removed-aliases.mjs`
- Modify: `packages/radiants/eslint/__tests__/prefer-rdna-components.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/no-removed-aliases.test.mjs`

**Step 1: Write the failing tests**

Create `packages/radiants/eslint/__tests__/contract-surface.test.mjs`:

```js
import { describe, expect, it } from "vitest";
import {
  componentMap,
  loadContract,
  textLikeInputTypes,
  themeVariants,
  tokenMap,
} from "../contract.mjs";

describe("eslint contract surface", () => {
  it("exposes expanded semantic color suffixes and corrected theme variants", () => {
    expect(tokenMap.semanticColorSuffixes).toEqual(
      expect.arrayContaining([
        "surface-primary",
        "content-primary",
        "edge-primary",
        "status-success",
      ]),
    );
    expect(themeVariants).toEqual(
      expect.arrayContaining([
        "default",
        "raised",
        "inverted",
        "success",
        "warning",
        "error",
        "info",
      ]),
    );
    expect(themeVariants).not.toContain("primary");
  });

  it("exposes live replacement-map entries from the generated contract", () => {
    expect(componentMap.button.component).toBe("Button");
    expect(componentMap.meter.component).toBe("Meter");
    expect(textLikeInputTypes).toEqual(
      expect.arrayContaining(["text", "email", "search", "number"]),
    );
  });

  it("falls back only for missing or invalid generated JSON", () => {
    expect(
      loadContract(() => {
        throw Object.assign(new Error("missing"), { code: "MODULE_NOT_FOUND" });
      }).componentMap,
    ).toEqual({});

    expect(
      loadContract(() => {
        throw new SyntaxError("bad json");
      }).componentMap,
    ).toEqual({});

    expect(() =>
      loadContract(() => {
        throw new TypeError("unexpected");
      }),
    ).toThrow("unexpected");
  });
});
```

Create `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs`:

```js
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  "../rules/prefer-rdna-components.mjs",
  "../rules/no-hardcoded-colors.mjs",
  "../rules/no-removed-aliases.mjs",
];

describe("priority rule import sources", () => {
  it("reads direct contract exports instead of token-map", () => {
    for (const path of files) {
      const source = readFileSync(new URL(path, import.meta.url), "utf8");
      expect(source).toContain("../contract.mjs");
      expect(source).not.toContain("token-map.mjs");
    }
  });
});
```

Extend `packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs` with an explicit OKLCH autofix regression that must keep using the generated-contract mapping:

```js
{
  code: '<div className="bg-[oklch(0.9780_0.0295_94.34)]" />',
  errors: [{ messageId: "arbitraryColor" }],
  output: '<div className="bg-page" />',
}
```

That case already exists in spirit today; keep it in this task so the migration proves the rule did not drift back to legacy token names.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/contract-surface.test.mjs eslint/__tests__/rule-import-sources.test.mjs eslint/__tests__/prefer-rdna-components.test.mjs eslint/__tests__/no-hardcoded-colors.test.mjs eslint/__tests__/no-removed-aliases.test.mjs
```

Expected: FAIL because `contract.mjs` does not exist and the rules still import `token-map.mjs`.

**Step 3: Create the guarded loader and migrate the first batch**

Create `packages/radiants/eslint/contract.mjs`:

```js
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const EMPTY_CONTRACT = Object.freeze({
  tokenMap: {
    brandPalette: {},
    hexToSemantic: {},
    oklchToSemantic: {},
    removedAliases: [],
    semanticColorSuffixes: [],
  },
  componentMap: {},
  components: {},
  pixelCorners: { triggerClasses: [], shadowMigrationMap: {} },
  themeVariants: [],
  motion: { maxDurationMs: 0, allowedEasings: [], durationTokens: [], easingTokens: [] },
  shadows: { validStandard: [], validPixel: [], validGlow: [] },
  typography: { validSizes: [], validWeights: [] },
  textLikeInputTypes: [],
});

function defaultReadContract() {
  return require("../generated/eslint-contract.json");
}

export function loadContract(readContract = defaultReadContract) {
  try {
    return readContract();
  } catch (error) {
    if (error?.code === "MODULE_NOT_FOUND" || error instanceof SyntaxError) {
      return EMPTY_CONTRACT;
    }
    throw error;
  }
}

export const contract = loadContract();
export const tokenMap = contract.tokenMap;
export const componentMap = contract.componentMap;
export const components = contract.components ?? {};
export const pixelCorners = contract.pixelCorners;
export const themeVariants = contract.themeVariants;
export const motion = contract.motion;
export const shadows = contract.shadows;
export const typography = contract.typography;
export const textLikeInputTypes = contract.textLikeInputTypes;
```

Update `packages/radiants/eslint/rules/prefer-rdna-components.mjs` to rename `rdnaComponentMap` to `componentMap` and import it from `../contract.mjs`:

```js
import { componentMap, textLikeInputTypes } from "../contract.mjs";
```

Update `packages/radiants/eslint/rules/no-hardcoded-colors.mjs` to import `tokenMap` from `../contract.mjs` and destructure:

```js
const { brandPalette, hexToSemantic, oklchToSemantic, semanticColorSuffixes, removedAliases } =
  tokenMap;
```

Update `packages/radiants/eslint/rules/no-removed-aliases.mjs` to import `tokenMap` from `../contract.mjs` and use `tokenMap.removedAliases`.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/contract-surface.test.mjs eslint/__tests__/rule-import-sources.test.mjs eslint/__tests__/prefer-rdna-components.test.mjs eslint/__tests__/no-hardcoded-colors.test.mjs eslint/__tests__/no-removed-aliases.test.mjs
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/eslint/contract.mjs packages/radiants/eslint/__tests__/contract-surface.test.mjs packages/radiants/eslint/__tests__/rule-import-sources.test.mjs packages/radiants/eslint/rules/prefer-rdna-components.mjs packages/radiants/eslint/rules/no-hardcoded-colors.mjs packages/radiants/eslint/rules/no-removed-aliases.mjs packages/radiants/eslint/__tests__/prefer-rdna-components.test.mjs packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs packages/radiants/eslint/__tests__/no-removed-aliases.test.mjs
git commit -m "refactor(eslint): load first rule batch from contract"
```

### Task 2: Move Pixel-Corner Rules To `pixelCorners` Contract Data

**Files:**
- Create: `packages/radiants/eslint/__tests__/pixel-corner-contract.test.mjs`
- Create: `packages/radiants/eslint/__tests__/no-clipped-shadow.test.mjs`
- Create: `packages/radiants/eslint/__tests__/no-pixel-border.test.mjs`
- Modify: `packages/radiants/eslint/rules/no-clipped-shadow.mjs`
- Modify: `packages/radiants/eslint/rules/no-pixel-border.mjs`
- Modify: `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs`

**Step 1: Write the failing tests**

Create `packages/radiants/eslint/__tests__/pixel-corner-contract.test.mjs`:

```js
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pixelCorners } from "../contract.mjs";

describe("pixel-corner contract surface", () => {
  it("exposes trigger classes and the shadow migration map", () => {
    expect(pixelCorners.triggerClasses).toEqual(
      expect.arrayContaining(["pixel-rounded-xs", "pixel-rounded-md", "pixel-corners"]),
    );
    expect(pixelCorners.shadowMigrationMap["shadow-raised"]).toBe("pixel-shadow-raised");
  });

  it("keeps the pixel-corner rules on direct contract imports", () => {
    for (const path of ["../rules/no-clipped-shadow.mjs", "../rules/no-pixel-border.mjs"]) {
      const source = readFileSync(new URL(path, import.meta.url), "utf8");
      expect(source).toContain("../contract.mjs");
      expect(source).not.toContain("token-map.mjs");
    }
  });
});
```

Create `packages/radiants/eslint/__tests__/no-clipped-shadow.test.mjs` covering:

- same-element `pixel-rounded-xs shadow-raised`
- clipped ancestor case
- suggestion text for `shadow-glow-success`

Create `packages/radiants/eslint/__tests__/no-pixel-border.test.mjs` covering:

- `pixel-rounded-xs border-line`
- `pixel-corners overflow-hidden`
- no report for plain `rounded-md border-line`

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/pixel-corner-contract.test.mjs eslint/__tests__/no-clipped-shadow.test.mjs eslint/__tests__/no-pixel-border.test.mjs
```

Expected: FAIL because these tests do not exist and both rules still depend on `token-map.mjs`.

**Step 3: Rebuild both rules from `pixelCorners`**

Update `packages/radiants/eslint/rules/no-clipped-shadow.mjs` and `no-pixel-border.mjs` to import:

```js
import { pixelCorners } from "../contract.mjs";
```

In both rules, build the trigger regex from `pixelCorners.triggerClasses`:

```js
const pixelCornerPattern = pixelCorners.triggerClasses
  .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");
const PIXEL_CORNER_RE = new RegExp(`(?:^|\\s)(?:[\\w-]+:)*(?:${pixelCornerPattern})(?:\\s|$)`);
```

Use `pixelCorners.shadowMigrationMap` instead of the old local migration table.

Extend `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs` to include both pixel-corner rules.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/pixel-corner-contract.test.mjs eslint/__tests__/no-clipped-shadow.test.mjs eslint/__tests__/no-pixel-border.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/eslint/__tests__/pixel-corner-contract.test.mjs packages/radiants/eslint/__tests__/no-clipped-shadow.test.mjs packages/radiants/eslint/__tests__/no-pixel-border.test.mjs packages/radiants/eslint/rules/no-clipped-shadow.mjs packages/radiants/eslint/rules/no-pixel-border.mjs packages/radiants/eslint/__tests__/rule-import-sources.test.mjs
git commit -m "refactor(eslint): load pixel-corner rules from contract"
```

### Task 3: Move `no-mixed-style-authority` To Contract-Owned Style Data

**Files:**
- Modify: `packages/radiants/eslint/rules/no-mixed-style-authority.mjs`
- Modify: `packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/root-eslint-config.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs`
- Modify: `eslint.rdna.config.mjs`

**Step 1: Write the failing tests**

In `packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs`, add:

```js
it("flags theme-owned variants without requiring rule options", () => {
  const linter = new Linter({ configType: "eslintrc" });
  linter.defineRule("rdna/no-mixed-style-authority", rule);

  const result = linter.verify(
    `
      function Card() {
        return <div data-variant="raised" className="bg-surface-primary text-content-primary" />;
      }
    `,
    {
      parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
      rules: { "rdna/no-mixed-style-authority": "error" },
    },
  );

  expect(result).toHaveLength(1);
  expect(result[0].message).toContain("raised");
});
```

Also add a graceful-degradation test for empty contract data by exporting a pure helper from the rule:

```js
it("degrades cleanly when contract style data is empty", () => {
  expect([...deriveThemeOwnedVariants({}, [], undefined)]).toEqual([]);
});
```

Replace the assertion in `packages/radiants/eslint/__tests__/root-eslint-config.test.mjs` with:

```js
expect(internalsBlock.rules["rdna/no-mixed-style-authority"]).toBe("error");
```

Extend `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs` to include `../rules/no-mixed-style-authority.mjs` and `../../../../eslint.rdna.config.mjs`.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/no-mixed-style-authority.test.mjs eslint/__tests__/root-eslint-config.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: FAIL because the rule still depends on option injection and the root config still imports `themeVariants` from `token-map.mjs`.

**Step 3: Aggregate theme-owned style data from contract exports**

Update `packages/radiants/eslint/rules/no-mixed-style-authority.mjs`:

```js
import { components, themeVariants } from "../contract.mjs";

export function deriveThemeOwnedVariants(
  contractComponents = components,
  contractThemeVariants = themeVariants,
  overrideVariants,
) {
  const defaultThemeOwnedVariants = new Set([
    ...contractThemeVariants,
    ...Object.values(contractComponents).flatMap((component) =>
      component.styleOwnership?.flatMap((owner) => owner.themeOwned) ?? [],
    ),
  ]);

  return new Set(overrideVariants ?? [...defaultThemeOwnedVariants]);
}
```

Use `deriveThemeOwnedVariants()` inside the rule instead of assuming `options.themeVariants` is always present.

Update `eslint.rdna.config.mjs` to:

```js
"rdna/no-mixed-style-authority": "error",
```

and remove the `themeVariants` import entirely.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/no-mixed-style-authority.test.mjs eslint/__tests__/root-eslint-config.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/eslint/rules/no-mixed-style-authority.mjs packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs packages/radiants/eslint/__tests__/root-eslint-config.test.mjs packages/radiants/eslint/__tests__/rule-import-sources.test.mjs eslint.rdna.config.mjs
git commit -m "refactor(eslint): source mixed-style authority checks from contract"
```

### Task 4: Move `no-hardcoded-motion` Suggestions To `motion` Contract Exports

**Files:**
- Create: `packages/radiants/eslint/__tests__/no-hardcoded-motion-contract.test.mjs`
- Modify: `packages/radiants/eslint/rules/no-hardcoded-motion.mjs`
- Modify: `packages/radiants/eslint/__tests__/no-hardcoded-motion.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs`

**Step 1: Write the failing tests**

Create `packages/radiants/eslint/__tests__/no-hardcoded-motion-contract.test.mjs`:

```js
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { motion } from "../contract.mjs";

describe("no-hardcoded-motion contract wiring", () => {
  it("exposes both class-token and css-variable motion suggestions", () => {
    expect(motion.allowedEasings).toEqual(expect.arrayContaining(["ease-standard"]));
    expect(motion.easingTokens).toEqual(expect.arrayContaining(["--easing-default"]));
    expect(motion.durationTokens).toEqual(
      expect.arrayContaining(["duration-base", "duration-slow"]),
    );
  });

  it("keeps the rule on direct contract imports", () => {
    const source = readFileSync(new URL("../rules/no-hardcoded-motion.mjs", import.meta.url), "utf8");
    expect(source).toContain("../contract.mjs");
    expect(source).not.toContain("token-map.mjs");
  });
});
```

Extend `packages/radiants/eslint/__tests__/no-hardcoded-motion.test.mjs` with one assertion that resolves the naming discrepancy explicitly:

- className guidance must mention `ease-standard`
- style-prop guidance must mention `--easing-default`

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/no-hardcoded-motion-contract.test.mjs eslint/__tests__/no-hardcoded-motion.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: FAIL because the rule still hardcodes its motion suggestions.

**Step 3: Build rule messages from the `motion` contract**

Update `packages/radiants/eslint/rules/no-hardcoded-motion.mjs`:

```js
import { motion } from "../contract.mjs";

const classEasingSuggestion = motion.allowedEasings.join(", ");
const cssEasingSuggestion = motion.easingTokens.join(", ");
const durationSuggestion = motion.durationTokens.join(", ");
```

Use:

- `classEasingSuggestion` for Tailwind utility guidance
- `cssEasingSuggestion` for CSS variable guidance
- `durationSuggestion` everywhere duration tokens are mentioned

Extend `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs` to include `../rules/no-hardcoded-motion.mjs`.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/no-hardcoded-motion-contract.test.mjs eslint/__tests__/no-hardcoded-motion.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/eslint/__tests__/no-hardcoded-motion-contract.test.mjs packages/radiants/eslint/rules/no-hardcoded-motion.mjs packages/radiants/eslint/__tests__/no-hardcoded-motion.test.mjs packages/radiants/eslint/__tests__/rule-import-sources.test.mjs
git commit -m "refactor(eslint): source motion suggestions from contract"
```

### Task 5: Move `no-raw-shadow` And `no-hardcoded-typography` To Contract Data

**Files:**
- Create: `packages/radiants/eslint/__tests__/shadow-typography-contract.test.mjs`
- Modify: `packages/radiants/eslint/rules/no-raw-shadow.mjs`
- Modify: `packages/radiants/eslint/rules/no-hardcoded-typography.mjs`
- Modify: `packages/radiants/eslint/__tests__/no-raw-shadow.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/no-hardcoded-typography.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs`

**Step 1: Write the failing tests**

Create `packages/radiants/eslint/__tests__/shadow-typography-contract.test.mjs`:

```js
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { shadows, typography } from "../contract.mjs";

describe("shadow and typography contract wiring", () => {
  it("exposes contract-backed suggestion lists", () => {
    expect(shadows.validStandard).toEqual(expect.arrayContaining(["shadow-raised", "shadow-card"]));
    expect(shadows.validPixel).toEqual(expect.arrayContaining(["pixel-shadow-raised"]));
    expect(typography.validSizes).toEqual(expect.arrayContaining(["text-base", "text-xl"]));
    expect(typography.validWeights).toEqual(expect.arrayContaining(["font-semibold", "font-bold"]));
  });

  it("keeps both rules on direct contract imports", () => {
    for (const path of ["../rules/no-raw-shadow.mjs", "../rules/no-hardcoded-typography.mjs"]) {
      const source = readFileSync(new URL(path, import.meta.url), "utf8");
      expect(source).toContain("../contract.mjs");
      expect(source).not.toContain("token-map.mjs");
    }
  });
});
```

Extend the existing rule tests so they assert message text is built from current contract values, not hardcoded arrays.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/shadow-typography-contract.test.mjs eslint/__tests__/no-raw-shadow.test.mjs eslint/__tests__/no-hardcoded-typography.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: FAIL because both rules still hardcode RDNA lists locally.

**Step 3: Build messages from `shadows` and `typography`**

Update `packages/radiants/eslint/rules/no-raw-shadow.mjs`:

```js
import { shadows } from "../contract.mjs";

const allowedShadowTokens = [
  ...shadows.validStandard,
  ...shadows.validPixel,
  ...shadows.validGlow,
];
```

Update `packages/radiants/eslint/rules/no-hardcoded-typography.mjs`:

```js
import { typography } from "../contract.mjs";

const sizeSuggestion = typography.validSizes.join(", ");
const weightSuggestion = typography.validWeights.join(", ");
```

Extend `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs` to include both rule files.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/shadow-typography-contract.test.mjs eslint/__tests__/no-raw-shadow.test.mjs eslint/__tests__/no-hardcoded-typography.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/eslint/__tests__/shadow-typography-contract.test.mjs packages/radiants/eslint/rules/no-raw-shadow.mjs packages/radiants/eslint/rules/no-hardcoded-typography.mjs packages/radiants/eslint/__tests__/no-raw-shadow.test.mjs packages/radiants/eslint/__tests__/no-hardcoded-typography.test.mjs packages/radiants/eslint/__tests__/rule-import-sources.test.mjs
git commit -m "refactor(eslint): source shadow and typography rules from contract"
```

### Task 6: Introduce `structuralRules` Only Now That `eslint-contract.json` Can Carry It

**Files:**
- Modify: `packages/preview/src/types.ts`
- Modify: `packages/preview/src/index.ts`
- Modify: `packages/preview/src/__tests__/component-meta.test.ts`
- Modify: `packages/preview/src/generate-schemas.ts`
- Modify: `packages/preview/src/__tests__/generate-schemas.test.ts`
- Modify: `packages/radiants/registry/contract-fields.ts`
- Modify: `tools/playground/scripts/load-radiants-component-contracts.ts`
- Modify: `tools/playground/scripts/build-radiants-contract.ts`
- Modify: `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts`

**Step 1: Write the failing tests**

Extend the preview metadata tests with:

```ts
it("supports structuralRules once eslint-contract consumes them", () => {
  const meta = defineComponentMeta<Record<string, unknown>>()({
    name: "Card",
    description: "Card",
    props: {},
    structuralRules: [
      {
        ruleId: "rdna/no-pixel-border",
        reason: "pixel corners own the border layer",
      },
    ],
  });

  expect(meta.structuralRules?.[0]?.ruleId).toBe("rdna/no-pixel-border");
});
```

Extend `tools/playground/app/playground/__tests__/build-radiants-contract.test.ts` with:

```ts
it("projects structuralRules into eslint contract component sections", async () => {
  const { eslintContract } = await buildRadiantsContractsFromComponents(
    radiantsSystemContract,
    [
      {
        name: "Card",
        sourcePath: "packages/radiants/components/core/Card/Card.tsx",
        structuralRules: [
          {
            ruleId: "rdna/no-pixel-border",
            reason: "pixel corners own the border layer",
          },
        ],
      },
    ],
  );

  expect(eslintContract.components.Card.structuralRules).toEqual([
    {
      ruleId: "rdna/no-pixel-border",
      reason: "pixel corners own the border layer",
    },
  ]);
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/component-meta.test.ts ../preview/src/__tests__/generate-schemas.test.ts --cache=false
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
```

Expected: FAIL because `structuralRules` was intentionally deferred in Phase 2 and is not yet part of the contract pipeline.

**Step 3: Thread `structuralRules` through the contract pipeline**

Add to `packages/preview/src/types.ts`:

```ts
export interface StructuralRule {
  ruleId: string;
  reason: string;
  mechanism?: string;
}
```

Extend `ComponentMeta<TProps>` with:

```ts
structuralRules?: StructuralRule[];
```

Strip it from generated preview schema output.

Update `packages/radiants/registry/contract-fields.ts` and `tools/playground/scripts/load-radiants-component-contracts.ts` to carry it.

Update `tools/playground/scripts/build-radiants-contract.ts` so `eslintContract.components[componentName]` may include:

```ts
structuralRules?: StructuralRule[];
```

This task stops at contract projection. Do not invent a new runtime rule dependency just to justify the field.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run ../preview/src/__tests__/component-meta.test.ts ../preview/src/__tests__/generate-schemas.test.ts --cache=false
pnpm --filter @rdna/playground test -- app/playground/__tests__/build-radiants-contract.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/preview/src/types.ts packages/preview/src/index.ts packages/preview/src/__tests__/component-meta.test.ts packages/preview/src/generate-schemas.ts packages/preview/src/__tests__/generate-schemas.test.ts packages/radiants/registry/contract-fields.ts tools/playground/scripts/load-radiants-component-contracts.ts tools/playground/scripts/build-radiants-contract.ts tools/playground/app/playground/__tests__/build-radiants-contract.test.ts
git commit -m "feat(contract): project structural rules into eslint contract"
```
