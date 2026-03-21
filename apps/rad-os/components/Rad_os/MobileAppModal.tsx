'use client';

import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { Button } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons';

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
      className="fixed inset-0 bg-page flex flex-col pointer-events-auto"
      style={{ zIndex: 500 + (windowState.zIndex || 0) }}
    >
      {/* Header */}
      <header 
        className="
          flex items-center justify-between
          px-4 py-3
          bg-page
          border-b
          flex-shrink-0
        "
        style={{ borderBottomColor: 'var(--color-rule)' }}
      >
        <span className="font-joystix text-sm text-main uppercase">
          {title}
        </span>
        <Button
          type="button"
          quiet
          size="sm"
          onClick={() => closeWindow(id)}
          className="
            w-11 h-11
            flex items-center justify-center
            hover:bg-hover active:bg-active
            pixel-rounded-sm
            -mr-2
          "
          aria-label={`Close ${title}`}
        >
          <Icon name="close" size={16} className="text-main" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto @container">
        {children}
      </main>
    </div>
  );
}

export default MobileAppModal;
