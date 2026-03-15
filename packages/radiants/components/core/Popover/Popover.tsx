'use client';

import React from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';

// ============================================================================
// Types
// ============================================================================

type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';

interface PopoverProps {
  /** Controlled open state */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Callback when open state changes — receives Base UI eventDetails as second arg */
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
  /** Callback fired after open/close animations complete */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Ref for imperative actions (close, unmount) */
  actionsRef?: React.RefObject<{ close: () => void; unmount: () => void } | null>;
  /** Position relative to trigger */
  position?: PopoverPosition;
  /** Children */
  children: React.ReactNode;
}

// ============================================================================
// Popover Root
// ============================================================================

export function Popover({
  open,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  actionsRef,
  position = 'bottom',
  children,
}: PopoverProps) {
  return (
    <PopoverPositionContext value={position}>
      <BasePopover.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(openState, eventDetails) => onOpenChange?.(openState, eventDetails)}
        onOpenChangeComplete={onOpenChangeComplete}
        actionsRef={actionsRef}
      >
        {children}
      </BasePopover.Root>
    </PopoverPositionContext>
  );
}

// ============================================================================
// Internal context for position passthrough
// ============================================================================

const PopoverPositionContext = React.createContext<PopoverPosition>('bottom');

// ============================================================================
// Popover Trigger
// ============================================================================

interface PopoverTriggerProps {
  /** Trigger element */
  children: React.ReactElement;
  /** Pass through as child instead of wrapping */
  asChild?: boolean;
}

export function PopoverTrigger({ children, asChild = false }: PopoverTriggerProps) {
  if (asChild) {
    return (
      <BasePopover.Trigger
        className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
        render={children}
      />
    );
  }

  return (
    <BasePopover.Trigger
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
    >
      {children}
    </BasePopover.Trigger>
  );
}

// ============================================================================
// Popover Content
// ============================================================================

interface PopoverContentProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
  /** Alignment relative to trigger */
  align?: 'start' | 'center' | 'end';
}

export function PopoverContent({ className = '', children, align = 'center' }: PopoverContentProps) {
  const position = React.use(PopoverPositionContext);

  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        side={position}
        align={align}
        sideOffset={8}
      >
        <BasePopover.Popup
          data-rdna="popover"
          className={`
            z-50
            bg-surface-primary
            border border-edge-primary
            rounded-sm
            shadow-raised
            p-4
            transition-[opacity,transform,filter] duration-150 ease-out
            data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1
            data-[ending-style]:opacity-0 data-[ending-style]:blur-sm
            ${className}
          `.trim()}
          data-variant="popover"
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export default Popover;
