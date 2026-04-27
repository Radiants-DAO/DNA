import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pixelCorners } from "../contract.mjs";

describe("pixel-corner contract surface", () => {
  it("exposes trigger classes and the shadow migration map", () => {
    expect(pixelCorners.triggerClasses).toEqual(
      expect.arrayContaining([
        "pixel-rounded-2",
        "pixel-rounded-8",
        "pixel-rounded-full",
        "pixel-corner",
        "pixel-concave-corner",
      ]),
    );
    expect(pixelCorners.triggerClasses).not.toEqual(
      expect.arrayContaining([
        "pixel-rounded-xs",
        "pixel-rounded-md",
        "pixel-corners",
        "pixel-bleed-tl-6",
        "pixel-bleed-br-12",
      ]),
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
