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

// Matches viewport breakpoint-prefixed utilities: sm:hidden, md:grid-cols-2, 2xl:max-w-[42rem]
// Does NOT match container query variants: @sm:, @md:, @lg:
const VIEWPORT_BP_REGEX = /(?:^|\s)((?:sm|md|lg|xl|2xl):[\w[\]().%-]+)/g;

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
    VIEWPORT_BP_REGEX.lastIndex = 0;
    let match;
    while ((match = VIEWPORT_BP_REGEX.exec(value)) !== null) {
      const raw = match[1];
      // Skip container query variants: @sm:, @md:, etc.
      const charBefore = match.index > 0 ? value[match.index + (match[0].startsWith(' ') ? 0 : -1)] : '';
      if (charBefore === '@') continue;
      // Also check if the match itself was preceded by @ in the full string
      const fullMatchStart = match.index + match[0].indexOf(raw);
      if (fullMatchStart > 0 && value[fullMatchStart - 1] === '@') continue;

      context.report({
        node,
        messageId: 'viewportBreakpoint',
        data: { raw },
      });
    }
  }
}

export default rule;
