'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { cva } from 'class-variance-authority';
import { Icon as BitmapIcon } from '../../../icons/Icon';


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

interface ProviderProps {
  state: SelectState;
  actions: SelectActions;
  children: ReactNode;
  /** Form field name for submission */
  name?: string;
}

type SelectSize = 'sm' | 'md' | 'lg';

interface TriggerProps {
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  size?: SelectSize;
  className?: string;
  children?: ReactNode;
  /** Custom chevron icon slot */
  chevron?: ReactNode;
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
// Default Chevron — delegates to RDNA bitmap Icon (16px only)
// ============================================================================

function DefaultChevron({ className = '' }: { className?: string }) {
  return <BitmapIcon name="chevron-down" size={16} className={className} />;
}

// ============================================================================
// CVA Variants
// ============================================================================

export const selectTriggerVariants = cva(
  `flex items-center w-full
   font-sans
   focus-visible:outline-none
   disabled:bg-depth disabled:text-mute disabled:cursor-not-allowed cursor-pointer`,
  {
    variants: {
      size: {
        sm: 'h-6 px-2 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
      },
      error: {
        true: '',
        false: '',
      },
      open: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
      open: false,
    },
  }
);

// ============================================================================
// Components
// ============================================================================

function Provider({ state, actions, children, name }: ProviderProps): ReactNode {
  return (
    <BaseSelect.Root
      data-rdna="select"
      value={state.value || null}
      onValueChange={(val) => {
        if (val !== null) {
          actions.setValue(val as string);
        }
      }}
      open={state.open}
      onOpenChange={(open) => actions.setOpen(open)}
      name={name}
      modal={false}
    >
      {children}
    </BaseSelect.Root>
  );
}

function Trigger({
  placeholder = 'Select...',
  disabled = false,
  error = false,
  fullWidth = false,
  size = 'md',
  className = '',
  children,
  chevron,
}: TriggerProps): ReactNode {
  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-fit'}`}>
      <BaseSelect.Trigger
        disabled={disabled}
        data-variant="select"
        data-size={size}
        render={(props) => {
          const isOpen = props['aria-expanded'] === true || props['aria-expanded'] === 'true';
          const classes = selectTriggerVariants({
            size,
            error,
            open: isOpen,
            className: `pixel-rounded-4 ${fullWidth ? 'w-full' : ''} ${error ? 'pixel-border-danger' : ''} ${className}`.trim(),
          });

          return (
            <button
              {...props}
              type="button"
              className={classes}
              data-slot="select-trigger"
              data-variant="select"
              data-size={size}
              data-open={isOpen ? 'true' : 'false'}
              data-state={isOpen ? 'open' : 'closed'}
              data-invalid={error ? 'true' : 'false'}
            >
              {children ?? (
                <BaseSelect.Value
                  placeholder={placeholder}
                  className="text-main data-[placeholder]:text-mute"
                />
              )}
              <span className="flex-1 h-px bg-line" />
              <span className={`shrink-0 text-main ${isOpen ? 'rotate-180' : ''}`}>
                {chevron || <DefaultChevron />}
              </span>
            </button>
          );
        }}
      />
    </div>
  );
}

function Content({ children, className = '' }: ContentProps): ReactNode {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner className="z-menus">
        <BaseSelect.Popup
          className={`z-menus py-1 pixel-rounded-4 bg-page pixel-shadow-raised ${className}`.trim()}
        >
          {children}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

function Option({ value, children, disabled = false, className = '' }: OptionProps): ReactNode {
  return (
    <BaseSelect.Item
      value={value}
      disabled={disabled}
      className={`
        w-full px-3 py-2
        font-sans text-sm text-left
        text-main
        ${disabled ? 'cursor-not-allowed text-mute' : 'hover:bg-accent hover:text-accent-inv cursor-pointer'}
        focus-visible:outline-none
        data-[selected]:bg-accent data-[selected]:text-accent-inv
        ${className}
      `}
    >
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
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
