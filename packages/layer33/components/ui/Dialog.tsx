'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeKey, useLockBodyScroll, useFocusTrap } from './hooks/useModalBehavior';

// ============================================================================
// Types
// ============================================================================

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// ============================================================================
// Context
// ============================================================================

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
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

export function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [isControlled, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

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
  const { setOpen } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }

  return (
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
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
  const { open, setOpen } = useDialogContext();
  const [mounted, setMounted] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEscapeKey(open, () => setOpen(false));

  // Prevent body scroll when open
  useLockBodyScroll(open);

  // Trap focus within dialog
  useFocusTrap(open, contentRef);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setOpen(false);
          }
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        className={`
          relative z-10
          w-full max-w-lg mx-4
          bg-white
          border-2 border-black
          rounded-none
          shadow-[4px_4px_0_0_var(--color-black)]
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
    <div className={`px-6 pt-6 pb-4 border-b border-neutral-neutral-3 ${className}`.trim()}>
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
    <h2 className={`font-alfacad text-xl uppercase text-black ${className}`.trim()}>
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
    <p className={`font-alfacad text-base text-black/70 mt-2 ${className}`.trim()}>
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
    <div className={`px-6 pb-6 pt-4 border-t border-neutral-neutral-3 flex justify-end gap-2 ${className}`.trim()}>
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
  const { setOpen } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(false),
    });
  }

  return (
    <button type="button" onClick={() => setOpen(false)} aria-label="Close dialog">
      {children}
    </button>
  );
}

export default Dialog;
