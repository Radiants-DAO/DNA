import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PropDef } from "../types";
import { PropControls } from "../PropControls";

const testProps: Record<string, PropDef> = {
  variant: { type: "enum", options: ["solid", "outline", "ghost"] },
  disabled: { type: "boolean" },
  label: { type: "string" },
};

describe("PropControls", () => {
  it("renders controls for each non-skipped prop", () => {
    render(
      <PropControls
        props={testProps}
        values={{ variant: "solid", disabled: false, label: "Click" }}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );

    expect(screen.getByText("variant")).toBeInTheDocument();
    expect(screen.getByText("disabled")).toBeInTheDocument();
    expect(screen.getByText("label")).toBeInTheDocument();
  });

  it("honors controlledProps for custom demos", () => {
    render(
      <PropControls
        props={testProps}
        values={{ variant: "solid" }}
        onChange={() => {}}
        onReset={() => {}}
        controlledProps={["variant"]}
        renderMode="custom"
      />,
    );

    expect(screen.getByText("variant")).toBeInTheDocument();
    expect(screen.queryByText("disabled")).not.toBeInTheDocument();
  });

  it("preserves numeric enum values when a selection changes", () => {
    const onChange = vi.fn();

    render(
      <PropControls
        props={{ scale: { type: "enum", values: [1, 2, 3, 4], default: 1 } }}
        values={{ scale: 1 }}
        onChange={onChange}
        onReset={() => {}}
      />,
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });

    expect(onChange).toHaveBeenCalledWith("scale", 2);
  });
});
