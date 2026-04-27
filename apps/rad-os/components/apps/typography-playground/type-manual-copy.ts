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
  {
    name: 'Waves Blackletter CPC',
    shortName: 'Blackletter',
    role: 'Display & Editorial',
    personality: 'Ceremony, weight, editorial gravitas, tradition meeting digital',
    rationale:
      'Drop caps and mastheads need a face that commands the page. ' +
      'Blackletter signals tradition and craft — the letterpress origin of design itself. ' +
      'Used sparingly, it anchors editorial layouts with visual authority.',
    voiceLabel: 'The Ceremony',
  },
  {
    name: 'Waves Tiny CPC',
    shortName: 'Tiny',
    role: 'Decorative Caption',
    personality: 'Texture, detail, the smallest readable mark',
    rationale:
      'When text becomes ornament — colophons, watermarks, decorative asides. ' +
      'Tiny occupies the space below caption, where legibility yields to visual rhythm. ' +
      'The pixel grid at its most minimal.',
    voiceLabel: 'The Whisper',
  },
  {
    name: 'Pixeloid Sans',
    shortName: 'Pixeloid',
    role: 'Caption & Byline',
    personality: 'Quiet utility, informational, the supporting cast',
    rationale:
      'Bylines, datelines, attribution — text that identifies without competing. ' +
      'Cleaner than PixelCode, lighter than Joystix. ' +
      'The neutral pixel voice for metadata and secondary information.',
    voiceLabel: 'The Attribution',
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
