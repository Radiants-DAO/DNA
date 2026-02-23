import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  enableEventInterception,
  disableEventInterception,
  getInterceptorElement,
} from '../modes/eventInterceptor'
import { createTestShadowRoot } from './toolTestHelpers'

describe('eventInterceptor', () => {
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    shadowRoot = createTestShadowRoot()
  })

  afterEach(() => {
    disableEventInterception()
  })

  it('creates interceptor element in shadow root', () => {
    enableEventInterception(shadowRoot)
    const el = getInterceptorElement()
    expect(el).not.toBeNull()
    expect(el!.parentNode).toBe(shadowRoot)
  })

  it('interceptor has fixed positioning covering viewport', () => {
    enableEventInterception(shadowRoot)
    const el = getInterceptorElement()!
    expect(el.style.position).toBe('fixed')
    expect(el.style.pointerEvents).toBe('auto')
    expect(el.getAttribute('data-flow-interceptor')).toBe('true')
  })

  it('disableEventInterception removes the element', () => {
    enableEventInterception(shadowRoot)
    expect(getInterceptorElement()).not.toBeNull()
    disableEventInterception()
    expect(getInterceptorElement()).toBeNull()
  })

  it('does not create duplicate interceptors', () => {
    enableEventInterception(shadowRoot)
    enableEventInterception(shadowRoot)
    expect(shadowRoot.querySelectorAll('[data-flow-interceptor]').length).toBe(1)
  })

  it('routes click events to handler', () => {
    const onClick = vi.fn()
    enableEventInterception(shadowRoot, { onClick })
    const el = getInterceptorElement()!
    el.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('routes mousemove events to handler', () => {
    const onMouseMove = vi.fn()
    enableEventInterception(shadowRoot, { onMouseMove })
    const el = getInterceptorElement()!
    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    expect(onMouseMove).toHaveBeenCalledTimes(1)
  })
})
