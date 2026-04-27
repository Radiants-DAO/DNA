'use client';

import React, { useState, useCallback } from 'react';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { createCompoundContext } from '../../shared/createCompoundContext';
import { ModalShell, MODAL_TRIGGER_CLASS } from '../_shared/ModalShell';
import { PatternBackdrop } from '../_shared/PatternBackdrop';

// ============================================================================
// Types
// ============================================================================

type DrawerDirection = 'bottom' | 'top' | 'left' | 'right';

/** Maps RDNA direction (where the drawer slides in FROM) to Base UI swipeDirection (how to dismiss). */
const directionToSwipe: Record<DrawerDirection, 'up' | 'down' | 'left' | 'right'> = {
  bottom: 'down',
  top: 'up',
  left: 'left',
  right: 'right',
};

interface DrawerState {
  open: boolean;
}

interface DrawerActions {
  setOpen: (open: boolean, eventDetails?: unknown) => void;
  close: () => void;
}

interface DrawerContextValue {
  state: DrawerState;
  actions: DrawerActions;
  direction: DrawerDirection;
}

// ============================================================================
// Context
// ============================================================================

const {
  Context: DrawerContext,
  useCompoundContext: useDrawerContext,
} = createCompoundContext<DrawerContextValue>('Drawer', {
  errorMessage: 'Drawer components must be used within Drawer.Provider',
});

// ============================================================================
// Provider — wraps Base UI Drawer.Root with controlled state
// ============================================================================

interface ProviderProps {
  state: DrawerState;
  actions: DrawerActions;
  /** Direction the drawer slides in from */
  direction?: DrawerDirection;
  children: React.ReactNode;
  onOpenChangeComplete?: (open: boolean) => void;
  actionsRef?: React.RefObject<{ close: () => void; unmount: () => void } | null>;
}

function Provider({ state, actions, direction = 'bottom', children, onOpenChangeComplete, actionsRef }: ProviderProps): React.ReactNode {
  return (
    <DrawerContext value={{ state, actions, direction }}>
      <BaseDrawer.Root
        open={state.open}
        onOpenChange={(open, eventDetails) => actions.setOpen(open, eventDetails)}
        onOpenChangeComplete={onOpenChangeComplete}
        actionsRef={actionsRef}
        swipeDirection={directionToSwipe[direction]}
      >
        {children}
      </BaseDrawer.Root>
    </DrawerContext>
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
      <BaseDrawer.Trigger
        className={MODAL_TRIGGER_CLASS}
        render={children}
      />
    );
  }

  return (
    <BaseDrawer.Trigger className={MODAL_TRIGGER_CLASS}>
      {children}
    </BaseDrawer.Trigger>
  );
}

// ============================================================================
// Content — Base UI Drawer handles portal, focus trap, swipe-to-dismiss
// ============================================================================
//
// Surface rules (audit F9, CLAUDE.md pixel-corners):
//   - `pixel-rounded-6` renders its visible border via `::after`, so a
//     `border-*` class would be clipped (rdna/no-pixel-border).
//   - Box-shadow on a clipped element is also masked, so we must use
//     `pixel-shadow-floating` instead of `shadow-floating`
//     (rdna/no-clipped-shadow).
// Duration token aligned with Sheet (`--duration-moderate`) per audit F10;
// previously drifted to raw `duration-200`.

// Each direction uses full literal class strings so Tailwind detects them at build time.
const directionStyles: Record<DrawerDirection, string> = {
  bottom: 'inset-x-0 bottom-0 w-full max-h-[85vh] pixel-rounded-6 translate-y-0 data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
  top:    'inset-x-0 top-0 w-full max-h-[85vh] pixel-rounded-6 translate-y-0 data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full',
  left:   'inset-y-0 left-0 h-full w-80 max-w-[90vw] pixel-rounded-6 translate-x-0 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
  right:  'inset-y-0 right-0 h-full w-80 max-w-[90vw] pixel-rounded-6 translate-x-0 data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
};

// Drag handle position styles per direction
const handleStyles: Record<DrawerDirection, string> = {
  bottom: 'mx-auto mt-3 mb-1 h-1 w-10',
  top:    'mx-auto mb-3 mt-1 h-1 w-10',
  left:   'my-auto ml-1 mr-3 w-1 h-10',
  right:  'my-auto mr-1 ml-3 w-1 h-10',
};

const handleContainerStyles: Record<DrawerDirection, string> = {
  bottom: 'flex justify-center',
  top:    'flex justify-center',
  left:   'flex items-center',
  right:  'flex items-center justify-end',
};

interface ContentProps {
  className?: string;
  /** Show a drag handle indicator */
  showHandle?: boolean;
  children: React.ReactNode;
}

function Content({ className = '', showHandle = true, children }: ContentProps): React.ReactNode {
  const { direction } = useDrawerContext();

  return (
    <BaseDrawer.Portal>
      <PatternBackdrop as={BaseDrawer.Backdrop} duration="moderate" />
      <BaseDrawer.Popup
        data-rdna="drawer"
        className={`
          fixed z-50
          ${directionStyles[direction]}
          bg-card
          pixel-shadow-floating
          transition-transform duration-[var(--duration-moderate)] ease-out
          ${className}
        `.trim()}
      >
        {showHandle && (
          <div className={handleContainerStyles[direction]}>
            <div className={`${handleStyles[direction]} rounded-full bg-rule`} />
          </div>
        )}
        {children}
      </BaseDrawer.Popup>
    </BaseDrawer.Portal>
  );
}

// ============================================================================
// Header, Title, Description, Body, Footer — shared ModalShell primitives
// Drawer header uses `compact` to preserve the `pt-4` (vs Dialog's `pt-6`).
// Drawer body is scrollable (flex-1 overflow-auto).
// ============================================================================

interface HeaderProps {
  className?: string;
  children: React.ReactNode;
}

function Header({ className = '', children }: HeaderProps): React.ReactNode {
  return <ModalShell.Header compact className={className}>{children}</ModalShell.Header>;
}

interface TitleProps {
  className?: string;
  children: React.ReactNode;
}

function Title({ className = '', children }: TitleProps): React.ReactNode {
  return (
    <ModalShell.Title as={BaseDrawer.Title} className={className}>
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
    <ModalShell.Description as={BaseDrawer.Description} className={className}>
      {children}
    </ModalShell.Description>
  );
}

interface BodyProps {
  className?: string;
  children: React.ReactNode;
}

function Body({ className = '', children }: BodyProps): React.ReactNode {
  return <ModalShell.Body scrollable className={className}>{children}</ModalShell.Body>;
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
      <BaseDrawer.Close
        className={MODAL_TRIGGER_CLASS}
        render={children}
      />
    );
  }

  return (
    <BaseDrawer.Close className={MODAL_TRIGGER_CLASS}>
      {children}
    </BaseDrawer.Close>
  );
}

// ============================================================================
// State hook
// ============================================================================

export function useDrawerState({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
} = {}): { state: DrawerState; actions: DrawerActions } {
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

export const Drawer = {
  Provider,
  Trigger,
  Content,
  Header,
  Title,
  Description,
  Body,
  Footer,
  Close,
  useDrawerState,
};
