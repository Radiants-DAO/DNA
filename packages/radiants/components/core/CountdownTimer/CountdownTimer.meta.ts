import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface CountdownTimerProps {
  endTime: number | Date;
  startTime?: number | Date;
  variant?: "default" | "compact" | "large";
  label?: string;
  onComplete?: () => void;
  endedMessage?: string;
  upcomingMessage?: string;
  showDays?: boolean;
}

export const CountdownTimerMeta = defineComponentMeta<CountdownTimerProps>()({
  name: "CountdownTimer",
  description:
    "Live countdown display with days, hours, minutes, and seconds. Supports multiple visual variants.",
  props: {
    endTime: {
      type: "number | string",
      required: true,
      description:
        "Target end time as Unix ms timestamp (number) or ISO 8601 date string (Date objects accepted at runtime)",
    },
    startTime: {
      type: "number | string",
      description:
        "Optional start time as Unix ms timestamp (number) or ISO 8601 date string (Date objects accepted at runtime)",
    },
    variant: {
      type: "enum",
      options: ["default", "compact", "large"],
      default: "default",
      description: "Visual size variant",
    },
    label: {
      type: "string",
      description: "Label displayed above the timer",
    },
    onComplete: {
      type: "function",
      description: "Callback fired when countdown reaches zero",
    },
    endedMessage: {
      type: "string",
      default: "Ended",
      description: "Text displayed after countdown completes",
    },
    upcomingMessage: {
      type: "string",
      description: "Text displayed before countdown starts",
    },
    showDays: {
      type: "boolean",
      default: true,
      description: "Show the days unit in the display",
    },
  },
  slots: {},
  examples: [
    {
      name: "Basic countdown",
      code: '<CountdownTimer endTime="2026-12-31T23:59:59Z" label="New Year" />',
    },
    {
      name: "Compact variant",
      code: '<CountdownTimer endTime="2026-06-01T00:00:00Z" variant="compact" />',
    },
  ],
  registry: {
    category: "data-display",
    tags: ["timer", "clock", "deadline"],
    renderMode: "custom",
  },
});
