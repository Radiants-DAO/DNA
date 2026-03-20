import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface FieldsetProps {
  disabled?: boolean;
}

export const FieldsetMeta = defineComponentMeta<FieldsetProps>()({
  name: "Fieldset",
  description: "Groups related form fields with a legend, providing accessible form grouping via Base UI.",
  subcomponents: ["Fieldset.Root", "Fieldset.Legend"],
  props: {
    disabled: {
      type: "boolean",
      default: false,
      description: "Whether all fields within the fieldset are disabled",
    },
  },
  slots: {
    Legend: { description: "Heading text for the field group" },
  },
  tokenBindings: {
    default: { border: "line", legend: "head" },
  },
  examples: [
    {
      name: "Basic fieldset",
      code: "<Fieldset.Root>\n  <Fieldset.Legend>Personal Info</Fieldset.Legend>\n  <Field.Root>\n    <Field.Label>Name</Field.Label>\n    <Field.Control><input placeholder=\"Jane Doe\" /></Field.Control>\n  </Field.Root>\n</Fieldset.Root>",
    },
    {
      name: "Disabled fieldset",
      code: "<Fieldset.Root disabled>\n  <Fieldset.Legend>Locked Section</Fieldset.Legend>\n</Fieldset.Root>",
    },
  ],
  registry: {
    category: "form",
    tags: ["fieldset", "form", "group", "legend"],
    renderMode: "custom",
  },
});
