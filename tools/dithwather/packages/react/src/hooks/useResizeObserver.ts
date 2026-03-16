import { useState, useEffect, useRef, type RefObject } from 'react'

export interface Size {
  width: number
  height: number
}

/**
 * Hook to observe element size changes
 */
export function useResizeObserver<T extends HTMLElement>(
  ref: RefObject<T>,
  debounceMs: number = 16
): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const queueSizeUpdate = (width: number, height: number) => {
      // Debounce updates
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
        setSize({ width: Math.round(width * dpr), height: Math.round(height * dpr) })
      }, debounceMs)
    }

    const measure = () => {
      const rect = element.getBoundingClientRect()
      queueSizeUpdate(rect.width, rect.height)
    }

    if (typeof ResizeObserver === 'undefined') {
      measure()

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', measure)
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', measure)
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      queueSizeUpdate(entry.contentRect.width, entry.contentRect.height)
    })

    observer.observe(element)
    measure()

    return () => {
      observer.disconnect()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [ref, debounceMs])

  return size
}
