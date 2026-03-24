import { describe, expect, it } from "vitest";
import {
  componentMap,
  loadContract,
  textLikeInputTypes,
  themeVariants,
  tokenMap,
} from "../contract.mjs";

describe("eslint contract surface", () => {
  it("exposes expanded semantic color suffixes and corrected theme variants", () => {
    expect(tokenMap.semanticColorSuffixes).toEqual(
      expect.arrayContaining([
        "surface-primary",
        "content-primary",
        "edge-primary",
        "status-success",
      ]),
    );
    expect(themeVariants).toEqual(
      expect.arrayContaining([
        "default",
        "raised",
        "inverted",
        "success",
        "warning",
        "error",
        "info",
      ]),
    );
    expect(themeVariants).not.toContain("primary");
  });

  it("exposes live replacement-map entries from the generated contract", () => {
    expect(componentMap.button.component).toBe("Button");
    expect(componentMap.meter.component).toBe("Meter");
    expect(textLikeInputTypes).toEqual(
      expect.arrayContaining(["text", "email", "search", "number"]),
    );
  });

  it("falls back only for missing or invalid generated JSON", () => {
    expect(
      loadContract(() => {
        throw Object.assign(new Error("missing"), { code: "MODULE_NOT_FOUND" });
      }).componentMap,
    ).toEqual({});

    expect(
      loadContract(() => {
        throw new SyntaxError("bad json");
      }).componentMap,
    ).toEqual({});

    expect(() =>
      loadContract(() => {
        throw new TypeError("unexpected");
      }),
    ).toThrow("unexpected");
  });

  it("fills missing sections from the empty contract when generated JSON is partial", () => {
    const contract = loadContract(() => ({
      tokenMap: {
        removedAliases: ["--legacy-token"],
      },
      themeVariants: ["default"],
    }));

    expect(contract.tokenMap.removedAliases).toEqual(["--legacy-token"]);
    expect(contract.tokenMap.brandPalette).toEqual({});
    expect(contract.pixelCorners.triggerClasses).toEqual([]);
    expect(contract.motion.easingTokens).toEqual([]);
    expect(contract.textLikeInputTypes).toEqual([]);
  });
});
