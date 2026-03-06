import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { DitherBox, type DitherBoxProps, type DitherAnimateConfig } from './DitherBox'

// ============================================================================
// Types
// ============================================================================

export interface DitherButtonProps
  extends Omit<DitherBoxProps, 'children'>,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'style'> {
  /** Button content */
  children?: React.ReactNode
  /** Button-specific styles */
  buttonStyle?: React.CSSProperties
}

const DEFAULT_BUTTON_ANIMATE: DitherAnimateConfig = {
  idle: { threshold: 0.425 },
  hover: { threshold: 0.525 },
  active: { threshold: 0.475 },
  transition: 150,
}

// ============================================================================
// Component
// ============================================================================

/**
 * A button with dithering effects.
 *
 * Default animation transitions between idle/hover/active threshold values.
 * With the gradient API (`gradient`/`colors`/`angle` props): only `threshold`
 * and `algorithm` changes in the `animate` config are reflected.
 * With the legacy tile API: all DitherConfig properties (intensity, brightness,
 * contrast, etc.) are animatable.
 */
export const DitherButton = forwardRef<HTMLButtonElement, DitherButtonProps>(
  function DitherButton(
    {
      // New gradient API
      gradient,
      colors,
      angle,
      // Dither props
      algorithm,
      intensity,
      threshold,
      brightness,
      contrast,
      mode = 'background',
      animate,
      pixelScale,
      glitch,
      // Legacy tile path props
      colorMode,
      ditherColors,
      config,
      // Container props
      className,
      style,
      // Button props
      children,
      buttonStyle,
      ...buttonProps
    },
    ref
  ) {
    const defaultAnimate = animate ?? DEFAULT_BUTTON_ANIMATE

    return (
      <DitherBox
        gradient={gradient}
        colors={colors}
        angle={angle}
        algorithm={algorithm}
        intensity={intensity}
        threshold={threshold}
        brightness={brightness}
        contrast={contrast}
        mode={mode}
        animate={defaultAnimate}
        pixelScale={pixelScale}
        glitch={glitch}
        colorMode={colorMode}
        ditherColors={ditherColors}
        config={config}
        className={className}
        style={{
          display: 'inline-block',
          ...style,
        }}
      >
        <button
          ref={ref}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            color: 'inherit',
            padding: '0.5em 1em',
            ...buttonStyle,
          }}
          {...buttonProps}
        >
          {children}
        </button>
      </DitherBox>
    )
  }
)
