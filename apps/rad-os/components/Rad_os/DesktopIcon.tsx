'use client';

import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { APP_REGISTRY } from '@/lib/constants';

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
 * - Horizontal layout with bordered icon container
 * - Matches reference implementation styling
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
    <button
      type="button"
      onClick={handleClick}
      className={`
        flex flex-row items-center gap-2
        rounded-sm
        w-fit
        hover:bg-black/10
        active:bg-black/20
        ${isActive ? 'bg-black' : ''}
        ${className}
      `}
      title={label}
    >
      {/* Icon Container */}
      <div className={`
        w-8 h-8 flex items-center justify-center
        bg-black rounded-sm
        text-sun-yellow
      `}>
        {icon}
      </div>

      {/* Label */}
      <span className={`
        font-joystix text-xs
        uppercase tracking-wider
        whitespace-nowrap
        pr-2
        ${isActive ? 'text-sun-yellow' : 'text-primary'}
      `}>
        {label}
      </span>
    </button>
  );
}

export default DesktopIcon;
