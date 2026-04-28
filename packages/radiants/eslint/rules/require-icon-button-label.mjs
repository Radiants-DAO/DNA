/**
 * rdna/require-icon-button-label
 * Icon-only controls need an accessible name.
 */
import { getStaticStringValue } from '../utils.mjs';

const CONTROL_COMPONENTS = new Set([
  'button',
  'Button',
  'IconCell',
  'ActionButton',
  'TransportButton',
]);

const LABEL_ATTRS = new Set([
  'aria-label',
  'label',
  'title',
  'tooltip',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require accessible labels for icon-only controls',
    },
    messages: {
      missingIconButtonLabel:
        'Icon-only control is missing an accessible label. Add aria-label, label, title, tooltip, or visible/sr-only text.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXElement(node) {
        const name = getJsxElementName(node.openingElement.name);
        if (!CONTROL_COMPONENTS.has(name)) return;
        if (!isIconOnlyControl(node)) return;
        if (hasAccessibleLabel(node)) return;

        context.report({
          node: node.openingElement,
          messageId: 'missingIconButtonLabel',
        });
      },
    };
  },
};

function isIconOnlyControl(node) {
  const opening = node.openingElement;
  if (hasIconProp(opening)) return true;
  if (hasTextContent(node.children)) return false;
  return hasIconChild(node.children);
}

function hasIconProp(opening) {
  return opening.attributes.some((attr) =>
    attr.type === 'JSXAttribute' &&
    (attr.name?.name === 'icon' || attr.name?.name === 'leadingIcon' || attr.name?.name === 'trailingIcon')
  );
}

function hasAccessibleLabel(node) {
  for (const attr of node.openingElement.attributes) {
    if (attr.type !== 'JSXAttribute' || !attr.name) continue;
    if (!LABEL_ATTRS.has(attr.name.name)) continue;
    const value = getStaticStringValue(attr.value);
    if (value === null || value.trim() !== '') return true;
  }

  return hasTextContent(node.children);
}

function hasTextContent(children) {
  return children.some((child) => {
    if (child.type === 'JSXText') return child.value.trim().length > 0;
    if (child.type === 'JSXExpressionContainer') {
      const value = getStaticStringValue(child.expression);
      return typeof value === 'string' && value.trim().length > 0;
    }
    if (child.type === 'JSXElement') return hasTextContent(child.children);
    return false;
  });
}

function hasIconChild(children) {
  return children.some((child) => {
    if (child.type !== 'JSXElement') return false;
    const name = getJsxElementName(child.openingElement.name);
    if (name === 'Icon' || name.endsWith('Icon')) return true;
    return hasIconChild(child.children);
  });
}

function getJsxElementName(nameNode) {
  if (nameNode.type === 'JSXIdentifier') return nameNode.name;
  if (nameNode.type === 'JSXMemberExpression') return getJsxElementName(nameNode.property);
  return '';
}

export default rule;
