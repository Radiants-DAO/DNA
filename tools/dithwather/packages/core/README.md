# @rdna/dithwather-core

Pure JavaScript dithering engine with Bayer ordered dithering, gradient rendering, and color utilities.

## Install

```bash
npm install @rdna/dithwather-core
```

## Runtime Notes

- `renderGradientDither` works in browser, worker, and Node-like runtimes and returns an `ImageData`-compatible object.
- `renderGradientToDataURL`, `renderGradientToObjectURL`, `renderToCanvas`, and `renderToDataURL` require browser-like DOM APIs.

## Quick Start

### Render a dithered gradient to ImageData-compatible pixel data

```js
import { renderGradientDither, resolveGradient } from '@rdna/dithwather-core'

const gradient = resolveGradient(
  { type: 'linear', stops: [{ color: '#000000' }, { color: '#ffffff' }] },
  undefined,
  undefined
)

const imageData = renderGradientDither({
  gradient,
  algorithm: 'bayer4x4',
  width: 256,
  height: 256,
})

// imageData exposes width, height, and Uint8ClampedArray pixel data
```

### Render a dithered gradient to a data URL in the browser

```js
import { renderGradientToDataURL, resolveGradient } from '@rdna/dithwather-core'

const gradient = resolveGradient('linear', ['#000000', '#ffffff'], 90)

const dataURL = renderGradientToDataURL({
  gradient,
  algorithm: 'bayer8x8',
  width: 512,
  height: 256,
  pixelScale: 2,
})

document.getElementById('img').src = dataURL
```

## Exports

### Algorithms

| Export | Description |
| --- | --- |
| `applyDither` | Apply dithering to pixel data (auto-selects algorithm) |
| `applyBayerDither` | Apply Bayer ordered dithering |
| `applyFloydSteinbergDither` | Apply Floyd-Steinberg error diffusion |
| `getBayerMatrix` | Get a Bayer threshold matrix by size |
| `isOrderedAlgorithm` | Type guard for ordered algorithm strings |
| `BAYER_2X2`, `BAYER_4X4`, `BAYER_8X8` | Pre-computed Bayer matrices |

### Gradients

| Export | Description |
| --- | --- |
| `resolveGradient` | Build a `ResolvedGradient` from shorthand or full config |
| `resolveStops` | Auto-distribute stop positions |
| `renderGradientDither` | Render dithered gradient to `ImageData` |
| `renderGradientToDataURL` | Render dithered gradient to a data URL string |
| `gradientValue` | Unified distance function (dispatches by type) |
| `linearGradientValue`, `radialGradientValue`, ... | Per-type distance functions |
| `findStopSegment` | Find which two stops a gradient value falls between |

### Tiles

| Export | Description |
| --- | --- |
| `getTileDataURL` | Generate a repeating Bayer tile as a data URL |
| `getTileBits` | Get raw tile bit pattern |
| `getTileSize` | Get tile pixel dimensions |
| `thresholdToLevel` | Map a 0-1 threshold to a discrete tile level |
| `clearTileCache` | Free cached tile data URLs |

### Utils

| Export | Description |
| --- | --- |
| `hexToRgb` / `rgbToHex` | Convert between hex strings and RGB objects |
| `luminance` | Relative luminance of an RGB color |
| `lerpColor` | Linearly interpolate between two RGB colors |
| `adjustBrightness` | Shift brightness of an RGB color |
| `adjustContrast` | Adjust contrast of an RGB color |

## License

MIT
