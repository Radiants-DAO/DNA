import { describe, expect, it } from "vitest";
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

  it("resolves repo-root-relative paths from the script location", () => {
    expect(
      getRepoRoot("/repo/tools/playground/scripts/check-registry-freshness.mjs"),
    ).toBe("/repo");
  });
});
