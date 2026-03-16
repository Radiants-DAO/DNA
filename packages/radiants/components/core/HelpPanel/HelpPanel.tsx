'use client';

import React, { useState, useCallback } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';

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
// Sub-components
// ============================================================================

function Provider({ state, actions, children }: ProviderProps): React.ReactNode {
  return (
    <BaseDialog.Root
      open={state.open}
      onOpenChange={(open) => { if (open) actions.open(); else actions.close(); }}
    >
      {children}
    </BaseDialog.Root>
  );
}

function Trigger({ children }: TriggerProps): React.ReactNode {
  if (React.isValidElement(children)) {
    return (
      <BaseDialog.Trigger
        className="inline-flex cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1"
        render={children as React.ReactElement}
      />
    );
  }
  return (
    <BaseDialog.Trigger className="inline-flex cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1">
      {children}
    </BaseDialog.Trigger>
  );
}

function Content({ children, title, className = '' }: ContentProps): React.ReactNode {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-hover" />
      <BaseDialog.Popup className="fixed inset-0 z-50 flex justify-end items-stretch">
        <div
          data-rdna="helppanel"
          className={`
            h-full w-full max-w-[56rem]
            bg-page
            border-l border-line
            shadow-floating
            flex flex-col
            animate-slide-in-right
            ${className}
          `}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            {title && (
              <BaseDialog.Title className="font-heading text-sm tracking-tight leading-none text-main uppercase text-balance">
                {title}
              </BaseDialog.Title>
            )}
            <BaseDialog.Close
              aria-label="Close help panel"
              className="text-mute hover:text-main p-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </BaseDialog.Close>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="font-sans text-base text-main space-y-4">
              {children}
            </div>
          </div>
        </div>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
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
