/**
 * Scans CSS content for live non-OKLCH color formats in token CSS files.
 * Comments are stripped before scanning so migration notes such as
 * "was #FEF8E2" do not fail the check.
 *
 * @param {string} css - Raw CSS file content
 * @param {string} filename - For error reporting
 * @returns {Array<{line: number, column: number, value: string, type: string, file: string}>}
 */
export function scanForLegacyColors(css, filename) {
  const violations = [];
  // Replace comment content with spaces, preserving newlines for line counting
  const commentStrippedCss = css.replace(/\/\*[\s\S]*?\*\//g, match =>
    match.replace(/[^\n]/g, ' ')
  );
  const lines = commentStrippedCss.split('\n');
  const patterns = [
    { type: 'hex', re: /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g },
    { type: 'rgba', re: /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g },
    { type: 'rgb', re: /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g },
    { type: 'hsla', re: /hsla\(\s*[^)]+\)/g },
    { type: 'hsl', re: /hsl\(\s*[^)]+\)/g },
    { type: 'hwb', re: /hwb\(\s*[^)]+\)/g },
    { type: 'lab', re: /(?<!ok)lab\(\s*[^)]+\)/g },
    { type: 'lch', re: /(?<!ok)lch\(\s*[^)]+\)/g },
    { type: 'oklab', re: /oklab\(\s*[^)]+\)/g },
    { type: 'color-mix', re: /color-mix\(\s*[^)]+\)/g },
    { type: 'color', re: /color\(\s*[^)]+\)/g },
    { type: 'device-cmyk', re: /device-cmyk\(\s*[^)]+\)/g },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (line.trim() === '') continue;

    for (const { type, re } of patterns) {
      for (const match of line.matchAll(re)) {
        violations.push({
          line: lineNum,
          column: match.index + 1,
          value: match[0],
          type,
          file: filename,
        });
      }
    }
  }

  return violations;
}
