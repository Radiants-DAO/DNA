import type { PatternEntry } from './types';

export const patternRegistry: PatternEntry[] = [
  // ── Structural (8) ──────────────────────────────────────────────
  { name: 'solid',             group: 'structural', fill: 100, hex: 'FF FF FF FF FF FF FF FF', token: '--pat-solid',             legacyName: 'solid' },
  { name: 'empty',             group: 'structural', fill: 0,   hex: '00 00 00 00 00 00 00 00', token: '--pat-empty',             legacyName: 'empty' },
  { name: 'checkerboard',      group: 'structural', fill: 50,  hex: 'AA 55 AA 55 AA 55 AA 55', token: '--pat-checkerboard',      legacyName: 'checker-32' },
  { name: 'checkerboard-alt',  group: 'structural', fill: 50,  hex: '55 AA 55 AA 55 AA 55 AA', token: '--pat-checkerboard-alt',  legacyName: 'checker-32-2' },
  { name: 'pinstripe-v',       group: 'structural', fill: 50,  hex: 'AA AA AA AA AA AA AA AA', token: '--pat-pinstripe-v',       legacyName: 'vlines-4' },
  { name: 'pinstripe-v-wide',  group: 'structural', fill: 25,  hex: '88 88 88 88 88 88 88 88', token: '--pat-pinstripe-v-wide',  legacyName: 'vlines-2' },
  { name: 'pinstripe-h',       group: 'structural', fill: 50,  hex: 'FF 00 FF 00 FF 00 FF 00', token: '--pat-pinstripe-h',       legacyName: 'hlines-4' },
  { name: 'pinstripe-h-wide',  group: 'structural', fill: 25,  hex: 'FF 00 00 00 FF 00 00 00', token: '--pat-pinstripe-h-wide',  legacyName: 'hlines-2' },

  // ── Diagonal (3) ────────────────────────────────────────────────
  { name: 'diagonal',          group: 'diagonal',   fill: 12,  hex: '01 02 04 08 10 20 40 80', token: '--pat-diagonal',          legacyName: 'diagonal-left' },
  { name: 'diagonal-dots',     group: 'diagonal',   fill: 25,  hex: '88 22 88 22 88 22 88 22', token: '--pat-diagonal-dots',     legacyName: 'light-16-2' },
  { name: 'diagonal-right',    group: 'diagonal',   fill: 25,  hex: '11 22 44 88 11 22 44 88', token: '--pat-diagonal-right',    legacyName: 'light-16-4' },

  // ── Grid & Lattice (5) ──────────────────────────────────────────
  { name: 'grid',              group: 'grid',       fill: 44,  hex: 'FF 88 88 88 FF 88 88 88', token: '--pat-grid',              legacyName: 'medium-28' },
  { name: 'brick',             group: 'grid',       fill: 34,  hex: 'FF 80 80 80 FF 08 08 08', token: '--pat-brick',             legacyName: 'light-22' },
  { name: 'shelf',             group: 'grid',       fill: 23,  hex: 'FF 80 80 80 80 80 80 80', token: '--pat-shelf',             legacyName: 'light-15-2' },
  { name: 'columns',           group: 'grid',       fill: 25,  hex: 'AA 00 AA 00 AA 00 AA 00', token: '--pat-columns',           legacyName: 'light-16-3' },
  { name: 'stagger',           group: 'grid',       fill: 25,  hex: '44 11 44 11 44 11 44 11', token: '--pat-stagger',           legacyName: 'light-16-6' },

  // ── Figurative (13) ─────────────────────────────────────────────
  { name: 'diamond',           group: 'figurative', fill: 25,  hex: '00 08 14 2A 55 2A 14 08', token: '--pat-diamond',           legacyName: 'light-16-5' },
  { name: 'confetti',          group: 'figurative', fill: 38,  hex: 'B1 30 03 1B D8 C0 0C 8D', token: '--pat-confetti',          legacyName: 'medium-24' },
  { name: 'weave',             group: 'figurative', fill: 47,  hex: 'F8 74 22 47 8F 17 22 71', token: '--pat-weave',             legacyName: 'medium-30' },
  { name: 'brick-diagonal',    group: 'figurative', fill: 20,  hex: '08 1C 22 C1 80 01 02 04', token: '--pat-brick-diagonal',    legacyName: 'light-13' },
  { name: 'brick-diagonal-alt',group: 'figurative', fill: 20,  hex: '03 84 48 30 0C 02 01 01', token: '--pat-brick-diagonal-alt',legacyName: 'light-13-2' },
  { name: 'caret',             group: 'figurative', fill: 23,  hex: '82 44 39 44 82 01 01 01', token: '--pat-caret',             legacyName: 'light-15' },
  { name: 'trellis',           group: 'figurative', fill: 25,  hex: '55 A0 40 40 55 0A 04 04', token: '--pat-trellis',           legacyName: 'light-16' },
  { name: 'arch',              group: 'figurative', fill: 22,  hex: '20 50 88 88 88 88 05 02', token: '--pat-arch',              legacyName: 'light-14' },
  { name: 'cross',             group: 'figurative', fill: 22,  hex: '88 14 22 41 88 00 AA 00', token: '--pat-cross',             legacyName: 'light-14-2' },
  { name: 'sawtooth',          group: 'figurative', fill: 28,  hex: '80 80 41 3E 08 08 14 E3', token: '--pat-sawtooth',          legacyName: 'light-18' },
  { name: 'chevron',           group: 'figurative', fill: 31,  hex: '10 20 54 AA FF 02 04 08', token: '--pat-chevron',           legacyName: 'light-20' },
  { name: 'basket',            group: 'figurative', fill: 52,  hex: 'BF 00 BF BF B0 B0 B0 B0', token: '--pat-basket',            legacyName: 'medium-33' },
  { name: 'tweed',             group: 'figurative', fill: 59,  hex: '77 89 8F 8F 77 98 F8 F8', token: '--pat-tweed',             legacyName: 'dense-38' },

  // ── Scatter / Stipple (10) ──────────────────────────────────────
  { name: 'dust',              group: 'scatter',    fill: 2,   hex: '80 00 00 00 00 00 00 00', token: '--pat-dust',              legacyName: 'sparse-1' },
  { name: 'mist',              group: 'scatter',    fill: 3,   hex: '80 00 00 00 08 00 00 00', token: '--pat-mist',              legacyName: 'sparse-2' },
  { name: 'scatter',           group: 'scatter',    fill: 6,   hex: '40 00 04 00 40 00 04 00', token: '--pat-scatter',           legacyName: 'sparse-4' },
  { name: 'scatter-alt',       group: 'scatter',    fill: 6,   hex: '80 00 08 00 80 00 08 00', token: '--pat-scatter-alt',       legacyName: 'sparse-4-2' },
  { name: 'scatter-pair',      group: 'scatter',    fill: 6,   hex: '00 00 00 11 00 00 00 11', token: '--pat-scatter-pair',      legacyName: 'sparse-4-3' },
  { name: 'rain',              group: 'scatter',    fill: 9,   hex: '80 40 20 00 02 04 08 00', token: '--pat-rain',              legacyName: 'sparse-6' },
  { name: 'rain-cluster',      group: 'scatter',    fill: 9,   hex: '40 A0 00 00 04 0A 00 00', token: '--pat-rain-cluster',      legacyName: 'sparse-6-2' },
  { name: 'spray',             group: 'scatter',    fill: 12,  hex: '80 10 02 20 01 08 40 04', token: '--pat-spray',             legacyName: 'sparse-8' },
  { name: 'spray-grid',        group: 'scatter',    fill: 12,  hex: '88 00 22 00 88 00 22 00', token: '--pat-spray-grid',        legacyName: 'sparse-8-2' },
  { name: 'spray-mixed',       group: 'scatter',    fill: 12,  hex: 'AA 00 80 00 88 00 80 00', token: '--pat-spray-mixed',       legacyName: 'sparse-8-3' },

  // ── Heavy Fill (12) ─────────────────────────────────────────────
  { name: 'fill-75',           group: 'heavy',      fill: 75,  hex: 'DD 77 DD 77 DD 77 DD 77', token: '--pat-fill-75',           legacyName: 'heavy-48' },
  { name: 'fill-75-rows',      group: 'heavy',      fill: 75,  hex: '55 FF 55 FF 55 FF 55 FF', token: '--pat-fill-75-rows',      legacyName: 'heavy-48-2' },
  { name: 'fill-75-sweep',     group: 'heavy',      fill: 75,  hex: 'EE DD BB 77 EE DD BB 77', token: '--pat-fill-75-sweep',     legacyName: 'heavy-48-3' },
  { name: 'fill-75-offset',    group: 'heavy',      fill: 75,  hex: 'BB EE BB EE BB EE BB EE', token: '--pat-fill-75-offset',    legacyName: 'heavy-48-4' },
  { name: 'fill-75-inv',       group: 'heavy',      fill: 75,  hex: '77 DD 77 DD 77 DD 77 DD', token: '--pat-fill-75-inv',       legacyName: 'heavy-48-5' },
  { name: 'fill-75-bars',      group: 'heavy',      fill: 75,  hex: 'FF 55 FF 55 FF 55 FF 55', token: '--pat-fill-75-bars',      legacyName: 'heavy-48-6' },
  { name: 'fill-81',           group: 'heavy',      fill: 81,  hex: 'FF 77 DD 77 FF 77 DD 77', token: '--pat-fill-81',           legacyName: 'heavy-52' },
  { name: 'fill-88',           group: 'heavy',      fill: 88,  hex: 'DD FF 77 FF DD FF 77 FF', token: '--pat-fill-88',           legacyName: 'heavy-56' },
  { name: 'fill-88-alt',       group: 'heavy',      fill: 88,  hex: '77 FF DD FF 77 FF DD FF', token: '--pat-fill-88-alt',       legacyName: 'heavy-56-2' },
  { name: 'fill-94',           group: 'heavy',      fill: 94,  hex: 'FF F7 FF 7F FF F7 FF 7F', token: '--pat-fill-94',           legacyName: 'heavy-60' },
  { name: 'fill-94-alt',       group: 'heavy',      fill: 94,  hex: '7F FF F7 FF 7F FF F7 FF', token: '--pat-fill-94-alt',       legacyName: 'heavy-60-2' },
  { name: 'fill-97',           group: 'heavy',      fill: 97,  hex: '7F FF FF FF F7 FF FF FF', token: '--pat-fill-97',           legacyName: 'heavy-62' },
];
