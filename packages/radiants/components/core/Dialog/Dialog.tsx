'use client';

import React, { createContext, use, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeKey, useLockBodyScroll } from '../../../hooks';

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
// Provider — thin DI passthrough, no internal state
// ============================================================================

interface ProviderProps {
  state: DialogState;
  actions: DialogActions;
  children: React.ReactNode;
}

function Provider({ state, actions, children }: ProviderProps): React.ReactNode {
  return (
    <DialogContext value={{ state, actions }}>
      {children}
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

function Trigger({ children, asChild }: TriggerProps): React.ReactNode {
  const { actions: { setOpen } } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
    >
      {children}
    </button>
  );
}

// ============================================================================
// Content — portal, overlay, escape key, scroll lock
// ============================================================================

interface ContentProps {
  className?: string;
  children: React.ReactNode;
}

function Content({ className = '', children }: ContentProps): React.ReactNode {
  const { state: { open }, actions: { setOpen } } = useDialogContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEscapeKey(open, () => setOpen(false));
  useLockBodyScroll(open);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-surface-overlay-medium animate-fadeIn"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
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
    </div>,
    document.body
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
    <h2 className={`font-heading text-base uppercase text-content-primary ${className}`.trim()}>
      {children}
    </h2>
  );
}

interface DescriptionProps {
  className?: string;
  children: React.ReactNode;
}

function Description({ className = '', children }: DescriptionProps): React.ReactNode {
  return (
    <p className={`font-sans text-base text-content-secondary mt-2 ${className}`.trim()}>
      {children}
    </p>
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

function Close({ children, asChild }: CloseProps): React.ReactNode {
  const { actions: { setOpen } } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(false),
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
    >
      {children}
    </button>
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
