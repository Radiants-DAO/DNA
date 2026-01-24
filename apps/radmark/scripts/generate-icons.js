/**
 * Generate placeholder PNG icons from SVG for the extension
 * Note: In production, use proper PNG assets
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = resolve(__dirname, '../public/icons')

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true })
}

// RadMark SVG icon paths (pixel art style)
const svgPaths = [
  'M20 50V80H10V70H0V60H10V50H20Z',
  'M30 100V90H20V110H40V100H30Z',
  'M40 30V20H20V40H30V30H40Z',
  'M60 10H50V20H80V10H70V0H60V10Z',
  'M80 110H50V120H60V130H70V120H80V110Z',
  'M80 40V30H50V40H40V50H30V80H40V90H50V100H80V90H90V80H100V50H90V40H80Z',
  'M90 100V110H110V90H100V100H90Z',
  'M100 30V40H110V20H90V30H100Z',
  'M110 80H120V70H130V60H120V50H110V80Z',
]

// Generate SVG content
function generateSvg(size) {
  const pathsHtml = svgPaths
    .map((d) => `    <path d="${d}" fill="#FCE184"/>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130" width="${size}" height="${size}">
  <rect width="130" height="130" fill="#0F0E0C" rx="20"/>
${pathsHtml}
</svg>`
}

// Generate icons at different sizes
const sizes = [16, 32, 48, 128]

sizes.forEach((size) => {
  const svg = generateSvg(size)
  const filename = `icon-${size}.svg`
  writeFileSync(resolve(iconsDir, filename), svg)
  console.log(`Generated ${filename}`)
})

console.log('Icons generated. Note: For Chrome extension, convert SVG to PNG.')
console.log('You can use tools like sharp, Inkscape, or ImageMagick for conversion.')
