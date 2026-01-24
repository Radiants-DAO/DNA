/**
 * Color constants matching CSS variables in globals.css
 * These values must match exactly with --color-* variables
 */
export const COLORS = {
  warmCloud: '#FEF8E2',   // --color-warm-cloud, --bg-primary
  sunYellow: '#FCE184',   // --color-sun-yellow
  black: '#0F0E0C',       // --color-black
  skyBlue: '#95BAD2',     // --color-sky-blue
  sunsetFuzz: '#FCC383',  // --color-sunset-fuzz
  sunRed: '#FF6B63',      // --color-sun-red
  radGreen: '#CEF5CA',    // --color-green
  cream: '#FEF8E2',       // alias for warmCloud
} as const;

export type ColorName = keyof typeof COLORS;
