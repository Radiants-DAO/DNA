'use client';

import React, { createContext, use, useState, useCallback } from 'react';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';

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

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(): DrawerContextValue {
  const context = use(DrawerContext);
  if (!context) {
    throw new Error('Drawer components must be used within Drawer.Provider');
  }
  return context;
}

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
        className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
        render={children}
      />
    );
  }

  return (
    <BaseDrawer.Trigger
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
    >
      {children}
    </BaseDrawer.Trigger>
  );
}

// ============================================================================
// Content — Base UI Drawer handles portal, focus trap, swipe-to-dismiss
// ============================================================================

// Each direction uses full literal class strings so Tailwind detects them at build time.
const directionStyles: Record<DrawerDirection, string> = {
  bottom: 'inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-sm translate-y-0 data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
  top:    'inset-x-0 top-0 w-full max-h-[85vh] rounded-b-sm translate-y-0 data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full',
  left:   'inset-y-0 left-0 h-full w-80 max-w-[90vw] rounded-r-sm translate-x-0 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
  right:  'inset-y-0 right-0 h-full w-80 max-w-[90vw] rounded-l-sm translate-x-0 data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
};

// Drag handle position styles per direction
const handleStyles: Record<DrawerDirection, string> = {
  bottom: 'mx-auto mt-3 mb-1 h-1 w-10',
  top:    'mx-auto mb-3 mt-1 h-1 w-10',
  left:   'my-auto ml-1 mr-3 w-1 h-10',
  right:  'my-auto mr-1 ml-3 w-1 h-10',
};

// Handle container layout per direction
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
      <BaseDrawer.Backdrop
        className="fixed inset-0 z-50 bg-surface-overlay-medium transition-opacity duration-200 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
      />
      <BaseDrawer.Popup
        data-rdna="drawer"
        className={`
          fixed z-50
          ${directionStyles[direction]}
          bg-surface-elevated
          border border-edge-primary
          shadow-floating
          transition-transform duration-200 ease-out
          ${className}
        `.trim()}
      >
        {showHandle && (
          <div className={handleContainerStyles[direction]}>
            <div className={`${handleStyles[direction]} rounded-full bg-edge-muted`} />
          </div>
        )}
        {children}
      </BaseDrawer.Popup>
    </BaseDrawer.Portal>
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
    <div className={`px-6 pt-4 pb-4 border-b border-edge-muted ${className}`.trim()}>
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
    <BaseDrawer.Title className={`font-heading text-base uppercase tracking-tight leading-none text-content-primary text-balance ${className}`.trim()}>
      {children}
    </BaseDrawer.Title>
  );
}

interface DescriptionProps {
  className?: string;
  children: React.ReactNode;
}

function Description({ className = '', children }: DescriptionProps): React.ReactNode {
  return (
    <BaseDrawer.Description className={`font-sans text-base text-content-secondary mt-2 text-pretty ${className}`.trim()}>
      {children}
    </BaseDrawer.Description>
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
    <div className={`px-6 py-4 flex-1 overflow-auto ${className}`.trim()}>
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

function Close({ children, asChild = false }: CloseProps): React.ReactNode {
  if (asChild) {
    return (
      <BaseDrawer.Close
        className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
        render={children}
      />
    );
  }

  return (
    <BaseDrawer.Close
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
    >
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

export default Drawer;
