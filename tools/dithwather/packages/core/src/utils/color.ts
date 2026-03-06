/**
 * Color Utilities
 */

import type { RGB, RGBA } from '../types'

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  const clean = hex.replace(/^#/, '')

  // Handle shorthand (#fff -> #ffffff)
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean

  const num = parseInt(full, 16)

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0')

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

/**
 * Apply brightness adjustment to RGB (-1 to 1)
 */
export function adjustBrightness(rgb: RGB, amount: number): RGB {
  const adjust = amount * 255
  return {
    r: Math.max(0, Math.min(255, rgb.r + adjust)),
    g: Math.max(0, Math.min(255, rgb.g + adjust)),
    b: Math.max(0, Math.min(255, rgb.b + adjust)),
  }
}

/**
 * Apply contrast adjustment to RGB (-1 to 1)
 */
export function adjustContrast(rgb: RGB, amount: number): RGB {
  // Convert amount (-1 to 1) to contrast factor
  const factor = (1 + amount) / (1 - amount * 0.99)

  const adjust = (value: number) => {
    return Math.max(0, Math.min(255, factor * (value - 128) + 128))
  }

  return {
    r: adjust(rgb.r),
    g: adjust(rgb.g),
    b: adjust(rgb.b),
  }
}

/**
 * Calculate relative luminance (0-1)
 */
export function luminance(rgb: RGB): number {
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
}

/**
 * Lerp between two colors
 */
export function lerpColor(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  }
}

/**
 * Interpolate between two hex colors
 */
export function mixHex(hex1: string, hex2: string, t: number): string {
  return rgbToHex(lerpColor(hexToRgb(hex1), hexToRgb(hex2), t))
}
