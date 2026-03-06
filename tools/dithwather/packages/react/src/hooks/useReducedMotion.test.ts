/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
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
})
