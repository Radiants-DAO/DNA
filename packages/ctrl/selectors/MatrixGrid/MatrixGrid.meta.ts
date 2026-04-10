import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface MatrixGridProps {
  value: boolean[][];
  onChange: (value: boolean[][]) => void;
  rows?: number;
  cols?: number;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MatrixGridMeta = defineComponentMeta<MatrixGridProps>()({
  name: "MatrixGrid",
  description: "CSS Grid of toggle cells. Step-sequencer style boolean matrix.",
  props: {
    value: { type: "array", required: true, description: "2D boolean array (rows × cols)" },
    onChange: { type: "function", required: true, description: "Matrix change callback" },
    rows: { type: "number", description: "Number of rows (inferred from value)" },
    cols: { type: "number", description: "Number of columns (inferred from value)" },
    label: { type: "string", description: "Label text above the matrix" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Cell size preset" },
  },
  slots: {},
  tokenBindings: {
    cellOn: { background: "ctrl-fill" },
    cellOff: { background: "ctrl-track" },
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "4x8 grid", code: '<MatrixGrid value={grid} onChange={setGrid} label="Pattern" />' },
  ],
  registry: {
    category: "form",
    tags: ["matrix", "grid", "sequencer", "toggle"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
