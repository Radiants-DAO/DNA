/**
 * @rdna/radiants ESLint token map
 * Single source of truth for auto-fix hex → semantic-token mappings.
 *
 * Structure: hexToSemantic maps lowercase hex → { bg, text, border, any }
 * where each key is the Tailwind prefix context and the value is the
 * semantic token class suffix (without the prefix).
 */

// Brand palette — raw hex values from tokens.css
export const brandPalette = {
  '#fef8e2': 'cream',
  '#0f0e0c': 'ink',
  '#000000': 'pure-black',
  '#fce184': 'sun-yellow',
  '#95bad2': 'sky-blue',
  '#fcc383': 'sunset-fuzz',
  '#ff6b63': 'sun-red',
  '#cef5ca': 'mint',
  '#ffffff': 'pure-white',
  '#22c55e': 'success-mint',
};

// Hex → semantic token mapping, keyed by Tailwind prefix context.
// Only includes 1:1 safe mappings. Ambiguous mappings are omitted.
//
// Keys: bg = background, text = text color, border = border color,
//        ring = ring color, any = use when context is unknown
export const hexToSemantic = {
  // cream → page (bg), flip (text)
  '#fef8e2': {
    bg: 'page',
    text: 'flip',
  },
  // ink → main (text), inv (bg), line (border)
  '#0f0e0c': {
    bg: 'inv',
    text: 'main',
    border: 'line',
  },
  // sun-yellow → accent (bg), focus (border/ring)
  '#fce184': {
    bg: 'accent',
    border: 'focus',
    ring: 'focus',
  },
  // sky-blue → link (text), link (bg/text)
  '#95bad2': {
    text: 'link',
  },
  // sunset-fuzz → tinted (bg), accent-soft (bg)
  '#fcc383': {
    bg: 'accent-soft',
  },
  // sun-red → danger (bg), danger (text/bg)
  '#ff6b63': {
    bg: 'danger',
    text: 'danger',
  },
  // mint → success
  '#cef5ca': {
    bg: 'success',
    text: 'success',
  },
  // pure-white → card (bg)
  '#ffffff': {
    bg: 'card',
  },
  // pure-black — no safe 1:1 mapping (too generic)
  // success-mint
  '#22c55e': {
    text: 'success',
  },
};

// Removed aliases — MUST NOT appear anywhere
export const removedAliases = [
  '--color-black',
  '--color-white',
  '--color-green',
  '--color-success-green',
  '--glow-green',
];

// RDNA components and the raw HTML elements they replace
export const rdnaComponentMap = {
  button: { component: 'Button', import: '@rdna/radiants/components/core' },
  // Input enforcement is limited to text-like inputs in v1.
  input: { component: 'Input', import: '@rdna/radiants/components/core', note: 'Only enforce for text-like input types in v1' },
  select: { component: 'Select', import: '@rdna/radiants/components/core' },
  textarea: { component: 'Input', import: '@rdna/radiants/components/core', note: 'Use Input with multiline' },
  dialog: { component: 'Dialog', import: '@rdna/radiants/components/core' },
};
