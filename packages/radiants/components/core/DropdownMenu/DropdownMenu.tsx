'use client';

import React from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';

// ============================================================================
// Types
// ============================================================================

type DropdownPosition = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

// ============================================================================
// Internal context for position passthrough
// ============================================================================

const DropdownPositionContext = React.createContext<DropdownPosition>('bottom-start');

function positionToSideAlign(position: DropdownPosition): { side: 'top' | 'bottom'; align: 'start' | 'end' } {
  switch (position) {
    case 'bottom-start': return { side: 'bottom', align: 'start' };
    case 'bottom-end': return { side: 'bottom', align: 'end' };
    case 'top-start': return { side: 'top', align: 'start' };
    case 'top-end': return { side: 'top', align: 'end' };
  }
}

// ============================================================================
// Dropdown Menu Root
// ============================================================================

interface DropdownMenuProps {
  /** Controlled open state */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Position relative to trigger */
  position?: DropdownPosition;
  /** Children */
  children: React.ReactNode;
}

export function DropdownMenu({
  open,
  defaultOpen = false,
  onOpenChange,
  position = 'bottom-start',
  children,
}: DropdownMenuProps) {
  return (
    <DropdownPositionContext value={position}>
      <BaseMenu.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(openState) => onOpenChange?.(openState)}
        modal={false}
      >
        <div className="relative inline-block">
          {children}
        </div>
      </BaseMenu.Root>
    </DropdownPositionContext>
  );
}

// ============================================================================
// Dropdown Menu Trigger
// ============================================================================

interface DropdownMenuTriggerProps {
  /** Trigger element */
  children: React.ReactElement;
  /** Pass through as child instead of wrapping */
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children, asChild = false }: DropdownMenuTriggerProps) {
  if (asChild) {
    return (
      <BaseMenu.Trigger
        className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
        render={children}
      />
    );
  }

  return (
    <BaseMenu.Trigger
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
    >
      {children}
    </BaseMenu.Trigger>
  );
}

// ============================================================================
// Dropdown Menu Content
// ============================================================================

interface DropdownMenuContentProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function DropdownMenuContent({ className = '', children }: DropdownMenuContentProps) {
  const position = React.use(DropdownPositionContext);
  const { side, align } = positionToSideAlign(position);

  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={4}
      >
        <BaseMenu.Popup
          className={`
            z-50
            min-w-[8rem]
            bg-surface-primary
            border border-edge-primary
            rounded-sm
            shadow-raised
            py-1
            animate-fadeIn
            ${className}
          `.trim()}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

// ============================================================================
// Dropdown Menu Item
// ============================================================================

interface DropdownMenuItemProps {
  /** Item content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Destructive styling */
  destructive?: boolean;
  /** Additional className */
  className?: string;
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled = false,
  destructive = false,
  className = '',
}: DropdownMenuItemProps) {
  return (
    <BaseMenu.Item
      disabled={disabled}
      onClick={() => { if (!disabled) onClick?.(); }}
      className={`
        w-full px-4 py-2
        text-left
        font-sans text-base
        ${destructive ? 'text-status-error' : 'text-content-primary'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-hover-overlay cursor-pointer'}
        transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-0
        ${className}
      `.trim()}
    >
      {children}
    </BaseMenu.Item>
  );
}

// ============================================================================
// Dropdown Menu Separator
// ============================================================================

interface DropdownMenuSeparatorProps {
  /** Additional className */
  className?: string;
}

export function DropdownMenuSeparator({ className = '' }: DropdownMenuSeparatorProps) {
  return (
    <BaseMenu.Separator
      className={`h-px bg-edge-muted my-1 ${className}`.trim()}
    />
  );
}

// ============================================================================
// Dropdown Menu Label
// ============================================================================

interface DropdownMenuLabelProps {
  /** Label content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function DropdownMenuLabel({ children, className = '' }: DropdownMenuLabelProps) {
  return (
    <div
      className={`
        px-4 py-1
        font-heading text-xs uppercase tracking-tight leading-none
        text-content-muted
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}

export default DropdownMenu;
