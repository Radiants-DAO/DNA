/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { RefObject } from 'react'
import { useResizeObserver } from './useResizeObserver'

function createRect(width: number, height: number): DOMRect {
  return {
    width,
    height,
    top: 0,
    right: width,
    bottom: height,
    left: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect
}

describe('useResizeObserver', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('falls back to window resize events when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined)

    let width = 100
    let height = 40
    const element = document.createElement('div')
    vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => createRect(width, height))
    const ref = { current: element } as RefObject<HTMLDivElement>

    const { result } = renderHook(() => useResizeObserver(ref, 0))

    act(() => {
      vi.runAllTimers()
    })

    expect(result.current).toEqual({ width: 100, height: 40 })

    width = 160
    height = 64

    act(() => {
      window.dispatchEvent(new Event('resize'))
      vi.runAllTimers()
    })

    expect(result.current).toEqual({ width: 160, height: 64 })
  })
})
