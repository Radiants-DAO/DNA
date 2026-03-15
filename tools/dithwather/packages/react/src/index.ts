/**
 * @dithwather/react
 *
 * React components and hooks for dithering effects
 */

// Components
export { DitherBox, type DitherBoxProps, type DitherMode, type InteractionState, type DitherAnimateConfig } from './components/DitherBox'
export { DitherButton, type DitherButtonProps } from './components/DitherButton'
export { DitherSkeleton, type DitherSkeletonProps } from './components/DitherSkeleton'

// Context
export { DitherProvider, useDitherContext, type DitherProviderProps } from './context/DitherContext'

// Hooks
export { useDither, type UseDitherOptions, type UseDitherResult } from './hooks/useDither'
export { useDitherAnimation, type AnimationOptions, type UseDitherAnimationResult, type EasingFunction } from './hooks/useDitherAnimation'
export { useResizeObserver, type Size } from './hooks/useResizeObserver'
export { useBayerTile, type BayerTileResult } from './hooks/useBayerTile'
export { useReducedMotion } from './hooks/useReducedMotion'

// Re-export core types for convenience
export type {
  DitherAlgorithm,
  OrderedAlgorithm,
  DitherConfig,
  PartialDitherConfig,
  ColorMode,
  DitherColors,
  MonoColors,
  DuotoneColors,
  DitherGradient,
  DitherGradientType,
  DitherGradientStop,
  DitherRenderer,
} from '@rdna/dithwather-core'
