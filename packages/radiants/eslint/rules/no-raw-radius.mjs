/**
 * rdna/no-raw-radius
 * Bans arbitrary border-radius values (e.g. `rounded-[6px]`) in className and
 * hardcoded radius values in style props. Standard Tailwind tokens
 * (`rounded-sm`/`rounded-md`/`rounded-full`) remain allowed.
 */
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isAllowedCssVar,
  isDynamicTemplateLiteral,
  isInsideClassNameAttribute,
  ARBITRARY_RADIUS_CLASS,
} from '../utils.mjs';

const radiusStyleProps = new Set([
  'borderRadius',
  'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary and standard Tailwind border-radius values; require pixel-rounded-* classes',
    },
    messages: {
      arbitraryRadius:
        'Arbitrary radius "{{raw}}" in className. Use an RDNA radius utility (rounded-xs, rounded-sm, rounded-md, rounded-full) or pixel-rounded-*.',
      hardcodedRadiusStyle:
        'Hardcoded border-radius in style prop ({{prop}}). Use a radius utility class instead.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') checkClassName(context, node.value);
        if (node.name.name === 'style') checkStyleObject(context, node.value);
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
    ARBITRARY_RADIUS_CLASS.lastIndex = 0;
    let match;
    while ((match = ARBITRARY_RADIUS_CLASS.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryRadius',
        data: { raw: match[0] },
      });
    }
  }
}

function checkStyleObject(context, valueNode) {
  const expr = getStyleObjectExpression(valueNode);
  if (!expr) return;

  for (const prop of expr.properties) {
    const key = getObjectPropertyKey(prop);
    if (!radiusStyleProps.has(key)) continue;

    const val = prop.value;
    if (val.type === 'Literal' && typeof val.value === 'number') {
      context.report({
        node: val,
        messageId: 'hardcodedRadiusStyle',
        data: { prop: key },
      });
      continue;
    }

    const staticString = getStaticStringValue(val);
    if (staticString !== null) {
      if (isAllowedCssVar(staticString, 'radius-')) continue;
      context.report({
        node: val,
        messageId: 'hardcodedRadiusStyle',
        data: { prop: key },
      });
      continue;
    }

    if (isDynamicTemplateLiteral(val)) {
      context.report({
        node: val,
        messageId: 'hardcodedRadiusStyle',
        data: { prop: key },
      });
    }
  }
}

export default rule;
