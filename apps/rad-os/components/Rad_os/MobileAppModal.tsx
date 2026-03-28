'use client';

import React from 'react';
import { AppWindow as CoreAppWindow } from '@rdna/radiants/components/core';
import { useWindowManager } from '@/hooks/useWindowManager';

interface MobileAppModalProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function MobileAppModal({ id, title, children }: MobileAppModalProps) {
  const { getWindowState, closeWindow } = useWindowManager();
  const windowState = getWindowState(id);

  return (
    <CoreAppWindow
      id={id}
      title={title}
      open={windowState?.isOpen ?? false}
      presentation="mobile"
      zIndex={500 + (windowState?.zIndex ?? 0)}
      onClose={() => closeWindow(id)}
    >
      {children}
    </CoreAppWindow>
  );
}

export default MobileAppModal;
