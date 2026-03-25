import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon, Select } from "../../components/core";
import { runtimeAttachments } from "../runtime-attachments";

describe("runtime attachments auto component wiring", () => {
  it("derives plain component refs from core exports", () => {
    expect(runtimeAttachments.Icon?.component).toBe(Icon);
  });

  it("preserves custom demo overrides while keeping component refs", () => {
    expect(runtimeAttachments.Select?.component).toBe(Select);
    expect(typeof runtimeAttachments.Select?.Demo).toBe("function");
  });

  it("forwards prop-driven disabled state through the Radio demo", () => {
    const Demo = runtimeAttachments.Radio?.Demo;
    expect(typeof Demo).toBe("function");

    render(createElement(Demo!, { disabled: true }));

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("aria-disabled", "true");
      expect(radio).toHaveAttribute("data-disabled");
    }
  });
});
