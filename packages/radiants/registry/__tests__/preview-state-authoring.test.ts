import { describe, expect, it } from "vitest";
import { ButtonMeta } from "../../components/core/Button/Button.meta";
import { ComboboxMeta } from "../../components/core/Combobox/Combobox.meta";
import { InputMeta } from "../../components/core/Input/Input.meta";
import { SelectMeta } from "../../components/core/Select/Select.meta";
import { ToggleMeta } from "../../components/core/Toggle/Toggle.meta";

describe("preview state authoring", () => {
  it("keeps interaction overlays wrapper-driven", () => {
    expect(ButtonMeta.registry?.states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "hover", driver: "wrapper" }),
        expect.objectContaining({ name: "pressed", driver: "wrapper" }),
        expect.objectContaining({ name: "focus", driver: "wrapper" }),
      ]),
    );
  });

  it("uses prop-driven state specs for semantic availability and value states", () => {
    expect(ToggleMeta.registry?.states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "pressed",
          driver: "prop",
          prop: "pressed",
          value: true,
        }),
      ]),
    );

    expect(ComboboxMeta.props.disabled).toEqual(
      expect.objectContaining({
        type: "boolean",
        default: false,
      }),
    );
    expect(ComboboxMeta.registry?.states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "disabled",
          driver: "prop",
          prop: "disabled",
          value: true,
        }),
      ]),
    );

    expect(InputMeta.registry?.states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "disabled",
          driver: "prop",
          prop: "disabled",
          value: true,
        }),
      ]),
    );

    expect(SelectMeta.registry?.states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "error",
          driver: "prop",
          prop: "error",
          value: true,
        }),
      ]),
    );
  });
});
