'use client';

import React, { createContext, use, useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface HelpPanelState {
  open: boolean;
}

interface HelpPanelActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

interface ProviderProps {
  state: HelpPanelState;
  actions: HelpPanelActions;
  children: React.ReactNode;
}

interface TriggerProps {
  children: React.ReactNode;
}

interface ContentProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

// ============================================================================
// Context
// ============================================================================

const HelpPanelContext = createContext<{
  state: HelpPanelState;
  actions: HelpPanelActions;
} | null>(null);

function useHelpPanelContext() {
  const ctx = use(HelpPanelContext);
  if (!ctx) throw new Error('HelpPanel components must be used within HelpPanel.Provider');
  return ctx;
}

// ============================================================================
// Sub-components
// ============================================================================

function Provider({ state, actions, children }: ProviderProps): React.ReactNode {
  return (
    <HelpPanelContext value={{ state, actions }}>
      {children}
    </HelpPanelContext>
  );
}

function Trigger({ children }: TriggerProps): React.ReactNode {
  const { actions } = useHelpPanelContext();
  return (
    <button onClick={actions.toggle} type="button">
      {children}
    </button>
  );
}

function Content({ children, title, className = '' }: ContentProps): React.ReactNode {
  const { state, actions } = useHelpPanelContext();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent): void {
      if (e.key === 'Escape' && state.open) actions.close();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [state.open, actions]);

  if (!state.open) return null;

  return (
    <div className="absolute inset-0 z-50 bg-surface-secondary/20 flex justify-center items-center">
      <div
        ref={panelRef}
        className={`
          h-full w-full max-w-[56rem]
          bg-surface-primary
          border border-edge-primary
          shadow-card-lg
          flex flex-col
          animate-slide-in-right
          ${className}
        `}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge-primary">
          {title && (
            <span className="font-heading text-xs text-content-primary uppercase">
              {title}
            </span>
          )}
          <button
            onClick={actions.close}
            className="text-content-muted hover:text-content-primary p-1"
            aria-label="Close help panel"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="font-sans text-base text-content-primary space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export function useHelpPanelState({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
} = {}): { state: HelpPanelState; actions: HelpPanelActions } {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return { state: { open: isOpen }, actions: { open, close, toggle } };
}

export const HelpPanel = { Provider, Trigger, Content, useHelpPanelState };

export default HelpPanel;
