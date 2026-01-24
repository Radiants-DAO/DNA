/**
 * Token Resolution Chain Tests
 *
 * Tests for fn-2-gnc.3 - Token Resolution Chain implementation
 *
 * Test cases:
 * - Direct value (no var reference)
 * - 3-level chain resolution
 * - Circular A -> B -> A detection
 * - Circular A -> B -> C -> A detection
 * - Missing token with fallback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  resolveTokenChain,
  resolveTokenChainWithMetadata,
  resolveStyleValue,
  resolveAllTokens,
  createTokenResolver,
  containsVarReference,
  extractVarName,
  type TokenMap,
} from "../tokenResolver";
import { isColorValue, isUnitValue, isKeywordValue, isUnparsedValue } from "../../types/styleValue";

// =============================================================================
// Direct Value Tests
// =============================================================================

describe("Direct value resolution", () => {
  it("resolves a direct hex color value", () => {
    const tokens: TokenMap = new Map([["color-brand", "#3b82f6"]]);

    const result = resolveTokenChain("color-brand", tokens);

    expect(result).not.toBeNull();
    expect(isColorValue(result!)).toBe(true);
    if (isColorValue(result!)) {
      expect(result.colorSpace).toBe("srgb");
    }
  });

  it("resolves a direct pixel value", () => {
    const tokens: TokenMap = new Map([["spacing-base", "16px"]]);

    const result = resolveTokenChain("spacing-base", tokens);

    expect(result).not.toBeNull();
    expect(isUnitValue(result!)).toBe(true);
    if (isUnitValue(result!)) {
      expect(result.value).toBe(16);
      expect(result.unit).toBe("px");
    }
  });

  it("resolves a direct keyword value", () => {
    const tokens: TokenMap = new Map([["display-type", "flex"]]);

    const result = resolveTokenChain("display-type", tokens);

    expect(result).not.toBeNull();
    expect(isKeywordValue(result!)).toBe(true);
    if (isKeywordValue(result!)) {
      expect(result.value).toBe("flex");
    }
  });

  it("returns null for non-existent token", () => {
    const tokens: TokenMap = new Map();

    const result = resolveTokenChain("non-existent", tokens);

    expect(result).toBeNull();
  });
});

// =============================================================================
// Chain Resolution Tests
// =============================================================================

describe("Chain resolution", () => {
  it("resolves a 2-level chain", () => {
    const tokens: TokenMap = new Map([
      ["color-brand", "#3b82f6"],
      ["color-primary", "var(--color-brand)"],
    ]);

    const result = resolveTokenChain("color-primary", tokens);

    expect(result).not.toBeNull();
    expect(isColorValue(result!)).toBe(true);
    if (isColorValue(result!)) {
      expect(result.colorSpace).toBe("srgb");
    }
  });

  it("resolves a 3-level chain: var(--a) -> var(--b) -> #fff", () => {
    const tokens: TokenMap = new Map([
      ["color-brand", "#ffffff"],
      ["color-primary", "var(--color-brand)"],
      ["color-surface", "var(--color-primary)"],
    ]);

    const result = resolveTokenChain("color-surface", tokens);

    expect(result).not.toBeNull();
    expect(isColorValue(result!)).toBe(true);
    if (isColorValue(result!)) {
      expect(result.colorSpace).toBe("srgb");
      // White color
      expect(result.components[0]).toBeCloseTo(1);
      expect(result.components[1]).toBeCloseTo(1);
      expect(result.components[2]).toBeCloseTo(1);
    }
  });

  it("resolves a 4-level chain", () => {
    const tokens: TokenMap = new Map([
      ["spacing-unit", "4px"],
      ["spacing-sm", "var(--spacing-unit)"],
      ["spacing-md", "var(--spacing-sm)"],
      ["spacing-lg", "var(--spacing-md)"],
    ]);

    const result = resolveTokenChain("spacing-lg", tokens);

    expect(result).not.toBeNull();
    expect(isUnitValue(result!)).toBe(true);
    if (isUnitValue(result!)) {
      expect(result.value).toBe(4);
      expect(result.unit).toBe("px");
    }
  });
});

// =============================================================================
// Circular Reference Detection Tests
// =============================================================================

describe("Circular reference detection", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("detects circular A -> B -> A immediately via visited set", () => {
    const tokens: TokenMap = new Map([
      ["color-a", "var(--color-b)"],
      ["color-b", "var(--color-a)"],
    ]);

    const result = resolveTokenChain("color-a", tokens);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    const warningMessage = warnSpy.mock.calls[0][0];
    expect(warningMessage).toContain("Circular token reference detected");
    expect(warningMessage).toContain("--color-a");
    expect(warningMessage).toContain("--color-b");
  });

  it("detects circular A -> B -> C -> A immediately via visited set", () => {
    const tokens: TokenMap = new Map([
      ["color-a", "var(--color-b)"],
      ["color-b", "var(--color-c)"],
      ["color-c", "var(--color-a)"],
    ]);

    const result = resolveTokenChain("color-a", tokens);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    const warningMessage = warnSpy.mock.calls[0][0];
    expect(warningMessage).toContain("Circular token reference detected");
    // Should show the full cycle path
    expect(warningMessage).toContain("--color-a");
  });

  it("detects self-referencing token", () => {
    const tokens: TokenMap = new Map([["color-self", "var(--color-self)"]]);

    const result = resolveTokenChain("color-self", tokens);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    const warningMessage = warnSpy.mock.calls[0][0];
    expect(warningMessage).toContain("--color-self");
  });

  it("provides descriptive cycle path in warning", () => {
    const tokens: TokenMap = new Map([
      ["a", "var(--b)"],
      ["b", "var(--c)"],
      ["c", "var(--d)"],
      ["d", "var(--a)"],
    ]);

    resolveTokenChain("a", tokens);

    expect(warnSpy).toHaveBeenCalled();
    const warningMessage = warnSpy.mock.calls[0][0];
    // Warning should show: --a -> --b -> --c -> --d -> --a
    expect(warningMessage).toMatch(/--a.*->.*--b.*->.*--c.*->.*--d.*->.*--a/);
  });
});

// =============================================================================
// Fallback Tests
// =============================================================================

describe("Fallback handling", () => {
  it("uses fallback when token is missing: var(--missing, red)", () => {
    const tokens: TokenMap = new Map([
      ["color-with-fallback", "var(--missing, red)"],
    ]);

    const result = resolveTokenChain("color-with-fallback", tokens);

    expect(result).not.toBeNull();
    // "red" is parsed as unparsed since it's not a structured color format
    // This is correct behavior - CSS will interpret "red" correctly
    expect(result!.type).toBe("unparsed");
    if (result!.type === "unparsed") {
      expect(result.value).toBe("red");
    }
  });

  it("uses fallback with unit value: var(--missing, 10px)", () => {
    const tokens: TokenMap = new Map([
      ["spacing-with-fallback", "var(--missing, 10px)"],
    ]);

    const result = resolveTokenChain("spacing-with-fallback", tokens);

    expect(result).not.toBeNull();
    expect(isUnitValue(result!)).toBe(true);
    if (isUnitValue(result!)) {
      expect(result.value).toBe(10);
      expect(result.unit).toBe("px");
    }
  });

  it("uses fallback with color value: var(--missing, #ff0000)", () => {
    const tokens: TokenMap = new Map([
      ["color-with-hex-fallback", "var(--missing, #ff0000)"],
    ]);

    const result = resolveTokenChain("color-with-hex-fallback", tokens);

    expect(result).not.toBeNull();
    expect(isColorValue(result!)).toBe(true);
    if (isColorValue(result!)) {
      expect(result.colorSpace).toBe("srgb");
      expect(result.components[0]).toBeCloseTo(1); // Red
    }
  });

  it("prefers resolved value over fallback", () => {
    const tokens: TokenMap = new Map([
      ["color-exists", "#00ff00"],
      ["color-with-fallback", "var(--color-exists, #ff0000)"],
    ]);

    const result = resolveTokenChain("color-with-fallback", tokens);

    expect(result).not.toBeNull();
    expect(isColorValue(result!)).toBe(true);
    if (isColorValue(result!)) {
      // Should be green (#00ff00), not red
      expect(result.components[0]).toBeCloseTo(0);
      expect(result.components[1]).toBeCloseTo(1);
    }
  });

  it("returns null when no fallback and token missing", () => {
    const tokens: TokenMap = new Map([
      ["color-no-fallback", "var(--missing)"],
    ]);

    const result = resolveTokenChain("color-no-fallback", tokens);

    expect(result).toBeNull();
  });
});

// =============================================================================
// Metadata Resolution Tests
// =============================================================================

describe("resolveTokenChainWithMetadata", () => {
  it("returns path taken during resolution", () => {
    const tokens: TokenMap = new Map([
      ["color-brand", "#3b82f6"],
      ["color-primary", "var(--color-brand)"],
      ["color-surface", "var(--color-primary)"],
    ]);

    const result = resolveTokenChainWithMetadata("color-surface", tokens);

    expect(result.value).not.toBeNull();
    expect(result.path).toEqual(["color-surface", "color-primary", "color-brand"]);
    expect(result.isCircular).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it("marks circular references in metadata", () => {
    const tokens: TokenMap = new Map([
      ["a", "var(--b)"],
      ["b", "var(--a)"],
    ]);

    const result = resolveTokenChainWithMetadata("a", tokens);

    expect(result.value).toBeNull();
    expect(result.isCircular).toBe(true);
    expect(result.error).toContain("Circular reference");
    expect(result.path).toContain("a");
    expect(result.path).toContain("b");
  });

  it("provides error for missing token", () => {
    const tokens: TokenMap = new Map([["a", "var(--missing)"]]);

    const result = resolveTokenChainWithMetadata("a", tokens);

    expect(result.value).toBeNull();
    expect(result.error).toContain("not found");
  });
});

// =============================================================================
// resolveStyleValue Tests
// =============================================================================

describe("resolveStyleValue", () => {
  it("returns non-var values unchanged", () => {
    const tokens: TokenMap = new Map();
    const unitValue = { type: "unit" as const, value: 10, unit: "px" as const };

    const result = resolveStyleValue(unitValue, tokens);

    expect(result).toEqual(unitValue);
  });

  it("resolves var values", () => {
    const tokens: TokenMap = new Map([["spacing", "20px"]]);
    const varValue = { type: "var" as const, value: "spacing" };

    const result = resolveStyleValue(varValue, tokens);

    expect(isUnitValue(result)).toBe(true);
    if (isUnitValue(result)) {
      expect(result.value).toBe(20);
    }
  });

  it("uses fallback for unresolvable var", () => {
    const tokens: TokenMap = new Map();
    const varValue = {
      type: "var" as const,
      value: "missing",
      fallback: { type: "keyword" as const, value: "auto" },
    };

    const result = resolveStyleValue(varValue, tokens);

    expect(isKeywordValue(result)).toBe(true);
    if (isKeywordValue(result)) {
      expect(result.value).toBe("auto");
    }
  });
});

// =============================================================================
// resolveAllTokens Tests
// =============================================================================

describe("resolveAllTokens", () => {
  it("resolves all tokens in a map", () => {
    const tokens: TokenMap = new Map([
      ["color-brand", "#3b82f6"],
      ["color-primary", "var(--color-brand)"],
      ["spacing", "16px"],
    ]);

    const resolved = resolveAllTokens(tokens);

    expect(resolved.size).toBe(3);
    expect(resolved.has("color-brand")).toBe(true);
    expect(resolved.has("color-primary")).toBe(true);
    expect(resolved.has("spacing")).toBe(true);
  });

  it("excludes unresolvable tokens", () => {
    const tokens: TokenMap = new Map([
      ["valid", "#fff"],
      ["invalid", "var(--missing)"],
    ]);

    const resolved = resolveAllTokens(tokens);

    expect(resolved.size).toBe(1);
    expect(resolved.has("valid")).toBe(true);
    expect(resolved.has("invalid")).toBe(false);
  });
});

// =============================================================================
// createTokenResolver Tests
// =============================================================================

describe("createTokenResolver", () => {
  it("creates a bound resolver function", () => {
    const tokens: TokenMap = new Map([
      ["a", "#fff"],
      ["b", "var(--a)"],
    ]);

    const resolve = createTokenResolver(tokens);

    const resultA = resolve("a");
    const resultB = resolve("b");

    expect(resultA).not.toBeNull();
    expect(resultB).not.toBeNull();
    expect(isColorValue(resultA!)).toBe(true);
    expect(isColorValue(resultB!)).toBe(true);
  });

  it("caches resolved values", () => {
    const tokens: TokenMap = new Map([["a", "#fff"]]);
    const resolve = createTokenResolver(tokens);

    const result1 = resolve("a");
    const result2 = resolve("a");

    // Same reference due to caching
    expect(result1).toBe(result2);
  });

  it("caches null results", () => {
    const tokens: TokenMap = new Map();
    const resolve = createTokenResolver(tokens);

    const result1 = resolve("missing");
    const result2 = resolve("missing");

    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe("containsVarReference", () => {
  it("detects var() references", () => {
    expect(containsVarReference("var(--color)")).toBe(true);
    expect(containsVarReference("var( --color )")).toBe(true);
    expect(containsVarReference("calc(var(--a) + 10px)")).toBe(true);
  });

  it("returns false for non-var values", () => {
    expect(containsVarReference("#fff")).toBe(false);
    expect(containsVarReference("10px")).toBe(false);
    expect(containsVarReference("auto")).toBe(false);
  });
});

describe("extractVarName", () => {
  it("extracts token name from simple var()", () => {
    expect(extractVarName("var(--color-primary)")).toBe("color-primary");
    expect(extractVarName("var( --spacing )")).toBe("spacing");
  });

  it("extracts token name with fallback", () => {
    expect(extractVarName("var(--color, red)")).toBe("color");
    expect(extractVarName("var(--spacing, 10px)")).toBe("spacing");
  });

  it("returns null for non-var values", () => {
    expect(extractVarName("#fff")).toBeNull();
    expect(extractVarName("10px")).toBeNull();
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe("Real-world token scenarios", () => {
  it("handles DNA-style three-tier token system", () => {
    // Simulating DNA Radiants token structure:
    // Brand -> Semantic -> Component
    const tokens: TokenMap = new Map([
      // Brand tier
      ["brand-blue-500", "#3b82f6"],
      ["brand-gray-100", "#f3f4f6"],
      ["brand-gray-900", "#111827"],
      // Semantic tier
      ["color-primary", "var(--brand-blue-500)"],
      ["color-background", "var(--brand-gray-100)"],
      ["color-text", "var(--brand-gray-900)"],
      // Component tier
      ["button-bg", "var(--color-primary)"],
      ["card-bg", "var(--color-background)"],
      ["heading-color", "var(--color-text)"],
    ]);

    // Resolve component-tier tokens
    const buttonBg = resolveTokenChain("button-bg", tokens);
    const cardBg = resolveTokenChain("card-bg", tokens);
    const headingColor = resolveTokenChain("heading-color", tokens);

    expect(buttonBg).not.toBeNull();
    expect(cardBg).not.toBeNull();
    expect(headingColor).not.toBeNull();

    // All should resolve to color values
    expect(isColorValue(buttonBg!)).toBe(true);
    expect(isColorValue(cardBg!)).toBe(true);
    expect(isColorValue(headingColor!)).toBe(true);
  });

  it("handles mixed value types in chains", () => {
    const tokens: TokenMap = new Map([
      ["base-unit", "4px"],
      ["spacing-sm", "var(--base-unit)"],
      ["padding-button", "var(--spacing-sm)"],
    ]);

    const result = resolveTokenChain("padding-button", tokens);

    expect(result).not.toBeNull();
    expect(isUnitValue(result!)).toBe(true);
    if (isUnitValue(result!)) {
      expect(result.value).toBe(4);
      expect(result.unit).toBe("px");
    }
  });
});
