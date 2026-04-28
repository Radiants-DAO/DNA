/**
 * rdna/no-hardcoded-colors
 * Bans non-semantic color usage in className and style props.
 * Auto-fixes arbitrary Tailwind color classes when a 1:1 token mapping exists.
 */
import { tokenMap } from '../contract.mjs';
import {
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  normalizeHex,
  normalizeOklch,
  extractPrefixContext,
  prefixToContext,
  getClassNameStrings,
  isDynamicTemplateLiteral,
  isInsideClassNameAttribute,
  HEX_PATTERN,
  RGB_PATTERN,
  HSL_PATTERN,
} from '../utils.mjs';

const {
  brandPalette,
  hexToSemantic,
  oklchToSemantic,
  semanticColorSuffixes,
  removedAliases,
} = tokenMap;

/** CSS properties that accept color values. Only these trigger style-object reports. */
const COLOR_PROPERTIES = new Set([
  'color',
  'backgroundColor',
  'background',
  'backgroundImage',
  'borderColor',
  'border',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
  'borderBlock',
  'borderBlockColor',
  'borderInline',
  'borderInlineColor',
  'outlineColor',
  'outline',
  'textDecorationColor',
  'caretColor',
  'accentColor',
  'fill',
  'stroke',
  'stopColor',
  'floodColor',
  'lightingColor',
  'boxShadow',
  'textShadow',
  'columnRuleColor',
  'scrollbarColor',
]);

const MODIFIER_PREFIX_RE = /^(?:[\w-]+:)+/;
const RAW_TAILWIND_COLOR_KEYWORDS = new Set(['white', 'black']);
const RAW_TAILWIND_COLOR_SCALE_RE = /^(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)$/;
const PRIMITIVE_COLOR_SUFFIXES = new Set([
  ...Object.values(brandPalette),
  'warning-yellow',
  'error-red',
  'focus-state',
  'primary',
]);
const COLORISH_SUFFIX_RE =
  /(?:^|[-])(ink|cream|black|white|yellow|blue|red|mint|pink|orange|amber|violet|purple|rose|green|emerald|teal|cyan|sky|sun|highlight|accent|primary|secondary|success|warning|error|info|focus|chrome|page|card|tinted|inv|depth|hover|active|main|sub|mute|flip|head|link|line|rule|danger)(?:$|[-])/;
const ALLOWED_CLASS_COLOR_KEYWORDS = new Set(['transparent', 'current', 'inherit']);
const ALLOWED_STYLE_COLOR_KEYWORDS = new Set(['transparent', 'currentcolor', 'inherit']);
const NAMED_COLOR_UTILITY_RE = /^(bg|text|outline|decoration|accent|caret|fill|stroke|from|via|to|placeholder|ring(?:-offset)?|border(?:-[trblxyse]{1,2})?|divide(?:-[xy])?)-(.+)$/;
const ARBITRARY_COLOR_UTILITY_RE = /^(bg|text|outline|decoration|accent|caret|fill|stroke|from|via|to|placeholder|ring(?:-offset)?|border(?:-[trblxyse]{1,2})?|divide(?:-[xy])?)-\[(.+)\](\/[A-Za-z0-9.]+)?$/;
/** All valid semantic color token suffixes (the part after `--color-` or after a Tailwind utility prefix). */
const SEMANTIC_COLOR_SUFFIXES = new Set(semanticColorSuffixes);
const SEMANTIC_COLOR_SUFFIX_RE = { test: (s) => SEMANTIC_COLOR_SUFFIXES.has(s) };
const CTRL_COLOR_SUFFIX_RE = /^ctrl-[a-z0-9-]+$/;
const COLOR_FUNCTION_RE = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|device-cmyk)\s*\(/i;
const CSS_VAR_RE = /var\(\s*(--[^),\s]+)[^)]*\)/gi;
const CSS_NAMED_COLOR_KEYWORDS = new Set([
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
]);
const BG_NON_COLOR_SUFFIX_RE =
  /^(?:fixed|local|scroll|clip-(?:border|padding|content|text)|origin-(?:border|padding|content)|bottom|center|left(?:-(?:bottom|top))?|right(?:-(?:bottom|top))?|top|repeat(?:-(?:x|y|round|space))?|no-repeat|auto|cover|contain|none|linear-to-[a-z-]+|radial(?:-[a-z-]+)?|conic(?:-[a-z-]+)?)$/;
const TEXT_NON_COLOR_SUFFIX_RE =
  /^(?:xs|sm|base|lg|xl|[2-9]xl|left|center|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty|pixel-[a-z0-9-]+|body-[a-z0-9-]+|display-[a-z0-9-]+|shadow(?:-[a-z0-9-]+)?)$/;
const BORDER_NON_COLOR_SUFFIX_RE = /^(?:0|2|4|8|solid|dashed|dotted|double|hidden|none)$/;
const RING_NON_COLOR_SUFFIX_RE = /^(?:0|1|2|4|8|inset)$/;
const OUTLINE_NON_COLOR_SUFFIX_RE = /^(?:0|1|2|4|8|none|solid|dashed|dotted|double|hidden|offset-\d+)$/;
const DECORATION_NON_COLOR_SUFFIX_RE = /^(?:0|1|2|4|8|auto|from-font|solid|double|dotted|dashed|wavy|clone|slice)$/;
const DIVIDE_NON_COLOR_SUFFIX_RE = /^(?:0|2|4|8|solid|dashed|dotted|double|none|reverse)$/;
const FILL_NON_COLOR_SUFFIX_RE = /^(?:none)$/;
const STROKE_NON_COLOR_SUFFIX_RE = /^(?:none|0|1|2)$/;
const GRADIENT_STOP_NON_COLOR_SUFFIX_RE = /^(?:\d+%?)$/;

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban non-semantic color usage; require RDNA semantic color tokens',
    },
    fixable: 'code',
    messages: {
      arbitraryColor:
        'Hardcoded color "{{raw}}" in className. Use an RDNA color token instead (e.g. {{suggestion}}).',
      hardcodedColorStyle:
        'Hardcoded color "{{raw}}" in style prop. Use a CSS variable: var(--color-*).',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') checkClassNameValue(context, node.value, node);
        if (node.name.name === 'style') checkStyleObject(context, node.value, node);
      },
      CallExpression(node) {
        if (!isInsideClassNameAttribute(node)) checkClassNameValue(context, node);
      },
    };
  },
};

function checkClassNameValue(context, valueNode, attributeNode = null) {
  if (!valueNode) return;
  if (isBrandPrimitiveDisplaySurface(attributeNode)) return;
  const strings = getClassNameStrings(valueNode);
  for (const { value, node } of strings) {
    findAndReportDisallowedColorUtilities(context, node, value);
  }
}

function findAndReportDisallowedColorUtilities(context, node, text) {
  const tokens = text.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    const arbitraryUtility = parseArbitraryColorUtility(token);
    if (arbitraryUtility) {
      reportDisallowedColorUtility(context, node, arbitraryUtility);
      continue;
    }

    const namedUtility = parseNamedColorUtility(token);
    if (!namedUtility || !isDisallowedNamedColorUtility(namedUtility)) continue;

    reportDisallowedColorUtility(context, node, namedUtility);
  }
}

function parseArbitraryColorUtility(token) {
  const stripped = stripModifierPrefixes(token);
  const match = stripped.match(ARBITRARY_COLOR_UTILITY_RE);
  if (!match) return null;

  const value = match[2].trim();
  if (!looksLikeArbitraryColorValue(value)) return null;

  return {
    raw: token,
    prefix: match[1],
    value,
    opacitySuffix: match[3] ?? '',
  };
}

function parseNamedColorUtility(token) {
  const stripped = stripModifierPrefixes(token);
  if (stripped.includes('[')) return null;

  const match = stripped.match(NAMED_COLOR_UTILITY_RE);
  if (!match) return null;

  const prefix = match[1];
  const suffix = match[2];
  const baseSuffix = suffix.split('/')[0];

  if (isClearlyNonColorUtility(prefix, baseSuffix)) return null;

  return {
    raw: token,
    prefix,
    suffix,
    baseSuffix,
  };
}

function isDisallowedNamedColorUtility({ baseSuffix }) {
  if (ALLOWED_CLASS_COLOR_KEYWORDS.has(baseSuffix) || isAllowedSemanticColorSuffix(baseSuffix)) {
    return false;
  }

  return (
    RAW_TAILWIND_COLOR_KEYWORDS.has(baseSuffix) ||
    RAW_TAILWIND_COLOR_SCALE_RE.test(baseSuffix) ||
    PRIMITIVE_COLOR_SUFFIXES.has(baseSuffix) ||
    COLORISH_SUFFIX_RE.test(baseSuffix)
  );
}

function reportDisallowedColorUtility(context, node, utility) {
  const suggestion = getNamedColorSuggestion(utility.prefix);
  const fix = buildUtilityFix(utility);

  context.report({
    node,
    messageId: 'arbitraryColor',
    data: {
      raw: utility.raw,
      suggestion,
    },
    fix: fix
      ? (fixer) => {
          const src = context.sourceCode.getText(node);
          const newSrc = src.replace(utility.raw, fix);
          return fixer.replaceText(node, newSrc);
        }
      : null,
  });
}

function buildUtilityFix(utility) {
  const modifiers = getModifierPrefixes(utility.raw);

  if ('value' in utility) {
    const semanticVarName = getSemanticColorVarName(utility.value);
    if (semanticVarName) {
      return `${modifiers}${utility.prefix}-${semanticVarName}${utility.opacitySuffix}`;
    }

    const ctxKey = getColorContextKey(utility.prefix);
    const hexMatch = utility.value.match(/#[0-9a-fA-F]{3,8}/);
    if (hexMatch && ctxKey) {
      const normalized = normalizeHex(hexMatch[0]);
      const mapping = hexToSemantic[normalized];
      if (mapping && mapping[ctxKey]) {
        return `${modifiers}${utility.prefix}-${mapping[ctxKey]}${utility.opacitySuffix}`;
      }
    }

    const normalizedOklch = normalizeOklch(utility.value);
    if (normalizedOklch && ctxKey) {
      const mapping = oklchToSemantic[normalizedOklch];
      if (mapping && mapping[ctxKey]) {
        return `${modifiers}${utility.prefix}-${mapping[ctxKey]}${utility.opacitySuffix}`;
      }
    }

    return null;
  }

  return null;
}

function getNamedColorSuggestion(prefix) {
  const normalizedPrefix = prefix ?? 'bg';

  if (normalizedPrefix === 'bg' || normalizedPrefix === 'from' || normalizedPrefix === 'via' || normalizedPrefix === 'to') {
    return `${normalizedPrefix}-page`;
  }

  if (
    normalizedPrefix === 'text' ||
    normalizedPrefix === 'decoration' ||
    normalizedPrefix === 'accent' ||
    normalizedPrefix === 'caret' ||
    normalizedPrefix === 'placeholder' ||
    normalizedPrefix === 'fill' ||
    normalizedPrefix === 'stroke'
  ) {
    return `${normalizedPrefix}-main`;
  }

  if (normalizedPrefix === 'outline' || normalizedPrefix.startsWith('border') || normalizedPrefix.startsWith('divide')) {
    return `${normalizedPrefix}-line`;
  }

  if (normalizedPrefix.startsWith('ring')) {
    return `${normalizedPrefix}-focus`;
  }

  return 'bg-page';
}

function checkStyleObject(context, valueNode, attributeNode = null) {
  const expr = getStyleObjectExpression(valueNode);
  if (!expr) return;
  if (isBrandPrimitiveDisplaySurface(attributeNode)) return;

  for (const prop of expr.properties) {
    const key = getObjectPropertyKey(prop);
    if (key == null) continue;
    if (!COLOR_PROPERTIES.has(key)) continue;
    const val = prop.value;
    const str = getStaticStringValue(val);

    if (str === null) {
      if (!isDynamicTemplateLiteral(val)) continue;
      context.report({
        node: prop,
        messageId: 'hardcodedColorStyle',
        data: { raw: context.sourceCode.getText(val) },
      });
      continue;
    }

    if (containsDisallowedColorStyleValue(str)) {
      context.report({
        node: prop,
        messageId: 'hardcodedColorStyle',
        data: { raw: str },
      });
    }
  }
}

function isBrandPrimitiveDisplaySurface(attributeNode) {
  const openingElement = attributeNode?.parent;
  if (!openingElement || openingElement.type !== 'JSXOpeningElement') return false;

  return openingElement.attributes.some((attr) => {
    if (attr.type !== 'JSXAttribute') return false;
    const name = attr.name?.name;
    if (name === 'data-rdna-brand-primitive') return true;
    if (name !== 'data-rdna-brand-surface') return false;

    if (!attr.value) return true;
    if (attr.value.type === 'Literal') return attr.value.value === 'primitive';
    if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression.type === 'Literal') {
      return attr.value.expression.value === 'primitive';
    }
    return false;
  });
}

function stripModifierPrefixes(token) {
  return token.replace(MODIFIER_PREFIX_RE, '');
}

function getModifierPrefixes(token) {
  const match = token.match(MODIFIER_PREFIX_RE);
  return match ? match[0] : '';
}

function looksLikeArbitraryColorValue(value) {
  const trimmed = value.trim();
  return (
    isAllowedOrKnownCssColorKeyword(trimmed) ||
    isSemanticColorVarReference(trimmed) ||
    /^var\(/i.test(trimmed) ||
    hasRawColorSyntax(trimmed)
  );
}

function isAllowedSemanticColorSuffix(suffix) {
  return SEMANTIC_COLOR_SUFFIX_RE.test(suffix) || CTRL_COLOR_SUFFIX_RE.test(suffix);
}

function isClearlyNonColorUtility(prefix, suffix) {
  if (prefix === 'bg') return BG_NON_COLOR_SUFFIX_RE.test(suffix);
  if (prefix === 'text') return TEXT_NON_COLOR_SUFFIX_RE.test(suffix);
  if (prefix.startsWith('border')) return BORDER_NON_COLOR_SUFFIX_RE.test(suffix);
  if (prefix === 'ring' || prefix === 'ring-offset') return RING_NON_COLOR_SUFFIX_RE.test(suffix);
  if (prefix === 'outline') return OUTLINE_NON_COLOR_SUFFIX_RE.test(suffix);
  if (prefix === 'decoration') return DECORATION_NON_COLOR_SUFFIX_RE.test(suffix);
  if (prefix.startsWith('divide')) return DIVIDE_NON_COLOR_SUFFIX_RE.test(suffix);
  if (prefix === 'fill') return FILL_NON_COLOR_SUFFIX_RE.test(suffix);
  if (prefix === 'stroke') return STROKE_NON_COLOR_SUFFIX_RE.test(suffix);
  if (prefix === 'from' || prefix === 'via' || prefix === 'to') {
    return GRADIENT_STOP_NON_COLOR_SUFFIX_RE.test(suffix);
  }

  return false;
}

function containsDisallowedColorStyleValue(value) {
  const normalized = value.trim().toLowerCase();

  if (ALLOWED_STYLE_COLOR_KEYWORDS.has(normalized) || isPureSemanticColorVarReference(normalized)) {
    return false;
  }

  const cssVarNames = getCssVarNames(normalized);
  if (cssVarNames.some(varName => !isAllowedSemanticColorVarName(varName))) {
    return true;
  }

  return hasRawColorSyntax(normalized) || containsNamedCssColorKeyword(normalized);
}

function hasRawColorSyntax(value) {
  return (
    matchesPattern(HEX_PATTERN, value) ||
    matchesPattern(RGB_PATTERN, value) ||
    matchesPattern(HSL_PATTERN, value) ||
    COLOR_FUNCTION_RE.test(value)
  );
}

function matchesPattern(pattern, value) {
  pattern.lastIndex = 0;
  const result = pattern.test(value);
  pattern.lastIndex = 0;
  return result;
}

function containsNamedCssColorKeyword(value) {
  const words = value.match(/[a-z-]+/g) ?? [];
  return words.some(word => CSS_NAMED_COLOR_KEYWORDS.has(word));
}

function isAllowedOrKnownCssColorKeyword(value) {
  const normalized = value.trim().toLowerCase();
  return ALLOWED_STYLE_COLOR_KEYWORDS.has(normalized) || CSS_NAMED_COLOR_KEYWORDS.has(normalized);
}

function getCssVarNames(value) {
  const names = [];
  CSS_VAR_RE.lastIndex = 0;

  let match;
  while ((match = CSS_VAR_RE.exec(value)) !== null) {
    names.push(match[1].toLowerCase());
  }

  CSS_VAR_RE.lastIndex = 0;
  return names;
}

function isSemanticColorVarReference(value) {
  const vars = getCssVarNames(value);
  return vars.length > 0 && vars.every(isAllowedSemanticColorVarName);
}

function isPureSemanticColorVarReference(value) {
  return /^\s*var\(\s*--color-[a-z0-9-]+\s*(?:,[^)]+)?\)\s*$/i.test(value) && isSemanticColorVarReference(value);
}

function isAllowedSemanticColorVarName(varName) {
  const match = varName.match(/^--color-(.+)$/);
  if (match) {
    return SEMANTIC_COLOR_SUFFIXES.has(match[1]) || CTRL_COLOR_SUFFIX_RE.test(match[1]);
  }
  return /^--ctrl-[a-z0-9-]+$/.test(varName);
}

function getSemanticColorVarName(value) {
  const match = value.trim().match(/^var\(\s*--color-([a-z0-9-]+)\s*(?:,[^)]+)?\)$/i);
  if (!match) return null;

  const suffix = match[1].toLowerCase();
  return isAllowedSemanticColorSuffix(suffix) ? suffix : null;
}

function getColorContextKey(prefix) {
  if (prefix === 'ring-offset') return 'ring';

  const arbitraryClass = `${prefix}-[#000000]`;
  const extractedPrefix = extractPrefixContext(arbitraryClass);
  return extractedPrefix ? prefixToContext(extractedPrefix) : null;
}

export default rule;
