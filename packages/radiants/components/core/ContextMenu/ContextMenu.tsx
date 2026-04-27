'use client';

import React from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { Icon as BitmapIcon } from '../../../icons/Icon';


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
          className={`z-[1000] min-w-[160px] pixel-rounded-6 bg-page pixel-shadow-raised text-main ${className}`.trim()}
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
        focus-visible:outline-none
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
      className={`border-t border-rule ${className}`.trim()}
    />
  );
}

export function ContextMenuGroup({ children, className = '' }: ContextMenuGroupProps) {
  return (
    <BaseContextMenu.Group className={className}>
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
        focus-visible:outline-none
        ${className}
      `.trim()}
    >
      <BaseContextMenu.CheckboxItemIndicator className="w-4 h-4 flex items-center justify-center">
        <BitmapIcon name="checkmark" size={16} />
      </BaseContextMenu.CheckboxItemIndicator>
      {children}
    </BaseContextMenu.CheckboxItem>
  );
}
