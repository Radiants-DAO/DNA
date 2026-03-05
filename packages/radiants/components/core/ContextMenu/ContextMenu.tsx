'use client';

import React from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { Menu as BaseMenu } from '@base-ui/react/menu';

// ============================================================================
// Types
// ============================================================================

interface ContextMenuProps {
  /** Content that triggers context menu on right-click */
  children: React.ReactNode;
  /** Additional classes for trigger container */
  className?: string;
}

interface ContextMenuContentProps {
  /** Menu items */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

interface ContextMenuItemProps {
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Destructive action (red text) */
  destructive?: boolean;
  /** Icon element to display before the label */
  icon?: React.ReactNode;
  /** Menu item content */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

interface ContextMenuSeparatorProps {
  className?: string;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Context menu container - wraps content that should have right-click menu
 */
export function ContextMenu({ children, className = '' }: ContextMenuProps) {
  return (
    <BaseContextMenu.Root>
      <BaseContextMenu.Trigger className={className}>
        {children}
      </BaseContextMenu.Trigger>
    </BaseContextMenu.Root>
  );
}

/**
 * Context menu dropdown content
 */
export function ContextMenuContent({ children, className = '' }: ContextMenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner sideOffset={4}>
        <BaseMenu.Popup
          className={`
            z-[1000]
            min-w-[160px]
            bg-surface-primary
            border border-edge-primary
            rounded-sm
            shadow-raised
            py-1
            ${className}
          `.trim()}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

/**
 * Context menu item
 */
export function ContextMenuItem({
  onClick,
  disabled = false,
  destructive = false,
  icon,
  children,
  className = '',
}: ContextMenuItemProps) {
  return (
    <BaseMenu.Item
      disabled={disabled}
      onClick={() => { if (!disabled) onClick?.(); }}
      className={`
        w-full flex items-center gap-2
        px-3 py-1.5
        font-sans text-base text-left
        ${destructive ? 'text-status-error' : 'text-content-primary'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-action-primary cursor-pointer'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-0
        ${className}
      `.trim()}
    >
      {icon && (
        <span className="w-4 h-4 flex items-center justify-center">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </BaseMenu.Item>
  );
}

/**
 * Context menu separator line
 */
export function ContextMenuSeparator({ className = '' }: ContextMenuSeparatorProps) {
  return (
    <BaseMenu.Separator
      className={`my-1 border-t border-edge-muted ${className}`.trim()}
    />
  );
}

export default ContextMenu;
