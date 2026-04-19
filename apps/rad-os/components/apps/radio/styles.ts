// =============================================================================
// Shared Radio LCD text styling. Matches the Paper "Glitter.wav - KEMOS4BE"
// track title: pure-white fill with a 3-layer sun-yellow + cream glow.
// =============================================================================

import type { CSSProperties } from 'react';

export const LCD_GLOW_TEXT_SHADOW =
  'var(--color-sun-yellow) 0 0 0.25px, var(--color-sun-yellow) 0 0 2.25px, var(--color-cream) 0 0 8.25px';

// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-lcd-text owner:rad-os expires:2026-12-31 issue:DNA-999
export const LCD_TEXT_COLOR = 'oklch(1 0 0)';

export const lcdText: CSSProperties = {
  color: LCD_TEXT_COLOR,
  textShadow: LCD_GLOW_TEXT_SHADOW,
};
