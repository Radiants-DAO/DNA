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
