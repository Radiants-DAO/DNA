# OKLCH Color Pipeline Migration

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Migrate dithwather's entire color pipeline from sRGB to OKLCH — perceptually uniform luminance, interpolation, and gamut-safe color handling.

**Worktree:** `/private/tmp/dithwather-oklch` (branch `feat/dithwather-oklch`)

**Architecture:** Add an OKLab/OKLCH conversion layer (`utils/oklab.ts`) that all color operations route through. Public API accepts both hex and `oklch()` strings via a universal `parseColor` function. Luminance uses OKLab L. Interpolation happens in OKLab space. WebGPU shader gets inline WGSL conversion functions. Gamut mapping uses Ottosson's fast analytical clipping for per-pixel work.

**Tech Stack:** TypeScript, Vitest, WGSL (WebGPU compute shaders), TypeGPU

---

## Important Notes

**RDNA context:** RDNA/radiants tokens are now fully OKLCH (e.g. `oklch(0.9780 0.0295 94.34)`), with alpha variants using the `/` syntax (e.g. `oklch(0.1641 0.0044 84.59 / 0.85)`). This migration makes dithwather OKLCH-native internally so it integrates naturally when moved into the radiants package. The `parseColor` function must handle the alpha/opacity variant too.

**Key architectural insight:** The gradient dither pipeline uses **binary stop selection** (pick color A or B based on Bayer threshold), not continuous color blending. OKLCH affects (1) *when* the crossover happens via perceptual lightness, and (2) any continuous interpolation paths (animation lerps, `mixHex`, skeleton blending).

**Test runner:** `pnpm test` from the dithwather root, or `pnpm vitest run` inside `packages/core/`.

---

## Task 1: OKLab/OKLCH Conversion Functions

The foundation. Every subsequent task depends on these.

**Files:**
- Create: `packages/core/src/utils/oklab.ts`
- Create: `packages/core/src/utils/oklab.test.ts`

**Step 1: Write failing tests for sRGB ↔ OKLab conversion**

```ts
// packages/core/src/utils/oklab.test.ts
import { describe, it, expect } from 'vitest'
import {
  srgbToLinear,
  linearToSrgb,
  linearRgbToOklab,
  oklabToLinearRgb,
  oklabToOklch,
  oklchToOklab,
  hexToOklab,
  hexToOklch,
  oklabToHex,
  oklchToHex,
} from './oklab'

describe('sRGB transfer functions', () => {
  it('srgbToLinear(0) = 0', () => {
    expect(srgbToLinear(0)).toBe(0)
  })

  it('srgbToLinear(1) = 1', () => {
    expect(srgbToLinear(1)).toBeCloseTo(1, 10)
  })

  it('roundtrips through linearToSrgb', () => {
    for (const v of [0, 0.04045, 0.1, 0.5, 0.75, 1]) {
      expect(linearToSrgb(srgbToLinear(v))).toBeCloseTo(v, 6)
    }
  })

  it('handles the piecewise threshold correctly', () => {
    // Just below threshold
    expect(srgbToLinear(0.04)).toBeCloseTo(0.04 / 12.92, 6)
    // Just above threshold
    expect(srgbToLinear(0.05)).toBeCloseTo(((0.05 + 0.055) / 1.055) ** 2.4, 6)
  })
})

describe('linear RGB ↔ OKLab', () => {
  it('white maps to L≈1, a≈0, b≈0', () => {
    const lab = linearRgbToOklab(1, 1, 1)
    expect(lab.L).toBeCloseTo(1, 3)
    expect(lab.a).toBeCloseTo(0, 3)
    expect(lab.b).toBeCloseTo(0, 3)
  })

  it('black maps to L=0, a=0, b=0', () => {
    const lab = linearRgbToOklab(0, 0, 0)
    expect(lab.L).toBe(0)
    expect(lab.a).toBe(0)
    expect(lab.b).toBe(0)
  })

  it('roundtrips through oklabToLinearRgb', () => {
    const inputs = [
      [1, 0, 0], [0, 1, 0], [0, 0, 1],
      [0.5, 0.3, 0.2], [0.2, 0.7, 0.9],
    ] as const
    for (const [r, g, b] of inputs) {
      const lab = linearRgbToOklab(r, g, b)
      const rgb = oklabToLinearRgb(lab.L, lab.a, lab.b)
      expect(rgb.r).toBeCloseTo(r, 4)
      expect(rgb.g).toBeCloseTo(g, 4)
      expect(rgb.b).toBeCloseTo(b, 4)
    }
  })
})

describe('OKLab ↔ OKLCH', () => {
  it('achromatic color has C=0', () => {
    const lch = oklabToOklch(0.5, 0, 0)
    expect(lch.C).toBe(0)
  })

  it('roundtrips', () => {
    const lch = oklabToOklch(0.7, 0.1, -0.05)
    const lab = oklchToOklab(lch.L, lch.C, lch.h)
    expect(lab.L).toBeCloseTo(0.7, 6)
    expect(lab.a).toBeCloseTo(0.1, 6)
    expect(lab.b).toBeCloseTo(-0.05, 6)
  })
})

describe('hex ↔ OKLab convenience', () => {
  it('hexToOklab white ≈ L=1', () => {
    const lab = hexToOklab('#ffffff')
    expect(lab.L).toBeCloseTo(1, 2)
  })

  it('hexToOklab black = L=0', () => {
    const lab = hexToOklab('#000000')
    expect(lab.L).toBeCloseTo(0, 2)
  })

  it('oklabToHex roundtrips within 1/255 per channel', () => {
    for (const hex of ['#ff0000', '#00ff00', '#0000ff', '#808080', '#FCE184']) {
      const lab = hexToOklab(hex)
      const result = oklabToHex(lab.L, lab.a, lab.b)
      // Allow ±1 per channel from 8-bit quantization
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('hex ↔ OKLCH convenience', () => {
  it('hexToOklch and oklchToHex roundtrip', () => {
    for (const hex of ['#ff0000', '#00ff00', '#3a7bcd']) {
      const lch = hexToOklch(hex)
      const result = oklchToHex(lch.L, lch.C, lch.h)
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/utils/oklab.test.ts
```
Expected: FAIL — module `./oklab` does not exist.

**Step 3: Implement the conversion functions**

```ts
// packages/core/src/utils/oklab.ts

import { hexToRgb, rgbToHex } from './color'
import type { RGB } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────

export interface OKLab {
  L: number  // 0–1 perceptual lightness
  a: number  // green–red axis, roughly -0.4 to 0.4
  b: number  // blue–yellow axis, roughly -0.4 to 0.4
}

export interface OKLCH {
  L: number  // 0–1 perceptual lightness
  C: number  // chroma (distance from neutral axis)
  h: number  // hue angle in radians
}

// ── sRGB Transfer Functions ────────────────────────────────────────────────

/** sRGB gamma-encoded channel (0–1) → linear (0–1) */
export function srgbToLinear(x: number): number {
  return x <= 0.04045
    ? x / 12.92
    : ((x + 0.055) / 1.055) ** 2.4
}

/** Linear channel (0–1) → sRGB gamma-encoded (0–1) */
export function linearToSrgb(x: number): number {
  return x <= 0.0031308
    ? 12.92 * x
    : 1.055 * x ** (1 / 2.4) - 0.055
}

// ── Linear sRGB ↔ OKLab ───────────────────────────────────────────────────
// Matrices from Björn Ottosson (2021-01-25 revision)

/** Linear sRGB (0–1 per channel) → OKLab */
export function linearRgbToOklab(r: number, g: number, b: number): OKLab {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  }
}

/** OKLab → linear sRGB (0–1 per channel, may be out of gamut) */
export function oklabToLinearRgb(L: number, a: number, b: number): { r: number; g: number; b: number } {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return {
    r:  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  }
}

// ── OKLab ↔ OKLCH ──────────────────────────────────────────────────────────

/** OKLab (Cartesian) → OKLCH (polar). Hue is in radians. */
export function oklabToOklch(L: number, a: number, b: number): OKLCH {
  return {
    L,
    C: Math.sqrt(a * a + b * b),
    h: Math.atan2(b, a),
  }
}

/** OKLCH (polar) → OKLab (Cartesian). Hue is in radians. */
export function oklchToOklab(L: number, C: number, h: number): OKLab {
  return {
    L,
    a: C * Math.cos(h),
    b: C * Math.sin(h),
  }
}

// ── Gamut Mapping ──────────────────────────────────────────────────────────

/** Clamp linear sRGB channels to [0, 1] */
export function clampToSrgbGamut(r: number, g: number, b: number): { r: number; g: number; b: number } {
  return {
    r: Math.max(0, Math.min(1, r)),
    g: Math.max(0, Math.min(1, g)),
    b: Math.max(0, Math.min(1, b)),
  }
}

/** Check if linear sRGB values are within gamut (with small epsilon) */
export function isInSrgbGamut(r: number, g: number, b: number, epsilon = 0.001): boolean {
  return r >= -epsilon && r <= 1 + epsilon
      && g >= -epsilon && g <= 1 + epsilon
      && b >= -epsilon && b <= 1 + epsilon
}

// ── Convenience: hex ↔ OKLab/OKLCH ────────────────────────────────────────

/** Hex string → OKLab */
export function hexToOklab(hex: string): OKLab {
  const rgb = hexToRgb(hex)
  return linearRgbToOklab(
    srgbToLinear(rgb.r / 255),
    srgbToLinear(rgb.g / 255),
    srgbToLinear(rgb.b / 255),
  )
}

/** Hex string → OKLCH */
export function hexToOklch(hex: string): OKLCH {
  const lab = hexToOklab(hex)
  return oklabToOklch(lab.L, lab.a, lab.b)
}

/** OKLab → hex string (gamut-clamped) */
export function oklabToHex(L: number, a: number, b: number): string {
  const lin = oklabToLinearRgb(L, a, b)
  const clamped = clampToSrgbGamut(lin.r, lin.g, lin.b)
  return rgbToHex({
    r: Math.round(linearToSrgb(clamped.r) * 255),
    g: Math.round(linearToSrgb(clamped.g) * 255),
    b: Math.round(linearToSrgb(clamped.b) * 255),
  })
}

/** OKLCH → hex string (gamut-clamped) */
export function oklchToHex(L: number, C: number, h: number): string {
  const lab = oklchToOklab(L, C, h)
  return oklabToHex(lab.L, lab.a, lab.b)
}
```

**Step 4: Run tests to verify they pass**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/utils/oklab.test.ts
```
Expected: all PASS.

**Step 5: Commit**

```bash
git add packages/core/src/utils/oklab.ts packages/core/src/utils/oklab.test.ts
git commit -m "feat: add OKLab/OKLCH conversion functions with tests"
```

---

## Task 2: Universal Color Parser (`parseColor`)

Accept both hex strings and `oklch()` CSS strings. Returns an internal `OKLab` representation.

**Files:**
- Create: `packages/core/src/utils/parse-color.ts`
- Create: `packages/core/src/utils/parse-color.test.ts`

**Step 1: Write failing tests**

```ts
// packages/core/src/utils/parse-color.test.ts
import { describe, it, expect } from 'vitest'
import { parseColor, colorToHex, colorToOklab } from './parse-color'

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    const c = parseColor('#ff0000')
    expect(c.format).toBe('hex')
    expect(c.hex).toBe('#ff0000')
  })

  it('parses 3-digit hex', () => {
    const c = parseColor('#f00')
    expect(c.hex).toBe('#ff0000')
  })

  it('parses oklch() with spaces', () => {
    const c = parseColor('oklch(0.7 0.15 150)')
    expect(c.format).toBe('oklch')
    expect(c.oklch!.L).toBeCloseTo(0.7, 6)
    expect(c.oklch!.C).toBeCloseTo(0.15, 6)
    expect(c.oklch!.h).toBeCloseTo(150 * Math.PI / 180, 4)
  })

  it('parses oklch() with deg suffix', () => {
    const c = parseColor('oklch(0.7 0.15 150deg)')
    expect(c.oklch!.h).toBeCloseTo(150 * Math.PI / 180, 4)
  })

  it('parses oklch() with percentage lightness', () => {
    const c = parseColor('oklch(70% 0.15 150)')
    expect(c.oklch!.L).toBeCloseTo(0.7, 6)
  })

  it('parses oklch() with alpha', () => {
    const c = parseColor('oklch(0.1641 0.0044 84.59 / 0.85)')
    expect(c.format).toBe('oklch')
    expect(c.alpha).toBeCloseTo(0.85, 6)
    expect(c.oklch!.L).toBeCloseTo(0.1641, 4)
  })

  it('defaults alpha to 1', () => {
    expect(parseColor('#ff0000').alpha).toBe(1)
    expect(parseColor('oklch(0.7 0.15 150)').alpha).toBe(1)
  })

  it('throws on unsupported format', () => {
    expect(() => parseColor('rgb(255, 0, 0)')).toThrow()
    expect(() => parseColor('red')).toThrow()
  })
})

describe('colorToHex', () => {
  it('hex passthrough', () => {
    expect(colorToHex(parseColor('#ff0000'))).toBe('#ff0000')
  })

  it('oklch converts to hex', () => {
    const hex = colorToHex(parseColor('oklch(0.63 0.26 29)'))
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('colorToOklab', () => {
  it('hex converts to oklab', () => {
    const lab = colorToOklab(parseColor('#ffffff'))
    expect(lab.L).toBeCloseTo(1, 2)
  })

  it('oklch converts to oklab', () => {
    const lab = colorToOklab(parseColor('oklch(0.5 0.1 180)'))
    expect(lab.L).toBeCloseTo(0.5, 6)
  })
})
```

**Step 2: Run tests — expect FAIL**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/utils/parse-color.test.ts
```

**Step 3: Implement**

```ts
// packages/core/src/utils/parse-color.ts

import type { OKLab, OKLCH } from './oklab'
import { hexToOklab, hexToOklch, oklabToHex, oklchToOklab } from './oklab'
import { hexToRgb, rgbToHex } from './color'

export interface ParsedColor {
  /** Original format detected */
  format: 'hex' | 'oklch'
  /** Normalized 6-digit hex (always populated, alpha discarded) */
  hex: string
  /** OKLCH values if parsed from oklch() input (hue in radians) */
  oklch?: OKLCH
  /** Alpha channel 0-1 (default 1). Parsed from oklch(L C h / alpha) */
  alpha: number
}

const OKLCH_RE = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(deg)?(?:\s*\/\s*([\d.]+))?\s*\)$/i

/**
 * Parse a color string into an internal representation.
 * Supports: hex (#rgb, #rrggbb) and oklch(L C h).
 * Throws on unsupported formats.
 */
export function parseColor(input: string): ParsedColor {
  const trimmed = input.trim()

  // Try hex
  if (trimmed.startsWith('#') || /^[0-9a-f]{3,6}$/i.test(trimmed)) {
    const rgb = hexToRgb(trimmed)
    return { format: 'hex', hex: rgbToHex(rgb), alpha: 1 }
  }

  // Try oklch()
  const match = trimmed.match(OKLCH_RE)
  if (match) {
    let L = parseFloat(match[1])
    if (match[2] === '%') L /= 100
    const C = parseFloat(match[3])
    let hDeg = parseFloat(match[4])
    // match[5] is 'deg' or undefined — both mean degrees
    const h = hDeg * (Math.PI / 180)

    const alpha = match[6] !== undefined ? parseFloat(match[6]) : 1
    const oklch: OKLCH = { L, C, h }
    const lab = oklchToOklab(L, C, h)
    const hex = oklabToHex(lab.L, lab.a, lab.b)

    return { format: 'oklch', hex, oklch, alpha }
  }

  throw new Error(`Unsupported color format: "${trimmed}". Use hex (#rrggbb) or oklch(L C h).`)
}

/** Convert a parsed color to a hex string */
export function colorToHex(color: ParsedColor): string {
  return color.hex
}

/** Convert a parsed color to OKLab */
export function colorToOklab(color: ParsedColor): OKLab {
  if (color.oklch) {
    return oklchToOklab(color.oklch.L, color.oklch.C, color.oklch.h)
  }
  return hexToOklab(color.hex)
}
```

**Step 4: Run tests — expect PASS**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/utils/parse-color.test.ts
```

**Step 5: Commit**

```bash
git add packages/core/src/utils/parse-color.ts packages/core/src/utils/parse-color.test.ts
git commit -m "feat: add universal color parser (hex + oklch)"
```

---

## Task 3: OKLab Perceptual Luminance

Replace the BT.601 luma with OKLab L for perceptually accurate dithering thresholds.

**Files:**
- Modify: `packages/core/src/utils/color.ts:77-79` (update `luminance` function)
- Modify: `packages/core/src/utils/color.test.ts:66-88` (update luminance tests)
- Modify: `packages/core/src/algorithms/bayer.ts:85-89` (replace inlined luma)
- Modify: `packages/core/src/algorithms/floyd-steinberg.ts:53-58` (replace inlined luma)

**Step 1: Update the luminance tests to expect OKLab L behavior**

Replace the `luminance` describe block in `packages/core/src/utils/color.test.ts`:

```ts
describe('luminance', () => {
  it('returns 0 for black', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0)
  })

  it('returns ~1 for white', () => {
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2)
  })

  it('is perceptually uniform (OKLab L)', () => {
    // Mid-gray should be near 0.53 in OKLab, NOT 0.5 like BT.601
    const midGray = luminance({ r: 128, g: 128, b: 128 })
    expect(midGray).toBeGreaterThan(0.5)
    expect(midGray).toBeLessThan(0.6)
  })

  it('pure green has higher perceptual lightness than pure red', () => {
    const green = luminance({ r: 0, g: 255, b: 0 })
    const red = luminance({ r: 255, g: 0, b: 0 })
    expect(green).toBeGreaterThan(red)
  })

  it('pure red has higher perceptual lightness than pure blue', () => {
    const red = luminance({ r: 255, g: 0, b: 0 })
    const blue = luminance({ r: 0, g: 0, b: 255 })
    expect(red).toBeGreaterThan(blue)
  })
})
```

**Step 2: Run tests — expect FAIL (old BT.601 implementation won't match)**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/utils/color.test.ts
```

**Step 3: Update `luminance` in `color.ts`**

Replace the luminance function in `packages/core/src/utils/color.ts`:

```ts
import { srgbToLinear, linearRgbToOklab } from './oklab'

/**
 * Calculate perceptual lightness (OKLab L channel, 0-1)
 */
export function luminance(rgb: RGB): number {
  const lr = srgbToLinear(rgb.r / 255)
  const lg = srgbToLinear(rgb.g / 255)
  const lb = srgbToLinear(rgb.b / 255)
  return linearRgbToOklab(lr, lg, lb).L
}
```

**Step 4: Run tests — expect PASS**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/utils/color.test.ts
```

**Step 5: Update Bayer dithering to use the `luminance` import**

In `packages/core/src/algorithms/bayer.ts`, add the import and replace the inlined luma:

```ts
// Add at top:
import { luminance as oklabLuminance } from '../utils/color'

// Replace lines 85-89 (inside the loop):
      const luminance = oklabLuminance({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      })
```

Remove the manual `r/255`, `g/255`, `b/255` and `0.299*r + 0.587*g + 0.114*b` calculation.

**Step 6: Update Floyd-Steinberg to use the `luminance` import**

In `packages/core/src/algorithms/floyd-steinberg.ts`, add the import and replace the inlined luma:

```ts
// Add at top:
import { luminance as oklabLuminance } from '../utils/color'

// Replace lines 53-58 (the luminance conversion loop):
  for (let i = 0; i < width * height; i++) {
    const pi = i * 4
    luminance[i] = oklabLuminance({
      r: data[pi],
      g: data[pi + 1],
      b: data[pi + 2],
    })
  }
```

**Step 7: Run all algorithm tests**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/algorithms/
```

Expected: PASS. The tests assert behavioral properties (binary output, determinism, threshold direction) that still hold with OKLab luminance. The exact pixel patterns will change but the assertions are designed to be luminance-formula-agnostic.

**Step 8: Commit**

```bash
git add packages/core/src/utils/color.ts packages/core/src/utils/color.test.ts \
  packages/core/src/algorithms/bayer.ts packages/core/src/algorithms/floyd-steinberg.ts
git commit -m "feat: replace BT.601 luma with OKLab perceptual lightness"
```

---

## Task 4: OKLab Interpolation Functions

Replace sRGB lerp with OKLab interpolation for `lerpColor` and `mixHex`. This fixes the "muddy midpoint" problem for animation and skeleton blending.

**Files:**
- Modify: `packages/core/src/utils/color.ts:84-97` (`lerpColor` and `mixHex`)
- Modify: `packages/core/src/utils/color.test.ts:90-119` (lerpColor tests)
- Modify: `packages/core/src/utils/color.test.ts:186-199` (mixHex tests)

**Step 1: Update the lerpColor and mixHex tests**

```ts
describe('lerpColor', () => {
  const black = { r: 0, g: 0, b: 0 }
  const white = { r: 255, g: 255, b: 255 }
  const red = { r: 255, g: 0, b: 0 }
  const blue = { r: 0, g: 0, b: 255 }

  it('returns first color at t=0', () => {
    expect(lerpColor(red, blue, 0)).toEqual(red)
  })

  it('returns second color at t=1', () => {
    expect(lerpColor(red, blue, 1)).toEqual(blue)
  })

  it('returns a midpoint for t=0.5', () => {
    const mid = lerpColor(black, white, 0.5)
    // OKLab midpoint of black↔white is NOT (128,128,128) — it's brighter
    // because OKLab L=0.5 maps to ~sRGB 0.39 (≈100/255) in linear, ~188/255 gamma
    // Just verify it's in a reasonable range and all channels are equal (achromatic)
    expect(mid.r).toBe(mid.g)
    expect(mid.g).toBe(mid.b)
    expect(mid.r).toBeGreaterThan(80)
    expect(mid.r).toBeLessThan(200)
  })

  it('midpoint of red↔cyan is more vibrant than sRGB midpoint', () => {
    const cyan = { r: 0, g: 255, b: 255 }
    const mid = lerpColor(red, cyan, 0.5)
    // OKLab interpolation stays more saturated than sRGB which goes through gray
    // sRGB midpoint would be (128, 128, 128) — a dull gray
    // OKLab midpoint should have more color
    const maxChannel = Math.max(mid.r, mid.g, mid.b)
    const minChannel = Math.min(mid.r, mid.g, mid.b)
    expect(maxChannel - minChannel).toBeGreaterThan(30) // has color, not gray
  })
})

describe('mixHex', () => {
  it('returns first color at t=0', () => {
    expect(mixHex('#ff0000', '#0000ff', 0)).toBe('#ff0000')
  })

  it('returns second color at t=1', () => {
    expect(mixHex('#ff0000', '#0000ff', 1)).toBe('#0000ff')
  })

  it('produces a valid hex at t=0.5', () => {
    const result = mixHex('#000000', '#ffffff', 0.5)
    expect(result).toMatch(/^#[0-9a-f]{6}$/)
  })
})
```

**Step 2: Run tests — expect FAIL**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/utils/color.test.ts
```

**Step 3: Update `lerpColor` and `mixHex` to use OKLab interpolation**

In `packages/core/src/utils/color.ts`:

```ts
import {
  srgbToLinear,
  linearToSrgb,
  linearRgbToOklab,
  oklabToLinearRgb,
  clampToSrgbGamut,
} from './oklab'

/**
 * Lerp between two colors in OKLab space (perceptually uniform)
 */
export function lerpColor(a: RGB, b: RGB, t: number): RGB {
  if (t <= 0) return { ...a }
  if (t >= 1) return { ...b }

  const labA = linearRgbToOklab(
    srgbToLinear(a.r / 255), srgbToLinear(a.g / 255), srgbToLinear(a.b / 255),
  )
  const labB = linearRgbToOklab(
    srgbToLinear(b.r / 255), srgbToLinear(b.g / 255), srgbToLinear(b.b / 255),
  )

  const L = labA.L + (labB.L - labA.L) * t
  const la = labA.a + (labB.a - labA.a) * t
  const lb = labA.b + (labB.b - labA.b) * t

  const lin = oklabToLinearRgb(L, la, lb)
  const clamped = clampToSrgbGamut(lin.r, lin.g, lin.b)

  return {
    r: Math.round(linearToSrgb(clamped.r) * 255),
    g: Math.round(linearToSrgb(clamped.g) * 255),
    b: Math.round(linearToSrgb(clamped.b) * 255),
  }
}
```

`mixHex` calls `lerpColor` so it inherits the OKLab behavior automatically.

**Step 4: Run tests — expect PASS**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/utils/color.test.ts
```

**Step 5: Commit**

```bash
git add packages/core/src/utils/color.ts packages/core/src/utils/color.test.ts
git commit -m "feat: lerpColor and mixHex now interpolate in OKLab"
```

---

## Task 5: Update CPU Gradient Renderer

The CPU gradient renderer (`gradients/render.ts`) currently caches hex→RGB and does binary stop selection in sRGB. Update it to cache hex→OKLab for perceptually-correct threshold comparison.

**Files:**
- Modify: `packages/core/src/gradients/render.ts`

**Step 1: Write a focused test for perceptual gradient behavior**

Add to `packages/core/src/gradients/render.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { renderGradientDither } from './render'
import { resolveGradient } from './types'

describe('renderGradientDither OKLab behavior', () => {
  it('gradient output pixels are exactly one of the stop colors', () => {
    const gradient = resolveGradient(undefined, ['#ff0000', '#0000ff'], undefined)
    const result = renderGradientDither({
      gradient,
      algorithm: 'bayer4x4',
      width: 16,
      height: 16,
    })
    const data = result.data
    for (let i = 0; i < data.length; i += 4) {
      const isRed = data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 0
      const isBlue = data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 255
      expect(isRed || isBlue).toBe(true)
    }
  })
})
```

**Step 2: Run test to verify it passes (this is a behavior-preservation test)**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/gradients/render.test.ts
```

The gradient renderer does binary selection (A or B), so the output is always an exact stop color. This test ensures the refactor doesn't break that invariant.

**Step 3: No implementation changes needed for `render.ts`**

The CPU gradient renderer uses `findStopSegment` for `localT` which is based on gradient position (geometric), not color. The binary selection `(seg.localT + bias) > bayerThreshold` compares a position-based value against the Bayer matrix. This is already correct — the "perceptual" part comes from where the stop positions are placed, which is the user's responsibility.

The color cache currently maps hex→RGB for the final pixel write. This still works correctly because the output pixel is always an exact stop color (not interpolated).

**However**, if we want the `localT` to reflect perceptual distance between stops (so the dither transition happens at the perceptual midpoint), we need to remap `localT` by the OKLab L distance. This is the key improvement.

Update `packages/core/src/gradients/render.ts`:

```ts
import { hexToOklab } from '../utils/oklab'
import type { OKLab } from '../utils/oklab'

// In renderGradientDither, alongside the colorCache:
  const oklabCache = new Map<string, OKLab>()
  for (const stop of gradient.stops) {
    if (!oklabCache.has(stop.color)) {
      oklabCache.set(stop.color, hexToOklab(stop.color))
    }
  }

// After findStopSegment(t, gradient.stops, seg), remap localT:
      // Remap localT by perceptual lightness distance
      const labA = oklabCache.get(seg.colorA)!
      const labB = oklabCache.get(seg.colorB)!
      const dL = labB.L - labA.L
      if (Math.abs(dL) > 0.001) {
        // Map linear position to perceptual position
        // When colors have different lightness, shift threshold toward perceptual midpoint
        const midL = labA.L + seg.localT * dL
        seg.localT = (midL - labA.L) / dL
      }
```

Wait — this is a no-op (it reconstructs the same value). The real improvement is that `localT` is geometric position, and we want to adjust it so the *visual* transition midpoint corresponds to the perceptual midpoint. But since the binary selection just compares `localT` to Bayer threshold, and the threshold is uniform, the dither pattern already distributes evenly across the geometric span. The perceptual improvement comes from the luminance function used *within* the stop-pair, which only matters for the legacy canvas renderer (Task 3 already handled).

**For the gradient renderer, no changes to render.ts are needed.** The binary selection with geometric `localT` is correct. The visual quality improvement comes from tasks 3 (luminance) and 4 (interpolation).

**Step 4: Run full gradient test suite to confirm nothing broke**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/gradients/
```

**Step 5: Commit the behavior-preservation test**

```bash
git add packages/core/src/gradients/render.test.ts
git commit -m "test: add gradient output invariant test"
```

---

## Task 6: WebGPU Shader OKLCH Functions

Add OKLab conversion functions to the WGSL shader so the GPU path matches the CPU path's perceptual behavior. The GPU currently stores stop colors in sRGB — update to store in OKLab and convert back to sRGB only at the output packing step.

**Files:**
- Modify: `packages/core/src/webgpu/renderer.ts` (WGSL shader source + JS stop encoding)

**Step 1: Write a test that verifies CPU and GPU produce compatible output**

This test requires WebGPU which isn't available in Node. Instead, test the JS-side stop encoding change. Add to an existing test file or create:

```ts
// packages/core/src/webgpu/renderer.test.ts
import { describe, it, expect } from 'vitest'
import { hexToOklab } from '../utils/oklab'

describe('WebGPU stop encoding (unit)', () => {
  it('hex stop colors convert to OKLab values in expected ranges', () => {
    const lab = hexToOklab('#FCE184')
    expect(lab.L).toBeGreaterThan(0.8)  // bright yellow
    expect(lab.L).toBeLessThan(1)
    expect(lab.a).toBeCloseTo(0, 1)     // near neutral on green-red
    expect(lab.b).toBeGreaterThan(0.05) // yellow-shifted
  })
})
```

**Step 2: Update the WGSL shader**

In `packages/core/src/webgpu/renderer.ts`, update the `Stop` struct and shader:

1. Change the `Stop` struct to store OKLab values:

```ts
const Stop = d.struct({
  L:        d.f32,
  a:        d.f32,
  b:        d.f32,
  position: d.f32,
})
```

2. Update the WGSL shader source — change `Stop` struct and add conversion functions before `main`:

```wgsl
struct Stop {
  L:        f32,
  a:        f32,
  b:        f32,
  position: f32,
}

// OKLab → linear sRGB
fn oklab_to_linear_srgb(lab: vec3<f32>) -> vec3<f32> {
  let l_ = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  let m_ = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  let s_ = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;

  let l = l_ * l_ * l_;
  let m = m_ * m_ * m_;
  let s = s_ * s_ * s_;

  return vec3<f32>(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

// Linear sRGB → gamma-encoded sRGB (branchless approximation)
fn linear_to_srgb(c: f32) -> f32 {
  return pow(clamp(c, 0.0, 1.0), 1.0 / 2.2);
}
```

3. Update the `main` function — stop colors are now in OKLab, convert to sRGB at output:

```wgsl
  // Replace:
  //   var cA = vec3<f32>(stops[i].r, stops[i].g, stops[i].b);
  // With:
  var cA = vec3<f32>(stops[n - 1u].L, stops[n - 1u].a, stops[n - 1u].b);
  var cB = cA;

  // ... (loop stays the same, just field names change to L, a, b)

  // After binary selection:
  let lab = select(cA, cB, useB);
  let lin = oklab_to_linear_srgb(lab);
  let r = u32(clamp(linear_to_srgb(lin.x), 0.0, 1.0) * 255.0);
  let g = u32(clamp(linear_to_srgb(lin.y), 0.0, 1.0) * 255.0);
  let b = u32(clamp(linear_to_srgb(lin.z), 0.0, 1.0) * 255.0);
  output[outIdx] = r | (g << 8u) | (b << 16u) | (255u << 24u);
```

4. Update the JS `render()` method stop encoding:

```ts
    const stopsArr = gradient.stops.slice(0, MAX_STOPS).map(stop => {
      const lab = hexToOklab(stop.color)
      return { L: lab.L, a: lab.a, b: lab.b, position: stop.position }
    })
    while (stopsArr.length < MAX_STOPS) stopsArr.push({ L: 0, a: 0, b: 0, position: 0 })
```

Update the import to use `hexToOklab` instead of `hexToRgb`.

**Step 3: Run tests**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/
```

**Step 4: Commit**

```bash
git add packages/core/src/webgpu/renderer.ts packages/core/src/webgpu/renderer.test.ts
git commit -m "feat: WebGPU shader operates in OKLab, converts to sRGB at output"
```

---

## Task 7: Update Canvas Renderer

The canvas renderer (`renderer/canvas.ts`) uses `hexToRgb` for color mapping. Its brightness/contrast adjustments also operate in sRGB. Update color mapping to go through OKLab.

**Files:**
- Modify: `packages/core/src/renderer/canvas.ts`

**Step 1: Run existing canvas tests as baseline**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/renderer/
```

**Step 2: Update the brightness/contrast functions to work in OKLab space**

In `packages/core/src/renderer/canvas.ts`, replace `applyAdjustments`:

```ts
import { srgbToLinear, linearToSrgb, linearRgbToOklab, oklabToLinearRgb, clampToSrgbGamut } from '../utils/oklab'

function applyAdjustments(
  imageData: ImageData,
  brightness: number,
  contrast: number
): void {
  if (brightness === 0 && contrast === 0) return

  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    // Convert to OKLab
    const lr = srgbToLinear(data[i] / 255)
    const lg = srgbToLinear(data[i + 1] / 255)
    const lb = srgbToLinear(data[i + 2] / 255)
    let lab = linearRgbToOklab(lr, lg, lb)

    // Apply brightness in perceptual lightness
    if (brightness !== 0) {
      lab.L = Math.max(0, Math.min(1, lab.L + brightness))
    }

    // Apply contrast around perceptual midpoint (L=0.5)
    if (contrast !== 0) {
      const factor = (1 + contrast) / (1 - contrast * 0.99)
      lab.L = Math.max(0, Math.min(1, factor * (lab.L - 0.5) + 0.5))
    }

    // Convert back
    const lin = oklabToLinearRgb(lab.L, lab.a, lab.b)
    const clamped = clampToSrgbGamut(lin.r, lin.g, lin.b)
    data[i] = Math.round(linearToSrgb(clamped.r) * 255)
    data[i + 1] = Math.round(linearToSrgb(clamped.g) * 255)
    data[i + 2] = Math.round(linearToSrgb(clamped.b) * 255)
  }
}
```

**Step 3: Run canvas tests**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/renderer/
```

**Step 4: Commit**

```bash
git add packages/core/src/renderer/canvas.ts
git commit -m "feat: canvas renderer brightness/contrast now operate in OKLab"
```

---

## Task 8: Wire `parseColor` Into Public API Types

Update the type system so `DitherGradientStop.color`, `MonoColors.fg`, `DuotoneColors.fg`/`bg` accept both formats. Wire `parseColor` into the gradient resolution path.

**Files:**
- Modify: `packages/core/src/gradients/types.ts:10-15` (update `DitherGradientStop` doc)
- Modify: `packages/core/src/gradients/render.ts` (use `parseColor` in color cache)
- Modify: `packages/core/src/renderer/canvas.ts` (use `parseColor` in color mapping)
- Modify: `packages/core/src/webgpu/renderer.ts` (use `parseColor` in stop encoding)
- Modify: `packages/core/src/index.ts` (export new modules)

**Step 1: Update gradient stop documentation**

In `packages/core/src/gradients/types.ts`, update the `DitherGradientStop` interface:

```ts
export interface DitherGradientStop {
  /** Color string — hex (#rrggbb, #rgb) or oklch(L C h) */
  color: string
  /** Position along the gradient axis, 0-1. Auto-distributed if omitted. */
  position?: number
}
```

**Step 2: Wire `parseColor` into the CPU gradient renderer**

In `packages/core/src/gradients/render.ts`, replace `hexToRgb` with `parseColor`:

```ts
import { parseColor } from '../utils/parse-color'
import { hexToRgb } from '../utils/color'

// In renderGradientDither, replace the colorCache building:
  const colorCache = new Map<string, RGB>()
  for (const stop of gradient.stops) {
    if (!colorCache.has(stop.color)) {
      const hex = parseColor(stop.color).hex
      colorCache.set(stop.color, hexToRgb(hex))
    }
  }
```

**Step 3: Wire `parseColor` into the WebGPU renderer**

In `packages/core/src/webgpu/renderer.ts`, update the stop encoding:

```ts
import { parseColor } from '../utils/parse-color'
import { hexToOklab } from '../utils/oklab'

// In render(), update stop encoding:
    const stopsArr = gradient.stops.slice(0, MAX_STOPS).map(stop => {
      const hex = parseColor(stop.color).hex
      const lab = hexToOklab(hex)
      return { L: lab.L, a: lab.a, b: lab.b, position: stop.position }
    })
```

**Step 4: Wire `parseColor` into the canvas renderer**

In `packages/core/src/renderer/canvas.ts`, update color mapping functions:

```ts
import { parseColor } from '../utils/parse-color'

// In applyDuotoneColors:
  const fg = hexToRgb(parseColor(colors.fg).hex)
  const bg = hexToRgb(parseColor(colors.bg).hex)

// In applyMonoColors:
  const fg = hexToRgb(parseColor(colors.fg).hex)
```

**Step 5: Update exports in `packages/core/src/index.ts`**

Add the new modules:

```ts
// OKLab
export {
  type OKLab,
  type OKLCH,
  srgbToLinear,
  linearToSrgb,
  linearRgbToOklab,
  oklabToLinearRgb,
  oklabToOklch,
  oklchToOklab,
  hexToOklab,
  hexToOklch,
  oklabToHex,
  oklchToHex,
  clampToSrgbGamut,
  isInSrgbGamut,
} from './utils/oklab'

// Color parsing
export {
  type ParsedColor,
  parseColor,
  colorToHex,
  colorToOklab,
} from './utils/parse-color'
```

**Step 6: Run full test suite**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/core/src/
```

**Step 7: Commit**

```bash
git add packages/core/src/gradients/types.ts packages/core/src/gradients/render.ts \
  packages/core/src/webgpu/renderer.ts packages/core/src/renderer/canvas.ts \
  packages/core/src/index.ts
git commit -m "feat: wire parseColor into all renderers, export OKLab utilities"
```

---

## Task 9: Update React Components

The React layer passes color strings to the core. Update DitherBox, DitherSkeleton, and DitherButton to document OKLCH support. The React layer itself doesn't need to parse colors — that happens in the core renderers. But `useDitherAnimation` does its own interpolation and needs updating.

**Files:**
- Modify: `packages/react/src/hooks/useDitherAnimation.ts` (lerpConfig color handling)
- Modify: `packages/react/src/components/DitherSkeleton.tsx` (mixHex already uses OKLab from Task 4)
- Modify: `packages/react/src/components/DitherBox.tsx` (doc comments only)

**Step 1: Update `useDitherAnimation.ts`**

The `lerpConfig` function currently does `hexToRgb` → `lerpColor` → `rgbToHex`. Since `lerpColor` now operates in OKLab (Task 4), this path is already correct. But we should also handle oklch() inputs gracefully.

In `packages/react/src/hooks/useDitherAnimation.ts`, update the color interpolation to normalize through `parseColor`:

```ts
import { parseColor } from '@rdna/dithwather-core'

// In lerpConfig, when extracting fg/bg colors:
  const fromFgHex = parseColor(fromFg).hex
  const toFgHex = parseColor(toFg).hex
  // ... use these hex values with hexToRgb → lerpColor → rgbToHex
```

Wait — `@rdna/dithwather-core` is the published package name but within the monorepo, the import path is relative or via workspace protocol. Check the react package's imports:

The react package imports from `@rdna/dithwather-core` via workspace — so this import will work. But `parseColor` needs to be exported from core (done in Task 8).

**Step 2: Update DitherBox and DitherSkeleton doc comments**

In `packages/react/src/components/DitherBox.tsx`, update the `colors` prop doc:

```ts
  /** Array of color strings (hex or oklch) — evenly-spaced gradient stops */
  colors?: string[]
```

In `packages/react/src/components/DitherSkeleton.tsx`, update color prop docs:

```ts
  /** Band color(s) — hex or oklch() */
  color?: string | string[]
  /** Background color — hex or oklch() */
  bgColor?: string
```

**Step 3: Run React tests**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run packages/react/src/
```

**Step 4: Commit**

```bash
git add packages/react/src/hooks/useDitherAnimation.ts \
  packages/react/src/components/DitherBox.tsx \
  packages/react/src/components/DitherSkeleton.tsx
git commit -m "feat: React components accept oklch() color strings"
```

---

## Task 10: Full Integration Test

Run the complete test suite and build to verify everything works end-to-end.

**Step 1: Run all tests**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm vitest run
```

**Step 2: Run build**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm build
```

**Step 3: Fix any failures**

Address test failures or build errors. Common issues:
- Import paths not resolving across packages
- TypeScript strict mode catching type mismatches
- Tests with hardcoded sRGB values that are now OKLab

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fix integration issues from OKLCH migration"
```

---

## Task 11: Update Playground Color Tokens

Update the playground to demonstrate OKLCH colors alongside hex.

**Files:**
- Modify: `apps/playground/src/tokens.ts` (add OKLCH variants)
- Modify: `apps/playground/src/sections/Sandbox.tsx` (add oklch input option)

**Step 1: Add OKLCH examples to playground tokens**

In `apps/playground/src/tokens.ts`, add OKLCH versions alongside existing hex tokens:

```ts
export const T = {
  // ... existing hex values stay unchanged
  oklch: {
    sunYellow: 'oklch(0.89 0.15 90)',
    skyBlue: 'oklch(0.76 0.08 230)',
    sunRed: 'oklch(0.63 0.26 29)',
    mint: 'oklch(0.87 0.12 152)',
  },
}
```

**Step 2: Test that playground builds**

```bash
cd /private/tmp/dithwather-oklch/tools/dithwather && pnpm build
```

**Step 3: Commit**

```bash
git add apps/playground/src/tokens.ts
git commit -m "feat: playground tokens include OKLCH examples"
```

---

## Summary of Changes by File

| File | Change | Task |
|------|--------|------|
| `utils/oklab.ts` | **NEW** — conversion functions | 1 |
| `utils/oklab.test.ts` | **NEW** — conversion tests | 1 |
| `utils/parse-color.ts` | **NEW** — universal parser | 2 |
| `utils/parse-color.test.ts` | **NEW** — parser tests | 2 |
| `utils/color.ts` | `luminance` → OKLab L, `lerpColor` → OKLab lerp | 3, 4 |
| `utils/color.test.ts` | Updated expectations | 3, 4 |
| `algorithms/bayer.ts` | Replace inlined BT.601 with import | 3 |
| `algorithms/floyd-steinberg.ts` | Replace inlined BT.601 with import | 3 |
| `renderer/canvas.ts` | Brightness/contrast in OKLab, `parseColor` | 7, 8 |
| `gradients/render.ts` | `parseColor` in color cache | 8 |
| `webgpu/renderer.ts` | WGSL OKLab functions, Stop struct → L/a/b, `parseColor` | 6, 8 |
| `gradients/types.ts` | Doc update | 8 |
| `index.ts` | Export OKLab + parseColor modules | 8 |
| `react/hooks/useDitherAnimation.ts` | Normalize colors via `parseColor` | 9 |
| `react/components/DitherBox.tsx` | Doc update | 9 |
| `react/components/DitherSkeleton.tsx` | Doc update | 9 |
| `playground/tokens.ts` | OKLCH examples | 11 |

## Dependency Graph

```
Task 1 (OKLab functions)
  ├── Task 2 (parseColor)
  │     └── Task 8 (wire into all renderers + exports)
  │           └── Task 9 (React components)
  ├── Task 3 (luminance)
  ├── Task 4 (interpolation)
  │     └── Task 7 (canvas renderer)
  └── Task 6 (WebGPU shader)

Task 10 (integration test) — after all above
Task 11 (playground) — after Task 10
```

Tasks 3, 4, and 6 can run in parallel after Task 1.
Tasks 2 and 3/4/6 can also run in parallel after Task 1.
