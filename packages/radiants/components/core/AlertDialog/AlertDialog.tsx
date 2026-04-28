'use client';

import React, { useState, useCallback } from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { createCompoundContext } from '../../shared/createCompoundContext';
import { ModalShell, MODAL_TRIGGER_CLASS } from '../_shared/ModalShell';
import { PatternBackdrop } from '../_shared/PatternBackdrop';


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

const {
  Context: AlertDialogContext,
} = createCompoundContext<AlertDialogContextValue>('AlertDialog', {
  errorMessage: 'AlertDialog components must be used within AlertDialog.Provider',
});

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
        className={MODAL_TRIGGER_CLASS}
        render={children}
      />
    );
  }

  return (
    <BaseAlertDialog.Trigger className={MODAL_TRIGGER_CLASS}>
      {children}
    </BaseAlertDialog.Trigger>
  );
}

// ============================================================================
// Content — AlertDialog blocks interaction, no escape-to-close by default
// ============================================================================
//
// Structure (per audit 00-MASTER §3a): the intermediate animation wrapper is
// LOAD-BEARING — it's the `group-data-[starting-style]` target and carries
// width + margin. It now also owns the pixel-rounded surface (previously a
// separate inner card-div), saving one DOM node per open dialog.
// ============================================================================

interface ContentProps {
  className?: string;
  children: React.ReactNode;
}

function Content({ className = '', children }: ContentProps): React.ReactNode {
  return (
    <BaseAlertDialog.Portal>
      <PatternBackdrop as={BaseAlertDialog.Backdrop} duration="base" />
      <BaseAlertDialog.Popup
        className="group fixed inset-0 z-modals flex items-center justify-center"
      >
        <div
          className={`
            relative z-10
            w-full max-w-[32rem] mx-4
            pixel-rounded-6 bg-page pixel-shadow-floating
            transition-[opacity,transform,filter] duration-[var(--duration-base)] ease-out
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
// Header, Title, Description, Body, Footer — shared ModalShell primitives
// ============================================================================

interface HeaderProps {
  className?: string;
  children: React.ReactNode;
}

function Header({ className = '', children }: HeaderProps): React.ReactNode {
  return <ModalShell.Header className={className}>{children}</ModalShell.Header>;
}

interface TitleProps {
  className?: string;
  children: React.ReactNode;
}

function Title({ className = '', children }: TitleProps): React.ReactNode {
  return (
    <ModalShell.Title as={BaseAlertDialog.Title} className={className}>
      {children}
    </ModalShell.Title>
  );
}

interface DescriptionProps {
  className?: string;
  children: React.ReactNode;
}

function Description({ className = '', children }: DescriptionProps): React.ReactNode {
  return (
    <ModalShell.Description as={BaseAlertDialog.Description} className={className}>
      {children}
    </ModalShell.Description>
  );
}

interface BodyProps {
  className?: string;
  children: React.ReactNode;
}

function Body({ className = '', children }: BodyProps): React.ReactNode {
  return <ModalShell.Body className={className}>{children}</ModalShell.Body>;
}

interface FooterProps {
  className?: string;
  children: React.ReactNode;
}

function Footer({ className = '', children }: FooterProps): React.ReactNode {
  return <ModalShell.Footer className={className}>{children}</ModalShell.Footer>;
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
        className={MODAL_TRIGGER_CLASS}
        render={children}
      />
    );
  }

  return (
    <BaseAlertDialog.Close className={MODAL_TRIGGER_CLASS}>
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
