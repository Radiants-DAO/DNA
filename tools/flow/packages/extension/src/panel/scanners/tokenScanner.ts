import type { TokenScanResult } from '@flow/shared';

/**
 * Scan all CSS custom properties from the inspected page.
 * Uses inspectedWindow.eval() to run in the page's MAIN world.
 * No content script hop needed — pure read with no DOM side effects.
 */
export async function scanTokens(): Promise<TokenScanResult> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      `(function() {
        // ── Collect custom property names from all stylesheets ──
        var names = new Set();

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

        // Inlined from scannerUtils.ts — keep in sync
        var semanticPattern = /^--(?:color|spacing|size|radius|shadow|font|motion)-(?:surface|content|edge|primary|secondary|tertiary|accent|success|warning|error|info|inverse|muted|disabled|hover|active|focus)/;
        var brandPattern = /^--(color|spacing|size|radius|shadow|font|motion)-/;

        names.forEach(function(name) {
          var value = computed.getPropertyValue(name).trim();
          if (!value) return;

          // Resolve color values via canvas
          var resolvedValue = value;
          if (name.startsWith('--color-') && canvas) {
            try { canvas.fillStyle = value; resolvedValue = canvas.fillStyle; } catch(e) {}
          }

          // Classify tier — inlined from scannerUtils.ts
          var tier = semanticPattern.test(name) ? 'semantic' : brandPattern.test(name) ? 'brand' : 'unknown';

          // Infer category — inlined from scannerUtils.ts
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

        // Merge dark values
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
          for (var t = 0; t < tokens.length; t++) {
            if (tokens[t].name.startsWith('--tw-')) { framework = 'tailwind-v3'; break; }
          }
        }

        return {
          tokens: tokens,
          framework: framework,
          colorScheme: Object.keys(darkTokens).length > 0 ? 'both' : 'light'
        };
      })()`,
      (result: unknown, exceptionInfo?: { isError?: boolean; description?: string }) => {
        if (exceptionInfo?.isError) {
          console.error('[tokenScanner] eval error:', exceptionInfo.description);
          resolve({ tokens: [], colorScheme: 'light' });
          return;
        }
        resolve(result as TokenScanResult);
      },
    );
  });
}
