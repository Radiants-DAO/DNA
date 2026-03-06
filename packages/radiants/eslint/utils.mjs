/**
 * Shared utilities for eslint-plugin-rdna rules.
 */

// Regex patterns for detecting hardcoded values in className strings
export const HEX_PATTERN = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
export const RGB_PATTERN = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g;
export const HSL_PATTERN = /hsla?\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+\s*)?\)/g;

// Optional Tailwind modifier prefix: hover:, dark:, md:, focus:, etc. (stackable)
const MOD = '(?:[\\w-]+:)*';

// Matches arbitrary Tailwind color values: bg-[#fff], hover:text-[rgb(0,0,0)], etc.
export const ARBITRARY_COLOR_CLASS = new RegExp(`${MOD}(?:bg|text|border|ring|outline|decoration|accent|caret|fill|stroke|from|via|to|divide|placeholder)-\\[(?:#[0-9a-fA-F]{3,8}|rgba?\\([^)]+\\)|hsla?\\([^)]+\\))\\]`, 'g');

// Matches arbitrary spacing values: p-[12px], hover:gap-[13px], mx-[5%], etc.
// Intentionally limited to spacing concerns, not general sizing or positioning.
export const ARBITRARY_SPACING_CLASS = new RegExp(`${MOD}(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y)-\\[[^\\]]+\\]`, 'g');

// Matches arbitrary font-size values: text-[44px], dark:text-[1.1rem]
export const ARBITRARY_TEXT_SIZE_CLASS = new RegExp(`${MOD}text-\\[\\d+(?:\\.\\d+)?(?:px|rem|em|%|vw|vh)\\]`, 'g');

// Matches arbitrary font-weight values: font-[450], hover:font-[700]
export const ARBITRARY_FONT_WEIGHT_CLASS = new RegExp(`${MOD}font-\\[\\d+\\]`, 'g');

/**
 * Normalize hex to lowercase 6-digit form for lookup.
 */
export function normalizeHex(hex) {
  let h = hex.toLowerCase().replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; // drop alpha for lookup
  if (h.length === 8) h = h.slice(0, 6); // drop alpha for lookup
  return '#' + h;
}

/**
 * Extract the Tailwind prefix context from an arbitrary class.
 * e.g. "bg-[#fff]" → "bg", "text-[#000]" → "text"
 */
export function extractPrefixContext(cls) {
  // Strip Tailwind modifier prefixes (hover:, dark:, md:, etc.)
  const stripped = cls.replace(/^(?:[\w-]+:)+/, '');
  const match = stripped.match(/^(bg|text|border|ring|outline|decoration|accent|caret|fill|stroke|from|via|to|divide|placeholder)-\[/);
  return match ? match[1] : null;
}

/**
 * Map a Tailwind color prefix to a token-map context key.
 * bg → bg, text → text, border → border, ring → ring, etc.
 */
export function prefixToContext(prefix) {
  if (['bg', 'from', 'via', 'to'].includes(prefix)) return 'bg';
  if (['text', 'decoration', 'caret', 'placeholder', 'accent'].includes(prefix)) return 'text';
  if (['border', 'outline', 'divide'].includes(prefix)) return 'border';
  if (['ring'].includes(prefix)) return 'ring';
  if (['fill', 'stroke'].includes(prefix)) return 'bg'; // SVG context — treat as bg
  return null;
}

/**
 * Check if a file path is inside radiants component internals (exempt from wrapper rule).
 */
export function isRadiantsInternal(filename) {
  return filename.includes('packages/radiants/components/core/');
}

// Class-builder function names whose string arguments contain Tailwind classes.
const CLASS_BUILDERS = new Set(['cva', 'cn', 'clsx', 'cx', 'twMerge']);

/**
 * Extract all className string literal values from a JSX attribute or call expression.
 * Returns array of { value, node } for each string segment.
 */
export function getClassNameStrings(node) {
  // Handle: className="foo bar"
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return [{ value: node.value, node }];
  }
  // Handle: className={`foo bar`}
  if (node.type === 'TemplateLiteral') {
    return node.quasis.map(q => ({ value: q.value.raw, node: q }));
  }
  // Handle: className={"foo bar"}
  if (node.type === 'JSXExpressionContainer') {
    return getClassNameStrings(node.expression);
  }
  // Handle: cva("p-4 text-sm"), cn("bg-surface-primary", variant), clsx("mt-2")
  if (node.type === 'CallExpression') {
    const callee = node.callee;
    const name = callee.type === 'Identifier' ? callee.name : null;
    if (!name || !CLASS_BUILDERS.has(name)) return [];
    const results = [];
    for (const arg of node.arguments) {
      results.push(...getClassNameStrings(arg));
    }
    return results;
  }
  return [];
}
