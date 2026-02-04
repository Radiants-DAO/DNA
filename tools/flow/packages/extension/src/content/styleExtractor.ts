import type { GroupedStyles, StyleEntry } from '@flow/shared';

/** Properties per category, matching spec §7.5 */
const STYLE_CATEGORIES: Record<keyof GroupedStyles, string[]> = {
  layout: [
    'display',
    'position',
    'top', 'right', 'bottom', 'left',
    'z-index',
    'float',
    'clear',
    'flex-direction', 'flex-wrap', 'flex-flow',
    'align-items', 'align-content', 'align-self',
    'justify-content', 'justify-items', 'justify-self',
    'place-items', 'place-content', 'place-self',
    'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
    'grid-auto-columns', 'grid-auto-rows', 'grid-auto-flow',
    'grid-column', 'grid-row', 'grid-area',
    'order',
    'overflow', 'overflow-x', 'overflow-y',
  ],
  spacing: [
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'gap', 'row-gap', 'column-gap',
  ],
  size: [
    'width', 'height',
    'min-width', 'min-height',
    'max-width', 'max-height',
    'aspect-ratio',
    'box-sizing',
    'flex-basis', 'flex-grow', 'flex-shrink',
  ],
  typography: [
    'font-family', 'font-size', 'font-weight', 'font-style',
    'font-variant', 'font-stretch',
    'line-height', 'letter-spacing', 'word-spacing',
    'text-align', 'text-decoration', 'text-transform',
    'text-indent', 'text-overflow', 'text-wrap',
    'white-space', 'word-break', 'overflow-wrap',
    'vertical-align',
    '-webkit-line-clamp',
  ],
  colors: [
    'color',
    'background', 'background-color', 'background-image', 'background-gradient',
    'caret-color',
    'accent-color',
    'outline-color',
  ],
  borders: [
    'border', 'border-width', 'border-style', 'border-color',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-radius',
    'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
    'outline', 'outline-width', 'outline-style', 'outline-offset',
  ],
  shadows: [
    'box-shadow',
    'text-shadow',
  ],
  effects: [
    'opacity',
    'visibility',
    'filter',
    'backdrop-filter',
    'mix-blend-mode',
    'isolation',
    'clip-path',
    'mask',
    'transform',
    'transform-origin',
    'perspective',
    'will-change',
    'contain',
    'pointer-events',
    'cursor',
  ],
  animations: [
    'transition', 'transition-property', 'transition-duration',
    'transition-timing-function', 'transition-delay',
    'animation', 'animation-name', 'animation-duration',
    'animation-timing-function', 'animation-delay',
    'animation-iteration-count', 'animation-direction',
    'animation-fill-mode', 'animation-play-state',
  ],
};

/**
 * Default/empty values to filter out for cleaner output.
 */
const SKIP_VALUES = new Set([
  'none', 'normal', 'auto', 'visible', '0px', '0s', 'static',
  'start', 'baseline', 'stretch', 'row', 'content-box',
  'running', 'ltr', 'separate',
]);

/**
 * Extract computed styles for an element, grouped by category.
 * Filters out default/empty values to reduce noise.
 */
export function extractGroupedStyles(element: Element): GroupedStyles {
  const computed = getComputedStyle(element);
  const result: GroupedStyles = {
    layout: [],
    spacing: [],
    size: [],
    typography: [],
    colors: [],
    borders: [],
    shadows: [],
    effects: [],
    animations: [],
  };

  for (const [category, properties] of Object.entries(STYLE_CATEGORIES)) {
    const entries: StyleEntry[] = [];

    for (const prop of properties) {
      const value = computed.getPropertyValue(prop).trim();
      if (!value || SKIP_VALUES.has(value)) continue;

      entries.push({ property: prop, value });
    }

    result[category as keyof GroupedStyles] = entries;
  }

  return result;
}
