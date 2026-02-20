/**
 * Scrub Label — drag on a label element to adjust a numeric value.
 *
 * Default mode: steps through Tailwind spacing scale.
 * Alt+drag: raw px mode (linear sensitivity).
 */

export interface ScrubOptions {
  labelEl: HTMLElement
  getValue: () => number
  setValue: (v: number) => void
  min: number
  max: number
  step: number
}

export function attachScrub(opts: ScrubOptions): void {
  const { labelEl, getValue, setValue, min, max, step } = opts
  let startX = 0
  let startVal = 0
  let isScrubbing = false

  function onPointerDown(e: PointerEvent) {
    startX = e.clientX
    startVal = getValue()
    isScrubbing = true
    labelEl.classList.add('scrubbing')
    labelEl.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: PointerEvent) {
    if (!isScrubbing) return
    const dx = e.clientX - startX
    const range = max - min
    const sensitivity = range / 200
    const raw = startVal + dx * sensitivity
    const clamped = Math.max(min, Math.min(max, raw))
    const stepped = Math.round(clamped / step) * step
    setValue(stepped)
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
