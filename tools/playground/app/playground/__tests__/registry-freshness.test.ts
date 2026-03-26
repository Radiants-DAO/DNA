import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CHECKED_PATHS,
  getRepoRoot,
} from "../../../scripts/check-registry-freshness.mjs";

describe("check-registry-freshness", () => {
  it("tracks both generated radiants barrels and the playground manifest", () => {
    expect(CHECKED_PATHS).toEqual(
      expect.arrayContaining([
        "packages/radiants/meta/index.ts",
        "packages/radiants/schemas/index.ts",
        "tools/playground/generated/registry.manifest.json",
      ]),
    );
  });

  it("tracks generated design-contract artifacts", () => {
    expect(CHECKED_PATHS).toEqual(
      expect.arrayContaining([
        "packages/radiants/generated/eslint-contract.json",
        "packages/radiants/generated/ai-contract.json",
        "packages/radiants/generated/figma",
        ".component-contracts.example",
      ]),
    );
  });

  it("resolves repo-root-relative paths from the script location", () => {
    expect(
      getRepoRoot("/repo/tools/playground/scripts/check-registry-freshness.mjs"),
    ).toBe("/repo");
  });

  it("makes registry:generate regenerate radiants schemas before the manifest", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(getRepoRoot(), "tools/playground/package.json"), "utf8"),
    ) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["registry:generate"]).toContain(
      "pnpm --filter @rdna/radiants generate:schemas",
    );
    expect(packageJson.scripts?.["registry:generate"]).toContain(
      "pnpm --filter @rdna/radiants generate:figma-contracts",
    );
    expect(packageJson.scripts?.["registry:generate"]).toContain(
      "scripts/generate-registry.ts",
    );
  });
});
