/**
 * Editorial copy for the Type Manual.
 * Keeps all prose, rationale, and do/don't content separate from layout code.
 */

// ============================================================================
// Font Rationale
// ============================================================================

export interface FontRationale {
  name: string;
  shortName: string;
  role: string;
  personality: string;
  rationale: string;
  voiceLabel: string;
}

export const FONT_RATIONALE: FontRationale[] = [
  {
    name: 'Joystix Monospace',
    shortName: 'Joystix',
    role: 'Display & Headings',
    personality: 'Arcade nostalgia, maximum punch, irreverence, excitement, play',
    rationale:
      'The loudest, most unapologetic bitmap font. Inner-child energy. ' +
      'Unmistakable at any size. A strong contrast with Mondwest\'s subtle, regal vibe.',
    voiceLabel: 'The Shout',
  },
  {
    name: 'Mondwest',
    shortName: 'Mondwest',
    role: 'Body & Readability',
    personality: 'Wisdom, alchemy, gentle authority. Editorial seriousness, artistic sensitivity',
    rationale:
      'Warm and readable without being generic. Pixel-meets-serif elegance from Pangram Pangram. ' +
      'For communicating artistic, sensitive, or sobering thoughts.',
    voiceLabel: 'The Voice',
  },
  {
    name: 'PixelCode',
    shortName: 'PixelCode',
    role: 'Code & Monospace',
    personality: 'Utility, clarity, quick-scan information',
    rationale:
      'A non-pixelated monospace would break the aesthetic unity. ' +
      'Four weights plus italic gives real typographic range for code syntax. ' +
      'Without PixelCode, the pixel vocabulary is incomplete.',
    voiceLabel: 'The Precision',
  },
];

// ============================================================================
// Design Statement (Magazine variant intro)
// ============================================================================

export const DESIGN_STATEMENT = {
  headline: 'Three Voices, One Vocabulary',
  body:
    'Every element in Radiants is constructed from pixels. Borders, corners, icons, ' +
    'dithering patterns -- all built on the same bitmap grid. The type system completes ' +
    'this vocabulary with three fonts, each earning its place through pixel construction ' +
    'and distinct personality.',
  subhead: 'Shout. Speak. Precise.',
};

// ============================================================================
// Broadsheet Chrome
// ============================================================================

export const BROADSHEET = {
  masthead: 'THE DAILY GLYPH',
  volume: 'Vol. 1 No. 1',
  dateline: 'Radiants Design System',
  tagline: 'All the Type That\'s Fit to Print',
  edition: 'Brand Typography Edition',
};

// ============================================================================
// Do / Don't Rules
// ============================================================================

export interface TypographyRule {
  id: string;
  category: string;
  type: 'do' | 'dont';
  label: string;
  reason: string;
  /** Example text/element to render visually */
  example: {
    text: string;
    fontClass: string;
    /** Extra classes or inline styles for the rendered example */
    className?: string;
    style?: Record<string, string>;
  };
}

export const TYPOGRAPHY_RULES: TypographyRule[] = [
  // -- Font role violations --
  {
    id: 'role-joystix-body',
    category: 'Font Roles',
    type: 'dont',
    label: 'Joystix for body text',
    reason: 'Joystix is display-only. It destroys readability at paragraph length.',
    example: {
      text: 'This is a paragraph of body text that should be easy to read across multiple lines of content.',
      fontClass: 'font-joystix',
      className: 'text-xs leading-relaxed',
    },
  },
  {
    id: 'role-mondwest-body',
    category: 'Font Roles',
    type: 'do',
    label: 'Mondwest for body text',
    reason: 'Mondwest is warm, readable, and built for long-form.',
    example: {
      text: 'This is a paragraph of body text that should be easy to read across multiple lines of content.',
      fontClass: 'font-mondwest',
      className: 'text-base leading-relaxed',
    },
  },
  {
    id: 'role-mondwest-code',
    category: 'Font Roles',
    type: 'dont',
    label: 'Mondwest in code blocks',
    reason: 'Code must always use PixelCode. Proportional fonts break alignment.',
    example: {
      text: 'const token = "--color-sun-yellow";',
      fontClass: 'font-mondwest',
      className: 'text-sm',
    },
  },
  {
    id: 'role-pixelcode-code',
    category: 'Font Roles',
    type: 'do',
    label: 'PixelCode for code blocks',
    reason: 'Monospace alignment and pixel cohesion.',
    example: {
      text: 'const token = "--color-sun-yellow";',
      fontClass: 'font-mono',
      className: 'text-sm',
    },
  },
  {
    id: 'role-pixelcode-headline',
    category: 'Font Roles',
    type: 'dont',
    label: 'PixelCode for headlines',
    reason: 'PixelCode is for utility, not display. Headlines need punch.',
    example: {
      text: 'Welcome to Radiants',
      fontClass: 'font-mono',
      className: 'text-lg',
    },
  },
  {
    id: 'role-joystix-headline',
    category: 'Font Roles',
    type: 'do',
    label: 'Joystix for headlines',
    reason: 'Maximum impact. The shout.',
    example: {
      text: 'Welcome to Radiants',
      fontClass: 'font-joystix',
      className: 'text-lg uppercase tracking-tight',
    },
  },

  // -- Weight misuse --
  {
    id: 'weight-bold-body',
    category: 'Weights',
    type: 'dont',
    label: 'Mondwest Bold for body text',
    reason: 'Reserve bold for emphasis. Body text should be regular weight.',
    example: {
      text: 'Long paragraphs in bold weight cause eye fatigue and flatten the hierarchy.',
      fontClass: 'font-mondwest',
      className: 'text-base leading-relaxed',
      style: { fontWeight: '700' },
    },
  },
  {
    id: 'weight-regular-body',
    category: 'Weights',
    type: 'do',
    label: 'Mondwest Regular for body text',
    reason: 'Regular weight keeps body text comfortable and preserves hierarchy.',
    example: {
      text: 'Long paragraphs in regular weight are comfortable to read and leave room for bold emphasis.',
      fontClass: 'font-mondwest',
      className: 'text-base leading-relaxed',
      style: { fontWeight: '400' },
    },
  },
  {
    id: 'weight-tiny-joystix',
    category: 'Weights',
    type: 'dont',
    label: 'Joystix at tiny sizes',
    reason: 'Joystix becomes illegible below text-xs. Use it at text-sm and above.',
    example: {
      text: 'This text is too small to read',
      fontClass: 'font-joystix',
      style: { fontSize: '6px' },
    },
  },

  // -- Hardcoded values --
  {
    id: 'token-hardcoded-size',
    category: 'Tokens',
    type: 'dont',
    label: 'Hardcoded font sizes',
    reason: 'Raw pixel values bypass the type scale and break consistency.',
    example: {
      text: 'font-size: 14px',
      fontClass: 'font-mono',
      className: 'text-sm text-danger',
    },
  },
  {
    id: 'token-semantic-size',
    category: 'Tokens',
    type: 'do',
    label: 'Semantic size tokens',
    reason: 'Tokens keep the system consistent and maintainable.',
    example: {
      text: 'className="text-sm"',
      fontClass: 'font-mono',
      className: 'text-sm text-accent',
    },
  },
  {
    id: 'token-hardcoded-color',
    category: 'Tokens',
    type: 'dont',
    label: 'Hardcoded text colors',
    reason: 'Raw hex values don\'t flip in dark mode.',
    example: {
      text: 'color: #333333',
      fontClass: 'font-mono',
      className: 'text-sm text-danger',
    },
  },
  {
    id: 'token-semantic-color',
    category: 'Tokens',
    type: 'do',
    label: 'Semantic color tokens',
    reason: 'Semantic tokens adapt to Sun/Moon mode automatically.',
    example: {
      text: 'className="text-main"',
      fontClass: 'font-mono',
      className: 'text-sm text-accent',
    },
  },

  // -- Spacing/tracking --
  {
    id: 'spacing-uppercase-no-tracking',
    category: 'Spacing',
    type: 'dont',
    label: 'Uppercase Joystix without tracking',
    reason: 'All-caps pixel text needs letter-spacing to stay legible.',
    example: {
      text: 'RADIANTS DESIGN SYSTEM',
      fontClass: 'font-joystix',
      className: 'text-sm uppercase',
      style: { letterSpacing: '0' },
    },
  },
  {
    id: 'spacing-uppercase-tracked',
    category: 'Spacing',
    type: 'do',
    label: 'Uppercase Joystix with tracking',
    reason: 'Tracking opens up the letterforms and improves scan-ability.',
    example: {
      text: 'RADIANTS DESIGN SYSTEM',
      fontClass: 'font-joystix',
      className: 'text-sm uppercase tracking-tight',
    },
  },
  {
    id: 'spacing-tight-leading',
    category: 'Spacing',
    type: 'dont',
    label: 'Tight leading on body text',
    reason: 'Cramped line-height makes paragraphs hard to read.',
    example: {
      text: 'Body text with tight leading makes it difficult to track from one line to the next.',
      fontClass: 'font-mondwest',
      className: 'text-base',
      style: { lineHeight: '1' },
    },
  },
  {
    id: 'spacing-relaxed-leading',
    category: 'Spacing',
    type: 'do',
    label: 'Relaxed leading on body text',
    reason: 'Generous line-height keeps paragraphs breathable.',
    example: {
      text: 'Body text with relaxed leading makes it easy to track from one line to the next.',
      fontClass: 'font-mondwest',
      className: 'text-base leading-relaxed',
    },
  },

  // -- Pixel cohesion --
  {
    id: 'cohesion-smooth-mix',
    category: 'Cohesion',
    type: 'dont',
    label: 'Pixel fonts with smooth elements',
    reason: 'Mixing pixel type with anti-aliased rounded corners or smooth icons breaks the visual language.',
    example: {
      text: 'Radiants',
      fontClass: 'font-joystix',
      className: 'text-base px-3 py-1 rounded-full border border-line',
    },
  },
  {
    id: 'cohesion-pixel-match',
    category: 'Cohesion',
    type: 'do',
    label: 'Pixel fonts with pixel elements',
    reason: 'Every element shares the same bitmap construction. Cohesion is the brand.',
    example: {
      text: 'Radiants',
      fontClass: 'font-joystix',
      className: 'text-base px-3 py-1 pixel-rounded-sm border border-line',
    },
  },

  // -- Mixing fonts --
  {
    id: 'mix-two-fonts-heading',
    category: 'Mixing',
    type: 'dont',
    label: 'Two fonts in one heading',
    reason: 'One font per text block. Hierarchy comes from size and weight, not font mixing.',
    example: {
      text: 'Welcome to Radiants',
      fontClass: 'font-joystix',
      className: 'text-lg',
    },
  },
];

/** Group rules by category for rendering */
export function getRulesByCategory(): { category: string; rules: TypographyRule[] }[] {
  const map = new Map<string, TypographyRule[]>();
  for (const rule of TYPOGRAPHY_RULES) {
    const existing = map.get(rule.category) ?? [];
    existing.push(rule);
    map.set(rule.category, existing);
  }
  return Array.from(map.entries()).map(([category, rules]) => ({ category, rules }));
}

// ============================================================================
// Usage Guide section intros (opinionated headers, precise rules)
// ============================================================================

export const USAGE_SECTIONS = [
  {
    id: 'font-roles',
    title: 'Every Font Has a Job',
    intro: 'Joystix yells. Mondwest speaks. PixelCode computes. If your UI is yelling everywhere, something is wrong.',
  },
  {
    id: 'weights',
    title: 'Weight Is Emphasis, Not Decoration',
    intro: 'Bold draws the eye. Use it to pull readers toward what matters, not to fill space.',
  },
  {
    id: 'tokens',
    title: 'Tokens, Not Magic Numbers',
    intro: 'Hardcoded values are tech debt with a font-size. Use the scale. Trust the system.',
  },
  {
    id: 'spacing',
    title: 'Let the Letters Breathe',
    intro: 'Pixel fonts need room. Tight tracking and cramped leading turn character into noise.',
  },
  {
    id: 'cohesion',
    title: 'Pixels All the Way Down',
    intro: 'The brand is a bitmap. Rounded corners and smooth gradients next to pixel type look like a rendering bug.',
  },
  {
    id: 'mixing',
    title: 'One Voice Per Moment',
    intro: 'Mixing fonts within a single element is like two people talking at once. Pick one.',
  },
];
