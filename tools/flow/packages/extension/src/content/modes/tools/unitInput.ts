/**
 * Shared unit-aware input utilities for design tools.
 *
 * Provides auto-resolve: when a user types "16ch" or "1.5rem" into a number
 * input, the value is split into numeric + unit and the paired unit selector
 * is updated automatically.
 *
 * Used by: typographyTool, positionTool, layoutTool
 */

// ── All recognized CSS units ──

const CSS_UNITS = new Set([
  // Absolute
  'px', 'pt', 'pc', 'in', 'cm', 'mm',
  // Relative
  'em', 'rem', 'ch', 'ex', 'cap', 'ic', 'lh', 'rlh',
  // Viewport
  'vw', 'vh', 'vmin', 'vmax',
  'svw', 'svh', 'svmin', 'svmax',
  'lvw', 'lvh', 'lvmin', 'lvmax',
  'dvw', 'dvh', 'dvmin', 'dvmax',
  // Container
  'cqw', 'cqh', 'cqi', 'cqb', 'cqmin', 'cqmax',
  // Percent
  '%',
  // Angle (for hue-rotate etc.)
  'deg', 'rad', 'grad', 'turn',
])

/**
 * Parse a raw input string into a numeric value and a CSS unit.
 *
 * Examples:
 *   "16"      → { value: "16", unit: null }        (no unit typed)
 *   "16px"    → { value: "16", unit: "px" }
 *   "1.5rem"  → { value: "1.5", unit: "rem" }
 *   "100%"    → { value: "100", unit: "%" }
 *   "80dvw"   → { value: "80", unit: "dvw" }
 *   "-3ch"    → { value: "-3", unit: "ch" }
 *   "auto"    → { value: "auto", unit: null }      (keyword)
 *   "normal"  → { value: "normal", unit: null }     (keyword)
 */
export function parseValueWithUnit(
  raw: string,
  defaultUnit?: string,
): { value: string; unit: string | null } {
  const trimmed = raw.trim()
  if (!trimmed) return { value: '', unit: null }

  // Keywords pass through
  if (/^(auto|none|normal|inherit|initial|unset)$/i.test(trimmed)) {
    return { value: trimmed.toLowerCase(), unit: null }
  }

  // Try to match: optional negative, digits (with optional decimal), then unit suffix
  const match = trimmed.match(/^(-?\d*\.?\d+)\s*([a-z%]+)?$/i)
  if (!match) return { value: trimmed, unit: null }

  const numericPart = match[1]
  const unitPart = match[2]?.toLowerCase() || null

  // Validate the unit is a real CSS unit
  if (unitPart && CSS_UNITS.has(unitPart)) {
    return { value: numericPart, unit: unitPart }
  }

  // Unknown suffix — treat as just the number
  return { value: numericPart, unit: unitPart ? null : (defaultUnit ?? null) }
}

/**
 * Resolve a typed input value, auto-detecting any embedded unit.
 *
 * If the user typed "16ch":
 *   1. Sets the input's display value to "16"
 *   2. If "ch" exists in the unit selector's options, selects it
 *   3. Returns { value: "16", unit: "ch", changed: true }
 *
 * If the user typed "16" (no unit):
 *   1. Keeps the input as "16"
 *   2. Keeps the current unit selector value
 *   3. Returns { value: "16", unit: currentUnit, changed: false }
 *
 * If the unit is not in the selector's options, it adds it dynamically.
 */
export function resolveInputWithUnit(
  input: HTMLInputElement,
  unitSelect: HTMLSelectElement | null,
  defaultUnit?: string,
): { value: string; unit: string; changed: boolean } {
  const parsed = parseValueWithUnit(input.value, defaultUnit)

  // Keywords — return as-is
  if (parsed.unit === null && /^(auto|none|normal|inherit|initial|unset)$/i.test(parsed.value)) {
    input.value = parsed.value
    return { value: parsed.value, unit: unitSelect?.value || defaultUnit || '', changed: false }
  }

  const currentUnit = unitSelect?.value || defaultUnit || 'px'

  if (parsed.unit && unitSelect) {
    // User typed a unit — update the selector
    const unitLower = parsed.unit.toLowerCase()

    // Check if this unit exists in the select options
    let found = false
    for (const opt of unitSelect.options) {
      if (opt.value.toLowerCase() === unitLower) {
        unitSelect.value = opt.value
        found = true
        break
      }
    }

    // If not found, add it dynamically
    if (!found) {
      const opt = document.createElement('option')
      opt.value = unitLower
      opt.textContent = unitLower.toUpperCase()
      unitSelect.appendChild(opt)
      unitSelect.value = unitLower
    }

    input.value = parsed.value
    return { value: parsed.value, unit: unitLower, changed: true }
  }

  // No unit typed — keep current unit
  if (parsed.value) {
    input.value = parsed.value
  }
  return { value: parsed.value, unit: currentUnit, changed: false }
}
