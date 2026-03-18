/**
 * rdna/no-clipped-shadow
 *
 * Flags RDNA shadow tokens (shadow-resting, shadow-raised, etc.) when used on
 * or inside pixel-cornered elements (rounded-xs/sm/md/lg). clip-path clips
 * box-shadow — use pixel-shadow-* (filter: drop-shadow) instead.
 *
 * Checks two cases:
 *   1. Same-element: className has both rounded-* and shadow-*
 *   2. Ancestor: className has shadow-* and a JSX ancestor has rounded-*
 */
import {
  getClassNameStrings,
  isInsideClassNameAttribute,
} from '../utils.mjs';

// Pixel-corner classes that trigger clip-path via pixel-corners.css
const PIXEL_CORNER_RE = /(?:^|\s)(?:[\w-]+:)*(?:rounded-(?:xs|sm|md|lg))(?:\s|$)/;

// RDNA shadow tokens that use box-shadow (get clipped by clip-path)
// Excludes: pixel-shadow-* (correct), shadow-none, shadow-inner, arbitrary shadow-[...]
const CLIPPABLE_SHADOW_RE = /(?:^|\s)((?:[\w-]+:)*shadow-(?:surface|resting|lifted|raised|floating|focused|glow-(?:success|error|info)))(?:\s|$)/g;

// Map from clippable shadow to pixel-shadow suggestion
const SHADOW_MIGRATION = {
  'shadow-surface': 'pixel-shadow-surface',
  'shadow-resting': 'pixel-shadow-resting',
  'shadow-lifted': 'pixel-shadow-lifted',
  'shadow-raised': 'pixel-shadow-raised',
  'shadow-floating': 'pixel-shadow-floating',
  'shadow-focused': 'pixel-shadow-floating (or custom filter: drop-shadow)',
  'shadow-glow-success': 'custom filter: drop-shadow with success color',
  'shadow-glow-error': 'custom filter: drop-shadow with error color',
  'shadow-glow-info': 'custom filter: drop-shadow with info color',
};

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban box-shadow tokens on pixel-cornered elements; use pixel-shadow-* (filter: drop-shadow) instead',
    },
    messages: {
      clippedShadowSameElement:
        '"{{shadow}}" will be clipped by clip-path on this element ({{corner}}). Use {{suggestion}} instead.',
      clippedShadowAncestor:
        '"{{shadow}}" will be clipped by an ancestor\'s clip-path ({{corner}}). Use {{suggestion}} instead, or move the shadow outside the clipped container.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;
        checkElement(context, node);
      },
      CallExpression(node) {
        if (!isInsideClassNameAttribute(node)) {
          checkCallExpression(context, node);
        }
      },
    };
  },
};

/**
 * Check a className JSX attribute for same-element and ancestor clipping.
 */
function checkElement(context, attrNode) {
  const strings = getClassNameStrings(attrNode.value);
  const fullClassName = strings.map((s) => s.value).join(' ');

  // Find all clippable shadows in this element's className
  const shadows = extractClippableShadows(fullClassName);
  if (shadows.length === 0) return;

  // Check for data-no-clip on same element — opted out of clipping
  const openingElement = attrNode.parent;
  const hasNoClip = openingElement?.attributes?.some(
    (a) => a.type === 'JSXAttribute' && a.name?.name === 'data-no-clip',
  );
  if (hasNoClip) return;

  // Case 1: Same-element — this element has both rounded-* and shadow-*
  const hasPixelCorner = PIXEL_CORNER_RE.test(fullClassName);
  const cornerMatch = hasPixelCorner ? fullClassName.match(/rounded-(?:xs|sm|md|lg)/)?.[0] : null;

  if (hasPixelCorner) {
    for (const shadow of shadows) {
      const reportNode = findStringNode(strings, shadow.raw) ?? attrNode;
      context.report({
        node: reportNode,
        messageId: 'clippedShadowSameElement',
        data: {
          shadow: shadow.raw,
          corner: cornerMatch,
          suggestion: getSuggestion(shadow.token),
        },
      });
    }
    return; // Same-element already reported — no need to check ancestors
  }

  // Case 2: Ancestor — walk up JSX tree looking for pixel-cornered parent
  const ancestorCorner = findAncestorPixelCorner(attrNode);
  if (ancestorCorner) {
    for (const shadow of shadows) {
      const reportNode = findStringNode(strings, shadow.raw) ?? attrNode;
      context.report({
        node: reportNode,
        messageId: 'clippedShadowAncestor',
        data: {
          shadow: shadow.raw,
          corner: ancestorCorner,
          suggestion: getSuggestion(shadow.token),
        },
      });
    }
  }
}

/**
 * Check CVA / cn / clsx calls that aren't inside a className attribute.
 */
function checkCallExpression(context, node) {
  const strings = getClassNameStrings(node);
  const fullClassName = strings.map((s) => s.value).join(' ');

  const shadows = extractClippableShadows(fullClassName);
  if (shadows.length === 0) return;

  const hasPixelCorner = PIXEL_CORNER_RE.test(fullClassName);
  const cornerMatch = hasPixelCorner ? fullClassName.match(/rounded-(?:xs|sm|md|lg)/)?.[0] : null;

  if (hasPixelCorner) {
    for (const shadow of shadows) {
      const reportNode = findStringNode(strings, shadow.raw) ?? node;
      context.report({
        node: reportNode,
        messageId: 'clippedShadowSameElement',
        data: {
          shadow: shadow.raw,
          corner: cornerMatch,
          suggestion: getSuggestion(shadow.token),
        },
      });
    }
  }
}

/**
 * Extract all clippable shadow classes from a className string.
 */
function extractClippableShadows(className) {
  const results = [];
  CLIPPABLE_SHADOW_RE.lastIndex = 0;
  let match;
  while ((match = CLIPPABLE_SHADOW_RE.exec(className)) !== null) {
    const raw = match[1].trim();
    // Strip modifier prefixes to get the base token
    const token = raw.replace(/^(?:[\w-]+:)+/, '');
    results.push({ raw, token });
  }
  return results;
}

/**
 * Find the AST node containing a specific class string (for precise reporting).
 */
function findStringNode(strings, target) {
  for (const { value, node } of strings) {
    if (value.includes(target)) return node;
  }
  return null;
}

/**
 * Walk up the JSX ancestor chain looking for a pixel-cornered element.
 * Returns the matched rounded-* class name, or null.
 */
function findAncestorPixelCorner(attrNode) {
  let current = attrNode.parent; // JSXOpeningElement
  if (current) current = current.parent; // JSXElement

  while (current) {
    if (current.type === 'JSXElement') {
      const opening = current.openingElement;
      const classAttr = opening.attributes?.find(
        (a) => a.type === 'JSXAttribute' && a.name?.name === 'className',
      );
      if (classAttr) {
        const strings = getClassNameStrings(classAttr.value);
        const combined = strings.map((s) => s.value).join(' ');

        // Check for data-no-clip — ancestor opted out of clipping
        const noClipAttr = opening.attributes?.find(
          (a) => a.type === 'JSXAttribute' && a.name?.name === 'data-no-clip',
        );
        if (noClipAttr) {
          // This ancestor opted out — don't report, but keep walking
          // (a further ancestor might still clip)
          current = current.parent;
          continue;
        }

        if (PIXEL_CORNER_RE.test(combined)) {
          return combined.match(/rounded-(?:xs|sm|md|lg)/)?.[0] ?? null;
        }
      }
    }
    current = current.parent;
  }
  return null;
}

/**
 * Get the migration suggestion for a shadow token.
 */
function getSuggestion(token) {
  return SHADOW_MIGRATION[token] ?? `pixel-shadow equivalent or filter: drop-shadow()`;
}

export default rule;
