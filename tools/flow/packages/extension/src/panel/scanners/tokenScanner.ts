import type { TokenScanResult } from '@flow/shared';
import { cdp } from '../api/cdpBridge';

/**
 * Scan all CSS custom properties from the inspected page.
 *
 * Two-phase approach:
 * 1. CDP discovery — CSS.getMatchedStylesForNode on <html> and <body> to find
 *    custom property names even from cross-origin stylesheets (bypasses CORS).
 * 2. Eval resolution — getComputedStyle resolves values, same-origin walk
 *    catches any additional names, plus framework/dark-mode detection.
 */

// ── CDP types (subset of CSS.getMatchedStylesForNode response) ──

interface CDPCSSProperty {
  name: string;
  value: string;
  disabled?: boolean;
}

interface CDPRuleMatch {
  rule: {
    style?: { cssProperties: CDPCSSProperty[] };
  };
}

interface CDPMatchedStyles {
  inlineStyle?: { cssProperties: CDPCSSProperty[] };
  matchedCSSRules?: CDPRuleMatch[];
  inherited?: Array<{
    inlineStyle?: { cssProperties: CDPCSSProperty[] };
    matchedCSSRules?: CDPRuleMatch[];
  }>;
}

// ── Phase 1: CDP name discovery ──

function extractCustomPropertyNames(matched: CDPMatchedStyles, names: Set<string>): void {
  if (matched.inlineStyle?.cssProperties) {
    for (const prop of matched.inlineStyle.cssProperties) {
      if (prop.name.startsWith('--') && !prop.disabled) names.add(prop.name);
    }
  }

  if (matched.matchedCSSRules) {
    for (const rm of matched.matchedCSSRules) {
      if (!rm.rule.style?.cssProperties) continue;
      for (const prop of rm.rule.style.cssProperties) {
        if (prop.name.startsWith('--') && !prop.disabled) names.add(prop.name);
      }
    }
  }

  if (matched.inherited) {
    for (const entry of matched.inherited) {
      if (entry.inlineStyle?.cssProperties) {
        for (const prop of entry.inlineStyle.cssProperties) {
          if (prop.name.startsWith('--') && !prop.disabled) names.add(prop.name);
        }
      }
      if (entry.matchedCSSRules) {
        for (const rm of entry.matchedCSSRules) {
          if (!rm.rule.style?.cssProperties) continue;
          for (const prop of rm.rule.style.cssProperties) {
            if (prop.name.startsWith('--') && !prop.disabled) names.add(prop.name);
          }
        }
      }
    }
  }
}

async function discoverNamesViaCDP(): Promise<string[]> {
  const names = new Set<string>();

  await cdp('CSS.enable');
  await cdp('DOM.enable');

  const { root } = await cdp<{ root: { nodeId: number } }>('DOM.getDocument', { depth: 0 });
  if (!root?.nodeId) return [];

  // Scan <html> — catches :root, html, * selectors
  const htmlResult = await cdp<{ nodeId: number }>('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: 'html',
  });
  if (htmlResult?.nodeId) {
    const matched = await cdp<CDPMatchedStyles>('CSS.getMatchedStylesForNode', {
      nodeId: htmlResult.nodeId,
    });
    extractCustomPropertyNames(matched, names);
  }

  // Scan <body> — catches body, * selectors
  const bodyResult = await cdp<{ nodeId: number }>('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: 'body',
  });
  if (bodyResult?.nodeId) {
    const matched = await cdp<CDPMatchedStyles>('CSS.getMatchedStylesForNode', {
      nodeId: bodyResult.nodeId,
    });
    extractCustomPropertyNames(matched, names);
  }

  return [...names];
}

// ── Phase 2: Eval-based resolution ──

function buildEvalScript(cdpNames: string[]): string {
  const cdpNamesJson = JSON.stringify(cdpNames);

  return `(function() {
    // ── Merge CDP-discovered names with same-origin stylesheet walk ──
    var names = new Set(${cdpNamesJson});

    function walkRules(rules) {
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (rule instanceof CSSStyleRule) {
          for (var j = 0; j < rule.style.length; j++) {
            var prop = rule.style[j];
            if (prop.startsWith('--')) names.add(prop);
          }
        } else if (rule.cssRules) {
          walkRules(rule.cssRules);
        }
        if (rule.constructor.name === 'CSSPropertyRule' && rule.name && rule.name.startsWith('--')) {
          names.add(rule.name);
        }
      }
    }

    try {
      for (var s = 0; s < document.styleSheets.length; s++) {
        try { walkRules(document.styleSheets[s].cssRules); } catch(e) { /* cross-origin */ }
      }
    } catch(e) {}

    // ── Resolve values ──
    var computed = getComputedStyle(document.documentElement);
    var canvas = document.createElement('canvas').getContext('2d');
    var tokens = [];

    var semanticPattern = /^--(?:color|spacing|size|radius|shadow|font|motion)-(?:surface|content|edge|primary|secondary|tertiary|accent|success|warning|error|info|inverse|muted|disabled|hover|active|focus)/;
    var brandPattern = /^--(color|spacing|size|radius|shadow|font|motion)-/;

    names.forEach(function(name) {
      var value = computed.getPropertyValue(name).trim();
      if (!value) return;

      var resolvedValue = value;
      if (name.startsWith('--color-') && canvas) {
        try { canvas.fillStyle = value; resolvedValue = canvas.fillStyle; } catch(e) {}
      }

      var tier = semanticPattern.test(name) ? 'semantic' : brandPattern.test(name) ? 'brand' : 'unknown';

      var category = 'other';
      if (name.startsWith('--color-')) category = 'color';
      else if (name.startsWith('--spacing-')) category = 'spacing';
      else if (name.startsWith('--radius-')) category = 'radius';
      else if (name.startsWith('--shadow-')) category = 'shadow';
      else if (name.startsWith('--font-')) category = 'font';
      else if (name.startsWith('--motion-')) category = 'motion';
      else if (name.startsWith('--size-')) category = 'size';

      tokens.push({ name: name, value: value, resolvedValue: resolvedValue, category: category, tier: tier });
    });

    // ── Detect dark mode values ──
    var darkTokens = {};
    try {
      for (var s = 0; s < document.styleSheets.length; s++) {
        try {
          var rules = document.styleSheets[s].cssRules;
          for (var r = 0; r < rules.length; r++) {
            var rule = rules[r];
            var isDark = (rule instanceof CSSMediaRule && rule.conditionText && rule.conditionText.indexOf('prefers-color-scheme: dark') !== -1)
              || (rule instanceof CSSStyleRule && rule.selectorText && (rule.selectorText.indexOf('.dark') !== -1 || rule.selectorText.indexOf('[data-theme="dark"]') !== -1));
            if (isDark && rule.cssRules) {
              for (var ir = 0; ir < rule.cssRules.length; ir++) {
                var inner = rule.cssRules[ir];
                if (inner instanceof CSSStyleRule) {
                  for (var ip = 0; ip < inner.style.length; ip++) {
                    var p = inner.style[ip];
                    if (p.startsWith('--')) darkTokens[p] = inner.style.getPropertyValue(p).trim();
                  }
                }
              }
            }
            if (isDark && rule instanceof CSSStyleRule) {
              for (var dp = 0; dp < rule.style.length; dp++) {
                var darkProp = rule.style[dp];
                if (darkProp.startsWith('--')) darkTokens[darkProp] = rule.style.getPropertyValue(darkProp).trim();
              }
            }
          }
        } catch(e) {}
      }
    } catch(e) {}

    for (var t = 0; t < tokens.length; t++) {
      if (darkTokens[tokens[t].name] && darkTokens[tokens[t].name] !== tokens[t].value) {
        tokens[t].darkValue = darkTokens[tokens[t].name];
      }
    }

    // ── Detect framework ──
    var framework = undefined;
    try {
      for (var s = 0; s < document.styleSheets.length; s++) {
        try {
          var rules = document.styleSheets[s].cssRules;
          for (var r = 0; r < rules.length; r++) {
            if (rules[r].cssText && rules[r].cssText.indexOf('@theme') !== -1) { framework = 'tailwind-v4'; break; }
          }
        } catch(e) {}
        if (framework) break;
      }
    } catch(e) {}
    if (!framework) {
      var hasTwVars = false;
      var hasLayers = false;
      for (var t = 0; t < tokens.length; t++) {
        if (tokens[t].name.startsWith('--tw-')) { hasTwVars = true; break; }
      }
      if (hasTwVars) {
        try {
          for (var s = 0; s < document.styleSheets.length; s++) {
            try {
              var rules = document.styleSheets[s].cssRules;
              for (var r = 0; r < rules.length; r++) {
                if (rules[r] instanceof CSSLayerBlockRule) { hasLayers = true; break; }
              }
            } catch(e) {}
            if (hasLayers) break;
          }
        } catch(e) {}
        framework = hasLayers ? 'tailwind-v4' : 'tailwind-v3';
      }
    }

    return {
      tokens: tokens,
      framework: framework,
      colorScheme: Object.keys(darkTokens).length > 0 ? 'both' : 'light'
    };
  })()`;
}

// ── Helpers ──

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// ── Public API ──

export async function scanTokens(): Promise<TokenScanResult> {
  // Phase 1: Discover custom property names via CDP (cross-origin safe)
  // Timeout after 3s — if CDP hangs (debugger attach, service worker), fall back to eval-only
  let cdpNames: string[] = [];
  try {
    cdpNames = await withTimeout(discoverNamesViaCDP(), 3000, []);
  } catch (e) {
    // CDP not available — will rely on eval-only (same-origin sheets)
    console.warn('[tokenScanner] CDP discovery unavailable, falling back to eval-only:', e);
  }

  // Phase 2: Resolve values + merge with same-origin walk + detect framework/dark mode
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      buildEvalScript(cdpNames),
      (result: unknown, exceptionInfo?: { isError?: boolean; description?: string; value?: string }) => {
        if (exceptionInfo?.isError || !result) {
          console.error('[tokenScanner] eval error:', exceptionInfo?.description ?? exceptionInfo?.value ?? 'no result');
          resolve({ tokens: [], colorScheme: 'light' });
          return;
        }
        resolve(result as TokenScanResult);
      },
    );
  });
}
