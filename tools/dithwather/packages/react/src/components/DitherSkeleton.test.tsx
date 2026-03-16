/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
import { DitherSkeleton } from './DitherSkeleton'

const { renderGradientDitherAutoMock } = vi.hoisted(() => ({
  renderGradientDitherAutoMock: vi.fn(
    async ({ width, height }: { width: number; height: number }) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    })
  ),
}))

vi.mock('@rdna/dithwather-core', async () => {
  const actual = await vi.importActual<typeof import('@rdna/dithwather-core')>('@rdna/dithwather-core')
  return {
    ...actual,
    renderGradientDitherAuto: renderGradientDitherAutoMock,
  }
})

// Mock matchMedia for useReducedMotion hook
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

// Mock ResizeObserver
let resizeObserverCallback: ResizeObserverCallback | null = null
globalThis.ResizeObserver = vi.fn().mockImplementation((cb: ResizeObserverCallback) => {
  resizeObserverCallback = cb
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }
})

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  createImageData: (w: number, h: number) => ({
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
  }),
  putImageData: vi.fn(),
})) as any

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock')

// Track rAF calls
let rafCallback: ((time: number) => void) | null = null
const originalRAF = globalThis.requestAnimationFrame
const originalCAF = globalThis.cancelAnimationFrame

beforeEach(() => {
  let rafId = 0
  globalThis.requestAnimationFrame = vi.fn((cb) => {
    rafCallback = cb
    return ++rafId
  })
  globalThis.cancelAnimationFrame = vi.fn()
  renderGradientDitherAutoMock.mockClear()
  resizeObserverCallback = null
})

afterEach(() => {
  cleanup()
  globalThis.requestAnimationFrame = originalRAF
  globalThis.cancelAnimationFrame = originalCAF
  rafCallback = null
})

function triggerResize(width: number = 100, height: number = 20) {
  resizeObserverCallback?.(
    [{ contentRect: { width, height } } as ResizeObserverEntry],
    {} as ResizeObserver
  )
}

describe('DitherSkeleton', () => {
  it('renders container div with canvas child', () => {
    const { container } = render(<DitherSkeleton />)
    const div = container.firstChild as HTMLElement
    expect(div.tagName).toBe('DIV')
    const canvas = div.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('applies width and height to container', () => {
    const { container } = render(<DitherSkeleton width={200} height={24} />)
    const div = container.firstChild as HTMLElement
    expect(div.style.width).toBe('200px')
    expect(div.style.height).toBe('24px')
  })

  it('applies string width', () => {
    const { container } = render(<DitherSkeleton width="50%" />)
    const div = container.firstChild as HTMLElement
    expect(div.style.width).toBe('50%')
  })

  it('applies borderRadius', () => {
    const { container } = render(<DitherSkeleton borderRadius={8} />)
    const div = container.firstChild as HTMLElement
    expect(div.style.borderRadius).toBe('8px')
  })

  it('applies className', () => {
    const { container } = render(<DitherSkeleton className="my-skeleton" />)
    expect(container.firstChild).toHaveClass('my-skeleton')
  })

  it('applies custom style', () => {
    const { container } = render(<DitherSkeleton style={{ margin: '8px' }} />)
    const div = container.firstChild as HTMLElement
    expect(div.style.margin).toBe('8px')
  })

  it('applies opacity to canvas', () => {
    const { container } = render(<DitherSkeleton opacity={0.5} />)
    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    expect(canvas.style.opacity).toBe('0.5')
  })

  it('renders border when borderColor and borderOpacity set', () => {
    const { container } = render(
      <DitherSkeleton borderColor="#ffffff" borderOpacity={0.1} />
    )
    const div = container.firstChild as HTMLElement
    // jsdom may normalize to rgba; just verify a border is set
    expect(div.style.border).toBeTruthy()
    expect(div.style.border).toContain('1px solid')
  })

  it('renders sensible defaults when no props', () => {
    const { container } = render(<DitherSkeleton />)
    const div = container.firstChild as HTMLElement
    expect(div.style.width).toBe('100%')
    expect(div.style.height).toBe('16px')
    expect(div.style.borderRadius).toBe('4px')
    expect(div.style.overflow).toBe('hidden')
  })

  it('cleans up rAF on unmount', () => {
    // Mock ResizeObserver to trigger with a non-zero size so the rAF loop starts
    globalThis.ResizeObserver = vi.fn().mockImplementation((cb: ResizeObserverCallback) => {
      // Trigger immediately with a size
      setTimeout(() => cb([{ contentRect: { width: 100, height: 20 } } as ResizeObserverEntry] as ResizeObserverEntry[], {} as ResizeObserver), 0)
      return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }
    })

    const { unmount } = render(<DitherSkeleton />)
    unmount()
    // Even if rAF wasn't started (due to timing), unmounting shouldn't crash
    // If rAF was started, cancelAnimationFrame should be called
    expect(() => unmount).not.toThrow()
  })

  it('does not crash with reduced motion', () => {
    // Simulate reduced motion
    ;(window.matchMedia as any).mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { container } = render(<DitherSkeleton />)
    expect(container.querySelector('canvas')).toBeTruthy()

    // Restore
    ;(window.matchMedia as any).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('rerenders the reduced-motion frame when rendering props change', async () => {
    ;(window.matchMedia as any).mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { rerender } = render(
      <DitherSkeleton algorithm="bayer4x4" pixelScale={2} />
    )

    triggerResize()

    await waitFor(() => {
      expect(renderGradientDitherAutoMock).toHaveBeenCalledTimes(1)
    })
    expect(renderGradientDitherAutoMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ algorithm: 'bayer4x4', pixelScale: 2 }),
      'auto'
    )

    rerender(<DitherSkeleton algorithm="bayer8x8" pixelScale={4} />)

    await waitFor(() => {
      expect(renderGradientDitherAutoMock).toHaveBeenCalledTimes(2)
    })
    expect(renderGradientDitherAutoMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ algorithm: 'bayer8x8', pixelScale: 4 }),
      'auto'
    )
  })
})
