'use client';

import React, { useState, useCallback } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { createCompoundContext } from '../../shared/createCompoundContext';
import { PixelBorder } from '../PixelBorder';

// ============================================================================
// Types
// ============================================================================

interface DialogState {
  open: boolean;
}

interface DialogActions {
  setOpen: (open: boolean, eventDetails?: unknown) => void;
  close: () => void;
}

interface DialogContextValue {
  state: DialogState;
  actions: DialogActions;
}

// ============================================================================
// Context
// ============================================================================

const {
  Context: DialogContext,
} = createCompoundContext<DialogContextValue>('Dialog', {
  errorMessage: 'Dialog components must be used within Dialog.Provider',
});

// ============================================================================
// Provider — wraps Base UI Dialog.Root with controlled state
// ============================================================================

interface ProviderProps {
  state: DialogState;
  actions: DialogActions;
  children: React.ReactNode;
  /** Callback fired when the open state changes, including Base UI eventDetails */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Ref for imperative actions (close, unmount) */
  actionsRef?: React.RefObject<{ close: () => void; unmount: () => void } | null>;
}

function Provider({ state, actions, children, onOpenChangeComplete, actionsRef }: ProviderProps): React.ReactNode {
  return (
    <DialogContext value={{ state, actions }}>
      <BaseDialog.Root
        data-rdna="dialog"
        open={state.open}
        onOpenChange={(open, eventDetails) => actions.setOpen(open, eventDetails)}
        onOpenChangeComplete={onOpenChangeComplete}
        actionsRef={actionsRef}
      >
        {children}
      </BaseDialog.Root>
    </DialogContext>
  );
}

// ============================================================================
// Trigger
// ============================================================================

interface TriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

function Trigger({ children, asChild = false }: TriggerProps): React.ReactNode {
  if (asChild) {
    return (
      <BaseDialog.Trigger
        className="cursor-pointer focus-visible:outline-none"
        render={children}
      />
    );
  }

  return (
    <BaseDialog.Trigger
      className="cursor-pointer focus-visible:outline-none"
    >
      {children}
    </BaseDialog.Trigger>
  );
}

// ============================================================================
// Content — Base UI handles portal, focus trap, escape key, scroll lock
// ============================================================================

interface ContentProps {
  className?: string;
  children: React.ReactNode;
}

function Content({ className = '', children }: ContentProps): React.ReactNode {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        className="fixed inset-0 z-50 bg-hover transition-opacity duration-150 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
      />
      <BaseDialog.Popup
        className="group fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          className={`
            relative z-10
            w-full max-w-[32rem] mx-4
            transition-[opacity,transform,filter] duration-150 ease-out
            group-data-[starting-style]:opacity-0 group-data-[starting-style]:scale-95
            group-data-[ending-style]:opacity-0 group-data-[ending-style]:-translate-y-2 group-data-[ending-style]:blur-sm
          `.trim()}
        >
          <PixelBorder size="sm" shadow="4px 4px 0 var(--color-ink)">
            <div className={`bg-page ${className}`.trim()}>
              {children}
            </div>
          </PixelBorder>
        </div>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

// ============================================================================
// Header, Title, Description
// ============================================================================

interface HeaderProps {
  className?: string;
  children: React.ReactNode;
}

function Header({ className = '', children }: HeaderProps): React.ReactNode {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-rule ${className}`.trim()}>
      {children}
    </div>
  );
}

interface TitleProps {
  className?: string;
  children: React.ReactNode;
}

function Title({ className = '', children }: TitleProps): React.ReactNode {
  return (
    <BaseDialog.Title className={`font-heading text-base uppercase tracking-tight leading-none text-main text-balance ${className}`.trim()}>
      {children}
    </BaseDialog.Title>
  );
}

interface DescriptionProps {
  className?: string;
  children: React.ReactNode;
}

function Description({ className = '', children }: DescriptionProps): React.ReactNode {
  return (
    <BaseDialog.Description className={`font-sans text-base text-sub mt-2 text-pretty ${className}`.trim()}>
      {children}
    </BaseDialog.Description>
  );
}

// ============================================================================
// Body & Footer
// ============================================================================

interface BodyProps {
  className?: string;
  children: React.ReactNode;
}

function Body({ className = '', children }: BodyProps): React.ReactNode {
  return (
    <div className={`px-6 py-4 ${className}`.trim()}>
      {children}
    </div>
  );
}

interface FooterProps {
  className?: string;
  children: React.ReactNode;
}

function Footer({ className = '', children }: FooterProps): React.ReactNode {
  return (
    <div className={`px-6 pb-6 pt-4 border-t border-rule flex justify-end gap-2 ${className}`.trim()}>
      {children}
    </div>
  );
}

// ============================================================================
// Close
// ============================================================================

interface CloseProps {
  children: React.ReactElement;
  asChild?: boolean;
}

function Close({ children, asChild = false }: CloseProps): React.ReactNode {
  if (asChild) {
    return (
      <BaseDialog.Close
        className="cursor-pointer focus-visible:outline-none"
        render={children}
      />
    );
  }

  return (
    <BaseDialog.Close
      className="cursor-pointer focus-visible:outline-none"
    >
      {children}
    </BaseDialog.Close>
  );
}

// ============================================================================
// Export
// ============================================================================

export function useDialogState({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
} = {}): { state: DialogState; actions: DialogActions } {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback((value: boolean, eventDetails?: unknown) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value, eventDetails);
  }, [isControlled, onOpenChange]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  return { state: { open }, actions: { setOpen, close } };
}

export const Dialog = {
  Provider,
  Trigger,
  Content,
  Header,
  Title,
  Description,
  Body,
  Footer,
  Close,
  useDialogState,
};

export default Dialog;
