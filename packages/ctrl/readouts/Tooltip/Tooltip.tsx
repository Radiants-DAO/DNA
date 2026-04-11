'use client';

import { type ReactNode } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

// =============================================================================
// Tooltip — Ctrl tooltip wrapping @base-ui/react/tooltip
//
// Small dark cell with cream label text, pixel-art drop shadow, 4px padding,
// 12px text — matches Dropdown popup chrome. Pairs with IconRadioGroup items,
// NumberInput unit dropdowns, and any icon-only trigger.
// =============================================================================

export interface TooltipProps {
  /** Tooltip content (usually a short label) */
  content: ReactNode;
  /** Trigger element */
  children: ReactNode;
  /** Which side to place the popup on — defaults to 'bottom' */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Pixels of gap between trigger and popup */
  sideOffset?: number;
  /** Delay before showing in ms */
  delay?: number;
}

const POPUP: React.CSSProperties = {
  backgroundColor: 'oklch(0 0 0)',
  paddingInline: 4,
  paddingBlock: 2,
  boxShadow:
    '0 2px 4px 0 oklch(0 0 0 / 1), 0 4px 12px 0 oklch(0 0 0 / 1), 0 0 0 1px oklch(0.9780 0.0295 94.34 / 0.0625)',
  fontSynthesis: 'none',
  WebkitFontSmoothing: 'antialiased',
  color: 'var(--color-cream)',
  fontSize: 8,
  lineHeight: '10px',
  textTransform: 'uppercase',
};

/**
 * Ctrl Tooltip — must be rendered inside a <TooltipProvider> (rendered once at
 * a high point in the tree, e.g. app root or page root).
 */
export function Tooltip({ content, children, side = 'bottom', sideOffset = 4, delay = 200 }: TooltipProps) {
  return (
    <BaseTooltip.Root delay={delay}>
      <BaseTooltip.Trigger render={children as React.ReactElement} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={sideOffset} className="z-50">
          <BaseTooltip.Popup className="font-mono" style={POPUP}>
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

export const TooltipProvider = BaseTooltip.Provider;
