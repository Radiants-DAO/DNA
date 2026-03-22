import { describe, expect, it } from "vitest";
import { getControllableProps } from "@rdna/radiants/registry";

describe("getControllableProps", () => {
  it("skips callback signatures and array-shaped props", () => {
    const controllable = getControllableProps({
      props: {
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
      props: {
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
      props: {
        size: { type: "string" },
        placeholder: { type: "string" },
      },
      renderMode: "custom",
    });

    expect(controllable.map(([name]) => name)).toEqual(["size", "placeholder"]);
  });
});
