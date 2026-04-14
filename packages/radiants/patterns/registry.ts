import type { PatternEntry } from './types';

export const patternRegistry: PatternEntry[] = [
  // ── Structural (8) ──────────────────────────────────────────────
  { name: 'solid',             group: 'structural', fill: 100, bits: '1111111111111111111111111111111111111111111111111111111111111111', token: '--pat-solid',             legacyName: 'solid' },
  { name: 'empty',             group: 'structural', fill: 0,   bits: '0000000000000000000000000000000000000000000000000000000000000000', token: '--pat-empty',             legacyName: 'empty' },
  { name: 'checkerboard',      group: 'structural', fill: 50,  bits: '1010101001010101101010100101010110101010010101011010101001010101', token: '--pat-checkerboard',      legacyName: 'checker-32' },
  { name: 'checkerboard-alt',  group: 'structural', fill: 50,  bits: '0101010110101010010101011010101001010101101010100101010110101010', token: '--pat-checkerboard-alt',  legacyName: 'checker-32-2' },
  { name: 'pinstripe-v',       group: 'structural', fill: 50,  bits: '1010101010101010101010101010101010101010101010101010101010101010', token: '--pat-pinstripe-v',       legacyName: 'vlines-4' },
  { name: 'pinstripe-v-wide',  group: 'structural', fill: 25,  bits: '1000100010001000100010001000100010001000100010001000100010001000', token: '--pat-pinstripe-v-wide',  legacyName: 'vlines-2' },
  { name: 'pinstripe-h',       group: 'structural', fill: 50,  bits: '1111111100000000111111110000000011111111000000001111111100000000', token: '--pat-pinstripe-h',       legacyName: 'hlines-4' },
  { name: 'pinstripe-h-wide',  group: 'structural', fill: 25,  bits: '1111111100000000000000000000000011111111000000000000000000000000', token: '--pat-pinstripe-h-wide',  legacyName: 'hlines-2' },

  // ── Diagonal (3) ────────────────────────────────────────────────
  { name: 'diagonal',          group: 'diagonal',   fill: 12,  bits: '0000000100000010000001000000100000010000001000000100000010000000', token: '--pat-diagonal',          legacyName: 'diagonal-left' },
  { name: 'diagonal-dots',     group: 'diagonal',   fill: 25,  bits: '1000100000100010100010000010001010001000001000101000100000100010', token: '--pat-diagonal-dots',     legacyName: 'light-16-2' },
  { name: 'diagonal-right',    group: 'diagonal',   fill: 25,  bits: '0001000100100010010001001000100000010001001000100100010010001000', token: '--pat-diagonal-right',    legacyName: 'light-16-4' },

  // ── Grid & Lattice (5) ──────────────────────────────────────────
  { name: 'grid',              group: 'grid',       fill: 44,  bits: '1111111110001000100010001000100011111111100010001000100010001000', token: '--pat-grid',              legacyName: 'medium-28' },
  { name: 'brick',             group: 'grid',       fill: 34,  bits: '1111111110000000100000001000000011111111000010000000100000001000', token: '--pat-brick',             legacyName: 'light-22' },
  { name: 'shelf',             group: 'grid',       fill: 23,  bits: '1111111110000000100000001000000010000000100000001000000010000000', token: '--pat-shelf',             legacyName: 'light-15-2' },
  { name: 'columns',           group: 'grid',       fill: 25,  bits: '1010101000000000101010100000000010101010000000001010101000000000', token: '--pat-columns',           legacyName: 'light-16-3' },
  { name: 'stagger',           group: 'grid',       fill: 25,  bits: '0100010000010001010001000001000101000100000100010100010000010001', token: '--pat-stagger',           legacyName: 'light-16-6' },

  // ── Figurative (13) ─────────────────────────────────────────────
  { name: 'diamond',           group: 'figurative', fill: 25,  bits: '0000000000001000000101000010101001010101001010100001010000001000', token: '--pat-diamond',           legacyName: 'light-16-5' },
  { name: 'confetti',          group: 'figurative', fill: 38,  bits: '1011000100110000000000110001101111011000110000000000110010001101', token: '--pat-confetti',          legacyName: 'medium-24' },
  { name: 'weave',             group: 'figurative', fill: 47,  bits: '1111100001110100001000100100011110001111000101110010001001110001', token: '--pat-weave',             legacyName: 'medium-30' },
  { name: 'brick-diagonal',    group: 'figurative', fill: 20,  bits: '0000100000011100001000101100000110000000000000010000001000000100', token: '--pat-brick-diagonal',    legacyName: 'light-13' },
  { name: 'brick-diagonal-alt',group: 'figurative', fill: 20,  bits: '0000001110000100010010000011000000001100000000100000000100000001', token: '--pat-brick-diagonal-alt',legacyName: 'light-13-2' },
  { name: 'caret',             group: 'figurative', fill: 23,  bits: '1000001001000100001110010100010010000010000000010000000100000001', token: '--pat-caret',             legacyName: 'light-15' },
  { name: 'trellis',           group: 'figurative', fill: 25,  bits: '0101010110100000010000000100000001010101000010100000010000000100', token: '--pat-trellis',           legacyName: 'light-16' },
  { name: 'arch',              group: 'figurative', fill: 22,  bits: '0010000001010000100010001000100010001000100010000000010100000010', token: '--pat-arch',              legacyName: 'light-14' },
  { name: 'cross',             group: 'figurative', fill: 22,  bits: '1000100000010100001000100100000110001000000000001010101000000000', token: '--pat-cross',             legacyName: 'light-14-2' },
  { name: 'sawtooth',          group: 'figurative', fill: 28,  bits: '1000000010000000010000010011111000001000000010000001010011100011', token: '--pat-sawtooth',          legacyName: 'light-18' },
  { name: 'chevron',           group: 'figurative', fill: 31,  bits: '0001000000100000010101001010101011111111000000100000010000001000', token: '--pat-chevron',           legacyName: 'light-20' },
  { name: 'basket',            group: 'figurative', fill: 52,  bits: '1011111100000000101111111011111110110000101100001011000010110000', token: '--pat-basket',            legacyName: 'medium-33' },
  { name: 'tweed',             group: 'figurative', fill: 59,  bits: '0111011110001001100011111000111101110111100110001111100011111000', token: '--pat-tweed',             legacyName: 'dense-38' },

  // ── Scatter / Stipple (10) ──────────────────────────────────────
  { name: 'dust',              group: 'scatter',    fill: 2,   bits: '1000000000000000000000000000000000000000000000000000000000000000', token: '--pat-dust',              legacyName: 'sparse-1' },
  { name: 'mist',              group: 'scatter',    fill: 3,   bits: '1000000000000000000000000000000000001000000000000000000000000000', token: '--pat-mist',              legacyName: 'sparse-2' },
  { name: 'scatter',           group: 'scatter',    fill: 6,   bits: '0100000000000000000001000000000001000000000000000000010000000000', token: '--pat-scatter',           legacyName: 'sparse-4' },
  { name: 'scatter-alt',       group: 'scatter',    fill: 6,   bits: '1000000000000000000010000000000010000000000000000000100000000000', token: '--pat-scatter-alt',       legacyName: 'sparse-4-2' },
  { name: 'scatter-pair',      group: 'scatter',    fill: 6,   bits: '0000000000000000000000000001000100000000000000000000000000010001', token: '--pat-scatter-pair',      legacyName: 'sparse-4-3' },
  { name: 'rain',              group: 'scatter',    fill: 9,   bits: '1000000001000000001000000000000000000010000001000000100000000000', token: '--pat-rain',              legacyName: 'sparse-6' },
  { name: 'rain-cluster',      group: 'scatter',    fill: 9,   bits: '0100000010100000000000000000000000000100000010100000000000000000', token: '--pat-rain-cluster',      legacyName: 'sparse-6-2' },
  { name: 'spray',             group: 'scatter',    fill: 12,  bits: '1000000000010000000000100010000000000001000010000100000000000100', token: '--pat-spray',             legacyName: 'sparse-8' },
  { name: 'spray-grid',        group: 'scatter',    fill: 12,  bits: '1000100000000000001000100000000010001000000000000010001000000000', token: '--pat-spray-grid',        legacyName: 'sparse-8-2' },
  { name: 'spray-mixed',       group: 'scatter',    fill: 12,  bits: '1010101000000000100000000000000010001000000000001000000000000000', token: '--pat-spray-mixed',       legacyName: 'sparse-8-3' },

  // ── Heavy Fill (12) ─────────────────────────────────────────────
  { name: 'fill-75',           group: 'heavy',      fill: 75,  bits: '1101110101110111110111010111011111011101011101111101110101110111', token: '--pat-fill-75',           legacyName: 'heavy-48' },
  { name: 'fill-75-rows',      group: 'heavy',      fill: 75,  bits: '0101010111111111010101011111111101010101111111110101010111111111', token: '--pat-fill-75-rows',      legacyName: 'heavy-48-2' },
  { name: 'fill-75-sweep',     group: 'heavy',      fill: 75,  bits: '1110111011011101101110110111011111101110110111011011101101110111', token: '--pat-fill-75-sweep',     legacyName: 'heavy-48-3' },
  { name: 'fill-75-offset',    group: 'heavy',      fill: 75,  bits: '1011101111101110101110111110111010111011111011101011101111101110', token: '--pat-fill-75-offset',    legacyName: 'heavy-48-4' },
  { name: 'fill-75-inv',       group: 'heavy',      fill: 75,  bits: '0111011111011101011101111101110101110111110111010111011111011101', token: '--pat-fill-75-inv',       legacyName: 'heavy-48-5' },
  { name: 'fill-75-bars',      group: 'heavy',      fill: 75,  bits: '1111111101010101111111110101010111111111010101011111111101010101', token: '--pat-fill-75-bars',      legacyName: 'heavy-48-6' },
  { name: 'fill-81',           group: 'heavy',      fill: 81,  bits: '1111111101110111110111010111011111111111011101111101110101110111', token: '--pat-fill-81',           legacyName: 'heavy-52' },
  { name: 'fill-88',           group: 'heavy',      fill: 88,  bits: '1101110111111111011101111111111111011101111111110111011111111111', token: '--pat-fill-88',           legacyName: 'heavy-56' },
  { name: 'fill-88-alt',       group: 'heavy',      fill: 88,  bits: '0111011111111111110111011111111101110111111111111101110111111111', token: '--pat-fill-88-alt',       legacyName: 'heavy-56-2' },
  { name: 'fill-94',           group: 'heavy',      fill: 94,  bits: '1111111111110111111111110111111111111111111101111111111101111111', token: '--pat-fill-94',           legacyName: 'heavy-60' },
  { name: 'fill-94-alt',       group: 'heavy',      fill: 94,  bits: '0111111111111111111101111111111101111111111111111111011111111111', token: '--pat-fill-94-alt',       legacyName: 'heavy-60-2' },
  { name: 'fill-97',           group: 'heavy',      fill: 97,  bits: '0111111111111111111111111111111111110111111111111111111111111111', token: '--pat-fill-97',           legacyName: 'heavy-62' },
];
