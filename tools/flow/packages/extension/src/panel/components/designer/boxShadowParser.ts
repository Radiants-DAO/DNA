/**
 * Box Shadow Parser
 *
 * Parses and stringifies CSS box-shadow values.
 * Handles multiple shadows, color functions with commas, and inset positioning.
 */

export interface ParsedBoxShadow {
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  color: string
  inset: boolean
}

/**
 * Parse a CSS box-shadow string into ParsedBoxShadow objects.
 * Handles multiple shadows, color functions with internal commas,
 * inset at start or end, and zero values without units.
 */
export function parseBoxShadow(value: string): ParsedBoxShadow[] {
  if (!value || value.trim() === '' || value.trim() === 'none') {
    return []
  }

  const shadows = splitByCommaOutsideParens(value)
  return shadows.map(parseSingleShadow).filter((s): s is ParsedBoxShadow => s !== null)
}

/**
 * Split by commas, ignoring commas inside parentheses (color functions).
 */
function splitByCommaOutsideParens(str: string): string[] {
  const result: string[] = []
  let current = ''
  let depth = 0

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === '(') {
      depth++
      current += char
    } else if (char === ')') {
      depth--
      current += char
    } else if (char === ',' && depth === 0) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    result.push(current.trim())
  }

  return result
}

/**
 * Parse a single shadow string.
 * Format: [inset] offsetX offsetY [blur] [spread] [color] [inset]
 */
function parseSingleShadow(shadowStr: string): ParsedBoxShadow | null {
  const tokens = tokenize(shadowStr)
  if (tokens.length < 2) return null

  let inset = false
  const lengths: number[] = []
  let color = 'black'

  // Check for inset at start
  if (tokens[0].toLowerCase() === 'inset') {
    inset = true
    tokens.shift()
  }

  // Check for inset at end
  if (tokens.length > 0 && tokens[tokens.length - 1].toLowerCase() === 'inset') {
    inset = true
    tokens.pop()
  }

  // Parse length values (offsetX, offsetY, blur?, spread?)
  let i = 0
  while (i < tokens.length && isLengthToken(tokens[i]) && lengths.length < 4) {
    lengths.push(parseLength(tokens[i]))
    i++
  }

  // Remaining tokens are the color
  if (i < tokens.length) {
    color = tokens.slice(i).join(' ')
  }

  if (lengths.length < 2) return null

  return {
    offsetX: lengths[0],
    offsetY: lengths[1],
    blur: lengths[2] ?? 0,
    spread: lengths[3] ?? 0,
    color,
    inset,
  }
}

/**
 * Tokenize keeping color functions together.
 * "2px 4px 6px rgb(255, 0, 0)" → ["2px", "4px", "6px", "rgb(255, 0, 0)"]
 */
function tokenize(str: string): string[] {
  const tokens: string[] = []
  let current = ''
  let depth = 0

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === '(') {
      depth++
      current += char
    } else if (char === ')') {
      depth--
      current += char
    } else if (/\s/.test(char) && depth === 0) {
      if (current.trim()) {
        tokens.push(current.trim())
        current = ''
      }
    } else {
      current += char
    }
  }

  if (current.trim()) {
    tokens.push(current.trim())
  }

  return tokens
}

function isLengthToken(token: string): boolean {
  return /^-?\d+(\.\d+)?(px|em|rem|%|cm|mm|in|pt|pc|ex|ch|vw|vh|vmin|vmax)?$/.test(token)
}

function parseLength(token: string): number {
  const match = token.match(/^(-?\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

/**
 * Convert ParsedBoxShadow objects back to a CSS string.
 */
export function stringifyBoxShadow(shadows: ParsedBoxShadow[]): string {
  if (shadows.length === 0) return 'none'
  return shadows.map(stringifySingleShadow).join(', ')
}

function stringifySingleShadow(shadow: ParsedBoxShadow): string {
  const parts: string[] = []
  if (shadow.inset) parts.push('inset')
  parts.push(`${shadow.offsetX}px`)
  parts.push(`${shadow.offsetY}px`)
  parts.push(`${shadow.blur}px`)
  parts.push(`${shadow.spread}px`)
  parts.push(shadow.color)
  return parts.join(' ')
}
