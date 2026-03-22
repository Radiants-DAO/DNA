import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PropDef } from "@rdna/preview";
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
});
