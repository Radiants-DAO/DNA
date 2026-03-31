import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface InputSetProps {
  disabled?: boolean;
}

export const InputSetMeta = defineComponentMeta<InputSetProps>()({
  name: "InputSet",
  description: "Groups related form fields with a legend, providing accessible form grouping via Base UI Fieldset.",
  subcomponents: ["InputSet.Root", "InputSet.Legend"],
  props: {
    disabled: {
      type: "boolean",
      default: false,
      description: "Whether all fields within the group are disabled",
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
      name: "Basic input set",
      code: '<InputSet.Root>\n  <InputSet.Legend>Personal Info</InputSet.Legend>\n  <Input.Root>\n    <Input.Label>Name</Input.Label>\n    <Input placeholder="Jane Doe" />\n  </Input.Root>\n</InputSet.Root>',
    },
    {
      name: "Disabled input set",
      code: "<InputSet.Root disabled>\n  <InputSet.Legend>Locked Section</InputSet.Legend>\n</InputSet.Root>",
    },
  ],
  registry: {
    category: "form",
    tags: ["fieldset", "form", "group", "legend", "input-set"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/InputSet",
    propSchema: {},
    slashMenu: {
      title: "InputSet",
      subtext: "Groups related form fields with a legend, providin...",
      aliases: ["inputset","fieldset","form","group"],
      icon: "list",
    },
  },

});
