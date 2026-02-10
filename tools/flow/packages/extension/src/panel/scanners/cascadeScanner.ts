import type { CascadeEntry, CascadeResult } from '@flow/shared';
import { cdp } from '../api/cdpBridge';
import { resolveSelectedNodeId } from '../api/elementResolver';

/**
 * Get the full CSS cascade for the currently selected element via CDP.
 * Uses CSS.getMatchedStylesForNode which returns the actual cascade —
 * not just computed values, but which rule from which stylesheet.
 */
export async function getCascade(): Promise<CascadeResult> {
  const nodeId = await resolveSelectedNodeId();
  if (!nodeId) return { inlineStyles: [], matchedRules: [], inheritedRules: [] };

  try {
    await cdp('CSS.enable');

    const matched = await cdp('CSS.getMatchedStylesForNode', { nodeId }) as {
      inlineStyle?: CDPStyle;
      matchedCSSRules?: CDPRuleMatch[];
      inherited?: Array<{ inlineStyle?: CDPStyle; matchedCSSRules?: CDPRuleMatch[] }>;
    };

    const seenProperties = new Set<string>();
    const inlineStyles: CascadeEntry[] = [];
    const matchedRules: CascadeEntry[] = [];
    const inheritedRules: CascadeEntry[] = [];

    // ── Inline styles (highest specificity) ──
    if (matched.inlineStyle?.cssProperties) {
      for (const prop of matched.inlineStyle.cssProperties) {
        if (prop.disabled || !prop.value) continue;
        seenProperties.add(prop.name);
        inlineStyles.push({
          property: prop.name,
          value: prop.value,
          selector: 'element.style',
          source: 'inline',
          isInherited: false,
          isOverridden: false,
        });
      }
    }

    // ── Matched rules (own element) ──
    if (matched.matchedCSSRules) {
      // Rules come in cascade order (last = highest priority)
      // Reverse to process highest priority first
      const rules = [...matched.matchedCSSRules].reverse();
      for (const ruleMatch of rules) {
        const rule = ruleMatch.rule;
        if (!rule?.style?.cssProperties) continue;

        const selector = rule.selectorList?.selectors?.map(
          (s: { text: string }) => s.text
        ).join(', ') || '(unknown)';

        const source = rule.origin === 'user-agent'
          ? 'user-agent'
          : rule.styleSheetId
            ? getStyleSheetId(rule.styleSheetId)
            : 'unknown';

        for (const prop of rule.style.cssProperties) {
          if (prop.disabled || !prop.value) continue;

          const isOverridden = seenProperties.has(prop.name);
          if (!isOverridden) seenProperties.add(prop.name);

          matchedRules.push({
            property: prop.name,
            value: prop.value,
            selector,
            source,
            isInherited: false,
            isOverridden,
          });
        }
      }
    }

    // ── Inherited rules ──
    if (matched.inherited) {
      for (const ancestor of matched.inherited) {
        // Inline styles from ancestor
        if (ancestor.inlineStyle?.cssProperties) {
          for (const prop of ancestor.inlineStyle.cssProperties) {
            if (prop.disabled || !prop.value || !isInheritableProperty(prop.name)) continue;

            const isOverridden = seenProperties.has(prop.name);
            if (!isOverridden) seenProperties.add(prop.name);

            inheritedRules.push({
              property: prop.name,
              value: prop.value,
              selector: 'inherited element.style',
              source: 'inline',
              isInherited: true,
              isOverridden,
            });
          }
        }

        // Matched rules from ancestor
        if (ancestor.matchedCSSRules) {
          const rules = [...ancestor.matchedCSSRules].reverse();
          for (const ruleMatch of rules) {
            const rule = ruleMatch.rule;
            if (!rule?.style?.cssProperties) continue;

            const selector = rule.selectorList?.selectors?.map(
              (s: { text: string }) => s.text
            ).join(', ') || '(unknown)';

            const source = rule.origin === 'user-agent'
              ? 'user-agent'
              : rule.styleSheetId
                ? getStyleSheetId(rule.styleSheetId)
                : 'unknown';

            for (const prop of rule.style.cssProperties) {
              if (prop.disabled || !prop.value || !isInheritableProperty(prop.name)) continue;

              const isOverridden = seenProperties.has(prop.name);
              if (!isOverridden) seenProperties.add(prop.name);

              inheritedRules.push({
                property: prop.name,
                value: prop.value,
                selector,
                source,
                isInherited: true,
                isOverridden,
              });
            }
          }
        }
      }
    }

    return { inlineStyles, matchedRules, inheritedRules };
  } catch (e) {
    console.error('[cascadeScanner] CDP error:', e);
    return { inlineStyles: [], matchedRules: [], inheritedRules: [] };
  }
}

// ── Helpers ──

/** CDP style types (subset of what CSS.getMatchedStylesForNode returns) */
interface CDPStyle {
  cssProperties: Array<{
    name: string;
    value: string;
    disabled?: boolean;
  }>;
}

interface CDPRuleMatch {
  rule: {
    selectorList?: { selectors?: Array<{ text: string }> };
    origin?: string;
    styleSheetId?: string;
    style?: CDPStyle;
  };
}

/** Return the raw styleSheetId — resolve to URL later via CSS.getStyleSheetText if needed. */
function getStyleSheetId(styleSheetId: string): string {
  return styleSheetId;
}

/** Check if a CSS property is inheritable. */
const INHERITABLE_PROPERTIES = new Set([
  'azimuth', 'border-collapse', 'border-spacing', 'caption-side',
  'color', 'cursor', 'direction', 'empty-cells',
  'font', 'font-family', 'font-feature-settings', 'font-kerning',
  'font-size', 'font-size-adjust', 'font-stretch', 'font-style',
  'font-variant', 'font-variant-caps', 'font-variant-east-asian',
  'font-variant-ligatures', 'font-variant-numeric', 'font-weight',
  'hyphens', 'letter-spacing', 'line-height',
  'list-style', 'list-style-image', 'list-style-position', 'list-style-type',
  'orphans', 'overflow-wrap', 'quotes', 'tab-size',
  'text-align', 'text-align-last', 'text-decoration-skip-ink',
  'text-indent', 'text-justify', 'text-overflow', 'text-transform',
  'text-underline-position', 'visibility',
  'white-space', 'widows', 'word-break', 'word-spacing', 'word-wrap',
  'writing-mode', '-webkit-text-fill-color',
]);

function isInheritableProperty(name: string): boolean {
  return INHERITABLE_PROPERTIES.has(name) || name.startsWith('--');
}
