/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DitherBox } from './DitherBox'

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

// Mock ResizeObserver (not available in jsdom)
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock canvas for gradient rendering
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  createImageData: (w: number, h: number) => ({
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
  }),
  putImageData: vi.fn(),
})) as any

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock')

describe('DitherBox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 120,
      height: 48,
      top: 0,
      right: 120,
      bottom: 48,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)
  })

  it('renders children', () => {
    render(<DitherBox>Hello</DitherBox>)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('applies className', () => {
    const { container } = render(<DitherBox className="custom">Content</DitherBox>)
    expect(container.firstChild).toHaveClass('custom')
  })

  it('applies custom style', () => {
    const { container } = render(
      <DitherBox style={{ padding: '20px' }}>Content</DitherBox>
    )
    expect((container.firstChild as HTMLElement).style.padding).toBe('20px')
  })

  it('sets position: relative on container', () => {
    const { container } = render(<DitherBox>Content</DitherBox>)
    expect((container.firstChild as HTMLElement).style.position).toBe('relative')
  })

  it('tracks hover state via mouse events', () => {
    const { container } = render(
      <DitherBox
        animate={{ idle: { threshold: 0.3 }, hover: { threshold: 0.7 }, transition: 0 }}
      >
        Hover me
      </DitherBox>
    )
    const box = container.firstChild as HTMLElement
    fireEvent.mouseEnter(box)
    fireEvent.mouseLeave(box)
    expect(screen.getByText('Hover me')).toBeTruthy()
  })

  it('accepts gradient shorthand props without crashing', () => {
    render(
      <DitherBox colors={['#000', '#fff']} angle={90} algorithm="bayer4x4">
        Gradient
      </DitherBox>
    )
    expect(screen.getByText('Gradient')).toBeTruthy()
  })

  it('accepts full gradient object without crashing', () => {
    render(
      <DitherBox
        gradient={{
          type: 'radial',
          stops: [
            { color: '#ff0000', position: 0 },
            { color: '#0000ff', position: 1 },
          ],
        }}
        algorithm="bayer4x4"
      >
        Radial
      </DitherBox>
    )
    expect(screen.getByText('Radial')).toBeTruthy()
  })

  it('renders in mask mode without crashing', () => {
    render(
      <DitherBox colors={['#000', '#fff']} mode="mask" algorithm="bayer4x4">
        Masked
      </DitherBox>
    )
    expect(screen.getByText('Masked')).toBeTruthy()
  })

  it('renders in full mode without crashing', () => {
    render(
      <DitherBox colors={['#000', '#fff']} mode="full" algorithm="bayer4x4">
        Full
      </DitherBox>
    )
    expect(screen.getByText('Full')).toBeTruthy()
  })

  it('renders gradient background via a canvas layer without encoding a data URL', async () => {
    const { container } = render(
      <DitherBox colors={['#000', '#fff']} mode="background" algorithm="bayer4x4">
        Canvas background
      </DitherBox>
    )

    await waitFor(() => {
      expect(container.querySelector('canvas[aria-hidden="true"]')).toBeTruthy()
    })

    expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
  })

  it('applies intensity as effect opacity for gradient background layers', async () => {
    const { container } = render(
      <DitherBox colors={['#000', '#fff']} mode="background" algorithm="bayer4x4" intensity={0.25}>
        Dimmed gradient
      </DitherBox>
    )

    await waitFor(() => {
      const canvas = container.querySelector('canvas[aria-hidden="true"]') as HTMLCanvasElement | null
      expect(canvas).toBeTruthy()
      expect(canvas?.style.opacity).toBe('0.25')
    })
  })

  it('falls back to an ordered algorithm for gradient rendering', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(
      <DitherBox
        colors={['#000', '#fff']}
        mode="background"
        algorithm={'floyd-steinberg' as any}
      >
        Fallback
      </DitherBox>
    )

    await waitFor(() => {
      expect(container.querySelector('canvas[aria-hidden="true"]')).toBeTruthy()
    })

    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})
