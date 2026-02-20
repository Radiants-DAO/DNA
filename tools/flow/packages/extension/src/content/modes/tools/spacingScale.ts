/**
 * Tailwind Spacing Scale utilities.
 *
 * Shared between the Layout tool panel inputs and the on-element drag handles.
 * Provides snapping to the Tailwind spacing scale with optional raw-px mode.
 */

export const TAILWIND_SPACING: { label: string; px: number }[] = [
  { label: '0', px: 0 },
  { label: 'px', px: 1 },
  { label: '0.5', px: 2 },
  { label: '1', px: 4 },
  { label: '1.5', px: 6 },
  { label: '2', px: 8 },
  { label: '2.5', px: 10 },
  { label: '3', px: 12 },
  { label: '3.5', px: 14 },
  { label: '4', px: 16 },
  { label: '5', px: 20 },
  { label: '6', px: 24 },
  { label: '7', px: 28 },
  { label: '8', px: 32 },
  { label: '9', px: 36 },
  { label: '10', px: 40 },
  { label: '11', px: 44 },
  { label: '12', px: 48 },
  { label: '14', px: 56 },
  { label: '16', px: 64 },
  { label: '20', px: 80 },
  { label: '24', px: 96 },
]

const TW_PX_VALUES = TAILWIND_SPACING.map(s => s.px)

export function findNearestTwIndex(px: number): number {
  let closest = 0
  let minDiff = Infinity
  for (let i = 0; i < TW_PX_VALUES.length; i++) {
    const diff = Math.abs(TW_PX_VALUES[i] - px)
    if (diff < minDiff) {
      minDiff = diff
      closest = i
    }
  }
  return closest
}

export function stepTailwind(currentPx: number, direction: 1 | -1, large: boolean): number {
  const idx = findNearestTwIndex(currentPx)
  const step = large ? 3 : 1
  const nextIdx = Math.max(0, Math.min(TW_PX_VALUES.length - 1, idx + direction * step))
  return TW_PX_VALUES[nextIdx]
}

export function pxToDisplayValue(px: number): string {
  const match = TAILWIND_SPACING.find(s => s.px === px)
  return match ? match.label : String(Math.round(px))
}
