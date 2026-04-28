/**
 * rdna/prefer-ctrl-components
 * Inside explicit control surfaces, raw controls and Radiants app components
 * should be replaced with @rdna/ctrl primitives.
 */
import { getStaticStringValue } from '../utils.mjs';

const RAW_CONTROL_MAP = {
  button: 'ActionButton, IconCell, ButtonStrip, or TransportButton from @rdna/ctrl',
  select: 'Dropdown from @rdna/ctrl',
  textarea: 'NumberScrubber, NumberInput, or a domain-specific @rdna/ctrl control',
  meter: 'Meter from @rdna/ctrl',
  progress: 'ProgressBar, LEDProgress, or Meter from @rdna/ctrl',
};

const INPUT_TYPE_MAP = {
  range: 'Slider, Fader, Knob, ArcRing, or XYPad from @rdna/ctrl',
  number: 'NumberInput or NumberScrubber from @rdna/ctrl',
  text: 'NumberInput, NumberScrubber, Dropdown, or a domain-specific @rdna/ctrl control',
  search: 'Dropdown or a domain-specific @rdna/ctrl control',
};

const RDNA_CORE_CONTROL_MAP = {
  Button: 'ActionButton, IconCell, ButtonStrip, or TransportButton from @rdna/ctrl',
  Slider: 'Slider from @rdna/ctrl',
  Switch: 'Toggle from @rdna/ctrl',
  Toggle: 'Toggle from @rdna/ctrl',
  Select: 'Dropdown from @rdna/ctrl',
  Input: 'NumberInput, NumberScrubber, Dropdown, or a domain-specific @rdna/ctrl control',
  NumberField: 'NumberInput or NumberScrubber from @rdna/ctrl',
  Meter: 'Meter from @rdna/ctrl',
};

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer @rdna/ctrl primitives inside data-ctrl-surface control surfaces',
    },
    messages: {
      preferCtrlComponent:
        'Use {{replacement}} inside control surfaces instead of raw <{{element}}>.',
      preferCtrlImport:
        'Use {{replacement}} inside control surfaces instead of <{{component}}> from @rdna/radiants/components/core.',
    },
    schema: [],
  },

  create(context) {
    const rdnaCoreImports = new Set();

    return {
      ImportDeclaration(node) {
        if (node.source?.value !== '@rdna/radiants/components/core') return;
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier') {
            rdnaCoreImports.add(specifier.local.name);
          }
        }
      },

      JSXOpeningElement(node) {
        if (!isInsideCtrlSurface(node)) return;
        if (isAppWindowControlSurfaceTab(node)) return;

        const name = getJsxElementName(node.name);
        if (!name) return;

        if (name === 'input') {
          const replacement = getInputReplacement(node);
          if (!replacement) return;
          context.report({
            node,
            messageId: 'preferCtrlComponent',
            data: { element: name, replacement },
          });
          return;
        }

        const rawReplacement = RAW_CONTROL_MAP[name];
        if (rawReplacement) {
          context.report({
            node,
            messageId: 'preferCtrlComponent',
            data: { element: name, replacement: rawReplacement },
          });
          return;
        }

        if (rdnaCoreImports.has(name) && RDNA_CORE_CONTROL_MAP[name]) {
          context.report({
            node,
            messageId: 'preferCtrlImport',
            data: { component: name, replacement: RDNA_CORE_CONTROL_MAP[name] },
          });
        }
      },
    };
  },
};

function getInputReplacement(node) {
  const typeAttr = node.attributes.find(
    (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'type',
  );
  const type = getStaticStringValue(typeAttr?.value) || 'text';
  return INPUT_TYPE_MAP[type] || null;
}

function isAppWindowControlSurfaceTab(node) {
  return node.attributes.some((attr) => {
    if (attr.type !== 'JSXAttribute' || attr.name?.name !== 'data-aw') return false;
    return getStaticStringValue(attr.value) === 'control-surface-tab-button';
  });
}

function isInsideCtrlSurface(openingNode) {
  let current = openingNode;
  while (current) {
    if (current.type === 'JSXOpeningElement' && isCtrlSurfaceOpening(current)) return true;
    if (current.type === 'JSXElement') {
      const opening = current.openingElement;
      if (opening && isCtrlSurfaceOpening(opening)) return true;
    }
    current = current.parent;
  }
  return false;
}

function isCtrlSurfaceOpening(node) {
  return node.attributes.some((attr) => {
    if (attr.type !== 'JSXAttribute' || !attr.name) return false;
    const name = attr.name.name;
    if (name === 'data-ctrl-surface') return true;
    if (name !== 'data-aw') return false;
    const value = getStaticStringValue(attr.value);
    return typeof value === 'string' && value.startsWith('control-surface');
  });
}

function getJsxElementName(nameNode) {
  if (nameNode.type === 'JSXIdentifier') return nameNode.name;
  if (nameNode.type === 'JSXMemberExpression') return getJsxElementName(nameNode.property);
  return '';
}

export default rule;
