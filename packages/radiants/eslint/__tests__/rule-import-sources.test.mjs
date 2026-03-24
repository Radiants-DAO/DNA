import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  { path: "../rules/prefer-rdna-components.mjs", expectedImport: "../contract.mjs" },
  { path: "../rules/no-hardcoded-colors.mjs", expectedImport: "../contract.mjs" },
  { path: "../rules/no-removed-aliases.mjs", expectedImport: "../contract.mjs" },
  { path: "../rules/no-clipped-shadow.mjs", expectedImport: "../contract.mjs" },
  { path: "../rules/no-pixel-border.mjs", expectedImport: "../contract.mjs" },
  { path: "../rules/no-mixed-style-authority.mjs", expectedImport: "../contract.mjs" },
  { path: "../../../../eslint.rdna.config.mjs" },
];

describe("priority rule import sources", () => {
  it("reads direct contract exports instead of token-map", () => {
    for (const { path, expectedImport } of files) {
      const source = readFileSync(new URL(path, import.meta.url), "utf8");
      if (expectedImport) {
        expect(source).toContain(expectedImport);
      }
      expect(source).not.toContain("token-map.mjs");
    }
  });
});
