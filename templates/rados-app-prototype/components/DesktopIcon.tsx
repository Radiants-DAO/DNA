'use client';

import React from 'react';
import { useWindowManager } from '../hooks/useWindowManager';
import { Button, Tooltip } from '@rdna/radiants/components/core';

interface DesktopIconProps {
  appId: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
}

export function DesktopIcon({ appId, label, icon, className = '' }: DesktopIconProps) {
  const { openWindow, isWindowOpen } = useWindowManager();

  return (
    <Tooltip content={label} position="top">
      <Button
        quiet
        size="lg"
        iconOnly
        icon={icon}
        active={isWindowOpen(appId)}
        aria-label={label}
        onClick={() => openWindow(appId)}
        className={className}
      />
    </Tooltip>
  );
}
