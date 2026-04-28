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

  it("enforces RadOS window layout rules as errors", () => {
    const windowBlock = rootConfig.find((entry) =>
      Array.isArray(entry.files) &&
      entry.files.includes("apps/rad-os/components/apps/**/*.{ts,tsx}")
    );

    expect(windowBlock.rules["rdna/no-viewport-breakpoints-in-window-layout"]).toBe("error");
    expect(windowBlock.rules["rdna/no-viewport-units-in-window-layout"]).toBe("error");
  });
});
