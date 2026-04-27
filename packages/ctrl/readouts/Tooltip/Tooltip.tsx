'use client';

import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

// =============================================================================
// Tooltip — Ctrl tooltip, ported from @rdna/radiants Tooltip.
//
// Thin wrapper around @base-ui/react/tooltip that uses RDNA semantic tokens
// (`bg-inv`, `text-flip`, `pixel-rounded-2`, `font-heading`) and the standard
// RDNA transition behavior. Tuned for dense control-surface cells: small
// tracking-tight uppercase label, 8px side-offset.
// =============================================================================

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
type TooltipSize = 'sm' | 'md' | 'lg';

export interface TooltipProps {
  /** Tooltip content (usually a short label). */
  content: React.ReactNode;
  /** Trigger element. */
  children: React.ReactNode;
  /** Which side to place the popup on — defaults to 'bottom'. */
  side?: TooltipSide;
  /** Pixels of gap between trigger and popup. Defaults to 8. */
  sideOffset?: number;
  /** Delay before showing (ms). */
  delay?: number;
  /** Text-size preset. `sm`/`md` = text-xs (10px), `lg` = text-sm (12px). */
  size?: TooltipSize;
  /** Additional classes. */
  className?: string;
}

const sizeStyles: Record<TooltipSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

export interface TooltipProviderProps {
  delay?: number;
  closeDelay?: number;
  children: React.ReactNode;
}

/**
 * Must be rendered inside a <TooltipProvider> (mounted once high in the tree)
 * to share show/close delay state across tooltips.
 */
export function Tooltip({
  content,
  children,
  side = 'bottom',
  sideOffset = 8,
  delay = 0,
  size = 'md',
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
        <BaseTooltip.Positioner side={side} sideOffset={sideOffset}>
          <BaseTooltip.Popup
            data-rdna="ctrl-tooltip"
            role="tooltip"
            className={[
              'z-[1000] pointer-events-none',
              'pixel-rounded-2 bg-inv',
              'px-2 py-1',
              'text-flip',
              'font-heading uppercase tracking-tight leading-none',
              'whitespace-nowrap',
              sizeStyles[size],
              'transition-[opacity,transform] duration-[var(--duration-fast)] ease-out',
              'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
              'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
              className,
            ].filter(Boolean).join(' ')}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

export function TooltipProvider({ delay, closeDelay, children }: TooltipProviderProps) {
  return (
    <BaseTooltip.Provider delay={delay} closeDelay={closeDelay}>
      {children}
    </BaseTooltip.Provider>
  );
}
