'use client';

import React from 'react';
import { PreviewCard as BasePreviewCard } from '@base-ui/react/preview-card';

// ============================================================================
// Types
// ============================================================================

interface PreviewCardProps {
  /** Controlled open state */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Callback when open state changes — receives Base UI eventDetails as second arg */
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
  /** Callback fired after open/close animations complete */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Children */
  children: React.ReactNode;
}

// ============================================================================
// PreviewCard Root
// ============================================================================

/**
 * Hover preview card that shows a popup on hover
 */
export function PreviewCard({
  open,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  children,
}: PreviewCardProps) {
  return (
    <BasePreviewCard.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(openState, eventDetails) => onOpenChange?.(openState, eventDetails)}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      {children}
    </BasePreviewCard.Root>
  );
}

// ============================================================================
// PreviewCard Trigger
// ============================================================================

interface PreviewCardTriggerProps {
  /** Trigger element */
  children: React.ReactElement;
  /** Additional classes */
  className?: string;
}

export function PreviewCardTrigger({ children, className = '' }: PreviewCardTriggerProps) {
  return (
    <BasePreviewCard.Trigger
      className={`cursor-pointer focus-visible:outline-none ${className}`.trim()}
      render={children}
    />
  );
}

// ============================================================================
// PreviewCard Content
// ============================================================================

interface PreviewCardContentProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
  /** Alignment relative to trigger */
  align?: 'start' | 'center' | 'end';
  /** Side relative to trigger */
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function PreviewCardContent({
  className = '',
  children,
  align = 'center',
  side = 'bottom',
}: PreviewCardContentProps) {
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner
        side={side}
        align={align}
        sideOffset={8}
      >
        <BasePreviewCard.Popup
          data-rdna="previewcard"
          className={`
            z-50
            bg-card
            rounded-xs
            pixel-shadow-raised
            p-4
            transition-[opacity,transform,filter] duration-150 ease-out
            data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1
            data-[ending-style]:opacity-0 data-[ending-style]:blur-sm
            ${className}
          `.trim()}
          data-variant="preview-card"
        >
          {children}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}

export default PreviewCard;
