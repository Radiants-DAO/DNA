import type { BrandColor, ExtendedColor, SemanticCategory } from './types';

export const BRAND_COLORS: readonly BrandColor[] = [
  {
    name: 'Sun Yellow', hex: '#FCE184', oklch: 'oklch(0.9126 0.1170 93.68)', role: 'Primary Accent',
    description: 'Actions, highlights, focus states, and energy. The signature color of Radiants.',
    cssVar: '--color-sun-yellow', tailwind: 'sun-yellow',
  },
  {
    name: 'Cream', hex: '#FEF8E2', oklch: 'oklch(0.9780 0.0295 94.34)', role: 'Canvas',
    description: 'Surfaces, backgrounds, and the warm foundation of all layouts.',
    cssVar: '--color-cream', tailwind: 'cream',
  },
  {
    name: 'Ink', hex: '#0F0E0C', oklch: 'oklch(0.1641 0.0044 84.59)', role: 'Anchor',
    description: 'Typography, borders, depth. Grounds the visual hierarchy.',
    cssVar: '--color-ink', tailwind: 'ink',
  },
  {
    name: 'Pure White', hex: '#FFFFFF', oklch: 'oklch(1.0000 0.0000 0)', role: 'Highlight',
    description: 'Absolute white. Reserved for elevated card surfaces and brightest pixel highlights.',
    cssVar: '--color-pure-white', tailwind: 'pure-white',
  },
  {
    name: 'Pure Black', hex: '#000000', oklch: 'oklch(0.0000 0.0000 0)', role: 'Depth',
    description: 'Absolute black. Reserved for deepest Moon Mode elevations (darker than ink).',
    cssVar: '--color-pure-black', tailwind: 'pure-black',
  },
];

export const EXTENDED_COLORS: readonly ExtendedColor[] = [
  { name: 'Sky Blue',    hex: '#95BAD2', oklch: 'oklch(0.7701 0.0527 236.81)', cssVar: '--color-sky-blue',    tailwind: 'sky-blue',    role: 'Links & Info' },
  { name: 'Sunset Fuzz', hex: '#FCC383', oklch: 'oklch(0.8546 0.1039 68.93)',  cssVar: '--color-sunset-fuzz', tailwind: 'sunset-fuzz', role: 'Warm CTA' },
  { name: 'Sun Red',     hex: '#FF7F7F', oklch: 'oklch(0.7429 0.1568 21.43)',  cssVar: '--color-sun-red',     tailwind: 'sun-red',     role: 'Error & Danger' },
  { name: 'Mint',        hex: '#CEF5CA', oklch: 'oklch(0.9312 0.0702 142.51)', cssVar: '--color-mint',        tailwind: 'mint',        role: 'Success' },
];

/**
 * Audited against packages/radiants/tokens.css (light) and packages/radiants/dark.css (dark).
 * All values reflect what the CSS actually resolves to at runtime.
 */
export const SEMANTIC_CATEGORIES: readonly SemanticCategory[] = [
  {
    name: 'Surface',
    description: 'Background colors for containers and sections',
    tokens: [
      { name: 'primary',   cssVar: '--color-page',   tailwind: 'page',   lightHex: '#FEF8E2',                 darkHex: '#0F0E0C',                 note: 'Main page background' },
      { name: 'secondary', cssVar: '--color-inv',    tailwind: 'inv',    lightHex: '#0F0E0C',                 darkHex: '#0F0E0C',                 note: 'Inverted sections' },
      { name: 'tertiary',  cssVar: '--color-tinted', tailwind: 'tinted', lightHex: '#FCC383',                 darkHex: '#3D2E1A',                 note: 'Accent containers' },
      { name: 'elevated',  cssVar: '--color-card',   tailwind: 'card',   lightHex: '#FFFFFF',                 darkHex: '#000000',                 note: 'Cards, raised panels' },
      { name: 'muted',     cssVar: '--color-depth',  tailwind: 'depth',  lightHex: '#FEF8E2',                 darkHex: '#221E18',                 note: 'Subtle backgrounds' },
    ],
  },
  {
    name: 'Content',
    description: 'Text and foreground colors',
    tokens: [
      { name: 'primary',   cssVar: '--color-main', tailwind: 'main', lightHex: '#0F0E0C',                 darkHex: '#FEF8E2',                 note: 'Body text' },
      { name: 'heading',   cssVar: '--color-head', tailwind: 'head', lightHex: '#0F0E0C',                 darkHex: '#FFFFFF',                 note: 'Headings' },
      { name: 'secondary', cssVar: '--color-sub',  tailwind: 'sub',  lightHex: 'rgba(15,14,12,0.85)',     darkHex: 'rgba(254,248,226,0.85)',   note: 'Supporting text' },
      { name: 'inverted',  cssVar: '--color-flip', tailwind: 'flip', lightHex: '#FEF8E2',                 darkHex: '#FEF8E2',                 note: 'Text on dark bg' },
      { name: 'muted',     cssVar: '--color-mute', tailwind: 'mute', lightHex: 'rgba(15,14,12,0.6)',      darkHex: 'rgba(254,248,226,0.6)',   note: 'Captions, hints' },
      { name: 'link',      cssVar: '--color-link', tailwind: 'link', lightHex: '#4A7FA7',                 darkHex: '#95BAD2',                 note: 'Hyperlinks' },
    ],
  },
  {
    name: 'Edge',
    description: 'Borders, outlines, and focus indicators',
    tokens: [
      { name: 'primary', cssVar: '--color-line',       tailwind: 'line',       lightHex: '#0F0E0C',             darkHex: 'rgba(254,248,226,0.2)',   note: 'Default borders' },
      { name: 'muted',   cssVar: '--color-rule',       tailwind: 'rule',       lightHex: 'rgba(15,14,12,0.2)', darkHex: 'rgba(254,248,226,0.12)',  note: 'Subtle dividers' },
      { name: 'hover',   cssVar: '--color-line-hover', tailwind: 'line-hover', lightHex: 'rgba(15,14,12,0.3)', darkHex: 'rgba(254,248,226,0.35)',  note: 'Hover state borders' },
      { name: 'focus',   cssVar: '--color-focus',      tailwind: 'focus',      lightHex: '#FCE184',             darkHex: '#FCE184',                 note: 'Focus rings' },
    ],
  },
  {
    name: 'Action',
    description: 'Interactive element colors for buttons and controls',
    tokens: [
      { name: 'primary',     cssVar: '--color-accent',      tailwind: 'accent',      lightHex: '#FCE184', darkHex: '#FCE184', note: 'Primary buttons' },
      { name: 'secondary',   cssVar: '--color-accent-inv',  tailwind: 'accent-inv',  lightHex: '#0F0E0C', darkHex: '#0F0E0C', note: 'Secondary buttons' },
      { name: 'destructive', cssVar: '--color-danger',      tailwind: 'danger',      lightHex: '#FF7F7F', darkHex: '#FF7F7F', note: 'Delete, remove' },
      { name: 'accent',      cssVar: '--color-accent-soft', tailwind: 'accent-soft', lightHex: '#FCC383', darkHex: '#FCC383', note: 'Warm highlight CTA' },
    ],
  },
  {
    name: 'Status',
    description: 'Feedback and state indicator colors',
    tokens: [
      { name: 'success', cssVar: '--color-success', tailwind: 'success', lightHex: '#CEF5CA', darkHex: '#CEF5CA', note: 'Success states' },
      { name: 'warning', cssVar: '--color-warning', tailwind: 'warning', lightHex: '#FCE184', darkHex: '#FCE184', note: 'Warnings, caution' },
      { name: 'error',   cssVar: '--color-danger',  tailwind: 'danger',  lightHex: '#FF7F7F', darkHex: '#FF7F7F', note: 'Errors, failures' },
      { name: 'info',    cssVar: '--color-link',    tailwind: 'link',    lightHex: '#4A7FA7', darkHex: '#95BAD2', note: 'Informational' },
    ],
  },
];
