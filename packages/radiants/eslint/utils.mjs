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

// Matches arbitrary radius values: rounded-[6px], hover:rounded-t-[8px], etc.
export const ARBITRARY_RADIUS_CLASS = new RegExp(`${MOD}rounded(?:-[trblse]{1,2})?-\\[[^\\]]+\\]`, 'g');

// Matches arbitrary shadow values: shadow-[...], drop-shadow-[...], etc.
export const ARBITRARY_SHADOW_CLASS = new RegExp(`${MOD}(?:shadow|drop-shadow)-\\[[^\\]]+\\]`, 'g');

// Matches arbitrary duration values: duration-[175ms], duration-[0.2s], etc.
export const ARBITRARY_DURATION_CLASS = new RegExp(`${MOD}duration-\\[[^\\]]+\\]`, 'g');

// Matches arbitrary easing values: ease-[cubic-bezier(...)], etc.
export const ARBITRARY_EASING_CLASS = new RegExp(`${MOD}ease-\\[[^\\]]+\\]`, 'g');

// Matches viewport breakpoint prefixes: sm:, md:, lg:, xl:, 2xl:
export const VIEWPORT_BREAKPOINT_PREFIX = /(?:^|\s)((?:sm|md|lg|xl|2xl):[\w-[\]():]+)/g;

const ANY_CSS_VAR_RE = /^\s*var\([^)]+\)\s*$/;

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
 * Normalize an oklch() value for lookup in oklchToSemantic.
 * Handles underscores (Tailwind arbitrary value encoding) and extra whitespace.
 */
export function normalizeOklch(value) {
  const cleaned = value.trim().toLowerCase().replace(/_/g, ' ');
  const match = cleaned.match(/^oklch\(\s*([^)]+?)\s*\)$/);
  if (!match) return null;
  const body = match[1]
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();
  return `oklch(${body})`;
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
 * Check if a CallExpression node is already inside a JSX className attribute.
 * Used to prevent double-reporting when both JSXAttribute and CallExpression
 * visitors walk the same cn(...)/clsx(...) call.
 */
export function isInsideClassNameAttribute(node) {
  let current = node.parent;
  while (current) {
    if (current.type === 'JSXExpressionContainer') {
      const attr = current.parent;
      if (attr && attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'className') {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
}

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
    const results = node.quasis.map(q => ({ value: q.value.raw, node: q }));
    for (const expression of node.expressions) {
      results.push(...getClassNameStrings(expression));
    }
    return results;
  }
  // Handle: className={"foo bar"}
  if (node.type === 'JSXExpressionContainer') {
    return getClassNameStrings(node.expression);
  }
  // Handle: cva("p-4 text-sm"), cn("bg-page", variant), clsx("mt-2")
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
  // Handle: active && "p-[12px]", fallback || "bg-page"
  if (node.type === 'LogicalExpression') {
    return [
      ...getClassNameStrings(node.left),
      ...getClassNameStrings(node.right),
    ];
  }
  // Handle: active ? "bg-[#FEF8E2]" : "bg-page"
  if (node.type === 'ConditionalExpression') {
    return [
      ...getClassNameStrings(node.consequent),
      ...getClassNameStrings(node.alternate),
    ];
  }
  // Handle: ["p-[12px]", "mt-2"]
  if (node.type === 'ArrayExpression') {
    const results = [];
    for (const el of node.elements) {
      if (el) results.push(...getClassNameStrings(el));
    }
    return results;
  }
  // Handle: cn({ "p-[12px]": condition, "bg-page": true })
  if (node.type === 'ObjectExpression') {
    const results = [];
    for (const prop of node.properties) {
      if (prop.type !== 'Property') continue;
      const key = getObjectPropertyKey(prop);
      if (typeof key === 'string') {
        results.push({ value: key, node: prop.key });
      }
    }
    return results;
  }
  return [];
}

/**
 * Return the underlying style object expression from a JSX style attribute.
 */
export function getStyleObjectExpression(valueNode) {
  if (!valueNode || valueNode.type !== 'JSXExpressionContainer') return null;
  const expr = valueNode.expression;
  return expr.type === 'ObjectExpression' ? expr : null;
}

/**
 * Return a plain property key when it can be resolved statically.
 */
export function getObjectPropertyKey(prop) {
  if (prop.type !== 'Property') return null;
  if (!prop.computed) {
    if (prop.key.type === 'Identifier') return prop.key.name;
    if (prop.key.type === 'Literal') return prop.key.value;
    return null;
  }

  const computedKey = getStaticStringValue(prop.key);
  if (computedKey !== null) return computedKey;
  if (prop.key.type === 'Literal') return prop.key.value;
  return null;
}

/**
 * Read a static string from a literal or no-expression template literal.
 */
export function getStaticStringValue(node) {
  if (!node) return null;

  if (node.type === 'JSXExpressionContainer') {
    return getStaticStringValue(node.expression);
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.map(quasi => quasi.value.cooked ?? quasi.value.raw).join('');
  }

  return null;
}

/**
 * Check whether a node is a template literal with dynamic expressions.
 */
export function isDynamicTemplateLiteral(node) {
  return node.type === 'TemplateLiteral' && node.expressions.length > 0;
}

/**
 * Validate that a string is a CSS var() reference, optionally restricted to
 * one or more token prefixes (without the leading --).
 */
export function isAllowedCssVar(value, allowedPrefixes = null) {
  if (typeof value !== 'string') return false;
  if (!allowedPrefixes) return ANY_CSS_VAR_RE.test(value);

  const prefixes = Array.isArray(allowedPrefixes) ? allowedPrefixes : [allowedPrefixes];
  const prefixPattern = prefixes.map(prefix => prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const scopedVarRe = new RegExp(`^\\s*var\\(--(?:${prefixPattern})[^)]*\\)\\s*$`);
  return scopedVarRe.test(value);
}
