'use client';

import React from 'react';
import { Menubar as BaseMenubar } from '@base-ui/react/menubar';
import { Menu as BaseMenu } from '@base-ui/react/menu';

// ============================================================================
// Types
// ============================================================================

interface MenubarRootProps {
  /** Children — should be Menubar.Menu components */
  children: React.ReactNode;
  /** Additional className for the menubar container */
  className?: string;
  /** Whether the menubar is modal */
  modal?: boolean;
  /** Orientation of the menubar */
  orientation?: 'horizontal' | 'vertical';
}

interface MenubarMenuProps {
  /** Children — should be Menubar.Trigger and Menubar.Content */
  children: React.ReactNode;
}

interface MenubarTriggerProps {
  /** Trigger label */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface MenubarContentProps {
  /** Menu items */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface MenubarItemProps {
  /** Item content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Destructive styling */
  destructive?: boolean;
  /** Keyboard shortcut hint (e.g. "Ctrl+S") */
  shortcut?: string;
  /** Additional className */
  className?: string;
}

interface MenubarSeparatorProps {
  /** Additional className */
  className?: string;
}

interface MenubarLabelProps {
  /** Label content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Menubar root — horizontal menu bar container (File, Edit, View pattern).
 * Wraps Base UI Menubar which manages focus between multiple Menu.Root instances.
 */
function Root({ children, className = '', modal = false, orientation = 'horizontal' }: MenubarRootProps) {
  return (
    <BaseMenubar
      data-rdna="menubar"
      modal={modal}
      orientation={orientation}
      className={`
        flex items-center
        bg-inv
        pixel-rounded-xs
        ${className}
      `.trim()}
    >
      {children}
    </BaseMenubar>
  );
}

/**
 * Menubar menu — wraps a single menu (e.g. "File" or "Edit") within the menubar.
 * Each menu gets its own trigger and content.
 */
function Menu({ children }: MenubarMenuProps) {
  return (
    <BaseMenu.Root modal={false}>
      {children}
    </BaseMenu.Root>
  );
}

/**
 * Menubar trigger — the button that opens a menu in the menubar.
 */
function Trigger({ children, className = '' }: MenubarTriggerProps) {
  return (
    <BaseMenu.Trigger
      className={`
        px-3 py-1
        font-sans text-sm
        text-flip
        hover:bg-tinted
        cursor-pointer
        transition-colors duration-150 ease-out
        focus-visible:outline-none
        ${className}
      `.trim()}
    >
      {children}
    </BaseMenu.Trigger>
  );
}

/**
 * Menubar content — the dropdown popup for a menu.
 */
function Content({ children, className = '' }: MenubarContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner side="bottom" align="start" sideOffset={4}>
        <BaseMenu.Popup
          className={`
            z-50
            min-w-[10rem]
            bg-card
            pixel-rounded-xs
            pixel-shadow-raised
            py-1
            transition-[opacity,transform,filter] duration-150 ease-out
            data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1
            data-[ending-style]:opacity-0 data-[ending-style]:blur-sm
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
 * Menubar item — an individual action within a menu.
 */
function Item({
  children,
  onClick,
  disabled = false,
  destructive = false,
  shortcut,
  className = '',
}: MenubarItemProps) {
  return (
    <BaseMenu.Item
      disabled={disabled}
      onClick={() => { if (!disabled) onClick?.(); }}
      className={`
        w-full flex items-center justify-between gap-4
        px-3 py-1.5
        font-sans text-sm text-left
        ${destructive ? 'text-danger' : 'text-main'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-hover cursor-pointer'}
        transition-colors
        focus-visible:outline-none
        ${className}
      `.trim()}
    >
      <span>{children}</span>
      {shortcut && (
        <span className="text-xs text-mute ml-auto pl-4">{shortcut}</span>
      )}
    </BaseMenu.Item>
  );
}

/**
 * Menubar separator — visual divider between menu items.
 */
function Separator({ className = '' }: MenubarSeparatorProps) {
  return (
    <BaseMenu.Separator
      className={`h-px bg-rule my-1 ${className}`.trim()}
    />
  );
}

/**
 * Menubar label — non-interactive group label within a menu.
 */
function Label({ children, className = '' }: MenubarLabelProps) {
  return (
    <div
      className={`
        px-3 py-1
        font-heading text-xs uppercase tracking-tight leading-none
        text-mute
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Export as namespace
// ============================================================================

export const Menubar = { Root, Menu, Trigger, Content, Item, Separator, Label };

export default Menubar;
