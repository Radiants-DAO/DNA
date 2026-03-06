/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { DitherButton } from './DitherButton'

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

describe('DitherButton', () => {
  it('renders a <button> element', () => {
    render(<DitherButton>Click</DitherButton>)
    expect(screen.getByRole('button', { name: 'Click' })).toBeTruthy()
  })

  it('forwards onClick handler', () => {
    const handler = vi.fn()
    render(<DitherButton onClick={handler}>Click</DitherButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('forwards ref to the button element', () => {
    const ref = vi.fn()
    render(<DitherButton ref={ref}>Ref</DitherButton>)
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
  })

  it('applies disabled attribute', () => {
    render(<DitherButton disabled>Disabled</DitherButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies buttonStyle to inner button', () => {
    render(<DitherButton buttonStyle={{ fontSize: '24px' }}>Styled</DitherButton>)
    expect(screen.getByRole('button').style.fontSize).toBe('24px')
  })

  it('passes gradient props through to DitherBox', () => {
    render(
      <DitherButton colors={['#000', '#fff']} angle={45} algorithm="bayer4x4">
        Gradient Button
      </DitherButton>
    )
    expect(screen.getByText('Gradient Button')).toBeTruthy()
  })
})
