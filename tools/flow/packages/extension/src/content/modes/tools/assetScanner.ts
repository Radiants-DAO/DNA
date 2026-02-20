// assetScanner.ts

import { extractCustomProperties } from '../../../agent/customProperties'
import type { CustomProperty } from '@flow/shared'

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

export interface ElementAssets {
  images: ScannedAssetImage[]
  svgs: ScannedAssetSVG[]
  fonts: ScannedAssetFont[]
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

  // CSS variables: use existing extractor
  const variables = root instanceof HTMLElement
    ? extractCustomProperties(root)
    : []

  return { images, svgs, fonts, variables }
}

/**
 * Scan multiple elements and merge/deduplicate results.
 */
export function scanMultipleElements(elements: Element[]): ElementAssets {
  const merged: ElementAssets = { images: [], svgs: [], fonts: [], variables: [] }
  const seenImageSrc = new Set<string>()
  const seenSvgHash = new Set<string>()
  const seenFont = new Set<string>()
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
    for (const v of assets.variables) {
      if (!seenVar.has(v.name)) {
        seenVar.add(v.name)
        merged.variables.push(v)
      }
    }
  }

  return merged
}
