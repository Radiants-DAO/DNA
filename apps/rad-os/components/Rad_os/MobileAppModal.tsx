'use client';

import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { CloseIcon } from '@/components/icons';

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

  if (!windowState?.isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-surface-primary flex flex-col"
      style={{ zIndex: 500 + (windowState.zIndex || 0) }}
    >
      {/* Header */}
      <header 
        className="
          flex items-center justify-between
          px-4 py-3
          bg-surface-primary
          border-b
          flex-shrink-0
        "
        style={{ borderBottomColor: 'var(--border-primary-20)' }}
      >
        <h1 className="font-joystix text-sm text-content-primary uppercase">
          {title}
        </h1>
        <button
          type="button"
          onClick={() => closeWindow(id)}
          className="
            w-11 h-11
            flex items-center justify-center
            hover:bg-hover-overlay active:bg-active-overlay
            rounded-sm
            -mr-2
          "
          aria-label={`Close ${title}`}
        >
          <CloseIcon size={16} className="text-content-primary" />
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

