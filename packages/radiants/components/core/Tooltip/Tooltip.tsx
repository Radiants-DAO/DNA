'use client';

import React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

// ============================================================================
// Types
// ============================================================================

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
type TooltipSize = 'sm' | 'md' | 'lg';

interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Position relative to trigger */
  position?: TooltipPosition;
  /** Delay before showing (ms) - set to 0 for instant */
  delay?: number;
  /** Size preset (sm=8px, md=8px, lg=12px) */
  size?: TooltipSize;
  /** Trigger element */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Font size presets
 * sm=8px, md=8px, lg=12px
 */
const sizeStyles: Record<TooltipSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Tooltip component for hover information.
 * Internally powered by Base UI Tooltip for accessible hover/focus behavior.
 */
export function Tooltip({
  content,
  position = 'top',
  delay = 0,
  size = 'md',
  children,
  className = '',
}: TooltipProps) {
  return (
    <BaseTooltip.Provider>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger
          delay={delay}
          render={(props) => (
            <div
              {...props}
              className={`relative inline-flex ${className}`}
            >
              {children}
            </div>
          )}
        />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner side={position} sideOffset={8}>
            <BaseTooltip.Popup
              role="tooltip"
              className={`
                z-[1000]
                px-2 py-1
                bg-surface-secondary text-content-inverted
                font-heading uppercase
                rounded-sm
                whitespace-nowrap
                pointer-events-none
                ${sizeStyles[size]}
              `}
            >
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}

export default Tooltip;
