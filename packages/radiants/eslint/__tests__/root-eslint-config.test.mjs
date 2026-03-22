import { describe, expect, it } from "vitest";
import rootConfig from "../../../../eslint.rdna.config.mjs";
import { themeVariants } from "../token-map.mjs";

describe("root eslint config contract wiring", () => {
  it("passes generated themeVariants to no-mixed-style-authority", () => {
    const internalsBlock = rootConfig.find((entry) =>
      Array.isArray(entry.files) &&
      entry.files.includes("packages/radiants/components/core/**/*.{ts,tsx}")
    );

    expect(internalsBlock.rules["rdna/no-mixed-style-authority"][1].themeVariants).toEqual(themeVariants);
  });
});
