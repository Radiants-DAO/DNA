import type { CustomProperty } from '@flow/shared';

/**
 * DNA token naming convention patterns:
 * - Brand (Tier 1): --color-{name} (raw palette, e.g. --color-sun-yellow)
 * - Semantic (Tier 2): --color-{purpose}-{variant} (e.g. --color-surface-primary)
 *
 * Semantic purposes: surface, content, edge, accent, status
 * If it matches a semantic purpose pattern, it's semantic. Otherwise brand.
 */
const SEMANTIC_PURPOSES = [
  'surface',
  'content',
  'edge',
  'accent',
  'status',
  'interactive',
  'focus',
  'disabled',
];

const SEMANTIC_PATTERN = new RegExp(
  `^--(?:color|spacing|size|radius|shadow|font|motion)-(?:${SEMANTIC_PURPOSES.join('|')})`
);

/**
 * Classify a custom property name into brand or semantic tier.
 */
export function classifyTier(name: string): 'brand' | 'semantic' | 'unknown' {
  if (SEMANTIC_PATTERN.test(name)) return 'semantic';

  // Brand tokens use raw descriptive names like --color-sun-yellow, --color-midnight
  if (name.startsWith('--color-') || name.startsWith('--spacing-') ||
      name.startsWith('--size-') || name.startsWith('--radius-') ||
      name.startsWith('--shadow-') || name.startsWith('--font-') ||
      name.startsWith('--motion-')) {
    return 'brand';
  }

  return 'unknown';
}

/**
 * Extract all CSS custom properties (--*) from an element's computed style.
 *
 * Note: getComputedStyle does not directly list custom properties.
 * We must walk all stylesheets to find which custom properties apply,
 * then read their computed values.
 */
export function extractCustomProperties(element: Element): CustomProperty[] {
  const properties: CustomProperty[] = [];
  const seen = new Set<string>();
  const computedStyle = getComputedStyle(element);

  // Strategy 1: Walk all stylesheets to find custom property names
  const customPropNames = collectCustomPropertyNames();

  // Strategy 2: Also check inline style
  const inlineStyle = (element as HTMLElement).style;
  if (inlineStyle) {
    for (let i = 0; i < inlineStyle.length; i++) {
      const prop = inlineStyle[i];
      if (prop.startsWith('--')) {
        customPropNames.add(prop);
      }
    }
  }

  // Read computed values for all discovered custom properties
  for (const name of customPropNames) {
    if (seen.has(name)) continue;
    seen.add(name);

    const value = computedStyle.getPropertyValue(name).trim();
    if (value) {
      properties.push({
        name,
        value,
        tier: classifyTier(name),
      });
    }
  }

  // Sort: semantic first, then brand, then unknown
  const tierOrder = { semantic: 0, brand: 1, unknown: 2 };
  properties.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return properties;
}

/**
 * Collect all custom property names defined across all stylesheets.
 * Cached per call to avoid redundant walks.
 */
function collectCustomPropertyNames(): Set<string> {
  const names = new Set<string>();

  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules;
        for (let i = 0; i < rules.length; i++) {
          extractPropsFromRule(rules[i], names);
        }
      } catch {
        // Cross-origin stylesheets throw SecurityError — skip
      }
    }
  } catch {
    // document.styleSheets not accessible
  }

  return names;
}

function extractPropsFromRule(rule: CSSRule, names: Set<string>): void {
  if (rule instanceof CSSStyleRule) {
    const style = rule.style;
    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      if (prop.startsWith('--')) {
        names.add(prop);
      }
    }
  } else if (
    rule instanceof CSSMediaRule ||
    rule instanceof CSSSupportsRule
  ) {
    for (let i = 0; i < rule.cssRules.length; i++) {
      extractPropsFromRule(rule.cssRules[i], names);
    }
  }
}
