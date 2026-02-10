import type { CustomProperty } from '@flow/shared';
import { classifyTier } from '@flow/shared';

export { classifyTier };

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
