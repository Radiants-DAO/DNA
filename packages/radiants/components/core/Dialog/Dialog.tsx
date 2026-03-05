'use client';

import React, { createContext, use, useState, useCallback } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';

// ============================================================================
// Types
// ============================================================================

interface DialogState {
  open: boolean;
}

interface DialogActions {
  setOpen: (open: boolean) => void;
  close: () => void;
}

interface DialogContextValue {
  state: DialogState;
  actions: DialogActions;
}

// ============================================================================
// Context
// ============================================================================

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(): DialogContextValue {
  const context = use(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within Dialog.Provider');
  }
  return context;
}

// ============================================================================
// Provider — wraps Base UI Dialog.Root with controlled state
// ============================================================================

interface ProviderProps {
  state: DialogState;
  actions: DialogActions;
  children: React.ReactNode;
}

function Provider({ state, actions, children }: ProviderProps): React.ReactNode {
  return (
    <DialogContext value={{ state, actions }}>
      <BaseDialog.Root
        open={state.open}
        onOpenChange={(open) => actions.setOpen(open)}
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

function Trigger({ children }: TriggerProps): React.ReactNode {
  return (
    <BaseDialog.Trigger
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
      render={children}
    />
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
        className="fixed inset-0 z-50 bg-surface-overlay-medium animate-fadeIn"
      />
      <BaseDialog.Popup
        className={`
          fixed inset-0 z-50 flex items-center justify-center
        `.trim()}
      >
        <div
          className={`
            relative z-10
            w-full max-w-[32rem] mx-4
            bg-surface-primary
            border border-edge-primary
            rounded-sm
            shadow-floating
            animate-scaleIn
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
// Header, Title, Description
// ============================================================================

interface HeaderProps {
  className?: string;
  children: React.ReactNode;
}

function Header({ className = '', children }: HeaderProps): React.ReactNode {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-edge-muted ${className}`.trim()}>
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
    <BaseDialog.Title className={`font-heading text-base uppercase text-content-primary ${className}`.trim()}>
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
    <BaseDialog.Description className={`font-sans text-base text-content-secondary mt-2 ${className}`.trim()}>
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
    <div className={`px-6 pb-6 pt-4 border-t border-edge-muted flex justify-end gap-2 ${className}`.trim()}>
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

function Close({ children }: CloseProps): React.ReactNode {
  return (
    <BaseDialog.Close
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
      render={children}
    />
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
  onOpenChange?: (open: boolean) => void;
} = {}): { state: DialogState; actions: DialogActions } {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback((value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
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
