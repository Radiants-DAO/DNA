import { describe, expect, it } from "vitest";
import { getControllableProps } from "../nodes/PropsPanel";

describe("getControllableProps", () => {
  it("skips callback signatures and array-shaped props", () => {
    const controllable = getControllableProps({
      manifestProps: {
        defaultValue: { type: "string[]" },
        onValueChange: { type: "(value: string[]) => void" },
        options: { type: "array" },
        label: { type: "string" },
      },
    });

    expect(controllable.map(([name]) => name)).toEqual(["label"]);
  });

  it("honors controlledProps for custom demos", () => {
    const controllable = getControllableProps({
      manifestProps: {
        size: { type: "string" },
        placeholder: { type: "string" },
        error: { type: "boolean" },
      },
      renderMode: "custom",
      controlledProps: ["size", "placeholder"],
    });

    expect(controllable.map(([name]) => name)).toEqual(["size", "placeholder"]);
  });

  it("does not apply custom demo filtering when controlledProps is omitted", () => {
    const controllable = getControllableProps({
      manifestProps: {
        size: { type: "string" },
        placeholder: { type: "string" },
      },
      renderMode: "custom",
    });

    expect(controllable.map(([name]) => name)).toEqual(["size", "placeholder"]);
  });
});
