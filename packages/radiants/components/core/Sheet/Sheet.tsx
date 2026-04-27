'use client';

import React, { useState, useCallback } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { createCompoundContext } from '../../shared/createCompoundContext';
import { ModalShell, MODAL_TRIGGER_CLASS } from '../_shared/ModalShell';
import { PatternBackdrop } from '../_shared/PatternBackdrop';

// ============================================================================
// Types
// ============================================================================

type SheetSide = 'left' | 'right' | 'top' | 'bottom';

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean, eventDetails?: unknown) => void;
  side: SheetSide;
}

// ============================================================================
// Context
// ============================================================================

const {
  Context: SheetContext,
  useCompoundContext: useSheetContext,
} = createCompoundContext<SheetContextValue>('Sheet', {
  errorMessage: 'Sheet components must be used within a Sheet',
});

// ============================================================================
// Sheet Root
// ============================================================================

interface SheetProps {
  /** Controlled open state */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Callback when open state changes — receives Base UI eventDetails as second arg */
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
  /** Callback fired after open/close animations complete */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Side to slide in from */
  side?: SheetSide;
  /** Children */
  children: React.ReactNode;
}

export function Sheet({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  side = 'right',
  children,
}: SheetProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback((newOpen: boolean, eventDetails?: unknown) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen, eventDetails);
  }, [isControlled, onOpenChange]);

  return (
    <SheetContext value={{ open, setOpen, side }}>
      <BaseDialog.Root
        data-rdna="sheet"
        open={open}
        onOpenChange={(newOpen, eventDetails) => setOpen(newOpen, eventDetails)}
        onOpenChangeComplete={onOpenChangeComplete}
      >
        {children}
      </BaseDialog.Root>
    </SheetContext>
  );
}

// ============================================================================
// Sheet Trigger
// ============================================================================

interface SheetTriggerProps {
  /** Trigger element */
  children: React.ReactElement;
  /** Pass through as child instead of wrapping */
  asChild?: boolean;
}

export function SheetTrigger({ children, asChild = false }: SheetTriggerProps) {
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
// Sheet Content
// ============================================================================

// Each side uses full literal class strings so Tailwind detects them at build time.
// Dynamic interpolation like `data-[starting-style]:${var}` breaks Tailwind's scanner.
const sideStyles: Record<SheetSide, string> = {
  left:   'inset-y-0 left-0  h-full w-80 max-w-[90vw] border-r translate-x-0 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
  right:  'inset-y-0 right-0 h-full w-80 max-w-[90vw] border-l translate-x-0 data-[starting-style]:translate-x-full  data-[ending-style]:translate-x-full',
  top:    'inset-x-0 top-0   w-full h-80 max-h-[90vh] border-b translate-y-0 data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full',
  bottom: 'inset-x-0 bottom-0 w-full h-80 max-h-[90vh] border-t translate-y-0 data-[starting-style]:translate-y-full  data-[ending-style]:translate-y-full',
};

interface SheetContentProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetContent({ className = '', children }: SheetContentProps) {
  const { side } = useSheetContext();

  return (
    <BaseDialog.Portal>
      <PatternBackdrop as={BaseDialog.Backdrop} duration="moderate" />
      <BaseDialog.Popup
        className={`
          fixed z-50
          ${sideStyles[side]}
          bg-page
          border-line
          shadow-floating
          transition-transform duration-[var(--duration-moderate)] ease-out
          ${className}
        `.trim()}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

// ============================================================================
// Sheet Header, Title, Description — shared ModalShell primitives
// ============================================================================

interface SheetHeaderProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetHeader({ className = '', children }: SheetHeaderProps) {
  return <ModalShell.Header className={className}>{children}</ModalShell.Header>;
}

interface SheetTitleProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetTitle({ className = '', children }: SheetTitleProps) {
  return (
    <ModalShell.Title as={BaseDialog.Title} className={className}>
      {children}
    </ModalShell.Title>
  );
}

interface SheetDescriptionProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetDescription({ className = '', children }: SheetDescriptionProps) {
  return (
    <ModalShell.Description as={BaseDialog.Description} className={className}>
      {children}
    </ModalShell.Description>
  );
}

// ============================================================================
// Sheet Body & Footer — shared ModalShell primitives (Body is scrollable)
// ============================================================================

interface SheetBodyProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetBody({ className = '', children }: SheetBodyProps) {
  return <ModalShell.Body scrollable className={className}>{children}</ModalShell.Body>;
}

interface SheetFooterProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetFooter({ className = '', children }: SheetFooterProps) {
  return <ModalShell.Footer className={className}>{children}</ModalShell.Footer>;
}

// ============================================================================
// Sheet Close
// ============================================================================

interface SheetCloseProps {
  /** Close button element */
  children: React.ReactElement;
  /** Pass through as child instead of wrapping */
  asChild?: boolean;
}

export function SheetClose({ children, asChild = false }: SheetCloseProps) {
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
