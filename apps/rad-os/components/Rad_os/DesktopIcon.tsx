'use client';

import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { APP_REGISTRY } from '@/lib/constants';

// ============================================================================
// Types
// ============================================================================

export type IconVariant = 'list' | 'macos' | 'win95' | 'neon';

export const ICON_VARIANTS: IconVariant[] = ['list', 'macos', 'win95', 'neon'];

export const ICON_VARIANT_LABELS: Record<IconVariant, string> = {
  list: 'Radiants',
  macos: 'macOS',
  win95: 'Win95',
  neon: 'Neon',
};

interface DesktopIconProps {
  /** App ID for window management */
  appId: string;
  /** Display label */
  label: string;
  /** Icon React node */
  icon: React.ReactNode;
  /** Visual variant */
  variant?: IconVariant;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DesktopIcon({
  appId,
  label,
  icon,
  variant = 'list',
  className = '',
}: DesktopIconProps) {
  const { openWindow, isWindowOpen } = useWindowManager();

  const handleClick = () => {
    const config = APP_REGISTRY[appId as keyof typeof APP_REGISTRY];
    openWindow(appId, config?.defaultSize);
  };

  const isActive = isWindowOpen(appId);

  switch (variant) {
    // ──────────────────────────────────────────────────────────────────────
    // macOS Classic — vertical centered icon + label below, compact grid
    // ──────────────────────────────────────────────────────────────────────
    case 'macos':
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`
            flex flex-col items-center gap-0.5
            p-1 rounded-md w-16
            hover:bg-hover-overlay
            active:bg-edge-muted
            ${isActive ? 'bg-hover-overlay' : ''}
            ${className}
          `}
          title={label}
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-md bg-surface-secondary text-sun-yellow">
            {icon}
          </div>
          <span className={`
            font-joystix text-[8px] uppercase text-center
            leading-tight w-full
            ${isActive ? 'text-sun-yellow' : 'text-content-primary'}
          `}>
            {label}
          </span>
        </button>
      );

    // ──────────────────────────────────────────────────────────────────────
    // Windows 95 — thin beveled borders, flat system look
    // ──────────────────────────────────────────────────────────────────────
    case 'win95':
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`
            flex flex-row items-center gap-2
            px-1 py-px w-fit
            border
            ${isActive
              ? 'border-t-black/40 border-l-black/40 border-b-white/25 border-r-white/25'
              : 'border-t-white/25 border-l-white/25 border-b-black/40 border-r-black/40'
            }
            hover:bg-hover-overlay/30
            active:border-t-black/40 active:border-l-black/40
            active:border-b-white/25 active:border-r-white/25
            ${className}
          `}
          title={label}
        >
          <div className="w-8 h-8 flex items-center justify-center bg-surface-secondary text-sun-yellow">
            {icon}
          </div>
          <span className={`
            font-joystix text-xs uppercase tracking-wider whitespace-nowrap pr-2
            ${isActive ? 'text-sun-yellow' : 'text-content-primary'}
          `}>
            {label}
          </span>
        </button>
      );

    // ──────────────────────────────────────────────────────────────────────
    // Radiants Neon — circular icon with solid bg, glow on hover/active
    // ──────────────────────────────────────────────────────────────────────
    case 'neon':
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`
            group flex flex-row items-center gap-2
            rounded-sm w-fit
            hover:bg-hover-overlay/20
            active:bg-edge-muted
            ${isActive ? 'bg-hover-overlay/20' : ''}
            ${className}
          `}
          title={label}
        >
          <div className={`
            w-8 h-8 flex items-center justify-center
            rounded-full
            bg-surface-secondary text-sun-yellow
            border
            transition-shadow duration-200
            ${isActive
              ? 'border-sun-yellow shadow-[0_0_8px_rgba(252,225,132,0.5)]'
              : 'border-sun-yellow/50 group-hover:shadow-[0_0_6px_rgba(252,225,132,0.4)] group-hover:border-sun-yellow'
            }
          `}>
            {icon}
          </div>
          <span className={`
            font-joystix text-xs uppercase tracking-wider whitespace-nowrap pr-2
            ${isActive
              ? 'text-sun-yellow [text-shadow:0_0_6px_rgba(252,225,132,0.5)]'
              : 'text-content-primary group-hover:[text-shadow:0_0_4px_rgba(252,225,132,0.3)]'
            }
          `}>
            {label}
          </span>
        </button>
      );

    // ──────────────────────────────────────────────────────────────────────
    // Radiants List (default) — horizontal row, square icon box
    // ──────────────────────────────────────────────────────────────────────
    default:
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`
            flex flex-row items-center gap-2
            rounded-sm
            w-fit
            hover:bg-hover-overlay
            active:bg-edge-muted
            ${isActive ? 'bg-surface-secondary' : ''}
            ${className}
          `}
          title={label}
        >
          <div className="w-8 h-8 flex items-center justify-center bg-surface-secondary rounded-sm text-sun-yellow">
            {icon}
          </div>
          <span className={`
            font-joystix text-xs
            uppercase tracking-wider
            whitespace-nowrap
            pr-2
            ${isActive ? 'text-sun-yellow' : 'text-content-primary'}
          `}>
            {label}
          </span>
        </button>
      );
  }
}

export default DesktopIcon;
