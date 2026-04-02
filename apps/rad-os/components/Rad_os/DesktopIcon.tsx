'use client';

import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
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
  const { openWindowWithZoom, isWindowOpen } = useWindowManager();

  const isActive = isWindowOpen(appId);

  return (
    <Tooltip content={label} position="top">
      <Button
        size="lg"
        iconOnly
        icon={icon}
        active={isActive}
        aria-label={label}
        onClick={(e: React.MouseEvent) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          openWindowWithZoom(appId, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
        }}
        className={className}
      />
    </Tooltip>
  );
}

export default DesktopIcon;
