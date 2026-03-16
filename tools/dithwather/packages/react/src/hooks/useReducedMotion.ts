import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function getMediaQueryList(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null
  }

  return window.matchMedia(QUERY)
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    getMediaQueryList()?.matches ?? false
  )

  useEffect(() => {
    const mql = getMediaQueryList()
    if (!mql) return

    const handler = (event?: MediaQueryListEvent) => {
      setReduced(event?.matches ?? mql.matches)
    }

    setReduced(mql.matches)

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    }

    if (typeof mql.addListener === 'function') {
      mql.addListener(handler)
      return () => mql.removeListener(handler)
    }
  }, [])

  return reduced
}
