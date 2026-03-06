/** Gradient shape types */
export type DitherGradientType =
  | 'linear'
  | 'radial'
  | 'conic'
  | 'diamond'
  | 'reflected'

/** A color stop in a dither gradient */
export interface DitherGradientStop {
  /** Hex color string (e.g. '#ff0000', '#f00') */
  color: string
  /** Position along the gradient axis, 0-1. Auto-distributed if omitted. */
  position?: number
}

/** Full gradient descriptor */
export interface DitherGradient {
  type: DitherGradientType
  stops: DitherGradientStop[]
  /** Angle in degrees for linear/reflected. CSS convention: 0=to-top, 90=to-right. Default: 90 */
  angle?: number
  /** Center point as [x, y] in 0-1 range. Default: [0.5, 0.5] */
  center?: [number, number]
  /** Radius as fraction of container half-diagonal. Default: 1 */
  radius?: number
  /** Aspect ratio for elliptical radial. Default: 1 (circle) */
  aspect?: number
  /** Start angle for conic gradients, degrees. Default: 0 */
  startAngle?: number
}

/** Internal resolved gradient — all positions filled in */
export interface ResolvedGradient {
  type: DitherGradientType
  stops: Required<DitherGradientStop>[]
  angle: number
  center: [number, number]
  radius: number
  aspect: number
  startAngle: number
}

/** Result of finding which stop segment a gradient value falls in */
export interface StopSegment {
  colorA: string
  colorB: string
  localT: number
}

/**
 * Distribute positions for stops that don't specify one.
 * Follows CSS gradient spec: first defaults to 0, last to 1,
 * intermediates evenly spaced between nearest explicit neighbors.
 * Positions are clamped to [0, 1] and enforced monotonically increasing.
 */
export function resolveStops(
  stops: DitherGradientStop[]
): Required<DitherGradientStop>[] {
  if (stops.length === 0) return [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 1 }]
  if (stops.length === 1) return [{ color: stops[0].color, position: 0 }, { color: stops[0].color, position: 1 }]

  // Phase 1: Lock explicit positions (clamped), default first/last
  const result: Required<DitherGradientStop>[] = stops.map((s, i) => ({
    color: s.color,
    position: s.position !== undefined
      ? Math.max(0, Math.min(1, s.position))
      : i === 0 ? 0 : i === stops.length - 1 ? 1 : -1, // -1 = needs distribution
  }))

  // Phase 2: Distribute auto positions between explicit anchors
  let i = 0
  while (i < result.length) {
    if (result[i].position === -1) {
      // Find the run of consecutive auto-positioned stops
      const runStart = i
      while (i < result.length && result[i].position === -1) i++
      // Anchor before the run (or 0 if at start)
      const prevPos = runStart > 0 ? result[runStart - 1].position : 0
      // Anchor after the run (or 1 if at end)
      const nextPos = i < result.length ? result[i].position : 1
      const runLen = i - runStart
      for (let j = 0; j < runLen; j++) {
        result[runStart + j].position = prevPos + ((j + 1) / (runLen + 1)) * (nextPos - prevPos)
      }
    } else {
      i++
    }
  }

  // Phase 3: Enforce monotonically increasing (clamp up)
  for (let j = 1; j < result.length; j++) {
    if (result[j].position < result[j - 1].position) {
      result[j].position = result[j - 1].position
    }
  }

  return result
}

/**
 * Resolve shorthand props into a full ResolvedGradient.
 */
export function resolveGradient(
  gradient: DitherGradient | DitherGradientType | undefined,
  colors: string[] | undefined,
  angle: number | undefined
): ResolvedGradient {
  const type: DitherGradientType =
    typeof gradient === 'string' ? gradient
    : gradient?.type ?? 'linear'

  const rawStops: DitherGradientStop[] =
    (typeof gradient === 'object' ? gradient.stops : undefined) ??
    (colors ?? ['#000000', '#ffffff']).map((color) => ({ color }))

  return {
    type,
    stops: resolveStops(rawStops),
    angle: angle ?? (typeof gradient === 'object' ? gradient.angle : undefined) ?? 90,
    center: (typeof gradient === 'object' ? gradient.center : undefined) ?? [0.5, 0.5],
    radius: (typeof gradient === 'object' ? gradient.radius : undefined) ?? 1,
    aspect: (typeof gradient === 'object' ? gradient.aspect : undefined) ?? 1,
    startAngle: (typeof gradient === 'object' ? gradient.startAngle : undefined) ?? 0,
  }
}

/**
 * Find which stop segment a gradient value t falls in.
 * Writes results into the provided `out` object to avoid per-pixel allocation.
 * If `out` is omitted a new object is returned (convenience for non-hot paths).
 */
export function findStopSegment(
  t: number,
  stops: Required<DitherGradientStop>[],
  out?: StopSegment
): StopSegment {
  const seg: StopSegment = out ?? { colorA: '', colorB: '', localT: 0 }
  t = Math.max(0, Math.min(1, t))

  if (stops.length < 2) {
    seg.colorA = stops[0]?.color ?? '#000000'
    seg.colorB = stops[0]?.color ?? '#000000'
    seg.localT = 0
    return seg
  }

  for (let i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i + 1].position) {
      const segLen = stops[i + 1].position - stops[i].position
      seg.colorA = stops[i].color
      seg.colorB = stops[i + 1].color
      seg.localT = segLen > 0 ? Math.max(0, Math.min(1, (t - stops[i].position) / segLen)) : 0
      return seg
    }
  }

  const last = stops[stops.length - 1]
  seg.colorA = last.color
  seg.colorB = last.color
  seg.localT = 1
  return seg
}
