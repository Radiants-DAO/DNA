'use client';

import { useState, useEffect, useRef } from 'react';
import { Dithering } from '@paper-design/shaders-react';

// =============================================================================
// Types
// =============================================================================

type DitheringShape = 'sphere' | 'wave' | 'dots' | 'ripple' | 'swirl' | 'warp';
type DitheringType = '2x2' | '4x4' | '8x8' | 'random';

interface ShaderSettings {
  colorBack: string;
  colorFront: string;
  shape: DitheringShape;
  type: DitheringType;
  size: number;
  speed: number;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export interface ShaderBackgroundProps {
  /** Initial settings override */
  initialSettings?: Partial<ShaderSettings>;
  /** Final settings override (for animation end state) */
  finalSettings?: Partial<ShaderSettings>;
  /** Mobile-specific settings override */
  mobileSettings?: Partial<ShaderSettings>;
  /** Animation delay in ms (default: 500) */
  animationDelay?: number;
  /** Animation duration in ms (default: 15000) */
  animationDuration?: number;
  /** Mobile breakpoint in px (default: 768) */
  mobileBreakpoint?: number;
  /** Mobile opacity (default: 0.26) */
  mobileOpacity?: number;
  /** Additional CSS class for container */
  className?: string;
  /** Whether animation is enabled (default: true) */
  animated?: boolean;
}

// =============================================================================
// Theme Token Colors (from tokens.css)
// =============================================================================

const THEME_COLORS = {
  ultraviolet: 'var(--color-ultraviolet, #6939ca)',
  magma: 'var(--color-magma, #ef5c6f)',
  amber: 'var(--color-amber, #fd8f3a)',
  green: 'var(--color-green, #14f1b2)',
  black: 'var(--color-black, #010101)',
} as const;

// Fallback hex values for WebGL shader (can't use CSS variables)
const HEX_COLORS = {
  ultraviolet: '#6939ca',
  magma: '#ef5c6f',
  amber: '#fd8f3a',
  green: '#14f1b2',
  black: '#010101',
} as const;

// =============================================================================
// Default Settings
// =============================================================================

const DEFAULT_INITIAL_SETTINGS: ShaderSettings = {
  colorBack: HEX_COLORS.black,
  colorFront: HEX_COLORS.ultraviolet,
  shape: 'swirl',
  type: '8x8',
  size: 1.8,
  speed: 0.58,
  scale: 0.1,
  rotation: 360,
  offsetX: 0,
  offsetY: 0,
};

const DEFAULT_FINAL_SETTINGS: ShaderSettings = {
  ...DEFAULT_INITIAL_SETTINGS,
  scale: 3.48,
};

const DEFAULT_MOBILE_SETTINGS: ShaderSettings = {
  colorBack: HEX_COLORS.black,
  colorFront: HEX_COLORS.ultraviolet,
  shape: 'warp',
  type: '8x8',
  size: 1.4,
  speed: 0.58,
  scale: 3.48,
  rotation: 360,
  offsetX: 0,
  offsetY: 0,
};

// =============================================================================
// Animation Helpers
// =============================================================================

/**
 * Eases out at the end of animation (last 20%)
 */
const easeOutEnd = (t: number): number => {
  const easeStart = 0.8;
  if (t < easeStart) return t;
  const easeProgress = (t - easeStart) / (1 - easeStart);
  const easedPortion = 1 - Math.pow(1 - easeProgress, 3);
  return easeStart + easedPortion * (1 - easeStart);
};

// =============================================================================
// Component
// =============================================================================

export function ShaderBackground({
  initialSettings,
  finalSettings,
  mobileSettings,
  animationDelay = 500,
  animationDuration = 15000,
  mobileBreakpoint = 768,
  mobileOpacity = 0.26,
  className = '',
  animated = true,
}: ShaderBackgroundProps) {
  // Merge settings with defaults
  const mergedInitial = { ...DEFAULT_INITIAL_SETTINGS, ...initialSettings };
  const mergedFinal = { ...DEFAULT_FINAL_SETTINGS, ...finalSettings };
  const mergedMobile = { ...DEFAULT_MOBILE_SETTINGS, ...mobileSettings };

  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState<ShaderSettings>(mergedInitial);
  const [opacity, setOpacity] = useState(0);
  const animationRef = useRef<number | null>(null);

  // Calculate scale delta for animation
  const scaleDelta = mergedFinal.scale - mergedInitial.scale;

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => window.innerWidth <= mobileBreakpoint;
    const mobile = checkMobile();
    setIsMobile(mobile);

    if (mobile) {
      // Mobile: static settings, no animation
      setSettings(mergedMobile);
      setOpacity(mobileOpacity);
    }
  }, [mobileBreakpoint, mobileOpacity]);

  // Desktop animation
  useEffect(() => {
    if (isMobile || !animated) return;

    const timeoutId = setTimeout(() => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const linearProgress = Math.min(elapsed / animationDuration, 1);
        const easedProgress = easeOutEnd(linearProgress);

        const newScale = mergedInitial.scale + scaleDelta * easedProgress;
        const newOpacity = easedProgress;

        setSettings(prev => ({ ...prev, scale: newScale }));
        setOpacity(newOpacity);

        if (linearProgress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, animationDelay);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMobile, animated, animationDelay, animationDuration, scaleDelta]);

  return (
    <div
      className={`shader-background ${className}`.trim()}
      style={{ opacity }}
    >
      <Dithering
        colorBack={settings.colorBack}
        colorFront={settings.colorFront}
        shape={settings.shape}
        type={settings.type}
        size={settings.size}
        speed={settings.speed}
        scale={settings.scale}
        rotation={settings.rotation}
        offsetX={settings.offsetX}
        offsetY={settings.offsetY}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default ShaderBackground;
