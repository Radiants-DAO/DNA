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
        group
        flex flex-row items-center ${isActive ? 'gap-2' : 'gap-1'}
        rounded-sm
        w-fit
        ${className}
      `}
      title={label}
    >
      {/* Icon Container */}
      <div className={`
        w-8 h-8 flex items-center justify-center
        rounded-sm
        ${isActive
          ? 'bg-surface-secondary text-sun-yellow dark:text-content-inverted group-hover:text-cream'
          : 'bg-surface-primary text-content-primary border border-edge-primary group-hover:bg-surface-secondary group-hover:text-sun-yellow dark:group-hover:text-content-inverted group-hover:border-surface-secondary'
        }
      `}>
        {icon}
      </div>

      {/* Label */}
      <span className={`
        font-joystix text-xs
        uppercase tracking-wider
        whitespace-nowrap
        px-2 py-1
        rounded-sm
        ${isActive
          ? 'bg-surface-secondary text-sun-yellow dark:text-content-inverted'
          : 'text-content-primary group-hover:bg-surface-secondary group-hover:text-sun-yellow dark:group-hover:text-content-inverted'
        }
      `}>
        {label}
      </span>
    </button>
  );
}

export default DesktopIcon;
