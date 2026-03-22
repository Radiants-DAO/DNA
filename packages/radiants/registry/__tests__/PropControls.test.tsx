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

  it("preserves numeric enum values when a toggle is clicked", () => {
    const onChange = vi.fn();

    render(
      <PropControls
        props={{ scale: { type: "enum", values: [1, 2, 3, 4], default: 1 } }}
        values={{ scale: 1 }}
        onChange={onChange}
        onReset={() => {}}
      />,
    );

    fireEvent.click(screen.getByText("2"));

    expect(onChange).toHaveBeenCalledWith("scale", 2);
  });

  it("renders RDNA Toggle for boolean props", () => {
    render(
      <PropControls
        props={{ disabled: { type: "boolean", default: false } }}
        values={{ disabled: false }}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );

    const toggle = screen.getByRole("button", { name: "disabled" });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("renders RDNA ToggleGroup instead of dropdowns for enum props", () => {
    render(
      <PropControls
        props={{ mode: { type: "enum", values: ["solid", "flat", "text"], default: "solid" } }}
        values={{ mode: "solid" }}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getByText("solid")).toBeInTheDocument();
    expect(screen.getByText("flat")).toBeInTheDocument();
    expect(screen.getByText("text")).toBeInTheDocument();
  });

  it("shows color swatches for tone-like enum values", () => {
    const { container } = render(
      <PropControls
        props={{
          tone: {
            type: "enum",
            values: ["accent", "danger", "success"],
            default: "accent",
          },
        }}
        values={{ tone: "accent" }}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );

    const swatches = container.querySelectorAll("span.rounded-full");
    expect(swatches.length).toBe(3);
  });
});
