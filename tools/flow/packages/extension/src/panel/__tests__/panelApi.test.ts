import { describe, it, expect } from "vitest";
import { getSidecarBaseUrl } from "../api/sidecar";

describe("panel api", () => {
  it("returns default sidecar base url", () => {
    expect(getSidecarBaseUrl()).toBe("http://localhost:3737");
  });
});
