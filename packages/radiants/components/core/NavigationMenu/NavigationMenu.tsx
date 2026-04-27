'use client';

import React from 'react';
import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu';
import { Icon as BitmapIcon } from '../../../icons/Icon';


// ============================================================================
// Types
// ============================================================================

type BaseNavigationMenuRootProps = React.ComponentProps<typeof BaseNavigationMenu.Root>;

interface NavigationMenuRootProps {
  /** Children — should be NavigationMenu.List and NavigationMenu.Viewport */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Orientation of the navigation menu */
  orientation?: 'horizontal' | 'vertical';
  /** Controlled active value */
  value?: BaseNavigationMenuRootProps['value'];
  /** Default active value */
  defaultValue?: BaseNavigationMenuRootProps['defaultValue'];
  /** Callback when active value changes */
  onValueChange?: BaseNavigationMenuRootProps['onValueChange'];
}

interface NavigationMenuListProps {
  /** Children — should be NavigationMenu.Item components */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface NavigationMenuItemProps {
  /** Children — NavigationMenu.Trigger + NavigationMenu.Content, or NavigationMenu.Link */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface NavigationMenuTriggerProps {
  /** Trigger label */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface NavigationMenuContentProps {
  /** Content to display in the flyout */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface NavigationMenuLinkProps {
  /** Link content */
  children: React.ReactNode;
  /** Link href */
  href?: string;
  /** Whether this link is the active page */
  active?: boolean;
  /** Additional className */
  className?: string;
}

interface NavigationMenuViewportProps {
  /** Additional className */
  className?: string;
}

// ============================================================================
// Default Chevron — delegates to RDNA bitmap Icon (16px only)
// ============================================================================

function DefaultChevron({ className = '' }: { className?: string }) {
  return <BitmapIcon name="chevron-down" size={16} className={className} />;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Navigation menu root — groups all parts of the navigation menu.
 * Renders a <nav> element.
 */
function Root({ children, className = '', orientation = 'horizontal', value, defaultValue, onValueChange }: NavigationMenuRootProps) {
  return (
    <BaseNavigationMenu.Root
      data-rdna="navigationmenu"
      orientation={orientation}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className={`
        relative
        ${className}
      `.trim()}
    >
      {children}
    </BaseNavigationMenu.Root>
  );
}

/**
 * Navigation menu list — contains navigation menu items.
 */
function List({ children, className = '' }: NavigationMenuListProps) {
  return (
    <BaseNavigationMenu.List
      className={`
        flex items-center gap-1
        ${className}
      `.trim()}
    >
      {children}
    </BaseNavigationMenu.List>
  );
}

/**
 * Navigation menu item — wraps a trigger+content pair or a standalone link.
 */
function Item({ children, className = '' }: NavigationMenuItemProps) {
  return (
    <BaseNavigationMenu.Item className={className}>
      {children}
    </BaseNavigationMenu.Item>
  );
}

/**
 * Navigation menu trigger — opens the associated content flyout.
 */
function Trigger({ children, className = '' }: NavigationMenuTriggerProps) {
  return (
    <BaseNavigationMenu.Trigger
      data-slot="button-face"
      data-quiet
      data-color="accent"
      className={`
        pixel-rounded-4
        flex items-center gap-1
        px-3 py-2
        font-sans text-sm
        cursor-pointer
        focus-visible:outline-none
        ${className}
      `.trim()}
    >
      {children}
      <BaseNavigationMenu.Icon
        className="transition-transform duration-[var(--duration-base)] ease-out data-[popup-open]:rotate-180"
      >
        <DefaultChevron />
      </BaseNavigationMenu.Icon>
    </BaseNavigationMenu.Trigger>
  );
}

/**
 * Navigation menu content — the flyout panel that appears when a trigger is activated.
 */
function Content({ children, className = '' }: NavigationMenuContentProps) {
  return (
    <BaseNavigationMenu.Content
      className={`
        p-0
        data-[starting-style]:opacity-0
        data-[ending-style]:opacity-0
        ${className}
      `.trim()}
    >
      {children}
    </BaseNavigationMenu.Content>
  );
}

/**
 * Navigation menu link — a navigation link within the menu.
 */
function Link({ children, href, active = false, className = '' }: NavigationMenuLinkProps) {
  return (
    <BaseNavigationMenu.Link
      href={href}
      active={active}
      data-slot="button-face"
      data-quiet
      data-color="accent"
      data-state={active ? 'selected' : 'default'}
      className={`
        pixel-rounded-4 inline-block
        block
        px-3 py-2
        font-sans text-sm
        focus-visible:outline-none
        ${className}
      `.trim()}
    >
      {children}
    </BaseNavigationMenu.Link>
  );
}

/**
 * Navigation menu viewport — renders the positioned content area.
 * Place this after the NavigationMenu.List within NavigationMenu.Root.
 */
function Viewport({ className = '' }: NavigationMenuViewportProps) {
  return (
    <BaseNavigationMenu.Portal>
      <BaseNavigationMenu.Positioner sideOffset={8}>
        <BaseNavigationMenu.Popup
          className={`
            pixel-rounded-4 bg-card pixel-shadow-raised
            transition-[opacity,transform] duration-[var(--duration-moderate)] ease-out
            data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1
            data-[ending-style]:opacity-0 data-[ending-style]:translate-y-1
            ${className}
          `.trim()}
        >
          <BaseNavigationMenu.Viewport />
        </BaseNavigationMenu.Popup>
      </BaseNavigationMenu.Positioner>
    </BaseNavigationMenu.Portal>
  );
}

// ============================================================================
// Export as namespace
// ============================================================================

export const NavigationMenu = { Root, List, Item, Trigger, Content, Link, Viewport };
