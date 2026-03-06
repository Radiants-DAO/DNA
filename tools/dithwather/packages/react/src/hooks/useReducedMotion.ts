import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(QUERY).matches
      : false
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return reduced
}
