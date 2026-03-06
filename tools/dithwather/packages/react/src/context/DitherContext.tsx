import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { PartialDitherConfig } from '@rdna/dithwather-core'

// ============================================================================
// Context
// ============================================================================

interface DitherContextValue {
  defaults: PartialDitherConfig
}

const DitherContext = createContext<DitherContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

export interface DitherProviderProps {
  /** Default configuration for all dither components */
  defaults?: PartialDitherConfig
  children: ReactNode
}

/**
 * Provide default dither configuration to all child components
 */
export function DitherProvider({ defaults = {}, children }: DitherProviderProps) {
  const serialized = JSON.stringify(defaults)
  const value = useMemo(() => ({ defaults }), [serialized])

  return (
    <DitherContext.Provider value={value}>
      {children}
    </DitherContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Get default dither configuration from context
 */
export function useDitherContext(): DitherContextValue {
  const context = useContext(DitherContext)
  return context ?? { defaults: {} }
}
