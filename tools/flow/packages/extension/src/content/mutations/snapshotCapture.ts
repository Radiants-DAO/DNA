/**
 * Compact snapshot capture for element visual state.
 *
 * Per spec §13.6: "Mutation diffs stored as compact JSON patches, not full DOM snapshots."
 * Only captures properties that have non-default values to keep patches small.
 */

/**
 * Capture a compact snapshot of an element's current visual state.
 */
export interface ElementSnapshot {
  /** Element selector at time of capture */
  selector: string;
  /** Inline styles (element.style) — these are what we mutate */
  inlineStyles: Record<string, string>;
  /** Key computed values for the most commonly edited categories */
  computed: {
    layout: Record<string, string>;
    spacing: Record<string, string>;
    size: Record<string, string>;
    typography: Record<string, string>;
    colors: Record<string, string>;
    borders: Record<string, string>;
  };
  /** Text content (first text node only) */
  textContent: string;
}

const LAYOUT_PROPS = [
  'display',
  'position',
  'flex-direction',
  'flex-wrap',
  'align-items',
  'justify-content',
  'grid-template-columns',
  'grid-template-rows',
  'gap',
];

const SPACING_PROPS = [
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
];

const SIZE_PROPS = [
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
];

const TYPOGRAPHY_PROPS = [
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  // Note: 'color' is in COLOR_PROPS to avoid duplicate entries in diffs
];

const COLOR_PROPS = ['background-color', 'color', 'border-color'];

const BORDER_PROPS = [
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
];

function readProps(
  computed: CSSStyleDeclaration,
  props: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const prop of props) {
    const val = computed.getPropertyValue(prop).trim();
    if (val) result[prop] = val;
  }
  return result;
}

function readInlineStyles(el: HTMLElement): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < el.style.length; i++) {
    const prop = el.style[i];
    result[prop] = el.style.getPropertyValue(prop);
  }
  return result;
}

/**
 * Capture a full snapshot of an element's visual state.
 */
export function captureSnapshot(
  el: HTMLElement,
  selector: string
): ElementSnapshot {
  const computed = getComputedStyle(el);
  return {
    selector,
    inlineStyles: readInlineStyles(el),
    computed: {
      layout: readProps(computed, LAYOUT_PROPS),
      spacing: readProps(computed, SPACING_PROPS),
      size: readProps(computed, SIZE_PROPS),
      typography: readProps(computed, TYPOGRAPHY_PROPS),
      colors: readProps(computed, COLOR_PROPS),
      borders: readProps(computed, BORDER_PROPS),
    },
    textContent: el.textContent?.trim() ?? '',
  };
}

/**
 * Compute a compact diff between two snapshots.
 * Only includes properties that changed.
 */
export function diffSnapshots(
  before: ElementSnapshot,
  after: ElementSnapshot
): { property: string; oldValue: string; newValue: string }[] {
  const changes: { property: string; oldValue: string; newValue: string }[] =
    [];

  // Compare all computed categories
  for (const category of [
    'layout',
    'spacing',
    'size',
    'typography',
    'colors',
    'borders',
  ] as const) {
    const beforeCat = before.computed[category];
    const afterCat = after.computed[category];
    const allKeys = new Set([
      ...Object.keys(beforeCat),
      ...Object.keys(afterCat),
    ]);
    for (const key of allKeys) {
      const oldVal = beforeCat[key] ?? '';
      const newVal = afterCat[key] ?? '';
      if (oldVal !== newVal) {
        changes.push({ property: key, oldValue: oldVal, newValue: newVal });
      }
    }
  }

  // Compare text
  if (before.textContent !== after.textContent) {
    changes.push({
      property: 'textContent',
      oldValue: before.textContent,
      newValue: after.textContent,
    });
  }

  return changes;
}
