/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReducedMotion } from './useReducedMotion'

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

describe('useReducedMotion', () => {
  it('returns false by default (no preference set)', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns false when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('uses legacy MediaQueryList listeners when addEventListener is unavailable', () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener,
        removeListener,
        dispatchEvent: () => false,
      }),
    })

    const { unmount } = renderHook(() => useReducedMotion())

    expect(addListener).toHaveBeenCalledTimes(1)

    unmount()

    expect(removeListener).toHaveBeenCalledTimes(1)
  })
})
