'use client';

import React, { createContext, use, useState, useCallback } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';

// ============================================================================
// Types
// ============================================================================

type SheetSide = 'left' | 'right' | 'top' | 'bottom';

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  side: SheetSide;
}

// ============================================================================
// Context
// ============================================================================

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = use(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used within a Sheet');
  }
  return context;
}

// ============================================================================
// Sheet Root
// ============================================================================

interface SheetProps {
  /** Controlled open state */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Side to slide in from */
  side?: SheetSide;
  /** Children */
  children: React.ReactNode;
}

export function Sheet({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  side = 'right',
  children,
}: SheetProps) {
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
    <SheetContext value={{ open, setOpen, side }}>
      <BaseDialog.Root
        open={open}
        onOpenChange={(newOpen) => setOpen(newOpen)}
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

export function SheetTrigger({ children }: SheetTriggerProps) {
  return (
    <BaseDialog.Trigger
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
      render={children}
    />
  );
}

// ============================================================================
// Sheet Content
// ============================================================================

const sideStyles: Record<SheetSide, { container: string; border: string }> = {
  left: {
    container: 'inset-y-0 left-0 h-full w-80 max-w-[90vw]',
    border: 'border-r',
  },
  right: {
    container: 'inset-y-0 right-0 h-full w-80 max-w-[90vw]',
    border: 'border-l',
  },
  top: {
    container: 'inset-x-0 top-0 w-full h-80 max-h-[90vh]',
    border: 'border-b',
  },
  bottom: {
    container: 'inset-x-0 bottom-0 w-full h-80 max-h-[90vh]',
    border: 'border-t',
  },
};

interface SheetContentProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetContent({ className = '', children }: SheetContentProps) {
  const { side } = useSheetContext();
  const styles = sideStyles[side];

  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        className="fixed inset-0 z-50 bg-surface-overlay-medium transition-opacity duration-200"
      />
      <BaseDialog.Popup
        className={`
          fixed z-50
          ${styles.container}
          bg-surface-primary
          border-edge-primary
          ${styles.border}
          shadow-floating
          transition-transform duration-200 ease-out
          ${className}
        `.trim()}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

// ============================================================================
// Sheet Header, Title, Description
// ============================================================================

interface SheetHeaderProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetHeader({ className = '', children }: SheetHeaderProps) {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-edge-muted ${className}`.trim()}>
      {children}
    </div>
  );
}

interface SheetTitleProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetTitle({ className = '', children }: SheetTitleProps) {
  return (
    <BaseDialog.Title className={`font-heading text-base uppercase text-content-primary ${className}`.trim()}>
      {children}
    </BaseDialog.Title>
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
    <BaseDialog.Description className={`font-sans text-base text-content-secondary mt-2 ${className}`.trim()}>
      {children}
    </BaseDialog.Description>
  );
}

// ============================================================================
// Sheet Body & Footer
// ============================================================================

interface SheetBodyProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetBody({ className = '', children }: SheetBodyProps) {
  return (
    <div className={`px-6 py-4 flex-1 overflow-auto ${className}`.trim()}>
      {children}
    </div>
  );
}

interface SheetFooterProps {
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function SheetFooter({ className = '', children }: SheetFooterProps) {
  return (
    <div className={`px-6 pb-6 pt-4 border-t border-edge-muted flex justify-end gap-2 ${className}`.trim()}>
      {children}
    </div>
  );
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

export function SheetClose({ children }: SheetCloseProps) {
  return (
    <BaseDialog.Close
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
      render={children}
    />
  );
}

export default Sheet;
