import { describe, expect, it } from "vitest";
import * as tokenMap from "../token-map.mjs";

describe("token-map contract bridge", () => {
  it("exposes generated semantic color suffixes", () => {
    expect(tokenMap.semanticColorSuffixes).toEqual(
      expect.arrayContaining([
        "content-primary",
        "edge-primary",
        "action-primary",
        "status-success",
      ]),
    );
  });

  it("exposes the expanded raw-element replacement map", () => {
    expect(tokenMap.rdnaComponentMap.label.component).toBe("Label");
    expect(tokenMap.rdnaComponentMap.meter.component).toBe("Meter");
    expect(tokenMap.rdnaComponentMap.progress.component).toBe("Meter");
    expect(tokenMap.rdnaComponentMap.hr.component).toBe("Separator");
    expect(tokenMap.rdnaComponentMap.details.component).toBe("Collapsible");
  });

  it("exposes the CSS-backed theme variants", () => {
    expect(tokenMap.themeVariants).toEqual(
      expect.arrayContaining(["default", "raised", "inverted", "success", "warning"]),
    );
    expect(tokenMap.themeVariants).not.toContain("primary");
  });
});
