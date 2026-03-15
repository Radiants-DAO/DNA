import { describe, expect, it } from "vitest";
import {
  getWorkOverlayCopy,
  shouldStartCompletionFlash,
} from "../work-overlay";

describe("shouldStartCompletionFlash", () => {
  it("triggers only when work transitions from active to inactive", () => {
    expect(shouldStartCompletionFlash(true, false)).toBe(true);
    expect(shouldStartCompletionFlash(true, true)).toBe(false);
    expect(shouldStartCompletionFlash(false, true)).toBe(false);
    expect(shouldStartCompletionFlash(false, false)).toBe(false);
  });
});

describe("getWorkOverlayCopy", () => {
  it("returns typed active copy with animated dots", () => {
    expect(getWorkOverlayCopy("active", 0)).toEqual({
      eyebrow: "Agent Active",
      message: "m",
      dots: ".",
      showCursor: true,
    });
  });

  it("returns static completion copy", () => {
    expect(getWorkOverlayCopy("complete", 42)).toEqual({
      eyebrow: "Agent Complete",
      message: "completed",
      dots: "",
      showCursor: false,
    });
  });
});
