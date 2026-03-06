/**
 * Floyd-Steinberg Error Diffusion Dithering
 *
 * Distributes quantization error to neighboring pixels.
 * Higher quality than ordered dithering, but slower and less predictable.
 */

// ============================================================================
// Error Diffusion Matrix
// ============================================================================

/**
 * Floyd-Steinberg error distribution:
 *
 *       X   7/16
 * 3/16 5/16 1/16
 *
 * Where X is the current pixel
 */
const FS_WEIGHTS = {
  right: 7 / 16,
  bottomLeft: 3 / 16,
  bottom: 5 / 16,
  bottomRight: 1 / 16,
}

// ============================================================================
// Dithering Function
// ============================================================================

export interface FloydSteinbergOptions {
  /** Brightness threshold (0-1), default 0.5 */
  threshold?: number
}

/**
 * Apply Floyd-Steinberg dithering to image data (in place)
 *
 * @param imageData - ImageData to dither (modified in place)
 * @param options - Dithering options
 */
export function applyFloydSteinbergDither(
  imageData: ImageData,
  options: FloydSteinbergOptions = {}
): void {
  const { threshold = 0.5 } = options
  const { data, width, height } = imageData

  // Work with floating point luminance values for error diffusion
  const luminance = new Float32Array(width * height)

  // Convert to luminance
  for (let i = 0; i < width * height; i++) {
    const pi = i * 4
    const r = data[pi] / 255
    const g = data[pi + 1] / 255
    const b = data[pi + 2] / 255
    luminance[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }

  // Process pixels left-to-right, top-to-bottom
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const oldValue = luminance[i]

      // Quantize to 0 or 1 based on threshold
      const newValue = oldValue >= threshold ? 1 : 0

      // Calculate error
      const error = oldValue - newValue

      // Store quantized value
      luminance[i] = newValue

      // Distribute error to neighbors
      if (x + 1 < width) {
        luminance[i + 1] += error * FS_WEIGHTS.right
      }
      if (y + 1 < height) {
        if (x > 0) {
          luminance[i + width - 1] += error * FS_WEIGHTS.bottomLeft
        }
        luminance[i + width] += error * FS_WEIGHTS.bottom
        if (x + 1 < width) {
          luminance[i + width + 1] += error * FS_WEIGHTS.bottomRight
        }
      }
    }
  }

  // Write back to image data
  for (let i = 0; i < width * height; i++) {
    const pi = i * 4
    const value = luminance[i] >= 0.5 ? 255 : 0
    data[pi] = value
    data[pi + 1] = value
    data[pi + 2] = value
    // Alpha unchanged
  }
}
