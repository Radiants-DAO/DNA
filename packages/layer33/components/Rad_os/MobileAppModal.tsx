'use client';

import React, { useRef, useEffect } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { CloseIcon } from '@/components/icons';
import { useFocusTrap } from '@/components/ui/hooks/useModalBehavior';

// ============================================================================
// Types
// ============================================================================

interface MobileAppModalProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Full-screen modal for mobile app display
 * Replaces draggable windows on mobile devices
 */
export function MobileAppModal({ id, title, children }: MobileAppModalProps) {
  const { getWindowState, closeWindow } = useWindowManager();
  const windowState = getWindowState(id);
  const modalRef = useRef<HTMLDivElement>(null);
  const isOpen = windowState?.isOpen && !windowState?.isMinimized;

  // Focus trap
  useFocusTrap(!!isOpen, modalRef);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      className="fixed inset-0 z-[200] bg-white flex flex-col overscroll-contain"
      style={{ zIndex: windowState.zIndex + 100 }}
    >
      {/* Header */}
      <header 
        className="
          flex items-center justify-between
          px-4 py-3
          bg-white
          border-b
          flex-shrink-0
        "
        style={{ borderBottomColor: 'rgba(0, 0, 0, 0.2)' }}
      >
        <h1 id={`${id}-title`} className="font-space-mono text-sm text-primary uppercase">
          {title}
        </h1>
        <button
          type="button"
          onClick={() => closeWindow(id)}
          aria-label="Close"
          className="
            w-10 h-10
            flex items-center justify-center
            hover:bg-black/5 active:bg-black/10
            rounded-sm
            -mr-2
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green
          "
        >
          <CloseIcon size={14} className="text-primary" aria-hidden="true" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default MobileAppModal;

