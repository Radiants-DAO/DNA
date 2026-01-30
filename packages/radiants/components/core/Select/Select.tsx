'use client';

import React, { createContext, use, useState, useRef, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  /** @deprecated Use Select.Provider + Select.Option compound pattern instead */
  options: SelectOption[];
  /** Currently selected value */
  value?: string;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Custom select/dropdown with retro styling
 */
export function Select({
  options,
  value,
  placeholder = 'Select...',
  onChange,
  disabled = false,
  error = false,
  fullWidth = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? 'w-full' : 'w-fit'} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between gap-2
          w-full h-10 px-3
          font-mondwest text-base
          bg-surface-primary text-content-primary
          border rounded-sm
          ${error ? 'border-status-error' : 'border-edge-primary'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'shadow-[0_3px_0_0_var(--color-edge-primary)] -translate-y-0.5' : 'shadow-[0_1px_0_0_var(--color-edge-primary)]'}
        `}
      >
        <span className={selectedOption ? 'text-content-primary' : 'text-content-primary/40'}>
          {selectedOption?.label || placeholder}
        </span>
        <span className={`text-content-primary ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute z-50 top-full left-0 right-0 mt-1
            bg-surface-primary
            border border-edge-primary
            rounded-sm
            shadow-[2px_2px_0_0_var(--color-edge-primary)]
            overflow-hidden
          `}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => !option.disabled && handleSelect(option.value)}
              disabled={option.disabled}
              className={`
                w-full px-3 py-2
                font-mondwest text-base text-left
                ${option.value === value ? 'bg-action-primary text-content-primary' : 'text-content-primary'}
                ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-action-primary cursor-pointer'}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Compound Pattern — Provider / Trigger / Content / Option
// ============================================================================

const SelectContext = createContext<{
  state: { open: boolean; value: string };
  actions: { setOpen: (v: boolean) => void; setValue: (v: string) => void };
} | null>(null);

function useSelectContext() {
  const ctx = use(SelectContext);
  if (!ctx) throw new Error('Select compound components must be used within Select.Provider');
  return ctx;
}

function SelectProvider({ children, value, onChange, defaultValue = '' }: {
  children: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const isControlled = value !== undefined;
  const actualValue = isControlled ? value : internalValue;

  const setValue = useCallback((v: string) => {
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
    setOpen(false);
  }, [isControlled, onChange]);

  return (
    <SelectContext value={{
      state: { open, value: actualValue },
      actions: { setOpen, setValue },
    }}>
      {children}
    </SelectContext>
  );
}

function SelectTrigger({ children, placeholder, className = '' }: {
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
}) {
  const { state, actions } = useSelectContext();
  return (
    <button
      type="button"
      onClick={() => actions.setOpen(!state.open)}
      className={`flex items-center justify-between w-full px-3 h-10 rounded-sm border border-edge-primary bg-surface-primary text-sm ${className}`}
    >
      <span>{children || state.value || placeholder || 'Select...'}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

function SelectContent({ children, className = '' }: {
  children: React.ReactNode;
  className?: string;
}) {
  const { state } = useSelectContext();
  if (!state.open) return null;
  return (
    <div className={`absolute top-full left-0 right-0 mt-1 border border-edge-primary bg-surface-primary rounded-sm shadow-card z-50 ${className}`}>
      {children}
    </div>
  );
}

function SelectOptionCompound({ value, children, disabled, className = '' }: {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const { state, actions } = useSelectContext();
  const isActive = state.value === value;

  return (
    <button
      type="button"
      onClick={() => !disabled && actions.setValue(value)}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-action-primary/10 ${isActive ? 'bg-action-primary text-content-inverted' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

// Attach sub-components for compound pattern
Select.Provider = SelectProvider;
Select.Trigger = SelectTrigger;
Select.Content = SelectContent;
Select.Option = SelectOptionCompound;

export default Select;
