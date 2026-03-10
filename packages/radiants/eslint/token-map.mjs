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
  // cream → surface-primary (bg), content-inverted (text)
  '#fef8e2': {
    bg: 'surface-primary',
    text: 'content-inverted',
  },
  // ink → content-primary (text), surface-secondary (bg), edge-primary (border)
  '#0f0e0c': {
    bg: 'surface-secondary',
    text: 'content-primary',
    border: 'edge-primary',
  },
  // sun-yellow → action-primary (bg), edge-focus (border/ring)
  '#fce184': {
    bg: 'action-primary',
    border: 'edge-focus',
    ring: 'edge-focus',
  },
  // sky-blue → content-link (text), status-info (bg/text)
  '#95bad2': {
    text: 'content-link',
  },
  // sunset-fuzz → surface-tertiary (bg), action-accent (bg)
  '#fcc383': {
    bg: 'action-accent',
  },
  // sun-red → action-destructive (bg), status-error (text/bg)
  '#ff6b63': {
    bg: 'action-destructive',
    text: 'status-error',
  },
  // mint → status-success
  '#cef5ca': {
    bg: 'status-success',
    text: 'status-success',
  },
  // pure-white → surface-elevated (bg)
  '#ffffff': {
    bg: 'surface-elevated',
  },
  // pure-black — no safe 1:1 mapping (too generic)
  // success-mint
  '#22c55e': {
    text: 'status-success',
  },
};

// OKLCH → semantic token mapping, keyed by Tailwind prefix context.
// Same structure as hexToSemantic but keyed by normalized oklch strings.
export const oklchToSemantic = {
  // cream → surface-primary (bg), content-inverted (text)
  'oklch(0.9780 0.0295 94.34)': {
    bg: 'surface-primary',
    text: 'content-inverted',
  },
  // ink → content-primary (text), surface-secondary (bg), edge-primary (border)
  'oklch(0.1641 0.0044 84.59)': {
    bg: 'surface-secondary',
    text: 'content-primary',
    border: 'edge-primary',
  },
  // sun-yellow → action-primary (bg), edge-focus (border/ring)
  'oklch(0.9126 0.1170 93.68)': {
    bg: 'action-primary',
    border: 'edge-focus',
    ring: 'edge-focus',
  },
  // sky-blue → content-link (text)
  'oklch(0.7701 0.0527 236.81)': {
    text: 'content-link',
  },
  // sunset-fuzz → action-accent (bg)
  'oklch(0.8546 0.1039 68.93)': {
    bg: 'action-accent',
  },
  // sun-red → action-destructive (bg), status-error (text)
  'oklch(0.7102 0.1823 25.87)': {
    bg: 'action-destructive',
    text: 'status-error',
  },
  // mint → status-success
  'oklch(0.9312 0.0702 142.51)': {
    bg: 'status-success',
    text: 'status-success',
  },
  // pure-white → surface-elevated (bg)
  'oklch(1.0000 0.0000 0)': {
    bg: 'surface-elevated',
  },
  // pure-black — no safe 1:1 mapping (too generic)
  // success-mint
  'oklch(0.7227 0.1920 149.58)': {
    text: 'status-success',
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
  details: { component: 'Accordion', import: '@rdna/radiants/components/core' },
  summary: { component: 'Accordion', import: '@rdna/radiants/components/core', note: 'Use Accordion trigger' },
};
