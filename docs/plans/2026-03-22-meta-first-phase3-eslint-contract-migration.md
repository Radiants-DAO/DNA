# Meta-First Phase 3 ESLint Contract Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish the ranked ESLint migrations by removing remaining inline rule/config data and making the active rules consume generated contract data directly, with no transitional compatibility layer.

**Architecture:** This app has never shipped, so Phase 3 should cut straight to the target shape. Create one `packages/radiants/eslint/contract.mjs` module that loads `packages/radiants/generated/eslint-contract.json` and exports normalized contract sections. Rules and config should import that module directly. Do not add new `token-map.mjs` exports, bridge tests, or fallback logic.

**Tech Stack:** ESLint flat config, Node 22 ESM, `createRequire`, Vitest, JSON generated artifacts, pnpm workspaces

**Relevant skills:** @test-driven-development, @verification-before-completion

---

### Task 1: Create The Direct Contract Loader And Migrate Priority Batch 1-3

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
  textLikeInputTypes,
  tokenMap,
} from "../contract.mjs";

describe("eslint contract surface", () => {
  it("exposes token data from the generated contract", () => {
    expect(tokenMap.semanticColorSuffixes).toEqual(
      expect.arrayContaining(["content-primary", "edge-primary", "status-success"]),
    );
    expect(tokenMap.removedAliases).toEqual(
      expect.arrayContaining(["--color-black", "--color-white"]),
    );
  });

  it("exposes the replacement map and text-like input types", () => {
    expect(componentMap.label.component).toBe("Label");
    expect(componentMap.meter.component).toBe("Meter");
    expect(textLikeInputTypes).toEqual(
      expect.arrayContaining(["text", "email", "search", "number"]),
    );
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

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/contract-surface.test.mjs eslint/__tests__/rule-import-sources.test.mjs eslint/__tests__/prefer-rdna-components.test.mjs eslint/__tests__/no-hardcoded-colors.test.mjs eslint/__tests__/no-removed-aliases.test.mjs
```

Expected: FAIL because `contract.mjs` does not exist and the rules still import `token-map.mjs`.

**Step 3: Create the fail-fast contract loader and migrate the first rule batch**

Create `packages/radiants/eslint/contract.mjs`:

```js
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export const contract = require("../generated/eslint-contract.json");
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

Do not wrap the load in `try/catch`. Missing or invalid generated JSON should fail hard.

Update `packages/radiants/eslint/rules/prefer-rdna-components.mjs`:

```js
import { componentMap, textLikeInputTypes } from "../contract.mjs";

const bannedElements = new Set(Object.keys(componentMap));
const textLikeInputTypeSet = new Set(textLikeInputTypes);
```

Update `packages/radiants/eslint/rules/no-hardcoded-colors.mjs` to import `tokenMap` from `../contract.mjs` and destructure:

```js
const { brandPalette, hexToSemantic, oklchToSemantic, semanticColorSuffixes } = tokenMap;
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
git commit -m "refactor(eslint): load priority rules from direct contract exports"
```

### Task 2: Migrate `no-clipped-shadow` And `no-pixel-border` To Direct Contract Sections

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

  it("keeps pixel-corner rules on direct contract imports", () => {
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
- ancestor clipping
- `shadow-glow-success` suggestion text

Create `packages/radiants/eslint/__tests__/no-pixel-border.test.mjs` covering:

- `pixel-rounded-xs border-line`
- `pixel-corners overflow-hidden`
- no report for plain `rounded-md border-line`

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/pixel-corner-contract.test.mjs eslint/__tests__/no-clipped-shadow.test.mjs eslint/__tests__/no-pixel-border.test.mjs
```

Expected: FAIL because these tests do not exist and the rules still import `token-map.mjs`.

**Step 3: Rebuild both rules from `pixelCorners` contract data**

Update `packages/radiants/eslint/rules/no-clipped-shadow.mjs`:

```js
import { pixelCorners } from "../contract.mjs";
```

Build the trigger regex from `pixelCorners.triggerClasses`:

```js
const pixelCornerPattern = pixelCorners.triggerClasses
  .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");
const PIXEL_CORNER_RE = new RegExp(`(?:^|\\s)(?:[\\w-]+:)*(?:${pixelCornerPattern})(?:\\s|$)`);
```

Replace the local shadow suggestion table with `pixelCorners.shadowMigrationMap`.

Update `packages/radiants/eslint/rules/no-pixel-border.mjs` to import `pixelCorners` from `../contract.mjs` and build the same trigger regex from `pixelCorners.triggerClasses`.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/pixel-corner-contract.test.mjs eslint/__tests__/no-clipped-shadow.test.mjs eslint/__tests__/no-pixel-border.test.mjs
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/eslint/__tests__/pixel-corner-contract.test.mjs packages/radiants/eslint/__tests__/no-clipped-shadow.test.mjs packages/radiants/eslint/__tests__/no-pixel-border.test.mjs packages/radiants/eslint/rules/no-clipped-shadow.mjs packages/radiants/eslint/rules/no-pixel-border.mjs packages/radiants/eslint/__tests__/rule-import-sources.test.mjs
git commit -m "refactor(eslint): load pixel-corner rules from contract"
```

### Task 3: Move `no-mixed-style-authority` To Contract-Owned Style Data And Drop Config Plumbing

**Files:**
- Modify: `packages/radiants/eslint/rules/no-mixed-style-authority.mjs`
- Modify: `packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/root-eslint-config.test.mjs`
- Modify: `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs`
- Modify: `eslint.rdna.config.mjs`

**Step 1: Write the failing tests**

Add this case to `packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs`:

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

Replace the assertion in `packages/radiants/eslint/__tests__/root-eslint-config.test.mjs` with:

```js
expect(internalsBlock.rules["rdna/no-mixed-style-authority"]).toBe("error");
```

Extend `packages/radiants/eslint/__tests__/rule-import-sources.test.mjs` to include `../rules/no-mixed-style-authority.mjs` and `../../../../eslint.rdna.config.mjs`, asserting they do not import `token-map.mjs`.

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/no-mixed-style-authority.test.mjs eslint/__tests__/root-eslint-config.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: FAIL because the rule currently depends on option injection and the root config still wires those options.

**Step 3: Teach the rule to aggregate contract-owned style data**

Update `packages/radiants/eslint/rules/no-mixed-style-authority.mjs`:

```js
import { components, themeVariants } from "../contract.mjs";
```

Default rule behavior should aggregate:

```js
const defaultThemeOwnedVariants = new Set([
  ...themeVariants,
  ...Object.values(components).flatMap((component) =>
    component.styleOwnership?.flatMap((owner) => owner.themeOwned) ?? [],
  ),
]);
const themeOwnedVariants = new Set(options.themeVariants ?? [...defaultThemeOwnedVariants]);
```

Keep `options.themeVariants` only as an explicit override for targeted tests, not as required runtime plumbing.

Update `eslint.rdna.config.mjs` to:

```js
"rdna/no-mixed-style-authority": "error",
```

and remove any `themeVariants` imports.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/no-mixed-style-authority.test.mjs eslint/__tests__/root-eslint-config.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/eslint/rules/no-mixed-style-authority.mjs packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs packages/radiants/eslint/__tests__/root-eslint-config.test.mjs packages/radiants/eslint/__tests__/rule-import-sources.test.mjs eslint.rdna.config.mjs
git commit -m "refactor(eslint): source style authority checks from contract"
```

### Task 4: Move `no-hardcoded-motion` Suggestions To Direct Contract Exports

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
  it("exposes motion token suggestions through the contract", () => {
    expect(motion.durationTokens).toEqual(
      expect.arrayContaining(["duration-base", "duration-slow"]),
    );
    expect(motion.allowedEasings).toEqual(expect.arrayContaining(["ease-standard"]));
  });

  it("keeps the rule on direct contract imports", () => {
    const source = readFileSync(new URL("../rules/no-hardcoded-motion.mjs", import.meta.url), "utf8");
    expect(source).toContain("../contract.mjs");
    expect(source).not.toContain("token-map.mjs");
  });
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- eslint/__tests__/no-hardcoded-motion-contract.test.mjs eslint/__tests__/no-hardcoded-motion.test.mjs eslint/__tests__/rule-import-sources.test.mjs
```

Expected: FAIL because the rule still hardcodes its token suggestions and import path.

**Step 3: Build rule messages from `motion` contract exports**

Update `packages/radiants/eslint/rules/no-hardcoded-motion.mjs`:

```js
import { motion } from "../contract.mjs";

const durationSuggestion = motion.durationTokens.join(", ");
const easingSuggestion = motion.allowedEasings.join(", ");
```

Then use `durationSuggestion` and `easingSuggestion` in `meta.messages`.

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
