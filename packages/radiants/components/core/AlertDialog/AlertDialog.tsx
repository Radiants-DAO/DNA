'use client';

import React, { createContext, use, useState, useCallback } from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';

// ============================================================================
// Types
// ============================================================================

interface AlertDialogState {
  open: boolean;
}

interface AlertDialogActions {
  setOpen: (open: boolean, eventDetails?: unknown) => void;
  close: () => void;
}

interface AlertDialogContextValue {
  state: AlertDialogState;
  actions: AlertDialogActions;
}

// ============================================================================
// Context
// ============================================================================

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(): AlertDialogContextValue {
  const context = use(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialog components must be used within AlertDialog.Provider');
  }
  return context;
}

// ============================================================================
// Provider — wraps Base UI AlertDialog.Root with controlled state
// ============================================================================

interface ProviderProps {
  state: AlertDialogState;
  actions: AlertDialogActions;
  children: React.ReactNode;
  onOpenChangeComplete?: (open: boolean) => void;
  actionsRef?: React.RefObject<{ close: () => void; unmount: () => void } | null>;
}

function Provider({ state, actions, children, onOpenChangeComplete, actionsRef }: ProviderProps): React.ReactNode {
  return (
    <AlertDialogContext value={{ state, actions }}>
      <BaseAlertDialog.Root
        data-rdna="alertdialog"
        open={state.open}
        onOpenChange={(open, eventDetails) => actions.setOpen(open, eventDetails)}
        onOpenChangeComplete={onOpenChangeComplete}
        actionsRef={actionsRef}
      >
        {children}
      </BaseAlertDialog.Root>
    </AlertDialogContext>
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
      <BaseAlertDialog.Trigger
        className="cursor-pointer focus-visible:outline-none"
        render={children}
      />
    );
  }

  return (
    <BaseAlertDialog.Trigger
      className="cursor-pointer focus-visible:outline-none"
    >
      {children}
    </BaseAlertDialog.Trigger>
  );
}

// ============================================================================
// Content — AlertDialog blocks interaction, no escape-to-close by default
// ============================================================================

interface ContentProps {
  className?: string;
  children: React.ReactNode;
}

function Content({ className = '', children }: ContentProps): React.ReactNode {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop
        className="fixed inset-0 z-50 bg-hover transition-opacity duration-150 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
      />
      <BaseAlertDialog.Popup
        className="group fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          className={`
            relative z-10
            w-full max-w-[32rem] mx-4
            bg-page
            rounded-sm
            pixel-shadow-floating
            transition-[opacity,transform,filter] duration-150 ease-out
            group-data-[starting-style]:opacity-0 group-data-[starting-style]:scale-95
            group-data-[ending-style]:opacity-0 group-data-[ending-style]:-translate-y-2 group-data-[ending-style]:blur-sm
            ${className}
          `.trim()}
        >
          {children}
        </div>
      </BaseAlertDialog.Popup>
    </BaseAlertDialog.Portal>
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
    <BaseAlertDialog.Title className={`font-heading text-base uppercase tracking-tight leading-none text-main text-balance ${className}`.trim()}>
      {children}
    </BaseAlertDialog.Title>
  );
}

interface DescriptionProps {
  className?: string;
  children: React.ReactNode;
}

function Description({ className = '', children }: DescriptionProps): React.ReactNode {
  return (
    <BaseAlertDialog.Description className={`font-sans text-base text-sub mt-2 text-pretty ${className}`.trim()}>
      {children}
    </BaseAlertDialog.Description>
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
      <BaseAlertDialog.Close
        className="cursor-pointer focus-visible:outline-none"
        render={children}
      />
    );
  }

  return (
    <BaseAlertDialog.Close
      className="cursor-pointer focus-visible:outline-none"
    >
      {children}
    </BaseAlertDialog.Close>
  );
}

// ============================================================================
// State hook
// ============================================================================

export function useAlertDialogState({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
} = {}): { state: AlertDialogState; actions: AlertDialogActions } {
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

// ============================================================================
// Export
// ============================================================================

export const AlertDialog = {
  Provider,
  Trigger,
  Content,
  Header,
  Title,
  Description,
  Body,
  Footer,
  Close,
  useAlertDialogState,
};

export default AlertDialog;
