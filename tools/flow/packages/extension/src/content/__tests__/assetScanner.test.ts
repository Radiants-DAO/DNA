import { describe, it, expect, vi } from 'vitest'
import { scanElementAssets, scanMultipleElements } from '../modes/tools/assetScanner'

// Mock extractCustomProperties (reads stylesheets which jsdom doesn't support well)
vi.mock('../../agent/customProperties', () => ({
  extractCustomProperties: () => [],
}))

describe('assetScanner', () => {
  describe('scanElementAssets', () => {
    it('finds <img> elements', () => {
      const container = document.createElement('div')
      const img = document.createElement('img')
      img.src = 'https://example.com/photo.jpg'
      img.alt = 'Photo'
      container.appendChild(img)
      document.body.appendChild(container)

      const assets = scanElementAssets(container)
      expect(assets.images.length).toBe(1)
      expect(assets.images[0].src).toContain('photo.jpg')
      expect(assets.images[0].alt).toBe('Photo')
      expect(assets.images[0].isBackground).toBe(false)
    })

    it('deduplicates images by src', () => {
      const container = document.createElement('div')
      const img1 = document.createElement('img')
      img1.src = 'https://example.com/same.jpg'
      const img2 = document.createElement('img')
      img2.src = 'https://example.com/same.jpg'
      container.append(img1, img2)
      document.body.appendChild(container)

      const assets = scanElementAssets(container)
      expect(assets.images.length).toBe(1)
    })

    it('finds <svg> elements', () => {
      const container = document.createElement('div')
      container.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'
      document.body.appendChild(container)

      const assets = scanElementAssets(container)
      expect(assets.svgs.length).toBe(1)
      expect(assets.svgs[0].markup).toContain('<svg')
      expect(assets.svgs[0].markup).toContain('circle')
    })

    it('finds font families from computed styles', () => {
      const el = document.createElement('p')
      el.style.fontFamily = 'Inter, sans-serif'
      el.textContent = 'Test'
      document.body.appendChild(el)

      const assets = scanElementAssets(el)
      expect(assets.fonts.length).toBeGreaterThanOrEqual(1)
      expect(assets.fonts.some(f => f.family === 'Inter')).toBe(true)
    })

    it('returns empty arrays for empty element', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)

      const assets = scanElementAssets(el)
      expect(assets.images).toEqual([])
      expect(assets.svgs).toEqual([])
    })

    it('scans root element itself when it is an <img>', () => {
      const img = document.createElement('img')
      img.src = 'https://example.com/root.jpg'
      document.body.appendChild(img)

      const assets = scanElementAssets(img)
      expect(assets.images.length).toBe(1)
      expect(assets.images[0].src).toContain('root.jpg')
    })
  })

  describe('scanMultipleElements', () => {
    it('merges and deduplicates across elements', () => {
      const el1 = document.createElement('div')
      el1.innerHTML = '<img src="https://example.com/a.jpg" />'
      document.body.appendChild(el1)

      const el2 = document.createElement('div')
      el2.innerHTML = '<img src="https://example.com/a.jpg" /><img src="https://example.com/b.jpg" />'
      document.body.appendChild(el2)

      const assets = scanMultipleElements([el1, el2])
      expect(assets.images.length).toBe(2) // a.jpg + b.jpg, not 3
    })
  })
})
