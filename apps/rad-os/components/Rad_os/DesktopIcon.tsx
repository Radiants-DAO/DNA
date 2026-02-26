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
      <div className={[
        'w-8 h-8 flex items-center justify-center rounded-sm border transition-all duration-150',
        isActive
          ? 'bg-surface-secondary text-sun-yellow border-surface-secondary dark:bg-transparent dark:border-edge-focus dark:shadow-glow-md'
          : 'bg-surface-primary text-content-primary border-edge-primary group-hover:bg-surface-secondary group-hover:text-sun-yellow group-hover:border-surface-secondary dark:bg-transparent dark:border-edge-muted dark:group-hover:bg-transparent dark:group-hover:border-edge-focus dark:group-hover:shadow-glow-sm dark:group-hover:text-sun-yellow',
      ].join(' ')}>
        {icon}
      </div>

      {/* Label */}
      <span className={[
        'font-joystix text-sm uppercase tracking-wider whitespace-nowrap px-2 py-1 rounded-sm transition-all duration-150',
        isActive
          ? 'bg-surface-secondary text-sun-yellow dark:bg-transparent dark:text-sun-yellow'
          : 'text-content-primary group-hover:bg-surface-secondary group-hover:text-sun-yellow dark:group-hover:bg-transparent dark:group-hover:text-sun-yellow',
      ].join(' ')}>
        {label}
      </span>
    </button>
  );
}

export default DesktopIcon;
