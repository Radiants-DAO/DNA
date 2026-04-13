'use client';

import React from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';


// ============================================================================
// Types
// ============================================================================

interface ComboboxRootProps<V = string> {
  /** Children — should include Combobox.Input, Combobox.Portal, etc. */
  children: React.ReactNode;
  /** The controlled selected value */
  value?: V | null;
  /** Default selected value */
  defaultValue?: V | null;
  /** Callback when value changes */
  onValueChange?: (value: V | null) => void;
  /** Callback when the popup opens or closes — receives Base UI eventDetails as second arg */
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
  /** Callback when input value changes */
  onInputValueChange?: (inputValue: string) => void;
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
  value: any;
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
function Root<V = string>({
  children,
  value,
  defaultValue,
  onValueChange,
  onOpenChange,
  onInputValueChange,
  autoHighlight = true,
  disabled = false,
}: ComboboxRootProps<V>) {
  return (
    <BaseCombobox.Root
      data-rdna="combobox"
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (val: V | null) => onValueChange(val) : undefined}
      onOpenChange={onOpenChange ? (open, eventDetails) => onOpenChange(open, eventDetails) : undefined}
      onInputValueChange={onInputValueChange ? (val: string) => onInputValueChange(val) : undefined}
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
          pixel-rounded-xs w-full
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
        className="absolute inset-y-0 right-0 flex items-center pr-2 cursor-pointer z-10"
      >
        <BaseCombobox.Icon className="text-mute">
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
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
          transition-[opacity,transform] duration-150 ease-out
          data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1
          data-[ending-style]:opacity-0
        `.trim()}
      >
        <div className={`pixel-rounded-xs bg-card pixel-shadow-raised w-full ${className}`.trim()}>
          <BaseCombobox.List className="max-h-48 overflow-y-auto py-1">
            {children}
          </BaseCombobox.List>
        </div>
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
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
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
    <BaseCombobox.Status className={className || undefined}>
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

export default Combobox;
