import { describe, expect, it } from "vitest";
import { registry } from "../registry";

describe("registry contract", () => {
  it("does not expose handwritten propsInterface strings", () => {
    for (const entry of registry) {
      expect("propsInterface" in entry).toBe(false);
    }
  });
});
