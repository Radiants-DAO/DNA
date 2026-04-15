import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface MatrixGridProps {
  value: boolean[][];
  onChange: (value: boolean[][]) => void;
  rows?: number;
  cols?: number;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  rowLabels?: string[];
  rowColors?: string[];
  showColumnNumbers?: boolean;
  beatGrouping?: number;
  header?: unknown;
}

export const MatrixGridMeta = defineComponentMeta<MatrixGridProps>()({
  name: "MatrixGrid",
  description: "CSS Grid of toggle cells. Step-sequencer style boolean matrix with optional row labels, per-row colors, column numbers, and beat grouping.",
  props: {
    value: { type: "array", required: true, description: "2D boolean array (rows × cols)" },
    onChange: { type: "function", required: true, description: "Matrix change callback" },
    rows: { type: "number", description: "Number of rows (inferred from value)" },
    cols: { type: "number", description: "Number of columns (inferred from value)" },
    label: { type: "string", description: "Label text above the matrix" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Cell size preset (sm=16px, md=22px, lg=26px)" },
    rowLabels: { type: "array", description: "Labels for each row, rendered on the left (e.g. ['KICK', 'SNR', 'HH', 'OH'])" },
    rowColors: { type: "array", description: "CSS color per row for active cells (falls back to ctrl-fill token)" },
    showColumnNumbers: { type: "boolean", default: false, description: "Show 1-based step numbers below each column" },
    beatGrouping: { type: "number", description: "Insert wider gap every N columns for beat grouping (e.g. 4)" },
    header: { type: "slot", description: "Slot for header content rendered above the grid" },
  },
  slots: {
    header: { description: "Header content above the grid (e.g. BPM display, step count)" },
  },
  tokenBindings: {
    cellOn: { background: "ctrl-fill" },
    cellOff: { background: "ctrl-cell-bg" },
    cellOffHover: { background: "ctrl-track" },
    label: { text: "ctrl-label" },
    border: { border: "ctrl-border-inactive" },
    glow: { boxShadow: "ctrl-glow" },
  },
  examples: [
    { name: "4x16 808 pattern", code: `<MatrixGrid
  value={grid}
  onChange={setGrid}
  label="808 PATTERN EDITOR"
  rowLabels={['KICK', 'SNR', 'HH', 'OH']}
  rowColors={['var(--color-sun-yellow)', 'var(--color-cream)', 'var(--color-sky-blue)', 'var(--color-sun-red)']}
  showColumnNumbers
  beatGrouping={4}
  size="lg"
/>` },
    { name: "4x8 basic grid", code: '<MatrixGrid value={grid} onChange={setGrid} label="Pattern" />' },
  ],
  registry: {
    category: "form",
    tags: ["matrix", "grid", "sequencer", "toggle", "808", "drum-machine"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
