'use client';

import React from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';

// ============================================================================
// Types
// ============================================================================

interface ContextMenuProps {
  children: React.ReactNode;
  className?: string;
}

interface ContextMenuContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ContextMenuItemProps {
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

interface ContextMenuSeparatorProps {
  className?: string;
}

interface ContextMenuGroupProps {
  children: React.ReactNode;
  className?: string;
}

interface ContextMenuGroupLabelProps {
  children: React.ReactNode;
  className?: string;
}

interface ContextMenuCheckboxItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Components — all use BaseContextMenu.* to share a single Root context
// ============================================================================

export function ContextMenu({ children, className = '' }: ContextMenuProps) {
  return (
    <BaseContextMenu.Root data-rdna="contextmenu">
      <BaseContextMenu.Trigger className={className}>
        {children}
      </BaseContextMenu.Trigger>
    </BaseContextMenu.Root>
  );
}

export function ContextMenuContent({ children, className = '' }: ContextMenuContentProps) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner sideOffset={4}>
        <BaseContextMenu.Popup
          className={`
            z-[1000]
            min-w-[160px]
            bg-page
            border border-line
            rounded-sm
            shadow-raised
            py-0
            ${className}
          `.trim()}
        >
          {children}
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}

export function ContextMenuItem({
  onClick,
  disabled = false,
  destructive = false,
  icon,
  children,
  className = '',
}: ContextMenuItemProps) {
  return (
    <BaseContextMenu.Item
      disabled={disabled}
      onClick={onClick}
      className={`
        w-full flex items-center gap-2
        px-3 py-1.5
        font-sans text-base text-left
        ${destructive ? 'text-danger' : 'text-main'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : `hover:bg-inv ${destructive ? '' : 'hover:text-flip'} cursor-pointer`}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0
        ${className}
      `.trim()}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
      <span>{children}</span>
    </BaseContextMenu.Item>
  );
}

export function ContextMenuSeparator({ className = '' }: ContextMenuSeparatorProps) {
  return (
    <BaseContextMenu.Separator
      className={`my-1 border-t border-rule ${className}`.trim()}
    />
  );
}

export function ContextMenuGroup({ children, className = '' }: ContextMenuGroupProps) {
  return (
    <BaseContextMenu.Group className={className || undefined}>
      {children}
    </BaseContextMenu.Group>
  );
}

export function ContextMenuGroupLabel({ children, className = '' }: ContextMenuGroupLabelProps) {
  return (
    <BaseContextMenu.GroupLabel
      className={`px-3 py-1 font-heading text-xs uppercase tracking-tight text-mute ${className}`.trim()}
    >
      {children}
    </BaseContextMenu.GroupLabel>
  );
}

export function ContextMenuCheckboxItem({
  checked,
  onCheckedChange,
  disabled = false,
  children,
  className = '',
}: ContextMenuCheckboxItemProps) {
  return (
    <BaseContextMenu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 px-3 py-1.5
        font-sans text-base text-left text-main
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-inv hover:text-flip cursor-pointer'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0
        ${className}
      `.trim()}
    >
      <BaseContextMenu.CheckboxItemIndicator className="w-4 h-4 flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M1,5H3V6H4V7H6V6H7V5H8V3H6V5H4V3H2V5Z"/></svg>
      </BaseContextMenu.CheckboxItemIndicator>
      {children}
    </BaseContextMenu.CheckboxItem>
  );
}

export default ContextMenu;
