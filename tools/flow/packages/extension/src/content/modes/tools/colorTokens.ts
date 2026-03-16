/**
 * Color Token Helpers — Semantic Color Picker
 *
 * Extracts color tokens from the page's stylesheets for the picker UI.
 * Handles Tailwind v4's @theme / @theme inline compilation:
 * - `@theme inline` tokens are inlined at build time (not available at runtime)
 * - `@theme` tokens become real CSS custom properties
 *
 * Strategy: collect ALL --color-* tokens available at runtime (semantic + any
 * surviving brand + Tailwind defaults), deduplicate by resolved color, and
 * prefer semantic DNA tokens when applying.
 */

import { extractCustomProperties, classifyTier } from '../../../agent/customProperties'
import type { CustomProperty } from '@flow/shared'

// ── Types ──

export interface ColorToken {
  /** CSS custom property name, e.g. '--color-page' */
  name: string
  /** Raw declared value */
  value: string
  /** Resolved hex color for swatch rendering */
  resolvedHex: string
  /** Classification tier */
  tier: 'brand' | 'semantic' | 'unknown'
}

/** @deprecated alias kept for colorTool.ts imports */
export type BrandColor = ColorToken

export type ColorTab = 'text' | 'fill' | 'border'

export interface SemanticMapping {
  /** CSS property to apply on the element */
  property: string
  /** Semantic token prefix to search for (surface, content, edge) */
  prefix: string
}

// ── Constants ──

export const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
] as const

// ── Helpers ──

/**
 * Convert any CSS color to a hex string via a temporary canvas context.
 */
function resolveToHex(cssColor: string): string {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return cssColor
  ctx.fillStyle = cssColor
  return ctx.fillStyle // browser normalizes to hex or rgba string
}

/**
 * Collect all custom property names from stylesheets, including those inside
 * @layer blocks (Tailwind v4), @property rules, and @supports.
 */
function collectAllCustomPropertyNames(): Set<string> {
  const names = new Set<string>()

  function walkRules(rules: CSSRuleList) {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      if (rule instanceof CSSStyleRule) {
        for (let j = 0; j < rule.style.length; j++) {
          const prop = rule.style[j]
          if (prop.startsWith('--')) names.add(prop)
        }
      } else if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
        // Handles CSSMediaRule, CSSSupportsRule, CSSLayerBlockRule, etc.
        walkRules((rule as CSSGroupingRule).cssRules)
      }
      // CSSPropertyRule (@property) — name is the custom property
      if (rule.constructor.name === 'CSSPropertyRule') {
        const propRule = rule as unknown as { name: string }
        if (propRule.name?.startsWith('--')) names.add(propRule.name)
      }
    }
  }

  try {
    for (const sheet of document.styleSheets) {
      try {
        walkRules(sheet.cssRules)
      } catch {
        // Cross-origin sheets throw SecurityError — skip
      }
    }
  } catch {
    // document.styleSheets not accessible
  }

  return names
}

/**
 * Extract all color tokens visible on the page.
 *
 * Collects --color-* tokens from stylesheets and computed styles,
 * deduplicates by resolved color value (keeping the most semantic name),
 * and skips transparent / empty values.
 *
 * This handles Tailwind v4 where `@theme inline` brand tokens are inlined
 * at build time and only `@theme` semantic tokens survive as CSS custom properties.
 */
export function extractBrandColors(element: Element): ColorToken[] {
  // Strategy 1: Walk stylesheets (handles @layer, @property, etc.)
  const sheetNames = collectAllCustomPropertyNames()

  // Strategy 2: Merge with agent extractor results
  const agentProps = extractCustomProperties(element)
  const allNames = new Set(sheetNames)
  for (const p of agentProps) {
    allNames.add(p.name)
  }

  const rootComputed = getComputedStyle(document.documentElement)
  const elemComputed = getComputedStyle(element)

  // Collect all --color-* tokens with resolved values
  const tokensByColor = new Map<string, ColorToken>()

  for (const name of allNames) {
    if (!name.startsWith('--color-')) continue
    // Skip gradient/bevel/category/crt/glow helper tokens — too noisy
    if (/^--color-(gradient|bevel|crt|glow|selection|category|focus-state|success-green|warning-yellow|error-red)/.test(name)) continue

    let rawValue = rootComputed.getPropertyValue(name).trim()
    if (!rawValue) rawValue = elemComputed.getPropertyValue(name).trim()
    if (!rawValue) continue

    // Skip values that contain var() references that didn't resolve
    if (rawValue.startsWith('var(')) continue

    const resolved = resolveToHex(rawValue)
    // Skip transparent values
    if (rawValue.includes('transparent') || rawValue.includes('rgba') && rawValue.endsWith(', 0)')) continue

    const tier = classifyTier(name)

    // Dedup by resolved color — prefer semantic tokens (more meaningful names)
    const existing = tokensByColor.get(resolved)
    if (existing) {
      // Keep semantic over brand, keep shorter names within same tier
      if (tier === 'semantic' && existing.tier !== 'semantic') {
        tokensByColor.set(resolved, { name, value: rawValue, resolvedHex: resolved, tier })
      }
      // Otherwise keep the first one found
    } else {
      tokensByColor.set(resolved, { name, value: rawValue, resolvedHex: resolved, tier })
    }
  }

  return [...tokensByColor.values()]
}

/**
 * Count how many visible elements on the page use each color.
 * Checks color, background-color, and border-color on a sample of elements.
 * Returns a Map from resolved hex → usage count.
 */
export function countColorPrevalence(tokens: ColorToken[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const t of tokens) counts.set(t.resolvedHex, 0)

  // Sample visible elements (cap at 500 to keep it fast)
  const elements = document.querySelectorAll('body *')
  const limit = Math.min(elements.length, 500)
  const hexSet = new Set(tokens.map((t) => t.resolvedHex))

  for (let i = 0; i < limit; i++) {
    const el = elements[i]
    const cs = getComputedStyle(el)

    for (const prop of ['color', 'backgroundColor', 'borderColor'] as const) {
      const resolved = resolveToHex(cs[prop])
      if (hexSet.has(resolved)) {
        counts.set(resolved, (counts.get(resolved) ?? 0) + 1)
      }
    }
  }

  return counts
}

/**
 * Extract hue (0-360) from a hex color string for sorting.
 */
export function hexToHue(hex: string): number {
  // Parse hex to RGB
  let r = 0, g = 0, b = 0
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16)
    g = parseInt(hex.slice(3, 5), 16)
    b = parseInt(hex.slice(5, 7), 16)
  } else {
    return 0
  }

  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  if (d === 0) return 0
  let h = 0
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h = Math.round(h * 60)
  if (h < 0) h += 360
  return h
}

/**
 * Map a color tab to the CSS property and semantic prefix.
 */
export function getSemanticTarget(tab: ColorTab): SemanticMapping {
  switch (tab) {
    case 'text':
      return { property: 'color', prefix: 'content' }
    case 'fill':
      return { property: 'background-color', prefix: 'surface' }
    case 'border':
      return { property: 'border-color', prefix: 'edge' }
  }
}

/**
 * Find the best token to apply for a given color choice and context.
 *
 * If the chosen token is already semantic and matches the tab prefix,
 * use it directly. Otherwise search for a semantic token with the right
 * prefix (surface/content/edge) whose resolved color matches.
 *
 * Falls back to the original token name if no better match exists.
 */
export function findSemanticVariable(
  chosenToken: string,
  prefix: string,
  allTokens: CustomProperty[],
  element: Element,
): string | null {
  // If the chosen token already has the right semantic prefix, use it
  const semanticPrefix = `--color-${prefix}-`
  if (chosenToken.startsWith(semanticPrefix)) return chosenToken

  const computed = getComputedStyle(element)
  const targetColor = resolveToHex(computed.getPropertyValue(chosenToken).trim())

  // Search for a semantic token with the matching prefix and same resolved color
  for (const token of allTokens) {
    if (token.tier !== 'semantic') continue
    if (!token.name.startsWith(semanticPrefix)) continue

    const tokenColor = resolveToHex(computed.getPropertyValue(token.name).trim())
    if (tokenColor === targetColor) {
      return token.name
    }
  }

  return null
}
