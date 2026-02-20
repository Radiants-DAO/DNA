/**
 * Scrub Label — drag on a label element to adjust a numeric value.
 *
 * Default mode: steps through Tailwind spacing scale.
 * Alt+drag: raw px mode (linear sensitivity).
 */

import { stepTailwind } from './spacingScale'

export interface ScrubOptions {
  labelEl: HTMLElement
  getValue: () => number
  setValue: (v: number) => void
  min: number
  max: number
  step: number
  /** Custom step function. Receives current value and direction, returns new value. */
  stepFn?: (current: number, direction: 1 | -1) => number
}

export function attachScrub(opts: ScrubOptions): void {
  const { labelEl, getValue, setValue, min, max } = opts
  let startX = 0
  let startVal = 0
  let isScrubbing = false
  let accumulatedDx = 0

  /** Pixels of drag before stepping to the next TW scale position */
  const TW_STEP_THRESHOLD = 8

  function onPointerDown(e: PointerEvent) {
    startX = e.clientX
    startVal = getValue()
    accumulatedDx = 0
    isScrubbing = true
    labelEl.classList.add('scrubbing')
    labelEl.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: PointerEvent) {
    if (!isScrubbing) return
    const dx = e.clientX - startX

    if (e.altKey) {
      // Alt held: raw px mode (linear sensitivity)
      const sensitivity = (max - min) / 200
      const raw = startVal + dx * sensitivity
      const clamped = Math.max(min, Math.min(max, raw))
      setValue(Math.round(clamped))
    } else {
      // Default: Tailwind scale stepping
      // Each TW_STEP_THRESHOLD px of drag = one step in the scale
      const deltaSinceLastStep = dx - accumulatedDx
      if (Math.abs(deltaSinceLastStep) >= TW_STEP_THRESHOLD) {
        const direction: 1 | -1 = deltaSinceLastStep > 0 ? 1 : -1
        const current = getValue()
        const next = opts.stepFn ? opts.stepFn(current, direction) : stepTailwind(current, direction, false)
        const clamped = Math.max(min, Math.min(max, next))
        setValue(clamped)
        accumulatedDx += direction * TW_STEP_THRESHOLD
      }
    }
  }

  function onPointerUp() {
    isScrubbing = false
    labelEl.classList.remove('scrubbing')
  }

  labelEl.addEventListener('pointerdown', onPointerDown)
  labelEl.addEventListener('pointermove', onPointerMove)
  labelEl.addEventListener('pointerup', onPointerUp)
  labelEl.addEventListener('pointercancel', onPointerUp)
}
