// assetScanner.ts

import { extractCustomProperties } from '../../../agent/customProperties'
import type { CustomProperty } from '@flow/shared'

// ── Helpers ──

function rgbToHex(raw: string): string | null {
  // Handle rgb(r, g, b) and rgba(r, g, b, a)
  const match = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!match) {
    // Already a hex?
    if (/^#[0-9a-f]{3,8}$/i.test(raw.trim())) return raw.trim().toLowerCase()
    return null
  }
  const [, r, g, b] = match
  return `#${Number(r).toString(16).padStart(2, '0')}${Number(g).toString(16).padStart(2, '0')}${Number(b).toString(16).padStart(2, '0')}`
}

// ── Types ──

export interface ScannedAssetImage {
  src: string
  alt: string
  width: number
  height: number
  isBackground: boolean
}

export interface ScannedAssetSVG {
  markup: string
  /** First 60 chars of outerHTML for display */
  preview: string
  width: number
  height: number
}

export interface ScannedAssetFont {
  family: string
  weight: string
  style: string
  src?: string
}

export interface ScannedColor {
  hex: string
  property: string
  /** e.g. "div.hero" — tag + first class of the element it was found on */
  source: string
}

export interface ElementAssets {
  images: ScannedAssetImage[]
  svgs: ScannedAssetSVG[]
  fonts: ScannedAssetFont[]
  colors: ScannedColor[]
  variables: CustomProperty[]
}

// ── Scanner ──

export function scanElementAssets(root: Element): ElementAssets {
  const images: ScannedAssetImage[] = []
  const svgs: ScannedAssetSVG[] = []
  const fonts: ScannedAssetFont[] = []
  const seenImageSrc = new Set<string>()
  const seenSvgMarkup = new Set<string>()
  const seenFontFamily = new Set<string>()

  // Images: <img> elements
  for (const img of root.querySelectorAll('img')) {
    const src = (img as HTMLImageElement).src
    if (!src || seenImageSrc.has(src)) continue
    seenImageSrc.add(src)
    images.push({
      src,
      alt: (img as HTMLImageElement).alt || '',
      width: (img as HTMLImageElement).naturalWidth || (img as HTMLImageElement).width,
      height: (img as HTMLImageElement).naturalHeight || (img as HTMLImageElement).height,
      isBackground: false,
    })
  }

  // Also check the root itself if it's an <img>
  if (root.tagName === 'IMG') {
    const img = root as HTMLImageElement
    if (img.src && !seenImageSrc.has(img.src)) {
      seenImageSrc.add(img.src)
      images.push({
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        isBackground: false,
      })
    }
  }

  // Background images on root + descendants
  const allEls = [root, ...root.querySelectorAll('*')]
  for (const el of allEls) {
    const bg = getComputedStyle(el).backgroundImage
    if (bg && bg !== 'none') {
      const urlMatch = bg.match(/url\(["']?(.+?)["']?\)/)
      if (urlMatch && !seenImageSrc.has(urlMatch[1])) {
        seenImageSrc.add(urlMatch[1])
        images.push({
          src: urlMatch[1],
          alt: '',
          width: 0,
          height: 0,
          isBackground: true,
        })
      }
    }
  }

  // SVGs: <svg> elements
  for (const svg of root.querySelectorAll('svg')) {
    const markup = svg.outerHTML
    if (markup.length > 50_000) continue // skip enormous inline SVGs
    const hash = markup.slice(0, 200)
    if (seenSvgMarkup.has(hash)) continue
    seenSvgMarkup.add(hash)
    const box = svg.getBoundingClientRect()
    svgs.push({
      markup,
      preview: markup.slice(0, 60) + (markup.length > 60 ? '...' : ''),
      width: Math.round(box.width),
      height: Math.round(box.height),
    })
  }

  // Also check if root itself is an <svg>
  if (root.tagName === 'svg' || root.tagName === 'SVG') {
    const markup = (root as SVGElement).outerHTML
    if (markup.length <= 50_000) {
      const hash = markup.slice(0, 200)
      if (!seenSvgMarkup.has(hash)) {
        seenSvgMarkup.add(hash)
        const box = root.getBoundingClientRect()
        svgs.push({
          markup,
          preview: markup.slice(0, 60) + (markup.length > 60 ? '...' : ''),
          width: Math.round(box.width),
          height: Math.round(box.height),
        })
      }
    }
  }

  // Fonts: computed font families on root + descendants
  for (const el of allEls) {
    const computed = getComputedStyle(el)
    const families = computed.fontFamily.split(',').map(f => f.trim().replace(/^["']|["']$/g, ''))
    for (const family of families) {
      if (!family || seenFontFamily.has(family)) continue
      seenFontFamily.add(family)
      fonts.push({
        family,
        weight: computed.fontWeight,
        style: computed.fontStyle,
      })
    }
  }

  // Colors: resolved color values from computed styles
  const colors: ScannedColor[] = []
  const seenHex = new Set<string>()
  const COLOR_PROPS = [
    'color', 'background-color', 'border-color',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'outline-color', 'text-decoration-color', 'fill', 'stroke',
  ]

  for (const el of allEls) {
    const computed = getComputedStyle(el)
    const tag = el.tagName.toLowerCase()
    const cls = el.classList.length > 0 ? `.${el.classList[0]}` : ''
    const source = `${tag}${cls}`

    for (const prop of COLOR_PROPS) {
      const raw = computed.getPropertyValue(prop).trim()
      if (!raw || raw === 'transparent' || raw === 'rgba(0, 0, 0, 0)' || raw === 'none') continue
      const hex = rgbToHex(raw)
      if (!hex || seenHex.has(hex)) continue
      seenHex.add(hex)
      colors.push({ hex, property: prop, source })
    }
  }

  // After collecting fonts from computed styles, try to find @font-face URLs
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSFontFaceRule) {
            const family = rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim()
            const font = fonts.find(f => f.family === family)
            if (font && !font.src) {
              const src = rule.style.getPropertyValue('src')
              const urlMatch = src.match(/url\(["']?(.+?)["']?\)/)
              if (urlMatch) font.src = urlMatch[1]
            }
          }
        }
      } catch { /* cross-origin stylesheet */ }
    }
  } catch { /* no styleSheets access */ }

  // CSS variables: use existing extractor
  const variables = root instanceof HTMLElement
    ? extractCustomProperties(root)
    : []

  return { images, svgs, fonts, colors, variables }
}

/**
 * Scan multiple elements and merge/deduplicate results.
 */
export function scanMultipleElements(elements: Element[]): ElementAssets {
  const merged: ElementAssets = { images: [], svgs: [], fonts: [], colors: [], variables: [] }
  const seenImageSrc = new Set<string>()
  const seenSvgHash = new Set<string>()
  const seenFont = new Set<string>()
  const seenColor = new Set<string>()
  const seenVar = new Set<string>()

  for (const el of elements) {
    const assets = scanElementAssets(el)

    for (const img of assets.images) {
      if (!seenImageSrc.has(img.src)) {
        seenImageSrc.add(img.src)
        merged.images.push(img)
      }
    }
    for (const svg of assets.svgs) {
      const hash = svg.markup.slice(0, 200)
      if (!seenSvgHash.has(hash)) {
        seenSvgHash.add(hash)
        merged.svgs.push(svg)
      }
    }
    for (const font of assets.fonts) {
      if (!seenFont.has(font.family)) {
        seenFont.add(font.family)
        merged.fonts.push(font)
      }
    }
    for (const c of assets.colors) {
      if (!seenColor.has(c.hex)) {
        seenColor.add(c.hex)
        merged.colors.push(c)
      }
    }
    for (const v of assets.variables) {
      if (!seenVar.has(v.name)) {
        seenVar.add(v.name)
        merged.variables.push(v)
      }
    }
  }

  return merged
}
