'use client';

import React, { createContext, use, useState, useCallback, useEffect } from 'react';
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

function useDialogContext() {
  const context = use(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
}

// ============================================================================
// Dialog Root
// ============================================================================

interface DialogProps {
  /** Controlled open state */
  open?: boolean;
  /** Default open state for uncontrolled usage */
  defaultOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Children */
  children: React.ReactNode;
}

// ============================================================================
// DialogProvider (state management only)
// ============================================================================

interface DialogProviderProps {
  children: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
}

function DialogProvider({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: DialogProviderProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback((value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  }, [isControlled, onOpenChange]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  const contextValue: DialogContextValue = {
    state: { open },
    actions: { setOpen, close },
  };

  return (
    <DialogContext value={contextValue}>
      {children}
    </DialogContext>
  );
}

/**
 * Dialog — Convenience wrapper.
 * For full control, use Dialog.Provider separately.
 */
export const Dialog = Object.assign(
  function Dialog({
    open,
    defaultOpen = false,
    onOpenChange,
    children,
  }: DialogProps) {
    return (
      <DialogProvider open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        {children}
      </DialogProvider>
    );
  },
  {
    Provider: DialogProvider,
    Trigger: DialogTrigger,
    Content: DialogContent,
    Header: DialogHeader,
    Title: DialogTitle,
    Description: DialogDescription,
    Body: DialogBody,
    Footer: DialogFooter,
    Close: DialogClose,
  }
);

// ============================================================================
// Dialog Trigger
// ============================================================================

interface DialogTriggerProps {
  /** Trigger element */
  children: React.ReactElement;
  /** Pass through as child instead of wrapping */
  asChild?: boolean;
}

export function DialogTrigger({ children, asChild }: DialogTriggerProps) {
  const { actions: { setOpen } } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }

  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

// ============================================================================
// Dialog Portal & Overlay
// ============================================================================

interface DialogContentProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function DialogContent({ className = '', children }: DialogContentProps) {
  const { state: { open }, actions: { setOpen } } = useDialogContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEscapeKey(open, () => setOpen(false));

  // Prevent body scroll when open
  useLockBodyScroll(open);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-surface-secondary/50 animate-fadeIn"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        role="dialog"
        aria-modal="true"
        className={`
          relative z-10
          w-full max-w-lg mx-4
          bg-surface-primary
          border-2 border-edge-primary
          rounded-sm
          shadow-[4px_4px_0_0_var(--color-edge-primary)]
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
// Dialog Header, Title, Description
// ============================================================================

interface DialogHeaderProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function DialogHeader({ className = '', children }: DialogHeaderProps) {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-edge-primary/20 ${className}`.trim()}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function DialogTitle({ className = '', children }: DialogTitleProps) {
  return (
    <h2 className={`font-joystix text-base uppercase text-content-primary ${className}`.trim()}>
      {children}
    </h2>
  );
}

interface DialogDescriptionProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function DialogDescription({ className = '', children }: DialogDescriptionProps) {
  return (
    <p className={`font-mondwest text-base text-content-primary/70 mt-2 ${className}`.trim()}>
      {children}
    </p>
  );
}

// ============================================================================
// Dialog Body & Footer
// ============================================================================

interface DialogBodyProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function DialogBody({ className = '', children }: DialogBodyProps) {
  return (
    <div className={`px-6 py-4 ${className}`.trim()}>
      {children}
    </div>
  );
}

interface DialogFooterProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function DialogFooter({ className = '', children }: DialogFooterProps) {
  return (
    <div className={`px-6 pb-6 pt-4 border-t border-edge-primary/20 flex justify-end gap-2 ${className}`.trim()}>
      {children}
    </div>
  );
}

// ============================================================================
// Dialog Close
// ============================================================================

interface DialogCloseProps {
  /** Close button element */
  children: React.ReactElement;
  /** Pass through as child instead of wrapping */
  asChild?: boolean;
}

export function DialogClose({ children, asChild }: DialogCloseProps) {
  const { actions: { setOpen } } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(false),
    });
  }

  return (
    <button type="button" onClick={() => setOpen(false)}>
      {children}
    </button>
  );
}

export default Dialog;
