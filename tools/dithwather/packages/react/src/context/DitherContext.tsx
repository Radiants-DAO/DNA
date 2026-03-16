import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { PartialDitherConfig, DitherRenderer } from '@rdna/dithwather-core'

// ============================================================================
// Context
// ============================================================================

interface DitherContextValue {
  defaults: PartialDitherConfig
  renderer: DitherRenderer
}

const DitherContext = createContext<DitherContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

export interface DitherProviderProps {
  /** Default configuration for all dither components */
  defaults?: PartialDitherConfig
  /**
   * Rendering backend for gradient components.
   * - 'auto'   — use WebGPU when available, fall back to canvas (default)
   * - 'webgpu' — require WebGPU (falls back to canvas if unavailable)
   * - 'canvas' — always use the CPU canvas path
   */
  renderer?: DitherRenderer
  children: ReactNode
}

/**
 * Provide default dither configuration to all child components
 */
export function DitherProvider({ defaults = {}, renderer = 'auto', children }: DitherProviderProps) {
  const value = useMemo(() => ({ defaults, renderer }), [defaults, renderer])

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
  return context ?? { defaults: {}, renderer: 'auto' }
}
