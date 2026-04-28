/**
 * rdna/no-inline-svg-icons
 * Bans raw SVG icon sources in application UI. Use the RDNA bitmap-backed
 * <Icon> runtime instead. Rendering/generation internals can opt out by path.
 */
import { getStaticStringValue, isRadiantsInternal } from '../utils.mjs';

const SVG_ELEMENT_NAMES = new Set([
  'svg',
  'path',
  'g',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
]);

const BANNED_ICON_IMPORT_SOURCES = [
  /^lucide-react$/,
  /^react-icons(?:\/|$)/,
  /^@heroicons\//,
  /^@tabler\/icons-react$/,
  /^@phosphor-icons\/react$/,
  /^phosphor-react$/,
  /^@radix-ui\/react-icons$/,
];

const DEFAULT_EXEMPT_PATHS = [
  'packages/radiants/icons/',
  'packages/radiants/components/core/__tests__/',
  'apps/rad-os/app/icon.tsx',
  'apps/rad-os/app/apple-icon.tsx',
  'apps/rad-os/lib/logo-maker/',
  'apps/rad-os/app/dev/icon-conversion-review/',
  'apps/rad-os/components/apps/pixel-playground/',
  'apps/rad-os/components/apps/brand-assets/',
  'apps/rad-os/components/apps/radio/',
];

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban raw inline/SVG icon sources; use RDNA bitmap-backed Icon assets',
    },
    messages: {
      inlineSvg:
        'Inline <svg> icons are not allowed in RDNA UI. Use <Icon name="..." /> from @rdna/radiants/icons/runtime.',
      rawSvgElement:
        'Raw SVG child <{{name}}> is not allowed for icons. Use the RDNA Icon runtime.',
      svgDataUri:
        'SVG data URI icons are not allowed. Use the RDNA Icon runtime.',
      bannedIconImport:
        'Icon library "{{source}}" is not allowed. Use @rdna/radiants/icons/runtime.',
      svgImport:
        'SVG imports are not allowed for UI icons. Use @rdna/radiants/icons/runtime.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          exemptPaths: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const filename = context.filename || context.getFilename();
    const exemptPaths = [...DEFAULT_EXEMPT_PATHS, ...(options.exemptPaths || [])];

    if (isRadiantsInternal(filename) || isExemptPath(filename, exemptPaths)) return {};

    return {
      ImportDeclaration(node) {
        const source = node.source?.value;
        if (typeof source !== 'string') return;

        if (source.endsWith('.svg')) {
          context.report({ node, messageId: 'svgImport' });
          return;
        }

        if (BANNED_ICON_IMPORT_SOURCES.some((pattern) => pattern.test(source))) {
          context.report({
            node,
            messageId: 'bannedIconImport',
            data: { source },
          });
        }
      },

      JSXOpeningElement(node) {
        const name = getJsxElementName(node.name);
        if (!SVG_ELEMENT_NAMES.has(name)) return;
        if (name === 'svg' && isHiddenSvgDefsElement(node)) return;

        context.report({
          node,
          messageId: name === 'svg' ? 'inlineSvg' : 'rawSvgElement',
          data: { name },
        });
      },

      JSXAttribute(node) {
        const value = getStaticStringValue(node.value);
        if (typeof value !== 'string') return;

        if (/^\s*data:image\/svg\+xml/i.test(value)) {
          context.report({ node: node.value || node, messageId: 'svgDataUri' });
        }
      },
    };
  },
};

function getJsxElementName(nameNode) {
  if (nameNode.type === 'JSXIdentifier') return nameNode.name;
  if (nameNode.type === 'JSXMemberExpression') return getJsxElementName(nameNode.property);
  return '';
}

function isHiddenSvgDefsElement(node) {
  const width = getStaticAttributeValue(node, 'width');
  const height = getStaticAttributeValue(node, 'height');
  return String(width) === '0' && String(height) === '0';
}

function getStaticAttributeValue(node, attributeName) {
  const attr = node.attributes.find((candidate) =>
    candidate.type === 'JSXAttribute' && candidate.name?.name === attributeName
  );
  if (!attr || attr.type !== 'JSXAttribute') return null;
  return getStaticStringValue(attr.value);
}

function isExemptPath(filename, patterns) {
  const normalized = filename.replace(/\\/g, '/');
  return patterns.some((pattern) => normalized.includes(pattern.replace(/\\/g, '/')));
}

export default rule;
