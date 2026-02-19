'use client';

import { createContext, use, useRef, useEffect, useState, useCallback, type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

interface SelectState {
  open: boolean;
  value: string;
}

interface SelectActions {
  setOpen: (v: boolean) => void;
  setValue: (v: string) => void;
}

interface SelectContext {
  state: SelectState;
  actions: SelectActions;
}

interface ProviderProps {
  state: SelectState;
  actions: SelectActions;
  children: ReactNode;
}

interface TriggerProps {
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

interface ContentProps {
  children: ReactNode;
  className?: string;
}

interface OptionProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// Context
// ============================================================================

const SelectCtx = createContext<SelectContext | null>(null);

function useSelectContext(): SelectContext {
  const ctx = use(SelectCtx);
  if (!ctx) throw new Error('Select compound components must be used within Select.Provider');
  return ctx;
}

// ============================================================================
// Components
// ============================================================================

function Provider({ state, actions, children }: ProviderProps): ReactNode {
  return (
    <SelectCtx value={{ state, actions }}>
      {children}
    </SelectCtx>
  );
}

function Trigger({
  placeholder = 'Select...',
  disabled = false,
  error = false,
  fullWidth = false,
  className = '',
  children,
}: TriggerProps): ReactNode {
  const { state, actions } = useSelectContext();

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-fit'} ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && actions.setOpen(!state.open)}
        disabled={disabled}
        className={`
          flex items-center justify-between gap-2
          w-full h-10 px-3
          font-mondwest text-base
          bg-surface-primary text-content-primary
          border rounded-sm
          ${error ? 'border-status-error' : 'border-edge-primary'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${state.open ? 'shadow-[0_3px_0_0_var(--color-edge-primary)] -translate-y-0.5' : 'shadow-[0_1px_0_0_var(--color-edge-primary)]'}
        `}
      >
        <span className={state.value ? 'text-content-primary' : 'text-content-primary/40'}>
          {children ?? (state.value || placeholder)}
        </span>
        <span className={`text-content-primary ${state.open ? 'rotate-180' : ''}`}>▼</span>
      </button>
    </div>
  );
}

function Content({ children, className = '' }: ContentProps): ReactNode {
  const { state, actions } = useSelectContext();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.open) return;

    function handleClickOutside(event: MouseEvent): void {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        actions.setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state.open, actions]);

  if (!state.open) return null;

  return (
    <div
      ref={contentRef}
      className={`
        absolute z-50 top-full left-0 right-0 mt-1
        bg-surface-primary
        border border-edge-primary
        rounded-sm
        shadow-[2px_2px_0_0_var(--color-edge-primary)]
        overflow-hidden
        ${className}
      `}
    >
      {children}
    </div>
  );
}

function Option({ value, children, disabled = false, className = '' }: OptionProps): ReactNode {
  const { state, actions } = useSelectContext();
  const isActive = state.value === value;

  return (
    <button
      type="button"
      onClick={() => !disabled && actions.setValue(value)}
      disabled={disabled}
      className={`
        w-full px-3 py-2
        font-mondwest text-base text-left
        ${isActive ? 'bg-action-primary text-action-secondary' : 'text-content-primary'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-action-primary/50 cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ============================================================================
// Export
// ============================================================================

export function useSelectState({
  defaultValue = '',
  value,
  onChange,
}: {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
} = {}): { state: SelectState; actions: SelectActions } {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const isControlled = value !== undefined;
  const actualValue = isControlled ? value : internalValue;

  const setValue = useCallback((v: string) => {
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
    setOpen(false);
  }, [isControlled, onChange]);

  return { state: { open, value: actualValue }, actions: { setOpen, setValue } };
}

export const Select = { Provider, Trigger, Content, Option, useSelectState };

export default Select;
