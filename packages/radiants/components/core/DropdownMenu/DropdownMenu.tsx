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
        <div data-rdna="dropdownmenu" className="relative inline-block">
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
        className="cursor-pointer focus-visible:outline-none"
        render={children}
      />
    );
  }

  return (
    <BaseMenu.Trigger
      className="cursor-pointer focus-visible:outline-none"
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
            transition-[opacity,transform,filter] duration-150 ease-out
            data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1
            data-[ending-style]:opacity-0 data-[ending-style]:blur-sm
          `.trim()}
        >
          <div className={`pixel-rounded-sm bg-page pixel-shadow-raised ${className}`.trim()}>
            <div className="py-1">
            {children}
            </div>
          </div>
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
        ${destructive ? 'text-danger' : 'text-main'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : `hover:bg-inv ${destructive ? '' : 'hover:text-flip'} cursor-pointer`}
        focus-visible:outline-none
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
      className={`border-t border-rule ${className}`.trim()}
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
        text-mute
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Group + GroupLabel
// ============================================================================

export function DropdownMenuGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <BaseMenu.Group className={className}>{children}</BaseMenu.Group>;
}

export function DropdownMenuGroupLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <BaseMenu.GroupLabel className={`px-4 py-1 font-heading text-xs uppercase tracking-tight text-mute ${className}`.trim()}>
      {children}
    </BaseMenu.GroupLabel>
  );
}

// ============================================================================
// Checkbox Item
// ============================================================================

export function DropdownMenuCheckboxItem({
  checked,
  onCheckedChange,
  disabled = false,
  children,
  className = '',
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseMenu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 px-4 py-2
        font-sans text-base text-left text-main
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-inv hover:text-flip cursor-pointer'}
        focus-visible:outline-none
        ${className}
      `.trim()}
    >
      <BaseMenu.CheckboxItemIndicator className="w-4 h-4 flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M1,5H3V6H4V7H6V6H7V5H8V3H6V5H4V3H2V5Z"/></svg>
      </BaseMenu.CheckboxItemIndicator>
      {children}
    </BaseMenu.CheckboxItem>
  );
}

// ============================================================================
// Radio Group + Radio Item
// ============================================================================

export function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
  className = '',
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseMenu.RadioGroup value={value} onValueChange={onValueChange} className={className}>
      {children}
    </BaseMenu.RadioGroup>
  );
}

export function DropdownMenuRadioItem({
  value,
  disabled = false,
  children,
  className = '',
}: {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseMenu.RadioItem
      value={value}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 px-4 py-2
        font-sans text-base text-left text-main
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-inv hover:text-flip cursor-pointer'}
        focus-visible:outline-none
        ${className}
      `.trim()}
    >
      <BaseMenu.RadioItemIndicator className="w-4 h-4 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-current" />
      </BaseMenu.RadioItemIndicator>
      {children}
    </BaseMenu.RadioItem>
  );
}

export default DropdownMenu;
