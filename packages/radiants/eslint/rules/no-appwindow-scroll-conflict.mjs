/**
 * rdna/no-appwindow-scroll-conflict
 * AppWindow.Island has one scroll owner. The default Island owns scrolling;
 * noScroll means the child content owns a bounded scrollport.
 */
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isInsideClassNameAttribute,
} from '../utils.mjs';

const VERTICAL_SCROLL_CLASS_RE = /(?:^|\s)((?:[\w-]+:)*(?:overflow-(?:auto|scroll)|overflow-y-(?:auto|scroll)))(?=\s|$)/g;
const MIN_H_FULL_RE = /(?:^|\s)(?:[\w-]+:)*min-h-full(?=\s|$)/;
const SCROLL_STYLE_PROPS = new Set(['overflow', 'overflowY']);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban conflicting or unbounded scroll ownership in AppWindow layouts',
    },
    messages: {
      nestedIslandScroll:
        'AppWindow.Island owns scrolling by default. Add noScroll to the Island before giving descendants overflow scrolling.',
      unboundedScrollClass:
        'Scrollable window content cannot use min-h-full with overflow scrolling. Use h-full min-h-0, or let AppWindow.Island own scrolling.',
      unboundedScrollStyle:
        'Scrollable window content cannot use minHeight: "100%" with overflow scrolling. Use height: "100%" plus minHeight: 0, or let AppWindow.Island own scrolling.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') checkClassName(context, node, node.value);
        if (node.name.name === 'style') checkStyle(context, node, node.value);
      },
      CallExpression(node) {
        if (isInsideClassNameAttribute(node)) return;
        checkClassName(context, node, node);
      },
    };
  },
};

function checkClassName(context, ownerNode, valueNode) {
  if (!valueNode) return;
  const strings = getClassNameStrings(valueNode);
  const inScrollOwningIsland = isInsideScrollOwningIsland(ownerNode);

  for (const { value, node } of strings) {
    const hasVerticalScroll = VERTICAL_SCROLL_CLASS_RE.test(value);
    VERTICAL_SCROLL_CLASS_RE.lastIndex = 0;
    if (!hasVerticalScroll) continue;

    if (MIN_H_FULL_RE.test(value)) {
      context.report({ node, messageId: 'unboundedScrollClass' });
      continue;
    }

    if (inScrollOwningIsland) {
      context.report({ node, messageId: 'nestedIslandScroll' });
    }
  }
}

function checkStyle(context, ownerNode, valueNode) {
  const expr = getStyleObjectExpression(valueNode);
  if (!expr) return;

  let minHeightValue = null;
  let scrollProp = null;

  for (const prop of expr.properties) {
    const key = getObjectPropertyKey(prop);
    if (key === 'minHeight') {
      minHeightValue = getStaticStringValue(prop.value);
      continue;
    }
    if (SCROLL_STYLE_PROPS.has(key)) {
      const value = getStaticStringValue(prop.value);
      if (value === 'auto' || value === 'scroll') scrollProp = prop.value;
    }
  }

  if (!scrollProp) return;

  if (minHeightValue === '100%') {
    context.report({ node: scrollProp, messageId: 'unboundedScrollStyle' });
    return;
  }

  if (isInsideScrollOwningIsland(ownerNode)) {
    context.report({ node: scrollProp, messageId: 'nestedIslandScroll' });
  }
}

function isInsideScrollOwningIsland(node) {
  let current = node;
  while (current) {
    if (current.type === 'JSXOpeningElement' && isScrollOwningIslandOpening(current)) return true;
    if (current.type === 'JSXElement' && isScrollOwningIslandOpening(current.openingElement)) return true;
    current = current.parent;
  }
  return false;
}

function isScrollOwningIslandOpening(node) {
  if (!node || !isAppWindowIslandName(node.name)) return false;
  return !hasBooleanOrTruthyAttr(node, 'noScroll');
}

function isAppWindowIslandName(nameNode) {
  return (
    nameNode?.type === 'JSXMemberExpression' &&
    nameNode.object?.type === 'JSXIdentifier' &&
    nameNode.object.name === 'AppWindow' &&
    nameNode.property?.type === 'JSXIdentifier' &&
    nameNode.property.name === 'Island'
  );
}

function hasBooleanOrTruthyAttr(openingNode, attrName) {
  const attr = openingNode.attributes.find(
    (candidate) => candidate.type === 'JSXAttribute' && candidate.name?.name === attrName,
  );
  if (!attr) return false;
  if (!attr.value) return true;
  if (attr.value.type === 'JSXExpressionContainer') {
    const expression = attr.value.expression;
    if (expression.type === 'Literal' && typeof expression.value === 'boolean') {
      return expression.value;
    }
    return false;
  }
  const value = getStaticStringValue(attr.value);
  return value === 'true';
}

export default rule;
