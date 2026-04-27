/**
 * Hex values baked into exported SVG/PNG assets.
 * NOT for use in UI — those use semantic tokens.
 * Mirrors BRAND_LOGO_COLORS in @rdna/radiants/icons/DesktopIcons.tsx.
 */
export const BRAND_HEX = {
  cream: '#FEF8E2',
  ink: '#0F0E0C',
  yellow: '#FCE184',
} as const;

export type BrandColor = keyof typeof BRAND_HEX;

/** Background option — adds 'transparent' to brand colors + 'pattern' as a sentinel. */
export type BgOption = BrandColor | 'transparent' | 'pattern';
