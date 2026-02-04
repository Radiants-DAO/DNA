/**
 * Vitest setup file for jsdom environment.
 * Provides polyfills for browser APIs not available in jsdom.
 */

// Polyfill CSS.escape for jsdom (used by generateSelector in elementRegistry)
if (typeof globalThis.CSS === 'undefined') {
  (globalThis as unknown as { CSS: typeof CSS }).CSS = {
    escape: cssEscape,
    // Add other CSS static methods as stubs if needed
    supports: () => false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
} else if (typeof globalThis.CSS.escape !== 'function') {
  globalThis.CSS.escape = cssEscape;
}

/**
 * CSS.escape polyfill based on https://drafts.csswg.org/cssom/#serialize-an-identifier
 * Escapes a string for use as a CSS identifier.
 */
function cssEscape(value: string): string {
  const str = String(value);
  const length = str.length;
  let result = '';
  let index = 0;

  while (index < length) {
    const codeUnit = str.charCodeAt(index);

    // If the character is NULL (U+0000), use replacement character
    if (codeUnit === 0x0000) {
      result += '\uFFFD';
      index++;
      continue;
    }

    // If in range [\1-\1F] (U+0001 to U+001F) or is U+007F
    if ((codeUnit >= 0x0001 && codeUnit <= 0x001f) || codeUnit === 0x007f) {
      result += '\\' + codeUnit.toString(16) + ' ';
      index++;
      continue;
    }

    // If the character is the first character and is in range [0-9] (U+0030 to U+0039)
    if (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) {
      result += '\\3' + str.charAt(index) + ' ';
      index++;
      continue;
    }

    // If the character is the second character and is in range [0-9] (U+0030 to U+0039)
    // and the first character is a hyphen
    if (
      index === 1 &&
      codeUnit >= 0x0030 &&
      codeUnit <= 0x0039 &&
      str.charCodeAt(0) === 0x002d
    ) {
      result += '\\' + str.charAt(index);
      index++;
      continue;
    }

    // If the character is the first character and is a hyphen (U+002D)
    // and there is no second character
    if (index === 0 && codeUnit === 0x002d && length === 1) {
      result += '\\' + str.charAt(index);
      index++;
      continue;
    }

    // If the character is not handled by one of the above rules and is
    // greater than or equal to U+0080, is U+002D (hyphen), U+005F (underscore),
    // or is in one of the ranges [0-9], [A-Z], or [a-z]
    if (
      codeUnit >= 0x0080 ||
      codeUnit === 0x002d ||
      codeUnit === 0x005f ||
      (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
      (codeUnit >= 0x0061 && codeUnit <= 0x007a)
    ) {
      result += str.charAt(index);
      index++;
      continue;
    }

    // Otherwise, escape the character
    result += '\\' + str.charAt(index);
    index++;
  }

  return result;
}
