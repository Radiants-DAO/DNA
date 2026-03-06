/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDitherAnimation } from './useDitherAnimation'

// Mock matchMedia for useReducedMotion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('useDitherAnimation', () => {
  it('returns initial config with defaults applied', () => {
    const { result } = renderHook(() =>
      useDitherAnimation({ threshold: 0.3 })
    )
    expect(result.current.config.threshold).toBe(0.3)
    expect(result.current.isAnimating).toBe(false)
    expect(result.current.progress).toBe(0)
  })

  it('animateTo starts animation and sets isAnimating to true', () => {
    const { result } = renderHook(() =>
      useDitherAnimation({ threshold: 0.3 }, { duration: 1000 })
    )

    act(() => {
      result.current.animateTo({ threshold: 0.8 })
    })

    // After calling animateTo, isAnimating should be true
    expect(result.current.isAnimating).toBe(true)
  })

  it('animateTo completes with reduced motion (instant snap)', () => {
    // Override matchMedia to report prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { result } = renderHook(() =>
      useDitherAnimation({ threshold: 0.3 }, { duration: 1000 })
    )

    act(() => {
      result.current.animateTo({ threshold: 0.8 })
    })

    // With reduced motion, config should snap immediately
    expect(result.current.config.threshold).toBe(0.8)
    expect(result.current.isAnimating).toBe(false)
    expect(result.current.progress).toBe(1)

    // Restore original matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('stop() halts animation', () => {
    const { result } = renderHook(() =>
      useDitherAnimation({ threshold: 0.3 }, { duration: 1000 })
    )

    act(() => {
      result.current.animateTo({ threshold: 0.9 })
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isAnimating).toBe(false)
  })

  it('exposes animateTo, stop, config, isAnimating, progress', () => {
    const { result } = renderHook(() => useDitherAnimation({}))
    expect(typeof result.current.animateTo).toBe('function')
    expect(typeof result.current.stop).toBe('function')
    expect(typeof result.current.config).toBe('object')
    expect(typeof result.current.isAnimating).toBe('boolean')
    expect(typeof result.current.progress).toBe('number')
  })
})
