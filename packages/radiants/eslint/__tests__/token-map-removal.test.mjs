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
  join(testDir, "root-eslint-config.test.mjs"),
  join(testDir, "../../../../eslint.rdna.config.mjs"),
];

describe("token-map removal", () => {
  it("removes token-map.mjs entirely", () => {
    expect(existsSync(join(eslintRoot, "token-map.mjs"))).toBe(false);
  });

  it("keeps the old import path out of remaining rule/config sources", () => {
    for (const path of sourceFiles) {
      const source = readFileSync(path, "utf8");
      expect(source).not.toContain("token-map.mjs");
    }
  });
});
