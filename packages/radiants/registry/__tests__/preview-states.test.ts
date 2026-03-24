import { describe, expect, it } from "vitest";
import { getPreviewStateNames, resolvePreviewState } from "../preview-states";

describe("preview state helpers", () => {
  const states = [
    { name: "hover", driver: "wrapper" },
    { name: "disabled", driver: "prop", prop: "disabled", value: true },
    { name: "error", driver: "prop", prop: "error" },
  ] as const;

  it("returns stable display names for declared states", () => {
    expect(getPreviewStateNames(states)).toEqual(["hover", "disabled", "error"]);
  });

  it("resolves wrapper-driven states without prop overrides", () => {
    expect(resolvePreviewState("hover", states)).toEqual({
      wrapperState: "hover",
      propOverrides: {},
    });
  });

  it("resolves prop-driven states into forced preview props", () => {
    expect(resolvePreviewState("disabled", states)).toEqual({
      wrapperState: undefined,
      propOverrides: { disabled: true },
    });

    expect(resolvePreviewState("error", states)).toEqual({
      wrapperState: undefined,
      propOverrides: { error: true },
    });
  });

  it("treats default as no-op", () => {
    expect(resolvePreviewState("default", states)).toEqual({
      wrapperState: undefined,
      propOverrides: {},
    });
  });
});
