/**
 * rdna/no-viewport-breakpoints-in-window-layout
 * Bans viewport breakpoint prefixes (sm:, md:, lg:, xl:, 2xl:) in className
 * strings. In RadOS window content, viewport breakpoints fire on the browser
 * viewport, not the window container. Use container queries (@sm:, @md:) instead.
 *
 * Scoping: Enable this rule only for files inside RadOS window content via
 * eslint config file patterns. The rule itself does not self-scope by filepath.
 */
import { getClassNameStrings, isInsideClassNameAttribute } from '../utils.mjs';

const VIEWPORT_BP_PREFIXES = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];

function isViewportBreakpointClass(token) {
  // Container query variants start with @: @sm:, @md: — not viewport breakpoints
  if (token.startsWith('@')) return false;
  return VIEWPORT_BP_PREFIXES.some(bp => token.startsWith(bp) || token.includes(':' + bp.slice(0, -1) + ':'));
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban viewport breakpoint prefixes in window layout; use container queries instead',
    },
    messages: {
      viewportBreakpoint:
        'Viewport breakpoint "{{raw}}" does not respond to window size. Use a container query variant (@sm:, @md:, etc.) instead.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') checkClassName(context, node.value);
      },
      CallExpression(node) {
        if (!isInsideClassNameAttribute(node)) checkClassName(context, node);
      },
    };
  },
};

function checkClassName(context, valueNode) {
  if (!valueNode) return;
  const strings = getClassNameStrings(valueNode);
  for (const { value, node } of strings) {
    const tokens = value.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (isViewportBreakpointClass(token)) {
        context.report({
          node,
          messageId: 'viewportBreakpoint',
          data: { raw: token },
        });
      }
    }
  }
}

export default rule;
