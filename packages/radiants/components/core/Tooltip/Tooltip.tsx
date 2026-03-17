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
  /** Delay before showing (ms) */
  delay?: number;
  /** Size preset (sm=8px, md=8px, lg=12px) */
  size?: TooltipSize;
  /** Trigger element */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

interface TooltipProviderProps {
  delay?: number;
  closeDelay?: number;
  children: React.ReactNode;
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles: Record<TooltipSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

// ============================================================================
// Provider
// ============================================================================

function Provider({ delay, closeDelay, children }: TooltipProviderProps) {
  return (
    <BaseTooltip.Provider delay={delay} closeDelay={closeDelay}>
      {children}
    </BaseTooltip.Provider>
  );
}

// ============================================================================
// Tooltip
// ============================================================================

function TooltipRoot({
  content,
  position = 'top',
  delay = 0,
  size = 'md',
  children,
  className = '',
}: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger
        delay={delay}
        render={
          React.isValidElement(children)
            ? (children as React.ReactElement)
            : <span>{children}</span>
        }
      />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={position} sideOffset={8}>
          <BaseTooltip.Popup
            data-rdna="tooltip"
            role="tooltip"
            className={`
              z-[1000]
              px-2 py-1
              bg-inv text-flip
              font-heading uppercase tracking-tight leading-none
              rounded-xs
              whitespace-nowrap
              pointer-events-none
              transition-[opacity,transform] duration-100 ease-out
              data-[starting-style]:opacity-0 data-[starting-style]:scale-95
              data-[ending-style]:opacity-0 data-[ending-style]:scale-95
              ${sizeStyles[size]}
              ${className}
            `}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

// ============================================================================
// Public API
// ============================================================================

export const Tooltip = Object.assign(TooltipRoot, { Provider });

export default Tooltip;
