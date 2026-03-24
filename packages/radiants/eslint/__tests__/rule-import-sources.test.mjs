import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  "../rules/prefer-rdna-components.mjs",
  "../rules/no-hardcoded-colors.mjs",
  "../rules/no-removed-aliases.mjs",
  "../rules/no-clipped-shadow.mjs",
  "../rules/no-pixel-border.mjs",
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
