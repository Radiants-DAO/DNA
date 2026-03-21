'use client';

import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { APP_REGISTRY } from '@/lib/constants';
import { Button, Tooltip } from '@rdna/radiants/components/core';

// ============================================================================
// Types
// ============================================================================

interface DesktopIconProps {
  /** App ID for window management */
  appId: string;
  /** Display label */
  label: string;
  /** Icon React node */
  icon: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Desktop icon that opens an app window on click
 *
 * Features:
 * - Single-click to open (matches reference)
 * - Horizontal layout with ghost IconButton + label
 * - Active state highlighting when window is open
 */
export function DesktopIcon({
  appId,
  label,
  icon,
  className = '',
}: DesktopIconProps) {
  const { openWindow, isWindowOpen } = useWindowManager();

  const handleClick = () => {
    const config = APP_REGISTRY[appId as keyof typeof APP_REGISTRY];
    openWindow(appId, config?.defaultSize);
  };

  const isActive = isWindowOpen(appId);

  return (
    <Tooltip content={label} position="top">
      <div onClick={handleClick} className={className}>
        <Button
          quiet
          size="md"
          iconOnly={true}
          icon={icon}
          active={isActive}
          aria-label={label}
        />
      </div>
    </Tooltip>
  );
}

export default DesktopIcon;
