import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface MockStatesPopoverProps {
  isOpen: boolean;
  onClose: string;
  mockStates?: string;
  activeMockState?: string;
  onSelectState?: string;
  title?: string;
}

export const MockStatesPopoverMeta =
  defineComponentMeta<MockStatesPopoverProps>()({
    name: "MockStatesPopover",
    description:
      "Developer tool for simulating forced visual states in the playground. Not for production use.",
    subcomponents: ["MockStatesPopoverTrigger", "MockStatesPopoverContent"],
    props: {
      isOpen: {
        type: "boolean",
        required: true,
        description: "Whether the popover is visible",
      },
      onClose: {
        type: "string",
        required: true,
        description: "Callback to close the popover",
      },
      mockStates: {
        type: "string",
        description: "Array of available mock states",
      },
      activeMockState: {
        type: "string",
        description: "Currently active mock state",
      },
      onSelectState: {
        type: "string",
        description: "Callback when a mock state is selected",
      },
      title: {
        type: "string",
        description: "Popover heading text",
      },
    },
    slots: {},
    examples: [
      {
        name: "Dev usage",
        code: "<MockStatesPopover isOpen={true} onClose={() => {}} />",
      },
    ],
    registry: {
      category: "dev",
      tags: [],
      renderMode: "custom",
      exclude: true,
    },
  });
