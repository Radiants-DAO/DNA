import Color from 'colorjs.io';

/**
 * Calculate the WCAG 2.1 contrast ratio between two colors.
 * Returns a value between 1 (identical) and 21 (maximum contrast).
 * Uses relative luminance calculation per WCAG spec.
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fg = new Color(foreground);
  const bg = new Color(background);
  return fg.contrast(bg, 'WCAG21');
}

/**
 * Check if a color combination meets WCAG AA requirements.
 * @param foreground - Foreground (text) color
 * @param background - Background color
 * @param largeText - Whether the text is large (18pt+ or 14pt+ bold)
 */
export function meetsWcagAA(
  foreground: string,
  background: string,
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if a color combination meets WCAG AAA requirements.
 * @param foreground - Foreground (text) color
 * @param background - Background color
 * @param largeText - Whether the text is large (18pt+ or 14pt+ bold)
 */
export function meetsWcagAAA(
  foreground: string,
  background: string,
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get the APCA (Advanced Perceptual Contrast Algorithm) contrast.
 * APCA is the next-gen contrast algorithm being considered for WCAG 3.0.
 * Returns a value roughly between -100 and 100.
 */
export function getApcaContrast(foreground: string, background: string): number {
  const fg = new Color(foreground);
  const bg = new Color(background);
  return fg.contrast(bg, 'APCA');
}

/**
 * Suggest a foreground color adjustment to meet contrast requirements.
 * Adjusts lightness in OKLCH space to find a passing color.
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const fg = new Color(foreground).to('oklch');
  const bg = new Color(background);

  // Try adjusting lightness up and down to find a passing color
  for (let delta = 0; delta <= 1; delta += 0.05) {
    // Try lighter
    const lighter = fg.clone();
    lighter.set('l', Math.min(1, fg.get('l') + delta));
    if (lighter.contrast(bg, 'WCAG21') >= targetRatio) {
      return lighter.toString({ format: 'oklch' });
    }

    // Try darker
    const darker = fg.clone();
    darker.set('l', Math.max(0, fg.get('l') - delta));
    if (darker.contrast(bg, 'WCAG21') >= targetRatio) {
      return darker.toString({ format: 'oklch' });
    }
  }

  // If we can't find a passing color, return white or black
  const white = new Color('white');
  const black = new Color('black');
  return white.contrast(bg, 'WCAG21') > black.contrast(bg, 'WCAG21')
    ? 'oklch(1 0 0)'
    : 'oklch(0 0 0)';
}
