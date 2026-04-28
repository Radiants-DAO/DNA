'use client';

import React from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { Icon as BitmapIcon } from '../../../icons/Icon';
import type { ComboboxProps } from './Combobox.meta';


// ============================================================================
// Types (root contract re-exported from ./Combobox.meta)
// ============================================================================

export type { ComboboxProps };

type BaseComboboxRootProps = React.ComponentProps<typeof BaseCombobox.Root>;
type ComboboxItemValue = React.ComponentProps<typeof BaseCombobox.Item>['value'];

interface ComboboxRootProps {
  /** Children — should include Combobox.Input, Combobox.Portal, etc. */
  children: React.ReactNode;
  /** The controlled selected value */
  value?: BaseComboboxRootProps['value'];
  /** Default selected value */
  defaultValue?: BaseComboboxRootProps['defaultValue'];
  /** Callback when value changes */
  onValueChange?: BaseComboboxRootProps['onValueChange'];
  /** Callback when the popup opens or closes — receives Base UI eventDetails as second arg */
  onOpenChange?: BaseComboboxRootProps['onOpenChange'];
  /** Callback when input value changes */
  onInputValueChange?: BaseComboboxRootProps['onInputValueChange'];
  /** Whether to auto-highlight the first matching item */
  autoHighlight?: boolean;
  /** Whether the combobox should ignore user interaction */
  disabled?: boolean;
}

interface ComboboxInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

interface ComboboxPortalProps {
  /** Children — Combobox.Popup */
  children: React.ReactNode;
}

interface ComboboxPopupProps {
  /** Children — Combobox.Item components */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface ComboboxItemProps {
  /** The value for this item */
  value: ComboboxItemValue;
  /** Item content */
  children: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

interface ComboboxEmptyProps {
  /** Content to display when no items match */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface ComboboxGroupProps {
  /** Group items */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface ComboboxGroupLabelProps {
  /** Group label content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Combobox root — searchable select / autocomplete input.
 * Wraps Base UI Combobox.Root.
 */
function Root({
  children,
  value,
  defaultValue,
  onValueChange,
  onOpenChange,
  onInputValueChange,
  autoHighlight = true,
  disabled = false,
}: ComboboxRootProps) {
  return (
    <BaseCombobox.Root
      data-rdna="combobox"
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      onOpenChange={onOpenChange}
      onInputValueChange={onInputValueChange}
      autoHighlight={autoHighlight}
      disabled={disabled}
      openOnInputClick
    >
      {children}
    </BaseCombobox.Root>
  );
}

/**
 * Combobox input — text input for searching items.
 */
function Input({ placeholder = 'Search...', disabled = false, className = '' }: ComboboxInputProps) {
  return (
    <div className="relative group/pixel">
      <BaseCombobox.Input
        placeholder={placeholder}
        disabled={disabled}
        className={`
          pixel-rounded-4 w-full
          bg-page group-focus-within/pixel:bg-card
          w-full h-8
          px-3 py-1.5
          font-sans text-sm
          text-main
          placeholder:text-mute
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none
          ${className}
        `.trim()}
      />
      <BaseCombobox.Trigger
        className="absolute inset-y-0 right-0 z-desktop flex cursor-pointer items-center pr-2"
      >
        <BaseCombobox.Icon className="text-mute">
          <BitmapIcon name="chevron-down" size={16} />
        </BaseCombobox.Icon>
      </BaseCombobox.Trigger>
    </div>
  );
}

/**
 * Combobox portal — renders the popup in a portal.
 */
function Portal({ children }: ComboboxPortalProps) {
  return (
    <BaseCombobox.Portal>
      {children}
    </BaseCombobox.Portal>
  );
}

/**
 * Combobox popup — the dropdown that contains items.
 */
function Popup({ children, className = '' }: ComboboxPopupProps) {
  return (
    <BaseCombobox.Positioner sideOffset={4}>
      <BaseCombobox.Popup
        className={`
          z-50
          w-[var(--anchor-width)]
          pixel-rounded-4 bg-card pixel-shadow-raised
          transition-[opacity,transform] duration-[var(--duration-base)] ease-out
          data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1
          data-[ending-style]:opacity-0
          ${className}
        `.trim()}
      >
        <BaseCombobox.List className="max-h-48 overflow-y-auto py-1">
          {children}
        </BaseCombobox.List>
      </BaseCombobox.Popup>
    </BaseCombobox.Positioner>
  );
}

/**
 * Combobox item — an individual option in the dropdown.
 */
function Item({ value, children, disabled = false, className = '' }: ComboboxItemProps) {
  return (
    <BaseCombobox.Item
      value={value}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2
        px-3 py-2
        font-sans text-sm text-left
        text-main
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent hover:text-accent-inv cursor-pointer'}
        focus-visible:outline-none
        data-[highlighted]:bg-accent data-[highlighted]:text-accent-inv
        data-[selected]:bg-accent data-[selected]:text-accent-inv
        ${className}
      `.trim()}
    >
      <BaseCombobox.ItemIndicator className="shrink-0">
        <BitmapIcon name="checkmark" size={16} />
      </BaseCombobox.ItemIndicator>
      {children}
    </BaseCombobox.Item>
  );
}

/**
 * Combobox empty state — displayed when no items match the search.
 */
function Empty({ children, className = '' }: ComboboxEmptyProps) {
  return (
    <BaseCombobox.Empty
      className={`
        px-3 py-4
        text-center
        font-sans text-sm
        text-mute
        ${className}
      `.trim()}
    >
      {children}
    </BaseCombobox.Empty>
  );
}

/**
 * Combobox group — groups related items under a label.
 */
function Group({ children, className = '' }: ComboboxGroupProps) {
  return (
    <BaseCombobox.Group className={className}>
      {children}
    </BaseCombobox.Group>
  );
}

/**
 * Combobox group label — non-interactive label for a group of items.
 */
function GroupLabel({ children, className = '' }: ComboboxGroupLabelProps) {
  return (
    <BaseCombobox.GroupLabel
      className={`
        px-3 py-1
        font-heading text-xs uppercase tracking-tight leading-none
        text-mute
        ${className}
      `.trim()}
    >
      {children}
    </BaseCombobox.GroupLabel>
  );
}

// ============================================================================
// Status — aria-live region for announcing result counts
// ============================================================================

interface ComboboxStatusProps {
  children?: React.ReactNode;
  className?: string;
}

function Status({ children, className = '' }: ComboboxStatusProps) {
  return (
    <BaseCombobox.Status className={className}>
      {children}
    </BaseCombobox.Status>
  );
}

// ============================================================================
// Re-export useFilter for convenience
// ============================================================================

const useComboboxFilter = BaseCombobox.useFilter;
export { useComboboxFilter };

// ============================================================================
// Export as namespace
// ============================================================================

export const Combobox = { Root, Input, Portal, Popup, Item, Empty, Group, GroupLabel, Status };
