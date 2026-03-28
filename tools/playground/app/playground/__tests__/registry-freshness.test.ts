import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CHECKED_PATHS,
  getFreshnessStatus,
  getRepoRoot,
} from "../../../scripts/check-registry-freshness.mjs";
import {
  CONTRACT_FRESHNESS_PATH,
  REGISTRY_FRESHNESS_PATH,
  computeGeneratedArtifactFreshness,
} from "../../../scripts/generated-artifact-hashes.mjs";

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
        CONTRACT_FRESHNESS_PATH,
        "packages/radiants/generated/figma",
        ".component-contracts.example",
        REGISTRY_FRESHNESS_PATH,
      ]),
    );
  });

  it("does not treat authored Radiants sources as generated diff targets", () => {
    expect(CHECKED_PATHS).not.toContain("packages/radiants/components/core");
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

  it("computes stable source hashes for both registry and contract artifacts", () => {
    const freshness = computeGeneratedArtifactFreshness(getRepoRoot());

    expect(freshness.radiantsContracts).toEqual(
      expect.objectContaining({
        sourceHash: expect.any(String),
        inputs: expect.arrayContaining([
          "packages/radiants/contract/system.ts",
          "packages/radiants/meta/index.ts",
        ]),
      }),
    );
    expect(freshness.registryManifest).toEqual(
      expect.objectContaining({
        sourceHash: expect.any(String),
        inputs: expect.arrayContaining([
          "tools/playground/scripts/generate-registry.ts",
          "packages/radiants/components/core/Button/Button.schema.json",
        ]),
      }),
    );
  });

  it("reports the committed freshness files as current", () => {
    const status = getFreshnessStatus(getRepoRoot());

    expect(status.radiantsContracts).toBe(true);
    expect(status.registryManifest).toBe(true);
  });
});
