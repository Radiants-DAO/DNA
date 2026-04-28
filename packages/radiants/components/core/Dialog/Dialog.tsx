'use client';

import React, { useState, useCallback } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { createCompoundContext } from '../../shared/createCompoundContext';
import { ModalShell, MODAL_TRIGGER_CLASS } from '../_shared/ModalShell';
import { PatternBackdrop } from '../_shared/PatternBackdrop';
import type { DialogProps } from './Dialog.meta';


// ============================================================================
// Types (root contract re-exported from ./Dialog.meta)
// ============================================================================

export type { DialogProps };


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
        className={MODAL_TRIGGER_CLASS}
        render={children}
      />
    );
  }

  return (
    <BaseDialog.Trigger className={MODAL_TRIGGER_CLASS}>
      {children}
    </BaseDialog.Trigger>
  );
}

// ============================================================================
// Content — Base UI handles portal, focus trap, escape key, scroll lock
// ============================================================================
//
// Structure (per audit 00-MASTER §3a):
//   BaseDialog.Popup (fullscreen centering group)
//     └── <div> — LOAD-BEARING: carries width + margin + animation state
//                 (group-data-[starting-style] / group-data-[ending-style]).
//                 Merged with the former inner card-div so the pixel-rounded
//                 surface + transition live on one element instead of two.
// ============================================================================

interface ContentProps {
  className?: string;
  children: React.ReactNode;
}

function Content({ className = '', children }: ContentProps): React.ReactNode {
  return (
    <BaseDialog.Portal>
      <PatternBackdrop as={BaseDialog.Backdrop} duration="base" />
      <BaseDialog.Popup
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
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

// ============================================================================
// Header, Title, Description, Body, Footer — shared ModalShell primitives
// Re-exported under the Dialog.* namespace so public API is unchanged.
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
    <ModalShell.Title as={BaseDialog.Title} className={className}>
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
    <ModalShell.Description as={BaseDialog.Description} className={className}>
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
      <BaseDialog.Close
        className={MODAL_TRIGGER_CLASS}
        render={children}
      />
    );
  }

  return (
    <BaseDialog.Close className={MODAL_TRIGGER_CLASS}>
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
