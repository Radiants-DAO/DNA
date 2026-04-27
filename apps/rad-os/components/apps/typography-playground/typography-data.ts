import { getFontDownloadHref } from '@/lib/asset-downloads';

export type FontCategory = 'core' | 'editorial';

export interface FontEntry {
  name: string;
  shortName: string;
  role: string;
  usage: string;
  description: string;
  className: string;
  cssVar: string;
  fontFamily: string;
  tailwindClass: string;
  weights: { value: number; label: string }[];
  hasItalic: boolean;
  source: string;
  downloadUrl: string;
  linkOut: boolean;
  category: FontCategory;
}

export const FONTS: FontEntry[] = [
  // ── Core fonts (loaded immediately) ──
  {
    name: 'Joystix Monospace',
    shortName: 'Joystix',
    role: 'Display & Headings',
    usage: 'h1–h6, labels, captions, buttons',
    description:
      'An open source pixel font — bold and unapologetic. Use for headings, memes, and visual punch.',
    className: 'font-joystix',
    cssVar: '--font-heading',
    fontFamily: "'Joystix Monospace', monospace",
    tailwindClass: 'font-heading',
    weights: [{ value: 400, label: 'Regular' }],
    hasItalic: false,
    source: 'Open Source',
    downloadUrl: getFontDownloadHref('Joystix.woff2'),
    linkOut: false,
    category: 'core',
  },
  {
    name: 'Mondwest',
    shortName: 'Mondwest',
    role: 'Body & Readability',
    usage: 'paragraphs, descriptions, long-form content',
    description:
      "Radiants' readable font for long-form content. Created by Pangram Pangram — limited weights for non-commercial use.",
    className: 'font-mondwest',
    cssVar: '--font-sans',
    fontFamily: "'Mondwest', Georgia, 'Times New Roman', serif",
    tailwindClass: 'font-sans',
    weights: [
      { value: 400, label: 'Regular' },
      { value: 700, label: 'Bold' },
    ],
    hasItalic: false,
    source: 'Pangram Pangram',
    downloadUrl: getFontDownloadHref('Mondwest.woff2'),
    linkOut: false,
    category: 'core',
  },
  {
    name: 'PixelCode',
    shortName: 'PixelCode',
    role: 'Code & Monospace',
    usage: 'code, pre, kbd, technical data',
    description:
      'A pixel-art monospace font with 4 weights and italic variants. For code blocks, technical labels, and data displays.',
    className: 'font-mono',
    cssVar: '--font-mono',
    fontFamily: "'PixelCode', monospace",
    tailwindClass: 'font-mono',
    weights: [
      { value: 300, label: 'Light' },
      { value: 400, label: 'Regular' },
      { value: 500, label: 'Medium' },
      { value: 700, label: 'Bold' },
    ],
    hasItalic: true,
    source: 'Open Source',
    downloadUrl: getFontDownloadHref('PixelCode.woff2'),
    linkOut: false,
    category: 'core',
  },
  // ── Editorial fonts (lazy-loaded on app-window open) ──
  {
    name: 'Waves Blackletter CPC',
    shortName: 'Blackletter',
    role: 'Display & Editorial',
    usage: 'drop caps, mastheads, display headlines, decorative initials',
    description:
      'A blackletter display face for editorial gravitas. Use for drop caps, mastheads, and moments that demand ceremony.',
    className: 'font-blackletter',
    cssVar: '--font-display',
    fontFamily: "'Waves Blackletter CPC', serif",
    tailwindClass: 'font-display',
    weights: [{ value: 400, label: 'Regular' }],
    hasItalic: false,
    source: 'CPC',
    downloadUrl: getFontDownloadHref('WavesBlackletterCPC-Base.woff2'),
    linkOut: false,
    category: 'editorial',
  },
  {
    name: 'Waves Tiny CPC',
    shortName: 'Tiny',
    role: 'Decorative Caption',
    usage: 'decorative captions, micro-labels, ornamental pixel text',
    description:
      'An ultra-small pixel caption face. For decorative detail work where text becomes texture — colophons, watermarks, ornamental labels.',
    className: 'font-tiny',
    cssVar: '--font-tiny',
    fontFamily: "'Waves Tiny CPC', serif",
    tailwindClass: 'font-tiny',
    weights: [{ value: 400, label: 'Regular' }],
    hasItalic: false,
    source: 'CPC',
    downloadUrl: getFontDownloadHref('WavesTinyCPC-Extended.woff2'),
    linkOut: false,
    category: 'editorial',
  },
  {
    name: 'Pixeloid Sans',
    shortName: 'Pixeloid',
    role: 'Caption & Byline',
    usage: 'bylines, datelines, attribution, secondary labels',
    description:
      'A clean pixel sans-serif for informational text. The quiet voice — bylines, datelines, metadata. Readable at small sizes without the weight of PixelCode.',
    className: 'font-pixeloid',
    cssVar: '--font-caption',
    fontFamily: "'Pixeloid Sans', sans-serif",
    tailwindClass: 'font-caption',
    weights: [
      { value: 400, label: 'Regular' },
      { value: 700, label: 'Bold' },
    ],
    hasItalic: false,
    source: 'Open Source',
    downloadUrl: getFontDownloadHref('PixeloidSans.woff2'),
    linkOut: false,
    category: 'editorial',
  },
];

/** Fonts grouped by category */
export const CORE_FONTS = FONTS.filter(f => f.category === 'core');
export const EDITORIAL_FONTS = FONTS.filter(f => f.category === 'editorial');

export const TYPE_SCALE = [
  { token: '--font-size-5xl', label: '5XL', rem: '5.61rem', px: 90 },
  { token: '--font-size-4xl', label: '4XL', rem: '4.209rem', px: 67 },
  { token: '--font-size-3xl', label: '3XL', rem: '3.157rem', px: 50 },
  { token: '--font-size-2xl', label: '2XL', rem: '2.369rem', px: 38 },
  { token: '--font-size-xl', label: 'XL', rem: '1.777rem', px: 28 },
  { token: '--font-size-lg', label: 'LG', rem: '1.333rem', px: 21 },
  { token: '--font-size-base', label: 'Base', rem: '1rem', px: 16 },
  { token: '--font-size-sm', label: 'SM', rem: '0.75rem', px: 12 },
  { token: '--font-size-xs', label: 'XS', rem: '0.625rem', px: 10 },
] as const;

export const ELEMENT_STYLES = [
  { el: 'h1', font: 'Joystix', fontClass: 'font-joystix', size: '4xl', weight: 700, leading: 'tight' },
  { el: 'h2', font: 'Joystix', fontClass: 'font-joystix', size: '3xl', weight: 400, leading: 'tight' },
  { el: 'h3', font: 'Joystix', fontClass: 'font-joystix', size: '2xl', weight: 600, leading: 'snug' },
  { el: 'h4', font: 'Joystix', fontClass: 'font-joystix', size: 'xl', weight: 500, leading: 'snug' },
  { el: 'p', font: 'Mondwest', fontClass: 'font-mondwest', size: 'base', weight: 400, leading: 'relaxed' },
  { el: 'a', font: 'Mondwest', fontClass: 'font-mondwest', size: 'base', weight: 400, leading: 'normal' },
  { el: 'code', font: 'PixelCode', fontClass: 'font-mono', size: 'sm', weight: 400, leading: 'normal' },
  { el: 'pre', font: 'PixelCode', fontClass: 'font-mono', size: 'sm', weight: 400, leading: 'relaxed' },
  { el: 'label', font: 'Joystix', fontClass: 'font-joystix', size: 'xs', weight: 500, leading: 'normal' },
] as const;
