import type { LanguageAdapter } from '@flow/shared';

export interface TranslationEntry {
  css: string;
  tailwind: string;
  figma: string;
}

/**
 * Bidirectional translation table per spec section 7.4.
 * Key is the canonical CSS property:value pair.
 */
const TRANSLATIONS: TranslationEntry[] = [
  { css: 'display: flex', tailwind: 'flex', figma: 'Auto layout' },
  { css: 'display: grid', tailwind: 'grid', figma: 'Grid layout' },
  { css: 'display: block', tailwind: 'block', figma: 'Frame' },
  { css: 'display: none', tailwind: 'hidden', figma: 'Hidden' },
  { css: 'flex: 1', tailwind: 'flex-1', figma: 'Fill container' },
  { css: 'flex-direction: row', tailwind: 'flex-row', figma: 'Horizontal' },
  { css: 'flex-direction: column', tailwind: 'flex-col', figma: 'Vertical' },
  { css: 'width: fit-content', tailwind: 'w-fit', figma: 'Hug contents' },
  { css: 'height: fit-content', tailwind: 'h-fit', figma: 'Hug contents' },
  { css: 'width: 100%', tailwind: 'w-full', figma: 'Fill container' },
  { css: 'align-items: center', tailwind: 'items-center', figma: 'Center (cross axis)' },
  { css: 'justify-content: center', tailwind: 'justify-center', figma: 'Center (main axis)' },
  { css: 'justify-content: space-between', tailwind: 'justify-between', figma: 'Space between' },
  { css: 'position: absolute', tailwind: 'absolute', figma: 'Absolute position' },
  { css: 'position: relative', tailwind: 'relative', figma: 'Relative' },
  { css: 'overflow: hidden', tailwind: 'overflow-hidden', figma: 'Clip content' },
];

/** Pixel-based gap/spacing translation for Tailwind */
const SPACING_SCALE: Record<number, string> = {
  0: '0', 1: 'px', 2: '0.5', 4: '1', 6: '1.5', 8: '2', 10: '2.5',
  12: '3', 14: '3.5', 16: '4', 20: '5', 24: '6', 28: '7', 32: '8',
  36: '9', 40: '10', 44: '11', 48: '12', 56: '14', 64: '16', 80: '20',
  96: '24', 112: '28', 128: '32', 144: '36', 160: '40', 176: '44',
  192: '48', 208: '52', 224: '56', 240: '60', 256: '64', 288: '72',
  320: '80', 384: '96',
};

/** Grid column translation for Tailwind */
function translateGridCols(css: string): string | null {
  const match = css.match(/^grid-template-columns:\s*repeat\((\d+),\s*1fr\)$/);
  if (match) return `grid-cols-${match[1]}`;
  return null;
}

/** Translate a gap value like "gap: 16px" to Tailwind "gap-4" */
function translateGap(css: string): string | null {
  const match = css.match(/^gap:\s*(\d+)px$/);
  if (match) {
    const px = parseInt(match[1], 10);
    const tw = SPACING_SCALE[px];
    return tw ? `gap-${tw}` : `gap-[${px}px]`;
  }
  return null;
}

/** Translate padding/margin like "padding: 16px" to Tailwind "p-4" */
function translateSpacing(css: string): string | null {
  const match = css.match(/^(padding|margin):\s*(\d+)px$/);
  if (match) {
    const prefix = match[1] === 'padding' ? 'p' : 'm';
    const px = parseInt(match[2], 10);
    const tw = SPACING_SCALE[px];
    return tw ? `${prefix}-${tw}` : `${prefix}-[${px}px]`;
  }
  return null;
}

export function translate(cssDeclaration: string, target: LanguageAdapter): string {
  if (target === 'css') return cssDeclaration;

  // Check exact matches first
  const entry = TRANSLATIONS.find((t) => t.css === cssDeclaration);
  if (entry) return entry[target];

  if (target === 'tailwind') {
    const grid = translateGridCols(cssDeclaration);
    if (grid) return grid;
    const gap = translateGap(cssDeclaration);
    if (gap) return gap;
    const spacing = translateSpacing(cssDeclaration);
    if (spacing) return spacing;
  }

  if (target === 'figma') {
    // Gap → Item spacing for Figma
    const gapMatch = cssDeclaration.match(/^gap:\s*(\d+)px$/);
    if (gapMatch) return `Item spacing: ${gapMatch[1]}`;

    const gridMatch = cssDeclaration.match(/^grid-template-columns:\s*repeat\((\d+),\s*1fr\)$/);
    if (gridMatch) return `${gridMatch[1]}-column grid`;
  }

  // Fallback: return raw CSS
  return cssDeclaration;
}

/**
 * Get dropdown options for a property in the active language.
 * Used by prompt builder dropdowns.
 */
export function getDropdownOptions(language: LanguageAdapter): { label: string; css: string }[] {
  return TRANSLATIONS.map((t) => ({
    label: t[language],
    css: t.css,
  }));
}
