import type { PatternEntry, PatternGroupDefinition } from './types.ts';

const GRID_SIZE = 8;

const pattern = <const T extends Omit<PatternEntry, 'width' | 'height'>>(
  entry: T,
) => ({
  width: GRID_SIZE,
  height: GRID_SIZE,
  ...entry,
}) as const;

export const PATTERN_REGISTRY = [
  // Structural
  pattern({ name: 'solid', group: 'structural', bits: '1111111111111111111111111111111111111111111111111111111111111111' }),
  pattern({ name: 'empty', group: 'structural', bits: '0000000000000000000000000000000000000000000000000000000000000000' }),
  pattern({ name: 'checkerboard', group: 'structural', bits: '1010101001010101101010100101010110101010010101011010101001010101' }),
  pattern({ name: 'checkerboard-alt', group: 'structural', bits: '0101010110101010010101011010101001010101101010100101010110101010' }),
  pattern({ name: 'pinstripe-v', group: 'structural', bits: '1010101010101010101010101010101010101010101010101010101010101010' }),
  pattern({ name: 'pinstripe-v-wide', group: 'structural', bits: '1000100010001000100010001000100010001000100010001000100010001000' }),
  pattern({ name: 'pinstripe-h', group: 'structural', bits: '1111111100000000111111110000000011111111000000001111111100000000' }),
  pattern({ name: 'pinstripe-h-wide', group: 'structural', bits: '1111111100000000000000000000000011111111000000000000000000000000' }),

  // Diagonal
  pattern({ name: 'diagonal', group: 'diagonal', bits: '0000000100000010000001000000100000010000001000000100000010000000' }),
  pattern({ name: 'diagonal-dots', group: 'diagonal', bits: '1000100000100010100010000010001010001000001000101000100000100010' }),
  pattern({ name: 'diagonal-right', group: 'diagonal', bits: '0001000100100010010001001000100000010001001000100100010010001000' }),

  // Grid and lattice
  pattern({ name: 'grid', group: 'grid', bits: '1111111110001000100010001000100011111111100010001000100010001000' }),
  pattern({ name: 'brick', group: 'grid', bits: '1111111110000000100000001000000011111111000010000000100000001000' }),
  pattern({ name: 'shelf', group: 'grid', bits: '1111111110000000100000001000000010000000100000001000000010000000' }),
  pattern({ name: 'columns', group: 'grid', bits: '1010101000000000101010100000000010101010000000001010101000000000' }),
  pattern({ name: 'stagger', group: 'grid', bits: '0100010000010001010001000001000101000100000100010100010000010001' }),

  // Figurative
  pattern({ name: 'diamond', group: 'figurative', bits: '0000000000001000000101000010101001010101001010100001010000001000' }),
  pattern({ name: 'confetti', group: 'figurative', bits: '1011000100110000000000110001101111011000110000000000110010001101' }),
  pattern({ name: 'weave', group: 'figurative', bits: '1111100001110100001000100100011110001111000101110010001001110001' }),
  pattern({ name: 'brick-diagonal', group: 'figurative', bits: '0000100000011100001000101100000110000000000000010000001000000100' }),
  pattern({ name: 'brick-diagonal-alt', group: 'figurative', bits: '0000001110000100010010000011000000001100000000100000000100000001' }),
  pattern({ name: 'caret', group: 'figurative', bits: '1000001001000100001110010100010010000010000000010000000100000001' }),
  pattern({ name: 'trellis', group: 'figurative', bits: '0101010110100000010000000100000001010101000010100000010000000100' }),
  pattern({ name: 'arch', group: 'figurative', bits: '0010000001010000100010001000100010001000100010000000010100000010' }),
  pattern({ name: 'cross', group: 'figurative', bits: '1000100000010100001000100100000110001000000000001010101000000000' }),
  pattern({ name: 'sawtooth', group: 'figurative', bits: '1000000010000000010000010011111000001000000010000001010011100011' }),
  pattern({ name: 'chevron', group: 'figurative', bits: '0001000000100000010101001010101011111111000000100000010000001000' }),
  pattern({ name: 'basket', group: 'figurative', bits: '1011111100000000101111111011111110110000101100001011000010110000' }),
  pattern({ name: 'tweed', group: 'figurative', bits: '0111011110001001100011111000111101110111100110001111100011111000' }),

  // Scatter and stipple
  pattern({ name: 'dust', group: 'scatter', bits: '1000000000000000000000000000000000000000000000000000000000000000' }),
  pattern({ name: 'mist', group: 'scatter', bits: '1000000000000000000000000000000000001000000000000000000000000000' }),
  pattern({ name: 'scatter', group: 'scatter', bits: '0100000000000000000001000000000001000000000000000000010000000000' }),
  pattern({ name: 'scatter-alt', group: 'scatter', bits: '1000000000000000000010000000000010000000000000000000100000000000' }),
  pattern({ name: 'scatter-pair', group: 'scatter', bits: '0000000000000000000000000001000100000000000000000000000000010001' }),
  pattern({ name: 'rain', group: 'scatter', bits: '1000000001000000001000000000000000000010000001000000100000000000' }),
  pattern({ name: 'rain-cluster', group: 'scatter', bits: '0100000010100000000000000000000000000100000010100000000000000000' }),
  pattern({ name: 'spray', group: 'scatter', bits: '1000000000010000000000100010000000000001000010000100000000000100' }),
  pattern({ name: 'spray-grid', group: 'scatter', bits: '1000100000000000001000100000000010001000000000000010001000000000' }),
  pattern({ name: 'spray-mixed', group: 'scatter', bits: '1010101000000000100000000000000010001000000000001000000000000000' }),

  // Heavy fill
  pattern({ name: 'fill-75', group: 'heavy', bits: '1101110101110111110111010111011111011101011101111101110101110111' }),
  pattern({ name: 'fill-75-rows', group: 'heavy', bits: '0101010111111111010101011111111101010101111111110101010111111111' }),
  pattern({ name: 'fill-75-sweep', group: 'heavy', bits: '1110111011011101101110110111011111101110110111011011101101110111' }),
  pattern({ name: 'fill-75-offset', group: 'heavy', bits: '1011101111101110101110111110111010111011111011101011101111101110' }),
  pattern({ name: 'fill-75-inv', group: 'heavy', bits: '0111011111011101011101111101110101110111110111010111011111011101' }),
  pattern({ name: 'fill-75-bars', group: 'heavy', bits: '1111111101010101111111110101010111111111010101011111111101010101' }),
  pattern({ name: 'fill-81', group: 'heavy', bits: '1111111101110111110111010111011111111111011101111101110101110111' }),
  pattern({ name: 'fill-88', group: 'heavy', bits: '1101110111111111011101111111111111011101111111110111011111111111' }),
  pattern({ name: 'fill-88-alt', group: 'heavy', bits: '0111011111111111110111011111111101110111111111111101110111111111' }),
  pattern({ name: 'fill-94', group: 'heavy', bits: '1111111111110111111111110111111111111111111101111111111101111111' }),
  pattern({ name: 'fill-94-alt', group: 'heavy', bits: '0111111111111111111101111111111101111111111111111111011111111111' }),
  pattern({ name: 'fill-97', group: 'heavy', bits: '0111111111111111111111111111111111110111111111111111111111111111' }),
] as const satisfies readonly PatternEntry[];

export const PATTERN_GROUPS = [
  { key: 'structural', label: 'Structural', desc: 'Lines, stripes, checks' },
  { key: 'diagonal', label: 'Diagonal', desc: 'Angled lines and dotted diagonals' },
  { key: 'grid', label: 'Grid & Lattice', desc: 'Crosshatch, brick, columns' },
  { key: 'figurative', label: 'Figurative', desc: 'Shapes, waves, textures' },
  { key: 'scatter', label: 'Scatter / Stipple', desc: 'Sparse dot patterns (2%–12%)' },
  { key: 'heavy', label: 'Heavy Fill', desc: 'Dense patterns (75%–97%)' },
] as const satisfies readonly PatternGroupDefinition[];
