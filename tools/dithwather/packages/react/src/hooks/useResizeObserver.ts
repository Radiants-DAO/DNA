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

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const { width, height } = entry.contentRect

      // Debounce updates
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setSize({ width: Math.round(width * dpr), height: Math.round(height * dpr) })
      }, debounceMs)
    })

    observer.observe(element)

    // Initial size
    const rect = element.getBoundingClientRect()
    setSize({ width: Math.round(rect.width * dpr), height: Math.round(rect.height * dpr) })

    return () => {
      observer.disconnect()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [ref, debounceMs])

  return size
}
