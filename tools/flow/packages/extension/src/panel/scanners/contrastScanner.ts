import type { ContrastIssue } from '@flow/shared';

/**
 * Check color contrast of text elements via inspectedWindow.eval().
 * Computes WCAG 2.1 contrast ratios for text elements.
 * Supplements the CDP accessibility audit with contrast data.
 */
export async function checkContrast(): Promise<ContrastIssue[]> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      `(function() {
        // ── WCAG 2.1 relative luminance calculation ──
        function sRGBtoLinear(c) {
          c = c / 255;
          return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        }

        function relativeLuminance(r, g, b) {
          return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
        }

        function contrastRatio(l1, l2) {
          var lighter = Math.max(l1, l2);
          var darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }

        // Parse rgb/rgba string to [r, g, b, a]
        function parseColor(str) {
          if (!str) return null;
          var match = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
          if (!match) return null;
          return {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10),
            a: match[4] !== undefined ? parseFloat(match[4]) : 1
          };
        }

        // Blend foreground (with alpha) over background
        function blendAlpha(fg, bg) {
          if (fg.a >= 1) return fg;
          var a = fg.a;
          return {
            r: Math.round(fg.r * a + bg.r * (1 - a)),
            g: Math.round(fg.g * a + bg.g * (1 - a)),
            b: Math.round(fg.b * a + bg.b * (1 - a)),
            a: 1
          };
        }

        // Walk up the DOM to find an opaque background (fully iterative)
        function getEffectiveBackground(el) {
          var layers = [];
          var node = el;
          while (node && node !== document.documentElement) {
            var style = getComputedStyle(node);
            var bg = parseColor(style.backgroundColor);
            if (bg && bg.a > 0) {
              layers.push(bg);
              if (bg.a >= 1) break;
            }
            node = node.parentElement;
          }
          // Composite bottom-up: start from white, blend each layer from back to front
          var result = { r: 255, g: 255, b: 255, a: 1 };
          for (var i = layers.length - 1; i >= 0; i--) {
            result = blendAlpha(layers[i], result);
          }
          return result;
        }

        var issues = [];
        var textEls = document.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, button');
        var limit = Math.min(textEls.length, 200);
        var seen = {};

        for (var i = 0; i < limit; i++) {
          var el = textEls[i];
          // Skip hidden and empty elements
          if (!el.offsetParent && el.tagName !== 'BODY') continue;
          var text = (el.textContent || '').trim();
          if (!text || text.length > 10000) continue;

          var style = getComputedStyle(el);
          var fg = parseColor(style.color);
          if (!fg) continue;

          var bg = getEffectiveBackground(el);
          if (!bg) continue;

          // Blend fg alpha over bg
          var effectiveFg = blendAlpha(fg, bg);

          var fgLum = relativeLuminance(effectiveFg.r, effectiveFg.g, effectiveFg.b);
          var bgLum = relativeLuminance(bg.r, bg.g, bg.b);
          var ratio = contrastRatio(fgLum, bgLum);

          // Round to 2 decimals
          ratio = Math.round(ratio * 100) / 100;

          var fontSize = parseFloat(style.fontSize);
          var fontWeight = parseInt(style.fontWeight, 10) || 400;
          var largeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);

          var passesAA = largeText ? ratio >= 3 : ratio >= 4.5;
          var passesAAA = largeText ? ratio >= 4.5 : ratio >= 7;

          if (!passesAA) {
            // Build a simple selector for identification
            var selector = el.tagName.toLowerCase();
            if (el.id) selector += '#' + el.id;
            else if (el.className && typeof el.className === 'string') {
              var cls = el.className.trim().split(/\\s+/)[0];
              if (cls) selector += '.' + cls;
            }

            var fgStr = 'rgb(' + effectiveFg.r + ', ' + effectiveFg.g + ', ' + effectiveFg.b + ')';
            var bgStr = 'rgb(' + bg.r + ', ' + bg.g + ', ' + bg.b + ')';

            // Dedup by selector + colors + text to avoid merging distinct elements
            var dedupKey = selector + '::' + fgStr + '::' + bgStr + '::' + text.substring(0, 20);
            if (seen[dedupKey]) continue;
            seen[dedupKey] = true;

            issues.push({
              selector: selector,
              text: text.substring(0, 40),
              foreground: fgStr,
              background: bgStr,
              ratio: ratio,
              largeText: largeText,
              passesAA: false,
              passesAAA: false
            });
          }
        }

        return issues;
      })()`,
      (result: unknown, exceptionInfo?: { isError?: boolean; description?: string; value?: string }) => {
        if (exceptionInfo?.isError || !result) {
          console.error('[contrastScanner] eval error:', exceptionInfo?.description ?? exceptionInfo?.value ?? 'no result');
          resolve([]);
          return;
        }
        resolve(result as ContrastIssue[]);
      },
    );
  });
}
