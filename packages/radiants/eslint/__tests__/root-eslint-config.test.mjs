import { describe, expect, it } from "vitest";
import rootConfig from "../../../../eslint.rdna.config.mjs";

describe("root eslint config contract wiring", () => {
  it("enables no-mixed-style-authority without option injection", () => {
    const internalsBlock = rootConfig.find((entry) =>
      Array.isArray(entry.files) &&
      entry.files.includes("packages/radiants/components/core/**/*.{ts,tsx}")
    );

    expect(internalsBlock.rules["rdna/no-mixed-style-authority"]).toBe("error");
  });
});
